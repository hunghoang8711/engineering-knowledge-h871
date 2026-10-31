// H871 queue worker: submit one Gemini background interaction or poll an existing one.
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY,
// GEMINI_MODEL, H871_QUEUE_WORKER_SECRET. Never expose these values to the browser.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clean, parseModelJson, strings } from "./analysis-result.ts";
import { isProjectDocumentPath } from "./storage-path.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://hunghoang8711.github.io",
  "Access-Control-Allow-Headers": "content-type, x-h871-worker-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3 * 8192) {
    const part = bytes.subarray(i, Math.min(i + 3 * 8192, bytes.length));
    let binary = "";
    for (let j = 0; j < part.length; j += 0x3fff) {
      binary += String.fromCharCode(...part.subarray(j, Math.min(j + 0x3fff, part.length)));
    }
    out += btoa(binary);
  }
  return out;
}
function safeLog(stage: string, fields: Record<string, string | number | boolean> = {}) {
  console.info(JSON.stringify({ function: "process-analysis-queue", stage, ...fields }));
}
async function fetchJson(url: string, key: string, init: RequestInit = {}, timeoutMs = 25_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": key, ...(init.headers || {}) },
    });
    const body = await response.text();
    let data: any = null;
    try { data = body ? JSON.parse(body) : null; } catch { /* handled below */ }
    return { response, data, body: body.slice(0, 1500) };
  } finally {
    clearTimeout(timer);
  }
}
function modelOutput(interaction: any): string {
  const steps = Array.isArray(interaction?.steps) ? interaction.steps : [];
  return steps
    .filter((step: any) => step?.type === "model_output")
    .flatMap((step: any) => Array.isArray(step.content) ? step.content : [])
    .filter((part: any) => part?.type === "text" && typeof part.text === "string")
    .map((part: any) => part.text)
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const secret = Deno.env.get("H871_QUEUE_WORKER_SECRET") || "";
  if (secret.length < 32 || req.headers.get("x-h871-worker-secret") !== secret) {
    return json({ error: "WORKER_AUTHENTICATION_FAILED" }, 401);
  }
  if (Deno.env.get("H871_GEMINI_DATA_PROCESSING_APPROVED") !== "true") {
    return json({ error: "AI_DATA_PROCESSING_NOT_APPROVED" }, 503);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const model = Deno.env.get("GEMINI_MODEL");
  if (!url || !serviceKey || !geminiKey || !model) {
    return json({ error: "WORKER_CONFIGURATION_INCOMPLETE" }, 503);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: claimed, error: claimError } = await admin.rpc(
    "claim_project_ai_analysis_job", { p_lease_seconds: 180 },
  );
  if (claimError) {
    safeLog("claim_failed", {
      code: claimError.code || "UNKNOWN",
      message: (claimError.message || "UNKNOWN_ERROR").slice(0, 160),
    });
    return json({ error: "QUEUE_CLAIM_FAILED" }, 503);
  }
  const job = Array.isArray(claimed) ? claimed[0] : null;
  if (!job) return json({ status: "idle" });

  const jobId = String(job.job_id);
  const leaseToken = String(job.lease_token);
  const finish = async (
    status: "succeeded" | "failed" | "quota_exhausted",
    result: Record<string, unknown> | null,
    errorCode: string | null,
    errorMessage: string | null,
    retryDelay: number,
  ) => {
    const { data, error } = await admin.rpc("finish_project_ai_analysis_job", {
      p_job_id: jobId, p_lease_token: leaseToken, p_status: status,
      p_result: result, p_error_code: errorCode, p_error_message: errorMessage,
      p_retry_delay_seconds: retryDelay,
    });
    if (error) throw new Error("JOB_FINALIZATION_FAILED");
    return data;
  };
  const defer = async (interactionId: string, providerStatus: string) => {
    const { data, error } = await admin.rpc("defer_gemini_interaction_job", {
      p_job_id: jobId, p_lease_token: leaseToken,
      p_interaction_id: interactionId, p_provider_status: providerStatus,
      p_delay_seconds: 300,
    });
    if (error) throw new Error("INTERACTION_DEFER_FAILED");
    return data;
  };

  try {
    // Read the durable provider state after claim. Polling never downloads or resends the PDF.
    const { data: jobState, error: stateError } = await admin.from("project_ai_analysis_jobs")
      .select("gemini_interaction_id,gemini_submission_started_at,gemini_poll_count")
      .eq("id", jobId).maybeSingle();
    if (stateError || !jobState) throw new Error("JOB_STATE_LOOKUP_FAILED");

    const interactionId = jobState.gemini_interaction_id
      ? String(jobState.gemini_interaction_id) : "";

    if (interactionId) {
      const started = Date.now();
      const result = await fetchJson(
        `https://generativelanguage.googleapis.com/v1beta/interactions/${encodeURIComponent(interactionId)}`,
        geminiKey, { method: "GET" }, 25_000,
      );
      safeLog("gemini_poll_response", {
        httpStatus: result.response.status,
        elapsedMs: Date.now() - started,
        pollCount: Number(jobState.gemini_poll_count) || 0,
      });
      if (!result.response.ok || !result.data) {
        // A failed GET does not create a new model request. Keep the same ID and poll later.
        if (result.response.status === 404 || result.response.status === 410) {
          await finish("failed", null, "GEMINI_INTERACTION_NOT_FOUND",
            "The stored Gemini interaction is no longer available.", 0);
          return json({ jobId, status: "failed", error: "GEMINI_INTERACTION_NOT_FOUND" });
        }
        await defer(interactionId, "in_progress");
        return json({ jobId, status: "queued", poll: "deferred" }, 202);
      }

      const providerStatus = String(result.data.status || "");
      if (providerStatus === "in_progress") {
        await defer(interactionId, "in_progress");
        safeLog("gemini_still_processing", { pollCount: Number(jobState.gemini_poll_count) || 0 });
        return json({ jobId, status: "queued", providerStatus }, 202);
      }
      if (providerStatus === "failed" || providerStatus === "cancelled" ||
          providerStatus === "incomplete" || providerStatus === "requires_action" ||
          providerStatus === "requires_continuation") {
        await finish("failed", null, `GEMINI_INTERACTION_${providerStatus.toUpperCase()}`,
          `Gemini interaction ended with status: ${providerStatus}.`, 0);
        return json({ jobId, status: "failed", providerStatus });
      }
      if (providerStatus !== "completed") {
        await defer(interactionId, "in_progress");
        return json({ jobId, status: "queued", providerStatus: "unknown_waiting" }, 202);
      }

      const output = modelOutput(result.data);
      if (!output) throw new Error("MODEL_OUTPUT_EMPTY");
      const parsed = parseModelJson(output);
      const analysis = {
        summary: clean(parsed.summary),
        technical_scope: clean(parsed.technical_scope),
        key_equipment: strings(parsed.key_equipment),
        requirements: strings(parsed.requirements),
        risks: strings(parsed.risks),
        open_questions: strings(parsed.open_questions),
        suggested_tags: strings(parsed.suggested_tags, 30),
        source_references: Array.isArray(parsed.source_references)
          ? parsed.source_references.filter((x: unknown) => x && typeof x === "object").slice(0, 80)
          : [],
      };
      if (!analysis.summary) throw new Error("MODEL_OUTPUT_MISSING_SUMMARY");
      const finalStatus = await finish("succeeded", analysis, null, null, 0);
      safeLog("job_succeeded", { pollCount: Number(jobState.gemini_poll_count) || 0 });
      return json({ jobId, status: finalStatus });
    }

    // A previous worker crossed the external-submit boundary but did not persist
    // the returned ID. Never submit again: the provider may already be processing it.
    if (jobState.gemini_submission_started_at) {
      await finish("failed", null, "GEMINI_SUBMISSION_UNKNOWN",
        "Gemini submission may have succeeded, but its Interaction ID was not saved. Manual reconciliation is required; the PDF was not resubmitted.", 0);
      safeLog("gemini_submission_unknown");
      return json({ jobId, status: "failed", error: "GEMINI_SUBMISSION_UNKNOWN" });
    }

    const { data: doc, error: docError } = await admin.from("documents")
      .select("id,project_id,title,original_filename,file_type,relative_path")
      .eq("id", job.document_id).maybeSingle();
    if (docError || !doc || doc.project_id !== job.project_id) {
      await finish("failed", null, "DOCUMENT_LOOKUP_FAILED", "The queued document could not be verified.", 0);
      return json({ jobId, status: "failed", error: "DOCUMENT_LOOKUP_FAILED" });
    }
    const { data: project, error: projectError } = await admin.from("projects")
      .select("id,name,code").eq("id", job.project_id).maybeSingle();
    if (projectError || !project) {
      await finish("failed", null, "PROJECT_LOOKUP_FAILED", "The project could not be loaded.", 0);
      return json({ jobId, status: "failed", error: "PROJECT_LOOKUP_FAILED" });
    }

    const fileType = String(doc.file_type || "").trim().toLowerCase();
    const fileName = String(doc.original_filename || doc.title || "").trim().toLowerCase();
    if (!(fileType === "pdf" || fileType === "application/pdf" || fileName.endsWith(".pdf"))) {
      await finish("failed", null, "UNSUPPORTED_FILE_TYPE", "Only PDF is supported.", 0);
      return json({ jobId, status: "failed", error: "UNSUPPORTED_FILE_TYPE" });
    }
    const path = clean(doc.relative_path, 1000);
    if (!isProjectDocumentPath(path, String(job.project_id))) {
      await finish("failed", null, "INVALID_STORAGE_PATH", "The stored document path is invalid.", 0);
      return json({ jobId, status: "failed", error: "INVALID_STORAGE_PATH" });
    }

    const MAX_BYTES = 5 * 1024 * 1024;
    const { data: storedSize, error: objectError } = await admin.rpc(
      "get_h871_project_document_size", { p_name: path },
    );
    const metadataSize = Number(storedSize);
    if (objectError || storedSize === null || !Number.isSafeInteger(metadataSize) ||
        metadataSize <= 0 || metadataSize > MAX_BYTES) {
      await finish("failed", null, "FILE_SIZE_OUT_OF_RANGE",
        "The PDF metadata is unavailable or the file exceeds the 5 MiB processing limit.", 0);
      return json({ jobId, status: "failed", error: "FILE_SIZE_OUT_OF_RANGE" });
    }
    const { data: blob, error: downloadError } = await admin.storage
      .from("h871-project-documents").download(path);
    if (downloadError || !blob || blob.size <= 0 || blob.size > MAX_BYTES) {
      await finish("failed", null, "PRIVATE_FILE_DOWNLOAD_FAILED",
        "The private PDF could not be downloaded or is outside the size limit.", 0);
      return json({ jobId, status: "failed", error: "PRIVATE_FILE_DOWNLOAD_FAILED" });
    }

    const { data: marked, error: markError } = await admin.rpc(
      "mark_gemini_interaction_submission_started",
      { p_job_id: jobId, p_lease_token: leaseToken },
    );
    if (markError || marked !== true) throw new Error("GEMINI_SUBMISSION_GUARD_FAILED");

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const prompt = `Bạn là chuyên gia phân tích tài liệu kỹ thuật cho H871, workspace kỹ thuật tự động hóa công nghiệp.
Đọc trực tiếp PDF gốc và trả kết quả hoàn toàn bằng tiếng Việt. Giữ chính xác thuật ngữ chuyên ngành, tên model, mã linh kiện, thông số, đơn vị và điều kiện kỹ thuật. Không suy diễn thành dữ kiện; phân biệt thông tin trong tài liệu với giả định.
Dự án: ${clean(project.name, 300)} (${clean(project.code, 100)}).
Tên tài liệu: ${clean(doc.title, 500)}.
Chỉ trả về JSON hợp lệ:
{
 "summary": "tóm tắt ngắn gọn bằng tiếng Việt, có thể dùng làm mô tả dự án",
 "technical_scope": "phạm vi kỹ thuật và quy trình",
 "key_equipment": ["thiết bị/linh kiện được nêu"],
 "requirements": ["yêu cầu và thông số được nêu rõ"],
 "risks": ["rủi ro, giới hạn, giả định; ghi rõ giả định"],
 "open_questions": ["câu hỏi chưa được giải quyết"],
 "suggested_tags": ["thẻ kỹ thuật ngắn gọn"],
 "source_references": [{"reference":"trang/mục nếu xác định được","claim":"thông tin được nguồn hỗ trợ"}]
}
Dùng mảng rỗng nếu không có bằng chứng. Không bịa số trang, thông số, thiết bị hoặc yêu cầu.`;

    const started = Date.now();
    let created;
    try {
      created = await fetchJson("https://generativelanguage.googleapis.com/v1beta/interactions",
        geminiKey,
        { method: "POST", body: JSON.stringify({
          model,
          input: [
            { type: "text", text: prompt },
            { type: "document", data: toBase64(bytes), mime_type: "application/pdf" },
          ],
          background: true,
          store: true,
          generation_config: { temperature: 0.1, response_format: { type: "text", mime_type: "application/json" } },
        }) }, 60_000);
    } catch {
      // The provider may have accepted the POST before the connection failed.
      // Preserve the submission marker; the next worker will not POST again.
      safeLog("gemini_submit_outcome_unknown", { elapsedMs: Date.now() - started });
      await finish("failed", null, "GEMINI_SUBMISSION_UNKNOWN",
        "The create-interaction request ended without a confirmed response. It was not automatically resubmitted.", 0);
      return json({ jobId, status: "failed", error: "GEMINI_SUBMISSION_UNKNOWN" });
    }
    safeLog("gemini_submit_response", {
      httpStatus: created.response.status, elapsedMs: Date.now() - started,
    });
    if (!created.response.ok || !created.data?.id) {
      const quota = created.response.status === 429;
      const code = quota ? "GEMINI_FREE_QUOTA_EXHAUSTED" : "GEMINI_INTERACTION_CREATE_FAILED";
      const message = quota
        ? "Gemini free quota or rate limit was reached. No paid fallback was attempted."
        : "Gemini did not confirm creation of a background interaction.";
      await finish(quota ? "quota_exhausted" : "failed", null, code, message, 0);
      return json({ jobId, status: quota ? "quota_exhausted" : "failed", error: code });
    }

    const newInteractionId = String(created.data.id);
    const providerStatus = String(created.data.status || "in_progress");
    if (providerStatus === "completed") {
      // Fast completion is still finalized through the same durable polling path.
      await defer(newInteractionId, "in_progress");
      return json({ jobId, status: "queued", providerStatus }, 202);
    }
    if (providerStatus !== "in_progress") {
      await finish("failed", null, "GEMINI_INTERACTION_UNEXPECTED_STATUS",
        `Unexpected initial Gemini interaction status: ${providerStatus}.`, 0);
      return json({ jobId, status: "failed", error: "GEMINI_INTERACTION_UNEXPECTED_STATUS" });
    }
    await defer(newInteractionId, "in_progress");
    safeLog("gemini_background_started", { elapsedMs: Date.now() - started });
    return json({ jobId, status: "queued", providerStatus }, 202);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_WORKER_ERROR";
    const code = /^[A-Z0-9_]+$/.test(message) ? message : "WORKER_PROCESSING_FAILED";
    try {
      // Do not retry an ambiguous submission. Other pre-submit failures may retry.
      const retryDelay = code === "GEMINI_SUBMISSION_GUARD_FAILED" ? 0 :
        (code === "GEMINI_SUBMISSION_UNKNOWN" ? 0 : 45);
      const finalStatus = await finish("failed", null, code,
        "The worker could not complete the current queue step.", retryDelay);
      safeLog("job_failed", { code, finalStatus });
      return json({ jobId, status: finalStatus, error: code }, finalStatus === "queued" ? 202 : 200);
    } catch {
      safeLog("finalization_deferred");
      return json({ jobId, status: "processing", error: "FINALIZATION_DEFERRED" }, 202);
    }
  }
});

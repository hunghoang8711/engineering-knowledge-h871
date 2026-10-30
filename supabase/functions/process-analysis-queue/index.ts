// H871 queue worker: one job per invocation, lease-guarded finalization.
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY,
// GEMINI_MODEL, H871_QUEUE_WORKER_SECRET (random secret, >= 32 characters).
// Configure the caller to send x-h871-worker-secret. Never expose these values
// to the browser. This function is a repository draft; do not deploy until the
// database migrations and a genuinely no-cost invocation mechanism are verified.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
const clean = (value: unknown, max = 12000): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const strings = (value: unknown, max = 40): string[] =>
  Array.isArray(value)
    ? value.filter((x): x is string => typeof x === "string")
      .map((x) => x.trim().slice(0, 500)).filter(Boolean).slice(0, max)
    : [];
function toBase64(bytes: Uint8Array): string {
  let out = "";
  const chunk = 3 * 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    const part = bytes.subarray(i, Math.min(i + chunk, bytes.length));
    let binary = "";
    for (let j = 0; j < part.length; j += 0x3fff) {
      binary += String.fromCharCode(...part.subarray(j, Math.min(j + 0x3fff, part.length)));
    }
    out += btoa(binary);
  }
  return out;
}
function parseModelJson(text: string): Record<string, unknown> {
  const value = JSON.parse(text.trim().replace(/^\x60{3}(?:json)?\s*/i, "").replace(/\s*\x60{3}$/, ""));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("MODEL_OUTPUT_INVALID");
  return value as Record<string, unknown>;
}
function safeLog(stage: string, fields: Record<string, string | number | boolean> = {}) {
  console.info(JSON.stringify({ function: "process-analysis-queue", stage, ...fields }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const secret = Deno.env.get("H871_QUEUE_WORKER_SECRET") || "";
  const supplied = req.headers.get("x-h871-worker-secret") || "";
  if (secret.length < 32 || supplied !== secret) return json({ error: "WORKER_AUTHENTICATION_FAILED" }, 401);

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

  // A single bounded job per invocation avoids unbounded loops and limits the
  // impact of Edge Function wall-clock limits. The 180s lease is longer than
  // the 85s provider timeout and can be recovered after a worker crash.
  const { data: claimed, error: claimError } = await admin.rpc(
    "claim_project_ai_analysis_job", { p_lease_seconds: 180 },
  );
  if (claimError) {
    safeLog("claim_failed", { code: claimError.code || "UNKNOWN" });
    return json({ error: "QUEUE_CLAIM_FAILED" }, 503);
  }
  const job = Array.isArray(claimed) ? claimed[0] : null;
  if (!job) return json({ status: "idle" });

  const jobId = String(job.job_id);
  const leaseToken = String(job.lease_token);
  const analysisId = String(job.analysis_id);
  const finish = async (
    status: "succeeded" | "failed" | "quota_exhausted",
    result: Record<string, unknown> | null,
    errorCode: string | null,
    errorMessage: string | null,
    retryDelay: number,
  ) => {
    const { data, error } = await admin.rpc("finish_project_ai_analysis_job", {
      p_job_id: jobId,
      p_lease_token: leaseToken,
      p_status: status,
      p_result: result,
      p_error_code: errorCode,
      p_error_message: errorMessage,
      p_retry_delay_seconds: retryDelay,
    });
    if (error) throw new Error("JOB_FINALIZATION_FAILED");
    return data;
  };

  try {
    const { data: doc, error: docError } = await admin.from("documents")
      .select("id,project_id,title,original_filename,file_type,relative_path,sha256,version_label")
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
      await finish("failed", null, "UNSUPPORTED_FILE_TYPE", "Only PDF is supported by the initial AI flow.", 0);
      return json({ jobId, status: "failed", error: "UNSUPPORTED_FILE_TYPE" });
    }

    const path = clean(doc.relative_path, 1000);
    if (!path || path.startsWith("/") || path.includes("..")) {
      await finish("failed", null, "INVALID_STORAGE_PATH", "The stored document path is invalid.", 0);
      return json({ jobId, status: "failed", error: "INVALID_STORAGE_PATH" });
    }

    const { data: blob, error: downloadError } = await admin.storage
      .from("h871-project-documents").download(path);
    if (downloadError || !blob) {
      await finish("failed", null, "PRIVATE_FILE_DOWNLOAD_FAILED", "The private PDF could not be downloaded.", 30);
      return json({ jobId, status: "queued", error: "PRIVATE_FILE_DOWNLOAD_FAILED" }, 202);
    }
    const MAX_BYTES = 5 * 1024 * 1024;
    if (blob.size <= 0 || blob.size > MAX_BYTES) {
      await finish("failed", null, "FILE_SIZE_OUT_OF_RANGE", "The PDF exceeds the initial 5 MiB processing limit.", 0);
      return json({ jobId, status: "failed", error: "FILE_SIZE_OUT_OF_RANGE" });
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const base64 = toBase64(bytes);
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 85_000);
    let response: Response;
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [
            { text: prompt }, { inline_data: { mime_type: "application/pdf", data: base64 } },
          ] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const providerBody = await response.text();
      const quota = response.status === 429 || /quota|rate.?limit|resource.?exhausted/i.test(providerBody);
      const code = quota ? "GEMINI_FREE_QUOTA_EXHAUSTED" : `GEMINI_HTTP_${response.status}`;
      const message = quota
        ? "Gemini free quota or rate limit was reached. No paid fallback was attempted."
        : `Gemini request failed with HTTP ${response.status}. No paid fallback was attempted.`;
      const status = quota ? "quota_exhausted" : "failed";
      const finalStatus = await finish(status, null, code, message, quota ? 0 : 30);
      return json({ jobId, status: finalStatus, error: code }, finalStatus === "queued" ? 202 : 200);
    }

    const provider = await response.json();
    const output = provider?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "").join("");
    if (!output) throw new Error("MODEL_OUTPUT_EMPTY");
    const parsed = parseModelJson(output);
    const result = {
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
    if (!result.summary) throw new Error("MODEL_OUTPUT_MISSING_SUMMARY");

    // Persist source metadata before lease-guarded result finalization.
    const { error: metadataError } = await admin.from("project_ai_analyses")
      .update({
        document_sha256: doc.sha256 || null,
        version_label: doc.version_label || null,
      }).eq("id", analysisId);
    if (metadataError) throw new Error("ANALYSIS_METADATA_SAVE_FAILED");

    const finalStatus = await finish("succeeded", result, null, null, 0);
    safeLog("job_succeeded", { attempt: Number(job.attempt_count) || 0 });
    return json({ jobId, status: finalStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_WORKER_ERROR";
    const timedOut = message.includes("aborted");
    const code = timedOut ? "GEMINI_REQUEST_TIMEOUT" :
      /^[A-Z0-9_]+$/.test(message) ? message : "WORKER_PROCESSING_FAILED";
    const retryDelay = Number(job.attempt_count) < Number(job.max_attempts) ? 45 : 0;
    try {
      const finalStatus = await finish("failed", null, code,
        timedOut ? "Gemini request timed out. The job may retry within its configured attempt limit." :
          "The worker could not complete document analysis.", retryDelay);
      safeLog("job_failed", { code, finalStatus });
      return json({ jobId, status: finalStatus, error: code }, finalStatus === "queued" ? 202 : 200);
    } catch {
      // The lease may have expired or another worker may own the job. Let the
      // queue's lease-recovery path handle it; never overwrite another worker.
      safeLog("finalization_deferred");
      return json({ jobId, status: "processing", error: "FINALIZATION_DEFERRED" }, 202);
    }
  }
});

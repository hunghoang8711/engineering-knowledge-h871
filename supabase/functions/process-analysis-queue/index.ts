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
      headers: { "Content-Type": "application/json", "Api-Revision": "2026-05-20", "x-goog-api-key": key, ...(init.headers || {}) },
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
    .join("") || (typeof interaction?.output_text === "string" ? interaction.output_text : "");
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
        // Log only bounded provider diagnostic fields; never log request/input or credentials.
        const providerError = result.data?.error;
        const diagnostic = {
          providerStatus,
          errorCode: typeof providerError?.code === "string" || typeof providerError?.code === "number"
            ? String(providerError.code).slice(0, 80) : "NOT_PROVIDED",
          errorMessage: typeof providerError?.message === "string"
            ? providerError.message.replace(/[\r\n\t]+/g, " ").slice(0, 400) : "NOT_PROVIDED",
          failureReason: typeof result.data?.failure_reason === "string"
            ? result.data.failure_reason.replace(/[\r\n\t]+/g, " ").slice(0, 200) : "NOT_PROVIDED",
          hasIncompleteDetails: Boolean(result.data?.incomplete_details),
        };
        safeLog("gemini_interaction_terminal", diagnostic);
        await finish("failed", null, `GEMINI_INTERACTION_${providerStatus.toUpperCase()}`,
          `Gemini interaction ended with status: ${providerStatus}. Check function logs for bounded provider diagnostics.`, 0);
        return json({ jobId, status: "failed", providerStatus });
      }
      if (providerStatus !== "completed") {
        await defer(interactionId, "in_progress");
        return json({ jobId, status: "queued", providerStatus: "unknown_waiting" }, 202);
      }

      const output = modelOutput(result.data);
      if (!output) throw new Error("MODEL_OUTPUT_EMPTY");
      const parsed = parseModelJson(output);
      const rawReview = parsed.document_review && typeof parsed.document_review === "object"
        ? parsed.document_review as Record<string, unknown> : {};
      const requestedCoverage = clean(rawReview.coverage_status, 20).toLowerCase();
      const coverageStatus = ["complete", "partial", "uncertain"].includes(requestedCoverage)
        ? requestedCoverage : "uncertain";
      const keyParameters = Array.isArray(parsed.key_parameters)
        ? parsed.key_parameters.filter((item: unknown) => item && typeof item === "object")
          .slice(0, 100).map((item: any) => ({
            parameter: clean(item.parameter, 200),
            value: clean(item.value, 200),
            unit: clean(item.unit, 80),
            context: clean(item.context, 500),
            reference: clean(item.reference, 120),
          })).filter((item: any) => item.parameter && item.value)
        : [];
      const documentReview = {
        coverage_status: coverageStatus,
        pages_reviewed: clean(rawReview.pages_reviewed, 200),
        visual_elements_reviewed: strings(rawReview.visual_elements_reviewed, 40),
        tables_and_drawings_reviewed: strings(rawReview.tables_and_drawings_reviewed, 40),
        limitations: strings(rawReview.limitations, 40),
      };
      if (coverageStatus !== "complete" && !documentReview.limitations.length) {
        documentReview.limitations.push("AI không xác nhận đã xem xét đầy đủ toàn bộ nội dung PDF; cần kiểm tra thủ công.");
      }
      const analysis = {
        summary: clean(parsed.summary),
        technical_scope: clean(parsed.technical_scope),
        key_equipment: strings(parsed.key_equipment),
        key_parameters: keyParameters,
        requirements: strings(parsed.requirements),
        risks: strings(parsed.risks),
        open_questions: strings(parsed.open_questions),
        suggested_tags: strings(parsed.suggested_tags, 30),
        document_review: documentReview,
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

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const pdfBase64 = toBase64(bytes);
    const prompt = `Bạn là kỹ sư trưởng phân tích tài liệu cho H871, chuyên về thiết kế máy và tự động hóa công nghiệp.
NHIỆM VỤ CỐT LÕI: Phân tích trực tiếp TOÀN BỘ PDF gốc như một tài liệu đa phương thức. Không coi PDF là văn bản thuần. Phải xem xét cả chữ, hình ảnh, ảnh chụp, bản vẽ cơ khí, sơ đồ điện/khí nén, lưu đồ, biểu đồ, bảng biểu, chú thích, ký hiệu và bố cục trang.
PHẠM VI ĐỌC:
1. Đi lần lượt từ trang đầu đến trang cuối; không chỉ đọc phần tóm tắt, mục lục hoặc các trang đầu. Kết nối thông tin liên quan nằm rải rác ở các trang khác nhau.
2. Với bản vẽ/hình ảnh: phân tích những gì thực sự nhìn thấy như hình dạng cơ cấu, vị trí tương quan, hướng chuyển động, cách lắp đặt, kích thước, dung sai, callout, mã chi tiết, chú giải và quan hệ giữa các thành phần. Không tự suy ra kích thước hoặc cấu tạo không thể nhìn thấy.
3. Với sơ đồ: giải thích luồng tín hiệu, trình tự hoạt động, kết nối, logic điều khiển hoặc luồng vật liệu nếu sơ đồ thể hiện đủ căn cứ.
4. Với bảng: giữ mối liên hệ giữa tên cột, hàng, giá trị, đơn vị, ghi chú và điều kiện áp dụng. Không tách một con số khỏi tiêu đề/đơn vị của nó.
5. Với tài liệu thiết kế máy: chú ý cơ cấu cơ khí, robot, actuator, sensor, camera/vision, conveyor, khí nén, điện điều khiển, PLC, safety, cycle time, năng suất, layout, interface, yêu cầu khách hàng, BOM và phương án vận hành.
6. Đối chiếu chéo giữa mô tả, bảng, hình và bản vẽ. Nêu rõ mâu thuẫn hoặc khác biệt; không tự chọn một giá trị nếu tài liệu chưa xác định phiên bản đúng.
ĐỘ TIN CẬY:
- Phân biệt rõ dữ kiện được ghi/hiển thị trực tiếp, nhận định kỹ thuật có căn cứ và giả định.
- Giữ nguyên model, part number, mã bản vẽ, kích thước, dung sai, đơn vị, điều kiện và dấu +/-.
- Mọi thông số quan trọng phải có trang/mục tham chiếu khi xác định được. Không bịa số trang hoặc nguồn dẫn.
- Nếu chữ/hình/bản vẽ mờ, bị cắt, không đọc được hoặc không thể kiểm tra, ghi vào limitations; không đoán.
- Chỉ đặt coverage_status="complete" nếu đã thực sự xem xét tất cả các trang và nội dung trực quan có ý nghĩa. Nếu có trang/nội dung không đọc được hoặc không chắc đã xem hết, dùng "partial" hoặc "uncertain". Đây là tự đánh giá của AI, không phải xác minh độc lập.
- Không bịa dữ kiện. Dùng mảng rỗng khi không có bằng chứng.
Dự án: ${clean(project.name, 300)} (${clean(project.code, 100)}).
Tên tài liệu: ${clean(doc.title, 500)}.
Chỉ trả về JSON hợp lệ theo cấu trúc:
{
 "summary": "tóm tắt tổng thể, nêu mục đích và nội dung chính của tài liệu",
 "technical_scope": "phạm vi kỹ thuật, kiến trúc giải pháp, nguyên lý và trình tự hoạt động",
 "key_equipment": ["thiết bị/linh kiện, model và vai trò nếu có căn cứ"],
 "key_parameters": [{"parameter":"tên thông số","value":"giá trị chính xác","unit":"đơn vị","context":"điều kiện/ý nghĩa","reference":"trang hoặc mục"}],
 "requirements": ["yêu cầu kỹ thuật và thông số bắt buộc"],
 "risks": ["rủi ro, giới hạn, mâu thuẫn hoặc giả định; ghi rõ loại thông tin"],
 "open_questions": ["điểm chưa rõ hoặc cần xác nhận"],
 "suggested_tags": ["thẻ kỹ thuật ngắn gọn"],
 "document_review": {
   "coverage_status": "complete | partial | uncertain",
   "pages_reviewed": "mô tả phạm vi trang đã xem; không đoán tổng số trang",
   "visual_elements_reviewed": ["loại hình ảnh/sơ đồ/bản vẽ thực sự đã xem"],
   "tables_and_drawings_reviewed": ["bảng/bản vẽ/sơ đồ thực sự đã kiểm tra"],
   "limitations": ["trang, hình, bảng hoặc nội dung không đọc/không xác minh được"]
 },
 "source_references": [{"reference":"trang/mục nếu xác định được","claim":"thông tin được nguồn hỗ trợ"}]
}
Chỉ ghi nhận những gì tài liệu hỗ trợ. Nếu không có hình ảnh/bảng/bản vẽ có ý nghĩa, nêu rõ điều đó trong document_review thay vì tạo nội dung giả.`;

    const { data: marked, error: markError } = await admin.rpc(
      "mark_gemini_interaction_submission_started",
      { p_job_id: jobId, p_lease_token: leaseToken },
    );
    if (markError || marked !== true) throw new Error("GEMINI_SUBMISSION_GUARD_FAILED");

    const started = Date.now();
    let created;
    try {
      created = await fetchJson("https://generativelanguage.googleapis.com/v1beta/interactions",
        geminiKey,
        { method: "POST", body: JSON.stringify({
          model,
          input: [
            { type: "text", text: prompt },
            { type: "document", data: pdfBase64, mime_type: "application/pdf" },
          ],
          background: true,
          store: true,
          generation_config: { thinking_level: "low" },
          response_format: { type: "text", mime_type: "application/json" },
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

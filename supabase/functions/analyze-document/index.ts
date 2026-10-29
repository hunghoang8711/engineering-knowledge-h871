// H871 server-side document analysis boundary.
// Required Supabase secrets: SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, GEMINI_MODEL.
// Set GEMINI_MODEL only to a model currently confirmed eligible for the free tier.
// This function never selects a paid fallback and never exposes the API key.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function base64FromBytes(bytes: Uint8Array): string {
  // Encode bounded chunks and append directly to avoid retaining an array of
  // encoded chunks plus a second full-size joined Base64 string.
  const chunkSize = 3 * 8192;
  let encoded = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    let binary = "";
    const binaryChunkSize = 0x3fff; // 16,383 bytes, divisible by 3
    for (let j = 0; j < chunk.length; j += binaryChunkSize) {
      binary += String.fromCharCode(...chunk.subarray(j, Math.min(j + binaryChunkSize, chunk.length)));
    }
    encoded += btoa(binary);
  }
  return encoded;
}
function logStage(stage: string, details: Record<string, string | number | boolean> = {}) {
  // Never log document names, file contents, Base64 data, user tokens, or API keys.
  console.info(JSON.stringify({ function: "analyze-document", stage, ...details }));
}

function cleanText(value: unknown, max = 12000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function asStringArray(value: unknown, maxItems = 40): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 500))
    .filter(Boolean)
    .slice(0, maxItems);
}

function parseJsonResponse(text: string): Record<string, unknown> {
  const trimmed = text.trim().replace(/^\x60{3}(?:json)?\s*/i, "").replace(/\s*\x60{3}$/i, "");
  const parsed = JSON.parse(trimmed);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("MODEL_OUTPUT_INVALID");
  }
  return parsed as Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const model = Deno.env.get("GEMINI_MODEL");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "SERVER_CONFIGURATION_INCOMPLETE" }, 500);
  }
  if (!geminiKey || !model) {
    return json({
      error: "AI_NOT_CONFIGURED",
      message: "Gemini is not configured. No request was sent and no paid fallback was attempted.",
    }, 503);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "AUTHENTICATION_REQUIRED" }, 401);
  }

  let payload: { documentId?: unknown; projectId?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }
  const documentId = cleanText(payload.documentId, 80);
  const projectId = cleanText(payload.projectId, 80);
  if (!documentId || !projectId) {
    return json({ error: "DOCUMENT_AND_PROJECT_REQUIRED" }, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "INVALID_SESSION" }, 401);
  const userId = userData.user.id;

  const { data: roleRow, error: roleError } = await adminClient
    .from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (roleError) return json({ error: "ROLE_LOOKUP_FAILED" }, 500);
  if (!roleRow || !["admin", "editor"].includes(roleRow.role)) {
    return json({ error: "EDITOR_ROLE_REQUIRED" }, 403);
  }

  const { data: document, error: documentError } = await adminClient
    .from("documents")
    .select("id,project_id,title,original_filename,file_type,relative_path,sha256,version_label,status")
    .eq("id", documentId).maybeSingle();
  if (documentError) return json({ error: "DOCUMENT_LOOKUP_FAILED" }, 500);
  if (!document || document.project_id !== projectId) {
    return json({ error: "DOCUMENT_NOT_FOUND_FOR_PROJECT" }, 404);
  }
  const { data: project, error: projectError } = await adminClient
    .from("projects").select("id,name,code").eq("id", projectId).maybeSingle();
  if (projectError) return json({ error: "PROJECT_LOOKUP_FAILED" }, 500);
  if (!project) return json({ error: "PROJECT_NOT_FOUND" }, 404);

  // The initial endpoint supports PDF only. Storage also accepts Office formats,
  // but this Gemini inline document path is not a general-purpose Office-file reader.
  // Reject them before sending bytes; do not pretend support or add a custom parser.
  const fileType = String(document.file_type || "").trim().toLowerCase();
  const originalName = String(document.original_filename || document.title || "").trim().toLowerCase();
  const isPdf = fileType === "pdf" ||
    fileType === "application/pdf" ||
    originalName.endsWith(".pdf");
  if (!isPdf) {
    return json({
      error: "UNSUPPORTED_FILE_TYPE_FOR_INITIAL_AI_FLOW",
      supportedTypes: ["application/pdf"],
      message: "The initial AI analysis flow supports PDF files only. Office files remain stored normally but will not be sent to Gemini until their input method is separately verified.",
    }, 415);
  }
  const mimeType = "application/pdf";

  // Keep initial free-tier requests conservative. Larger files need a separately
  // verified Gemini model/file limit; never silently switch to a paid service.
  // PDF bytes, Base64 text, and the outgoing JSON body briefly coexist in memory.
  // Keep the cap conservative to reduce Edge Function worker 546 failures.
  const MAX_BYTES = 5 * 1024 * 1024;
  const storagePath = cleanText(document.relative_path, 1000);
  if (!storagePath || storagePath.startsWith("/") || storagePath.includes("..")) {
    return json({ error: "INVALID_STORAGE_PATH" }, 400);
  }

  const downloadStartedAt = Date.now();
  const { data: fileBlob, error: downloadError } = await adminClient.storage
    .from("h871-project-documents").download(storagePath);
  if (downloadError || !fileBlob) {
    logStage("download_failed");
    return json({ error: "PRIVATE_FILE_DOWNLOAD_FAILED" }, 422);
  }
  logStage("download_complete", {
    fileBytes: fileBlob.size,
    downloadDurationMs: Date.now() - downloadStartedAt,
  });
  if (fileBlob.size > MAX_BYTES) {
    return json({
      error: "FILE_TOO_LARGE_FOR_INITIAL_FREE_TIER_FLOW",
      maxBytes: MAX_BYTES,
      message: "No AI request was sent. Use a smaller file or configure a separately verified eligible free-tier flow.",
    }, 413);
  }

  // Record a run before calling the provider. Database schema migration 0004
  // must be applied and verified before this endpoint can be enabled.
  const { data: run, error: runError } = await adminClient
    .from("project_ai_analyses")
    .insert({
      project_id: projectId,
      document_id: documentId,
      document_sha256: document.sha256 || null,
      version_label: document.version_label || null,
      provider: "gemini",
      model,
      status: "processing",
      requested_by: userId,
      started_at: new Date().toISOString(),
    })
    .select("id").single();
  if (runError || !run) {
    return json({
      error: "ANALYSIS_SCHEMA_NOT_READY",
      message: "The analysis-history migration is not available or its policies/schema need verification. No Gemini request was sent.",
    }, 503);
  }

  let stage = "read_file_bytes";
  const analysisStartedAt = Date.now();
  try {
    const fileBytes = new Uint8Array(await fileBlob.arrayBuffer());
    logStage("file_bytes_ready", { fileBytes: fileBytes.byteLength });
    stage = "base64_encode";
    const base64StartedAt = Date.now();
    const fileBase64 = base64FromBytes(fileBytes);
    logStage("base64_encode_complete", {
      fileBytes: fileBytes.byteLength,
      base64Chars: fileBase64.length,
      durationMs: Date.now() - base64StartedAt,
    });
    const prompt = `Bạn là chuyên gia phân tích tài liệu kỹ thuật cho H871, một workspace kỹ thuật tự động hóa công nghiệp.
Đọc trực tiếp tài liệu gốc được cung cấp và trả kết quả hoàn toàn bằng tiếng Việt. Không dịch từ một bản phân tích tiếng Anh; hãy tự đọc hiểu nội dung gốc, giữ chính xác thuật ngữ kỹ thuật, tên model, mã linh kiện, thông số, đơn vị và điều kiện kỹ thuật. Với thuật ngữ chuyên ngành thường dùng bằng tiếng Anh, có thể giữ nguyên thuật ngữ đó khi cần để tránh sai lệch.
Phần lớn tài liệu trong workspace được trình bày bằng tiếng Việt. Ưu tiên diễn đạt tiếng Việt rõ ràng, đúng ngữ cảnh kỹ thuật tự động hóa. Không suy diễn thành dữ kiện; phân biệt rõ thông tin nêu trong tài liệu và giả định.
Dự án: ${cleanText(project.name, 300)} (${cleanText(project.code, 100)}).
Tên tài liệu: ${cleanText(document.title, 500)}.
Chỉ trả về JSON hợp lệ theo đúng cấu trúc:
{
 "summary": "tóm tắt ngắn gọn bằng tiếng Việt, có thể dùng làm mô tả dự án",
 "technical_scope": "phạm vi kỹ thuật và mô tả quy trình bằng tiếng Việt",
 "key_equipment": ["thiết bị/linh kiện được nêu trong tài liệu"],
 "requirements": ["yêu cầu và thông số kỹ thuật được nêu rõ"],
 "risks": ["rủi ro, giới hạn, giả định; ghi rõ đâu là giả định"],
 "open_questions": ["các câu hỏi chưa được giải quyết"],
 "suggested_tags": ["thẻ kỹ thuật ngắn gọn, ưu tiên thuật ngữ kỹ thuật chuẩn"],
 "source_references": [{"reference":"trang/mục nếu xác định được","claim":"thông tin được nguồn đó hỗ trợ"}]
}
Dùng mảng rỗng nếu không có bằng chứng. Không bịa số trang, thông số, thiết bị, rủi ro hoặc yêu cầu. Mọi nhận định phải dựa trên tài liệu gốc.`;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    stage = "gemini_request";
    logStage("gemini_request_started", { fileBytes: fileBytes.byteLength });
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: fileBase64 } },
          ],
        }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    });

    logStage("gemini_response_received", {
      httpStatus: response.status,
      durationMs: Date.now() - analysisStartedAt,
    });
    if (!response.ok) {
      const providerBody = await response.text();
      const quota = response.status === 429 ||
        /quota|rate.?limit|resource.?exhausted/i.test(providerBody);
      const status = quota ? "quota_exhausted" : "failed";
      await adminClient.from("project_ai_analyses").update({
        status,
        error_code: quota ? "GEMINI_FREE_QUOTA_EXHAUSTED_OR_RATE_LIMITED" : "GEMINI_REQUEST_FAILED",
        error_message: `Gemini request failed (HTTP ${response.status}). No paid fallback was attempted.`,
        completed_at: new Date().toISOString(),
      }).eq("id", run.id);
      return json({
        error: quota ? "FREE_QUOTA_EXHAUSTED" : "GEMINI_REQUEST_FAILED",
        analysisId: run.id,
        message: quota
          ? "The configured Gemini quota/rate limit was reached. Wait or review free-tier limits; no paid fallback was attempted."
          : `Gemini returned HTTP ${response.status}. No paid fallback was attempted.`,
      }, quota ? 429 : 502);
    }

    stage = "parse_gemini_response";
    const providerData = await response.json();
    const responseText = providerData?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "").join("");
    if (!responseText) throw new Error("MODEL_OUTPUT_EMPTY");
    const parsed = parseJsonResponse(responseText);
    const result = {
      summary: cleanText(parsed.summary),
      technical_scope: cleanText(parsed.technical_scope),
      key_equipment: asStringArray(parsed.key_equipment),
      requirements: asStringArray(parsed.requirements),
      risks: asStringArray(parsed.risks),
      open_questions: asStringArray(parsed.open_questions),
      suggested_tags: asStringArray(parsed.suggested_tags, 30),
      source_references: Array.isArray(parsed.source_references)
        ? parsed.source_references.filter((x: unknown) => x && typeof x === "object").slice(0, 80)
        : [],
    };
    if (!result.summary) throw new Error("MODEL_OUTPUT_MISSING_SUMMARY");

    stage = "save_analysis_result";
    const { error: saveError } = await adminClient.from("project_ai_analyses").update({
      status: "succeeded",
      result,
      summary: result.summary,
      technical_scope: result.technical_scope,
      key_equipment: result.key_equipment,
      requirements: result.requirements,
      risks: result.risks,
      open_questions: result.open_questions,
      suggested_tags: result.suggested_tags,
      source_references: result.source_references,
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);
    if (saveError) throw new Error("ANALYSIS_RESULT_SAVE_FAILED");

    logStage("analysis_succeeded", {
      durationMs: Date.now() - analysisStartedAt,
      resultTagCount: result.suggested_tags.length,
    });
    return json({ analysisId: run.id, status: "succeeded", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ANALYSIS_ERROR";
    logStage("analysis_failed", {
      stage,
      durationMs: Date.now() - analysisStartedAt,
      errorCode: message.slice(0, 80),
    });
    await adminClient.from("project_ai_analyses").update({
      status: "failed",
      error_code: message.slice(0, 120),
      error_message: "Analysis failed or returned invalid structured output. Project description and tags were not changed.",
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);
    return json({
      error: "ANALYSIS_FAILED",
      analysisId: run.id,
      message: "Analysis failed. The project description and tags were not changed.",
    }, 502);
  }
});

// H871 durable AI analysis enqueue endpoint.
// This endpoint creates a queue record only. It never downloads a document
// and never calls Gemini, so the browser receives a prompt response.
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const model = Deno.env.get("GEMINI_MODEL");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !model) {
    return json({ error: "SERVER_CONFIGURATION_INCOMPLETE" }, 503);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "AUTHENTICATION_REQUIRED" }, 401);
  }

  let payload: { projectId?: unknown; documentId?: unknown; idempotencyKey?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const projectId = typeof payload.projectId === "string" ? payload.projectId.trim() : "";
  const documentId = typeof payload.documentId === "string" ? payload.documentId.trim() : "";
  const idempotencyKey = typeof payload.idempotencyKey === "string"
    ? payload.idempotencyKey.trim()
    : "";

  if (!UUID_RE.test(projectId) || !UUID_RE.test(documentId) || !UUID_RE.test(idempotencyKey)) {
    return json({
      error: "INVALID_REQUEST",
      message: "projectId, documentId and idempotencyKey must be UUID values.",
    }, 400);
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

  const { data: roleRow, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (roleError) return json({ error: "ROLE_LOOKUP_FAILED" }, 500);
  if (!roleRow || !["admin", "editor"].includes(roleRow.role)) {
    return json({ error: "EDITOR_ROLE_REQUIRED" }, 403);
  }

  // Verify the document is attached to this project before the privileged RPC.
  const { data: document, error: documentError } = await adminClient
    .from("documents")
    .select("id,project_id,file_type,original_filename")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) return json({ error: "DOCUMENT_LOOKUP_FAILED" }, 500);
  if (!document || document.project_id !== projectId) {
    return json({ error: "DOCUMENT_NOT_FOUND_FOR_PROJECT" }, 404);
  }

  const fileType = String(document.file_type || "").trim().toLowerCase();
  const fileName = String(document.original_filename || "").trim().toLowerCase();
  const isPdf = fileType === "pdf" || fileType === "application/pdf" || fileName.endsWith(".pdf");
  if (!isPdf) {
    return json({
      error: "UNSUPPORTED_FILE_TYPE_FOR_INITIAL_AI_FLOW",
      supportedTypes: ["application/pdf"],
    }, 415);
  }

  const { data: enqueueRows, error: enqueueError } = await adminClient.rpc(
    "enqueue_project_ai_analysis_job",
    {
      p_project_id: projectId,
      p_document_id: documentId,
      p_requested_by: userData.user.id,
      p_model: model,
      p_idempotency_key: idempotencyKey,
      p_max_attempts: 3,
    },
  );

  if (enqueueError || !Array.isArray(enqueueRows) || !enqueueRows[0]) {
    // Do not expose database internals or privileged error details to the browser.
    console.error(JSON.stringify({
      function: "enqueue-analysis",
      stage: "enqueue_rpc_failed",
      code: enqueueError?.code || "NO_QUEUE_ROW",
    }));
    return json({
      error: "ANALYSIS_QUEUE_NOT_READY",
      message: "The queue schema is not installed or is not ready. No AI request was sent.",
    }, 503);
  }

  const job = enqueueRows[0];
  return json({
    jobId: job.job_id,
    analysisId: job.analysis_id,
    status: job.job_status,
    created: job.was_created,
  }, 202);
});

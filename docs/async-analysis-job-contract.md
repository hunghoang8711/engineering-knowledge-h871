# H871 asynchronous document analysis — implementation contract

Status: design contract only; no production resources or database changes have been created.

## Why this change is needed

The current `analyze-document` Edge Function performs the complete operation in one HTTP request: authorization, Storage download, PDF-to-Base64 conversion, Gemini request, response validation, and result persistence. The browser waits for that request. This makes the user experience depend on one finite Edge Function invocation and makes interrupted requests difficult to recover.

The current implementation also has an application-level 5 MiB PDF limit. Raising that limit alone is unsafe: the function temporarily holds the PDF bytes, Base64 representation, and outgoing JSON request in memory, while provider latency can exceed the Edge Function execution window.

## Target behavior

1. The browser uploads the original file to the existing private `h871-project-documents` bucket.
2. The browser requests creation of an analysis job. The server validates the signed-in user and admin/editor role, confirms that the document belongs to the project, and records a durable job.
3. The browser receives a job/analysis identifier promptly and does not wait for Gemini to finish.
4. A separately deployed worker claims a job, downloads the file from private Storage, calls only the explicitly configured Gemini model, validates the structured result, and persists success or a safe failure.
5. The browser polls the job status with bounded backoff and can leave/reopen the project without losing the job state.
6. Retry is explicit and bounded. A retry must not create duplicate successful results for the same document content and requested analysis version.
7. The Main Concept apply/restore flow remains separate from analysis execution. A successful analysis does not silently overwrite project description or tags until the user applies it as Main Concept.

## Job lifecycle

Allowed states:

- `queued`: accepted and waiting for a worker.
- `processing`: leased by a worker.
- `succeeded`: validated result persisted.
- `failed`: non-retryable or exhausted failure.
- `quota_exhausted`: Gemini free quota/rate limit reached; no paid fallback.
- `cancelled`: cancelled before completion.

A worker claim must be atomic. Each claim has a lease token, lease expiry, attempt count, and heartbeat/update timestamp. Expired leases become eligible for recovery; a worker may only complete a job while it still owns the active lease. This prevents two workers from overwriting each other's results.

## Security boundaries

- Keep `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Authenticate the initiating user and check the existing admin/editor role before enqueueing.
- Verify document/project ownership before creating a job and again before processing.
- Keep the Storage bucket private. Workers download only by the stored object path after validating it.
- Do not log document names, file contents, Base64, user tokens, or API keys.
- Do not weaken existing RLS policies. Any new table must enable RLS and define explicit read access; trusted worker writes use server-side credentials only.
- Never send customer/company files to an external AI provider until the workspace owner has confirmed the applicable company data policy.

## Free-first runtime decision gate

A durable queue is not itself a compute runtime. The worker must execute somewhere, and a queue does not remove provider latency or compute cost.

Before selecting a worker runtime, verify all of the following from current official pricing and account configuration:

- no Billing Account or payment method needs to be added;
- the chosen region and service are actually covered by a no-cost allowance;
- the allowance covers the expected CPU, memory, storage, network egress, scheduling, and invocation pattern;
- the service will not automatically scale into billable usage;
- hard spending limits exist, or the service can be kept disabled when the free allowance is exhausted.

Budget alerts are not hard spending caps. A runtime that merely has a Free Tier allowance but requires Billing activation is not acceptable under the current H871 requirement. If no suitable runtime passes these checks, stop at the durable queue/API design and do not deploy a paid fallback.

## Planned repository implementation sequence

1. **Schema reconciliation (read-only):** compare the deployed database with migration `0004_ai_project_intelligence.sql`; confirm whether the analysis/history tables and columns exist. Do not replay migration 0004 blindly.
2. **Queue schema (additive draft):** add durable claim/lease/retry metadata only after step 1. Prefer extending the analysis-run record if its semantics remain clear; otherwise use a dedicated job table with a unique idempotency key.
3. **Enqueue API — repository draft implemented:** `supabase/functions/enqueue-analysis/index.ts` authenticates the JWT, checks the admin/editor role, verifies document/project ownership and PDF type, then calls the service-role-only `enqueue_project_ai_analysis_job` RPC. The RPC creates the analysis row and queue row in one transaction and uses an advisory lock plus an idempotency key to prevent duplicate jobs. It returns HTTP 202 with job and analysis IDs; it never calls Gemini.
4. **Worker — repository draft implemented:** `supabase/functions/process-analysis-queue/index.ts` claims at most one job per invocation, validates the project/document relationship, downloads a bounded PDF from the private bucket, calls only the configured Gemini model, validates the JSON result, and finalizes through the lease-token RPC. It uses an 85-second Gemini timeout, a 180-second lease, bounded retries, terminal quota handling, and no paid fallback. The endpoint uses `H871_QUEUE_WORKER_SECRET` with `verify_jwt = false`; the shared secret must be high entropy and server-side only. `supabase/operations/schedule-analysis-worker.sql` is an opt-in `pg_cron` + `pg_net` + Vault schedule draft (every two minutes), not yet executed.
5. **Frontend — repository draft implemented:** `frontend/navigation.js` now enqueues through `enqueue-analysis`, shows the accepted job ID, polls the analysis history, and can recover by reopening the project.
6. **Worker scheduler — repository draft implemented:** `.github/workflows/h871-ai-analysis-queue.yml` invokes one worker run every five minutes (plus manual dispatch), using only GitHub Actions secrets `H871_SUPABASE_URL` and `H871_QUEUE_WORKER_SECRET`. It uses a standard hosted runner and no third-party actions. GitHub documents standard hosted runners as free for public repositories; scheduled workflows run only from the default branch, can be delayed/dropped under load, and are disabled after 60 days without repository activity. Therefore this is a no-cost candidate, not a guaranteed real-time scheduler. The workflow must not be relied on until it is placed on the default branch after the Edge Function is deployed and secrets are configured. The Supabase Cron script remains an optional alternative, not a prerequisite.
7. **Verification:** test with synthetic PDFs and editor/viewer accounts. Verify duplicate submissions, expired leases, worker interruption, quota exhaustion, malformed model output, and Main Concept apply/restore.
6. **Verification:** test with synthetic PDFs and editor/viewer accounts. Verify duplicate submissions, expired leases, worker interruption, quota exhaustion, malformed model output, and Main Concept apply/restore.

## Current constraints and non-goals

- Do not raise the current 5 MiB synchronous endpoint limit as a workaround.
- Do not create a local-PC worker; the required design is cloud-based.
- Do not activate Google Cloud Billing, add a payment method, or create billable resources.
- Do not change production Supabase schema, RLS, secrets, or deployed functions as part of this design-only increment.
- Do not claim that a job is queued until a durable job record has actually been committed.
- Do not report an analysis as successful until its validated result has been persisted.

## Repository state at this increment

Repository-only drafts now exist for the queue schema/RPCs, authenticated enqueue endpoint, shared-secret-protected single-job worker, and an opt-in Supabase Cron setup script, plus `supabase/operations/preflight-async-analysis.sql` (read-only checks for schema, policies, helper RPCs, extensions and bucket metadata). The proposed scheduler uses `pg_cron` + `pg_net` + Vault every two minutes and reads its URL/API key/worker secret from Vault. It must only be enabled after confirming the extensions and current Free-plan allowances in the actual project. `supabase/config.toml` enables JWT verification for enqueue and disables platform JWT verification only for the worker, which performs its own shared-secret check. No secrets have been configured and no function or cron job has been deployed. Live preflight (2026-10-30) confirms `projects.main_concept_document_id`, `projects.private_note`, `project_ai_analyses`, `project_change_history`, and the `apply_main_concept` / `restore_project_history` / `has_hub_role` RPCs already exist. All five inspected core tables have RLS enabled (force RLS is false); the private Storage bucket exists with a 50 MiB limit. The queue table and its four RPCs are absent. `supabase_vault` is installed, while `pg_cron` and `cron.job` are absent. Do not replay migration 0004. Migration 0007 has been tightened so authenticated clients have no direct table privileges on queue internals; only the service role is granted table access. It remains a repository draft pending final review and explicit user approval. No production website, Supabase database, Storage bucket, deployed Edge Function, secret, cron job, or Google Cloud resource has been changed. SQL execution and Deno type/runtime tests remain outstanding.

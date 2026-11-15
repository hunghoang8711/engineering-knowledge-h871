# Skill — GitHub, Supabase, and Gemini AI Worker

## GitHub operating practice
- Repository is public and Pages deploys `frontend/`; never commit private customer documents, drawings, credentials, or secrets.
- Inspect current `main` and the target file before editing. Use current blob SHA for updates and current branch head for commits.
- User prefers incremental commits on `main`, not a new branch for every small change.
- Check the Pages workflow after frontend changes. A green deployment workflow proves only that workflow completed.
- Keep `docs/PROJECT_MASTER_HISTORY.md` updated after implementation and record commit IDs, exact validation, and remaining tests.
- The root README was originally stale relative to later project development; the knowledge package must be linked prominently so onboarding does not rely on outdated bootstrap status.

## Supabase safety
- Project ref `hwynbpvorlusicgafuxs`, region `ap-southeast-1`; private bucket `h871-project-documents`.
- Never expose service-role credentials in frontend. Use authenticated client access and existing RLS.
- Before SQL or migrations: inspect live tables, columns, constraints, indexes, policies, functions, and migration history read-only.
- Do not re-run historical migration files just because they exist. Migration 0004 was previously known to overlap with objects the user reported already existed.
- Prefer additive, reversible changes; no schema/RLS changes unless needed.
- Verify ownership and authorization at the database boundary; UI visibility is not authorization.
- Avoid logging document contents or credentials.

## Gemini / asynchronous analysis
- Product intent: whole-PDF multimodal analysis, including technical drawings/images. Do not substitute a local text-only extraction pipeline.
- Free-only model/API. No billing enablement or paid fallback.
- The synchronous Edge Function path exceeded the reported 150-second limit and hit resource/503 errors. Long-running inference belongs in an asynchronous queue/worker architecture.
- Keep enqueue request short: authorize, validate, create/requeue job, return promptly. Worker handles file fetch and model call.
- Worker should be retry-aware and idempotent; preserve attempts, provider/model identifiers, errors, and result history.
- Do not mark failed/incomplete analysis as the new Main Concept. Only apply valid successful results.
- User-reported synthetic test succeeded for TEST2026-01 and produced “Automated Sample Handling Demonstrator”; this is not proof every current workflow or production PDF succeeds.
- Earlier environment check found no pg_cron. GitHub Actions polling was used/discussed; inspect active workflow schedules, run history, secrets, and worker endpoint before changing cadence.
- If Gemini free quota or availability is exhausted, report it clearly. Never silently fall back to a paid model.

## Validation checklist
- Verify the enqueue endpoint returns promptly and does not perform long inference inline.
- Verify queue status transitions, attempt count, retry policy, idempotency, and terminal failure handling.
- Verify worker downloads the intended private object and sends the whole supported PDF.
- Verify model response schema and source references.
- Verify Main Concept apply/restore history and that prior valid project summary survives failure.
- Verify scheduled worker actually runs and processes pending jobs.
- Verify all secrets exist only in GitHub/Supabase secret storage, never committed or sent to the browser.

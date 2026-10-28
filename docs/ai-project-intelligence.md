# AI Project Intelligence — H871

## Decision record

- AI provider: Gemini API first.
- Cost: free-tier eligible model/API only. No automatic billing, paid model, or paid fallback.
- Project update policy: automatically update project description and tags from the designated Main Concept analysis.
- Recovery: keep analysis versions and project snapshot history; restoring a snapshot must itself be recorded as a new history event.
- Scope: AI reads supported original files and returns structured engineering information. H871 orchestrates upload, job status, response validation, persistence, project updates and history; it does not implement its own document parser/OCR as a replacement for AI reading.
- Database: do not modify live schema/RLS until the existing migrations and actual deployed schema have been compared. An additive migration is expected for full analysis history and restore.

## Target flow

1. An editor creates a project using project name, project code, customer, and an optional private note. The private note remains separate from AI-generated description.
2. The editor uploads a document. Each document/version is stored in the existing private h871-project-documents bucket and gets its own analysis job.
3. A server-side function checks user authorization, reads the stored file, calls the configured Gemini API model, validates structured JSON, and records the result. The Gemini API key is a server secret, never frontend code.
4. The analysis result includes: concise summary, technical scope, key equipment/components, requirements/specifications, risks/assumptions/open questions, suggested tags, and source references/page numbers where the provider can supply them. Keep provider/model, run timestamp, status and error details.
5. The user designates a document/version as Main Concept. On successful analysis, H871 automatically applies that version's summary to the project description and its suggested tags to projects.tags, recording the previous and new values and the selected document/version.
6. Switching Main Concept re-applies the selected version's last successful analysis without deleting or overwriting any other document's analysis. If no successful analysis exists, keep the current project description/tags and explain why.
7. Restore selects a historical project snapshot and reapplies it as a new event. Never delete history during restore.

## Initial schema review

Existing migrations provide:

- projects.description and, from migration 0003_project_tags.sql, projects.tags.
- documents.summary, documents.version_label, documents.sha256, documents.relative_path, and project linkage.
- A private h871-project-documents storage bucket and editor/admin upload policies.

Not currently represented in the checked-in migrations:

- a canonical Main Concept document/version reference;
- immutable per-run AI analysis records and their structured fields;
- project description/tag snapshot history and restore events;
- an explicit analysis job state/retry/idempotency record.

Therefore, documents.summary alone is insufficient for the requested versioned analysis/history/restore behavior. Before implementation, add a narrowly scoped additive migration only after checking the deployed schema. Do not rewrite existing policies or weaken RLS. New tables must enable RLS and use the existing public.has_hub_role(array['admin','editor']) authorization pattern for writes.

## Free-tier and failure policy

- Configure only a model/API confirmed to be eligible for a free tier at implementation time.
- Never enable Google Cloud billing or a paid tier automatically.
- If the free quota is exhausted, the model is unavailable, or a request would require paid service, stop and show a clear status; do not silently switch providers/models.
- Keep uploads and analysis disabled until the workspace owner confirms external-AI use is permitted for the relevant data. Use synthetic documents for initial tests.
- Do not claim that free tier means unlimited, permanent, or appropriate for confidential company documents; verify current terms and limits before production use.

## Implementation phases

1. Schema reconciliation: inspect the live Supabase schema and current migration state; prepare an additive migration for analysis runs, Main Concept selection and project history only if required.
2. Server-side AI boundary: implement a Supabase Edge Function (or approved server-side runtime), secrets configuration, authorization checks, file-type/size checks, structured output validation, and free-only failure behavior.
3. Per-document analysis: persist each run independently and expose status/result in the project document UI.
4. Main Concept and project history: select a document version, auto-apply its successful summary/tags, and provide history/restore controls.
5. Verification: test with synthetic files and editor/viewer accounts; check Main Concept switching, failed runs, duplicate requests, restore history and RLS before real data.

## Current implementation status

This file records the approved design. It does not mean the Gemini integration has been deployed or that database migrations have been applied. The current repository frontend uses static JavaScript and Supabase; no Gemini secret may be added to frontend/ or .env.example as a browser-visible value.

## Live schema and RLS observations (user-provided, 2026-10-29)

The workspace owner ran read-only queries in the deployed Supabase SQL Editor and supplied these results. They are user-provided observations, not a direct live database connection from this tool.

Confirmed columns:

- `projects`: `id`, `code`, `name`, `description`, `status`, `created_by`, `created_at`, `updated_at`, `tags`.
- `documents`: `id`, `project_id`, `customer_id`, `title`, `original_filename`, `file_type`, `relative_path`, `sha256`, `version_label`, `source_kind`, `source_uri`, `extracted_text`, `summary`, `status`, audit fields, and timestamps.
- `user_roles`: `user_id`, `role`, `created_at`.
- The query returned no rows for `project_ai_analyses` or `project_change_history`, so those tables were not found under those names in the queried public schema.

Reported RLS policies:

- `projects` and `documents`: authenticated users can SELECT with `qual = true`; admin/editor roles can manage rows through `public.has_hub_role(ARRAY['admin','editor'])`.
- `user_roles`: users can read their own role (admins can read all); only admins can manage roles.
- RLS is enabled and FORCE RLS is disabled on `projects`, `documents`, and `user_roles`.

Implementation implications:

1. Preserve the current shared-read/admin-editor-write pattern unless an explicit product requirement changes it; do not silently broaden write access.
2. Additive schema is likely needed for Main Concept selection, immutable per-version analysis runs, and project change/restore history. Check migration history and exact deployed definitions before preparing the migration.
3. New tables must enable RLS and have explicit SELECT/INSERT policies that match intended roles. AI analysis and history writes should not be trusted to browser code; enforce authorization in the server-side function and database policies.
4. The results do not validate Storage policies, Edge Function authorization, function grants, or secrets configuration; verify those separately before enabling external AI calls.
5. No live schema or RLS change has been applied as part of this review.

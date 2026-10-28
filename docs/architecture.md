# Initial architecture

## Goals

1. Find engineering information across projects, customers, files, calculations and lessons learned.
2. Preserve traceability from every extracted or AI-generated statement to its source.
3. Support repeatable local ingestion with file hashing, duplicate detection and error logs.
4. Start without requiring paid AI APIs.
5. Keep the source files in a company-approved folder or network share instead of exposing them publicly.

## Components

- Static frontend: GitHub Pages.
- Database: a dedicated Supabase project, subject to quota, privacy approval and RLS tests.
- Source-file store: approved company folder/network share.
- Local processor: Python on Windows for PDF, Excel and DOCX extraction; OCR only where required.
- AI analysis: manual NotebookLM workflow initially, with structured JSON/CSV import; optional API integration later after reviewing privacy and cost.

## Initial entities

- profiles and roles
- clients
- projects
- documents and document_versions
- document_chunks
- calculations
- knowledge_entries
- tags and entity_tags
- project_documents
- project_knowledge
- knowledge_sources
- document_jobs

## Data quality

Each document has a stable identifier and SHA-256 hash. Re-running ingestion must not create duplicate documents. Extracted chunks should include page, worksheet/cell range, or section references. AI outputs start as pending review; reviewed engineering facts must not be silently overwritten by later AI runs.

## Deployment boundaries

This repository must not be connected to, or overwrite, the existing personal website's repository or Supabase project. Use a separate database project and separate credentials.

## AI Project Intelligence (approved direction)

- Provider: Gemini API first, using only a model/API configuration confirmed to have an available free tier. Do not enable billing or paid-only features automatically. If the free quota is unavailable or exhausted, stop the job and show a clear message; never silently fall back to a paid model.
- File understanding: send the original supported document to the AI provider for document understanding. Do not build a custom PDF/Office parser or OCR pipeline as a substitute for AI reading. Validate the provider's structured response and preserve source references when available.
- Backend boundary: the browser must never call Gemini with a secret key. Use a server-side Supabase Edge Function (or another explicitly approved server-side runtime) with the Gemini key stored as a server secret. Do not use the Supabase service-role key in the browser.
- Document analysis: each uploaded document/version has its own immutable analysis result, including summary, technical scope, key equipment, requirements, risks/open questions, suggested tags, provider/model, timestamps, status, and error details. Analysis starts unreviewed; retain the source document identifier and version context.
- Main Concept: a project points to one designated Main Concept document/version. When it changes, derive the project description and tags from that version's successful analysis. Preserve the separate user note and keep a before/after snapshot in project history so changes can be audited and rolled back. A failed or incomplete analysis must not replace the last valid project description/tags.
- History/restore: store each analysis run as a new record rather than overwriting prior analysis. Store each applied project snapshot as a history record; restore creates a new current state from the selected historical snapshot instead of deleting history.
- Data model impact: the current schema already has documents.summary, documents.version_label, projects.description, and projects.tags, but no confirmed analysis-run history, Main Concept pointer, or project-description/tag revision history. A small additive migration will likely be required for full history and restore. Do not apply it until the migration is reviewed and the current live schema is confirmed.
- Cost controls: free-tier only; no billing enablement, paid model fallback, or paid third-party service. Check model availability and current free-tier quotas before enabling. Fail closed when the configured model is not free-eligible.
- Confidentiality: source files may contain customer or company confidential information. Keep real files out of GitHub. Do not send files to an external AI until company policy permits it; offer a disabled-by-default integration setting until approved.
- Testing: use synthetic, non-confidential sample documents first; verify upload, AI response validation, per-version history, Main Concept switching, automatic description/tag update, restore, role enforcement, and failure handling before importing real files.

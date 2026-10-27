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

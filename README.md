# Engineering Knowledge Hub — H871

A free-first engineering knowledge base for automation machine design: projects, customers, technical documents, calculations, lessons learned, and searchable knowledge.

## Safety principles

- This repository is separate from all existing websites and databases.
- Never commit source documents, customer drawings, credentials, API keys, or confidential company data.
- Do not put Supabase `service_role` keys or other secrets in browser code.
- Keep source documents in an approved company folder/network share; store metadata and searchable extracted text separately.
- AI-generated information must retain source references and remain marked as unreviewed until verified.

## Current stage

Repository bootstrap only. No database is connected and no existing project has been changed.

## Planned architecture

- `frontend/`: static web interface, deployable through GitHub Pages.
- `database/`: SQL schema, access policies, migrations and sample data.
- `processor/`: local Windows Python tools to scan approved folders, hash files, extract text/tables and prepare records for review.
- `schemas/`: structured data contracts for documents, calculations and knowledge entries.
- `docs/`: architecture, security and import workflow.

## Initial setup

1. Confirm the repository is intended to be public. If company policy requires privacy, change it to private before adding real project details.
2. Keep all confidential documents out of GitHub.
3. Choose a separate database project for this Hub; do not reuse the Supabase project of another website.
4. Start with synthetic/sample data and test access rules before importing real information.
5. Pilot 20–30 representative files before processing the full library.

## Cost and availability

The design avoids paid services as a requirement, but free-tier limits and service availability can change. Supabase Free projects may pause after inactivity, so do not treat it as guaranteed always-on storage. Keep independent backups.

## Planned modules

- Global Search
- Projects
- Customers
- Documents and versions
- Engineering knowledge and lessons learned
- Calculations and assumptions
- Intake/review queue
- Source citations (PDF page, Excel sheet/cell range, or document section)

## Status

Bootstrap commit: documentation and starter frontend only. Database, authentication, ingestion, and deployment are not configured yet.

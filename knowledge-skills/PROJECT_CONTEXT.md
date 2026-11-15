# H871 Project Context

Last consolidated: 2026-11-15 (Asia/Ho_Chi_Minh). This is a working summary; verify all live state before changes.

## Purpose and owner intent
H871 is a professional engineering knowledge hub for automation machine design and industrial automation. It should accumulate project/customer history, technical documents, engineering calculations, reusable knowledge, and lessons learned so future design work becomes faster and more accurate.

Core user context: automation machine design engineer. Discuss project work in Vietnamese; keep technical names, code, and UI labels in their conventional English form.

## Hard constraints
- Free-first; no paid services, billing activation, or paid fallback as a workaround.
- Preserve existing data and working behavior.
- Incremental, narrowly scoped implementation.
- No unnecessary database schema, migration, or RLS changes.
- Never expose credentials, service-role keys, Gemini keys, customer drawings, or confidential company data.
- AI-generated engineering content remains a suggestion until verified; preserve source traceability.
- Clearly distinguish source/CI validation from actual live browser acceptance.

## Repository / services
- GitHub: `hunghoang8711/engineering-knowledge-h871`
- Main branch: `main`; routine knowledge updates should be committed directly to main.
- GitHub Pages: `https://hunghoang8711.github.io/engineering-knowledge-h871/`; Pages publishes `frontend/`.
- Supabase project ref: `hwynbpvorlusicgafuxs`; region: `ap-southeast-1`.
- Private Storage bucket: `h871-project-documents` (reported 50 MB limit).
- Existing role model: admin/editor write access via `has_hub_role`; preserve deployed RLS.
- Earlier environment check found no `pg_cron`; verify before relying on it.
- Current repo has `frontend/`, `docs/`, `supabase/`, and GitHub workflows. Inspect actual files before assuming paths or status.

## Product / UI decisions
- Project-centric workspace: projects, customers, documents, AI analysis, Knowledge Library, calculations, Time Chart.
- Fixed left navigation and separate pages; avoid fragile hash-only navigation.
- No Global Search tab, no separate global Documents tab.
- No separate global Time Chart Library. Saved charts are accessed within their project.
- Time Chart can be opened directly from its card; avoid redundant Open button when card itself navigates.
- Delete actions should be protected behind an overflow menu to reduce accidental deletion; clicking outside closes the menu.
- Keep UI professional, compact, readable, and consistent.
- Shared brand assets live under `frontend/assets/brand/`; logo is centralized.

## AI Project Intelligence
- Gemini-first, free-tier only; original PDF should be analyzed as a whole including diagrams and images.
- Do not replace multimodal understanding with a self-built text-only extraction pipeline.
- Initial analysis scope was PDF; do not assume Office analysis is supported merely because files can be stored.
- Main Concept revision drives project summary/tags/description. Preserve analysis history and restore history; failed runs must not overwrite last valid results.
- Original synchronous Edge Function hit execution/time/resource failures (reported 150-second limit, 546 compute resource, Gemini 503). Async queue + worker was chosen.
- User-reported synthetic success: project `TEST2026-01`, file `H871_Gemini_Synthetic_Test.pdf`, output summary “Automated Sample Handling Demonstrator” and tags Pick-and-place, Six-axis Robot, Pneumatic Gripper, Automation Cell, Sample Handling.
- `enqueue-analysis` was reported deployed; scheduled GitHub Actions worker was discussed. Verify current workflow, secrets, queue, and Supabase deployment before relying on this state. No paid fallback.

## Time Chart / Cycle Time Builder
- Integrated page: `frontend/cycle-time-univer.html`; standalone lab: `frontend/time-chart-lab.html`.
- Spreadsheet engine: Univer 1.4.0. XLSX handling uses browser-side ExcelJS.
- Project-linked persistence uses `public.project_cycle_time_charts` and existing `chart_data` JSONB. Migration 0011 was reported created; inspect live schema before any migration.
- No separate global Time Chart listing.
- Spreadsheet is the source of truth. Keep row order as displayed in Excel; operation parsing must not depend on fixed row numbers or assume no blank rows.
- Time bars extend from Start Time to End Time. Support Start + Duration → End, with End editable where intended.
- User needs formula support for cell references and basic arithmetic (`=B1`, `=B1+C5`, subtraction, multiplication, division); verify formulas against real workbooks.
- XLSX import supports multiple rectangular source ranges appended vertically in selection order; verify equal column widths, duplicate headers, formula offsets, and saved/reopened content.
- User wants multi-range paste/import and persistent role/range setup after re-import.
- Process Flow is derived from Spreadsheet formulas but must remain editable. Auto formula links are suggestions that can be dismissed without changing formulas; manual links can be created/removed independently.
- Automatic layout uses dependency layers, crossing-reduction sweeps, orthogonal routing, and shortest of 16 source/target port pairs. It is not yet a global obstacle-avoiding router.
- Stable Operation IDs, not row numbers, should anchor dependencies and dismissed suggestions so worksheet row changes do not break identity.
- Preserve current Cycle Logic, simulation, resource assignments, and flow editor when changing visual routing.
- Current open verification from latest history: retest dashed formula suggestion click/dismiss on live chart after pointer-events fix; verify persistence, restore, manual links, and Undo/Redo. Also verify latest Excel-to-workflow linkage after blank-row deletion/re-import.

## Other engineering tools / CAD
- Creo Elements/Direct Modeling 18.1 (not Creo Parametric); user uses basic Lisp and wants practical menu/ribbon/user-input-line workflows.
- AutoCAD 2023 and Inventor 2021 are also in the user's environment.
- Creo Lisp tooling discussions include density/material diagnostics, assembly part filtering, results-browser selection, Select All, Apply, and BOM-like selectable results. User reported prior failures involving undefined `SEL_ITEM-P`, command-line invocation, and host-window embedding. Exact final code state must be retrieved from the relevant GitHub files before further edits.
- User prefers reusable versioned Lisp files (e.g. ver02/ver03) integrated into main knowledge repository, rather than creating a branch for each iteration. Consolidate source, skills, tests, and lessons in one coherent location.

## Source of truth and limitations
Detailed chronology: `docs/PROJECT_MASTER_HISTORY.md`. It contains extensive implementation notes and test status through 2026-11-14. Git commit history contains additional proof of individual code/documentation changes.
This package is based on retained project memory, conversation summaries, current master-history content, and commit evidence. It is not a verbatim export of every message from every historical ChatGPT thread. Where exact transcripts are unavailable, do not invent them. New sessions should add newly recovered details here and in the master history.

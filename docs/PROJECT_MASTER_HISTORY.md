# H871 — Project Master History & Operating Context

> **Purpose:** This is the canonical handover/context file for future H871 work. Read it before starting a new task or a new ChatGPT conversation. After every implementation, correction, configuration change, migration, deployment, or meaningful decision, append a dated entry to **Development log** and update the relevant status sections.
>
> **Timezone:** Asia/Ho_Chi_Minh (UTC+07:00). Record timestamps with timezone.
> **Last consolidated:** 2026-11-08 01:32 +07:00.
> **Repository:** https://github.com/hunghoang8711/engineering-knowledge-h871
> **Live site:** https://hunghoang8711.github.io/engineering-knowledge-h871/
>
> **Completeness note:** This file consolidates the H871 context available from retained project conversations, project memories, existing repository documentation, and GitHub commit/workflow history inspected on 2026-11-08. It is not a verbatim export of every ChatGPT message ever exchanged; some early conversation details and exact dates are not available. Where facts came from user-reported dashboard/SQL observations, they are labelled as such. Never convert an unverified report or design draft into a claim of live deployment.

---

## 1. Project purpose and product vision

H871 (Engineering Knowledge Hub) is a professional engineering knowledge system for automation machine design and industrial automation engineering.

Long-term objectives:
- Centralize searchable knowledge across projects, customers, documents, calculations, engineering decisions, and lessons learned.
- Preserve customer/project history and traceability from extracted or AI-generated information to the source document, page, worksheet, or cell range.
- Turn accumulated project experience into reusable engineering knowledge and faster future machine-design work.
- Provide a practical, project-centric workspace rather than a loose collection of documents.
- Keep the system maintainable, incremental, and cost-free where possible.

Primary user context: automation machine design engineer. The system should support engineering workflows and technical records, not generic document management alone.

### Non-negotiable product principles
1. **Free-first:** no paid infrastructure, billing activation, paid model fallback, or paid third-party service as a hidden requirement. Free-tier limits may change; never imply free means unlimited.
2. **Preserve data:** do not overwrite existing sites, repositories, Supabase projects, customer/project records, or saved charts. Back up and inspect before risky changes.
3. **Incremental delivery:** implement one clearly scoped change at a time; check repository state and current deployment before writing.
4. **No unnecessary schema/RLS changes:** prefer existing data structures. Additive migrations only when essential, after read-only schema reconciliation and explicit review.
5. **Security and confidentiality:** never commit company/customer source files, drawings, credentials, tokens, API secrets, or confidential extracted text to this public repository. Never expose Supabase service-role or Gemini secrets in browser code.
6. **Traceability:** preserve source document/version and AI analysis history; distinguish AI suggestions from verified engineering facts.
7. **Honest verification:** a GitHub commit is not proof of runtime correctness. A successful Pages workflow proves deployment workflow completion, not that a feature works in a real browser or against live Supabase. State exactly what was and was not tested.
8. **No silent fallback:** if a free service/model/quota is unavailable, report the failure clearly rather than switching to paid services.
9. **Language:** discuss project work in Vietnamese unless English is needed for technical names, code, UI labels, or explicit translation.

---

## 2. Repository, hosting, and backend

### GitHub
- Repository: `hunghoang8711/engineering-knowledge-h871`
- Visibility: public (changed from private because GitHub Free personal Pages hosting was desired).
- Default branch: `main`.
- GitHub Pages: https://hunghoang8711.github.io/engineering-knowledge-h871/
- Main directories: `frontend/`, `docs/`, `supabase/`, plus repository configuration and workflows.
- Pages workflow: `.github/workflows/pages.yml` (workflow name: “Deploy Engineering Knowledge Hub H871”).
- Latest repository head verified on 2026-11-08 01:32 +07:00: commit `167d3a37eb3ae3145db07bce825ae7ab6fbb51ce` (“Restore project save completion after XLSX import refactor”).
- Latest deployment workflow verified: run `42401288128`, completed with conclusion `success`, head commit `167d3a37...`. This confirms the Pages workflow completed; it does not prove browser/runtime feature correctness.

### Supabase
- Project ref: `hwynbpvorlusicgafuxs`
- Region: `ap-southeast-1`
- Storage bucket: `h871-project-documents`, private.
- User-reported bucket configuration in prior checks: 50 MiB limit and PDF/Word/Excel/PowerPoint allowed for storage. The initial AI analysis endpoint was narrower (PDF only).
- Authenticated login works; user account has admin role (user-reported).
- Existing access model: shared/read access for signed-in users where configured; write operations restricted to admin/editor using `public.has_hub_role(ARRAY['admin','editor'])`. Preserve actual deployed policies; verify before changing.
- RLS was reported enabled on core tables; FORCE RLS false. Do not weaken or replace policies.
- No `pg_cron` / `cron.job` was available in the reported environment at the time checked. `pg_cron_installed=false`; a query against `cron.job` failed with SQLSTATE 42P01 because the relation did not exist.
- Do not assume the current live Supabase state without checking it. Repository SQL files can be drafts and may not have been run.

### Privacy / cost
- Do not reuse another personal website's Supabase project or repository.
- Do not put confidential files in this public GitHub repo.
- Source files should remain in an approved private company location / private Storage bucket, subject to company policy.
- The user has explicitly preferred no paid services and has reported that the Google Cloud project did not have a billing account. Never enable billing or add a payment method as a workaround.
- External AI processing of real company/customer files requires company approval.

---

## 3. Product scope and UI/UX decisions

### Core information architecture
- Project-centric system: projects, customers, project-linked documents, AI analysis, knowledge library, calculations, Time Chart, and later reusable lessons learned.
- Customer can be an end user or an intermediary; intermediary records can retain the end-user name.
- Project detail view is the primary place for project-specific content and actions.
- Customer/project cards should be clickable as a whole where appropriate.
- Project card pattern: code — name — update time — note.
- Project detail header preference: project description on the left; Customer / End user information card on the right with edit affordance.
- Fixed left navigation; separate pages (e.g. `projects.html`, `customers.html`, detail pages) rather than fragile hash-only navigation.
- Profile/logo menu for account actions.
- Search/filter controls should match the project-list interaction style; hide irrelevant project filters on detail pages.
- Readable ChatGPT-like typography; AI headings should be sufficiently prominent.
- No separate global Documents tab and no Global Search tab in the agreed current navigation.
- **Time Chart Library rule:** do not create a separate page listing all Time Charts. Users open a chart from that specific project's detail page. Creation remains accessible from Knowledge Library and the relevant project detail page.
- Overview roadmap should communicate project status and planned modules.

### Current / known project-specific identifiers
- Test project: `TEST2026-01`, name “test AI analyssis” (synthetic test).
- Time Chart test project UUID: `40ec0707-5b68-4d55-926d-021cfe752b4d`.
- Saved chart UUID: `35b462a8-e517-47a2-b9d6-8095322cb626`.
- Integrated chart URL:
  https://hunghoang8711.github.io/engineering-knowledge-h871/cycle-time-univer.html?project_id=40ec0707-5b68-4d55-926d-021cfe752b4d&chart_id=35b462a8-e517-47a2-b9d6-8095322cb626
- Standalone Univer test lab:
  https://hunghoang8711.github.io/engineering-knowledge-h871/time-chart-lab.html

---

## 4. Main modules and implementation status

Status labels:
- **Implemented / user-confirmed:** code exists and user has confirmed at least the described behavior.
- **Committed / workflow passed:** GitHub commit and CI/Pages workflow exist; browser/live integration may remain untested.
- **User-reported live state:** based on user-provided observations, not direct database access in this summary.
- **Planned / draft:** design or repository code exists but production deployment is not confirmed.
- **Open issue:** user reported a defect or verification is still required.

### 4.1 Authentication, roles, projects, customers, documents
- Authentication and role-based workspace are active (user-reported).
- Project/customer relationship management has been developed.
- Customer type supports End user and intermediary/customer role; end-user name can be stored for intermediary relationships.
- Project-linked document management and private Storage were added.
- Project detail and customer/project navigation have been refined over time.
- Exact current page behavior should be inspected in source before modifying; do not assume every old UI description remains unchanged.

### 4.2 AI Project Intelligence

**Product decision**
- Gemini API first, only a model/API confirmed eligible for a free tier at time of use.
- AI should analyze the original PDF as a whole, including images, diagrams, and technical drawings. Do not replace multimodal analysis with a self-written local text extractor/OCR pipeline because the user values whole-document understanding.
- Current first supported analysis format: PDF. Office document storage may exist, but Office analysis is not assumed supported.
- Output headings in English (e.g. “Technical scope”) are acceptable while content may be Vietnamese. Tags should prioritize English.
- Analysis should capture: summary, technical scope, key equipment/components, requirements/specifications, risks/assumptions/open questions, suggested tags, and source references where available.
- Main Concept document controls project description/summary and tags when a successful analysis is applied. Keep user private note separate.
- Every analysis run must be preserved; Main Concept switching must not erase previous analyses. Restore must create a new history event rather than deleting old history.
- Failed/incomplete analysis must not replace the last valid project description/tags.

**Relevant schema / functions**
- `project_ai_analyses`: provider/model/status/result/summary/technical_scope/key_equipment/requirements/risks/open_questions/suggested_tags/source_references/errors/requested_by/timestamps (fields as described in prior schema notes; inspect live schema before relying on exact columns).
- `project_change_history`: project snapshots / change history.
- `projects.main_concept_document_id`.
- `project_customers.end_user_name`.
- RPCs/functions mentioned: `apply_main_concept`, `restore_project_history`, `has_hub_role`.
- Storage bucket `h871-project-documents` is private.
- RLS enabled on relevant tables (user-reported), FORCE RLS false.

**Worker / timeout history**
- Original synchronous Edge Function attempted authorization, Storage download, PDF-to-Base64 conversion, Gemini call, response validation, and persistence in one request.
- It encountered Supabase Edge Function execution limits (reported 150-second timeout), “546 not enough compute resources”, and Gemini 503/quota/availability errors. Re-analysis of already-analyzed files also exposed long-running behavior.
- User explicitly rejected a separate custom text extraction stage because it would reduce multimodal analysis quality.
- A durable asynchronous queue + separate worker was chosen to let Gemini processing happen outside the request/response path.
- User-reported successful synthetic test: `TEST2026-01` / “test AI analyssis” with `H871_Gemini_Synthetic_Test.pdf`; job went queued → succeeded, produced Gemini interaction ID, summary “Automated Sample Handling Demonstrator”, and tags Pick-and-place / Six-axis Robot / Pneumatic Gripper / Automation Cell / Sample Handling. User confirmed Main Concept behavior worked for that test.
- User-reported latest re-analysis file UUID: `8f2ba9d7-bb2f-4c40-8450-9b99ebacb9c6`; queue row was queued, attempt_count 0. An older failed row had attempt_count 2 and error “Gemini interaction ended with status: failed.”
- User reported successful deployment of Supabase Edge Function `enqueue-analysis` after resolving Supabase CLI / PowerShell script execution issues. Do not infer that every worker/scheduler component is deployed merely from this.
- The project has no `pg_cron` available in the earlier check. GitHub Actions scheduled worker polling was discussed/tested; user said relevant settings were enabled and scheduled workflows left running. Verify actual workflow state and secrets before relying on it.
- No paid fallback. A quota exhaustion or unavailable free model must stop visibly.

**Important discrepancies to reconcile**
- Some checked-in docs (e.g. earlier status sections in `docs/ai-project-intelligence.md` and `docs/async-analysis-job-contract.md`) describe implementation as draft/not deployed, while later user-reported updates say the queue and `enqueue-analysis` were deployed and synthetic test succeeded. These documents are historical and may be stale. Before any AI worker changes, inspect current GitHub code, Supabase live state with read-only preflight, and workflow configuration. Do not replay migration 0004 blindly.
- Existing migration drafts include migrations 0004 and 0007; check the current live schema before running anything. User reported that the Main Concept/history objects already existed, so do not reapply migration 0004.

### 4.3 Time Chart / Cycle Time Builder

**Purpose and user requirements**
- A project-linked editable spreadsheet to build and store machine/automation cycle-time charts.
- Prefer a real spreadsheet engine/library over a custom spreadsheet/formula implementation. Univer 1.4.0 was selected after an isolated lab.
- Spreadsheet needs editable cells, copy/paste, keyboard navigation, undo/redo, row/column insertion/deletion, resizing, text wrap, alignment/formatting, formula preservation, XLSX import/export, save/load to project.
- Users may add/delete rows and columns. Descriptive columns can remain text. Time Chart role columns should be configurable and unique where applicable: Cluster, Start Time, Duration Time, End Time. User also requested font color, alignment, and editable imported values.
- Default template has Mechanism, Operation, Start (s), Duration (s), End (s), Remark. Default End formula is Start + Duration, but End remains manually editable; clearing manual override restores formula.
- Time Chart chart should show each operation bar from Start Time to End Time, not merely duration; operation rows should remain in the same order as Excel rows (no grouping/sorting by mechanism).
- Time Chart is viewed from the relevant project detail page; no global library listing.

**Architecture / persistence**
- Integrated page: `frontend/cycle-time-univer.html`.
- Uses Univer 1.4.0; standalone test page `frontend/time-chart-lab.html`.
- Uses existing Supabase `project_cycle_time_charts.chart_data` JSONB; no new table required for current worksheet data.
- Chart payload includes `engine: "univer"`, `engineVersion: "1.4.0"`, `univerSnapshot`, plus legacy compatibility fields such as `rows`, `customCols`, `columnRoles`, `columnLabels`; version noted as 6.
- Integrated page reads `project_id` and optional `chart_id`; loads project/chart, supports save/load, and uses current login.
- XLSX import/export uses browser-side ExcelJS; no paid Univer Exchange backend.
- Backup/Restore JSON controls exist.
- Existing chart data is stored in `chart_data`; avoid migrations unless current code/schema proves necessary.

**Custom Time Chart data mapping**
- Data Range Configuration panel provides A1 range fields for Cluster, Operation, Start, Duration, End, Remark.
- Supports ranges such as `A2:A15` and absolute refs like `$C$4:$C$20`; current parser supports single-column mapping ranges and validates descending rows/multi-column input.
- Auto Detect attempts to match English/Vietnamese headers.
- Records are aligned by row position; Start is required and Duration or End must be available; missing Duration/End can be derived. Blank Cluster defaults to `Unassigned`.
- Mapping config is saved as `dataRangeConfig` in chart payload.
- This is different from the latest XLSX import multi-range feature below.

**Latest XLSX import requirement and implementation (2026-11-07)**
- User reported that imported XLSX data did not all appear; first formula cells were present, later cells were missing. User also wanted to select source data before import.
- User clarified the required behavior: choose multiple rectangular ranges during the import process, and append ranges sequentially into one continuous dataset (same column structure), not treat them as separate unrelated tables.
- Example: `A1:F20`, then `A25:F40`, appended vertically in selection order. Regions should have the same number of columns. Repeated header rows in later regions may be omitted when detected as duplicate header.
- Recent commits in the repository indicate the import flow includes worksheet selection, range preview, multiple rectangular range selection, formula translation/offset handling when appending regions, preview formatting correction, and restoration of project save completion.
- Latest verified commit: `167d3a37eb3ae3145db07bce825ae7ab6fbb51ce` (“Restore project save completion after XLSX import refactor”).
- Preceding relevant commits:
  - `36710f641145` — Add multi-range XLSX import and improve formula handling.
  - `0bdcaadd5ae6` — Correct formula offsets when appending selected Excel regions.
  - `d51e3354f30d` — Fix XLSX import flow and show selected range previews.
  - `7e55896300b9` — Correct import range preview formatting.
- Workflow runs 42401045482, 42401096243, 42401163004, 42401199418, and 42401288128 all completed successfully; latest is 42401288128 on commit 167d3a37.
- **Not yet verified in a real browser with the user's actual workbook:** formula completeness across all rows, shared/array formulas, formula recalculation in Univer, correct values in appended ranges, merged cells/styles, and save/reopen behavior after this refactor.
- User's latest outstanding report before this consolidation: formulas in early cells appear, but later cells do not all load. Typical formulas needed are cell references and simple arithmetic: `=B1`, `=B1+C5`, `=B1-C5`, `=B1*C5`, `=B1/C5`, and parenthesized combinations. This should be treated as an open verification/bug item until tested against a real XLSX sample.
- The user wants selection of the rectangular source areas **before importing**, not merely mapping columns after the entire worksheet is imported. Current implementation is reported committed; verify the actual UI and flow against that intent.

**Known Time Chart issue and lessons**
- User previously navigated to a project chart URL that appeared blank / did not load project data. A sequence of changes moved chart creation/opening into project-specific Univer route.
- An error reported as “Univer could not start” was misleading. Actual stack:
  `readWorksheetRecords → renderTimeChart → loadProjectChart → init`, error “Please specify a Start Time range…”. Root cause was unconditional chart generation on saved worksheet load when no valid saved mapping existed, not Univer connectivity.
- Fix commit `6e22cac06dbd97f62943657c718eee8cffd4a4d9`: load saved worksheet regardless; render chart only when Start and Duration/End ranges are configured; show helpful message otherwise. User confirmed “Ok bảng đã hiển thị”.
- An attempted `makeCurrent:true` workbook activation change was committed as `ba66401d4c5d`; user then reported startup/Auto Detect failure, but the error predated that commit. The option was reverted in `a216a0dc7261`; avoid attributing the original issue to the option without evidence.
- Latest timeline semantics commit: `9bf79d79eb0d375aa7f5a8d40e8c610ed7380317`, “Clarify timeline bars and preserve Excel operation order”. It maps bars from Start to End and preserves Excel row order. Workflow runs 42397514368 and 42399852852 completed successfully.
- No claim of full end-to-end browser/Supabase testing should be made unless performed.

---

## 5. Important technical/domain context

The Hub is intended for real automation machine design work. Example engineering project context discussed:
- Automated substrate panel feeding to a Meiko X-ray drilling machine, intended to reduce one operator per machine.
- LCD glass TSP / carbon dust context; plasma cleaning size 415 × 716 mm.
- Robot RS013N-A; tool + product payload about 11 kg; 6-axis robot context; average speed 400 mm/s, acceleration 0.2 s, air supply 0.5 MPa; 2-jaw PU gripper and SMC bore 25 mm.
- Camera/LumiTrax edge and D30 ±0.3 hole inspection; X-ray OK/NG; drill positions #8/#9/#10 with space constraints; largest substrate about 720 × 610 × 1.6 mm versus table constraints.
These are example engineering context, not universal assumptions. Do not expose confidential customer details in public files unless user explicitly confirms they are safe. This history file contains only a summarized, high-level example.

---

## 6. Error / root-cause / lesson register

| Date / area | Symptom or error | Root cause / evidence | Resolution / lesson |
|---|---|---|---|
| 2026-10-29 onward — AI analysis | Synchronous analysis exceeded Edge Function execution window; reported 150s timeout, 546 “not enough compute resources”, Gemini 503/failure | One HTTP invocation did file download, Base64 conversion, Gemini processing, validation, and persistence; provider latency can exceed invocation window | Move long Gemini work to durable queue + separate worker. Do not solve by merely raising file limit or adding local text extraction. |
| 2026-10-31 — database inspection | Querying `cron.job` failed with SQLSTATE 42P01 | `cron` schema/table absent; `pg_cron` not installed | Do not assume Supabase Cron exists. Use read-only extension checks; choose only a verified no-cost worker/scheduler. |
| 2026-11-07 — Time Chart load | “Univer could not start” with “Please specify a Start Time range” | Chart rendering was called unconditionally after loading a saved worksheet with no valid mapping; error wrapper incorrectly blamed Univer initialization | Commit 6e22cac: decouple worksheet loading from chart rendering; show mapping guidance. User confirmed worksheet displayed. |
| 2026-11-07 — Univer activation | Tried `makeCurrent:true`; startup/Auto Detect issue was reported | The error was already present before the change; API option was unnecessary and was reverted | Do not infer causality from temporal order alone. Revert unnecessary API changes and inspect stack traces. |
| 2026-11-07 — Time Chart visualization | Bars/time chart hard to understand | Original chart did not clearly communicate Start-to-End interval and row ordering | Commit 9bf79d7: bars span Start→End and preserve Excel row order. Workflow passed; browser behavior still needs user verification. |
| 2026-11-07 — XLSX import | Later cells/formulas not fully imported; early formula cells appeared | Exact root cause not yet proven. Commit history shows fixes for formula offsets, import flow, range previews, and save completion. Shared/array formulas and cached formula values remain to be tested | Latest import commits 36710f6… through 167d3a3…; verify against representative workbook before calling resolved. |
| 2026-11-07 — multi-range formula mapping | Appended ranges can shift formula references incorrectly if offsets are not translated | Formula cell references need relative/absolute reference-aware offset adjustment when ranges are vertically concatenated | Commit 0bdcaadd; test relative refs, absolute refs, mixed refs, cross-range references, and formulas beyond first row. |
| 2026-11-07 — import refactor save action | Project save completion regressed during XLSX import refactor | Commit title indicates save completion needed restoration; inspect diff if modifying same flow | Commit 167d3a3 restored save completion; always regression-test Save after import changes. |
| Earlier navigation / routing — Time Chart | Duplicate nav entries, hash/back navigation, wrong route/blank project chart | Navigation and project context were split across hash routes and placeholder links | Move to direct page routes and carry `project_id` / `chart_id`; validate links from project detail and Knowledge Library. |

**General lessons**
- Capture the exact console/stack error before changing unrelated subsystems.
- Separate initialization failures from optional downstream feature failures; a chart mapping error must not be reported as a spreadsheet engine failure.
- Keep the spreadsheet editable and source values/formulas distinct; do not flatten formulas into values unless explicitly requested.
- When appending ranges, formula references require correct relative/absolute translation and must be tested after concatenation.
- Every import refactor must test: preview, import, formulas, row/column order, chart generation, save, reload, and export.
- Never report “fixed” solely because CI passes. CI/deployment and runtime behavior are separate verification gates.

---

## 7. Key Time Chart repository milestones (verified GitHub history, 2026-11-07)

This is a compact milestone list; the Git commit history remains the authoritative detailed code history.

- `5b5f188bdbf6` — Add H871 Cycle Time Builder.
- `57df6194292e` — Link Cycle Time Builder to H871 projects.
- `779a38530377` — Add safe migration for multiple project Time Charts (verify whether applied before any DB operation).
- `497fd4c4176b` — Integrate Time Chart into Knowledge Library.
- `671d351e71ff` — Move Cycle Time Builder under Knowledge Library.
- `e191b523d99d` — Keep saved Time Chart navigation within project detail.
- `e8bee1c6944d` — Rebuild Time Chart worksheet with editable spreadsheet input cells.
- `634670ab016d` — Flexible worksheet row/column editing, resizing, and text wrapping.
- `48001c9e5a07` — Editable XLSX import with formula preservation.
- `c0c81ae02993` — Enhance Time Chart import, formulas, and worksheet editing.
- `54bead42ff13` — Configurable chart column roles and worksheet formatting controls.
- `c2620d2434dc` — Correct XLSX formula reference translation and recalculate on export.
- `aaebefbdfe22` — Persist column names and preserve manual End Time overrides.
- `6640cfdc13a2` — Fix XLSX worksheet selection and restore saved formulas.
- `2f50958af91d` — Fix Cycle Time Builder script initialization and chart persistence.
- `6eeb6b53f211` — Add Univer-powered project Time Chart editor with Supabase persistence.
- `aca854910f15` — Generate timeline chart from imported Univer worksheet cells.
- `d4a361d78a15` — Add configurable worksheet ranges for Time Chart generation.
- `6e22cac06dbd` — Prevent missing range mapping from blocking saved worksheet load.
- `9bf79d79eb0d` — Clarify timeline bars and preserve Excel operation order.
- `36710f641145` — Add multi-range XLSX import and improve formula handling.
- `0bdcaadd5ae6` — Correct formula offsets when appending selected Excel regions.
- `d51e3354f30d` — Fix XLSX import flow and show selected range previews.
- `7e55896300b9` — Correct import range preview formatting.
- `167d3a37eb3a` — Restore project save completion after XLSX import refactor.

All commit IDs above are abbreviated; use GitHub for full SHAs and diffs.

---

## 8. Current open issues / next verification priorities

### Priority 1 — XLSX formula and data completeness
- Obtain a representative, non-confidential test workbook or synthetic workbook with formula cells at the beginning, middle, and end of ranges.
- Verify simple formulas: `=B1`, `=B1+C5`, `=B1-C5`, `=B1*C5`, `=B1/C5`, parentheses, relative refs, absolute refs (`$A$1`), mixed refs (`A$1`, `$A1`).
- Verify shared formulas, array formulas, formulas with cached results, blank formula results, and formula chains.
- Confirm later rows/cells are not dropped; compare source and imported row/column counts.
- Verify multiple rectangular regions are previewed and appended vertically in chosen order, with consistent column count and intentional duplicate-header behavior.
- Verify formulas are adjusted correctly when regions are appended.
- Confirm imported formula cells remain editable formulas in Univer and calculated values are available to chart generation.
- Confirm Save to project, reload, XLSX export, and JSON backup/restore after import.
- Do not claim all formula types are supported by Univer/ExcelJS; document supported subset and limitations.

### Priority 2 — User interaction for selecting ranges
- User requested rectangular ranges and multiple regions selected during import, appended into a continuous table.
- Current commit history indicates address-based region selection and previews. Verify exact UX. User may later prefer mouse-drag selection directly on an Excel preview; that is not confirmed implemented.
- Ensure range list supports add/remove/reorder, worksheet selection, validation, preview, and a clear final confirmation step before import.

### Priority 3 — AI worker operational verification
- Inspect live Supabase queue/job tables, deployed Edge Functions, secrets names (never reveal secret values), GitHub scheduled workflow and logs.
- Verify latest re-analysis job `8f2ba9d7-bb2f-4c40-8450-9b99ebacb9c6` state; it was user-reported queued with attempt_count 0.
- Verify whether the worker is actually polling and whether the scheduler is running.
- Verify no billing / payment method / paid fallback has been enabled.
- Test retries, lease expiry, quota exhaustion, duplicate jobs, worker interruption, malformed Gemini responses, and safe error display using synthetic PDFs.
- Reconcile stale repository docs that may still say worker not deployed with later user-reported deployment/testing.

### Priority 4 — General product polish
- Keep project/customer data intact.
- Confirm project detail Time Chart entry points and no unintended separate Time Chart library page.
- Keep all UI navigation project-centric and avoid reintroducing unwanted global Documents / Global Search navigation without user approval.

---

## 9. Required workflow for every future H871 task

### Before starting a new task or conversation
1. Read this file first: `docs/PROJECT_MASTER_HISTORY.md`.
2. Inspect current GitHub `main` head and recent commits; do not rely only on old chat summaries.
3. Inspect relevant source files and existing docs before editing.
4. For deployment-dependent tasks, inspect recent GitHub Actions status.
5. For database-dependent tasks, perform read-only schema/policy preflight first. Never replay old migrations blindly.
6. Identify what is confirmed, what is user-reported, what is merely planned, and what is unknown.
7. Keep scope narrow and preserve existing data.

### Before implementation
- State the intended change and relevant files/data.
- Check whether the feature already exists in a different form.
- Avoid editing the same file concurrently.
- Fetch the latest file version/SHA immediately before updating it.
- Never add secrets or real customer documents to GitHub.
- Do not change database schema/RLS unless necessary and approved.

### After every implementation / update / correction
Append a new entry under **Development log** with:
- Local date/time (Asia/Ho_Chi_Minh, UTC+07:00).
- Task / user requirement.
- Files, functions, tables, or configuration changed.
- Technical implementation summary.
- Commit SHA and commit URL.
- GitHub Actions workflow run ID, status, conclusion, and URL (if applicable).
- Database migration / SQL status (not started, draft, applied, verified).
- Tests performed and exact results.
- What was not tested.
- Errors encountered, exact symptom, proven root cause (or explicitly “not yet proven”), corrective action, and lesson learned.
- Remaining issues / next step.
- Whether user confirmed behavior.

Do not overwrite old log entries. Add a new chronological entry and update the current-status sections when the state changes.

### Completion language
Use accurate distinctions:
- “Committed” = GitHub accepted the commit.
- “Workflow passed” = named GitHub Actions run completed successfully.
- “Deployed” = deployment workflow succeeded for that commit.
- “Browser verified” = actual browser behavior was tested.
- “Live Supabase verified” = actual deployed backend behavior/schema was checked.
- “User confirmed” = user tested and reported success.
Never use these terms interchangeably.

---

## 10. Development log

### 2026-11-08 01:32 +07:00 — Create canonical project history / handover record
- **Request:** User asked to consolidate H871 history, goals, requirements, completed work, improvements, errors/root causes/fixes, and lessons learned into one data file in GitHub. User requires this record to be reviewed at the beginning of each new task/chat and updated after every adjustment, update, or upgrade with implementation date/time and a concise technical/error-learning record.
- **Sources consolidated:** retained H871 conversation context and memories; existing repository docs (`README.md`, `docs/architecture.md`, `docs/ai-project-intelligence.md`, `docs/async-analysis-job-contract.md`, `docs/security.md`, `docs/supabase-setup.md`); GitHub commit history and workflow runs inspected on 2026-11-08.
- **Change:** create `docs/PROJECT_MASTER_HISTORY.md` as the canonical project handover and chronological log.
- **Current GitHub state checked:** head commit before this documentation update was `167d3a37eb3ae3145db07bce825ae7ab6fbb51ce`; latest Pages workflow run `42401288128` completed successfully for that head.
- **Current open technical issue carried forward:** user reported XLSX formulas/data appear in early cells but later cells do not fully load. Multi-range import has commits and successful Pages workflow, but real workbook/browser verification remains outstanding.
- **Verification:** repository docs, 100 latest commits, and recent workflow runs were read. No application code, database schema, RLS, secrets, or live project data changed in this documentation task.
- **Limitations:** this is a consolidated summary, not a verbatim export of every historical ChatGPT message. Some early history is unavailable; uncertain deployment states are explicitly labelled.
- **Next step:** use this file as mandatory startup context; next engineering task should prioritize a controlled XLSX formula/data completeness test.

---

## 11. Source documents and useful links

- Repository: https://github.com/hunghoang8711/engineering-knowledge-h871
- Live site: https://hunghoang8711.github.io/engineering-knowledge-h871/
- Architecture: `docs/architecture.md`
- AI Project Intelligence: `docs/ai-project-intelligence.md`
- Async analysis job contract: `docs/async-analysis-job-contract.md`
- Security checklist: `docs/security.md`
- Supabase setup: `docs/supabase-setup.md`
- Latest verified Pages workflow (before this file's commit): https://github.com/hunghoang8711/engineering-knowledge-h871/actions/runs/42401288128
- Integrated Time Chart page: https://hunghoang8711.github.io/engineering-knowledge-h871/cycle-time-univer.html

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
- Latest feature code commit verified on 2026-11-08 11:08 +07:00: commit `4a6d6e8df9c4ea1f3f3467de07a8d00b27ee39aa` (Cluster idle-gap visualization). The following history-only commit records this work.
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

### Priority 2 — XLSX import range behavior
- Multi-range import accepts semicolon-separated rectangular A1 addresses and preserves original worksheet coordinates (rather than concatenating regions).
- Direct mouse-drag selection on an Excel preview is not implemented or confirmed.
- On import, existing Cluster/Operation/Start/Duration/End/Remark source mappings are now preserved instead of being overwritten by Auto Detect. Auto Detect is used only when no mapping has been configured. Browser regression testing with a representative workbook remains outstanding.

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


---

## 12. Full GitHub commit-history audit (2026-11-08)

### 12.1 Audit scope and completeness

On 2026-11-08, the GitHub REST commit collection for the repository's default branch was retrieved page by page with `per_page=100`:
- Page 1: 100 commits
- Page 2: 100 commits
- Page 3: 100 commits
- Page 4: 100 commits
- Page 5: 28 commits
- Page 6: 0 commits

**Total: 428 commits visible in the default-branch history at audit time.**

- Oldest commit: `af9f1da73e7684fc316d782e8506d1bf5823de1c`, 2026-10-27 16:10:46 UTC.
- Newest commit at audit start: `167d3a37eb3ae3145db07bce825ae7ab6fbb51ce`, 2026-11-07 18:26:14 UTC.
- The subsequent history-document commit `467c8ed6dcbfb8c665a819eae023421a6c92cd44` was then added on 2026-11-07 18:35:49 UTC. It is included in the 428-commit count when this file was re-audited after its creation.
- All timestamps above are GitHub commit author timestamps in UTC. For Vietnam local time, add 7 hours.
- This audit covers the commit history reachable from the default branch. It does not claim to enumerate orphaned/unreachable Git objects or commits existing only on unmerged/deleted branches. Pull-request merge commits visible in the default-branch history are included.
- Commit-message keyword counts overlap; one commit can belong to multiple themes. They are directional indicators, not mutually exclusive feature counts.

### 12.2 Commit activity by date

| Date (UTC) | Commits | Main activity |
|---|---:|---|
| 2026-10-27 | 41 | Repository foundation, Pages, Supabase, authentication, workspace, project/customer/document structure |
| 2026-10-28 | 121 | Project/customer UX, direct detail pages, routing/session fixes, tags, filters, roadmap, AI architecture and first Gemini endpoint |
| 2026-10-29 | 120 | AI analysis UI/history, Main Concept, bilingual then Vietnamese-only output refinement, tags, customer/end-user relationship, memory/performance diagnostics, navigation fixes |
| 2026-10-30 | 28 | Durable asynchronous AI queue, Edge Functions, worker, workflows, job contract, polling and authorization fixes |
| 2026-11-02 | 9 | Gemini background execution, manual worker invocation, analysis comparison, PDF quality, automatic queue after upload and immediate worker trigger |
| 2026-11-05 | 7 | AI comparison rendering, customer/end-user selection, sidebar/overview navigation corrections |
| 2026-11-07 | 102 | Calculate Library / Cycle Time Builder, project Time Chart, spreadsheet editing, XLSX formulas, Univer integration, configurable ranges, multi-range import |
| **Total** | **428** | |

The high commit volume on 2026-10-28/29 and 2026-11-07 includes many small UI/cache-version corrections. These should not be interpreted as 121 or 102 separate major features. A number of commits only invalidate browser caches after an underlying script/style change.

### 12.3 Historical development phases

#### Phase A — Repository and infrastructure foundation (2026-10-27)

Key commits:
- `af9f1da73e76` — initialize Engineering Knowledge Hub.
- `cf122eafd6e5` — safe default `.gitignore`.
- `26e799359bea` — environment variable template.
- `38d3a3b2ed04` — initial architecture.
- `81f1846a5708` — security boundaries.
- `b572f176d6ac` — initial landing page.
- `031fe71f3437` — GitHub Pages deployment workflow.
- `06eb9cbdf29f` — initial H871 database schema.
- `f4e036a7cdeb` — separate Supabase project setup.
- `0563c094159c`, `0ab18063efbc`, `de5c55ea6627` — Supabase frontend config, sign-in/search UI and connection.
- `eab3b1042ad4`, `fe27b94aa39c`, `a5e36fe7bcfd` — workspace record forms, role-based creation and form locking until role verification.
- `da99dc803ffd`, `b0f348881768` — project document storage and customer relationship foundations.

Phase outcome:
- Established the separate H871 repository, public Pages deployment path, Supabase-backed application foundation, authentication and role-gated record entry.
- Began project-centric data management and private document storage.

Lessons:
- Keep environment templates free of real credentials.
- Public frontend configuration must never contain service-role keys.
- Verify the authenticated user's role before enabling write controls; hiding a button is not a substitute for database RLS.

#### Phase B — Project/customer workspace and navigation stabilization (2026-10-28)

Main work:
- Project/customer records and document relationships were made project-centric.
- Added reusable project tags and customer-side project linking.
- Added customer/project detail pages and a dedicated Knowledge Library page rather than relying on hash-only navigation.
- Added clickable customer and project cards, profile editing, project/customer selection and end-user support.
- Added compact search/filter patterns and overview roadmap.
- Removed redundant Global Search navigation and changed list behavior several times to ensure complete record lists are visible by default.
- Added route-safe refresh/back behavior, session race fixes, detail loading fallbacks, sidebar active-state corrections, and protection against Overview flashing while navigating.
- Customer/project header and typography were refined; project details can show Customer and End User separately.
- Added read-only preflight checks and documented schema/RLS observations before AI schema work.

Important commits:
- `64cc785ad547` — reusable project tags.
- `31dd86a651db` — load project documents in customer workspace.
- `26ce0cb6b5e5` — page-like detail routes and browser back navigation.
- `455232aa5337` — dedicated HTML URLs for customer/project detail routes.
- `0cc4341f8234` — dedicated Knowledge Library page.
- `2f9104db31c0` — dedicated customer detail page.
- `eca8fe6a5c33` — dedicated project detail page.
- `967dc4a1fe51` — Supabase session race fix on detail routes.
- `5d8792796750` — prevent auth events from resetting active detail route.
- `d9890c1ddecf` — customer profile editing.
- `ca8aeae5a663` — project profile editing.
- `92bdd015960a` — customer-side project linking.
- `2a1541e6763e` — clickable project cards.
- `0f816989abf4` — compact search/filter controls.
- `05bce86f9f42` — overview implementation roadmap.
- `e21cf6f161f0` — remove redundant global search navigation.

Problems and lessons:
- Hash-based routes and shared page state caused Back/refresh behavior and active-page errors; direct HTML routes with explicit identifiers were more reliable.
- Supabase auth/session events could race with detail-page initialization; route state must be established before rendering and auth refresh must not reset the active route.
- Query failures for related documents should not blank the entire project/customer list. Render the primary records and expose related-data errors separately.
- Default filters/search state must not hide records before the user asks to search.
- Cache-busting commits are often necessary for GitHub Pages static assets, but they are deployment hygiene, not business logic.

#### Phase C — AI Project Intelligence design and first implementation (2026-10-28 to 2026-10-29)

Architecture and backend:
- `ff8fd91d51cc` — approved AI Project Intelligence architecture.
- `52e6715a1170` — implementation plan.
- `322499d3c1ee` — observed schema/RLS documentation.
- `546dd2bda0fe` — draft additive AI migration.
- `8647cd5f119a` — server-side Gemini document analysis function, free-tier model only.
- `e0c36e6257c9` — authenticated analyze-document Edge Function.
- `f655ea65f5ef` — limit initial analysis to verified PDF input.
- `9b1bfd7c526a` — align architecture with AI-native whole-document understanding.
- `846cac4538d2` — transactional Main Concept apply and history restore.
- `324bbe4208db` and `12208b5067a1` — read-only migration/trigger preflight corrections.
- `7a1c2bea67d0` — restrict AI analysis/history tables to read-only client access.
- `f817279bce27` — Gemini PDF analysis UI and project history.

Product/UI improvements:
- Added document-scoped analysis history and expandable saved analysis details.
- Added overview search over saved analyses, document tags and selectable AI-suggested tags.
- Added Main Concept indicator/action, analysis progress and safeguards around history polling.
- Experimented with bilingual English/Vietnamese output and a language toggle, then simplified to Vietnamese-only source-grounded analysis; English headings and English-prioritized tags remained preferred later.
- Added Customer/End User information in the project header and project-specific end-user naming.
- Improved PDF Base64 memory handling, chunk boundaries and stage diagnostics.
- Added timeout and failure diagnostics for Gemini.

Key commits:
- `c0741608c31d` — reduce PDF analysis memory pressure and add safe stage diagnostics.
- `1ab13ba1bf73` — keep Base64 chunk boundaries valid during memory optimization.
- `ebbe3f9b7c32` — expandable saved AI analysis details.
- `fdf2458af1ac` — search saved AI analyses and selectable tag saving.
- `051111026586` — document-level tags for AI-assisted knowledge search.
- `ea2c71e61159` — Main Concept indicator and analysis progress tracking.
- `34f6cd242af0`, `ad91d19a954f`, `66997899a97f` — bilingual analysis experiment.
- `50f46b607871`, `1602d2dff83a` — Vietnamese-only source-grounded analysis UI.
- `37099305bdce`, `79789cd95729`, `731da8c8b3dc` — project-specific end-user support.
- `824afa7c2411` — Gemini request timeout and failure diagnostics.

Important lessons:
- Main Concept must be an explicit user-selected document, not an accidental latest upload.
- Preserve all analysis versions; applying or restoring a Main Concept should create traceable history.
- AI output should be grounded in the whole PDF (including diagrams/images), not only a text extraction pass.
- Client-side AI/history tables should not receive broad write access; privileged updates belong behind validated server-side functions/RPCs.
- Memory optimization must preserve valid Base64 boundaries.
- Do not assume a function's code being committed means it is deployed or its database migration has been applied.

#### Phase D — Asynchronous AI worker and queue (2026-10-29 to 2026-11-02)

Motivation:
- Long synchronous Gemini processing ran into Edge Function time limits, memory/compute pressure and provider 503/failure conditions.
- The solution was to separate quick enqueue requests from long-running processing.

Main commits:
- `46b554ab548d` — queue workflow.
- `b79324fdd1e7` — AI analysis validation workflow.
- `86f84ea9e3f4` — Supabase Functions deployment workflow.
- `7d54ae1743e4` — async job contract documentation.
- `1c428ab6a545` — enqueue-analysis Edge Function.
- `ccb5d25cbb21` — process-analysis-queue worker.
- `b0306acd932e` — analysis result validation module.
- `c99c2c590dcb` — storage path module.
- `ba578f2de6e4` — migration draft 0007 for async analysis jobs.
- `282d74430654` — read-only async-analysis preflight SQL.
- `cc7eeb3ee801` — scheduler SQL.
- `e1d46e2412ef` — connect PDF analysis UI to durable async queue.
- `bb9594e0fb87` — extend async PDF analysis polling window.
- `026491cb29ef` — fix service-role claim checks in queue RPCs.
- `17088d02ad22` — log queue claim exception message.
- `1c9e6a6ffa05` — Gemini background execution.
- `fdd00ec790d1` — safe one-shot manual queue worker invocation.
- `c9316d189bb3` — manual long-wait Gemini polling.
- `5148228772e3` — automatically queue PDFs after upload.
- `6c01da1bea27` — trigger AI queue worker immediately after enqueue.

Additional work:
- Pull requests #2, #3, #4 and #5 merged deployment, UI, polling-window and queue-JWT fixes.
- The workflow and function files exist in GitHub, but actual production state must still be verified against Supabase and GitHub Actions before any future worker change.
- Earlier user-reported test with a synthetic PDF succeeded and returned an Automated Sample Handling Demonstrator summary with tags. Treat this as user-confirmed historical evidence, not proof of current scheduler health.

Failure lessons:
- Supabase Cron was absent in a prior environment check; the scheduler SQL file alone does not install or activate pg_cron.
- Queue RPC authorization must validate service-role claims correctly; do not weaken RLS to make a worker pass.
- A longer frontend polling window does not fix a worker that never starts. Verify enqueue, queue claim, worker execution, Gemini interaction, persistence and UI refresh as separate stages.
- Manual one-shot invocation is a diagnostic/operational path, not proof of reliable recurring scheduling.
- Retry behavior and provider failures must remain observable; never silently route to a paid model.

#### Phase E — AI comparison, quality and navigation refinements (2026-11-02 to 2026-11-05)

- `c9989dfdfc9b` — AI analysis version comparison.
- `29b19274de92` — document format compatibility guidance.
- `e58292a07bf5` — improve full-PDF technical analysis quality.
- `4e93a0226f0b` — improve AI analysis rendering and comparison disclosure.
- `a9a2c90ca56a` — fix structured AI comparison rendering.
- `e17e0f9b244a` — fix project customer and end-user selection.
- `705049ea34ed`, `0b56d26e866a`, `e2e8575fda6c` — prevent Overview flash and initialize sidebar active state before paint.

Outcome:
- Analysis versions can be compared, full-PDF prompt quality was refined, format support limitations are disclosed, and customer/end-user selection and initial navigation rendering were corrected.
- Comparison UI must disclose what is being compared and must handle structured output fields without assuming every analysis has every field.

#### Phase F — Calculate Library and Cycle Time / Time Chart (2026-11-07)

This was the most concentrated feature-development day in the repository history (102 commits including many cache-bust/small correction commits).

Initial module and routing:
- `0327e3129719` — Calculate Library page.
- `5b5f188bdbf6` — H871 Cycle Time Builder.
- `57df6194292e` — link Cycle Time Builder to H871 projects.
- `497fd4c4176b` — integrate Time Chart into Knowledge Library.
- `779a38530377` — safe migration draft for multiple project Time Charts.
- Later removed obsolete Calculate Library navigation and duplicate Knowledge Library entries; clarified that Time Charts are project-specific and should not have a separate global Time Chart listing.

Spreadsheet evolution:
- `e8bee1c6944d` — editable spreadsheet-style worksheet.
- `634670ab016d` — flexible row/column editing, resizing, text wrapping.
- `48001c9e5a07` — XLSX import with formula preservation.
- `c0c81ae02993` — improve import, formulas and editing.
- `54bead42ff13` — configurable column roles and worksheet formatting.
- `c2620d2434dc` — formula reference translation and export recalculation.
- `aaebefbdfe22` — persist column names and preserve manual End Time overrides.
- `6640cfdc13a2` — worksheet selection and saved formula restoration.
- Added undo/redo, select-all/range-clear, Excel-style formula entry, absolute cell references and a standalone Univer lab.

Univer integration:
- `ba565a20573f` — isolated Univer spreadsheet evaluation lab.
- `6eeb6b53f211` — Univer-backed project Time Chart editor with Supabase persistence.
- Added project/chart routing, editable title, default End Time formulas and chart generation from worksheet cells.
- `d4a361d78a15` — configurable worksheet ranges for Time Chart generation.
- `6e22cac06dbd` — prevent missing range mapping from blocking saved worksheet load.
- `9bf79d79eb0d` — make bars represent Start-to-End and preserve Excel row order.

Latest multi-range XLSX import:
- `36710f641145` — add multiple rectangular XLSX import regions and improve formula handling.
- `0bdcaadd5ae6` — correct formula offsets when vertically appending regions.
- `d51e3354f30d` — import flow and selected range previews.
- `7e55896300b9` — preview formatting.
- `167d3a37eb3a` — restore project save completion after import refactor.

Time Chart-specific lessons:
- Do not create a separate Time Chart Library page; keep charts within their project context.
- Separate worksheet load from chart rendering; a missing Start Time mapping must not prevent a saved spreadsheet from opening.
- Preserve Excel row order. Each activity bar must span its actual Start Time through End Time on a shared time axis.
- A successful GitHub Actions Pages workflow only confirms deployment automation, not Excel formula correctness.
- Current outstanding issue remains formula/data completeness in later imported cells and verification of the multiple-rectangle import using a representative workbook.

### 12.4 Repeated correction patterns and systemic lessons from the commit history

1. **Cache invalidation was repeatedly needed.** Static GitHub Pages can continue serving old JS/CSS after a code commit. When a user reports that a change is not visible, check the deployed workflow, asset version/cache headers and hard refresh before making a second implementation change.
2. **Routing and authentication have race conditions.** Detail route, active sidebar state, auth event, and initial module loading should be coordinated. Do not allow a delayed auth event to reset navigation.
3. **Primary data should survive secondary query failures.** Project/customer lists should not disappear because a related document/tag query failed.
4. **Role-based UI and RLS are separate layers.** UI controls improve usability; database policies remain the security boundary.
5. **Spreadsheet formulas need reference-aware transformations.** When copying or concatenating ranges, relative references shift, absolute references remain fixed, and mixed references shift only the relative coordinate.
6. **Spreadsheet source formula and cached value are different.** Preserve formulas for editing and cached/calculated values for downstream charting; explicitly document cases where formula engines cannot recalculate.
7. **Save/reload is a critical regression path.** Any import/editor refactor must retest Save to project, reload, export and backup/restore.
8. **A feature can be committed but not operationally verified.** Maintain separate states for commit, workflow, deployment, browser test, live backend test and user confirmation.
9. **Avoid overcorrecting with many small code edits without a reproducible test.** Build a minimal synthetic workbook and regression checklist before further XLSX changes.
10. **Do not infer root cause solely from the commit immediately preceding a failure.** The Univer `makeCurrent` change was reverted, but the missing-range stack trace proved the actual failure was unconditional chart rendering.

### 12.5 Current repository history baseline after this audit

- Canonical project history file: `docs/PROJECT_MASTER_HISTORY.md`.
- Commit that created the file: `467c8ed6dcbfb8c665a819eae023421a6c92cd44`.
- This addendum is intended to be committed as the next update to the same file.
- Next task should start by checking this file and the actual default-branch HEAD again; this audit is a historical snapshot, not a substitute for checking live state at the start of future work.

### 2026-11-08 10:20 +07:00 — Preserve coordinates in multi-range XLSX import
- **Request:** User wants more flexible region selection: ranges such as `A1:C7; D7:E10` should import into their corresponding positions in the Univer spreadsheet. If it does not affect the feature, remove the intermediate **Add region** action and import with one click.
- **Implementation:** Replaced Add region/list/append behavior with a semicolon-separated A1 range field. Ranges may have different widths/heights and overlap; imported values/formulas are written at matching row/column coordinates. Added live range validation/preview and retained worksheet selection.
- **Code commits:** `0fe4c7f45d1b2abf1a13e3c66ac680fb0895979c` (implementation), `fcbed109d069bda1f287983c865e38b3e705c123` (clarify dialog text).
- **Workflow state:** Pages workflow run `42442305034` was observed as `waiting` at the time of check for commit `0fe4c7f...`; no successful deployment was confirmed in this update.
- **Verification:** Re-fetched the committed source and inspected the import logic, markup and event handlers. Confirmed the obsolete Add region control/handler is absent and the new flow preserves source coordinates. A browser test using an actual workbook, formula validation, save/reload and user confirmation are still pending.
- **Lesson:** When the user's objective is spatially faithful worksheet import, do not flatten or vertically concatenate disjoint ranges; build a sparse rectangular matrix and retain original coordinates.
### 2026-11-08 10:33 +07:00 — Preserve Time Chart mappings; add per-cluster timelines and color settings
- **Request:** Keep configured source ranges (Cluster, Operation, Start, Duration, End, Remark) when importing/replacing worksheet data; add a separate Time Chart for each cluster below the overall chart; allow each cluster's color to be configured once and shared across all chart views.
- **Implementation:** Import now snapshots the existing range mapping and cluster-color map before replacing the Univer workbook, restores them after import, and runs Auto Detect only when no mapping exists. Added individual cluster timeline cards below the overall chart; all use the same global time axis for comparison. Added one color picker per detected cluster and reused that color for its bars in both overall and per-cluster charts. Cluster colors are stored in the existing `chart_data` JSONB payload and restored when loading a saved chart.
- **Persistence / compatibility:** Updated the chart payload version to 7. No database migration, table change, RLS change, or new external service was required; older charts without `clusterColors` use deterministic default colors.
- **Code commit:** `379aa1c264ee8edda320709657ddaa6ec865aff6`.
- **Workflow state:** Pages workflow run `42443178184` was `in_progress` at the time of this log; successful deployment was not yet confirmed.
- **Verification:** Re-fetched committed source and confirmed range mapping restoration, conditional Auto Detect, color save/load, individual cluster output, and delegated color-change handler. Compiled the inline application JavaScript with the JavaScript parser successfully; confirmed no duplicate HTML IDs and both new output containers exist. No real-browser test with a saved project/workbook, formula recalculation, save/reload, or user acceptance has yet been performed.
- **Lesson:** Spreadsheet replacement and chart configuration are separate state. Recreating a workbook must not reset independent mapping/color preferences. Keep per-cluster styling in chart metadata, not in transient DOM state, so it survives chart save/reload.

### 2026-11-08 — Consolidate Cluster views into one filterable Time Chart
- **Request:** Replace the overall Time Chart plus separate per-Cluster timelines with one timeline table and a Cluster filter that can show/hide selected Clusters. Keep the existing Cluster color configuration.
- **Implementation:** Removed the individual Cluster timeline section and its duplicated timeline rendering. Added per-Cluster checkboxes plus Select all / Clear all controls above the single timeline. The filter hides/shows activity rows while preserving the full dataset's shared time axis, so comparisons do not shift when the visible Cluster selection changes. Summary counters now report visible versus total operations and Clusters.
- **Cluster colors / persistence:** Retained the existing Cluster color pickers, shared color lookup and clusterColors save/load inside the existing chart_data payload. Existing range mapping persistence remains unchanged. No database migration, schema, RLS or external service changes.
- **Code commit:** c9335b7ddf00bc4828a7268be6bd442bfe2e3cad.
- **Verification:** JavaScript syntax parsed successfully with new Function. Source checks confirmed the old per-Cluster output/cards are removed, the filter controls and handlers exist, Cluster colors and range mappings remain persisted, and the filter container ID is unique. Real-browser interaction with a saved project, chart reload, and visual/user acceptance remain pending; GitHub Pages deployment must be checked separately.
- **Lesson:** When multiple views contain the same timeline data, use one canonical timeline with visibility filters to reduce duplication while keeping shared time coordinates and styling state.


### 2026-11-08 10:52 +07:00 — Upgrade Time Chart inspection and readability (Stages 1–3)
- **Request:** Make every activity easier to inspect without relying on the visual width of its timeline bar. Implement fixed Start / Duration / End values, a detailed hover/focus tooltip, and time grid lines with a shared vertical cursor.
- **Stage 1 — Fixed inspection values:** Reworked the single Time Chart row into Operation, Start, Duration, End and Timeline columns. Start, Duration and End values are always visible in tabular numeric formatting, including for very short activities; the bar label remains optional for long bars only.
- **Stage 2 — Smart tooltip:** Added a hover and keyboard-focus tooltip containing Operation, Cluster, Start time, Duration, End time, Remark (when present), and the original Excel source row. The row number is derived from the configured Start range so the activity can be traced back to its worksheet row.
- **Stage 3 — Time grid and cursor:** Added time-position grid lines on every activity track, emphasized integer-second markers and the 0-second origin, and added a vertical cursor across the chart with a live time readout to three decimal places. The time domain now includes 0 seconds when all activities start after zero; integer-second ticks are shown for ranges up to 80 seconds, with a readable interval for longer ranges.
- **Compatibility:** Kept the single timeline, Cluster filter, Cluster colors, color persistence, range mapping, and existing chart_data payload. No database migration, schema, RLS, or external service changes.
- **Code commits:** `57920d54a478cbf6d7b78966a4379f8e8a8a35c8` (main UI implementation); `cde704e6ded82a8fb9f66d2cfc8263d83c12fcfc` (include zero-second origin and refine grid tick density).
- **Verification:** Re-fetched the committed source and parsed the complete inline application JavaScript with the JavaScript parser successfully. Source checks confirmed unique HTML IDs, fixed numeric columns, tooltip data attributes and event handlers, time-grid generation, cursor behavior, continued Cluster filter and color controls, and absence of the removed per-Cluster timeline cards. GitHub Pages workflows for both code commits completed successfully: run `42444701760` for `57920d5...` and run `42444737955` for `cde704e...` (both conclusion `success`). Real-browser hover/focus behavior, responsive layout, and saved-chart reload remain to be tested.
- **Lesson:** Timeline width is a visual encoding, not a reliable way to expose engineering values. Keep exact values in stable columns and use the chart for temporal relationships; use source-row traceability and a shared cursor for quick debugging of short and overlapping operations.


### 2026-11-08 — Fix Select All / Clear All Cluster filter actions
- **Issue:** The Select all / Clear all buttons in the Cluster filter were visible but unresponsive. Their delegated click handler was attached to `#cluster-filter-controls`, while both buttons are siblings of that element inside `.tc-cluster-filters`; clicks therefore never bubbled through the listener.
- **Fix:** Moved the delegated click listener to the shared `.tc-cluster-filters` parent. The existing action logic remains unchanged: Select all selects every currently detected Cluster, Clear all empties the selection, and both rebuild the same single Time Chart. Individual Cluster checkboxes and per-Cluster Show idle gaps controls remain intact.
- **Compatibility:** No chart data, saved preferences, database schema, migration, RLS, or external service changes.
- **Code commit:** `5c3693bcdada97f1bc705ee36b5617d09846fda1`.
- **Verification:** Re-fetched the latest source before editing; confirmed the exact event-delegation mismatch; parsed the complete inline application JavaScript successfully before committing. GitHub Pages workflow and live browser interaction are pending verification.
- **Lesson:** Delegated event listeners must be attached to a common ancestor of the interactive controls. A listener on the content container cannot receive clicks from adjacent sibling controls.

### 2026-11-08 12:03 +07:00 — Establish Cycle Simulation foundation and implement Repeat N Cycles

- **Request / decision:** Build the architecture to support both sequential repetition and future resource-constrained overlapping cycles from the beginning. Deliver Repeat N Cycles first as the validation stage; do not implement uncontrolled overlap yet.
- **Architecture:** Keep worksheet rows as the immutable baseline input for simulation. Generate derived events in browser memory using a shared event contract containing `eventId`, `cycleId`, `cycleIndex`, `sourceRow`, `cluster`, `operation`, `start`, `duration`, `end`, `resourceRequirements`, `resourceGroupHint`, `dependencies`, `precedence`, and `simulationMode`. The engine explicitly distinguishes `repeat` from the reserved `resource_constrained_overlap` mode. Resource requirements are left empty rather than incorrectly assuming that every Cluster is an exclusive resource; Cluster is retained only as a grouping hint until the user defines real resource/precedence rules.
- **Implemented — Repeat N Cycles:** Added a Simulation section to the existing project Time Chart. Users can generate 2–100 repetitions, choose an automatic cycle interval (baseline span from earliest Start to latest End) or a manual interval, and select a display limit for the generated timeline. Each repetition receives a stable Cycle ID (C001, C002, ...), while each derived activity retains its source worksheet row and original activity details.
- **Engineering guard:** The first release is sequential repetition. A manual interval shorter than the baseline cycle span is rejected with an explicit explanation; the engine will not silently produce overlapping events before resource constraints are implemented. The first cycle lead time, cycle interval/Pitch, theoretical units per hour, last-cycle completion, per-cycle completion summary, and generated-event count are calculated from the derived schedule. Throughput is calculated as 3600 / Pitch when time values are in seconds.
- **Data safety / compatibility:** Simulation is transient and does not alter worksheet cells, source Time Chart records, saved chart payload, Supabase schema, migrations, RLS, or external services. Rebuilding the baseline clears stale simulation results; changing Cluster filters or colors does not clear an existing simulation.
- **Code commits:** `64c8d0653365136922fb0e275c873aa064a97ea6` (initial UI/engine); `46b61c64f368588c68e8d4fff43dd41fc2d9f5c7` (preserve results during filter/color redraws); `b37e069e1639a732564452b109c82d32f3164cf5` (keep resource requirements explicit for future overlap engine).
- **Verification:** Re-fetched the latest source and compiled the complete inline application JavaScript with `new Function` successfully. Confirmed no duplicate HTML IDs. Ran an isolated engine test with two activities across three cycles: generated six events with Cycle IDs C001–C003 and correct shifted end time. Tested that an interval shorter than the baseline span is rejected. A real-browser test with the user's saved workbook, UI interaction, and save/reload has not yet been performed.
- **Deployment state:** The latest Pages workflow for code commit `b37e069...` must be checked after this entry; earlier runs for superseded commits were cancelled or still running. Do not call the feature deployed until a successful workflow for the latest commit is confirmed.
- **Next stage:** Validate Repeat N Cycles against a real worksheet and expected machine timing. Then define explicit resource identities, resource occupancy/exclusivity, operation precedence, handshake/dependency constraints, buffers, and release conditions with the user before enabling resource-constrained overlap. Reuse the same event contract and replace the schedule generator, not the source worksheet model.

### 2026-11-08 — Define Repeat Cycle using two Operation markers and add per-Cluster cycle lanes

- **Request / design:** Select two Operation bars directly on the generated Time Chart to define one cycle, then confirm Repeat N Cycles in the panel below. The simulation result summarizes each cycle as one row per Cluster, with active intervals drawn as colored blocks and waiting intervals shown as hatched gaps, making cross-cycle waiting-pattern comparisons easier and preparing for overlap detection.
- **Cycle boundary interaction:** Clicking the first Operation bar assigns Cycle Start using that operation's Start timestamp. Clicking a second, later Operation bar assigns Cycle End using that operation's End timestamp. The UI shows S/E marker outlines, selected operation names, and the absolute selected time window. Keyboard Enter/Space works on focused activity bars. Clear cycle markers resets the selection. Invalid boundary order is rejected.
- **Window extraction:** Activities intersecting the selected time window are clipped to the boundaries and normalized so Cycle Start is simulation time 0. This retains partial operations crossing a boundary while excluding operations outside the selected window. The source worksheet records remain unchanged.
- **Simulation display:** Repeat N now uses the selected window rather than the full worksheet time range. Each generated event retains Cycle ID and source-row traceability. The result table has one row per Cycle ID and Cluster; overlapping/touching activity intervals within the same Cluster are merged into continuous active blocks. Waiting intervals, including leading/trailing waits, are shown as hatched segments. The full N-cycle timeline shares one time axis so waiting-pattern alignment can be inspected visually.
- **Cluster filtering:** Added independent All/None and per-Cluster filters for the simulation table. Clearing all Clusters leaves the result empty instead of silently restoring all groups.
- **Engineering guard:** Automatic Pitch equals the selected cycle window span. Manual Pitch shorter than that span remains rejected in sequential Repeat mode. This stage does not infer resource exclusivity or enable overlapping cycles. The shared simulation event contract remains ready for later resource constraints.
- **Code commits:** `7ccd687e0256fc574499a143c7bed84b7d85c5b4` (cycle selection and Cluster lane table); `7857ce81a85475e5fad66ad113539a447c82d9d4` (normalize selected window to zero and fix Clear All filter behavior).
- **Verification:** Latest source re-fetched; complete inline JavaScript parsed successfully; no duplicate HTML IDs. Isolated engine test selected a 13-second window from source times 10–23, normalized intersecting activities to 0–13 seconds, generated 3 cycles / 12 events with Cycle IDs C001–C003, and confirmed a Cobot activity pattern with two separate active intervals (0–3 s and 8–10 s), preserving the intervening wait. Real-browser selection, actual workbook validation, responsive layout, and save/reload have not yet been tested.
- **Next validation:** Select two representative Operation bars in the live project Time Chart, verify the intended cycle boundaries, and compare each Cluster's active/idle pattern across repeated cycles. Use these results to define resource identity and dependency rules before developing resource-constrained overlap detection.


### 2026-11-08 13:02 +07:00 — Implement Cycle Logic Editor V1 and Continuous Flow + Exclusive Resource simulation

- **Conversation context:** Revisited the user-approved design from the H871 discussion “Kết quả migration 0011 (5)” and the subsequent explicit selection: **Continuous Flow** cycle start model + **Exclusive Resource** rule. This is the first executable Cycle Logic / resource-constrained simulation stage, not merely a visual Repeat N copy.
- **Design constraints preserved:** Keep the existing Operation-defined cycle window and Cluster activity lanes; keep source worksheet cells immutable; keep Cluster as a display/grouping concept rather than implicitly treating a Cluster as one exclusive resource; do not change Supabase schema, migration, RLS, storage, or external services.
- **Cycle Logic Editor:** Added directly inside the existing project Time Chart below the selected Cycle boundary controls. It exposes:
  - **Cycle Entry Gate**, defaulting to the Operation selected as Cycle Start.
  - **Previous Cycle Release Gate**, defaulting to the Operation selected as Cycle End. The prior cycle's Release Gate completion unlocks the next cycle's Entry Gate.
  - **Finish-to-Start dependency** links between selected-cycle Operations, with a non-negative delay after predecessor completion.
  - Multiple incoming dependencies are interpreted as an **AND** condition (all predecessors must finish, including configured delays).
  - Per-Operation **Exclusive Resource ID(s)**, entered as comma-separated IDs. An Operation requiring multiple IDs can start only when all are free. Resource IDs are shared across all generated cycles; missing Resource IDs are explicitly warned about and are not resource-locked.
  - Circular dependency detection prevents simulation and reports the loop condition.
- **Simulation Engine:** Replaced the fixed sequential Repeat schedule for this mode with a deterministic, browser-side event scheduler for 2–100 cycles:
  - Generates one derived event per source Operation per Cycle, retaining source-row, Cycle ID, Operation, Cluster, planned offset, duration, dependencies and resource requirements.
  - The next Cycle's Entry Gate waits for the previous Cycle's Release Gate. Other Operations in that Cycle are released relative to the actual Entry Gate start, allowing legitimate cross-cycle overlap when the Release Gate occurs before the remaining previous-cycle work has finished.
  - Finish-to-Start dependencies and delay are applied per Cycle. The scheduler selects the earliest feasible ready event; tie-break order is Cycle index then source worksheet row.
  - Exclusive resources are acquired atomically and remain occupied for the Operation duration. Resource contention shifts actual start times rather than allowing simultaneous use.
  - Computes actual Start/End, dependency waiting, resource waiting and total waiting on each derived event. Cycle summary reports Entry Start, Release Gate End, actual average Pitch between Entry Gate starts, Gate CT, Pitch deviation from the selected baseline span, theoretical units/hour and last event completion.
- **Result view:** Retains the shared Cluster activity/idle lanes and Cluster filters; adds per-Cycle execution summary so actual entry intervals and gate CT deviations can be compared. The timeline is derived only; source worksheet values are not edited.
- **Persistence / compatibility:** Cycle Logic and the selected Cycle boundary source rows are stored in the existing project_cycle_time_charts.chart_data JSONB payload as cycleLogic and cycleDefinition, with payload version advanced from 7 to 8. Existing charts without these optional fields load with empty/default logic. No Supabase schema, table, migration, RLS, Storage or external service changes.
- **Code commits:**
  - a40ae1398d8ee66becc0e8681732af54c5eb13bc — Add Cycle Logic Editor and continuous exclusive simulation.
  - 8430d099a97a1ac9fffba65c4ee6b09bcaa604c0 — Refine Cycle Gate scheduling and waiting attribution.
  - 7141e6f63c5a5ba1695c04d02d9a2748cd5a1f42 — Allow cross-cycle overlap after Entry Gate.
  - c62d0fa5c87c410791a743398007331dff58310e — Remove fixed-Pitch controls from Continuous Flow mode.
  - ac21d6b3b8955800e399318f422d88af2b619317 — Persist Cycle Logic and Cycle Gate selection in chart data.
  - 3994ed365487a8f64e2661d26219e1168bdcad1b — Show actual Pitch and Cycle Gate deviation.
- **Verification:** Re-fetched the latest source at blob 69344b9a95df86e5a3245018e086f66a4a68e5f0. The complete inline application JavaScript passed new Function syntax parsing; duplicate HTML IDs: none; referenced DOM IDs missing from markup: none. An isolated test executed the actual scheduler functions extracted from the committed source and confirmed: (1) C002 Entry can start before a long-running C001 Operation ends; (2) Finish-to-Start plus 0.5 s Delay is respected; (3) a shared Cobot resource forces the later Cycle to wait; (4) dependency and resource waiting are distinguished; and (5) a circular dependency is rejected. Test result: three cycles with actual Entry intervals of 3 s in the synthetic case, and Resource Waiting of 3 s / 6 s on the later Cobot events.
- **GitHub Pages:** Latest code commit 3994ed365487a8f64e2661d26219e1168bdcad1b has Pages workflow run 42453569392, completed with conclusion success. This confirms workflow completion, not browser correctness.
- **Not yet verified:** Real-browser interaction with the user's saved workbook; real project save/reload of Cycle Logic and boundary selections; mobile layout; representative machine data validation; visual treatment of Operations that continue past the Release Gate. Do not claim those paths have been user-tested.
- **Next validation / known refinement:** Validate Entry/Release Gate semantics against a real machine sequence. Add an operation-level execution log for Planned vs Actual Start/End and Dependency Waiting vs Resource Waiting. Ensure Cluster lanes visibly retain an Operation's active tail when it continues beyond its Cycle Release Gate; this is important for interpreting cross-cycle overlap. Only after these checks should we add advanced gate conditions (OR, SS/FF), priority policies, deadlock diagnostics beyond simple dependency cycles, or bottleneck optimization.


### 2026-11-08 — Preserve active Operation tails beyond the Cycle Release Gate

- **Refinement:** Cross-cycle Continuous Flow may start the next Cycle while one or more Operations from the prior Cycle are still active. The Cluster lane renderer now extends each Cycle's visible activity/idle window through the latest actual Operation End in that Cycle, rather than clipping every lane at the Release Gate timestamp. The Cycle execution summary continues to use Entry Gate Start → Release Gate End for Gate CT and actual Pitch, so the two concepts remain distinct.
- **Code commit:** 13ff4eb929fe61124c6e4b93cd44c8abc4498c93.
- **Verification:** Latest source blob aaf8755074e412aa4c9567838b18f55fd8b1a6db passed complete inline JavaScript syntax parsing. Duplicate HTML IDs: none; missing referenced DOM IDs: none. The isolated Continuous Flow / Exclusive Resource scheduler regression test still passed, including cross-cycle overlap and shared-resource waiting. Pages workflow run 42453724357 was in progress at the time of this log; verify its final conclusion before claiming the latest refinement deployed.
- **Status:** Browser validation with a real saved project/workbook remains outstanding.


### 2026-11-08 — Process Flow Editor V1 with multi-predecessor AND Join

- **User request:** Replace the hard-to-scan dependency form with a visual Process Flow canvas, and support successor Operations that may proceed only after multiple predecessor Operations have both completed.
- **UI:** Replaced the primary dependency-entry form with a Hybrid Process Flow workspace inside the existing Cycle Logic Editor. The canvas displays one draggable Operation node per selected-cycle worksheet Operation, with Input and Output ports, dependency arrows, Cycle Entry / Release badges, and an Operation Properties inspector for Exclusive Resource ID(s). Node positions are saved in cycleLogic.nodePositions. The existing Entry and Release Gate selectors remain available.
- **Connections:** Users can connect Output → Input by dragging between ports or by selecting the source Output then target Input. The canvas supports branching and converging dependencies. Duplicate/self links are rejected; a link that introduces a dependency cycle is rejected before it is stored. Existing dependency list remains available to inspect/remove links; new-link Delay is configurable.
- **AND Join semantics:** A target Operation with two or more incoming dependency edges is explicitly labeled AND JOIN · N prerequisites. The existing scheduler readiness test requires every incoming dependency to be completed; each prerequisite's own completion time plus its configured Delay is considered. Therefore a successor cannot start until the latest of all prerequisite completion-plus-delay times has passed. Multiple outgoing links are branches; they do not implicitly synchronize. Synchronization occurs at a target with multiple incoming links.
- **Resource semantics:** Exclusive Resource IDs remain properties of Operations, not flow nodes or Cluster labels. A node may require multiple comma-separated Resource IDs; all must be free before the Operation starts. The same Resource ID is exclusive across all generated cycles.
- **Persistence / compatibility:** Node positions are included in the existing cycleLogic object and saved in the existing chart_data JSONB. No schema, migration, RLS, Storage or external service change. Existing charts without nodePositions receive a default node layout.
- **Code commits:** ae8d3bad783e34a7c08ec60a22313c9ff9d09a81 (Hybrid canvas, Operation nodes, AND Join labels, node position persistence); cf441ed2355fda95a8009111a2d75be68e20b181e (drag-to-connect pointer handling).
- **Verification:** Latest source blob 19e0947d72d80b98e1eac1151e952825a8f7230d passed complete inline JavaScript syntax parsing. Duplicate HTML IDs: none. getElementById references missing from markup: none. An isolated test executed the scheduler extracted from the source with two independent prerequisites: predecessor A completed at 3.0 s plus 0.5 s delay; predecessor B completed at 5.0 s plus 0.25 s delay; the converging Operation started at exactly 5.25 s, confirming AND readiness. Dependency cycle rejection and multi-cycle/resource tests remain covered by the preceding Cycle Logic V1 test.
- **Deployment:** Workflow for cf441ed2355fda95a8009111a2d75be68e20b181e was queued at the time of this entry; verify the final result before claiming the latest UI deployed.
- **Not yet verified:** Real-browser drag behavior across browsers, actual workbook interaction, mobile ergonomics, and save/reload of node positions in the user's live project. The canvas uses native DOM/SVG and does not add a third-party graph library. Treat this as V1, not a full industrial workflow platform.
- **Next refinements:** Add explicit visual AND Join nodes (rather than implicit AND semantics on a converging Operation), edge editing / deletion directly from canvas, auto-layout, zoom/pan, and richer branch conditions (OR / conditional routes) only after validating this version on a representative machine cycle.


### 2026-11-08 — Process Flow Editor V1.1: Explicit AND Gate, edge removal and Auto Layout

- **User request / scope:** Continue the visual Process Flow Editor after V1, prioritizing easier-to-read multi-predecessor synchronization and faster graph editing. Preserve Continuous Flow + Exclusive Resource semantics and avoid database migrations.
- **Explicit AND Gate:** When an Operation has more than one incoming dependency, the canvas now inserts a visible diamond-shaped AND node between the incoming links and the target Operation. The underlying dependency graph is unchanged: the scheduler still waits for every incoming predecessor, including its individual Delay, before the target can start. The AND node is a derived visual representation, not a separately persisted event or a new scheduling primitive.
- **Edge editing:** Dependency paths have a wider transparent hit area. Clicking a path removes that exact dependency and immediately redraws the graph and dependency list. The existing dependency table's Remove action remains available. This iteration does not yet add edge selection / inline delay editing.
- **Auto Layout:** Added a topological layered layout action. Operations with no incoming dependency are placed in the first column; downstream Operations are placed in successive columns according to the longest predecessor depth. Multiple independent source Operations may share the first column; a converging AND target is placed after all of its prerequisites. Positions are written to the existing cycleLogic.nodePositions and therefore persist through the existing chart_data save path. Manual drag remains available after auto-layout.
- **Compatibility / persistence:** No schema, migration, RLS, Storage or external service changes. Existing Cycle Logic data loads unchanged. The AND diamond is derived from the existing dependency list.
- **Code commits:** 7782372b9b15a5c471195b1f03cbf3f7fd3c1ae6 (explicit AND visualization, edge removal, auto-layout); 8148101f7b6b234df6e397a1df966506c348a54d (complete AND output routing, arrow rendering and edge hit interaction).
- **Verification:** Latest source blob 94c28899871181c1feac3ff168de93c598f1b981 passed complete inline JavaScript syntax parsing. Duplicate HTML IDs: none. Missing getElementById markup references: none. Isolated source-extracted engine test confirmed: (1) auto-layout places converging operations after their prerequisite layer; (2) the canvas renderer creates a visible AND diamond and removable dependency paths; (3) two prerequisites completing at 3.0 s + 0.5 s and 5.0 s + 0.25 s cause the target to start at exactly 5.25 s; (4) dependency loops remain rejected; and (5) 3-cycle simulation completed 15 events.
- **Not yet verified:** Real-browser clicking on SVG dependency paths, visual legibility with dense real machine flows, drag behavior after auto-layout, actual workbook Save/Reload, and mobile interaction. Do not claim browser or live workbook testing.
- **Next iteration candidates:** OR / conditional branches require an explicit, well-defined routing model (not just a visual fork); live simulation states should distinguish Waiting for Dependency, Ready, Waiting for Resource, Running and Completed. These are intentionally not implemented in this iteration.


### 2026-11-08 — Continuous Flow Simulation Playback V1

- **User request / scope:** Continue Cycle Logic development with an observable simulation, not only final CT/Pitch metrics. Add a playback timeline and live state feedback on Process Flow Nodes. Preserve Continuous Flow + Exclusive Resource semantics and the existing chart_data format.
- **Playback controls:** Added Play/Pause, Reset, a time scrubber (0.05 s step), and playback speeds 0.5× / 1× / 2× / 4×. Speed selection is retained across result redraws. Playback uses the completed simulation's event schedule; it does not alter scheduling or worksheet values.
- **Live Process Flow states:** During playback, each Operation Node displays the event state and Cycle ID and receives a state-specific border: Waiting, Waiting for Dependency, Waiting for Resource, Ready, Running, or Completed. The status line summarizes active/waiting/completed counts for the selected cycle time. Event status is derived from actualStart/actualEnd and the scheduler's waitingDependency / waitingResource / waitingTotal fields.
- **Playback semantics:** Node status represents the closest applicable event instance for that Operation at the current global simulation time (running event, otherwise next upcoming event, otherwise most recent completed event). This is an inspection view across the generated cycles, not a separate scheduler.
- **Compatibility / persistence:** No schema, migration, RLS, Storage, or external service changes. Playback position and speed are transient browser state and are not saved to the chart. Cycle Logic, node positions, and dependency definitions continue to use existing chart_data persistence.
- **Code commits:** 1662fbe4542dbba033e6b2fb29dcedd0f76ed3ae (playback controls and live node states); 785e8b93c2ac9dbc597b9ddacf42587a962f76a8 (event wiring and state summary); d87f112bb4c82e849a72b5e33753ddcbf9c197f5 (retain selected playback speed).
- **Verification:** Latest source blob db6d33d4dc4cc78dbd803621fe49847416da09f3 passed complete inline JavaScript syntax parsing. Duplicate HTML IDs and missing DOM references were checked after the main wiring change and remained none; playback markup was source-extracted and rendered against a representative 2-cycle fixture, confirming the time scrubber, speed option persistence, state legend and Cycle execution summary. State helper fixture covered Dependency wait, Resource wait, Running, Completed and transition to a subsequent cycle. No actual browser / user workbook test was performed.
- **Known limitation:** Playback visualizes the scheduler's final event times as a time cursor. It is not yet a step-by-step event dispatch engine, does not animate edge tokens, and does not yet display a dedicated event log with exact wait reasons for each event. Dense flow layout and mobile interaction still require browser validation.
- **Next stage:** Build an event log with Planned vs Actual Start/End, delay source, and per-event resource wait; then implement explicit conditional branch semantics (OR / condition labels and scenario selection) only after specifying how mutually exclusive routes affect the cycle completion gate and continuous-cycle Entry.


### 2026-11-08 — Visual Process Flow Editor V1.2: Four-sided ports, top-down layout, mid-line arrows

- **User request / scope:** Replace the fixed left-to-right connection affordance with four flexible ports on every Operation (Left / Right / Top / Bottom). Dragging from Operation A to Operation B creates a prerequisite automatically, meaning B cannot begin until A completes (plus the configured link Delay). Allow a top-to-bottom overall layout and move arrowheads from line ends to the middle of each connector. Record this implementation in the project history.
- **Four shared ports per Operation:** Each Node now has exactly four connection ports, one per side. A port can be used as the source or target of a link. Drag from any side of source Operation A to any side of target Operation B; the existing dependency scheduler treats the link as A → B. More than one incoming link continues to produce an AND synchronization gate. Self-links, duplicate links and dependency loops are rejected.
- **Port metadata:** New links persist fromPort and toPort in the existing cycleLogic.dependencies JSON. Existing dependency records without these properties remain compatible; normalization defaults them to Right → Left. No schema or migration changes.
- **Top-down / left-right layouts:** Added a layout direction toggle (TB / LR) beside Auto Layout. The default for previously saved charts without this preference is Top → Bottom. Auto Layout still uses topological depth so all prerequisites appear in earlier layers; vertical mode places depth layers down the page and independent operations across each layer. Horizontal mode remains available. The preference and node coordinates are saved through the current cycleLogic → chart_data path.
- **Mid-line direction arrow:** Dependency connectors use a computed small triangular polygon positioned and oriented at the midpoint of the cubic curve. The previous terminal arrow marker is removed. Dependency paths retain their larger hit area for direct removal; delay labels remain on the path.
- **Code commits:** 566eaaa5b4c2257e00b0f371dcc5fc9e7bbe9bc4 (four-port UI + orientation preference); b6406c6a1a93dda9a1bcdbc2c585292fe5a4e714 (routing and top-down auto layout); 373c523f8de173c3f88d675d9faa18192dc45a19 (port interaction and layout toggle wiring); cf326f222a578f4c46c6ca6b873efefd67976ddb (exactly four shared ports).
- **Verification:** Latest source blob 79d98214c20781ba6aa95f34d88ee9150dfb5150 passed complete inline JavaScript syntax parsing. Duplicate HTML IDs and missing getElementById references: none. Source-extracted canvas test with 3 Operations and 3 dependencies confirmed 4 ports per Operation (12 total), midpoint arrows on each dependency and the AND output, visible AND gate, and top-down layout with successive depth layers at y=40 / 205 / 370. Actual browser drag gesture, visual alignment, save/reload on the user's workbook and responsive layout are not yet tested.
- **No unrelated changes:** No database schema, migration, RLS, Storage, Time Chart worksheet values or simulation scheduling semantics changed.
- **Next validation:** User should confirm drag gestures from each of the four sides and whether auto-layout top-down is comfortable. Then test actual chart Save / Reload. After that, a useful follow-up is optional connector routing / crossing minimization for dense diagrams.


### 2026-11-08 — Process Flow AND Gate Direction-Aware Placement V1

- **User request:** AND synchronization Gate should no longer be pinned to a fixed top/left position. It should follow the target Operation port used by the connection (e.g. target Left → gate on left; target Top → gate above), with an automatic side choice that prefers the most natural approach from the prerequisite Operations.
- **Implementation:** Added resolveGateSide(row) to the Process Flow renderer. When all incoming dependencies specify the same toPort, the AND Gate uses that explicit side. If incoming target sides differ or are not consistently defined, it estimates the predecessor-center centroid relative to the target Operation and chooses the dominant direction (Top/Bottom or Left/Right). The gate is positioned outside the corresponding side of the target Node.
- **Connector rendering:** Each incoming dependency still terminates at the AND diamond; its single outgoing connector now routes from the diamond to the matching target-side port rather than always using the layout's fixed Top or Left side. Mid-line directional arrow triangles remain enabled. AND scheduling semantics are unchanged: all prerequisite events must complete.
- **Persistence / compatibility:** Uses existing dependency toPort metadata stored within cycleLogic.dependencies; no new property or schema required. Older links remain supported through normalized defaults. Gate placement is computed from saved node positions and connection ports at render time.
- **Code commit:** 08e6b55d99a750c16dfdf5718ad022d73e8683ba.
- **Verification:** Latest source blob 35a01c26d991e29b3b215fc6f12b421d713e5da5 passed full inline JavaScript syntax parsing; duplicate IDs and missing DOM references: none. Source-extracted canvas fixtures confirmed target Left places AND left of Row 42 (x=162 vs node x=220), target Top places AND above Row 42 (y=202 vs node y=260), and mixed-side inputs choose the automatic dominant direction. Arrow markers rendered for each dependency and AND output. Browser-level layout, drag, and save/reload still need user validation.
- **Next validation:** Check the target Port drag direction in the actual chart. Confirm that explicit Left/Top connections place the AND diamond as expected and save/reload preserves the direction. For dense layouts, consider collision-aware routing and AND-gate offset handling.


### 2026-11-08 — Process Flow Editor V1.3: Alignment Snap + Multi-Operation Selection

- **User request:** Make Operation cards align cleanly when their edges/centers approach alignment; allow marquee selection and moving several Operations together.
- **Alignment snapping:** While dragging a card or selected group, the editor compares the primary card's left/center/right and top/center/bottom anchors against unselected cards. If the nearest offset is within 9 canvas pixels, it snaps the group to that alignment. Vertical/horizontal alignment guides appear during the drag. Positions remain stored in the existing cycleLogic.nodePositions map and are saved through chart_data.
- **Marquee selection:** Drag on empty canvas/background to draw a selection rectangle. Every Operation intersecting the rectangle is selected. Selection count is shown in the editor toolbar; Clear selection resets it. Shift/Ctrl/Command-click on an Operation header toggles it in the selection. Dragging any selected header moves all selected Operations together while preserving their relative offsets.
- **Behavior:** Moving nodes updates coordinates without rebuilding the canvas until pointer release, avoiding interruption of the drag gesture. Dependency links, AND gate calculations, simulation scheduling and worksheet data are unchanged.
- **Code commit:** b38f1acc4863b06a520a50b11ae2acfbaee2836f.
- **Verification:** Latest source blob e7b0de57327adfe730fbe414d295aee854219de4 passed inline JavaScript syntax parsing. Duplicate HTML IDs: none. Missing getElementById references: none. Static source checks confirmed marquee selection, group move, 9px snapping, alignment guides, modifier-key toggling and clear-selection action. Actual browser drag/marquee behavior, alignment appearance and saved chart reload have not yet been exercised.
- **Next validation:** Verify selecting a rectangle across several cards, dragging the group, and snapping a card edge/center to a nearby neighbor. If validated, follow up with smarter snapping against AND Gate diamonds and connector alignment.


### 2026-11-08 — Time Chart Cycle Boundary Visual Highlight V1

- **User request:** Make Start/End cycle selection more visually apparent with dashed guides from selected boundaries to the time bars, a brighter selected cycle region, a dimension arrow showing total Cycle CT, and brighter operation bars included in the selected cycle.
- **Implementation:** In the existing Time Chart renderer, a valid Start/End selection now overlays a translucent bright cycle window across each timeline lane, adds dashed green Start and amber End guides, and shows a horizontal dimension line with arrowheads and the total selected duration labeled “Cycle CT” on the timeline axis.
- **Operation emphasis:** Operation bars intersecting the selected cycle are visually brightened; fully contained operations receive a stronger highlight/glow, while partially intersecting operations use a lighter highlight. Existing operation colors and Start→End timing remain intact.
- **Interaction:** Selecting or changing either boundary immediately refreshes the Time Chart and Process Flow editor. Selection markers, source rows, cycle extraction and simulation semantics remain unchanged.
- **Code commit:** da0cd538f7ed285f64e95ee239d48e3fcfcca173.
- **Verification:** Latest source blob 734a6b0af35c401d1c2f9164495b51c54ba2e909 passed full inline JavaScript syntax parsing. Duplicate HTML IDs and missing DOM references: none. Static checks confirmed dashed boundary overlays, cycle-range highlight, operation highlighting, duration dimension, and render refresh on selection. Browser screenshot/layout and actual chart interaction have not yet been tested against the user's saved workbook.
- **Next validation:** Confirm the guides and dimension label remain legible with dense operations, filtering Clusters, and scrolling. If needed, refine label placement and use a continuous chart-level guide instead of per-lane guides.

### 2026-11-08 — Time Chart Cycle Highlight Refinement + Selection Reset Fix

- **User feedback:** Prior cycle selection guides and colors were visually too heavy; marker guides were offset from the operation bar edges; the Operation labels on the left did not highlight; clearing/changing the Start-End selection was not reliably clear in the rendered chart.
- **Visual refinement:** Replaced colored thick dashed guides with thin 1px neutral gray dashed guides, removed guide drop shadows, reduced the selected-range background to a very subtle gray tint, and removed brightness/glow effects from operation bars. Selected Start/End bars now use a thin gray outline with 2px radius and no outline offset to reduce apparent boundary expansion.
- **Cycle label emphasis:** Operation/Cluster information labels on the left receive a restrained background tint and slightly lighter text when the corresponding operation intersects the selected Cycle range. Time bars themselves keep their normal Cluster colors and brightness.
- **Selection reset:** The Clear Cycle Markers action now resets cycle selection, logic, simulation visibility/result, and calls renderTimeChart() to rebuild all overlays, dimension and selected-row styling from the cleared state. This avoids stale visual state after clearing and makes selecting a new pair possible from the rebuilt chart.
- **Code commit:** f0d79477915177389c31f43b8a874bca7808acb8.
- **Verification:** Latest source blob e7da8ef5f6d4350117d615b27a13b542a7c05c12 passed inline JavaScript syntax parsing. Duplicate HTML IDs and missing DOM references: none. Static checks confirm thin neutral guides, low-opacity range fill, no operation-bar brightness/glow, smaller marker radius, left-label highlighting, and full chart rerender on clear. Actual browser interaction and pixel alignment against the saved workbook have not yet been exercised.
- **Next validation:** Check that guides coincide with the selected bars' visible outer edges and that Clear Cycle Markers immediately allows selecting a fresh Start and End pair.

### 2026-11-08 — Cycle Boundary Click State Recovery

- **User-reported defect:** Clicking a Time Chart Operation to cancel the selected Start/End pair cleared both markers; subsequent clicks could no longer begin a new selection reliably.
- **Root cause:** `selectCycleBoundary()` had a branch that reset both boundaries when the clicked row equaled the currently selected Start while End was still empty. This allowed an accidental empty state from ordinary bar interaction and made click behavior ambiguous.
- **Fix:** Operation-bar clicks no longer clear both boundaries. If no Start exists, the clicked Operation becomes Start. If a complete pair exists, the next click starts a fresh pair at the clicked Operation. Clicking the current Start while awaiting End retains the Start and gives guidance; the dedicated Clear cycle markers button remains the explicit reset. End validation still requires its end time to be later than Start.
- **Code commit:** 24bfeb88ae54262b06d152c9b7ac12c8adcf40e7.
- **Verification:** Inline JavaScript syntax parsing passed. Behavior was verified by reviewing the state transition branches; browser interaction with the user's loaded workbook has not been performed.
- **Next validation:** Select a Start and End, click another bar to restart selection, then select a different End. Also verify Clear cycle markers resets selection.

### 2026-11-08 — Critical Cycle Selection Regression Fix: Preserve Partial Start

- **User report:** Cycle selection remained unusable despite the previous click-state fix; user provided the rendered `.tc-bar` markup for source row 42.
- **Root cause:** `renderTimeChart()` validated both selected source rows unconditionally. Immediately after choosing Start, `endSourceRow` is intentionally `null`, so `records.some(r => r.sourceRow === null)` returned false and the renderer cleared both boundaries on every render. This directly prevented the second click from ever setting End.
- **Fix:** Validate Start and End independently. An unselected (`null`) boundary is now treated as a valid intermediate state; only a selected boundary whose source row no longer exists in worksheet data causes the pair to reset. This restores the original two-click workflow while retaining protection against stale row references.
- **Code commit:** 334efe36d8666f0d5040e9e52c22a06a023ff424.
- **Verification:** Inline JavaScript syntax parsing passed. Static review confirms the partial-selection state is preserved when End is null. Browser interaction with the live workbook has not yet been performed.
- **Next validation:** Click row 42 to set Start, confirm it remains selected after chart redraw, then click a later Operation to set End.


### 2026-11-09 — Time Chart Cycle Boundary Operation Menus + L-Shaped Highlight

- **User request:** Replace direct Operation-bar click selection with a three-dot menu on every Operation row. The menu offers “Set as Start Time” and “Set as End Time”; End must be a later Operation in worksheet order. Either boundary can be reassigned directly without clearing the previous selection first.
- **Selection UX:** Added an accessible per-Operation menu in the left information card. Start can be assigned to any valid Operation. End is disabled until Start exists and is enabled only for a later source row whose End time is after the selected Start time. Reassigning Start preserves a still-valid End and clears an End that becomes invalid; reassigning End replaces it immediately. Direct clicks on timeline bars no longer alter boundary selection. The explicit Clear cycle markers action remains available.
- **Cycle emphasis:** Preserved the subtle cycle window and time-axis guides. Added a restrained horizontal highlight from the left Operation information card across the Start row to the End-time coordinate, plus a continuous vertical guide from that Start row down to the bottom of the visible chart, forming the requested inverted-L cue. Cluster bar colors and operation bar brightness remain unchanged.
- **Scope protection:** No edits to Process Flow / Cycle Logic Editor logic, database schema, migrations, or RLS.
- **Code commits:** 9d975fda9499715da1b865285c62b94d0fff013f (menu selection and highlight) 3fd5aaffb44d73d84574a3d76db0422f1836f323 (scroll-aware L-highlight alignment), and 3a9c396fc5700c7da4922960c5b7a33fe5ad580f (dismiss menus on outside click and keep the vertical guide below the axis when the Start row is filtered out).
- **Verification:** Inline JavaScript syntax parsing passed after both commits. Static source checks confirmed per-row menu controls, disabled invalid End options, replacement of either boundary, preserved Clear action, retained cycle window/guides, and removal of direct bar-click selection. Actual browser interaction, responsive menu placement, and pixel alignment on the user's saved workbook have not yet been tested.
- **Next validation:** On the live Time Chart, verify selecting a Start, selecting a later End, changing Start to a later Operation (which should invalidate an earlier End), changing End directly, and using Clear cycle markers. Confirm the L-shaped highlight follows the selected End boundary while scrolling the chart.


### 2026-11-09 — Highlight Every Operation Between Cycle Start and End

- **User request:** The Operation information card selected as Cycle Start was highlighted, but subsequent Operation cards between Start and End should receive the same highlight.
- **Fix:** Operation-card highlighting now follows worksheet/source-row order. The selected Start row is highlighted immediately, even before an End is chosen. Once End is selected, every Operation row after Start through End (inclusive) receives the same `cycle-in-window` card background. This is intentionally independent of time overlap; the timeline bars, cycle window, and time-axis guides retain their existing temporal calculations.
- **Scope protection:** Changed only the Operation label class expression in `frontend/cycle-time-univer.html`. No changes to Process Flow / Cycle Logic Editor, simulation logic, database schema, migrations, or RLS.
- **Code commit:** ac73e8732674a21031f93de0e93d6f4b70cf341a.
- **Verification:** All inline JavaScript blocks passed syntax parsing. Static source review confirms Start-only highlighting and inclusive source-row highlighting through End. Real-browser appearance and saved-workbook interaction have not yet been tested.
- **Next validation:** Select a Start Operation, then a later End Operation, and confirm all Operation information cards between them are highlighted while cards outside the selected row interval remain unchanged.


### 2026-11-09 — Full-Row Cycle Range Highlight + Neutral Three-Dot Menu

- **User correction:** Highlighting only the Operation description card did not meet the intended visual result. Each Operation from Cycle Start through Cycle End must be filled horizontally from the left description area to the vertical Cycle End time marker. The three-dot button must not remain visually enlarged/selected after setting Start or End.
- **Range highlight fix:** Reworked the highlight geometry to add a dedicated range-highlight class to every currently visible worksheet row whose source row is between Start and End (inclusive). Each row receives the same computed width from the left edge of the row through the Cycle End time coordinate. The existing vertical End guide is retained. This creates a continuous horizontal fill per Operation row instead of tinting only the label cell. Start-only selection continues to emphasize its selected description card without drawing a completed range.
- **Three-dot menu fix:** Removed persistent Start/End selected classes from the menu toggle. The button now returns to its plain three-dot appearance after the menu closes; the visual active treatment is shown only while `aria-expanded=true` (menu open), with a short transition.
- **Scope protection:** Only Time Chart CSS, Operation menu markup, and `updateCycleHighlightGeometry()` were changed. Process Flow / Cycle Logic Editor, simulation logic, database schema, migrations, and RLS were not modified.
- **Code commit:** 97769be846afd3bbe39c060117e1abb3417e392e.
- **Verification:** All inline JavaScript blocks passed syntax parsing. Static checks confirm every visible source row in the inclusive Start-End interval receives the end-coordinate width, the vertical guide remains, and selected menu classes are no longer rendered. Browser visual verification against the user's workbook has not yet been performed.
- **Next validation:** Select Start and End and verify each row from Start through End is shaded from the Operation description through the End marker; after setting either boundary, confirm its menu toggle returns to the plain three-dot state.


### 2026-11-09 — Consistent Light Tint for Operation Bars Inside Cycle

- **User report:** Operation bars carrying the `cycle-in-window` class still retained their full Cluster color and did not receive the same light emphasis as the Cycle background and Operation rows.
- **Fix:** Added a uniform translucent white background-image overlay to `.tc-bar.cycle-in-window`. This brightens all fully-in-cycle Operation bars by the same amount while preserving their underlying inline Cluster colors, so Cluster identity remains visible. Bars outside the selected Cycle and partial-overlap bars are unchanged.
- **Scope protection:** CSS-only change in `frontend/cycle-time-univer.html`. No changes to Cycle selection, row-range geometry, Process Flow / Cycle Logic Editor, simulation logic, database schema, migrations, or RLS.
- **Code commit:** 33bd71397ec406237e8cb100c37c9b8bf6f61edc.
- **Verification:** Static source check confirms the overlay targets only `.tc-bar.cycle-in-window` and does not replace the inline Cluster background color. No browser screenshot or visual check against the user's saved workbook has been performed.
- **Next validation:** Hard-refresh the Time Chart, select Start and End, and confirm every fully-in-cycle Operation bar appears consistently lighter while retaining its Cluster hue.


### 2026-11-09 — Highlight Cycle Window Background on Included Operation Tracks

- **User clarification:** The desired emphasis is a subtle background fill in the timeline cells between the Cycle Start and Cycle End guides for every Operation row belonging to the selected Cycle. The Operation bar's Cluster color must remain unchanged; brightening the bar itself is not the requested effect.
- **Correction:** Removed the previous white overlay from `.tc-bar.cycle-in-window`. Added a `cycle-range-track` class only to tracks whose source-row index is within the selected Start–End interval (inclusive). The existing `.tc-cycle-window` background between the two time guides is now slightly brighter on those tracks only (`rgba(203,213,225,.16)`), while other tracks retain the original subtle fill. This keeps the emphasis in the track background and preserves the underlying Cluster colors of Operation bars.
- **Scope protection:** Changes are limited to Time Chart track rendering and CSS. No changes to Process Flow / Cycle Logic Editor, simulation logic, database schema, migrations, or RLS.
- **Code commit:** 526e6d3c24ea6250f925af1cd2d0aac35dc6113c.
- **Verification:** Static checks confirm the bar overlay was removed and the stronger cycle-window background is assigned only to rows from Start through End inclusive. Browser visual verification with the user's saved workbook has not yet been performed.
- **Next validation:** Hard-refresh the Time Chart and verify that the background band between the Start and End vertical guides is subtly brighter on every Operation track in the selected source-row range, with bar Cluster colors unchanged.


### 2026-11-09 — Hotfix: Restore Time Chart Univer Initialization

- **User-reported regression:** The Time Chart stopped after displaying “Loading Univer spreadsheet engine…” and did not load project/chart data following the Cycle track-background highlighting update.
- **Root cause:** A literal backslash-n sequence (\\n) was accidentally inserted between the new `inCycleRow` declaration and the following `return` statement in the inline JavaScript. This caused a JavaScript `SyntaxError`, preventing the page initialization script from running at all; Univer loading and subsequent data loading therefore never started.
- **Fix:** Replaced the literal characters with an actual source-code line break. No data, project records, chart JSON, database schema, migrations, RLS, or Process Flow / Cycle Logic Editor code was changed. The intended `cycle-range-track` background highlighting remains intact.
- **Code hotfix commit:** 8ebe75137df76cd57d40926d04c06c6d8d5c78bb.
- **Verification:** The inline JavaScript was parsed with `new Function(...)` after the correction and passed. This is a static syntax check only; live browser initialization, Univer CDN loading, and retrieval of the user's saved chart have not yet been tested in an actual browser.
- **Next validation:** Confirm the GitHub Pages deployment succeeds, then hard-refresh the existing Time Chart URL and verify that Univer initializes and the saved chart data loads.


### 2026-11-09 — Extend Cycle Highlight Across Horizontal Operation Cells

- **User request:** The vertical Cycle window between Start and End was already shaded, but the horizontal cells on the same Operation rows also needed a matching subtle background fill.
- **Fix:** Kept the existing vertical .tc-cycle-window shading. Added a restrained fill to the Operation description and numeric value cells for every visible source row from Start through End (inclusive). Added a matching translucent overlay to each corresponding timeline track, clipped horizontally at the selected End-time coordinate. The original timeline grid remains visible and Operation bars retain their Cluster colors.
- **Geometry:** The track overlay width is calculated against each row's actual track rectangle and updated by the existing scroll-aware cycle-highlight geometry routine, so it ends at the End marker rather than filling the full row.
- **Scope protection:** Only Time Chart CSS and updateCycleHighlightGeometry() were changed. No Process Flow / Cycle Logic Editor, simulation logic, database schema, migrations, RLS, or saved chart data changes.
- **Code commit:** 14271ae5b9600b1e325bfced2ab61e94e472f63b.
- **Verification:** Inline JavaScript syntax parsing passed. Static source review confirms horizontal cell/track shading is restricted to rows between selected Start and End and the track overlay width is calculated to the End marker. Browser rendering, scrolling alignment, and the user's actual workbook have not yet been visually tested.
- **Next validation:** Hard-refresh the Time Chart, select Start and End, and confirm the description/value cells and timeline track on each Operation row are shaded consistently through the End marker while Cluster bar colors remain unchanged.


### 2026-11-09 — Revert Duplicate Horizontal Cycle Background Layers

- **User feedback:** The latest horizontal Cycle background change made the Time Chart background visually worse because multiple overlapping background layers were being rendered.
- **Review:** Commit 14271ae added an additional background on the Operation label/value cells, a gradient on each timeline track, and per-track width styling. These layers overlapped the existing row highlight and Cycle window, creating duplicated shading.
- **Rollback:** Restored `frontend/cycle-time-univer.html` to the exact content from commit 390e8c45430cf2271916f6f3aa59d00ae9c35ff1, immediately before the horizontal cell-highlighting change. This removes the duplicate layers while retaining all earlier Time Chart functionality, Cycle Start/End selection, vertical Cycle window shading, and the Univer initialization hotfix.
- **Code rollback commit:** ea7ed488010d4f49474d32317ed83380fbf09777.
- **Scope:** No saved chart data, project data, database schema, migrations, RLS, or Process Flow / Cycle Logic Editor changes.
- **Verification:** Source was restored byte-for-byte from the selected prior commit. GitHub Actions workflow run `42507541552` for code commit `ea7ed488010d4f49474d32317ed83380fbf09777` completed with conclusion `success`. The rollback is therefore deployed through the repository workflow. Actual browser rendering and the user's saved workbook have not yet been visually rechecked.


### 2026-11-09 — Time Chart Current Checkpoint After Cycle Highlight Rollback

- **Current deployed code:** `frontend/cycle-time-univer.html` is restored to the version at commit `390e8c45430cf2271916f6f3aa59d00ae9c35ff1`, with the rollback recorded in code commit `ea7ed488010d4f49474d32317ed83380fbf09777`.
- **Current visual behavior:** Keep the existing Cycle Start/End markers and vertical shaded Cycle window. The attempted additional horizontal background treatment was reverted because multiple background layers overlapped and degraded the visual consistency. Do not reintroduce the previous cell backgrounds, track gradient, or `--cycle-track-highlight-width` implementation.
- **Deployment:** GitHub Actions run `42507541552` completed successfully for the rollback commit. The documentation update is committed separately.
- **Data safety:** No chart JSON, project data, Supabase records, database schema, migrations, RLS, or saved workbook contents were modified.
- **Protected scope:** Process Flow / Cycle Logic Editor and its simulation logic remain unchanged.
- **Validation status:** Source restoration and deployment workflow are verified. Browser-level visual confirmation on the user's actual Time Chart is still pending.
- **Next development direction:** Before attempting horizontal Cycle highlighting again, inspect the existing DOM/CSS layering and design a single coordinated background layer spanning the Operation information cells and timeline track. Avoid stacking independent backgrounds on the row, label/value cells, and track. Implement only after agreeing on the visual approach; preserve the current deployed appearance until then.



### 2026-11-09 — Standalone White-Background HTML Export for Time Chart and Process Flow

- **User requirement:** Export the Time Chart and Process Flow so the files reopen with the same visual arrangement as the website, with white backgrounds suitable for PowerPoint/report presentation.
- **Implementation:** Added two controls to the Time Chart page: `Export Time Chart HTML` and `Export Process Flow HTML`. Each creates a separate static standalone HTML snapshot of the currently rendered view. The export embeds the page's local styles and the shared `frontend/styles.css` content, so the saved file does not depend on the H871 website or Supabase to render the captured chart/flow.
- **Time Chart export:** Captures the currently rendered chart and visible filter state, including its time axis, operations, cluster bar colors, and current Cycle markers/highlights. Removes transient controls and cursor/tooltip elements. Applies a white report background with restrained neutral grid/labels while preserving operation colors.
- **Process Flow export:** Captures the currently rendered Process Flow canvas, including operation nodes, links, arrow direction, AND joins, Entry/Release markers, and current layout. Applies white node cards and a white canvas while preserving the diagram structure.
- **Output and usage:** Two independent `.html` files are downloaded. Open them in Chrome/Edge for viewing, zooming, or use browser Print → Save as PDF. These are presentation snapshots, not editable H871 project documents; the live chart remains editable in the website.
- **Scope/data safety:** Only `frontend/cycle-time-univer.html` and this history document were changed. No database schema, migrations, RLS, project/chart records, or Process Flow / Cycle Logic Editor behavior was changed.
- **Code commits:** `3ac4cff463ade4f742f9dd75ad757515683b6aaa` (feature), followed by export helper fixes `9ad644fb404912e80d10aeae54e4ddf326d7d8e5`, `53395e177eae09cecc76262d69a20261b941d122`, `47c5f083bf5c9675c1b73b26b1224a3c02ec200b`, and `5612a5fc314fbbdce06707f0da0003b0197d3893`.
- **Verification:** Inline JavaScript syntax parsing passed after the final code update. GitHub Actions run `42552745096` for final code commit `5612a5fc314fbbdce06707f0da0003b0197d3893` was queued when this entry was written. Actual browser download, standalone HTML reopening, print/PDF layout, and PowerPoint insertion have not been manually tested.
- **Next validation:** Once the deployment workflow completes, hard-refresh the Time Chart page and export both files from a chart with Cycle boundaries and a configured Process Flow. Open each HTML locally and verify the white-background rendering and print layout.



### 2026-11-09 — Process Flow Operation Text Wrapping (Prevent Description Truncation)

- **User issue:** Long Operation names and mechanism/description text were truncated inside Process Flow nodes.
- **Cause:** The node title and description used `white-space:nowrap`, `overflow:hidden`, and `text-overflow:ellipsis`, intentionally collapsing long content to a single line.
- **Change:** Removed the truncation behavior. Operation title and mechanism/description now wrap to multiple lines, with visible overflow, readable line-height, and `overflow-wrap:anywhere` to keep long unbroken text from disappearing beyond the node width. Node cards retain their existing minimum height and layout width; content can extend the card vertically as needed.
- **Scope protection:** Only Process Flow node text presentation CSS in `frontend/cycle-time-univer.html` changed. Dependency connections, Cycle Logic Editor logic, layout direction, data model, database schema, migrations, RLS, and saved project/chart data remain unchanged. The white-background standalone HTML export includes these same style changes.
- **Code commit:** `32454b8ed2e9fbc14af52e6ab26a085546e47993`.
- **Validation:** Inline JavaScript syntax parsing passed; source checks confirm wrapping rules and no ellipsis truncation. GitHub Actions run `42554800092` was queued at the time of this entry. Actual browser rendering and long-text overlap/connector alignment have not yet been visually tested.
- **Next check:** After deployment, refresh Time Chart, inspect a Process Flow node with long Operation/mechanism text, and verify that all lines remain readable without overlapping neighboring nodes or obscuring connectors.
### 2026-11-09 — Ctrl + Mouse Wheel Zoom for Process Flow

- **User requirement:** Zoom the Process Flow diagram in and out using Ctrl + mouse wheel.
- **Implementation:** Added a zoom indicator to the Process Flow toolbar and a wheel handler scoped only to the Process Flow canvas viewport. Ctrl + wheel up zooms in; Ctrl + wheel down zooms out. Zoom is clamped between 40% and 250%, updates in 10% steps, and keeps the diagram area under the pointer as the zoom anchor where possible. The browser's page zoom is prevented only when Ctrl + wheel is used inside the Process Flow viewport.
- **Interaction compatibility:** Pointer-based node dragging and marquee selection convert screen-space movement back into diagram coordinates using the current zoom factor. The zoom level is a view-only state and is not saved into project/chart data. Existing Process Flow dependencies, node positions, Cycle Logic rules, and database structures are unchanged.
- **Scope/data safety:** Only frontend/cycle-time-univer.html and this history document were changed. No database schema, migration, RLS, Supabase records, or other pages were modified.
- **Code commit:** e36df48f422c07565718bf7a40c1665f80aa4655.
- **Validation:** Inline JavaScript syntax parsing passed after the change. Browser interaction testing for zoom anchoring, node dragging, marquee selection, and connector creation at non-100% zoom has not yet been performed.
- **Next check:** After deployment, open the Cycle Logic Editor and test Ctrl + wheel at different points in the canvas; confirm that node drag, multi-select, and port-to-port linking remain accurate at 40%, 100%, and 250%.

### 2026-11-10 — Collapsible Dependency Links Panel

- **User requirement:** The Dependency Links section should be collapsible and expanded only when the user needs to inspect the full list.
- **Implementation:** Wrapped the existing dependency list in a native accessible disclosure panel. It is collapsed by default; selecting the Dependency Links heading expands it. The existing `logic-dependency-list` element ID and its event delegation remain unchanged, so add/remove behavior and dependency data handling are preserved.
- **Scope/data safety:** Only the Time Chart frontend and this history document were changed. No database schema, migration, RLS, Supabase records, Cycle Logic rules, or Process Flow behavior were modified.
- **Code commit:** f637386f47f13aa0a4f129cde4ab5bc2dc55bc08.
- **Validation:** Source-level structure and change scope checked. Browser interaction and visual testing have not yet been performed.
- **Next check:** Refresh the Time Chart and confirm Dependency Links starts collapsed, expands on click, and still allows existing dependency entries to be removed.

### 2026-11-10 — Move Simulation Settings Beside Run Controls

- **User requirement:** Move the Number of cycles (N) field and the adjacent simulation settings closer to the Run Continuous Flow Simulation / Clear simulation controls for easier cycle-count entry immediately before running.
- **Implementation:** Moved the complete existing `tc-sim-controls` group (Number of cycles, Scheduling model, Pitch policy, and Timeline display limit) from above the Cycle Logic Editor to directly above the simulation action toolbar. The fields, IDs, default values, validation limits, and simulation event handlers are unchanged.
- **Scope/data safety:** Markup relocation only in `frontend/cycle-time-univer.html`. The Dependency Links disclosure remains collapsed by default and unchanged. No Cycle Logic or Simulation Engine behavior, database schema, migrations, RLS, Supabase records, or saved chart data were modified.
- **Code commit:** 543a822c5199d0b0b20e62eca0f33e4e34f3afed.
- **Validation:** Source check confirms the settings block is immediately before the simulation toolbar; all inline JavaScript blocks passed syntax parsing. Browser layout and responsive appearance have not yet been manually tested.
- **Next check:** Refresh the Time Chart and confirm the four settings appear directly above the Run/Clear buttons, with Number of cycles easy to edit before starting a simulation.

### 2026-11-10 — Delete Time Chart from Project Detail

- **User requirement:** Add a way to delete an existing Time Chart directly from its Project detail page.
- **Implementation:** Added a Delete action beside Open chart for each saved Time Chart. The action is shown only to users with Editor/Admin write access, asks for confirmation, disables itself while deleting, and deletes only the selected `project_cycle_time_charts` row using both the selected chart ID and current project ID. On success, the row is removed immediately and the empty-state message is shown when the project has no remaining charts. Errors leave the row visible and restore the button.
- **Scope/data safety:** Only `frontend/navigation.js`, `frontend/styles.css`, and this history document were changed. No database schema, migration, RLS, project records, document records, or other charts are modified by the client action.
- **Code commits:** d8d277978d351b9ae7c0ad56efdc0ff29155ae92 (delete behavior); f262b5ffadc72ee9b3e95f24d8d31c9cde59cfad (button styling).
- **Validation:** Navigation JavaScript syntax parsing passed. Source inspection confirms Editor/Admin visibility guard, explicit confirmation, and deletion constrained by both chart ID and project ID. Browser interaction and Supabase permission behavior have not yet been manually tested.
- **Next check:** Open a Project detail page, verify Delete is visible for an Editor/Admin, cancel once to confirm no change, then delete a test Time Chart and confirm only that chart disappears while other charts remain.


### 2026-11-13 — Direct Time Chart Cards, Overflow Menu, and Copy Chart

- **User requirements:** Open a saved Time Chart by clicking anywhere on its card, remove the separate Open chart button, move the destructive Delete action out of the always-visible card area, and provide a three-dot menu with Copy and Delete actions.
- **Direct navigation:** Each saved Time Chart card is now keyboard-focusable and behaves as a link. Clicking the card opens the matching `cycle-time-univer.html?project_id=...&chart_id=...` URL. Enter and Space also activate the card. The dedicated Open chart button has been removed.
- **Three-dot menu:** Added a top-right overflow menu for Editor/Admin users. The menu contains **Copy Time Chart** and **Delete Time Chart**. Delete remains protected by an explicit confirmation prompt and is constrained by both chart ID and project ID. The old always-visible Delete button has been removed.
- **Copy behavior:** Copy reads the source chart's `title` and complete `chart_data`, deep-clones the JSON payload, updates its title to append `(Copy)`, clears the embedded `chartId`, and inserts a new `project_cycle_time_charts` row with a new database-generated ID and the current user's `created_by`. This preserves the saved Univer workbook snapshot and other serialized chart settings while keeping the copy independent from the original record. The project detail list is refreshed after a successful insert.
- **Scope/data safety:** Updated only `frontend/navigation.js` and `frontend/styles.css` for this feature, plus this documentation entry. No database schema, migration, RLS policy, existing project/chart row, or original chart JSON is changed by the code deployment. A copied chart is a separate database record; later edits to either record do not update the other.
- **Code commits:** `7652be118595bc1d72f799cccef7e5f49afdfd12` (card navigation and menu actions); `af1c869acbb58354e1b573a442cac859dc7c2746` (card and menu styling).
- **Validation:** Re-fetched both changed files from the default branch and confirmed the card click handler, absence of the Open chart button, Copy and Delete menu entries, chart-data copy path, and corresponding menu CSS. Actual browser interaction, Supabase insert permissions, and opening/editing a copied chart have not yet been tested manually.
- **Next check:** After GitHub Pages deployment, open a Project detail page, click a Time Chart card, use the three-dot menu to create a copy, open the copy, and verify that its spreadsheet, Process Flow, Dependency Links, and settings match the source. Edit and save the copy, then reopen the original to confirm it remains unchanged.


### 2026-11-13 — Dismiss Time Chart Options Menu on Outside Click

- **User request:** When the three-dot Time Chart options menu is open, clicking elsewhere on the page should dismiss it without selecting an option.
- **Implementation:** Added a document-level outside-click handler while the menu is open. Clicks inside the menu/card controls do not trigger the outside handler; clicking outside the menu closes it and resets `aria-expanded`. The handler is removed when the menu closes, avoiding a permanently active document listener.
- **Keyboard accessibility:** Pressing Escape also closes the menu and returns focus to its three-dot toggle.
- **Interaction compatibility:** Opening another Time Chart menu still closes the previously open menu. Copy and Delete actions explicitly close the menu before continuing; Delete retains its confirmation prompt.
- **Scope/data safety:** Only `frontend/navigation.js` and this history document were changed. No chart data, project data, Supabase records, database schema, migrations, or RLS policies were modified.
- **Code commits:** `ec7354eade89cafd6dd0b45f180556f3ba8d0f7b` (outside-click and Escape dismissal); `0f3601b1236e415d412e0407e018c796651962fa` (clean up any previously open menu listeners when switching between Time Chart menus).
- **Validation:** Re-fetched the committed navigation source and confirmed the outside-click listener, Escape-key handler, listener cleanup, and explicit menu closure before Copy/Delete. Actual browser interaction has not yet been manually tested.
- **Next check:** After GitHub Pages deployment, open a Project detail page, open the three-dot menu, click an unrelated area of the page, and confirm the menu closes. Also verify clicking Copy/Delete still works and Escape closes the menu.

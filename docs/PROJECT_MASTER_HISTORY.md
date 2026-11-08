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
- User clarified that import must preserve the original Excel coordinates for each selected rectangle, rather than append regions into a continuous table.
- Implemented address entry for multiple ranges separated by semicolons (for example, `A1:C7; D7:E10`), with differing dimensions and overlapping ranges allowed; one **Import selected regions** action imports them at their original row/column positions.
- Current UI uses typed A1 addresses; direct mouse-drag selection on an Excel preview is not implemented or confirmed. Browser verification with a representative workbook remains outstanding.

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
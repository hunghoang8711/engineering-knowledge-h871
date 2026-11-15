# H871 Known Failures and Root-Cause Lessons

This is a curated failure catalogue. It is not a list of blame; it prevents repeating expensive experiments.

## Time Chart / Univer
### Imported data and visible workbook diverged
- Symptom: imported XLSX values were used by Auto Detect, while the displayed Univer sheet remained blank or showed a different workbook.
- Lesson: verify that the workbook instance used for parsing is the same instance attached to the visible Univer UI.
- A proposed `makeCurrent` change broke Univer startup and was reverted (`ba66401` → `a216a0d`). The actual reported startup symptom was later traced to invalid saved Start Time data being surfaced as an engine-start failure.
- Guard chart rendering from invalid configuration so spreadsheet startup can succeed independently of chart visualization (`6e22cac`).

### Misleading “Univer could not start”
- Invalid saved Start Time configuration was treated as a spreadsheet-engine startup error.
- Separate engine initialization, saved-config validation, and chart rendering errors. Do not collapse all failures into one generic loader message.

### Infinite “Loading Univer spreadsheet engine…”
- A static loader can remain indefinitely if a CDN request neither resolves nor rejects, or if main inline JavaScript fails to parse before loader diagnostics execute.
- Add resource-specific timeouts and visible progress/error messages; add an independent early preflight script for parse/runtime errors.
- If the original static text remains unchanged after deployment and hard refresh, first verify that the new page is actually served; do not assume the CDN is at fault.
- On 2026-11-13 a JavaScript syntax error (extra apostrophe in a Map key expression) blocked the entire main script. A temporary GitHub Actions Node syntax check found it; both inline scripts passed after correction. Remove temporary diagnostic workflows/artifacts after use.

### Process Flow dashed link not clickable
- Symptom: solid manual links could be created/removed, but dashed formula suggestions could not be dismissed.
- Root cause: a later `.tc-flow-svg { pointer-events: none }` CSS rule overrode the earlier interactive setting; the canvas pointer-down handler also treated suggestion clicks as empty-canvas marquee selection.
- Fix: force SVG pointer events on, set transparent hit path to `pointer-events:stroke`, enlarge hit width, and exclude edge hit paths from marquee selection.
- Code fix `263f693`; user/browser acceptance still required: click dashed edge, save/reload, restore, test same-pair manual edge and Undo/Redo.

### Over-aggressive Process Flow refactoring risk
- User confirmed the existing flow editor and formula recognition were working before layout improvements. Protect dependency semantics, stable Operation IDs, simulation, resource assignments, and saved data when modifying only visual geometry.
- Shortest endpoint selection is not global obstacle avoidance. Do not promise that connectors never overlap or avoid all nodes.

## Creo Elements/Direct Lisp
### Undefined helper function
- Error: `SEL_ITEM-P` undefined in all three diagnostics.
- Lesson: do not run test harnesses that depend on undocumented/undefined helpers. Validate helper availability and command registration before interpreting test output.

### Unified results window / host embedding
- Error: `Could not embed the results browser in its host window` / `Could not create the unified results window`.
- If no-match assemblies return normally but assemblies with matches fail at window creation, search likely succeeded; isolate UI host-window creation and parent ownership.
- Do not rewrite part-search logic without evidence.

### Visible list but no selection / Apply effect
- A visible list and selectable-looking rows are not proof that host model selection is wired.
- Test row click → selected state → Apply → model selection as separate transitions. Select All must feed the same selection model as individual rows.
- A previous regression was fixed when row selection and Apply were restored; preserve that event path when adding controls.

## General web application
- A green Pages action proves deployment workflow completion, not that browser code runs or that Supabase returns the intended data.
- JavaScript parse errors can prevent all following startup code from running; syntax-check every inline script in HTML pages.
- CSS pointer-events and event delegation can silently disable interactive SVG paths.
- Distinguish network/CDN failures, syntax failures, data/config failures, auth/RLS failures, and render failures. Instrument each stage separately.
- Before a change, reproduce and identify the failing layer. Do not make speculative schema or UI rewrites.

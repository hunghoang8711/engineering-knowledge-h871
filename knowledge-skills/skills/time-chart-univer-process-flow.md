# Skill — Time Chart, Univer Spreadsheet, and Process Flow

## Purpose
Build and maintain an editable cycle-time tool where spreadsheet data is the source of truth and Process Flow / simulation are derived views.

## Architectural invariants
1. Keep the real spreadsheet engine (Univer 1.4.0) rather than implementing a fragile home-made grid.
2. Treat workbook data and formulas as authoritative; charts and Process Flow are projections.
3. Use stable Operation identity across row insertions/deletions. Never use visible row numbers as durable dependency identity.
4. Preserve Excel order in the operation list and timeline.
5. Keep saved chart compatibility; use existing `chart_data` unless a schema change is demonstrably essential.
6. Do not silently overwrite user-authored formulas or manual links when regenerating automatic suggestions.
7. Separate formula-derived suggestions (dashed) from user-created dependencies (solid).

## Spreadsheet and import workflow
- Inspect current workbook/sheet lifecycle before changing import code. A recurring bug pattern was reading data from an imported workbook while the visible Univer instance still displayed a different/blank workbook.
- When importing multiple rectangular ranges, append in explicit user-selected order and validate consistent column count.
- Formula offsets must be translated when a region is appended. Do not assume that copying formula text unchanged preserves references.
- Test formula references and arithmetic: `=B1`, `=B1+C5`, `=B1-C5`, `=B1*C5`, `=B1/C5`, and parentheses if supported.
- Distinguish formula text, cached result, calculated value, and rendered cell value. A parser recognizing a formula is not proof that Univer recalculates it.
- Retain user-selected Start/Duration/End/Cluster column roles and range configuration after importing another worksheet/range where the user's workflow expects it.
- Parse operations from the actual row sequence, tolerating blank rows. Deleting blank rows in Excel must not cause unrelated rows to stop being recognized.
- Reconcile imported rows to workflow nodes using stable IDs and source mapping, not brittle absolute row indices.

## Timeline semantics
- Operation bar begins at Start and ends at End; Duration may be derived from End - Start or Start + Duration depending on configured source roles.
- Validate missing/negative/inconsistent timing values before rendering.
- Do not reorder rows by cluster/mechanism unless the user explicitly requests it.
- Cluster rows may show idle gaps as gray intervals; ensure they do not change actual operation timing.
- Repeating N cycles must use operation start/end bounds and the intended cycle boundary semantics.
- Resource constraints and continuous simulation must remain separate from the visualization-only layout.

## Process Flow graph
- Formula-derived edges are suggestions. Dismissing one must not alter the Spreadsheet formula.
- Persist dismissed suggestions by stable Operation IDs in `cycleLogic.suppressedFormulaLinks` (existing implementation noted in master history).
- Manual links are independent; removing a dashed suggestion must not remove a solid manual edge for the same pair.
- Manual links need duplicate and cycle/loop checks.
- Restore suggestions should restore formula-derived visual edges without mutating workbook cells.
- Auto layout should be deterministic: dependency layering, crossing-reduction, direction option, orthogonal paths, shortest endpoint ports. Current shortest-port method evaluates all 16 source/target side pairs and uses Manhattan distance; it is not full obstacle avoidance.
- Keep pointer hit targets separate from canvas marquee selection. SVG pointer-events CSS can override earlier interactivity rules.
- Preserve existing node dragging, multi-select, alignment guides, undo/redo, AND joins, and simulation dependencies when adjusting routing.

## Debugging checklist
1. Does the workbook actually load into the visible Univer instance?
2. Does the saved snapshot match the imported workbook and selected sheet?
3. Do formulas have cached results? Does Univer calculate them?
4. Are operation mappings derived from current row data or fixed row coordinates?
5. Are blank rows, merged cells, duplicate headers, hidden rows, and formula errors handled?
6. Do Operation IDs remain stable after row insertion/deletion?
7. Are formula and manual dependencies stored separately and merged only at the intended stage?
8. Are SVG hit paths receiving pointer events, or is another CSS rule / marquee handler intercepting the click?
9. Does save/reload preserve chart, formulas, manual links, and suppressed suggestions?

## Regression test matrix
- Import one range; import multiple disjoint ranges; append with formula references.
- Delete a blank row; insert a row; reorder operations; ensure the same operation retains its links.
- Save, reload, export, and re-import.
- Formula-derived dashed edge dismiss/restore; solid manual edge create/remove; same-pair coexistence.
- Fork/merge graph, multiple branches, disconnected operations, AND join, long wrapped labels.
- Drag nodes after auto-layout; verify layout does not rerun unexpectedly.
- Undo/redo after layout, link create/remove, suggestion dismiss/restore.
- Continuous simulation with resources and N cycles; confirm layout-only edits do not alter schedule semantics.

## Known history references
- XLSX/Univer workbook mismatch and saved Start Time misleading startup error: commits `ba66401`, `a216a0d`, `6e22cac`.
- Start→End bars and Excel row-order preservation: `9bf79d79`.
- Layered layout and orthogonal routing: `9fa8522`.
- Shortest connection ports: `a347614`.
- Dismissible formula suggestions: `a40e626`; pointer hit-testing fix: `263f693`.
- Full chronology and exact caveats: `docs/PROJECT_MASTER_HISTORY.md`.

 
## Time Chart dependency-arrow projection (2026-11-15)
- Render Time Chart arrows from `allFlowDependencies(records)`; do not create a second link store or infer links from bar timing.
- Keep Process Flow as the single source of truth. The renderer must respect formula suggestion suppression, manual links, and formula+manual same-pair merging already handled by `allFlowDependencies`.
- Anchor each arrow at the source bar end and target bar start; use orthogonal SVG paths and arrowheads. Respect visible Operation rows after cluster filtering.
- Rebuild the overlay after the Time Chart DOM is rendered. Do not mutate workbook formulas, manual dependency records, stable Operation IDs, or simulation state from the renderer.
- Initial midpoint routing is not obstacle-aware. Verify fork/merge and dense/crossing graphs in a real browser before attempting more advanced lane allocation.
- Regression: chain, fork, merge, multiple branches, same-pair formula+manual, dismissed/restored suggestion, cluster filter, earlier target time, chart scroll, window resize, save/reload.

 
## Dependency-arrow routing refinement (2026-11-15)
- Avoid the original direct midpoint route: it can cross unrelated bars and looks noisy.
- For a source/target pair with a positive time gap, route through a candidate vertical channel between source-bar end and target-bar start. Reject candidate channels that intersect any intermediate Operation bar; prefer channels with clearance from bars and already-used channels.
- When there is no safe time-axis gap (overlapping or reversed time positions), route around the bottom of the timeline in a dedicated lane. Add bottom padding proportional to the number of detours so the SVG is not clipped.
- Use thin, muted solid arrows for manual dependencies and quieter dashed cyan arrows for formula suggestions.
- Keep this renderer read-only and derive all edges from `allFlowDependencies(records)`.
- Visual QA remains mandatory: dense branch/merge, overlapping bars, reversed time, filtered rows, chart scrolling, resize, and bottom-lane clipping.

 
## Screenshot-driven arrow routing correction (2026-11-15)
- The previous bottom-detour fallback caused long horizontal rails across the chart. Do not route fallback paths along `trackRight` then across to `trackLeft` beneath every row.
- Select source and target bar sides according to their relative time centers (right-to-left for forward time, left-to-right for reverse time).
- Route through a vertical x-channel between the endpoint rows. Generate candidate channels from the endpoint midpoint, endpoint x positions, track margins, and intermediate bar edges ± clearance.
- Reject channels intersecting any intermediate visible Operation bar. Score remaining channels by total horizontal travel and penalize reuse/crowding of already allocated channels.
- If no safe internal channel exists, use the nearer outer track edge. Avoid full-width bottom rails and artificial bottom padding.
- Keep the renderer read-only and derive edges exclusively from `allFlowDependencies(records)`.
- Validate with screenshot/browser tests; syntax checks alone do not establish visual correctness.

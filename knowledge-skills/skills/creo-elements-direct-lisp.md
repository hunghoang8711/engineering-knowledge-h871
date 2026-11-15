# Skill — Creo Elements/Direct Modeling 18.1 Lisp Tooling

## Environment
- Target is **Creo Elements/Direct Modeling 18.1**, not Creo Parametric.
- User also works with AutoCAD 2023 and Inventor 2021.
- User uses basic Lisp and expects practical commands integrated into menus/ribbons or the user input line.

## User workflow preferences
- Prefer an interactive results window over a plain text output dump when the task is to inspect/select parts.
- Results should behave like a BOM/filter table: compact columns, readable values, selectable individual rows, Select All, Apply, and ideally double-click to locate/highlight the corresponding part in the model.
- Material filtering should focus on the pair of values called Instance and Base when that is the actual requested criterion; do not add unrelated comparison controls.
- Keep command names compatible with the user's command/input line and avoid multi-letter command assumptions that the host parser cannot invoke.
- Version Lisp files (e.g. ver02, ver03) while keeping the consolidated knowledge and current accepted source in the shared main repository, rather than creating a branch for every version.

## Debugging lessons from prior attempts
- A diagnostic that references an undefined helper such as `SEL_ITEM-P` fails before testing the intended behavior. Ensure every helper is defined or use documented host APIs.
- A window-embedding failure can be caused by host-window parenting / unified results window creation, not by the underlying part search. Keep search results and UI embedding diagnostics separate.
- If assemblies with no matching part correctly show “not found” but matching assemblies trigger “Could not create the unified results window”, investigate the result-window creation path, not the matching algorithm.
- If list rows display but clicking a row or Apply does nothing, check event binding, selected-row state, and the bridge between UI selection and host-side selection. Do not mistake a rendered list for a working selection tool.
- When merging a button or window into an existing working tool, preserve the previously working selection/apply event path; regression-test before and after integration.
- User input line invocation is a distinct requirement from loading a Lisp file; test the actual invocation path rather than assuming a successful load means the command works.

## Required test matrix
1. Load the Lisp file in Creo Elements/Direct Modeling 18.1.
2. Invoke the command from the actual user input line.
3. Test an assembly with no matching parts and confirm a normal empty result.
4. Test an assembly with matches and confirm the result window opens.
5. Select one row; verify the corresponding part is selected in the model.
6. Select multiple rows; verify selection state.
7. Select All; verify all rows are selected.
8. Apply; verify model selection matches the selected rows.
9. Double-click; verify the part is located/highlighted as intended.
10. Test narrow/long part names, instance/base columns, and large assemblies.
11. Test both the new version and the previous known-good version before replacing it.

## Evidence discipline
The historical chat summaries record several failure reports but do not prove the exact current Lisp source is complete. Fetch the current versioned source and history from GitHub before continuing. Do not invent undocumented Creo Lisp API names.

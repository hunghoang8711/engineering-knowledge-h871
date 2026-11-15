# Skill — CAD Part Filtering and Results-Window UX

## Intended workflow
For assembly/material/density diagnostics, users need a practical inspection tool rather than a text-only report:
1. Scan the current assembly and collect matching part records.
2. Display a compact BOM-like results table.
3. Allow selection of one row or multiple rows.
4. Provide Select All / Clear All.
5. Apply the selected rows to actual Creo model selection.
6. Where supported, double-click a row to locate/highlight the corresponding part in the viewport.
7. Keep columns compact and expose important values without excessive horizontal scrolling.

## Data and filtering principles
- For material lookup, the requested matching pair may be exactly Instance and Base; avoid inventing comparison modes or unrelated filters.
- Match the complete requested pair of values; do not treat one matching field as sufficient.
- Distinguish display labels from actual part attributes and verify the source of Instance/Base values.
- Preserve assembly path / occurrence context when identical part names can appear in multiple locations.
- A “not found” result is a valid normal outcome, not an exception.

## UI-to-host selection contract
Treat each transition as a separate test:
- result row click updates UI selection state;
- Select All updates the same selection model;
- Apply converts selected records to actual host part selection;
- double-click locates the correct occurrence;
- Clear All clears UI and host selection only according to the intended UX.

A visible row, highlighted checkbox, or working Select All button does not prove host-side selection works. The Apply handler must consume the same stable selected-record set.

## Window and embedding diagnostics
If no-match assemblies show a normal empty result but matching assemblies fail with a unified-results-window / host-window embedding error, isolate the UI creation and host-parenting path before changing the part search algorithm.

If an embedded browser/results host cannot be created, record:
- whether matching records were found;
- whether a standalone result window can be created;
- parent/owner window handle;
- UI framework/host API used;
- exact error and call site.

## Current conversation-derived state
- User reported the results table and filter controls appeared, but row selection and Apply stopped working after a UI integration change; both were later restored and user confirmed they worked.
- User requested Select All and narrower columns so Instance/Base values are visible without excessive horizontal scrolling.
- Earlier unified results window failures were reported for assemblies with matching parts, while no-match assemblies returned normally.
- Density diagnostic tests failed because `SEL_ITEM-P` was undefined in all three test variants. Do not reuse that helper unless it is defined and supported.
- The exact current source and latest accepted version must be fetched from the relevant GitHub repository before further work; this package records lessons, not a substitute for the implementation.

## Acceptance tests
- No-match assembly.
- One match and multiple matches.
- Same part name at multiple assembly occurrences.
- Select one row; Select All; Clear All; Apply.
- Double-click locate/highlight.
- Instance/Base exact-pair match and near-miss pair.
- Long part names, narrow columns, large assemblies.
- Actual user-input-line invocation and Lisp load sequence.

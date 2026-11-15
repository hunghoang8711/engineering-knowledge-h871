# Start Here — H871 Continuation Protocol

## Objective
Resume H871 work with minimum repeated discovery and without damaging existing project data or working features.

## First 10 minutes of a new session
1. Read this file, then `knowledge-skills/PROJECT_CONTEXT.md` and `knowledge-skills/SKILL_INDEX.md`.
2. Read the latest end of `docs/PROJECT_MASTER_HISTORY.md`; search it for the module being changed.
3. Inspect the current `main` HEAD, recent commits, changed files, open pull requests, and relevant GitHub Actions runs.
4. Fetch the exact current source files and inspect the relevant functions, event handlers, CSS, data contracts, and callers. Never edit from an old snippet alone.
5. Identify the live deployment/backend state that matters. A source commit is not proof of deployment; a successful workflow is not proof of browser behavior.
6. Write down the baseline, requested change, protected behavior, likely regression surface, and acceptance tests before editing.

## Required implementation discipline
- Work incrementally on `main` for routine changes, as preferred by the project owner. Do not create a branch for every small fix.
- Do not start coding until current repository state and latest implementation are checked.
- Make the smallest coherent change. Avoid unrelated refactors and avoid changing working modules without explicit need.
- Preserve existing data, IDs, schema, RLS, saved charts, formulas, and user workflows unless the request explicitly requires a change.
- Do not run a migration merely because a migration file exists. Reconcile it with live schema first.
- Do not add paid services, billing, paid model fallbacks, or hidden cost dependencies.
- For browser features, validate syntax and source invariants, then run or guide a real browser acceptance test. Clearly state what remains untested.
- Update documentation in the same workstream; the master history is not optional.

## Evidence labels
Use these labels consistently:
- **User-confirmed:** user explicitly tested and confirmed the behavior.
- **Live-verified:** directly checked against deployed app/backend during this work.
- **CI-verified:** a named workflow/run passed; only the checks in that workflow are proven.
- **Source-verified:** current committed source was inspected or parsed; runtime behavior is not proven.
- **User-reported:** user reported a dashboard/database/runtime state.
- **Unverified / open:** not yet tested or still failing.

## Completion report template
- Changed:
- Root cause / design:
- Commit:
- Source/CI validation:
- Live/browser validation:
- Data/schema impact:
- Protected behavior:
- Remaining acceptance test:
- Documentation updated:

## When context is missing
Do not guess. Search prior project context and the master history; inspect commit diffs and relevant files. Ask one concise question only when a missing fact blocks safe progress. Record the new answer in the package if it is durable.

## Security
Never place secrets in source, issues, docs, logs, or browser bundles. Never upload customer/company documents to this public repository. Do not expose Supabase service-role keys or Gemini API keys in frontend code.

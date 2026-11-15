# Playbook — Feature / Bug-Fix Workflow

## 1. Scope
Translate the user's request into one observable behavior. Record what must change and what must remain unchanged.

## 2. Preflight
- Read `knowledge-skills/START_HERE.md` and the relevant skill.
- Check current main HEAD and latest commits.
- Fetch current source and inspect full call chain, related CSS, event handlers, persisted data shape, and callers.
- Check current workflow/deployment state.
- For backend changes, inspect live schema/RLS/functions before proposing SQL.
- Locate relevant master-history entries and known failure lessons.

## 3. Plan
Write a compact plan with:
- user-visible acceptance criteria;
- protected invariants;
- likely regression surface;
- test data / reproduction;
- exact files to change;
- whether database impact is expected (default: none).

## 4. Implement
- Make the smallest targeted edit.
- Avoid unrelated refactors, broad search/replace, and speculative compatibility changes.
- Keep user data and old saved chart formats compatible.
- Keep source code, UI behavior, and persistence semantics aligned.
- Prefer explicit guards and stage-specific errors over generic catches that hide root causes.

## 5. Validate
- Parse/lint all affected JavaScript (including inline scripts).
- Run targeted automated tests if available.
- Inspect the diff and ensure only intended files changed.
- Verify workflow result after commit.
- Guide or perform browser tests for actual interactions and persistence.
- For DB changes, validate migration against live schema and access policies.
- Record tests not performed; never imply untested behavior is complete.

## 6. Document
Update:
1. relevant skill or known-failure entry;
2. `docs/PROJECT_MASTER_HISTORY.md` with date, request, root cause/design, fix, commit, validation, data/schema impact, open tests;
3. this package index if a new skill/playbook was added.

## 7. Report
Use the completion report template in START_HERE. Include commit and direct links. State the remaining user acceptance test explicitly.

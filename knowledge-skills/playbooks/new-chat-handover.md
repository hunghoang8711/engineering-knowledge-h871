# Playbook — Starting a New Chat / Handover

Paste this instruction into a new H871 project conversation:

> We are continuing the ENGINEERING-H871 project. First read `knowledge-skills/START_HERE.md`, `knowledge-skills/PROJECT_CONTEXT.md`, and `knowledge-skills/SKILL_INDEX.md` in the GitHub repository `hunghoang8711/engineering-knowledge-h871`. Then read the latest entries and relevant module history in `docs/PROJECT_MASTER_HISTORY.md`. Inspect the current `main` branch source, commits, and workflows before proposing or changing code. Preserve all user decisions, data, schema, RLS, and working features. Do not create a branch for every small change; routine work should update `main`. Do not use paid services or enable billing. Treat spreadsheet data as the source of truth for Time Chart. Distinguish source validation, CI success, and real browser verification. Update the skill package and master history after every meaningful change. Summarize current status, open tests, and the next smallest safe step before implementation.

## Handover checklist
- [ ] Read package entry points.
- [ ] Read latest master-history entry.
- [ ] Confirm current main commit.
- [ ] Identify relevant source and open PR/workflow state.
- [ ] Confirm deployment and backend state when applicable.
- [ ] Recover last user-confirmed behavior and current open issue.
- [ ] Do not repeat failed approaches documented in known-failures.
- [ ] Continue with one scoped change and document it.

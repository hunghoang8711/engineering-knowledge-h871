# H871 Engineering Knowledge & Skills Package

This folder is the portable handover package for the Engineering Knowledge Hub (H871). It is designed so a fresh ChatGPT session or engineer can continue work without relying on the original conversation.

## Read order
1. [START_HERE.md](START_HERE.md) — mandatory onboarding and continuation procedure.
2. [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — product, architecture, constraints, and current known state.
3. [SKILL_INDEX.md](SKILL_INDEX.md) — skills and playbooks by task.
4. [skills/](skills/) — reusable technical skills.
5. [lessons/](lessons/) — failure analysis and engineering lessons.
6. [playbooks/](playbooks/) — repeatable operating procedures.

## Canonical source hierarchy
- `../docs/PROJECT_MASTER_HISTORY.md` is the detailed chronological project record and must remain the canonical historical log.
- Current source code, migrations, deployed Supabase state, and current GitHub Actions runs outrank old notes.
- This package is a curated operational summary, not a substitute for inspecting the current implementation.
- Conversation-derived details are labelled by confidence. Not every historical ChatGPT message is available as a verbatim transcript; the package consolidates retained project context, user requirements, prior conversation summaries, existing documentation, and Git commit evidence.

## Maintenance rules
- Update this package on `main`; do not create a new branch for routine knowledge consolidation.
- After every meaningful feature, bug fix, failed experiment, deployment, migration, or changed requirement, update the relevant skill/lesson and append a dated entry to `docs/PROJECT_MASTER_HISTORY.md`.
- Preserve existing knowledge. Prefer additive edits over replacing files.
- Separate confirmed behavior, source-level validation, user-reported state, and unverified assumptions.
- Record the exact symptom, root cause, fix, regression risks, commit, test evidence, and next acceptance test.
- Never store credentials, API keys, customer files, confidential drawings, private extracted text, or personal data in this public repository.

Last consolidated: 2026-11-15 (Asia/Ho_Chi_Minh).

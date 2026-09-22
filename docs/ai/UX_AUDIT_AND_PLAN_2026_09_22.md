# Workspace UX audit and implementation plan — 2026-09-22

STATUS: audit in progress; no application implementation authorized in this update.

- Active account: Account A.
- Objective: inspect the current public website as a user, investigate Build / Explore prediction blocking and inconsistent controls, and prepare a detailed plan for Account B before implementation.
- Starting main: `3498b5c31d94af3007e20c0de80cd4fafef5b1a4`.
- Released application: 4.1.2, code commit `e6d4585a648bd624d1db41dc3d7e60037c448b4b`.
- Working documentation branch: `docs/workspace-ux-audit-plan`.
- Scope: source/CI review, live interaction audit, baseline checks and a proposed repair plan. Do not modify application source, numerical tolerances or production as part of this audit.

## Initial finding, pending live reproduction

The supplied screenshot shows Build / Explore and All Tools selected while diagrams and peak metrics are hidden behind Predict before reveal. Source review finds that `practice` is restored and saved as a general view preference; `shown('practice')` does not check the workspace phase. Header Build entry and workspace Build navigation use different logic. Investigate persistence, all output surfaces, explicit learning exit, and tool visibility before choosing the repair.

## Remaining audit work

Reproduce mode switching and reload, inspect learning and editing flows, review responsive evidence and controls, freshly run the Node baseline, inspect exact-main browser CI, then replace this checkpoint with findings and a phased implementation/validation plan. Existing green tests must not be treated as evidence that an untested user journey works.

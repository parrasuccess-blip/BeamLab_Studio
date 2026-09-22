# Workspace UX audit and implementation plan — 2026-09-22

STATUS: live faults reproduced / numerical baseline and current-main browser CI green / detailed plan in preparation. No application implementation in this update.

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

## Live audit checkpoint

- Confirmed on public 4.1.2: Learn → Practice mode → workspace Build leaves reactions/SFD/BMD masked. Reload remains masked. Header Build clears it. Analyse also inherits the masking.
- Confirmed: Show Why prints the hidden shear value; Show working → Support reactions displays both hidden reactions.
- Confirmed: ordinary object selection opens a floating inspector over Undo/Redo and panel buttons at a 1358 px laptop viewport. The compact direct-label editor repair remains intact.
- Confirmed: choosing 1st Year in Learn carries that tool restriction into Build/Analyse/Review; stress/deformation controls disappear and manual criteria are unavailable until the level is changed again.
- Confirmed: editing a lesson point load clears the active lesson without an explicit activity-ended explanation, leaving the temporary example and prediction masking active.
- Working in live checks: Previous/Next/All lessons; restoration of the original 7 m engineering model, Undo history and comparison; Undo/Redo back to 6 m; invalid 0 m input rolls back after the deferred edit completes.
- Fresh npm ci / npm run build / npm test succeed: 1,272 passed, zero failed/skipped. Current-main CI 35729723993 succeeds; browser job 106752152285 records 112 passed (4.1m), zero retries. This is CI execution, not a new local browser-suite run.
- Fresh public HTML and release/hash metadata match local dist/index.html: 735,456 bytes, SHA-256 d683284d28cb618e43ffeee6aec234ea152d9a460b6723cb48735bf72fd32d04.
- Reviewed the released 4.1.2 phone screenshots from browser artifact 10694401811: direct-use layout and the long focused-lesson layout. Manual interaction in this audit uses the public desktop browser; do not claim fresh physical-phone testing.
- Draft documentation PR: #20. No source, tests, main or production changes.

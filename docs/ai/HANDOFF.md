## Final browser assertion refinement — Account B, 2026-09-23

**STATUS: 1,294 numerical checks / 135 of 136 browser checks on 3ca8691 / final browser rerun pending.** Firefox’s actual edit/rollback/restoration journey now passes and both pointer presses hit the editable text. Chromium and narrow Chromium pass too. WebKit opens the compact editor successfully, but the added before-hover/after-focus geometry assertion includes an 11px movement outside the intended two-press comparison. The test now records label geometry at each actual pointerdown: both presses must hit the same editable label and remain within 1px. No forced clicks, retries or numerical tolerance changes. The original complete journey remains. Only the test and recovery record change at this checkpoint; application artifact is unchanged from `3ca8691`.

## Firefox root-cause refinement — Account B, 2026-09-23

**STATUS: hover-layout repair checkpoint / validation pending / not released.** Preserved Account A’s 4.1.3 recovery. Checkpoint `1536123` passed numerical validation but the stronger browser stability check found an 18px Firefox shift; two phone failures measured initial auto-scroll rather than layout (corrected in `a7c51a5`). The wrapped hover prompt above the graphs becomes a shorter numerical readout on pointer movement, moving the SVG label before the click. Geometric fallback at pointerdown does not address this preceding reflow and has been replaced.

Hovering an editable label now keeps the readout stable. Active dragging, beam/plot hover and the explicit inspection control continue to update it. The real double-click, question rollback, Undo/history and less-than-one-pixel target-stability assertions remain. This is the final interaction repair under test, not a numerical change. D-013 records the already-approved learning/engineering separation. Candidate artifact/production status must be verified after green final CI.

## Current recovery — Account B, 2026-09-23 (after Account A’s release preparation)

**STATUS: Firefox label repair checkpoint / draft PR #21 / not released.** Starting head `c2374b4b79ff00f1c36bb3fd5b536c17b237fdfa`; branch `feature/unrestricted-engineering-learning-safety`; main `d4c0479`. Inspected all three newer Account A commits (`266d973`, `cf59e7c`, `c2374b4`) and retained mobile in-flow editing, lifecycle/masking fixes and 4.1.3 identity. Account A’s final Firefox repair mentioned in chat was not on GitHub.

Exact starting-head CI **35818969990**: numerical job succeeds; browser job **107046555262** reports **135/136 passed**. The remaining Firefox trace records a label press targeting the underlying object rectangle, then an inspector reflow moving the beam before the second press. Resolve visible inline-label bounds before deciding object-body selection. Keep the actual double-click/invalid-input regression; additionally assert the label does not move and the full inspector stays closed. Normal body selection and locked objects retain their inspector path. No solver change.

Artifact retrieval is now available through the supported file materialization tool (artifact **10732742734**). Removed only the redundant base64 screenshot logging; viewport screenshots remain in CI artifacts. New validation is pending after this checkpoint. Do not merge until the four-project suite and rendered desktop/mobile evidence pass, then verify production independently. Broader UX plan stages remain follow-up work.

## 4.1.3 candidate preparation — Account A, 2026-09-23

**STATUS: candidate identity prepared / numerical checks green / browser gate running.** Functional recovery checkpoint cf59e7c retains B’s changes and repairs the phone editor’s legacy CSS override. Version 4.1.3 is now explicit in package, build, verification, tutor health and release-identity assertions; BL410 model references stay unchanged. Release notes describe this first correctness increment and leave the broader redesign explicit.

Fresh local 4.1.3 build/test: **1,294 passed**, zero failed/skipped. Hosted cf59e7c preview checks passed: Next/Previous without stale edited-example notice; invalid lesson input preserves the question; changing level remains in Learn; original 8 m beam returns; exam Undo and working are disabled; Build offers exit and restores that original. Added the level-change route regression. Current browser suite contains 136 checks, running in all four CI projects. No final browser or visual pass is claimed yet.

Production separately re-downloaded: version 4.1.2, 735,456 bytes, SHA-256 d683284d28cb618e43ffeee6aec234ea152d9a460b6723cb48735bf72fd32d04. No merge or release has occurred. The current recovery checkpoints below are chronological context; this paragraph is the newest state.

## Recovery repair checkpoint — Account A, 2026-09-23

**STATUS: mobile CSS and lifecycle repairs implemented / 1,294 local checks pass / browser validation next.** Removed the obsolete higher-specificity mobile fixed-inspector rule; the reserved editor row now owns phone placement. Retained the physical Undo hit assertion and added its computed-position assertion. Corrected the new guided-plan test to select its exact visible button label. Added pointer-event diagnostics for the unresolved Firefox opening timeout; no retries or forced clicks.

Reconciled source-supported missing refinements: clear stale changed-activity notices after replacement/restoration; keep the current destination when changing learning level; omit comparison trace values until every response is revealed; reject missing fixed-question fingerprints; disable history-dialog Undo while a question is locked; ignore late tutor responses when a different dialog is open. Existing rollback and completed-answer evidence fixes from Account B remain unchanged. Extended the existing browser journeys to cover Next/Previous notice cleanup and partial-reveal comparison hiding. CI retains normal artifacts and logs a viewport-only screenshot from the editor journey for review when artifact delivery is unavailable. Version preparation and final release remain pending.

## Current recovery — Account A, 2026-09-23

**STATUS: repairing remaining browser failures / draft PR #21 / not released.** Active branch: `feature/unrestricted-engineering-learning-safety`. Starting head: `cd572dceaeb77cf08c3d68e732ca2233c6254d61`; main remains `d4c0479399e6e50582e7ed682c35912ac45f83dc`. Account B’s two later commits are retained. Older unpushed Account A work is isolated in a separate worktree and must not overwrite this branch.

Fresh installation/build/numerical baseline: **1,294 passed**, zero failed/skipped. Latest exact-head PR run **35804104092**: **130/136 browser checks passed**. Failures: four ambiguous guided-plan button locators in the new evidence test; one Firefox inline-editor opening timeout; one real 360px Undo obstruction. Diagnostics identify the inspector Load case selector covering Undo. Source confirms an older `.inspector.has-selection:not([hidden])` fixed-position rule overrides the new mobile flow layout. Keep the hit-test and all solver tolerances intact.

Implementation checklist: remove the obsolete floating-mobile rule; resolve label-pointer lifecycle and focused test selectors; reconcile remaining transition/answer-surface edge cases against current source; checkpoint before the full four-project run; prepare 4.1.3 identity only with truthful validation records. Test checklist: preserve all existing assertions, inspect desktop/mobile evidence, exercise hosted flows, then verify production independently after a validated merge. The hosted preview is accessible to Account A; Account B’s access limitation remains historically accurate. Artifact delivery currently returns 403; no fresh artifact screenshot review is claimed yet.

## Active recovery — Account B, 2026-09-23

**STATUS: PR #21 implementation recovered / one browser failure / not release-ready.** Starting main `d4c0479399e6e50582e7ed682c35912ac45f83dc`; feature `feature/unrestricted-engineering-learning-safety` at `7cac76b9c570e2b4501af08ba9ff4d11cf6e6a68`. Account A's approved audit PR #20 is merged. Continue this implementation, not the older local audit or annotation worktrees.

Exact-head PR CI `35796548498`: numerical job passed; browser job `106977095224` has **127 passed / 1 failed out of 128**. The small-mobile Chromium selected-object-editor journey fails the real hit-target assertion for Undo. Do not remove it or force clicks. Account A's supplied narrative describes later session/invalid-edit fixes and 4.1.3 preparation, but these are not in the fetched branch. Recover those intentions against actual code before release. Committed package version is still 4.1.2; production has not been updated by this PR.

Next: establish fresh local baseline, diagnose the mobile obstruction, inspect the missing transition/invalid-edit repairs, checkpoint coherent changes, run all four browser projects, inspect rendered evidence, and verify the actual public artifact only after a validated merge. Preserve the new activity/explanation policies and all 4.1.2 model/history/pointer repairs. Broader layout/notation work remains separate.

Account B milestone: fresh `npm ci` / `npm test` passes **1,294/1,294**. Added rollback-safe activity invalidation (only committed edits end a standalone question), and made revealing additional layers after a locked answer preserve its existing evidence. Added browser journeys for these paths and advanced-layer restoration after Learn. The mobile obstruction assertion is retained with exact hit-target/geometry diagnostics and screenshot capture before assertion; cause/fix still pending. Hosted preview access is denied to the current Vercel/browser account, and artifact file delivery returns 403. Do not claim fresh visual review or release readiness until this evidence is obtained.

## Account A implementation checkpoint — 2026-09-23 (historical)

Draft PR #21: `feature/unrestricted-engineering-learning-safety`. Baseline installation, build and **1,272/1,272** tests passed before application changes.

Implemented, not yet validated: `activity-policy.js` separates effective engineering tool access from saved learning level, confines masking to Learn and guards answer surfaces; active/review session models reject numeric preview, commit, drag and history mutation. Navigation offers the existing session-exit decision. Legacy saved practice no longer masks reload. Shared `explanation.js` reads solved one-sided fields and local distributed intensity, composing force/couple events. Selected-object editing now reserves the controls column instead of floating over Undo; compact label editing is preserved. Added policy/explanation regressions and four browser journeys; updated two older assertions whose expected navigation/edit permissions intentionally changed.

Next recovery action: run `npm test`; inspect/fix any failures without changing numerical tolerances. Exact-head CI must run all browser projects and rendered desktop/mobile evidence must be reviewed before any release. Application version remains 4.1.2 at this checkpoint. Production is unchanged by this feature branch. Broader two-mode shell, focused mobile Learn and comprehensive math presentation remain subsequent approved increments.

# BeamLab AI Handoff

## Active implementation — Account A, 2026-09-23

**STATUS: first implementation checkpoint / numerical and browser validation pending.** The user approved the complete plan and requested implementation. Approved audit PR #20 is merged. Starting main: `d4c0479399e6e50582e7ed682c35912ac45f83dc`. Working branch: `feature/unrestricted-engineering-learning-safety`.

First increment: unrestricted engineering destinations, learning-only answer masking, fixed-question mutation protection, consistent navigation/legacy preferences, coincident-action Show Why correction, and an inspector that cannot cover edit controls. Preserve the single solver, numerical tolerances, model origin/history restoration and 4.1.2 editing/annotation fixes. Full workspace redesign and richer lesson/math presentation remain subsequent scoped increments in the approved plan.

Before long tests, push coherent source and update this record. Current production remains 4.1.2 until a validated release is separately verified.

## Active audit — Account A / Account B, 2026-09-22

**STATUS: audit complete / detailed plan ready for user review / no application changes.** Starting main `3498b5c`; documentation branch `docs/workspace-ux-audit-plan`, draft PR [#20](https://github.com/parrasuccess-blip/BeamLab_Studio/pull/20). Read [the current audit and plan](UX_AUDIT_AND_PLAN_2026_09_22.md) before implementation. The user requests a full plan first. Confirmed faults: Build/Analyse masking after Practice and reload; different Build entry semantics; ordinary inspector covering toolbar; learning-level restrictions leaking into direct use; Practice/Exam answer leakage through worked solutions and verification; and a false moment-continuity explanation for coincident point load/couple. Existing release evidence below remains valid for its tested scope.

Fresh local install/build/test: 1,272 passed. Exact-main CI 35729723993: 112 browser checks passed, zero retries. Public artifact matches the release hash below. Live benchmarks: 21/21 passed. The solver agrees with independent centre-load and coincident-action references; the false continuity claim is in explanation code. Existing lesson navigation, original beam/history/comparison restoration, invalid-input rollback, Focus and Present exit were checked live. Phone evidence was reviewed from released CI; no new physical-phone test is claimed.

**Next action after plan review:** start a new feature branch from then-current main and follow the scoped increments in the audit plan. Correct state separation, answer visibility, control obstruction and explanation accuracy before broad cosmetic changes. Do not treat this documentation PR as an implemented or deployed fix.

Recovery reconciliation: Account B checkpoint `99b199f10ed17d0ddcac3a1dd9db72efb7f7483c` correctly recorded that only Account A's earlier checkpoint had reached GitHub. This completed plan preserves that recovery commit and adds the final details and evidence. Account B additionally reproduced Undo replacing an exam question model while the session remains active; Account A confirmed the unguarded history action in source. This is now a P1 model-mutation issue in the first planned repair, alongside answer visibility. Do not resume obsolete PR #18 work or treat the saved plan as implemented code.

## Current verified release — Account A, 2026-09-22

- **Canonical repository:** `parrasuccess-blip/BeamLab_Studio`; production branch `main`.
- **Released code:** `e6d4585a648bd624d1db41dc3d7e60037c448b4b`.
- **Release:** **4.1.2 — clearer diagrams and reliable direct editing**.
- **Release PR:** [#18](https://github.com/parrasuccess-blip/BeamLab_Studio/pull/18), merged after validation. Final feature head: `2ab5003e430ee54956c15b3bc090e95d5c2040fc`.
- **STATUS: release merged / public artifact and live editing verified.**
- **Production:** https://beam-lab-studio.vercel.app/
- **Verification record:** Account A on `docs/release-4-1-2-verification`, starting at release commit `e6d4585`. Documentation/evidence only; its merge may make main newer than the code release above.

GitHub is canonical. Fetch current main and inspect open PRs before new work. The diagram-annotation branch is now merged history. Older local worktrees contain interrupted edits and must not overwrite newer shared source.

## What shipped and why

Crowded diagram labels and live inspection values overlapped. Fixed-width spacing did not account for actual text, support notes or narrow layouts. The release:

- Separates live inspection values into a wrapping readout below each plot, preserving both sides of discontinuities and exact cursor coordinates.
- Places critical values and hinge zeros in bounded callouts with leaders and explicit overflow rows. Exact point dots have clearance from all text.
- Wraps full load names/values and stacks support, reaction, prescribed-movement, hinge and property notes. Structure → SFD → BMD remains aligned.
- Uses a compact direct label editor. Undo/Redo close obsolete inline fields. The first mobile tap no longer opens a full inspector over the second tap target; ordinary object-body and locked-object inspection remain.
- Commits an already-tabbed edit before processing a new edit, preserving separate history entries, native focus and Firefox pressed-control safeguards.
- Uses the actual PDF page area to group diagrams, retaining annotation font sizes and the existing two-page reference report.

Important files: `src/studio/annotation-layout.js`, `diagrams.js`, `app.js`, `export.js`, `src/workspace.css`, `module-order.json`, `tests/diagram-layout.test.cjs`, `tests/support/diagram-fixtures.cjs`, and both browser specs. Release metadata and identity assertions identify 4.1.2.

No solver, sign convention, unit, model schema, numerical tolerance, grading or adaptive-learning algorithm changed.

## Validation and production evidence

- Fresh local `npm ci`, `npm run build`, `npm test`: **1,272 Node checks passed**, zero failed/skipped.
- Final exact-head [PR CI 35727547909](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35727547909) and push CI **35727543390** succeed. Browser job **106744894705**: **112 passed (3.1m)**, zero retries, across desktop Chromium/Firefox, iPhone WebKit and 360px Chromium.
- Browser evidence artifact **10694401811** contains screenshots and the tested reference PDFs from all four projects; release artifact **10692979694**. Browser execution was in GitHub CI, not a local browser-suite run.
- Desktop/mobile endpoint, hinge and crowded-support screenshots were visually inspected. The two-page reference PDF was rendered and reviewed; figures fit together and values remain readable. A local Poppler substitute-font spacing issue was cross-checked with MuPDF's correct standard-font rendering; it was not treated as an application regression.
- Hosted preview and public site both identify 4.1.2. Repeated direct label edits, pending-edit Undo, editor reopening and Redo passed. Public 6 → 8 → 9 m Tab edits undo independently to 8 and 6 m.
- Public fixed-end reference: 10 m with 5 kN/m gives −41.667 kN·m at the ends and +20.833 kN·m at midspan. Inspection readout is separate from labels. The temporary verification beam was restored to its starting 6 m / 20 kN model.
- Public HTML **735,456 bytes**, SHA-256 **d683284d28cb618e43ffeee6aec234ea152d9a460b6723cb48735bf72fd32d04**. Independently downloaded HTML, `release.json` and `SHA256.txt` match the tested artifact exactly.
- Vercel reports successful production deployment `5DAvxyLvQRY78GXdK2a8412zYnjb` for release commit `e6d4585`. Main release CI: [35728332559](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35728332559).
- Public `/api/tutor` returns release 4.1.2 and `configured:false`; no provider connection is claimed.
- Durable screenshot: [public endpoint inspection](../qa/4.1.2/public-endpoint.jpg).

## Recovery history

Account A retained Account B's `b8f5a1` repairs. That checkpoint passed 1,272 Node and 110/112 browser checks; both failures were mobile editor reopening. Account A's `2a8d052` fixed the obstruction and passed all 112. Candidate `78c1726` added marker clearance and 4.1.2 identity; 108/112 passed, with four identical stale-version assertions. `2ab5003` corrected only the assertion, retained PDF evidence and passed all checks before merge.

Earlier pending/failure entries in SESSION_LOG are chronological evidence, not current status. Keep them. The previous 4.1.1 code release was `9cf86ef`; its verified handoff was merged as `1c74ef4`.

## Preserve these behaviours

- One deterministic engineering authority; no separate learning physics.
- `BL410-` model fingerprints remain compatible with 4.1.2 metadata.
- Direct Build / Explore needs no lesson prerequisite. Learn is optional.
- Hidden advanced controls must not remove active model properties.
- Temporary lessons/challenges preserve the engineering beam, page-session Undo/Redo/comparison and independent learning evidence. They must not overwrite structural storage.
- Reload preserves saved beam/progress; Undo/Redo and comparison are page-session state and reset. Explicit study/snapshot/JSON opening follows D-012; invalid imports preserve the activity.
- Native keyboard focus and Firefox pressed-pointer regressions remain required.
- Moving envelopes are sampled static analysis; EI-only multipliers do not invent stresses. Manual review criteria are not design-code certification.
- The optional tutor is explanatory and currently unconfigured in production.

## Remaining work

No unresolved blocker remains in the released annotation/editing scope. The broader requested follow-ups are consistent mathematical notation (including exported reports), long mobile lesson layouts, and deeper deterministic Show Why explanations.

**Priority updated by the user-requested audit:** first repair direct-use/learning state separation and the other confirmed P1 faults in the linked audit plan, then improve workspace layout, learning navigation, mathematical notation and deterministic Show Why. No application work was started during the audit. Broader numerical/design-code roadmap work needs separate validation.

Follow D-011: dedicated branches, early draft PRs, progressive HANDOFF/SESSION_LOG updates and pushed checkpoints before long tests. Credits may end without warning. Shell Git fetch works; connected GitHub Git-object API writes use existing base trees/parents and non-forced updates. Never force-push shared work or put credentials in files.

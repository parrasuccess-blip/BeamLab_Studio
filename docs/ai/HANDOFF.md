# BeamLab AI Handoff

## Current recovery — Account A, 2026-09-22

- **Objective:** release the diagram readability and editing update in PR #18.
- **Canonical repository:** `parrasuccess-blip/BeamLab_Studio`; production branch `main`.
- **Starting/current main:** `1c74ef4576d014a93ce203affa67826d89243ca6` (4.1.1 code plus verified release handoff).
- **Working branch:** `feature/diagram-annotation-layout`; [PR #18](https://github.com/parrasuccess-blip/BeamLab_Studio/pull/18), draft and unmerged.
- **Starting Account B commit:** `b8f5a1a47aeb82cae6a728188deeedef1a459e48`. Its implementation is retained.
- **Current application candidate:** `78c17263c6dada897ce039f0b71f66376b63dd3c`, release **4.1.2**. The next checkpoint changes a stale release assertion and retains PDF evidence; application bytes are unchanged.
- **STATUS: implementation complete / final test-identity correction and export visual validation running.**
- **Production:** https://beam-lab-studio.vercel.app/ — still verified **4.1.1**. Do not claim 4.1.2 is live.

Fetch current refs and inspect the PR before continuing. Older local worktrees contain interrupted edits and are not canonical. The navigation PR #16 and release-verification PR #17 are merged history.

## What this update does

- Separates live inspection values from the plot into a wrapping readout, preserving left/right discontinuity values and exact cursor coordinates.
- Allocates bounded critical labels and explicit overflow rows, with leaders and clearance around exact critical-point dots.
- Wraps load names/values and stacks support, reaction, prescribed-movement, hinge and section-region notes. Structure → SFD → BMD remains aligned.
- Replaces the competing full inspector with a compact direct label editor. Undo/Redo close obsolete inline fields. Editable labels do not open a panel over the second mobile tap; ordinary object-body selection and locked-object inspection remain available.
- Commits a previous tabbed numeric edit before processing the next edit, avoiding merged history entries while preserving native Firefox focus and pressed-control safeguards.
- Groups PDF diagrams using the actual available page area and keeps measured annotation font sizes. The two-page reference-report assertion remains.

Important files: `src/studio/annotation-layout.js`, `diagrams.js`, `app.js`, `export.js`, `src/workspace.css`, `module-order.json`, `tests/diagram-layout.test.cjs`, `tests/support/diagram-fixtures.cjs`, and the two browser spec files. Version metadata and assertions consistently identify 4.1.2.

No structural solver, sign convention, unit, model schema, numerical tolerance, grading or adaptive-learning algorithm changes.

## Current validation evidence

- Fresh `npm ci`, `npm run build`, `npm test`: **1,272 Node checks passed**, zero failed/skipped.
- Account B's starting head `b8f5a1`: **110/112 browser checks passed**. Failure traces showed the first mobile tap opening the inspector over the second tap target.
- Account A mobile fix `2a8d052`: exact PR run **35677161432**, browser job **106586018776**, **112 passed**, zero retries.
- Candidate `78c1726`: exact PR run **35677895924** has successful numerical checks and **108/112 browser checks passed**. All diagram, marker-clearance, editing and PDF checks pass. The four failures are the same issue-report assertion still expecting escaped `4\.1\.1`; actual output correctly says 4.1.2. This checkpoint corrects only that release assertion and saves the already-tested PDF for visual inspection.
- Candidate browser evidence artifact **10672899257**; release artifact **10673872515**.
- Candidate HTML **735,456 bytes**, SHA-256 **d683284d28cb618e43ffeee6aec234ea152d9a460b6723cb48735bf72fd32d04**.
- Hosted preview identifies 4.1.2 and correctly displays the independent fixed-end reference: 10 m, 5 kN/m → end moment −41.667 kN·m and midspan +20.833 kN·m. Repeated compact label edits and pending-edit Undo/Redo were exercised. The cloud download bridge timed out despite the app reporting PDF creation; CI successfully downloads/checks the report, so the next run retains its PDF for direct visual review.
- Final corrected-commit browser CI, desktop/mobile screenshot inspection, PDF inspection and production verification remain required.

Earlier failed runs and investigation details are chronological history in SESSION_LOG. Do not erase them or treat them as current status.

## Released baseline: 4.1.1

Released code `9cf86ef570ecb4895ec071c2a497b80ecb636d6a` / PR #16. Account B completed public verification in PR #17, merged as `1c74ef4`. That baseline passed 1,258 Node checks and 96 browser checks. Public HTML is 725,972 bytes, SHA-256 `6dbd2d3e2ac5d20baf8f749c205b8cce7bf99ba89b8575d8abce26913fa9de40`.

Direct Build / Explore opens without a learning gate. Learn is optional; lessons/challenges have Previous/Next and catalogue controls. Temporary teaching examples preserve the engineering model, session history/comparison and independent learning evidence. Reload keeps the saved beam/progress, but page-session Undo/Redo and comparison reset. Explicit study/snapshot/JSON openings follow D-012; invalid imports preserve the activity.

## Preserve these behaviours

- One deterministic engineering authority; never create separate learning physics.
- `BL410-` model fingerprints remain compatible with 4.1.2 metadata.
- Hidden advanced controls must not remove active model properties.
- Temporary examples must not overwrite structural-model storage.
- Native keyboard focus and Firefox pressed-pointer safeguards remain required.
- Undo/Redo and comparison are page-session state; never promise reload persistence.
- Moving envelopes are sampled static analysis. EI-only multipliers do not invent stresses. Manual review criteria are not design-code certification.
- The optional online tutor is explanatory and currently unconfigured in production.

## Next action and remaining scope

Finish the current exact-commit CI and inspect its desktop/mobile screenshots and reference PDF. Merge PR #18 only after coherent validation; then compare the actual public HTML, release.json and SHA256.txt with the tested artifact and exercise live interaction. Update this snapshot with the actual release outcome, not just “ready for merge”.

Later scoped priorities: consistent mathematical notation, long mobile lesson layouts and deeper deterministic Show Why explanations. This update does not claim completion of the broader roadmap.

Follow D-011: dedicated branches, early draft PRs, progressive HANDOFF/SESSION_LOG records, and pushed checkpoints before long tests. There is no reliable warning before credits end. Shell Git fetch works; connected GitHub Git-object API writes use an existing base tree/parent and non-forced fast-forward updates. Never force-push shared work or put credentials in files.

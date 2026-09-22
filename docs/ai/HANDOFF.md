# BeamLab AI Handoff

## Active audit — Account A, 2026-09-22

**STATUS: audit and plan only / public UX faults reproduced / no application changes.** Starting main `3498b5c`; documentation branch `docs/workspace-ux-audit-plan`, draft PR [#20](https://github.com/parrasuccess-blip/BeamLab_Studio/pull/20). Read [the current audit and plan](UX_AUDIT_AND_PLAN_2026_09_22.md) before implementation. The user requests a full plan first. Build result masking and ordinary-inspector obstruction are confirmed broader UX issues, distinct from the released direct-label editing fix. Existing release evidence below remains valid for its tested scope.

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

**Recommended next scoped update:** improve Show Why around the selected position and actual model: physical explanation, signed equations with substituted values, boundary/discontinuity reasoning and level-appropriate depth. Keep it deterministic and verify its claims against existing solver results. Broader numerical/design-code roadmap work needs separate validation.

Follow D-011: dedicated branches, early draft PRs, progressive HANDOFF/SESSION_LOG updates and pushed checkpoints before long tests. Credits may end without warning. Shell Git fetch works; connected GitHub Git-object API writes use existing base trees/parents and non-forced updates. Never force-push shared work or put credentials in files.

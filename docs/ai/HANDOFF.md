# BeamLab AI Handoff

## Active update — Account B recovery, 2026-09-22

- **Task:** prevent overlapping diagram annotations on desktop and narrow/mobile layouts.
- **Starting main:** `1c74ef4576d014a93ce203affa67826d89243ca6` (4.1.1 release plus completed production handoff).
- **Branch:** `feature/diagram-annotation-layout`; [draft PR #18](https://github.com/parrasuccess-blip/BeamLab_Studio/pull/18).
- **Takeover checkpoint:** `e155a9182e0ede0994f56183e7b3baa3f3c1f44b`. Account A added `b957c09` (takeover record) and `e155a91` (layout implementation/tests) after Account B's `adf45ce` investigation record. Account B fetched current refs and inspected the actual changes before continuing; no newer committed fixes exist.
- **Status:** implementation retained / failed browser checks under investigation / draft PR not merged. Production remains the verified 4.1.1 release below.
- **Scope:** critical-value/inspection labels and crowded structure labels; preserve numerical values, native interaction, temporary-learning model protection and existing solver/tolerances. Inspect actual failures before choosing the layout change.
- **Validation:** Account A's implementation adds 14 Node checks (1,272 reported passing). Exact-head PR CI `35622848288` has a successful regression job and **99 browser checks passed / 9 failed**: four incorrect endpoint jump-marker expectations, four PDF page-count failures (3 pages rather than 2), and one desktop lesson/history failure (second Undo disabled). Crowded-label inline editing/Undo and hinge/export checks pass in all four projects. Account B is investigating the history failure and Account A's reported manual Undo finding; no numerical tolerance changes are warranted.

## Current state

- **Last active account:** Account B — production verification completed on 2026-09-21.
- **Canonical branch:** `main`.
- **Released code / observed main:** `9cf86ef570ecb4895ec071c2a497b80ecb636d6a`.
- **Release:** **4.1.1 — direct engineering and optional learning**.
- **Release PR:** [#16](https://github.com/parrasuccess-blip/BeamLab_Studio/pull/16), merged by Account A at 2026-09-21 02:47:29 UTC. Final feature head: `f99d393afd7f30d2ea1e9ba3fe4148aeb31c1923`.
- **Account B verification branch / record:** `docs/release-4-1-1-verification`, [PR #17](https://github.com/parrasuccess-blip/BeamLab_Studio/pull/17). Documentation only; its final merge may make main newer than the release code commit above.
- **Status:** release merged; production artifact and public interactions verified. No unfinished application implementation remains in this recovery.
- **Production:** https://beam-lab-studio.vercel.app/

GitHub is canonical. Fetch current main and inspect open PRs before new work. The former `feature/direct-explore-learning-navigation` branch is historical merged work, not the next development base. Older local checkouts may contain interrupted edits; do not restore them over current main.

## What shipped and why

The old entry flow foregrounded learning levels and made direct engineering use feel gated. Build / Explore now opens directly with all tools and the simple 6 m / 20 kN reference for a new user. Saved preferences/models are retained. Learn is optional, and Analyse leads directly to Review.

Individual lessons/challenges previously left the full catalogue above the task and could replace/autosave over a user's beam. The focused task now has Previous/Next, activity position and return-to-catalogue controls. Temporary examples preserve the engineering model, Undo/Redo, comparison and view in memory. Returning restores them; reload preserves the saved beam and independent learning progress, while page-session history/comparison reset.

Account A repaired explicit model opening during those activities: a successfully parsed saved study, shared snapshot or JSON file ends the temporary activity, restores the engineering origin and commits the chosen replacement. Undo returns to that origin. Invalid imports preserve the activity; full active/review sessions retain their navigation guard. The notice accurately describes reload and redundant example toasts are suppressed.

Account B repaired numeric editing: Tab/Shift+Tab completes and saves each edit independently, restores its native focus destination and enables Undo for the first valid pending edit. Invalid drafts restore the committed model. Existing pointer focusout deferral prevents Firefox losing a pressed control. Account A corrected the regression test to respect Firefox's native scroll-container focus stop before Studies; it did not change the working runtime to imitate Chromium.

Important files: `src/studio/app.js`, `src/studio/workspace.js`, `src/studio/panels.js`, `src/workspace.css`, `tests/browser/studio.spec.js`, `tests/guided-studio.test.cjs`, release-identity files and `docs/RELEASE_4_1_1.md`. Consult PR #16 for exact paths/diffs.

## Recovery checkpoints

| Checkpoint | Result |
| --- | --- |
| `799fae5` — Account B direct entry/navigation | 1,258 Node checks and 76 browser checks passed; unmerged at interruption. |
| `1cf371d` — Account A explicit-opening recovery | 1,258 Node checks passed; 84/88 browser checks passed. Four failures exposed the existing numeric-edit history bug before lessons started. |
| `b13ecae`, `282fda3` — Account B checkpoint and numeric repair | 1,258 Node checks passed; 95/96 browser checks passed. Runtime history bug fixed; one Firefox tab-order assertion remained incorrect. |
| `58f0a36`, `819fdc3`, `c785fae` — Account A completion | Native Firefox focus expectation corrected; release identity advanced to 4.1.1. A missed old-title assertion was corrected without changing any numerical expectation. All 1,258 Node and 96 browser checks passed. |
| `f99d393`, merged as `9cf86ef` — Account A release | Final documentation checkpoint and both final CI runs passed; PR #16 merged. |
| Account B / PR #17 | Reconciled Account A's work, freshly built/tested merged source, verified actual production and completed this snapshot. |

Older pending/failure entries in SESSION_LOG are chronological history, superseded by the verified results below. Do not erase them.

## Validation and production evidence

- Fresh Account B commands on the merged 4.1.1 source: `npm ci`, `npm run build`, `npm test` — all passed; **1,258 numerical/behaviour checks**, zero failed/skipped.
- Final feature PR CI **35555016024** and push CI **35555013620** succeeded at `f99d393`.
- Exact release main [CI run 35555337390](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35555337390) succeeded. Browser job **106197820962** records **96 passed (3.5m)** across desktop Chromium/Firefox, iPhone WebKit and 360px Chromium; zero retries. Browser execution was in GitHub CI, not a local browser-suite run.
- Main browser artifact **10620013758** and release artifact **10620140121** retain evidence. Account B reviewed the current focused-lesson screenshots on desktop and 360px mobile; Account A also reviewed both phone layouts and the hosted preview.
- Deterministic HTML: **725,972 bytes**, SHA-256 **6dbd2d3e2ac5d20baf8f749c205b8cce7bf99ba89b8575d8abce26913fa9de40**.
- Downloaded public HTML, `release.json` and `SHA256.txt` match that artifact. The public UI identifies 4.1.1. Vercel reports the release commit deployed successfully: `8etk39bNeFJ5jt3LhQ3GyYTnuhs7`.
- Public `/api/tutor` returns release 4.1.1 and `configured:false`; no provider credentials are needed or claimed.

Account B verified real public interaction: direct Build / Explore with All Tools and no gate; first pending edit enables Undo; 6 → 8 → 9 m Tab edits create independent history; Undo restores 8 m; lesson Previous/Next and catalogue restore that beam, Redo and comparison; Redo restores 9 m; reload during a different fixed-ended learning example restores the saved 9 m centre-load model with history/comparison reset; invalid 0 m rolls back to 9 m without adding history; Review reports 6/6 consistency checks. Returned the temporary verification model to its starting 6 m state. A screenshot of the verified public workspace was captured.

## Preserve these behaviours

- One deterministic engineering authority. No solver, signs, units, schema, tolerances, grading or adaptive algorithms changed in 4.1.1.
- `BL410-` model fingerprints intentionally remain compatible while release metadata is 4.1.1.
- Advanced model properties remain active when a learning level hides their controls.
- Model storage and learning progress are separate. Temporary examples must not overwrite the engineering beam.
- Explicit model opening follows D-012, including invalid-import protection and session guards.
- Preserve native keyboard focus, including Firefox's scrollable tools panel, and both pressed-pointer regression tests. Do not replace the clicked target during focusout.
- Undo/Redo and comparison remain page-session state; never promise they survive reload.
- Moving-load envelopes remain sampled static analysis; EI-only multipliers do not invent stress; manual criteria are not code certification.
- The optional tutor remains explanatory and is currently unconfigured in production.

## Remaining work and next recommendation

Known follow-ups remain: overlapping critical/trace diagram labels, mathematical presentation, long mobile lesson pages with secondary settings, and deeper deterministic Show Why reasoning. This release does not claim to complete those broader priorities.

**Next scoped update:** investigate and fix collisions between critical-value and inspection labels in the structural diagrams, including crowded supports/loads and narrow viewports. Inspect the current diagram renderer and representative fixtures first; preserve the underlying engineering values and add targeted desktop/mobile visual coverage. Keep deeper Show Why and broader lesson-layout changes as separate increments.

No unresolved blocker was found in the released recovery scope. Do not begin speculative numerical features or a solver rewrite.

## Continuing safely

Follow D-011: start from freshly fetched main on a dedicated branch, record account/task/start commit/status immediately, open a draft PR early, and push coherent checkpoints before long validation. Update HANDOFF and append to SESSION_LOG progressively; credits can end without warning. Only merge coherent validated work and verify the actual deployed artifact separately.

In this environment read-only Git fetch works but shell push has no GitHub authentication. The connected GitHub Git-object API was used with an existing base tree/parent and non-forced fast-forward ref updates. Never copy credentials into files or force-push shared work. PROJECT_CONTEXT and existing DECISIONS remain authoritative and were not rewritten for this release.

# BeamLab AI Handoff

## Active work — Account A, 2026-09-24

**STATUS: 4.1.5 candidate passed prior CI / last viewport correction and final browser recheck pending.**

- Objective: continue the approved UX plan with a clearer Build/Explore and optional Learn workflow, focused phone learning layout, more readable mathematical notation and a richer deterministic Show Why explanation. Keep the 4.1.4 interface polish and engineering model/lesson-history protections.
- Starting main: `4a1b166f565ef59bd411e9898ea16ef3d40b2d66`; branch: `feature/clear-workspace-learning-why`; active account: Account A; draft PR to be opened from this branch. Production remains 4.1.4.
- Fresh `npm ci` and `npm test` pass 1,294 checks with original tolerances. Latest documentation-only main CI 35961780649 passes its numerical job but records 147/148 browser journeys: the 360 px phone editor check loses the Undo DOM node while scrolling after an edited force. Prior 4.1.4 code and merged-main CI each passed 148. Investigate and repair the rendering/focus race without weakening the actual Undo and hit-target checks before changing more UI.
- First milestone: grouped Build/Explore → Analyse → Review separately from voluntary Learn; phone learning jump controls; solver-derived three-step Show Why in both the stage and dialog; real mathematical symbols in worked calculations. The previously intermittent mobile Undo test now waits for the second Tab edit to be *committed* before measuring the actual button hit target, retaining its click/rollback assertion. New numerical/UI browser checks added.
- First remote candidate CI 35988066160: 1,297 Node checks pass, 144/152 browser checks pass. Eight failures are repeated in four browser configurations: an old helper assumes the mobile teaching navigator contains one toolbar toggle and an old Show Why assertion expects wording removed in the first revision. Updated the helper to select the exact controls toggle and retained the original deterministic explanation wording in the improved panel. Source still needs full fresh browser validation.
- Further candidate polish: active standalone lessons focus the task near the top of the viewport; a visible My model exit sits beside Previous/Next. Added typographic moment units throughout visible Studio views/exports, a real WinAnsi middle dot in PDF text, and exact 4.1.5 build/tutor/release identity. Hosted preview confirmed edit 6→8 m, 40 kN·m moment, retained history and original model after lesson return, solver-derived 6 m / 20 kN Show Why, and on the earlier 4.1.5 candidate the active question at ~285 px. Current focused layout keeps the compact three-tab learning routes visible; its hosted visual review is still due. Production remains 4.1.4 until complete CI and exact public verification.
- Exact 4.1.5 candidate CI 35989663956 passed all 1,297 Node checks and 148/152 browser checks. The four browser failures exposed a genuine activity navigation regression: hiding the tabs during a lesson also removed the direct switch to Mastery practice. Retained the three tabs in compact form while keeping the inactive large heading/progress hidden. The pre-existing end-to-end test continues to demand direct Mastery entry from a lesson. The My model exit and precise deterministic jump/couple check are included in the next browser candidate. Latest local numerical suite: **1,297 passed**; final CI still pending.
- Candidate 90e2af9 [CI 35990584008](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35990584008) passed **1,297 Node checks and 152/152 browser journeys**, and the CI artifact matched local SHA-256 `4b4fa971ea71a417c3dffa2aea5cddcf6ef0e6b6f190de0264cf29177f275c8c`. Hosted review then found a workspace heading partly behind the fixed header when leaving a tall focused lesson. A targeted Learn → Build scroll and viewport assertion are queued for a new CI run. This newest change is not validated by the prior CI; do not merge or claim release yet.
- Next: checkpoint this viewport correction, run the full browser suite and review phone screenshots; merge and verify the exact public artifact only after all gates pass. No new solver, design-code claims or numerical changes intended.

## Current state — Account A, 2026-09-24

**STATUS: 4.1.4 merged / exact public artifact and live UI checks verified.** This is the focused polish requested before the next feature increment.

- Canonical repository: `parrasuccess-blip/BeamLab_Studio`; production branch: `main`.
- Released code: `232912f466c529ae7bfcc1c377571bbff5af9652`, merged through [PR #23](https://github.com/parrasuccess-blip/BeamLab_Studio/pull/23).
- Validated candidate: `0741cc3dbd5679c3eee855afeea2665432a5079d`; feature branch `feature/ui-control-polish`.
- Version: **4.1.4 — Interface polish**. Production: https://beam-lab-studio.vercel.app/
- Active account: Account A. Verification branch: `docs/release-4-1-4-verification`, starting at released code above. Documentation/evidence only.
- Starting main for this update was `49770495deb49cb82afc9fb70b029c97723cb17c` (verified 4.1.3).

Fetch main and open PRs before any new work. GitHub is canonical; do not resume stale Account A/B patches.

## What changed

1. Homepage actions share a 48 px height, typography and gaps. Related workspace actions use a consistent 44 px rhythm, with compact desktop icons and taller phone toolbar targets.
2. Numeric fields now fit inside their wrappers. Phone fields use readable 16 px text; unit labels keep their space.
3. Three Learn tabs share a balanced row. Lesson Previous/Next and catalogue navigation have consistent insets and wrapping. Review/export cards and dialog actions align cleanly.
4. Narrow headers, toolbars, footers and action groups fit the available width. Long metric values can wrap. The reserved inspector remains in its existing column/row, leaving Undo reachable.
5. Navigation settles without smooth-scroll target movement or a duplicate workspace offset. Opening criteria review and returning to its overview explicitly place headings below the fixed header. Review step labels are larger.

Primary files: `src/workspace.css`, the hero wrapper/navigation actions in `src/studio/app.js`, and `tests/browser/ui-polish.spec.js`. Release identity and identity assertions updated to 4.1.4. No solver, schema, signs, units, tolerances, grading, adaptive-learning or activity-policy changes. All 4.1.3 model/history and unrestricted-engineering repairs remain intact. [Release notes](../RELEASE_4_1_4.md).

## Validation and release evidence

- Fresh local npm ci/npm test, including build: **1,294 passed**, zero failures/skips. Final follow-up numerical run also passes all 1,294.
- Exact candidate [CI 35959768662](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35959768662): regression job 107505633546 and browser job 107505679543 succeed. **148 browser journeys passed**, zero retries, across desktop Chromium/Firefox, iPhone WebKit and 360 px Chromium. All 136 previous checks retained; three new journeys run in four projects. Browser suite ran in GitHub CI, not locally or on physical phones.
- Final release artifact: **10791593840**. Browser evidence: **10792136460**. All three release files match the local build byte-for-byte. Desktop hosted preview and final phone screenshots reviewed; no overlap or field clipping in the tested views.
- HTML **753,235 bytes**, SHA-256 **b59ed05a7b6f58d218f93dc3e09f3a096977e4b486bba015ee29c99d6240128d**.
- Downloaded public HTML, release.json and SHA256.txt match the exact tested files. Public header identifies 4.1.4. GitHub Vercel status succeeds for deployment **DszXNxyof4CdvoyyRZr9egtAXgDj**. The connected Vercel fetch tool could not access this project; public browser and HTTP verification succeeded independently.
- Public Tab edit 6 → 8 m gives peak moment 40 kN·m; Undo restores 6 m and Redo restores 8 m. Criteria entry and overview headings remain visible (143 px and 152 px top on the reviewed desktop viewport). Lesson Next/Previous and Return to my model restore the edited 8 m beam.
- [Public UI screenshot](../qa/4.1.4/public-polish.jpg). [Evidence summary](../qa/4.1.4/README.md).
- Merged-main [CI 35960424629](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35960424629) also passes all **1,294 numerical/behaviour and 148 browser checks** (jobs 107507602773 / 107507641027), zero retries. Merge tree is identical to the validated candidate.

## Next approved work

This polish completes the current request; no additional feature started. The [approved UX plan](UX_AUDIT_AND_PLAN_2026_09_22.md) still covers the broader workspace shell, focused mobile Activity/Beam learning layout, consolidated lesson controls, comprehensive mathematical typography in UI/export and richer deterministic explanations. Those are separate increments, not claims made by 4.1.4.

Use a new dedicated branch from then-current main; record account/objective/start/ref, open a draft PR early and push milestones before long tests. State implementation/test checklists; retain regressions and add changed-behaviour coverage; inspect desktop/mobile rendering; verify actual public artifact after release. No new physics, catalogue expansion, code capacities, truss/frame solver or giant chatbot in this polish scope.

## Preserve these contracts

- One deterministic engineering authority. Learning and AI never supply alternative physics.
- Build / Explore has no lesson prerequisite. Hidden controls do not remove advanced model properties.
- Temporary activities do not overwrite structural storage. Learning evidence is separate. Explicit study/snapshot/JSON openings follow D-012; invalid imports preserve the activity.
- Reload preserves saved model and learning progress; Undo/Redo/comparison are page-session state.
- Retain physical mobile Undo hit tests, paused-clock Tab race, native focus, Firefox pressed-pointer, two-press label stability, annotation and PDF assertions.
- Educational/static-analysis and entered-criteria preview; no design-code certification. Moving-load envelopes remain sampled static analysis.
- Follow D-011 crash-safe branches, draft PRs and progressive pushed checkpoints. No reliable credit-limit warning exists.

## Recovery history

Prior checkpoint handoffs are preserved in [the 4.1.3 recovery archive](archive/HANDOFF_4_1_3_RECOVERY.md). Its pending/failure/old-production entries are historical, not current state. SESSION_LOG remains append-only. The final 031b8bf test measured geometry at the two actual pointer presses; both must target the same editable value within 1 px. This retained the full edit/rollback/restoration journey and fixed an overbroad WebKit measurement. No forced clicks or retries were introduced.

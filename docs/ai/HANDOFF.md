# BeamLab AI Handoff

## Current state — Account A, 2026-09-23

**STATUS: 4.1.3 merged / exact public artifact and live upgrade verified.** Final-candidate and merged-main validation are green. This documentation branch records the completed release; no application repairs are pending in the 4.1.3 scope.

- Canonical repository: `parrasuccess-blip/BeamLab_Studio`; production branch: `main`.
- Released code / starting commit of this verification: `d4f6b2182b1c899ce8f54213f67b111c9a7a8ca6`.
- Released version: **4.1.3 — unrestricted engineering and reliable learning activities**.
- [PR #21](https://github.com/parrasuccess-blip/BeamLab_Studio/pull/21) merged after exact-head numerical, browser, artifact and rendered checks. Final candidate: `031b8bf665d21b09c679e60774a87f296f5a7eb5`.
- Production: https://beam-lab-studio.vercel.app/
- Active account: Account A. Working branch: `docs/release-4-1-3-verification`.
- Objective: record verified release evidence and the next approved scope. Documentation/evidence only; no application changes in this branch.

Fetch current main and open PRs before new work. GitHub is canonical. Account B's final hover repair and two-press assertion are retained. Older local unpushed geometry-fallback experiments are obsolete and isolated; do not copy them over this release.

## What shipped

1. Build / Explore, Analyse and Review expose all engineering tools and results. Learning level affects Learn only. A saved Practice preference from 4.1.2 cannot mask engineering results after upgrade or reload.
2. Shared activity policy governs metrics, diagrams, comparison, stress, Show Why, working, checks, tutor and exports. Learning reveal stages and active exam submission boundaries are consistent.
3. Fixed-question sessions protect their model against Undo/Redo, pending numeric edits, drag and import mutation. Leaving restores the original engineering model, page-session history and comparison.
4. Invalid standalone lesson edits roll back without losing the question. A committed exploratory edit explicitly pauses the question and offers restart. Previous/Next, return and level changes clear obsolete notices. Extra layers after a completed question do not duplicate learning evidence.
5. The selected-object editor reserves a desktop column or mobile row. An obsolete fixed-position rule no longer covers Undo. Direct label editing stays compact; hovering a label does not change the readout height and move its pointer target.
6. Shared deterministic Show Why facts use solved one-sided values, local intensity including factored self-weight, local EI and actual support/end conditions. Coincident point forces and couples explain both discontinuities.

Important files: `src/studio/activity-policy.js`, `explanation.js`, `app.js`, `diagrams.js`, `teaching.js`, `src/workspace.css`, release metadata and policy/explanation/browser tests. See [release notes](../RELEASE_4_1_3.md).

No solver, model schema, sign convention, units, numerical tolerance, grading or adaptive-learning algorithm changed. BL410 fingerprints remain compatible.

## Validation and release evidence

- Fresh local `npm ci` and `npm test` (build included) at final candidate: **1,294 passed**, zero failed/skipped. All earlier numerical tolerances retained.
- Exact candidate [PR CI 35860727563](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35860727563) and push CI **35860722167** pass. Browser job **107180073729**: **136 passed**, zero retries, across desktop Chromium/Firefox, iPhone WebKit and 360px Chromium. Browser suite ran in GitHub CI, not locally.
- Final release artifact **10750615532**, browser artifact **10749619233**. All three release files match the fresh local build byte-for-byte. Desktop and both phone editor viewport screenshots were inspected; Undo remains clear. Unrestricted Build screenshot also reviewed.
- HTML: **746,563 bytes**. SHA-256: **d407fb18e0deec8befb910d832cb7c582ae0d8399d4c8625194ed8da4b373533**.
- Downloaded public HTML, `release.json` and `SHA256.txt` match that exact tested artifact. Vercel deployment **9RXP2L4MX3eSdaUTW5kjyg2jN1S2** reports success for released code.
- Public upgrade check: reproduced an edited 8 m beam with Hidden/Predict-first results in 4.1.2 Build. After deployment, reloaded the same browser study into 4.1.3: 8 m beam retained, reactions +10/+10 kN and peak moment 40 kN·m visible.
- Public 8 → 9 m Tab edit, Undo → 8 and Redo → 9 passed. Restored 8 m, froze comparison, opened a lesson, used Next/Previous and returned: original beam, Redo and comparison restored, results visible.
- Preview Practice → Build transition also passes. The public tutor health endpoint identifies 4.1.3 and `configured:false`; no AI provider connection is claimed.
- Merged-main [CI 35862619917](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35862619917): **1,294 numerical/behaviour and 136 browser checks passed**; browser job **107186347922**, zero retries. Merged source is identical to the validated candidate.

Public selected-object check also passes: 20 → 24 kN edit gives +12/+12 kN reactions and 48 kN·m peak moment. Visible Undo is unobstructed; clicking it restores 20 kN and the original results. [Public editor screenshot](../qa/4.1.3/public-editor.jpg).

## Next approved work

The [approved UX audit and plan](UX_AUDIT_AND_PLAN_2026_09_22.md) remains the implementation guide. This release completes its first correctness increment and the immediate editor obstruction/target-stability work. It does **not** complete the broader redesign.

Next: start a new dedicated feature branch from then-current main, record account/objective/start/ref, open an early draft PR, and work on the coherent workspace shell: clear Build/Explore and optional Learn modes, focused Model/Analyse/Review navigation, compact secondary controls, consistent editing surfaces, and preserved Structure → SFD → BMD alignment. Follow with the focused mobile Activity/Beam learning layout, consolidated lesson controls, comprehensive mathematical typography in UI/export and richer deterministic explanations.

Before each increment state implementation/test checklists, run the current baseline, add changed-behaviour tests, inspect desktop/mobile rendering, checkpoint before long tests and verify the actual public artifact after any release. Do not combine unvalidated changes with a public-ready claim. No catalogue expansion, new physics, code capacities, truss/frame solver or giant chatbot in this UX scope.

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

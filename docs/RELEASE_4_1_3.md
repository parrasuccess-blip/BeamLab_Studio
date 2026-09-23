# BeamLab Studio 4.1.3 — Unrestricted engineering and reliable learning activities

Status: released through PR #21 on 2026-09-23; public artifact and live upgrade verified. Released code: d4f6b2182b1c899ce8f54213f67b111c9a7a8ca6.

## Changes

- Build / Explore, Analyse and Review expose all engineering tools and results. Learning level controls Learn’s presentation only. Old saved Practice preferences cannot hide results on reload.
- One answer-visibility policy covers metrics, diagrams, comparison values, stress, Show Why, working, checks, tutor and exports. Learn reveals results deliberately; active exams retain their submission boundary.
- Fixed-question sessions protect the question model from history, numeric preview, drag and import mutations. Leaving a session restores the original engineering study, page-session history and comparison.
- Invalid standalone lesson edits roll back without discarding the question. A committed exploration edit pauses the question explicitly and offers restart. Lesson navigation and changing level clear obsolete notices while preserving the original model.
- Opening extra response layers after a completed session question preserves its recorded evidence. Grading and adaptive algorithms are unchanged.
- The selected-object editor reserves space beside the beam on desktop and its own row on phones. It no longer floats over Undo. Direct label editing remains compact.
- Shared deterministic explanations read the solved one-sided fields and local intensity. Coincident force/couple events explain both jumps; enabled factored self-weight and real support/end conditions are included.

## Validation

The 4.1.2 baseline passes 1,272 numerical/behaviour checks. This repair adds 22 policy/explanation checks, including independent coincident force/couple values, self-weight factoring and continuous-support behaviour. Fresh final-candidate installation/build/tests pass **1,294**, zero failures/skips. Numerical tolerances are unchanged.

Final candidate 031b8bf passes **136 browser checks**, zero retries, across desktop Chromium/Firefox, iPhone WebKit and 360px Chromium. Exact PR CI: 35860727563; push CI: 35860722167. Reviewed desktop/mobile editor and unrestricted Build screenshots. Both actual pointer presses must hit the same stationary editable label; complete edit/rollback/restoration tests remain.

Downloaded public HTML matches the tested artifact byte-for-byte: **746,563 bytes**, SHA-256 **d407fb18e0deec8befb910d832cb7c582ae0d8399d4c8625194ed8da4b373533**. Release/hash metadata agree. Reloading a previously blocked 4.1.2 8 m study into 4.1.3 preserves the model and shows reactions and diagrams. Live Undo/Redo and temporary-lesson return restore the original beam, history and comparison. Full evidence and automatic merged-main CI status are in docs/ai/HANDOFF.md.

## Boundaries

The deterministic solver, model schema, signs, units, numerical tolerances, grading and adaptive-learning algorithms are unchanged. BL410 fingerprints remain compatible. This is an educational/static-analysis and entered-criteria preview, not verified code design or structural approval.

This is the first correctness increment in the approved UX plan. The broader two-mode workspace shell, focused mobile Activity/Beam layout, comprehensive mathematical typography and richer teaching presentation remain subsequent increments.

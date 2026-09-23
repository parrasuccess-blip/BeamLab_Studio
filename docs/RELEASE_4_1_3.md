# BeamLab Studio 4.1.3 — Unrestricted engineering and reliable learning activities

Status: release candidate in PR #21. Not yet merged or verified on production.

## Changes

- Build / Explore, Analyse and Review expose all engineering tools and results. Learning level controls Learn’s presentation only. Old saved Practice preferences cannot hide results on reload.
- One answer-visibility policy covers metrics, diagrams, comparison values, stress, Show Why, working, checks, tutor and exports. Learn reveals results deliberately; active exams retain their submission boundary.
- Fixed-question sessions protect the question model from history, numeric preview, drag and import mutations. Leaving a session restores the original engineering study, page-session history and comparison.
- Invalid standalone lesson edits roll back without discarding the question. A committed exploration edit pauses the question explicitly and offers restart. Lesson navigation and changing level clear obsolete notices while preserving the original model.
- Opening extra response layers after a completed session question preserves its recorded evidence. Grading and adaptive algorithms are unchanged.
- The selected-object editor reserves space beside the beam on desktop and its own row on phones. It no longer floats over Undo. Direct label editing remains compact.
- Shared deterministic explanations read the solved one-sided fields and local intensity. Coincident force/couple events explain both jumps; enabled factored self-weight and real support/end conditions are included.

## Validation

The starting released baseline passes 1,272 numerical/behaviour checks. The repair adds 22 policy/explanation checks, including independent coincident point/couple values, self-weight factoring and continuous-support behaviour. Fresh local tests pass 1,294; exact final-candidate browser/visual results will be recorded after execution. Preserve all prior numerical tolerances, mobile Undo hit-target assertions, Firefox pointer/focus checks and model-restoration journeys.

Account B checkpoint cd572dc: 130/136 browser checks passed. Four failures were an ambiguous test locator, one a Firefox label-opening timeout and one the old fixed mobile inspector covering Undo. Recovery repairs and remaining validation are recorded progressively in docs/ai/HANDOFF.md and SESSION_LOG.md.

## Boundaries

The deterministic solver, model schema, signs, units, numerical tolerances, grading and adaptive-learning algorithms are unchanged. BL410 fingerprints remain compatible. This is an educational/static-analysis and entered-criteria preview, not verified code design or structural approval.

This is the first correctness increment in the approved UX plan. The broader two-mode workspace shell, focused mobile Activity/Beam layout, comprehensive mathematical typography and richer teaching presentation remain subsequent increments.

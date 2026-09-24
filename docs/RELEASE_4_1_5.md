# BeamLab Studio 4.1.5 — Workspace and explanation clarity

Status: **released and verified** at https://beam-lab-studio.vercel.app/ through [PR #25](https://github.com/parrasuccess-blip/BeamLab_Studio/pull/25). Public HTML SHA-256: `6953a87b94c53bf17043c765f6388d32364c795f23ff8272e1abfb8a54152171`.

## What changes

- Build / Explore, Analyse and Review share one visible engineering path. Learn is a separate optional destination; existing direct-use and model-preservation rules remain in place.
- Active standalone lessons and challenges keep the question and Previous/Next navigation in focus. A direct My model exit stays beside them; compact learning tabs remain visible so the student can switch to a challenge or Mastery practice without leaving the lesson first. The large inactive intro and progress block are hidden during a question. On phones, Activity and Beam jumps let the student move between the task and aligned diagrams without hiding the other view.
- Show Why is reachable beside the diagrams. At the inspected x-position it presents the actual solved intensity and shear slope, one-sided shear/moment jumps where applicable, and elastic curvature for advanced users. Additional support/action facts remain expandable. Beginner explanations avoid unnecessary stiffness notation. The dialog and diagram panel use the same deterministic explanation.
- Worked solutions show integrals, Σ, indices and squared/cubed terms with mathematical typography. Moment units use kN·m in the main UI, review, lessons, moving-load display and vector export. The PDF writer encodes the middle dot through WinAnsi so report text renders it correctly; CSV machine-readable field names remain stable.
- A browser regression waits for the completed Tab edit before testing Undo's real clickable hit target, because the earlier test grabbed a toolbar node while the commit was still repainting. The hit test, Undo click and value restoration remain mandatory.

## Engineering boundaries

The solver, sign conventions, units, numerical tolerances, learning grading, model persistence and code-design limitations are unchanged. Show Why reads the solved beam; it does not form a second analysis engine. User-entered design criteria remain a screening review, not verified structural capacity or code certification.

## Validation and public release

- Exact feature head `eeb5986`: [CI 35993030160](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35993030160) passed all **1,297** numerical/behaviour checks and **152/152** browser journeys on desktop Chromium, desktop Firefox, iPhone WebKit and 360 px Chromium, zero retries. This includes the Learn → Build heading clearance after a focused lesson, Undo hit-target and history, optional Learn routes, direct Mastery access, and model preservation.
- [Merged-main CI 35994312495](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35994312495) passed both regression and browser jobs. The 4.1.5 source/build passed without changing solver tolerances.
- [Public verification 35996051228](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35996051228) fetched the live HTML byte for byte plus SHA256.txt and release.json. All agree on `4.1.5` and SHA-256 `6953a87b94c53bf17043c765f6388d32364c795f23ff8272e1abfb8a54152171`. Live desktop and phone browser journeys passed Build → lesson → original beam, heading position and horizontal-width checks. [Desktop/phone screenshot artifact](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35996051228/artifacts/10806232354). Phone evidence is browser emulation rather than a physical-device claim.
- Hosted preview manual journey confirmed edit from 6 to 8 m with 40 kN·m peak moment and working Undo, temporary lesson and original beam/history restoration, and Show Why on the reference 6 m/20 kN point-load case.

# BeamLab Studio 4.1.5 — Workspace and explanation clarity

Status: release candidate on draft PR #25. Do not describe as public until the exact artifact is verified at https://beam-lab-studio.vercel.app/.

## What changes

- Build / Explore, Analyse and Review share one visible engineering path. Learn is a separate optional destination; existing direct-use and model-preservation rules remain in place.
- Active standalone lessons and challenges keep the question and Previous/Next navigation in focus. A direct My model exit stays beside them; compact learning tabs remain visible so the student can switch to a challenge or Mastery practice without leaving the lesson first. The large inactive intro and progress block are hidden during a question. On phones, Activity and Beam jumps let the student move between the task and aligned diagrams without hiding the other view.
- Show Why is reachable beside the diagrams. At the inspected x-position it presents the actual solved intensity and shear slope, one-sided shear/moment jumps where applicable, and elastic curvature for advanced users. Additional support/action facts remain expandable. Beginner explanations avoid unnecessary stiffness notation. The dialog and diagram panel use the same deterministic explanation.
- Worked solutions show integrals, Σ, indices and squared/cubed terms with mathematical typography. Moment units use kN·m in the main UI, review, lessons, moving-load display and vector export. The PDF writer encodes the middle dot through WinAnsi so report text renders it correctly; CSV machine-readable field names remain stable.
- A browser regression waits for the completed Tab edit before testing Undo's real clickable hit target, because the earlier test grabbed a toolbar node while the commit was still repainting. The hit test, Undo click and value restoration remain mandatory.

## Engineering boundaries

The solver, sign conventions, units, numerical tolerances, learning grading, model persistence and code-design limitations are unchanged. Show Why reads the solved beam; it does not form a second analysis engine. User-entered design criteria remain a screening review, not verified structural capacity or code certification.

## Validation in progress

- Baseline 4.1.4: 1,294 numerical and behaviour tests pass. The later documentation-only main CI recorded one intermittent browser timing failure, investigated above.
- Initial PR candidate: 1,297 numerical and behaviour tests passed. Initial browser run 35988066160: 144 passed, eight failures across four browser configurations from a test helper assuming the new two-button mobile jump is a single control and an obsolete Show Why wording assertion. Both assertions are repaired; final candidate rerun pending.
- Next 4.1.5 candidate browser run 35989663956: 148 passed, four failed because the new focused lesson layout hid the direct route into Mastery. Kept the compact three-tab route available; validation of this repair is pending.
- Hosted preview manually checked: engineering entry, edit from 6 to 8 m with Undo enabled, temporary lesson and return preserving 8 m and history, and the new Show Why values for the 6 m / 20 kN centre point load.
- Candidate 90e2af9 CI 35990584008: 1,297 numerical/behaviour checks and 152/152 browser journeys passed. CI HTML SHA-256 `4b4fa971ea71a417c3dffa2aea5cddcf6ef0e6b6f190de0264cf29177f275c8c` matched local. Manual preview found the heading under the sticky header after lesson exit; its targeted repair still awaits CI.
- Final four-browser CI, phone screenshots, final release artifact hash and public production verification: pending.

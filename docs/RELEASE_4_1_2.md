# BeamLab Studio 4.1.2 — Clearer diagrams and reliable label editing

Status: released and independently verified on production, 2026-09-22. PR #18 merged as `e6d4585a648bd624d1db41dc3d7e60037c448b4b`.

## Changes

- Live inspection values use a separate wrapping readout, including both sides of a discontinuity and an explicit notice when the inspected position is outside the zoomed view. The cursor remains at the exact sampled coordinate.
- Critical values and hinge zeros use bounded labels, leaders and separate overflow rows when crowded. Point dots have their own clearance. Full names and numerical values wrap rather than clip.
- Supports, prescribed movements, reactions, hinges and local property notes use separate annotation rows. Load lanes account for label width and current zoom. Structure → SFD → BMD stays vertically aligned.
- Load-label double taps keep the full inspector out of the way. The compact editor replaces the competing panel, and Undo/Redo close obsolete inline fields. Locked objects still expose their inspector.
- A second edit arriving before the previous Tab callback runs now starts a separate history entry. Native focus and the Firefox pressed-control safeguards remain.
- PDF diagram grouping uses the actual available page area and preserves measured annotation font sizes. The standard reference report retains its two-page regression requirement.

## Validation

The final candidate `2ab5003` passes **1,272 Node checks** and **112 browser checks**, zero retries, in PR run [35727547909](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35727547909). Desktop Chromium/Firefox, iPhone WebKit and 360px Chromium are covered. Endpoint, hinge and crowded-support screenshots and the two-page reference PDF were visually inspected. The mobile editor obstruction is repaired; numerical expectations and tolerances remain intact.

The actual public HTML, release metadata and hash match the tested artifact exactly: **735,456 bytes**, SHA-256 `d683284d28cb618e43ffeee6aec234ea152d9a460b6723cb48735bf72fd32d04`. Live checks confirm independent Tab edits, repeated label editing, pending-edit Undo/Redo and separated endpoint readouts. Production `/api/tutor` identifies 4.1.2 and remains unconfigured.

Coverage includes independent fixed-end moment references, endpoint/hinge/crowded-support label bounds, exact critical values, zoom, SVG/PDF exports, repeated inline editing and Undo/Redo, delayed Tab callbacks, learning-model preservation and the unchanged numerical suites. No numerical tolerance was relaxed.

## Boundaries

No solver, sign convention, unit, model schema, grading or adaptive-learning algorithm changes. Model fingerprints remain in the compatible `BL410-` namespace. Moving envelopes remain sampled static analysis; catalogue limits and educational/design-screening boundaries are unchanged.

Mathematical notation throughout the product, broader mobile lesson layout and deeper deterministic Show Why explanations remain separate follow-ups. This release does not claim code-design certification or completion of the wider roadmap.

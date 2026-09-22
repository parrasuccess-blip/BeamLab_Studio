# BeamLab Studio 4.1.2 — Clearer diagrams and reliable label editing

Status: release candidate on `feature/diagram-annotation-layout`, PR #18. Not yet merged or verified in production.

## Changes

- Live inspection values use a separate wrapping readout, including both sides of a discontinuity and an explicit notice when the inspected position is outside the zoomed view. The cursor remains at the exact sampled coordinate.
- Critical values and hinge zeros use bounded labels, leaders and separate overflow rows when crowded. Point dots have their own clearance. Full names and numerical values wrap rather than clip.
- Supports, prescribed movements, reactions, hinges and local property notes use separate annotation rows. Load lanes account for label width and current zoom. Structure → SFD → BMD stays vertically aligned.
- Load-label double taps keep the full inspector out of the way. The compact editor replaces the competing panel, and Undo/Redo close obsolete inline fields. Locked objects still expose their inspector.
- A second edit arriving before the previous Tab callback runs now starts a separate history entry. Native focus and the Firefox pressed-control safeguards remain.
- PDF diagram grouping uses the actual available page area and preserves measured annotation font sizes. The standard reference report retains its two-page regression requirement.

## Validation

The fresh inherited build and all 1,272 Node checks passed. The first annotation candidate had 99/108 browser passes; Account B's recovery reached 110/112, with mobile editor reopening failures. Those failures were traced to the first tap opening a panel over the second tap target. The final candidate retains and strengthens the existing 112 checks; final execution and visual evidence are pending.

Coverage includes independent fixed-end moment references, endpoint/hinge/crowded-support label bounds, exact critical values, zoom, SVG/PDF exports, repeated inline editing and Undo/Redo, delayed Tab callbacks, learning-model preservation and the unchanged numerical suites. No numerical tolerance was relaxed.

## Boundaries

No solver, sign convention, unit, model schema, grading or adaptive-learning algorithm changes. Model fingerprints remain in the compatible `BL410-` namespace. Moving envelopes remain sampled static analysis; catalogue limits and educational/design-screening boundaries are unchanged.

Mathematical notation throughout the product, broader mobile lesson layout and deeper deterministic Show Why explanations remain separate follow-ups. This release does not claim code-design certification or completion of the wider roadmap.

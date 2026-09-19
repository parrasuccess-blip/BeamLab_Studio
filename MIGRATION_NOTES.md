# Migration notes

## Reconstructed baseline

The repository was reconstructed from:

1. the exact BeamLab Studio 3.9 standalone release;
2. the AppDeploy 4.0 release payload, which reconstructed to SHA-256 `6a80120ef675502526e3043013babd31e15b347bc25b16dc54d454717a633774`;
3. the 4.0.1 readability/adaptive-tutor layer used by AppDeploy v22.

The frozen v22-style standalone reference is retained under `reference/` so future migration changes can be compared against a known artifact.

## Why this repository exists

The previous AppDeploy deployment reconstructed production through a historical chain of release transforms. That made small product changes harder to review and made deployment failures more likely.

The new repository makes readable source canonical. `scripts/build.cjs` is the only production assembly step.

## Non-negotiable invariants

- one deterministic solver;
- learning levels alter UI/explanation, not structural truth;
- edited beams survive learning-level changes;
- vertical applied loads/intensities positive downward;
- reactions positive upward;
- applied couples and rotation positive counter-clockwise;
- bending moment positive sagging;
- displacement positive upward;
- AI never recalculates supplied BeamLab numerical results;
- Exam Mode blocks tutor assistance;
- Design Studio remains an educational screening/review layer, not code approval.

# Studio 4.1 release and validation record

## Basis

Continues GitHub main `b6066bbe67dab54f9dae1692207084b4f072e75c`, including true stepped sections, support settlement and source-native learning improvements. The 3.8.6 handoff is regression/history evidence, not a replacement for newer source. The historical AppDeploy patch chain is not used.

## Changes

1. Build → Analyse → Learn → Review navigation with contextual controls, selected-object inspector, keyboard/touch inspection position and progressively disclosed study evidence.
2. Fix Layers rendering of stepped-section stress controls.
3. Correct moving point-load topology and element recovery to use actual local section/EI boundaries. Prescribed support movement belongs only to the optional static base, never each moving increment.
4. Add prescribed rotation at fixed supports (mrad, CCW positive), validation, reaction/work accounting, warning, drawing, report and contextual explanation fields.
5. Add fibre-level bending/elementary-shear inspection with explicit left/right cut selection. Retain unavailable states for unsupported geometries and EI-only overrides.
6. Add ideal circular and hollow-circular geometry and explicit geometric property references. No invented catalogue entries, fillet corrections, angle torsion or design capacities.
7. Add review hub, numerical evidence/export links, local-data notice and user-reviewed issue-report preparation.
8. Add schema-checked learning-progress export/import with preview and explicit replacement. Models, learning level and active sessions are excluded; imported evidence remains bounded.
9. Remove the old readability MutationObserver adapter. Source-native tutor context now includes the learning snapshot directly. Offline health and request timeouts isolate tutor failure from analysis.
10. Restore nine historical regression suites, add calculation and behaviour tests, four-browser/viewport CI journeys, deterministic release metadata and a numerical deployment gate.

## Independent checks

- Existing 21 analytical reference checks remain unchanged.
- For an unloaded fixed-fixed beam, a left rotation θ with zero translation/right rotation is checked against `v=Lθ(z−2z²+z³)`, `M=EIθ/L(−4+6z)`, reactions `±6EIθ/L²` and reaction couples `4EIθ/L`, `2EIθ/L`.
- An unloaded cantilever follows `v(x)=settlement+θx` without spurious reactions/stress.
- Stepped cantilever moving-load deflection is checked by direct integration of `P(L−x)²/EI(x)`; multi-support/released moving results are also compared with the separate event-aligned static formulation on both sides of events.
- Rectangle fibre checks use independent `−My/I` and `1.5V/A` references, zero free-surface shear, correct local section side and explicit non-inference cases.
- Section-property tests independently check circular area, second moment, plastic modulus and torsion geometry with original units.

## Release gates

The initial 79-test current suite passed before edits. Restoring the original suites produced 1,226 passing checks before the new 4.1 tests. Final counts and browser evidence are recorded in GitHub Actions for the release commit, not inferred from this document.

The browser suite checks the first-year reference, all four destinations, aligned diagrams, model preservation across levels/reload, invalid/no-op edits, an unstable model plus undo, stress exploration, rotation/review, progress export/import, session exit restoration, verification export and offline tutor behaviour. Every test fails on an uncaught application error. Four projects cover desktop Chromium, Firefox, mobile WebKit and a 360 px Chromium viewport. Screenshots support human visual review; automated checks alone do not establish usability or zero defects.

Do not claim public deployment until the final public HTML hash/version matches the tested artifact. No diagnostic fallback is permitted if compilation or regressions fail.

## Roadmap status / deliberately outside this release

Already delivered in this product line: readable-source deployment, true stepped sections/EI regions, support settlement, freehand diagram prediction, adaptive teaching, contextual tutor integration, manual criteria review. This release improves their coherence and test coverage.

Still separate validation/infrastructure work:

- Authoritatively sourced EA/UA/TFB/RHS/SHS/CHS catalogue expansion with traceable complete property sets. Ideal geometric shapes are not manufacturer products.
- Exact candidate-event moving-load extrema, expanded vehicle libraries and multiple trains. Current scans remain labelled sampled.
- Thermally imposed deformation, tapered elements, shear deformation, dynamics and richer 2D stress fields.
- Production AI credentials, verified provider model, usage/abuse limits and operational monitoring. No fabricated “AI connected” state.
- Verified AS 4100/AS/NZS design capacities, load combinations and clause traceability. Manual capacities/elastic references are not these checks; licensed current authoritative standards and independent validation are required.
- Concrete design, TrussLab, FrameLab and general FEM. These are separate numerical/product stages, not UI toggles.

The release is an educational/static-analysis preview, not professional safety certification. Test evidence reduces risk; it cannot prove the absence of every defect.

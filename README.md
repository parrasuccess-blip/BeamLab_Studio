# BeamLab Studio 4.1.4 — Engineering and Learning Studio

Interactive beam analysis and learning, built from readable source. Educational/static-analysis research preview; **not structural design approval or code certification**.

Public site: https://beam-lab-studio.vercel.app/

## Four connected destinations

- **Build / Explore:** drag supports and loads, edit geometry, assign sections and load cases.
- **Analyse:** aligned Structure → SFD → BMD, deformation, local stress, moving-load studies and deterministic explanations.
- **Learn (optional):** diagram prediction and sketching, numerical challenges, adaptive practice, exams and resumable guided study blocks. Progress can be exported independently of the model.
- **Review:** numerical consistency checks, model/data/report exports, and optional user-entered criteria. Demand/capacity screening is not a code design calculation.

One deterministic Euler–Bernoulli model powers every learning level. Changing level never replaces a genuinely edited beam. Existing advanced features remain active even when lower levels hide their editing controls.

Build, Analyse and Review always expose engineering tools and results regardless of the learning preference. Prediction masks belong only to Learn. Direct engineering use never requires a lesson or learning-level choice. Standalone lessons/challenges temporarily load examples without overwriting your saved beam. Return to your model restores Undo/Redo and comparison within the page session; reload retains the saved beam and learning progress.

Diagram annotations wrap and separate crowded values while keeping each marker at its exact engineering coordinate. Inspection values have their own readout; label editing preserves Undo/Redo on desktop and mobile.

See `docs/RELEASE_4_1_3.md` for this update and its validation record.

## Build and verify

Node 24 or later:

```bash
npm ci
npm test
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
```

`npm test` builds and tests the production module bundle as well as the restored historical numerical suites. It does not require a browser or network. Browser tests serve the built artifact with an offline tutor endpoint and exercise desktop Chromium/Firefox plus mobile WebKit/Chromium. CI retains the artifact, screenshots and failure traces.

`npm run build` creates `dist/index.html`, `dist/SHA256.txt` and `dist/release.json`. The build is deterministic: no timestamps, historical HTML patch chain, or catch-and-publish fallback. The app remains usable as standalone HTML without the optional tutor.

## Source map

- `src/engine/`: static solver, numerical utilities, elementary shear and moving point-load analysis.
- `src/model/`: validation, examples, load cases, true section regions, EI-only overrides and section references.
- `src/studio/`: workspace, diagrams, learning, verification, local stress explorer and review/export.
- `src/browser/`: optional online tutor client.
- `api/tutor.js`: bounded contextual explanation endpoint; never a numerical solver.
- `tests/legacy/PROVENANCE.md`: origin and minimal adaptations of the restored 3.8.6 suites.
- `docs/RELEASE_4_1.md`: implementation, validation scope and remaining roadmap.

## Engineering boundaries

Applied vertical loads are positive downward; reactions/displacement positive upward; applied couples/rotation positive counter-clockwise; bending moment positive sagging. Inputs retain the original kN, m, GPa and mm section-property conventions.

True stepped sections and optional EI-only overrides are supported. Vertical support settlement and fixed-support rotation are prescribed boundary conditions. Local elastic stress is not inferred from an EI-only multiplier. Circular, hollow circular, rectangle, box and I geometries are idealised, not additional verified catalogue products. Unsupported shear/torsion/section fields remain explicitly unavailable.

Moving-load analysis uses successive static positions and local element stiffness. Influence lines exclude static loads and prescribed movements; optional base addition in envelopes includes them once. Envelopes are sampled, not dynamic analysis or certified exact maxima.

## Deployment

GitHub is canonical. `vercel.json` runs the full numerical regression gate and serves `dist/`; `api/tutor.js` supplies the optional endpoint. Inspect GitHub CI and the Vercel preview before merging a release. After deployment, compare public `release.json`/`SHA256.txt` with the downloaded public HTML and verify real interaction flows. A successful source commit alone is not a successful deployment.

No provider secret is required for analysis, learning, review or exports. The tutor health endpoint reports whether a key is configured. The UI offers deterministic Show Why when the online tutor is unavailable. For an intentionally enabled tutor, configure `OPENAI_API_KEY` and a verified `OPENAI_MODEL` in the host; never commit credentials. The migration's fallback model identifier is retained for compatibility, not asserted as a generally available provider model. Validate provider access and add appropriate abuse/cost controls before enabling it for unrestricted public use.

Model and learning data are local to the browser. Snapshot URLs are readable encodings, not encryption. An explicit online-tutor request transmits bounded model/learning context to the host and configured AI provider. See the in-app Privacy & local data notice.


4.1.4 candidate: control sizing, action spacing, field containment and responsive UI polish. See docs/RELEASE_4_1_4.md; production status is recorded in docs/ai/HANDOFF.md.

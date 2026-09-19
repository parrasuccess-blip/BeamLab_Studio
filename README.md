# BeamLab Studio - clean source migration

This repository is the editable-source migration of the BeamLab Studio 4.0.1 / AppDeploy v22 product line.

## Engineering rule

BeamLab has one deterministic structural solver. The learning system, Design Studio and contextual tutor sit around that solver and must never replace its numerical results.

## Source layout

- `src/engine/` - deterministic structural analysis
- `src/model/` - study model, examples, validation, catalogue and section properties
- `src/studio/` - workspace, diagrams, learning, verification and Design Studio
- `src/browser/` - browser-only tutor client and readability/product enhancements
- `api/tutor.js` - Vercel serverless contextual tutor endpoint
- `scripts/build.cjs` - builds the standalone BeamLab application from readable source
- `tests/` - numerical and tutor-boundary regression tests
- `reference/BeamLab-Studio-v22.html` - frozen AppDeploy v22 reference artifact

## Build

```bash
npm run build
```

The standalone application is written to `dist/index.html`.

## Test

```bash
npm test
```

The migration currently verifies:

- 6 m simply supported beam + 20 kN centre point load -> 10 kN / 10 kN reactions and 30 kN m peak moment
- 10 m beam + 5 kN/m UDL -> 25 kN / 25 kN reactions and 62.5 kN m peak moment
- all 21 built-in analytical benchmarks
- Design Studio and contextual tutor hooks remain present
- Exam Mode tutor rejection
- tutor failure remains isolated from deterministic BeamLab

## Vercel

The project is Vercel-ready. `vercel.json` runs `npm run build` and serves `dist/` while `api/tutor.js` provides the tutor endpoint.

The entire deterministic application works without an AI secret. If the tutor is not configured, BeamLab shows tutor unavailability while analysis, diagrams, learning, Design Studio and exports remain available.

For the optional tutor backend set these Vercel environment variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional; defaults to `gpt-5.6-luna` in the migration source)

Never commit secrets to this repository.

## Migration status

This is the first clean-source milestone. It intentionally preserves the current solver before further UI restructuring. The next source-native feature branch should implement the five-step Design workflow directly in readable files rather than adding another release-patch layer.

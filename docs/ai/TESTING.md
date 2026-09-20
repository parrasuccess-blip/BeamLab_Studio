# BeamLab Testing and Validation Guide

## Purpose

This file tells Account A and Account B how to establish the current BeamLab health before and after changes.

Never assume an old test count remains current. Run the current repository checks.

## Environment

Current package baseline requires:

- Node.js 24 or later
- npm
- Playwright browsers for browser testing

## Install dependencies

```bash
npm ci
```

## Production build

```bash
npm run build
```

The current build script runs `node scripts/build.cjs`.

At the 4.1 baseline, the deterministic build creates:

- `dist/index.html`
- `SHA256.txt`
- `release.json`

Do not add a catch-and-publish fallback that releases an artifact after compilation or regressions fail.

## Numerical / behaviour test suite

```bash
npm test
```

At the current package baseline this runs the build and then the Node test suites in:

- `tests/*.test.cjs`
- `tests/*.test.mjs`
- `tests/legacy/*.test.cjs`

The 4.1 release commit records **1,255 numerical/behaviour checks** at the release candidate. This number is historical evidence, not a permanent target. Record the actual result each time.

## Browser test setup

If Playwright browsers are not installed:

```bash
npx playwright install --with-deps chromium firefox webkit
```

## Browser journeys

```bash
npm run test:browser
```

The current package script runs:

```bash
playwright test
```

The 4.1 release commit records **56 browser journeys** at the release candidate. Run the current suite and report the actual result rather than assuming that number remains unchanged.

At the 4.1 baseline, browser coverage includes desktop Chromium, Firefox, mobile WebKit and a narrow Chromium viewport.

## Important regression areas

Treat these as high-risk when touched:

- support reactions;
- shear-force calculations;
- bending-moment calculations;
- slope and deflection;
- point loads;
- distributed loads;
- support conditions;
- prescribed settlement;
- prescribed fixed-support rotation;
- stepped sections;
- EI-only overrides;
- local fibre stress;
- moving-load topology and envelopes;
- model preservation between learning levels;
- sign conventions;
- numerical tolerances.

## 4.1 sign convention baseline

- Applied vertical loads: positive downward.
- Reactions/displacement: positive upward.
- Applied couples/rotation: positive counter-clockwise.
- Bending moment: positive sagging.

Do not silently change these conventions.

## UI checks for relevant changes

When changing the interface, manually or through browser tests inspect:

- desktop layout;
- laptop widths;
- mobile/narrow layout;
- Build / Analyse / Learn / Review navigation;
- object selection;
- direct manipulation;
- value/label collisions;
- diagrams and aligned readouts;
- tool panels obscuring the structure;
- keyboard interaction;
- touch interaction;
- lesson navigation;
- Build-vs-Learn switching;
- Show Why rendering;
- error states;
- undo after invalid/unstable edits.

Numeric editing must also preserve the browser interaction lifecycle: Tab and Shift+Tab commit independent edits without losing their focus destination; a first valid pending edit makes Undo available; invalid edits restore the committed beam without adding history. Assert persistence immediately after Tab, before any unrelated action can accidentally finish the transaction. Retain the pointer-down/pointer-up checks that catch Firefox losing a pressed navigation control during redraw.

## Learning checks

When changing Learn behaviour, verify:

- changing learning level does not replace a genuinely edited beam;
- advanced model features remain structurally active even if their editing controls are hidden;
- progress import/export does not overwrite the structural model;
- deterministic learning evidence remains bounded;
- the online tutor is not required for numerical or learning functionality.

## Show Why / tutor checks

The application must remain usable when the online tutor is unavailable.

The deterministic Show Why path should continue working without provider credentials.

`api/tutor.js` is explanatory infrastructure, not a numerical solver.

Never commit provider credentials.

## Deployment verification

When claiming a release is live:

1. verify the relevant GitHub checks;
2. verify the Vercel deployment actually succeeded;
3. compare public release/version/hash information with the tested artifact when appropriate;
4. exercise real public interaction flows.

Do not equate “commit exists” with “production is verified”.

## Session reporting

At the end of a development session, record in `HANDOFF.md` and `SESSION_LOG.md`:

- exact commands run;
- pass/fail result;
- actual test counts where available;
- any pre-existing failures;
- any new failures;
- build result;
- browser result;
- deployment state if checked.

If the testing process itself changes, update this file.

## Recovery baseline — 2026-09-20

Account B checkpoint `799fae5`: freshly verified **1,258 numerical/behaviour checks** locally and **76 browser journeys** in CI run 35499219786. The browser command runs in GitHub CI with the configured four projects and zero retries. Inspect logs and screenshots in `browser-evidence`; do not claim a local browser run when CI supplied the execution.

Account A recovery adds checks for named-study, shared-snapshot and model-JSON opening during a standalone lesson, invalid input preserving the activity, navigation/reload keeping the explicitly opened study, undo returning to the original beam, and redo/comparison preservation. Current counts and results must be recorded after the new suite runs.

Before long validation, push the coherent source and a status checkpoint. Update HANDOFF and SESSION_LOG during work. No reliable advance credit-limit warning exists.

Correction: all three generated release files are inside `dist/`: `dist/index.html`, `dist/SHA256.txt`, `dist/release.json`.

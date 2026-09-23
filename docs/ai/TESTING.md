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

The deterministic build creates:

- `dist/index.html`
- `dist/SHA256.txt`
- `dist/release.json`

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

## 4.1.1 validated candidate — 2026-09-21

Implementation `c785fae`: fresh local installation/build/test **1,258 passed**; exact-head PR run **35554612907** runs `npm run test:browser` in CI with **96 passed**, zero retries. Retain the Firefox-specific focus assertion: Shift+Tab from the first numeric field reaches its scrollable tools container, then Studies. Do not remove the container from native keyboard navigation to match another browser's order. Both pressed-pointer regression cases remain required. Version/title/issue-report expectations now identify 4.1.1; `BL410-` model references remain compatible.

## 4.1.1 released baseline — 2026-09-21

- Released source: `9cf86ef570ecb4895ec071c2a497b80ecb636d6a` (PR #16). Account B freshly ran `npm ci`, `npm run build` and `npm test`: **1,258 numerical/behaviour checks passed**, zero failed/skipped.
- Main [CI run 35555337390](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35555337390) passed. Browser job 106197820962 records **96 passed (3.5m)**, with zero retries across desktop Chromium/Firefox, iPhone WebKit and 360px Chromium. Browser evidence artifact: 10620013758; release artifact: 10620140121. Browser execution was in CI; hosted interaction was inspected separately using the supported browser runtime.
- Built HTML: **725,972 bytes**, SHA-256 **6dbd2d3e2ac5d20baf8f749c205b8cce7bf99ba89b8575d8abce26913fa9de40**. The public HTML and release/hash metadata were independently fetched and matched exactly. Vercel's commit status reports a successful production deployment.
- Public interaction checks passed for direct entry, separate Tab edits, first-edit Undo availability, Undo/Redo, lesson navigation and original beam/history/comparison restoration. Reload inside a temporary example retained the saved engineering model and reset page-session history/comparison as documented. Invalid 0 m input restored the committed beam without adding history. Review showed 6/6 consistency checks.
- `/api/tutor` identifies 4.1.1 and reports `configured:false`; offline functionality is expected. No provider connection is claimed.

These are observed release results, not future fixed test counts. Re-establish the current baseline after fetching newer work.

## 4.1.2 released baseline — 2026-09-22

- Released code `e6d4585a648bd624d1db41dc3d7e60037c448b4b` / PR #18. Final candidate `2ab5003` passes **1,272 Node checks**, zero failed/skipped, and **112 browser checks**, zero retries.
- Exact-head PR run **35727547909**, browser job **106744894705**, and push run **35727543390** succeed. Browser evidence **10694401811** includes reference PDFs from all four projects. Release artifact **10692979694**.
- Inspect both annotation boxes and critical-marker bounds: text/boxes must neither collide nor clip, and point dots must not cover labels. Exercise endpoint readouts, zoom/outside-view state, hinge zeros, crowded support movement notes and full load names. Keep the independent fixed-end values and two-page PDF assertion unchanged.
- Retain the paused-clock same-field Tab race and repeated direct-label editing/Undo/Redo tests, including before Enter. The first mobile label tap must not open an inspector over the second tap. Object-body and locked-object inspection still work.
- Screenshots from desktop Chromium/Firefox, iPhone WebKit and 360px Chromium and both reference PDF pages were reviewed. Standard-font PDF text was also checked with MuPDF after local Poppler substitution showed incorrect spacing.
- Public HTML is **735,456 bytes**, SHA-256 **d683284d28cb618e43ffeee6aec234ea152d9a460b6723cb48735bf72fd32d04**, matching downloaded release/hash metadata and the tested build. Vercel release deployment succeeds. Live independent Tab edits, pending label Undo/Redo and exact endpoint readings pass. See HANDOFF for the durable screenshot and release details.


## Workspace audit findings — 2026-09-22 (plan only)

At main 3498b5c, fresh npm ci/build/test passes 1,272 checks; exact-main CI 35729723993 / browser job 106752152285 passes 112 checks, zero retries. Public live benchmarks pass 21/21 and the 4.1.2 artifact hash is unchanged. No new application or test implementation was made in the audit.

Green baseline coverage misses confirmed cases now listed in [the audit plan](UX_AUDIT_AND_PLAN_2026_09_22.md): persisted prediction masks outside Learn; different Build entry paths; academic-level coupling; ordinary-inspector pointer obstruction; Practice/Exam answer leakage via worked solutions/verification; and incorrect coincident-action wording in contextual Show Why. Implement the plan's regression matrix before claiming these faults are repaired. Preserve all existing numerical, focus, annotation, PDF and model-restoration assertions. Phone screenshots from the released artifact were reviewed; do not report that as a fresh physical-phone interaction test.

Account B subsequently reported active-exam Undo changing the question beam; Account A confirmed direct unguarded history actions in source. Add the plan's fixed-question mutation-policy checks for toolbar, keyboard, history and pending-edit routes. This addition is a planned regression, not a test already added or passed.


## 4.1.3 activity-policy and interaction coverage — 2026-09-23

- Functional candidate `3ca8691d54353d48681dc798034b264c250a103e`: fresh `npm ci` and `npm test` (including build) pass **1,294 numerical/behaviour checks**, zero failures/skips. Shared policy/explanation coverage adds 22 checks to 4.1.2. No solver, tolerance, sign, schema or grading-algorithm changes.
- Preserve the expanded 136-check browser suite across the existing four projects. It exercises saved Practice preferences in Build, advanced analysis after first-year Learn, answer visibility across working/comparison/tutor/exports, exam model locks, original model/history/comparison restoration, invalid lesson rollback, explicit exploration/restart, and completed-question evidence.
- Retain real pointer Undo/Redo with a selected-object editor at 360px. The old mobile fixed-position selector must not override the reserved editor layout.
- Retain the real label double click after lesson Previous/Next. Scroll into view, then compare label bounds at the two actual pointerdown events; both must hit the same editable value and stay within 1px. Assert that only the compact editor opens. Hovering a label must not reflow the trace readout and move the click target. Plot/beam inspection and active dragging remain available.
- Tested release artifact **10750015323**, run **35859656037**, is byte-identical to the local build: HTML **746,563 bytes**, SHA-256 **d407fb18e0deec8befb910d832cb7c582ae0d8399d4c8625194ed8da4b373533**. Release/hash metadata also match. This is build evidence, not a production claim.
- Candidate 3ca8691 browser run 35859656037 reports 135/136 passed. The remaining added WebKit geometry assertion was scoped to the two actual presses after its screenshot confirmed the compact editor opened. Final browser and deployment outcomes are recorded below after execution.

# BeamLab AI Session Log

This file is append-only. Do not erase older sessions merely to make the document shorter.

Each substantial session should record:

- account identity;
- starting checkpoint;
- ending functional commit;
- objective;
- work completed;
- important files/systems changed;
- testing performed;
- deployment state;
- remaining work;
- decisions or discoveries the other account must know.

---

## 2026-09-20 — Account A — Shared handoff system bootstrap

### Starting code checkpoint

`f83e3af32e233f2c5cbd1d16d6bac8bf064cf9a3`

### Objective

Create a repository-based shared memory system so Account A and Account B can alternate BeamLab development without relying on access to each other's ChatGPT conversation history.

### Repository state observed

- Default branch: `main`
- Package version: `4.1.0`
- GitHub is canonical.
- Public site documented by the repository: https://beam-lab-studio.vercel.app/
- Current package scripts:
  - `npm run build`
  - `npm test`
  - `npm run test:browser`
- Node requirement: 24 or later.

### Baseline release information

The latest code checkpoint before this documentation-only setup is the BeamLab Studio 4.1 release commit.

That release records:

- Build → Analyse → Learn → Review;
- one deterministic Euler–Bernoulli solver across learning levels;
- stepped section/EI handling;
- support settlement and prescribed fixed-support rotation;
- local fibre stress inspection;
- moving-load corrections;
- learning-progress transfer;
- review/export improvements;
- restored historical regression suites;
- desktop/mobile browser journeys.

The release commit states that 1,255 numerical/behaviour checks and 56 browser journeys were verified at the release candidate.

### User-priority direction carried into the shared context

The user wants the next UX work to concentrate on:

- clear Build/Explore vs Learn usage;
- no learning gate for experienced users;
- proper mathematical notation;
- elimination of overlapping values/labels;
- easier lesson navigation;
- a more coherent overall workspace;
- a much stronger Show Why experience based on engineering reasoning.

### Documentation created

- `docs/ai/PROJECT_CONTEXT.md`
- `docs/ai/HANDOFF.md`
- `docs/ai/SESSION_LOG.md`
- `docs/ai/DECISIONS.md`
- `docs/ai/TESTING.md`

### Engineering code changed

None. This session only establishes coordination documentation.

### Testing

No engineering tests were required for the documentation-only bootstrap. The next development session should establish its own current baseline using `docs/ai/TESTING.md`.

### Deployment

Not asserted. A docs commit reaching GitHub does not by itself prove production is updated.

### Next action

Account B can now be connected to the same repository, given its project-level operating instructions, and told to reconstruct current state from GitHub plus `docs/ai/` before changing code.

---

## 2026-09-20 — Account B — Recovery audit and direct engineering entry

### Starting checkpoint and recovery evidence

- Main/default branch was `08cf047d819c6b3563de95727ceea3e9b86fd7e3`; fetched again before implementation. No post-handoff Account A engineering commits existed. The parent engineering release was `f83e3af32e233f2c5cbd1d16d6bac8bf064cf9a3`.
- Read all five AI documents, source, build/deployment configuration, current and legacy tests, relevant release diffs and recent history. The 15 non-main branches were historical squash-merged work, not unintegrated new development. No open PRs were found at takeover.
- Baseline: `npm ci`, `npm run build`, and `npm test` passed locally (1,255 checks). GitHub Actions run 35497041924 verified the same checkpoint with 56 browser journeys across four projects.
- Public HTML, release metadata and SHA256 matched the local deterministic artifact: `40e454353cf8eb8d93169304426aff65212078f8468bd8af35c3aa47d49eda72`. Tutor health correctly reported unconfigured. No claim of live interactive browser testing was made.
- Local browser installation failed (OS dependency-install permissions, then CDN timeouts/corrupt responses). Do not weaken browser coverage to compensate; use the existing GitHub Actions jobs and inspect their evidence.
- The user approved implementation after the audit. Their attached Account A conversation screenshot was only 296 × 2048 pixels; detailed text could not be reliably recovered. The explicitly supplied and repository-recorded priorities remain authoritative.

### Scoped implementation checkpoint (validation in progress)

Branch: `feature/direct-explore-learning-navigation`.

- Remove forced level-choice entry. Default new users to all tools with the simple 6 m / 20 kN beam; retain existing saved preferences/models.
- Provide separate Build / Explore and Guided learning entry links, compact optional tool preferences outside Learn, and direct Analyse → Review navigation.
- Focus an individual lesson/challenge instead of leaving its entire catalogue above it. Add Previous, Next, activity position and return-to-list controls without changing completion/evidence logic.
- Discovered that standalone tasks previously replaced/autosaved over the working model, unlike full sessions. Preserve the original model, undo/redo, comparison and view while standalone examples are open; restore on return/navigation. Browser reload retains the original persisted model.
- Engineering engine, numerical tolerances, question grading, adaptive planning and bounded learning-evidence algorithms are unchanged.
- Numerical and browser regression additions are being validated. This checkpoint is not a production-release claim; append final results and deployment verification below before handoff.

---

## 2026-09-20 — Account A — Recovery takeover and targeted fixes

**STATUS: audit complete / fixes implemented / validation pending**

- Objective: recover Account B's interrupted update from GitHub, audit it, and fix confirmed faults on its existing feature branch without modifying main.
- Starting implementation: `799fae5f4564ff0f4fd3efb47b00e58f47c9e48c`; main observed at `08cf047d819c6b3563de95727ceea3e9b86fd7e3`. No newer Account B commits. Draft PR #16 open/unmerged. Fetched all 17 branch refs; inspected recent PRs and actual source/test/doc diff.
- Read all five shared AI documents completely. The handoff was truthful about being incomplete but lacked the completed CI results and the crash-safe procedure now required by the user. Uncommitted stale Account A work in the older local checkout was left isolated and was not incorporated; the recovery uses a clean worktree at Account B's exact commit.
- Fresh baseline commands: `npm ci`, `npm run build`, `npm test` — passed, **1,258 tests**, none failed/skipped. Candidate HTML SHA-256 `4740778170f27e9939f41554bddec872d76aa9cacafd3b07b76a43243d20078d`, 723,331 bytes.
- Read exact-head CI logs: PR run 35499219786 and push run 35499186533 succeeded. PR browser job 106047871847 ran `npm run test:browser`: **76 passed (2.5m)**, four browser/viewport projects, retries disabled. Downloaded artifact 10601013685 and reviewed mobile/direct-entry/focused-lesson screenshots. Browser automation is run through GitHub CI; hosted manual inspection uses the supported browser runtime.
- Hosted preview confirms direct entry without a level modal, full tools, optional Learn, Previous/Next/catalogue navigation, original 8 m model restoration, working Undo/Redo and comparison restoration. Reload restores the saved beam and keeps independent learning evidence.
- Confirmed faults: notice incorrectly promised history through reload; explicit saved-study opening inside a lesson reverted to the original beam when leaving Learn. Source shows the same lifecycle problem for shared-snapshot and JSON import routes.
- Fixes: central explicit-study-opening lifecycle after successful parse; restore the engineering origin before replacement, leave the temporary activity and allow Undo to the original. Invalid files do not discard an activity. Full active/review sessions retain their navigation guard. Correct reload notice; suppress transient example toasts during standalone lessons/challenges. Add browser coverage for all three opening paths and strengthen undo/redo/comparison assertions.
- Files changed by recovery: `src/studio/app.js`, `src/studio/panels.js`, `tests/browser/studio.spec.js`, shared AI documentation. No solver, sign, tolerance, grading or adaptive/evidence algorithm changes.
- Production independently verified unchanged at 4.1.0 / 716,078-byte HTML / `40e454353cf8eb8d93169304426aff65212078f8468bd8af35c3aa47d49eda72`; public homepage still says Open BeamLab, not Build / Explore.
- Audit recommendation for Account B's original checkpoint: **B — fix the branch before merge**. The broader notation/diagram-label/Show Why work remains separate and unfinished. Phone lesson pages still have extensive secondary settings beneath the task.
- Crash-safe practice: PR status updated during audit; coherent implementation and this record must be pushed before new long-running browser validation. Append actual outcomes after checks finish. Do not infer a credits warning will arrive.

---

## 2026-09-20 — Account B — Return audit and numeric-edit history recovery

**STATUS: audit complete / repair starting / not merged or deployed**

- Active account: Account B. Starting commit: `1cf371d0bf17a72d42c45a031d4fecf1c72b9923`. Remote feature branch: `feature/direct-explore-learning-navigation`; existing draft PR #16. Main remains `08cf047d819c6b3563de95727ceea3e9b86fd7e3`.
- Re-fetched GitHub, read every shared AI document and Account A's post-B entry, inspected actual recovery/source/test diffs, PRs, branch refs and exact-head CI. Account A added only `1cf371d` after `799fae5`, with no merge or subsequent pushed feature work. Stale local working changes remain isolated and are not incorporated.
- Fresh `npm ci`, `npm run build`, `npm test` pass in clean checkouts: main 1,255 checks; recovery branch 1,258; zero failed/skipped. Main CI run 35497041924 has 56 passing browser checks. Recovery PR run 35506822163 and push run 35506820228 each have 84 passed / 4 failed out of 88. Downloaded and inspected browser screenshots/failure context; all twelve explicit-opening checks pass.
- Reproduced the existing Undo defect directly on production: edit length 6 -> 8 -> 9 using Tab; diagrams change but Undo remains disabled and edit count remains zero. Returned the audit model to 6 m. Source focusout handling intentionally defers transactions to protect Firefox pointer clicks, but keyboard focus movement to the example selector never completes the edit.
- Public production HTML matches main's deterministic build (`40e454353cf8eb8d93169304426aff65212078f8468bd8af35c3aa47d49eda72`, 716,078 bytes), and tutor health reports unconfigured. Account B could not access the protected feature preview; no preview access or release is claimed.
- User received the read-only return audit and approved fixing numeric-edit history, completing validation, merging when coherent and verifying production. Preserve Account A's model-opening fixes, optional Learn entry, model/progress separation and the unchanged solver/tolerances. Record this starting checkpoint before implementation and append results progressively.

### Implementation checkpoint — validation pending

- Published the starting record as `b13ecae` and updated draft PR #16. Shell Git pushes lack authentication in this environment; use the connected GitHub Git-object API with an existing base tree and parent, then a non-forced fast-forward ref update. Read-only Git fetch works. No credentials are copied into the repository or exposed.
- Fixed the keyboard path in `src/studio/app.js`: after native Tab/Shift+Tab, finish the field transaction and restore its semantic focus destination across the redraw. This gives successive edits separate history entries and persists them immediately. Keep pointer focusout deferral so Firefox cannot lose the pressed control.
- Updated existing Undo/Redo buttons in place during input: a first valid pending edit enables Undo, and a pending change disables stale Redo. Invalid/unchanged drafts do not create edits. The ordinary finish path still restores the committed model after invalid input.
- Added two focused browser journeys covering keyboard focus, two independently saved edits, Undo/Redo/reload, immediate first-edit Undo, and valid-then-invalid Tab rollback. Preserved the original four failing checks and both pressed-navigation regressions without weakening assertions. Expected suite size is now 96 project checks; actual results still pending.
- `git diff --check` and JavaScript syntax checks passed. This implementation and record are checkpointed before the full numerical/build/browser validation. No solver, units, signs, tolerances or Account A model-opening lifecycle changes.

---

## 2026-09-21 — Account A — Complete numeric-edit validation and scoped release

**STATUS: resumed audit complete / Firefox focus investigation / not merged or deployed**

- Starting commit `282fda3385b10aede173be09a5f2aab555edfe46`; working branch `feature/direct-explore-learning-navigation`; draft PR #16. Main remains `08cf047d819c6b3563de95727ceea3e9b86fd7e3` after fetching every branch ref. Account B added `b13ecae` and `282fda3` after Account A's prior checkpoint. Read all shared records and actual code/test diffs.
- Exact-head PR CI run 35512885378 and push run 35512883719 failed. PR regression job succeeds; browser job 106083830211 reports 95 passed and 1 failed out of 96. All previous lesson/history failures, explicit-study openings and Firefox pressed-control regressions pass. The remaining check concerns Shift+Tab focus in Firefox, after successful independent edit persistence and Undo/Redo checks.
- Objective: diagnose the trace, repair the focused issue without weakening assertions or numerical tolerances, inspect desktop/mobile evidence, merge the validated scoped update and verify production independently. This starting record is pushed before long tests; stale local work remains isolated.

### Firefox trace resolution

- Starting status record pushed as `58f0a36`. Downloaded exact-source artifact 10606148121 from PR run 35512885378 and inspected failure screenshot/trace. The focus outline surrounds `#controls`, a native keyboard-focusable scroll container in Firefox. This is the legitimate previous tab stop, so the test's expectation of Studies was incorrect; runtime edit/history handling is working.
- Corrected only that browser-specific focus expectation and added an assertion that another Shift+Tab reaches Studies. All numerical, history, persistence, invalid-input and pointer-click assertions remain. No retries introduced. No runtime source change for this diagnosis.
- Fresh local `npm ci`, `npm run build`, `npm test` pass at Account B's source (1,258/1,258, zero failures/skips). Build: 725,924 bytes, SHA-256 `42f866b1f4fc2b251dec8f179880b1ceff893f2d131b23f7237fc1608f4f5e09`. The corrected 96-check browser suite is checkpointed before execution in CI.
- Preparing a distinct 4.1.1 release identity across package, HTML, audit and tutor responses. Only release-identity expectations change in existing tests; numerical assertions/tolerances remain untouched. Keep the BL410 model fingerprint namespace for reference compatibility. Added `docs/RELEASE_4_1_1.md`; validation pending. Desktop/mobile CI screenshots show usable focused navigation; long lesson pages and the known trace-label overlap remain explicitly deferred.
- Candidate `819fdc3` build succeeded; one remaining title assertion still expected the old 4.1 title, so local tests/CI stopped at 1,257 passed / 1 failed before browser execution. Updated that exact title expectation to 4.1.1; no behaviour or numerical assertion changed. Preview is accessible in Account A's browser, currently still serving the last successful 4.1 candidate until the new gate passes.

### Validated release checkpoint — ready for merge

- Implementation HEAD `c785fae2244144874aa0093ef854232ca29d8c08`. Fresh local install/build/test: 1,258 passed, zero failed/skipped. Exact-head PR run **35554612907** passes numerical and browser jobs: **96 browser checks passed (2.4m)** with zero retries. All former failures pass; no review threads or outstanding reviews exist. Browser artifact 10619947656 and release artifact 10619223354 preserve evidence.
- Hosted 4.1.1 preview: direct entry with full tools and no gate; 6→8→9 m independent Tab edits; Undo to 8; lesson Previous/Next/catalogue; restoration of beam, Redo and comparison; Redo to 9; reload during a temporary lesson restores saved 9 m with Undo reset; invalid 0 m input rolls back to 9; Review shows 6/6 consistency checks. Inspected desktop and mobile layouts. No wider UI-completion claim.
- Candidate HTML: 725,972 bytes, SHA-256 `6dbd2d3e2ac5d20baf8f749c205b8cce7bf99ba89b8575d8abce26913fa9de40`; package/audit/tutor identity 4.1.1. Diff against main confirms engine, model, lesson/challenge algorithms and numerical tolerances unchanged.
- Production re-fetched separately before merge: still 4.1.0 / 716,078 bytes / `40e454353cf8eb8d93169304426aff65212078f8468bd8af35c3aa47d49eda72`, matching public metadata. Next: merge this scoped validated release and verify the actual public artifact and journeys before claiming it is live.

---

## 2026-09-21 — Account B — Reconcile Account A's release and verify production

**STATUS: merged release confirmed / production verification in progress**

- Starting main: `9cf86ef570ecb4895ec071c2a497b80ecb636d6a`. Dedicated documentation branch: `docs/release-4-1-1-verification`. The user supplied Account A's intervening work and Account B re-fetched GitHub before continuing; no old branch/source was restored.
- Since Account B implementation `282fda3`, Account A committed `58f0a36` (recovery status), `819fdc3` (Firefox native scroll-container focus expectation and 4.1.1 identity), `c785fae` (remaining release assertions) and `f99d393` (validation record). Inspected their source/test/documentation diffs. Native Firefox focus is legitimate; the additional Shift+Tab-to-Studies assertion preserves keyboard coverage. The 1,258 numerical checks and existing numerical tolerances are unchanged.
- PR #16 was merged by Account A at 02:47:29 UTC into `9cf86ef`. Its final head `f99d393` has successful PR run 35555016024 and push run 35555013620. Main run 35555337390 succeeded. Vercel's commit status reports success at deployment `8etk39bNeFJ5jt3LhQ3GyYTnuhs7`; actual public artifact and interactions are being verified separately.
- Existing HANDOFF and release notes still describe a candidate awaiting merge. This checkpoint corrects the known merge state immediately; final public evidence and the next scoped recommendation will follow. No application source changes are part of this documentation update.

### Production verification completed

- Published initial status as `40a260fb588cf83430edafbcace08fb4f48aa50a` and opened draft PR #17 before extended verification. Its first CI run 35555846135 passed. This follow-up changes shared documentation and release notes only; the application, tests and release artifact are unchanged.
- Fresh `npm ci`, `npm run build` and `npm test` on merged 4.1.1 passed: **1,258 numerical/behaviour checks**, zero failed/skipped. Main run **35555337390** passed; browser job **106197820962** records **96 passed (3.5m)** with zero retries in all four configured projects. Final feature PR/push runs 35555016024 / 35555013620 also passed. Account B inspected CI execution and did not run or claim a local browser suite.
- Downloaded release-main browser evidence artifact 10620013758 and inspected focused-lesson screenshots on desktop and 360px mobile. Longer mobile lesson pages remain a known follow-up. Release artifact 10620140121 retains the build evidence.
- Public HTML is **725,972 bytes**, SHA-256 **6dbd2d3e2ac5d20baf8f749c205b8cce7bf99ba89b8575d8abce26913fa9de40**, matching the fresh local build and public `release.json` / `SHA256.txt`. Vercel reports successful release deployment `8etk39bNeFJ5jt3LhQ3GyYTnuhs7`. Public UI and `/api/tutor` identify 4.1.1; the tutor correctly reports `configured:false`.
- Real public browser checks: direct Build / Explore with All Tools and no modal; first valid edit immediately enables Undo; independent 6 → 8 → 9 m Tab edits; Undo to 8; comparison freeze; lesson Previous/Next and return to catalogue restore the 8 m beam, Undo/Redo and comparison; Redo returns 9; reload during a fixed-ended example restores the saved 9 m centre-load model with history/comparison reset; invalid 0 m rolls back without adding history; Review reports 6/6 consistency checks. Restored the temporary verification model to its initial 6 m state and captured the verified public workspace.
- Replaced the stale HANDOFF snapshot with released-state evidence, accurate architecture safeguards and exact next-task guidance; retained every earlier SESSION_LOG entry. Updated RELEASE_4_1_1 and TESTING to distinguish historical candidate results from released-main/public verification. PROJECT_CONTEXT and durable DECISIONS need no changes.
- Outcome: Account A's recovery is merged and production is independently verified. No application implementation was restored from stale Account B work, and no numerical tolerances or Firefox safeguards were weakened. PR #17 tracks final documentation CI and merge; its merge may advance main beyond the release-code SHA without changing the artifact.
- Next recommended update: a dedicated, scoped investigation/fix for overlapping critical-value and inspection labels in diagrams, with crowded-support/load fixtures and desktop/mobile visual coverage. Mathematical presentation, shorter mobile lesson pages and deeper deterministic Show Why remain separate follow-ups.

---

## 2026-09-21 — Account B — Diagram annotation readability

**STATUS: investigation starting / no application changes / not deployed**

- User authorised the next scoped update after the 4.1.1 recovery and production verification. Account B fetched GitHub again: main remains `1c74ef4576d014a93ce203affa67826d89243ca6`, no open PRs or newer feature work. Old feature branches are historical; no interrupted local work is restored.
- Dedicated branch: `feature/diagram-annotation-layout`, starting at that exact main commit in a clean worktree. This initial handoff/session checkpoint precedes implementation and long validation; a draft PR will serve as the live record.
- Objective: investigate overlapping critical-value/inspection annotations and crowded structural labels, then make a bounded desktop/mobile layout repair. Preserve the single solver, numerical tolerances, displayed engineering values, Undo/Redo, native Firefox interaction and model preservation through learning.
- Starting release evidence: 1,258 numerical/behaviour checks and 96 browser checks passed; public 4.1.1 was verified in the preceding session. Current-update validation is pending. Broader mathematical presentation, mobile lesson layout and deeper deterministic Show Why remain separate tasks.

---

## 2026-09-21 — Account A — Continue scoped diagram readability update

**STATUS: recovery inspection complete / baseline validation and collision investigation / not deployed**

- Fetched current GitHub state and inspected actual diffs. Main is `1c74ef4576d014a93ce203affa67826d89243ca6`; Account B's branch is `feature/diagram-annotation-layout` at `adf45cec45b3cdec450c61be2d20c54406365af3`, with open draft PR #18. The branch contains HANDOFF/SESSION_LOG changes only, not a published rendering implementation. Stale local work remains isolated.
- Read PROJECT_CONTEXT, HANDOFF, SESSION_LOG, DECISIONS and TESTING completely. Account B completed the 4.1.1 release verification; the former navigation branch is merged history. Exact starting-head PR CI 35564542665 and push CI 35564338368 report success; fresh local baseline and detailed browser evidence are next.
- Implementation checklist: shared collision-aware diagram annotations, dedicated inspection-value placement, crowded structure-label spacing, unchanged engineering values and direct manipulation. Keep mathematical presentation, broader lesson layout and deeper Show Why out of this scoped repair.
- Validation checklist: install/build/current regressions first; add deterministic layout and browser overlap checks; inspect actual desktop/mobile diagrams and export behaviour; checkpoint before long tests; merge only after adequate validation and verify production separately.
- This takeover record is pushed before implementation/long validation. No solver, numerical tolerance, sign, unit, model lifecycle or production change.

### Collision repair checkpoint — full validation pending

- Initial Account A record pushed as `b957c09`. Fresh `npm ci`, build and current tests passed: 1,258 Node checks, zero failed/skipped. Build matches released 4.1.1 hash. Starting-head browser job 106223683060 from PR run 35564542665 records 96 passed with zero retries.
- Hosted preview reproduces the reported overlap: fixed-end critical `-41.67` and inspected `-41.667` occupy intersecting text rectangles at x=0. Code used fixed-width spacing for critical labels, unrelated cursor placement and fixed support-label baselines.
- Added pure `studio/annotation-layout` for bounded wrapping, deterministic collision-free callout slots, explicit overflow rows and stacked structure notes. Critical sample selection/values and solver remain unchanged. Load lanes use actual label extents and current zoom; full names/values wrap instead of clipping. Support movements, reactions, hinges and region notes share separate annotation rows and leaders. Inline magnitude editing and direct object manipulation remain wired.
- Inspection values now live in a separate, wrapping per-diagram readout, including left/right discontinuity values. The cursor stays at the exact sampled coordinate and hides when outside a zoomed view; its readout explicitly says so. Practice hiding and clean/guided/detailed controls remain.
- Added 14 focused production-bundle Node checks (all pass) and three browser journeys across four projects (108 total checks listed): endpoint reference/collision, crowded supports and inline-edit Undo, detailed hinges/zoom/export. Syntax and diff whitespace checks pass. Full suite and hosted visual review are pending; this coherent checkpoint is pushed first.

---

## 2026-09-22 — Account B — Recover Account A's annotation implementation

**STATUS: source/CI audit complete / targeted repair investigation / draft, not deployed**

- User supplied Account A's intervening progress. Re-fetched GitHub: main remains `1c74ef4576d014a93ce203affa67826d89243ca6`; draft PR #18 is at `e155a9182e0ede0994f56183e7b3baa3f3c1f44b`. Account A added only `b957c09` and `e155a91` after the original Account B record; its later described endpoint correction and Undo investigation are not committed. Continue on `feature/diagram-annotation-layout`, retaining the newer source and tests.
- Inspected actual layout, renderer, app, CSS, module-order, fixture and regression changes plus shared records. The solver and numerical tolerances are unchanged. The implementation separates inspection values from fixed annotations, wraps and stacks structure/load notes, and allocates bounded critical callouts with overflow rows.
- Exact-head PR run `35622848288`: regression succeeds; browser job `106409964088` reports **99 passed / 9 failed** out of 108. Four endpoint checks wrongly expect `M⁺` although the continuous fixed-end value is correctly `M -41.667`; four PDF assertions observe three pages instead of two; one desktop lesson/history test reaches disabled Undo where a second prior edit is expected. All four crowded-label inline-edit Undo checks pass, so the separately reported manual Undo issue needs reproduction rather than an assumed fix.
- Immediate plan: retain Account A's layout repair, correct only the independently justified endpoint expectation, investigate history and report pagination, inspect desktop/mobile evidence, then push coherent fixes before full validation. The current handoff now records actual failures instead of pending execution. No production readiness claim.

### Account B — 2026-09-22, annotation recovery implementation checkpoint

Continued PR #18 from `43a80450e284c4bbee39e75e57d6209751f1c487`, retaining Account A's annotation allocator and all solver behaviour. Fresh dependency installation and inherited Node baseline passed (1,272 checks). No newer remote work appeared on fetch.

Investigated the public-site Undo report: the selected-object inspector physically covered the toolbar at laptop width. Keyboard Undo and pointer Undo after Deselect correctly restored the model. An initial impression that the pending value had reappeared was not supported; do not document this as a numerical/history-engine defect. Direct label editing now hides the competing inspector, and Undo/Redo dismiss obsolete inline fields. The general floating inspector remains available for ordinary object selection.

The separate intermittent lesson/history failure can arise when a second input reaches the same field before its deferred Tab commit. Split an already-tabbed transaction before processing the next edit; retain native focus restoration and Firefox pointer-target deferral. Added a paused-clock browser journey, and strengthened the lesson assertion to verify the initial Undo really restores 8 m.

Corrected the endpoint expectation from `M⁺` to `M`, preserving the analytical -41.667 kN·m value and solver. PDF grouping now uses the actual 511 × 655 point figure budget including top padding, rather than the arbitrary old 990 SVG-unit cutoff. Annotation text keeps its measured font size during PDF export. The existing two-page reference-report assertion remains intact.

Syntax and whitespace checks pass. This coherent checkpoint is being published before full validation. Expected browser suite size is 112; passing results are not yet claimed. Production remains 4.1.1; PR #18 remains draft.

---

## 2026-09-22 — Account A — Complete Account B's annotation recovery

**STATUS: current-source audit / two mobile editing failures / draft, not deployed**

- Starting head `b8f5a1a47aeb82cae6a728188deeedef1a459e48`; branch `feature/diagram-annotation-layout`, draft PR #18. Main remains `1c74ef4576d014a93ce203affa67826d89243ca6`. Explicitly refreshed remote branch refs and created a clean worktree; previous unpushed experiments remain isolated.
- Inspected Account B's actual commits `43a8045` and `b8f5a1a`: compact editor replaces competing inspector; Undo/Redo close stale fields; already-tabbed same-field edits commit separately; PDF grouping uses real page budget and retains annotation font sizes. The solver, numerical tolerances and model lifecycle remain unchanged.
- Exact-head push run `35676434764` has a successful numerical job and **110 passed / 2 failed** browser checks. Both failures time out opening the inline magnitude field for a second edit after Undo on mobile WebKit and 360px Chromium. PDF, independent endpoint and delayed-Tab checks pass. The exact-head PR run is still running at takeover.
- Implementation checklist: identify the mobile event sequence, fix the confirmed cause while retaining Account B's changes, keep label/direct-manipulation semantics and save coherent checkpoints. Validation checklist: fresh install/build/Node baseline, unchanged browser checks plus any focused regressions, desktop/mobile visual evidence, final exact-commit CI and independent public artifact verification. No merge until adequately validated.

### Mobile editor diagnosis and repair

- Takeover checkpoint pushed as `5ce1e0f`. Fresh `npm ci`, build and test pass: **1,272 Node checks**, zero failed/skipped. Account B's candidate artifact was 734,944 bytes / SHA-256 `8a4e86937ee8bf5f9039bd5d8b3ce6fc767b76cd70395e5b9161d07f7d3002b7`.
- Downloaded exact-head browser evidence artifact `10672977360` and inspected both mobile failure screenshots and event traces. The first pointer press reopens the floating inspector over the target label, so the second press hits the inspector instead of completing the label double tap. This is a real obstruction; do not add waits, retry clicks or remove the existing reopening/Undo assertions.
- Keep the full inspector closed for presses on editable load labels, while retaining it for object-body selection. Respect that state during the immediate drag/selection redraw. Account B's compact editor, pending-edit Undo/Redo cleanup, Tab race repair and PDF grouping remain intact. Existing failed browser journeys validate this precise sequence.
- Syntax/diff checks pass. This focused source checkpoint precedes the full browser run; no readiness or production claim yet.

### 4.1.2 release-candidate preparation

- Mobile pointer fix pushed as `2a8d052`; full local Node suite still passes 1,272 checks. Its 112-check browser CI is running without test weakening or retries.
- Reviewed actual phone endpoint and detailed-hinge screenshots from Account B's evidence. They exposed critical-point dots overlaying position text even though text boxes did not overlap each other. Reserve a 5 px clearance around exact critical coordinates and strengthen both pure-layout and browser geometry assertions; never move the underlying points or alter values.
- Preparing explicit 4.1.2 identity in package/build/audit/tutor outputs and matching release-identity assertions, retaining BL410 fingerprints and all numerical expectations. Added RELEASE_4_1_2 and README changes. Final candidate numerical/browser execution and hosted/public verification remain pending.
- Exact mobile-fix PR run `35677161432` is green: browser job `106586018776` passes all **112** checks; the two mobile reopening failures are resolved with existing assertions intact. Hosted preview confirms pending inline-edit Undo closes the editor, reopening works, and Redo restores the newly entered load.
- Fresh final-candidate Node suite passes **1,272/1,272** with zero failed/skipped. During version preparation one old escaped-title expectation still referenced 4.1.1; corrected that identity-only assertion and reran successfully. Candidate HTML: **735,456 bytes**, SHA-256 `d683284d28cb618e43ffeee6aec234ea152d9a460b6723cb48735bf72fd32d04`. Final 112-check browser execution with the strengthened critical-point clearance check is next.

### Final candidate identity check and retained export evidence

- Candidate `78c1726` PR run `35677895924` completes with **108/112 passed**. All annotation/marker, editing, PDF and learning journeys pass; all four failures are the same stale issue-report regex expecting 4.1.1 while the correct payload identifies 4.1.2. Correct that version-only expectation; no application or numerical change.
- Preserve the existing PDF output in each browser test's artifact directory for visual review. Hosted preview displays 4.1.2 and independent fixed-end values correctly, but the cloud download bridge did not deliver the generated PDF. CI download/page-count/numerical assertions pass; use its retained file to inspect pagination and labels.
- Reconciled HANDOFF into one current snapshot, retaining historical run details in this append-only log. Application bytes/hash remain unchanged. Push this coherent test/documentation checkpoint before the final browser rerun; production remains 4.1.1.

### Final release and public verification — Account A, 2026-09-22

**STATUS: 4.1.2 merged / public build and interactions verified.**

- Final checkpoint `2ab5003e430ee54956c15b3bc090e95d5c2040fc` passes exact PR run `35727547909` and push run `35727543390`. Node checks: **1,272 passed**, zero failed/skipped. Browser job `106744894705`: **112 passed (3.1m)**, zero retries.
- Downloaded browser artifact `10694401811`. Inspected desktop/mobile endpoint, hinge and crowded-support screenshots and rendered both pages of its reference PDF. A local Poppler standard-font substitution problem was checked with MuPDF, whose correct text rendering confirms the application report layout is intact. CI retains all four reference PDFs. The cloud browser download bridge timeout was not treated as an application export failure.
- Marked PR #18 ready only after source, tests and visual review; merged using expected feature SHA. Release commit **`e6d4585a648bd624d1db41dc3d7e60037c448b4b`**. Application/test source matches the validated feature head exactly.
- Created verification branch `docs/release-4-1-2-verification` from that release. Account A objective: reconcile durable release records and screenshot; documentation/evidence only.
- Vercel deployment `5DAvxyLvQRY78GXdK2a8412zYnjb` succeeds. Downloaded public HTML (735,456 bytes), release.json and SHA256.txt all match **d683284d28cb618e43ffeee6aec234ea152d9a460b6723cb48735bf72fd32d04**. Public UI and tutor health identify **4.1.2**; tutor remains `configured:false`.
- Public interaction: 6 → 8 → 9 m edits via Tab undo independently to 8 and 6; pending inline edit Undo closes its field; editor can reopen; Redo restores 29 kN; Undo restores 20 kN. Fixed-end reference inspection reports −41.667 kN·m at x=0 and separated critical labels. Saved a public screenshot and restored the original 6 m / 20 kN verification beam.
- Updated HANDOFF, TESTING and release notes with actual results; retained historical failures and broader Show Why/math/mobile-learning follow-ups. Main release CI is linked in HANDOFF; verification documentation will go through its own PR gate. No new application change.


## 2026-09-22 — Account A — Workspace UX audit and plan checkpoint

STATUS: audit in progress / no application implementation. Starting main `3498b5c31d94af3007e20c0de80cd4fafef5b1a4`; documentation branch `docs/workspace-ux-audit-plan`; early draft PR #20. User asks for inspection and an in-depth shareable plan before changes.

Fresh installation/build/Node suite passes 1,272 checks. Exact-main CI run 35729723993 / browser job 106752152285 records 112 passed with zero retries. Public HTML and metadata match local build at d683284d28cb618e43ffeee6aec234ea152d9a460b6723cb48735bf72fd32d04 (735,456 bytes, 4.1.2).

Live reproduction confirms global Practice masking in Build and after reload; inconsistent header/workspace Build behaviour; hidden answers appearing in Show Why and worked solutions; ordinary selected-object inspector covering toolbar controls; learning-level tool restrictions leaking back into direct engineering use; and an edited lesson silently returning to the catalogue while its temporary masked example remains. Lesson navigation and original beam/history/comparison restoration work in the checked journeys. Phone layout evidence reviewed from the released 4.1.2 CI artifact; no fresh manual phone session is claimed. Findings and proposed fixes will be completed in UX_AUDIT_AND_PLAN_2026_09_22.md. No solver, application source, test tolerance, main or deployment change.

## 2026-09-22 — Account B — Complete the interrupted workspace audit plan

STATUS: recovery complete / detailed plan being completed / no application changes.

Starting main `3498b5c31d94af3007e20c0de80cd4fafef5b1a4`; audit branch `docs/workspace-ux-audit-plan`, head `e82d59a2a223e19b9e5d861b690644429b145cf9`, draft PR #20. Refreshed GitHub rather than continuing the obsolete PR #18 recovery in this chat. PR #18 and release-record PR #19 are merged; source is 4.1.2. Inspected Account A's later mobile pointer fix, marker clearance and release identity changes, plus all shared AI records. These supersede Account B's b8f5a1 checkpoint and must be retained.

The user supplied Account A's longer audit narrative and asked to continue the request for an in-depth plan before implementation. The final detailed plan and audit screenshots described there are not in the current remote branch (only two audit documentation commits exist). Continue and complete that deliverable; distinguish directly reproduced facts, source-supported risks, inherited evidence and proposals. Verify additional exam answer exposure and coincident point/couple explanation before recording them as confirmed. Keep application code, tests and production unchanged during this planning task.


### Workspace audit completed — Account A, 2026-09-22

STATUS: detailed implementation plan ready for user review / docs and evidence only. Draft PR #20 contains UX_AUDIT_AND_PLAN_2026_09_22.md with ranked findings, source causes, proposed interface/state contracts, five delivery increments, affected files and acceptance journeys. Added public screenshots of masked Build diagrams, toolbar obstruction and exam worked answers.

Additional confirmed findings after the checkpoint: active Exam Mode still exposes reaction tables through Show working and numerical extrema through Model checks; source also has an unguarded CSV result path. The contextual explainAt dialog falsely says moment is continuous for a coincident point force and couple. Reproduced directly from the production bundle: 10 m simply supported, 20 kN downward and +30 kN m CCW at x=5 gives correct reactions 13/7 kN, M-left 65, M-right 35, jump -30, while the explanatory sentence is wrong. The same dialog omits generated self-weight from its local intensity selection; this is not a solver failure.

Fresh baseline remains 1,272 Node checks / current-main 112 browser checks, all passing in the executions documented above. Live analytical benchmark panel passes 21/21. Numerical verification and independent 6 m/7 m centre-load references agree. Explicit full-session exit, Focus/Exit focus and Present/End tour restore the study. Audit browser restored to the original named 6 m / 20 kN beam, All Tools, no prediction, no comparison, no active activity. Actual main remains 3498b5c and production remains the identical 4.1.2 artifact. No source/test/tolerance change, merge or deployment was performed.

The remaining work is implementation after user review, with fresh refs and a dedicated feature branch. This audit does not claim exhaustive device or engineering certification. The prior green suite lacks the reproduced state transitions and answer-surface checks; add those without weakening existing assertions.


### Account A / Account B plan reconciliation — 2026-09-22

The user supplied Account B's recovery report while Account A's final plan was being saved. Refreshed PR #20: Account B checkpoint 99b199f is newer than e82d59a; it contains the recovery record but not a published final plan. Preserved that checkpoint and both accounts' history. The completed plan and screenshots are being published as a descendant of the observed Account B head, using a non-forced ref update.

Added Account B's further live finding: Undo can replace the question model during an active exam. Account A confirmed the source path: undo/undo-dialog/redo mutate history directly without the session guard used by commit(). This new live reproduction is attributed to Account B; it was not repeated in Account A's browser after the report. The repair plan now includes a central model-mutation policy, immutable question identity, and toolbar/keyboard/history/pending-edit coverage. Keep application code and production unchanged until the user reviews the completed plan.


## 2026-09-23 — Account A — Start approved engineering/learning repair

STATUS: implementation starting / baseline validation running. User explicitly approved proceeding with the completed plan. Refreshed GitHub: main 3498b5c, only open PR #20 at 45322e7. Exact-head audit CI 35764732666 is successful. Merged approved documentation PR #20 as d4c0479399e6e50582e7ed682c35912ac45f83dc; no application changes. Created dedicated feature/unrestricted-engineering-learning-safety from that new main and a clean local worktree.

Objective: implement the first correctness/state increment, plus the confirmed selected-inspector obstruction; preserve one deterministic solver, all numerical tolerances, edited model/history restoration, direct-label/mobile and Firefox focus fixes. Establish a fresh baseline, add behaviour/explanation regressions, checkpoint before the full browser run, inspect desktop/mobile evidence and actual preview, then merge only validated work and verify public artifact/version. Broader navigation, learning layout and full mathematical presentation follow the approved plan in later increments.

### 2026-09-23 — Account A, first repair implementation checkpoint

- Draft PR #21 saved before implementation; fresh baseline passed 1,272 checks.
- Implemented activity policy, effective tool level, legacy practice migration, output restrictions, session mutation guards/navigation exit, question fingerprints and changed-standalone notice. Preserved solver/grading/model schemas/tolerances and original model restoration.
- Shared deterministic explanation fixes coincident actions and self-weight. Inspector occupies reserved space; label editor remains compact and mutually exclusive.
- Added production-bundle policy/reference tests and four end-to-end browser journeys. Validation pending at this checkpoint; no merge or production release authorized by passing evidence yet.

### 2026-09-23 — Account B — Recover PR #21 validation and unfinished follow-up

- Refreshed all remote refs after the user supplied Account A's implementation progress. Audit PR #20 is now merged at `d4c0479399e6e50582e7ed682c35912ac45f83dc`; draft PR #21 is the active work. Created a clean worktree from feature head `7cac76b9c570e2b4501af08ba9ff4d11cf6e6a68`. Older local audit notes remain isolated and must not overwrite the approved plan.
- Inspected the activity policy, shared explanation module, application transition/mutation/output changes, reserved inspector, and new tests. Exact-head PR run `35796548498` has a successful numerical job and **127/128 browser checks passing**. Job `106977095224` fails only the small-mobile Chromium Undo hit-target assertion while the selected-object editor is open.
- The supplied narrative describes subsequent invalid-lesson-edit/session refinements and 4.1.3 identity preparation; no such later commit is currently on GitHub. Current committed version remains 4.1.2. Recover intended behaviour from current code and add/retain concrete regressions instead of assuming the missing edits shipped.
- Takeover checkpoint precedes fresh local validation and further repairs. No merge or production claim. Vercel commit status reports successful preview; the deployment metadata connector returns not found, so actual artifact/browser evidence remains necessary. Browser artifact download was requested but its returned file URL responds 403 in this environment; this is a retrieval limitation, not an application failure.

### Account B — restore unpushed edge-case intentions

- Takeover pushed as `57b5eac`. Fresh installation and build/Node tests pass **1,294/1,294**, zero failed/skipped.
- Source confirms invalid numerical previews can discard the standalone question before rollback. Delay question invalidation while a numeric or drag transaction is pending; a committed changed reference still receives the explicit exploration/restart notice. Preserve deferred Tab, rollback, storage and origin rules.
- The new Reveal remaining responses action previously added reveal evidence even after the question was correctly completed or already revealed. Keep the existing locked result/evidence when opening extra diagram layers. Removed a duplicate no-op standalone cleanup call in presentation entry.
- Added browser coverage for invalid-preview rollback, valid temporary exploration/restart/original restoration, completed-question evidence stability, and advanced layers after returning from Learn. Kept the mobile hit-target assertion unchanged in meaning and added target/geometry diagnostics plus capture before assertion. Browser validation is pending at this source checkpoint.
- The supported browser reaches a Vercel access-required page for the preview; the connected account lacks this team's deployment access. The authorized Vercel share-link tool also reports no access. No protection settings were changed. Continue code/CI work, but rendered candidate review remains a release gate.


### 2026-09-23 — Account A — Resume Account B’s latest repair checkpoint

Starting head cd572dc, PR #21; main d4c0479. Created a clean worktree and retained B’s rollback/evidence changes. Fresh npm ci and npm test pass 1,294 checks. Exact-head PR CI 35804104092 finishes 130/136 browser checks; six failures described in HANDOFF. Current implementation is not release-ready. The mobile obstruction has a concrete legacy CSS specificity cause. Investigating the Firefox label edit before changing its regression. Older unpushed version/edge refinements are preserved separately and will be reconciled selectively, not copied wholesale. Hosted preview access works in Account A’s browser. No production change or merge.


### Account A — repair checkpoint before full browser validation

Starting recovery record 266d973. Fresh local build/numerical suite passes 1,294. Fixed the legacy fixed-inspector CSS override; precise button selection in B’s new completed-evidence test; remaining stale activity notices, route preservation, comparison masking and missing-fingerprint checks. Kept B’s rollback/evidence repairs and all numerical expectations. Firefox double-tap failure is still under investigation; pointer-event diagnostics are added without removing its assertion. Editor viewport evidence is logged in CI as well as stored as artifacts because artifact download delivery currently returns 403. Full 136-check browser execution follows this coherent source checkpoint. No merge or production change.


### Account A — 4.1.3 release identity checkpoint

Functional repair cf59e7c saved before full CI. Prepared 4.1.3 package/build/audit/tutor identity and matching identity-only assertions; added release notes and README scope. Numerical build/tests pass 1,294. Added regression for keeping Learn selected when changing level during a temporary activity. Hosted current preview confirms that route, invalid rollback, Next/Previous notice cleanup, original 8 m restoration and protected exam exit. Public download independently remains 4.1.2, same 735,456-byte hash as the released baseline. Final candidate CI and phone visual review remain required before merging.


### 2026-09-23 — Account B — Recover 4.1.3 preparation and finish Firefox label targeting

Starting `c2374b4`, main `d4c0479`, draft PR #21. Fetched and reviewed Account A’s three commits since B’s `cd572dc`, including actual source/test diffs. Kept all recovery and release identity changes. Latest exact-head CI is 1,294 numerical checks and 135/136 browser checks; the sole failure is the unchanged real Firefox double-click path. Its event log shows a first press on the underlying object rect, followed by a moved second target. Added visible-label hit resolution before opening the reserved inspector and retained/strengthened the real interaction regression. Restored supported CI artifact delivery via file materialization, inspected the failing screenshot, and removed redundant base64 log output while preserving artifact screenshots. Implementation checkpoint precedes full validation. Production has not been changed.

Account B validation refinement: scroll the label into view before recording its viewport bounds. This distinguishes a real inspector-induced movement from Playwright’s expected initial auto-scroll on phones; the real double-click and less-than-one-pixel stability assertions are unchanged. Fresh installation/build/numerical tests on implementation 1536123 pass 1,294 with zero failures/skips.


Account B root-cause refinement: implementation 1536123’s stronger bounds assertion reports an 18px Firefox label shift, while its other journeys pass. Phone measurement failures came from initial auto-scroll and were fixed by measuring after scrolling (`a7c51a5`). Source shows pointerMove replacing the wrapped hover prompt with a shorter readout above the diagrams. That moves the label before pointerdown, explaining why the event targeted its underlying object rect. Replaced the inadequate pointerdown geometry fallback with stable readout behaviour while hovering an editable label. Drag/plot/beam inspection is unchanged. Retained the actual double-click and stability checks; new CI follows this checkpoint. No release claimed.


Account B validation of `3ca8691`: local 1,294 checks pass; exact-head CI 35859656037 reports 135/136 browser passes. Firefox’s full invalid-edit journey is repaired; WebKit’s compact input is present in the failure screenshot, but the new whole-interaction geometry measurement includes 11px of movement. Changed that additional assertion to compare label bounds at the two actual pointerdown events, require the same object and inline value on both, and retain the <1px bound and complete functional journey. This directly tests the original target-loss fault instead of measuring unrelated pre-click hover/editor-focus layout. No application change. CI release artifact 10750015323 matches all three local dist files exactly (746,563-byte HTML, d407fb18e0deec8befb910d832cb7c582ae0d8399d4c8625194ed8da4b373533). Production remains unmerged.


### 2026-09-23 — Account A — Final 4.1.3 validation, merge and production verification

Active account Account A; recovered canonical candidate 031b8bf665d21b09c679e60774a87f296f5a7eb5 in a clean worktree. Main began at d4c0479. Preserved Account B's final hover repair and two-press assertion; obsolete local experiments remain isolated. Fresh npm ci and npm test/build pass 1,294/1,294. Exact PR CI 35860727563 and push 35860722167 pass all 136 browser checks, zero retries. Retrieved final release artifact 10750615532 and browser evidence 10749619233. Three dist files match local output exactly. Reviewed desktop Chromium/Firefox and both mobile editor viewport screenshots, plus unrestricted Build evidence. Hosted preview confirms Practice masking ends on Build and editing history works when the toolbar is visible; an initial browser automation click during scrolling missed its target, then the visible hit-test and Undo/Redo succeeded. No application patch or test weakening was made during this final verification.

Marked PR #21 ready and merged with expected head 031b8bf. Released code d4f6b2182b1c899ce8f54213f67b111c9a7a8ca6. Vercel deployment 9RXP2L4MX3eSdaUTW5kjyg2jN1S2 succeeds. Public HTML is 746,563 bytes, SHA-256 d407fb18e0deec8befb910d832cb7c582ae0d8399d4c8625194ed8da4b373533, byte-identical to the CI artifact; public release/hash metadata agree. Tutor health returns 4.1.3 and configured:false.

Reproduced Hidden/Predict-first results on a saved 8 m beam in 4.1.2 Build before merge. Reloading the same study after deployment retains 8 m and exposes +10/+10 kN reactions and 40 kN·m peak moment. Live 8 → 9 Tab edit, Undo → 8, Redo → 9 pass. Restored 8 m and comparison, opened a temporary lesson, used Next/Previous, returned: original model, Redo and comparison preserved.

Created documentation branch docs/release-4-1-3-verification from d4f6b21. Objective: durable current release record, archived chronological handoff, accurate next scope. STATUS: released artifact/live journeys verified; automatic merged-main CI 35862619917 numerical green, browser still running at this checkpoint. Broader workspace/learning/math redesign remains subsequent approved work.

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

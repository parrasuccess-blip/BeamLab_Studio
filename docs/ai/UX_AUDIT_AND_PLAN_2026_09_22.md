# BeamLab workspace audit and implementation plan

**Prepared by Account A · incorporates Account B recovery findings · 22 September 2026**

**STATUS: audit complete / proposed implementation plan ready for review / no application changes.**

The immediate problem is confirmed: prediction state from Learn can hide engineering results in Build / Explore and Analyse, including after a reload. A second confirmed problem is that the ordinary object inspector covers toolbar controls at laptop width. A third is inconsistent answer protection in Learn, including Exam Mode. These need correction before a broad visual redesign.

This document proposes the next work. It does not claim the proposed behaviour has shipped.

**Reconciliation:** Account B checkpoint 99b199f10ed17d0ddcac3a1dd9db72efb7f7483c was inspected before publishing this completed plan. It correctly noted that the detailed plan had not yet been committed. Its recovery history is retained. Account B's additional exam Undo finding is included below, with evidence attribution kept explicit.

## 1. Verified starting point and scope

| Item | Verified state |
| --- | --- |
| Canonical repository | parrasuccess-blip/BeamLab_Studio |
| Starting and last checked main | 3498b5c31d94af3007e20c0de80cd4fafef5b1a4 |
| Released code | e6d4585a648bd624d1db41dc3d7e60037c448b4b |
| Public application | 4.1.2 at https://beam-lab-studio.vercel.app/ |
| Public HTML | 735,456 bytes |
| Public and local build SHA-256 | d683284d28cb618e43ffeee6aec234ea152d9a460b6723cb48735bf72fd32d04 |
| Audit branch | docs/workspace-ux-audit-plan |
| Audit record | [Draft PR #20](https://github.com/parrasuccess-blip/BeamLab_Studio/pull/20) |
| Authority for this update | Inspect the site and source; prepare a detailed plan before implementing changes |
| Production/app/test changes in this audit | None |

GitHub was refreshed before the audit. PR #18 and its verification follow-up #19 are merged; no open development PR existed before this documentation PR. The source and tests at the released code and starting main are identical. Do not resume the old annotation branch or restore an earlier account's local worktree.

Read PROJECT_CONTEXT.md, HANDOFF.md, SESSION_LOG.md, DECISIONS.md and TESTING.md when taking over, then fetch again. The branch and SHA above are a dated observation, not an instruction to overwrite newer work.

### Evidence and limits

Fresh local npm ci, npm run build and npm test succeeded: **1,272 Node checks passed, zero failed/skipped**. This count includes numerical, behaviour and restored legacy coverage.

[Current-main CI run 35729723993](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35729723993) succeeded. Browser job 106752152285 records **112 passed in 4.1 minutes, zero retries**, across desktop Chromium, desktop Firefox, iPhone WebKit and 360 px Chromium. This is an inspected CI run at the exact main commit, not a newly executed local browser suite.

The audit also used live public desktop interactions at a 1358 × 933 viewport and reviewed the released 4.1.2 phone screenshots from artifact 10694401811. Those screenshots use the same application source. No fresh physical-phone or manual mobile-emulation session is claimed. Mobile keyboard, orientation and touch ergonomics therefore remain explicit implementation validation work.

Public HTML, release.json and SHA256.txt were downloaded again and matched the freshly built artifact. The Vercel connector could not fetch the metadata, but independent public downloads succeeded; this was an access limitation of that connector, not a public-site failure.

Green existing tests do not cover all the reproduced journeys below. Do not describe the current interface as fault-free.

## 2. Confirmed findings, ranked by impact

P1 means fix before calling the next UX update ready. P2 means a material usability improvement. These are priorities for this update, not claims of structural safety certification.

| ID | Priority and evidence | What happens | Why it matters |
| --- | --- | --- | --- |
| UX-01 | P1 · live + source | Learn → Practice mode → workspace Build leaves reactions, SFD and BMD hidden. Analyse also inherits masking. Reload starts in Build with masking still active. | Direct engineering use appears blocked by a lesson prerequisite. This reproduces the user's screenshot. |
| UX-02 | P1 · live + source | Header/hero Build clears practice and chooses All Tools; the workspace Build button does neither. | Identically named entry paths behave differently. A user cannot predict how to recover. |
| UX-03 | P1 · live + source | An ordinary selected-load inspector overlays Undo, Redo, controls and inspector-toggle buttons at laptop width. | Buttons can be visible underneath a panel but cannot receive clicks. The compact label editor is repaired; the general inspector still obstructs controls. |
| UX-04 | P1 · live + source | Practice hides the plots while Show Why displays shear and worked solutions display reactions. In Exam Mode, “Show working” and “Model checks” expose answers before submission. | The teaching interface contradicts its own reveal rules. Exam Mode expressly promises no solutions until submission. |
| UX-05 | P1 · live + source | Choosing 1st Year in Learn also restricts Build/Analyse/Review after returning. Deformation/stress controls disappear and manual criteria say they require 3rd+ or All Tools. | Learning depth and engineering tool availability are coupled. Direct use should not depend on academic level. |
| UX-06 | P1 · deterministic bundle reproduction | The contextual Show Why dialog says moment stays continuous at a point load even when an applied couple shares that exact location. | This is an incorrect explanation of a correct solver result. |
| UX-07 | P2 · live + source | Editing a standalone lesson's point load clears the active lesson and returns to the catalogue without explaining that the activity ended. The edited temporary example and prediction masking remain. | The learner loses the question and can no longer tell what is being assessed. Their original engineering beam was still restored correctly. |
| UX-08 | P2 · rendered UI + source | Several surfaces use programming-style or plain-text maths: t^2, t^3, t2, V0, “integral”, “Sum Ry”, Kff df and mm4. | The presentation is inconsistent and harder to read. |
| UX-09 | P2 · rendered accessibility tree + source | The contextual tutor toolbar control has the accessible name “✦”, although a descriptive title exists. Several panel buttons rely on icon/title discovery, and Toggle inspector remains available without a selected object. | Users may not understand what a button will do; some actions appear to do nothing. |
| UX-10 | P1 · Account B live reproduction; Account A source confirmation | Undo can replace the question beam while an exam remains active, despite the displayed model lock. | Question identity and the displayed model can diverge. Prevent mutations, not just visible editing fields. |

### UX-01 / UX-02 reproduction

1. Open the public site and enter Build / Explore using the header.
2. Open Learn and turn on Practice mode.
3. Click the workspace Build / Explore button.
4. Observe “Predict first”, “Hidden” and “PREDICT BEFORE REVEAL”.
5. Switch to Analyse: the hidden state remains.
6. Reload the page: Build still hides the results.
7. Click the header Build / Explore link: results become visible.

[Captured blocked diagrams](../qa/2026-09-22-workspace-audit/blocked-diagrams.jpg)

Source: app.js initial view restoration, shown(), diagramView(), save(), setWorkflow() and enterWorkspace(); workspace.js transition(). The global :view storage includes practice, but not its reveal step. A reload restores practice=true with practiceStep=0. Presentation guards do not require Learn to be active.

### UX-03 reproduction

1. In Build, select P1 through the object list or object body.
2. Bring the stage toolbar into view while the inspector stays open.
3. At 1358 px width, inspect the right side of the toolbar: the inspector lies over it.
4. DOM hit testing confirms the inspector receives pointer hits at the centres of Undo, Redo and both panel controls.

[Captured inspector obstruction](../qa/2026-09-22-workspace-audit/inspector-obstruction.jpg)

Source: workspace.css positions .inspector.has-selection fixed at top:100px with width:310px and z-index:55. app.js always applies the inspector-hidden grid layout, so no column is reserved for the visible inspector. Preserve the 4.1.2 compact label editor and its mobile double-tap protection.

### UX-04 reproduction

In general Practice, turn on Show Why, or open Show working → Support reactions. The diagrams remain hidden while numerical answers appear elsewhere.

Separately, start a 6-question exam from Learn → Mastery. The screen says “No hints or solutions until submission”. Open Show working → Support reactions: the reaction table is available. Open Model checks: peak moment, shear and displacement values are available too.

[Captured exam worked solution](../qa/2026-09-22-workspace-audit/exam-working.jpg)

Source: renderExtras(), updateTrace(), the working/step/audit actions and auditDialog() do not use a common learning-output policy. The results-CSV export path also directly receives the solved analysis with no exam guard; this export issue is source-confirmed, not a newly downloaded exam export in this audit. Review PDF/SVG/PNG, comparison, critical-location navigation, tutor context and all related result surfaces as part of the fix.

This is consistency in the learning interface, not a proposal for secure proctoring. A local deterministic calculator must not be marketed as a tamper-proof examination platform.

### UX-06 reproduction and independent reference

Use a 10 m simply supported beam with a 20 kN downward point force and a +30 kN·m counter-clockwise couple together at x = 5 m.

Independent equilibrium gives:

- $R_A + R_B = 20\,\mathrm{kN}$.
- $10R_B - 20\times5 + 30 = 0$, hence $R_B=7\,\mathrm{kN}$ and $R_A=13\,\mathrm{kN}$.
- $V^- = +13\,\mathrm{kN}$ and $V^+ = -7\,\mathrm{kN}$.
- $M^- = +65\,\mathrm{kN\cdot m}$ and $M^+ = +35\,\mathrm{kN\cdot m}$.
- $\Delta M = -30\,\mathrm{kN\cdot m}$, so moment is discontinuous.

The current production bundle returns these values correctly, within floating-point roundoff. Calling studio/challenges.explainAt() on that same solved model says: “bending moment itself remains continuous.”

Its point-load branch wins an else-if chain before the coincident couple is considered. The diagram-overlay explanation is implemented separately, which increases the chance of inconsistent wording.

Another source/bundle observation: this dialog computes distributed intensity from effectiveModel.items only, omitting internalDistributedLoads generated by self-weight. A self-weight-only example has actual intensity 0.769822025 kN/m but the dialog selects its generic shear/moment explanation. This is an omitted physical cause, not evidence of an incorrect self-weight solve.

### UX-10: exam model-lock bypass

Account B reported reproducing this on public 4.1.2: start an exam, then invoke Undo while the session is active. The beam changes without exiting the exam. Account A subsequently inspected the actual action handlers: undo, undo-dialog and redo call history methods directly without the session guard used by commit(). This source review corroborates the bypass. The additional live check is Account B's evidence, not a fresh Account A reproduction.

Include toolbar Undo/Redo, keyboard shortcuts, the history dialog, pending numeric edits, drag/duplicate/remove, model loading, case/section changes and presentation entry in a mutation-policy audit. Do not assume every route is already broken; test each route against the same contract. A fixed assessment model must remain unchanged until a permitted activity transition. The saved engineering history must still be restored after leaving Learn.

## 3. What worked and must be preserved

Live checks passed for:

- Immediate engineering entry from the header, when it explicitly clears the leaked practice state.
- Independent numeric editing: 6 → 7 m, Undo to 6, Redo to 7, Undo to 6.
- Invalid 0 m input rolling back to 6 m after the deferred field transaction completes, without adding an edit. A transient invalid field before the deferred commit is not a new solver fault.
- Freezing a comparison, entering a standalone lesson, Previous/Next, returning to All lessons, and restoring the original 7 m beam, its history and comparison.
- Returning to the original beam after changing the temporary lesson load.
- Explicit full-session exit and its existing confirmation.
- Focus entry/exit, and Present → End tour restoring the original named study.
- Review → full verification, with all six consistency checks passing for the 7 m centre-load example.
- The public bundled analytical benchmark screen: **21/21 passed**.

Independent reference checks agreed: a 6 m beam with 20 kN at midspan gives 10 kN reactions and 30 kN·m peak moment; extending it proportionally to 7 m gives 35 kN·m. The coincident-action check above also agrees with hand equilibrium.

Current browser CI additionally covers unstable-model recovery, explicit JSON/shared/saved-study opening during learning, progress import, section inspection, fixed-support rotation, manual review criteria, exports, annotation geometry and the reference PDF.

These are scoped results. They do not establish correctness for every possible model or constitute professional design approval. No new numerical solver defect was found in this audit; the false continuity statement is an explanation defect.

The audit browser was returned to its original 6 m / 20 kN study, direct Build with All Tools, no active activity, no comparison and no prediction masking.

## 4. Product contract for the next implementation

The user's latest instruction establishes the central rule:

**Build / Explore must always permit direct engineering work. Learning restrictions belong only to an explicitly active Learn activity.**

| Context | Engineering model | Results and explanations | Tools |
| --- | --- | --- | --- |
| Build / Explore → Model | User's engineering study | Available whenever the solver has a valid result | All engineering tools available; advanced groups may be collapsed |
| Build / Explore → Analyse | Same study | All chosen response layers available | No academic-level prerequisite |
| Build / Explore → Review | Same study | Verification and normal exports available | Manual criteria remain optional and clearly user supplied |
| Learn catalogue / idle | Original study unless a temporary example is explicitly selected | No prediction masking merely because Learn was opened | Learning depth controls explanations and curriculum |
| Learn prediction or standalone lesson/challenge | Clearly identified temporary example, or explicitly chosen practice on the user's study | Only the requested responses are hidden until reveal; hints respect the same policy | Activity restrictions are explicit |
| Learn active exam | Temporary, fixed assessment model | Answer-bearing surfaces hidden until submission | Changes that invalidate assessment require an explicit exit |
| Learn submitted review | Completed temporary activity | Solutions and feedback available | Clear return to the original study |
| Invalid / unstable engineering model | Editable user study remains intact | Show a genuine analysis error, not a pedagogical mask | Repair and Undo remain available |

Manual choice to hide an optional layer is different from forced prediction masking. Build need not display every advanced chart at once; it must let the user reveal any available engineering result immediately.

Learning progress, engineering data, engineering display preferences and temporary activity state must remain separate. Academic level must not function as an engineering permission system.

## 5. Recommended interface structure

### Two primary modes, with a short engineering workflow

Use two clearly separated primary destinations: **Build / Explore** and **Learn**.

Inside Build / Explore, use **Model · Analyse · Review** as freely accessible tabs. They are useful destinations, not a mandatory wizard. Preserve the existing underlying functionality and map existing navigation actions into this structure.

- Model: geometry, supports, loads, section and load cases.
- Analyse: response layers, inspection, comparison and explanations.
- Review: checks, assumptions, criteria and exports.
- Learn: catalogue, current activity and progress.

Every control labelled Build / Explore should enter the same engineering Model destination, committing a valid pending edit once and restoring the original beam when leaving a temporary example. A button that returns to another destination should say so explicitly.

The homepage can retain its dark interactive hero. Once a workspace is entered, use the existing focused-workspace capability as the basis of a compact application shell. Home returns to the homepage. Do not require scrolling through repeated marketing, workflow and instructional headings to get to the model.

Keep shared #model= links compatible. Do not replace the standalone build or introduce a framework migration for this task.

### Desktop and laptop workspace

1. A stable study bar: name, save state, Undo/Redo, comparison, Studies and Export. Essential edit controls stay reachable while any inspector is open.
2. A compact left tool area. Group Geometry, Supports, Loads, Section and Cases clearly. Advanced groups expand immediately when requested; no year selector is needed.
3. Selecting an object replaces the left tool area's contents with its inspector, with “Back to model tools” and clear selection context. This avoids another floating panel covering the workspace.
4. Keep the compact double-click label editor for quick numeric changes. Open only one editing surface at a time.
5. Keep Structure → SFD → BMD in one aligned column with the same x scale. Optional deformation/stress/moving-load sections follow only when selected.
6. Show Why belongs next to the selected result in the analysis flow. On a wide screen it may occupy a reserved contextual region; on a laptop it should expand below the selected diagram. Never squeeze the plots until labels are unreadable.
7. Keep the current diagram annotation allocator, separate inspection readouts, exact critical dots and overflow handling. Reflow when the actual plot container changes width.
8. Retain input focus and selection through ordinary updates. Avoid rebuilding unrelated navigation during a field transaction.

Use one consistent panel model instead of competing toolbar toggles, floating inspectors and duplicated settings. Consolidate the entry points without deleting advanced capability.

### Phone and narrow layouts

- Keep mode navigation and essential editing actions compact and reachable.
- Show full-width diagrams by default.
- Open tools or the selected object's editor in one explicit panel/sheet, with a visible title and Done/Close action; only one such surface is open at a time.
- Ensure the software keyboard cannot cover the active field or completion action. Provide enough scrolling inside an editor without creating an unexplained page-scroll trap.
- Keep touch targets at least approximately 44 CSS px where practicable, especially close, reveal, navigation and toolbar actions.
- For Learn, provide **Activity / Beam** views with a short persistent activity header. A learner should switch between the question and its beam in one action, instead of scrolling past settings and curriculum material.
- Keep the selected x, current question, answer draft and reveal stage when switching those views. Changing the view must not reveal answers.
- Test 360 px and 390 px portrait, landscape, intermediate tablet widths and 200% browser zoom. No whole-page horizontal overflow; intentional tables may scroll within a labelled region.

These are proposed design changes, not measured current failures in every listed viewport. Current phone evidence demonstrates excessive activity-page length; the keyboard/orientation checks remain to be performed.

### Learn should focus on the current task

Catalogue: choose a lesson/challenge, or deliberately start a guided/practice/exam session. Progress, syllabus, recommendations and learning settings should not all compete with a current question.

Active activity: title, position in sequence, question/concept, the relevant beam, one answer or sketch input, Check, and Reveal where permitted. Put Previous/Next and All lessons/challenges consistently beside the activity header. Keep settings and progress transfer in secondary panels.

Distinguish “Next activity” from “Reveal next response”; the current screen presents both forms of progression. Use descriptive labels such as “Show reactions”, “Show shear” and “Show moment”.

Maintain separate evidence for attempted, revealed and completed work. Revealing must not silently award completion. Preserve adaptive ordering and grading algorithms.

Leaving a full session through Build should offer the existing exit decision at that point. Preserve checked evidence and the documented treatment of unfinished work; do not silently discard or submit a session. If the user cancels, remain in Learn. If they confirm, restore the original model and complete the requested navigation.

For a standalone example edit, stop stale grading explicitly. Explain that the given problem has changed and offer to restart the activity or continue exploring the temporary example. Do not leave a silently vanished question. Creating an engineering copy should be a deliberate action that preserves the prior engineering study.

## 6. Technical implementation plan

### A. Separate navigation, learning state and engineering preferences

Prefer small explicit state/policy modules over another collection of boolean exceptions in app.js.

Suggested responsibilities:

- Workspace destination: engineering Model/Analyse/Review or Learn.
- Engineering view preferences: layers, detail, tools-panel density, selected x, zoom and panel state.
- Learning preferences: academic explanation depth, teaching preferences and catalogue section.
- Activity state: none, prediction, standalone lesson/challenge, guided/practice/exam session or submitted review.
- Result visibility policy: whether each output may display a value, a hint, a reveal action or an explanation of unavailability.

A shared policy must govern metrics, reactions, plots, traces, stress explorers, comparison, Show Why, worked solutions, critical-value dialogs, tutor context and result exports. Hiding a chart with CSS while leaving its answer in a tooltip or accessibility text is insufficient.

Build/Analyse/Review always permit results from a valid solve. Learn restrictions require an explicit active activity. An idle saved preference must never hide engineering output.

Keep the current structural validation and physical eligibility checks. For example, do not invent stress results for EI-only overrides just because Build is unrestricted.

### B. Migrate existing preferences without touching the beam

Read legacy :view.practice only as a legacy learning preference, never as authority to mask Build at startup. Remove or ignore it in engineering view persistence. Do not clear localStorage or reset the user's model as a repair.

Split learning level from engineering tool density. Preserve the user's saved learning level for future lessons. Existing first-year preferences should not prevent direct engineering editing after the update.

Preserve the established model format, advanced properties, independent progress/evidence keys, BL410-compatible fingerprints and existing shared snapshots. Keep Undo/Redo and comparison as page-session state; do not promise they survive a reload.

A reload during temporary learning must continue to recover the saved engineering model. Resumable guided activity state must remain separate and be entered explicitly. Storage unavailable, old schema and corrupt preference data need graceful fallbacks without data loss.

### C. Unify navigation and editing transactions

Route header entry, homepage entry, primary tabs, “Return to my model”, context buttons and keyboard navigation through one transition operation.

Order operations explicitly: finish or roll back pending edit → resolve activity exit if needed → restore engineering origin if applicable → change destination → apply that destination's presentation policy → render → focus/scroll intentionally.

Do not discard Account A/B's openUserStudy repair. Explicit JSON, snapshot and saved-study opening during a lesson remains a user model-opening action; invalid imports must leave the activity intact. Undo must return to the original engineering study, not an intermediate lesson example.

Preserve deferred Tab transaction handling, first-valid-edit Undo availability, rapid repeat edits, native Shift+Tab order and Firefox pressed-pointer safeguards. No artificial waits or force-clicks to conceal obstruction.

### D. Protect fixed learning models at the mutation boundary

Add a single activity-aware model-mutation policy. Active fixed-question sessions must reject user model replacement even if it arrives through Undo/Redo, history navigation, keyboard actions or a pending field commit. Disable corresponding UI actions with a clear reason, but enforce the rule in the handlers as well.

Keep each question associated with its given model identity/fingerprint. Before checking or revealing an answer, verify that it still refers to that model. A mismatch should produce an explicit recoverable activity state, not silently grade a different beam. Do not replace the deterministic solver or alter grading tolerances.

Preserve the original engineering model, past/future history and comparison outside the temporary session. Questions may use internal loading transitions, but those must not expose previous engineering history as exam-editable state. Submitted review and standalone exploration need their own deliberate permissions; they should not inherit a blanket permanent editing lock.

### E. Repair panel and button behaviour

Move the selected-object inspector into reserved workspace space. Remove the need to click through it to reach Undo. Reuse the compact inline editor and make its lifecycle mutually exclusive with the full inspector.

Give controls explicit accessible names and state: aria-label for icon-only controls, aria-expanded/aria-controls for panels, aria-current for navigation, and visible explanations for unavailable actions. The tutor launcher must announce “Ask BeamLab”, not “✦”.

When no object is selected, do not present an inspector toggle that silently does nothing. Show a useful selection prompt or disable it with a visible reason.

Audit keyboard and pointer equivalents of the same action, opening/closing with Escape, returning focus to the initiating control, and transient menus closing predictably.

Present the optional tutor's unconfigured state before a grid of unusable prompts. Keep deterministic Show Why prominent and working offline. Connecting an AI provider is outside this UI repair.

### F. Correct and deepen deterministic Show Why

First fix the incorrect coincident-action statement. Treat all actions at the selected event together, not as one winning else-if branch. Include applied loads, reactions, couples, hinges, imposed movement, effective case factors and self-weight.

Then use one structured explanation generator for both the on-page explanation and the dialog:

1. **Where you are:** x, selected side/region, nearby action or support.
2. **What the beam is doing:** one concrete physical sentence about the current model.
3. **Why:** the applicable relationship with signed values substituted.
4. **Left and right:** V⁻/V⁺ and M⁻/M⁺ when a discontinuity exists, with units.
5. **Connection to the shape:** flat/linear/curved shear, rising/falling moment, local curvature.
6. **Optional deeper derivation:** equilibrium, compatibility and relevant assumptions.
7. **Verification context:** the corresponding residual/check where meaningful, not a generic assurance.

Explain a smooth extremum differently from a point-load corner, an applied-couple jump or an endpoint maximum. A continuous beam's intermediate pin/roller support does not automatically make moment zero. A hinge has zero moment but may have different rotations on either side.

Read distributed intensity and local EI from the solved element/region. Do not independently reconstruct a second analysis or omit internal self-weight loads. Use one-sided local section properties at a boundary. Respect EI-only stress restrictions.

Learning depth changes the explanation, not the result. In an unrevealed activity, offer permitted hints without numerical answer leakage. Exam explanations remain unavailable until submission.

### G. Make mathematical presentation consistent

Create a small shared presentation layer for exponents, subscripts, derivatives, fractions, integrals, sums and units. It formats trusted deterministic values; it does not parse or execute user-supplied formula text.

Examples of intended presentation:

- t², t³, mm², mm⁴, kN·m.
- V₀, w₀, R_A with semantic subscripts rather than concatenated identifiers.
- ΣF_y = 0 and ΣM_A = 0.
- W = ∫w(x) dx and x_R = [∫xw(x) dx] / W.
- dV/dx = −w(x), dM/dx = V(x), EI d²v/dx² = M(x).
- ΔV = V⁺ − V⁻ and ΔM = M⁺ − M⁻.

Use semantic HTML/sup/sub for simple expressions and an accessible offline-capable rendering approach for longer equations. Confirm screen-reader alternatives and wrapping at phone widths. Do not use a global string replacement that can corrupt model names, source code or scientific notation.

Apply it to Show Why, worked solutions, lessons/challenges, labels, section properties, verification displays and reports. SVG/PDF require explicit font/glyph and layout validation; do not assume text that renders in HTML will survive the existing PDF writer. Preserve report readability and page grouping, and inspect the actual exported pages.

Keep machine-readable JSON keys and raw CSV numeric data compatible. Human-facing units and headings can improve without changing the numeric schema.

## 7. Suggested delivery sequence

| Increment | Implementation checklist | Completion evidence |
| --- | --- | --- |
| 1. Behaviour and explanation correctness | Fix workspace/activity visibility separation; legacy practice migration; consistent Build entry; separate learning level from direct tools; enforce Learn reveal policy across output surfaces; prevent active-session Undo/Redo model replacement; fix coincident point/couple explanation; retain origin restoration | New failing repro tests pass; existing 1,272 baseline retained; four-browser navigation/reload/exam checks pass; all relevant numerical tolerances unchanged |
| 2. Workspace and editor layout | Two primary modes; Model/Analyse/Review destinations; focused shell; reserved inspector; single editor surface; consistent panel/button names and states | Actual hit testing and clicks with inspector open; keyboard/Tab/Firefox regressions retained; desktop/laptop/tablet/mobile screenshots; plot alignment and label allocator tests pass |
| 3. Focused learning layout | Clear catalogue/activity views; Activity/Beam phone views; consolidated reveal/navigation; explicit changed-example state and session exit from navigation | Complete novice and returning-user journeys; original model/history/comparison preserved; reload and import coverage; no lost answer drafts or reveal-state bypass |
| 4. Mathematical presentation and richer Show Why | Shared deterministic explanation facts; effective loads/local EI; semantic maths across UI and export; offline fallback | Reference explanation fixtures, physical statements and units verified; accessible maths and phone wrapping; actual SVG/PDF review; tutor unavailable path works |
| 5. Release validation and handoff | Consolidated regression run, exact-head CI, visual review, release identity, public smoke checks and progressive documentation | Public version/hash matches tested build; critical journeys rechecked on actual URL; completed handoff with exact refs, results and known limits |

Keep increments small enough to checkpoint and inspect. No merge should combine an unresolved P1 fault with a claim that the full UX update is complete. A narrowly scoped early repair release is reasonable after its own tests pass; the broader redesign is not a reason to leave Build blocked.

Do not start catalogue expansion, new numerical formulations, design-code capacities, truss/frame solvers or a large AI chat interface in these increments.

## 8. File and system map for Account B

| Files / system | Proposed work |
| --- | --- |
| src/studio/app.js | State initialization/persistence, transition entry points, rendering policy, activity lifecycle, pending field commits, button actions, output/tutor/export guards |
| src/studio/workspace.js | Mode/destination definitions, consistent navigation, activity navigation and exit intent |
| src/studio/levels.js | Learning explanation/curriculum depth; separate it from direct engineering availability |
| src/studio/panels.js | Model palette, reserved inspector, Learn catalogue/activity content, consolidated reveal controls |
| src/workspace.css and src/styles.css | Focused shell, panel placement, responsive flow, touch targets, focus visibility and maths layout |
| src/studio/diagrams.js | Consume the shared output policy; preserve annotation logic; use shared explanation facts |
| src/studio/challenges.js | Correct explainAt and reuse common explanation facts; preserve grading, sketch evaluation and adaptive evidence algorithms |
| src/studio/working.js | Output visibility and formatted equations with deterministic substituted values |
| src/studio/section-lab.js, review-hub.js and moving UI | Consistent availability and result policy; preserve engineering eligibility/limitations |
| src/studio/export.js and app.js export actions | Compatible data exports, explicit learning-output rules and verified mathematical/report rendering |
| src/studio/common.js / proposed small policy + maths helpers | Accessible control names and shared presentation functions; register new modules in module-order.json |
| src/browser/readability.js | Check that existing post-render readability handling does not conflict with semantic maths or accessible names |
| tests/guided-studio.test.cjs, regression and legacy suites | Preserve baseline; add meaningful policy, migration and explanation reference checks |
| tests/browser/studio.spec.js and diagram-layout.spec.js | Add actual user journeys and obstruction checks across the existing four projects |
| docs/ai/* and release record | Progressive checkpoints, exact validation state, rollout evidence and any remaining limits |

No solver rewrite, sign change or numerical tolerance change is needed to implement this plan.

## 9. Test plan and acceptance criteria

### Preflight for each increment

Fetch newest main/PR refs; inspect new commits; create a dedicated feature branch and early draft PR; record account, objective, starting SHA and status. Run npm ci, npm run build and npm test before implementation. Inspect/run the current browser suite at the exact code being changed. Record actual results, not an assumed historical count.

Before a long validation run, push a coherent checkpoint and update HANDOFF and SESSION_LOG. Do not leave completed work only in a temporary environment.

### New behaviour coverage

| Journey | Required result |
| --- | --- |
| Fresh direct entry; returning user with legacy practice=true | Build results visible with no lesson prerequisite; valid saved study unchanged |
| Practice → every engineering entry path → reload | Same visible results and expected destination; no hidden peak/trace leftovers |
| Every reveal stage, including all-results-revealed → Build → Learn | Engineering always visible; learning reveal state follows the documented activity policy |
| First-year Learn → Build/Analyse/Review | All direct engineering capability available; remembered learning depth remains first year |
| Beginner presets with an advanced saved beam | Sections, cases, hinges, settlements, rotation and EI regions retained; no model replacement |
| Practice/exam → metrics/plots/traces/Show Why/working/audit/exports/tutor | All output surfaces obey one policy; hints do not leak unrevealed answers |
| Active fixed-question session → toolbar/keyboard/history/pending edits | Given model and question identity remain unchanged; no history mutation bypass; original engineering history returns on exit |
| Exam → Build | Explicit exit/cancel flow; cancel preserves activity; confirmed exit restores original beam and reaches Build |
| Lesson Previous/Next/All lessons and challenge equivalents | Clear active activity, correct ordering, bounded reveal/completion evidence |
| Edit a lesson example | Visible changed-problem state; no stale marking; original engineering model remains recoverable |
| Temporary activity → reload | Saved engineering model restored; learning progress preserved; no false promise of persistent Undo |
| Explicit saved study/shared #model=/JSON opening during learning | Opened model retained; invalid import leaves activity intact; Undo returns to the original study |
| Object inspector open → click Undo/Redo, navigation, close tools | Intended control receives the click; no covered target and no force-click workaround |
| Numeric input Tab/Shift+Tab, rapid edits, pending Undo, invalid value | Separate correct history entries, persistence, native focus and rollback retained |
| Compact label edit → Undo → reopen → Redo on touch and mouse | Existing 4.1.2 interaction remains reliable |
| No selection → inspector control; tutor unconfigured | Clear useful state, meaningful accessible name, no unexplained inert controls |
| Unstable model → repair/Undo | Genuine diagnostic shown; controls remain usable; previous valid result recovers |
| Resize/panel open/zoom and crowded annotations | Structure/SFD/BMD alignment retained; no label/marker/readout collisions |
| Phone Activity ↔ Beam with keyboard open | Current question/answer/x preserved, focus usable, no hidden completion button |
| PDF/SVG/PNG and data exports after layout/maths work | Correct values and units, no clipping or unsupported glyphs; reference PDF grouping retained |
| Focus/Present/End tour and Home/Workspace navigation | Expected view and original model restored; new route logic preserves shared links |

Use actual pointer interactions and hit testing for obstruction; a visible or enabled DOM button alone is not sufficient. Retain zero-retry browser acceptance. Fix the cause of failures rather than weakening tolerances, adding force-clicks or deleting assertions.

### Numerical and explanatory reference set

Retain all current solver and historical regressions. Add focused explanation checks for:

- 6 m / 20 kN midspan point load: R_A = R_B = 10 kN, M_max = 30 kN·m; moment maximum occurs at a shear jump without requiring a sampled V=0 value.
- 10 m fixed-ended beam with 5 kN/m: reactions 25 kN; internal end moments −41.6667 kN·m; midspan moment +20.8333 kN·m.
- The coincident force/couple reference in UX-06.
- Upward loads and negative case factors; applied and reaction couples.
- Internal hinge versus ordinary continuous-beam intermediate support.
- Constant and varying distributed loads; self-weight, including stepped sections.
- Prescribed settlement/rotation and zero external-load cases.
- Local section boundaries and both sides of a discontinuity.
- EI-only overrides: deformation remains meaningful; unavailable physical stress is not fabricated.
- Endpoint maxima, smooth extrema and flat zero-shear regions.

Compare explanation statements to the solver's event/region data and independent identities where applicable. Do not calculate structural answers in prose or in a separate learning solver.

### Definition of ready

The increment has passed numerical and relevant browser suites at the final SHA; new behaviours have regression coverage; desktop/mobile evidence is visually reviewed; controls are actually reachable; old saved data migrates without loss; the public release description accurately states its limits.

Only after merge/deployment verification may the update be called live. Check the actual production URL, release.json, SHA256.txt and public HTML against the tested artifact, then repeat the original blocked-Build reproduction, inspector click journey and lesson-return journey on production.

This plan does not require the non-programmer user to inspect GitHub, run commands or interpret failures. Account A/B performs that work.

## 10. Account B continuation brief

1. Fetch the latest repository state and read this plan plus the shared AI documents.
2. Treat PR #20 as a documentation-only audit. No proposed application fixes have been implemented here.
3. Preserve the released 4.1.2 annotation, direct-editing, Tab-history and model-opening repairs.
4. Begin with Increment 1 after the user has reviewed the plan; use a new feature branch from the then-current main.
5. Convert P1 findings UX-01 through UX-06 and UX-10 into concrete regression cases, including legacy saved practice, identical entry paths, exam answer surfaces, exam model mutation and coincident actions.
6. Checkpoint source/docs before long tests. Keep both accounts' recovery records current throughout.
7. Implement the layout and learning improvements in the remaining increments, using real user journeys to decide whether they help.
8. Do not claim a feature is complete merely because the old suite is green, or live merely because a branch was pushed.

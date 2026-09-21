# BeamLab Studio 4.1.1 — Direct engineering and optional learning

Status: validated release candidate; merge and production verification pending.

## Changes

- Open Build / Explore immediately with all tools and a simple reference beam. Learn is optional; saved models/preferences are retained.
- Use Build / Explore → Analyse → Review for direct engineering. Enter Learn voluntarily, with focused lesson/challenge content, Previous/Next controls and a route back to the catalogue.
- Temporary standalone teaching examples preserve the engineering beam, Undo/Redo and comparison. They do not autosave over the engineering study. Reload retains the saved beam and independent learning evidence; Undo/Redo and comparison remain page-session state.
- Opening a valid named study, shared snapshot or JSON file during a standalone activity ends that temporary activity and retains the explicitly chosen replacement. Undo returns to the original engineering model. Invalid imports leave the activity intact.
- Numeric edits commit and save independently after Tab/Shift+Tab. The first valid pending edit enables Undo immediately. Invalid edits restore the committed beam. Firefox pressed-button safeguards remain intact.

## Validation record

- Starting main: `08cf047d819c6b3563de95727ceea3e9b86fd7e3` (4.1.0).
- Account B source checkpoint: `282fda3385b10aede173be09a5f2aab555edfe46`.
- Fresh local installation/build/regression at that source: 1,258 checks passed, none failed/skipped.
- Exact-source PR run 35512885378: 95/96 browser checks passed. The remaining assertion incorrectly assumed Chromium's backward tab order in Firefox. Trace/screenshot showed the scrollable tools panel correctly focused. The corrected test explicitly verifies that panel and the following Studies button, retaining all history/persistence checks and zero retries.
- Final implementation `c785fae2244144874aa0093ef854232ca29d8c08`: fresh local build/test **1,258 passed**, no failures/skips. [PR CI run 35554612907](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35554612907) passed **96 browser checks (2.4m)** across desktop Chromium/Firefox, iPhone WebKit and 360px Chromium, with zero retries.
- Desktop and mobile screenshots inspected; hosted-preview checks confirmed direct entry, independent edits/Undo/Redo, lesson navigation, original beam/comparison restoration, reload safety and invalid rollback. Review reports six consistency checks passed on the restored 9 m reference model.
- Tested artifact: **725,972 bytes**, SHA-256 **6dbd2d3e2ac5d20baf8f749c205b8cce7bf99ba89b8575d8abce26913fa9de40**. Production remains separately unverified for 4.1.1 until deployment.

## Scope and remaining work

The deterministic engineering solver, sign conventions, units, model schema, numerical tolerances, adaptive learning and grading are unchanged. The `BL410-` model fingerprint namespace is retained so unchanged studies keep their references; release metadata identifies 4.1.1 separately.

Broader mathematical notation, collision-free critical/trace labels, shorter mobile lesson pages and deeper deterministic Show Why explanations remain follow-up work. This is an educational/static-analysis preview, not code-design certification. The optional online tutor is not required for any numerical result.

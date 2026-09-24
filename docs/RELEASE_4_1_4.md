# BeamLab Studio 4.1.4 — Interface polish

Status: released through PR #23 at 232912f; public 4.1.4 verified on 2026-09-24.

- Homepage actions share a 48 px height, text size and consistent gaps.
- Related controls use a common 44 px action rhythm, with compact desktop toolbar icons and larger phone targets.
- Numeric input containers fit their contents; phone fields use 16 px text to avoid focus zoom.
- Learning tabs share one balanced row; lesson, review and dialog actions wrap without crowding.
- Narrow headers, editor toolbars and footers fit their available width. Large metric values can wrap.
- Navigation settles immediately and uses a single header offset, keeping the next pointer target still.

The four destinations, deterministic solver, signs, units, numerical tolerances, learning activity policy and saved-model/history behaviour are unchanged. This is a polish pass before the broader approved workspace/learning/math redesign.

Validation: 1,294 numerical/behaviour checks and 148 browser journeys passed, zero retries. Desktop and phone rendering reviewed; live edit/Undo/Redo, lesson return and criteria navigation verified. Public HTML matches the tested artifact exactly: SHA-256 b59ed05a7b6f58d218f93dc3e09f3a096977e4b486bba015ee29c99d6240128d. See docs/ai/HANDOFF.md for run IDs and evidence.

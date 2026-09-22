# Public workspace audit evidence — 22 September 2026

Account A captured these screenshots on public BeamLab 4.1.2 during the plan-only audit. Source/main: 3498b5c31d94af3007e20c0de80cd4fafef5b1a4. Browser viewport: 1358 × 933 CSS px. These are observed faults, not pictures of a proposed repair.

- [blocked-diagrams.jpg](blocked-diagrams.jpg): Learn → Practice → workspace Build retains prediction masks. A separate reload check also reproduced the masks.
- [inspector-obstruction.jpg](inspector-obstruction.jpg): ordinary selected-load inspector covers the toolbar. DOM centre-point hit tests confirmed Undo, Redo and panel controls were intercepted by inspector content while in the viewport.
- [exam-working.jpg](exam-working.jpg): worked reaction solution was available during an active, unsubmitted exam. The accessibility tree simultaneously recorded “EXAM MODE” and “No hints or solutions until submission”; Model checks separately exposed extrema.

See [the full audit and implementation plan](../../ai/UX_AUDIT_AND_PLAN_2026_09_22.md) for reproduction steps, numerical references, validation provenance and limitations. No application fix or deployment is included in this evidence commit.

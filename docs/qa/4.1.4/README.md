# 4.1.4 release evidence

- Validated candidate: 0741cc3dbd5679c3eee855afeea2665432a5079d.
- Released code: 232912f466c529ae7bfcc1c377571bbff5af9652 (PR #23).
- [CI run](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35959768662): 1,294 numerical/behaviour and 148 browser checks, zero retries.
- [Browser evidence](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35959768662/artifacts/10792136460): desktop Chromium/Firefox and emulated phone WebKit/Chromium. Final phone lesson, homepage, editor and review layouts inspected alongside hosted desktop review. Artifacts have GitHub retention limits.
- [Tested release](https://github.com/parrasuccess-blip/BeamLab_Studio/actions/runs/35959768662/artifacts/10791593840) matches local and downloaded public files.
- HTML: 753,235 bytes; SHA-256 b59ed05a7b6f58d218f93dc3e09f3a096977e4b486bba015ee29c99d6240128d.
- [Public interface screenshot](public-polish.jpg), captured on 2026-09-24 from the production 4.1.4 site. The public browser also passed editing, Undo/Redo, criteria navigation and lesson model restoration.

This is focused control/layout polish, not completion of the broader approved UX roadmap. Mobile evidence uses browser emulation, not physical-device testing.

# Restored 3.8.6 regression coverage

All nine test files originate from the authoritative 3.8.6 handoff. Numerical reference values and tolerances are retained.

Adaptations: source and artifact paths now match this repository; expected release identity is 4.1.0 / BL410; the unloaded finite-field check names every numeric sample field, because stepped-section samples also carry string/null metadata. No numerical assertion or supported case was removed.

Original file SHA-256 values:

```text
f1f8186e1422948759dccd28dfbc71829c618341bc224c9d851236c36a3a1034  release-bundle.test.cjs
330107006fd137d785cb3e85edcaa4a072f524a5837f64f275aac296eabefc3f  moving-bundle.test.cjs
22dd73ab16bfc665da3587dae966d8285459173ad34df4433c2a2e6f287a373a  moving35.test.cjs
247f1510fca5ddb707dcd7f734a2800dee8b554551ceb4df0019a6fe209af1a1  studio34.test.cjs
969c15c68a522879d4cc423c4a875da9295919eb0c2b8cf922bd6f2ab9f4875c  levels36.test.cjs
e0e0efba461e8caa6d3ad955cf4aa7dc67b6456e5828743a4c6baed166ed2b3a  meeting-math.test.cjs
1282adfc302fe8f28a1931f43cb8e3440861e2d70ba9385229004310ee861657  learning-recovery.test.cjs
5374d169f5a04a538266924145b80c7de36872bdca575874a4a3c6ee56c19846  math.test.cjs
096e440f69d8b493047bf07ea90e6a2bd2ebd64229888faf4a4e878ff7726aa8  levels-bundle.test.cjs
```

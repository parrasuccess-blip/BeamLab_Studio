# BeamLab Studio — Shared AI Project Context

## Purpose

BeamLab Studio is an interactive structural engineering analysis and learning environment. It should work for both experienced users who want to build and analyse beams directly and learners who want guided explanations.

GitHub is the canonical implementation. Chat history is supporting context only.

Production site: https://beam-lab-studio.vercel.app/

Current verified release: **4.1.3**, released on 2026-09-23. Read HANDOFF.md for exact commits, validation evidence and the next approved increment; always fetch current refs before continuing.

## Product structure

BeamLab currently has four connected destinations:

- **Build** — create and edit the beam, supports, loads, geometry, sections and load cases.
- **Analyse** — inspect structure, SFD, BMD, deformation, stress, moving-load studies and deterministic explanations.
- **Learn** — prediction, sketching, numerical challenges, adaptive practice, exams and resumable guided study.
- **Review** — numerical consistency checks, exports and optional user-entered review criteria.

The intended experience is one coherent engineering studio, not a collection of disconnected exercises.

## Core non-negotiables

### 1. One deterministic solver

BeamLab must maintain one authoritative structural solver.

Learning level, interface mode or explanation mode may change presentation, assistance and visible controls, but must not silently create a different numerical answer.

The current solver is an Euler–Bernoulli beam model.

### 2. Preserve validated engineering behaviour

Existing numerical behaviour, sign conventions and tolerances must not be casually changed.

Before modifying solver logic, inspect the current tests, conventions and regression evidence. Do not alter numerical behaviour merely to make a test pass unless the engineering basis is understood.

### 3. Established sign conventions

At the current 4.1 baseline:

- applied vertical loads are positive downward;
- reactions and displacement are positive upward;
- applied couples and rotation are positive counter-clockwise;
- bending moment is positive sagging.

Inputs retain the established kN, m, GPa and mm section-property conventions.

### 4. Build must not be gated by learning

A user who already understands structural engineering should be able to use engineering tools without first completing lessons.

The product should maintain a clear conceptual difference between:

- **Build / Explore** — minimal-friction engineering use;
- **Learn** — guided teaching and explanations.

Learning should support the engineering environment, not obstruct it.

### 5. Mathematical notation should look like mathematics

Where practical, user-facing mathematics should use proper mathematical notation rather than programming syntax.

Examples:

- x² rather than x^2
- ΣF = 0
- ΣM = 0
- Δ, θ, E, I, M, V and w where appropriate

Programming notation should not unnecessarily leak into the interface.

### 6. UX should be seamless

Avoid:

- overlapping values or labels;
- controls obscuring the beam;
- scattered tools without a clear hierarchy;
- unnecessary modal steps;
- awkward lesson navigation;
- forced lesson progression;
- excessive clicks;
- inconsistent responsive behaviour.

Consider how an engineering student or engineer expects to interact with the model.

### 7. “Show Why” must teach engineering

“Show Why” should not simply paraphrase the numerical result.

Where appropriate it should explain:

- physical behaviour;
- equilibrium;
- load paths;
- boundary conditions;
- relevant equations;
- sign convention;
- why SFD/BMD/deformation shapes occur;
- why results change when the model changes.

The goal is engineering intuition.

### 8. Direct manipulation matters

Where appropriate, favour intuitive direct interaction with beams, supports, loads, dimensions and structural elements instead of forcing everything through detached forms.

### 9. Preserve the visual language

BeamLab uses a polished dark engineering interface. New features should fit the existing design system rather than introducing unrelated visual patterns.

## Current source map

At the 4.1 baseline:

- `src/engine/` — static solver, numerical utilities, elementary shear and moving point-load analysis.
- `src/model/` — validation, examples, load cases, stepped/section regions, EI overrides and section references.
- `src/studio/` — workspace, diagrams, learning, verification, local stress explorer and review/export.
- `src/browser/` — optional online tutor client.
- `api/tutor.js` — bounded contextual explanation endpoint; never the numerical solver.
- `tests/legacy/` — restored historical regression suites.
- `docs/RELEASE_4_1.md` — original 4.1 engineering record.
- `docs/RELEASE_4_1_3.md` — current activity-policy, editing and explanation repair release.
- `src/studio/activity-policy.js` and `explanation.js` — shared learning restrictions and solved explanation facts.

Do not assume these paths will remain unchanged forever; inspect the repository when resuming work.

## Engineering boundaries at 4.1

BeamLab supports true stepped sections and optional EI-only overrides. Vertical support settlement and fixed-support rotation are prescribed boundary conditions.

Local elastic stress must not be inferred from an EI-only multiplier.

Circular, hollow circular, rectangle, box and I geometries are idealised geometries, not automatically verified catalogue products.

Moving-load envelopes are sampled static analyses, not dynamic analysis or certified exact maxima.

BeamLab is an educational/static-analysis preview, not professional structural design approval or code certification.

## Current roadmap boundaries

The following remain separate future validation/product stages unless newer repository work explicitly changes this:

- authoritative catalogue expansion with traceable properties;
- exact candidate-event moving-load extrema and richer vehicle libraries;
- thermal deformation;
- tapered elements;
- shear deformation;
- dynamics;
- richer 2D stress fields;
- verified AS 4100 / AS/NZS design capacities and load combinations;
- concrete design;
- TrussLab;
- FrameLab;
- general FEM.

Do not turn these into casual UI toggles without the required numerical implementation and validation.

## Security and data

Never commit API keys, passwords, tokens or Vercel secrets.

The optional online tutor may use environment-variable names such as `OPENAI_API_KEY` and `OPENAI_MODEL`, but secret values must remain outside Git.

Model and learning data are local to the browser unless the user explicitly invokes the online tutor.

## Source-of-truth priority

If information conflicts, use this order:

1. the user's newest explicit instruction;
2. the actual repository implementation;
3. verified tests and engineering behaviour;
4. `docs/ai/DECISIONS.md`;
5. `docs/ai/HANDOFF.md`;
6. this file;
7. old ChatGPT conversation memory.

When in doubt, inspect Git rather than guessing.

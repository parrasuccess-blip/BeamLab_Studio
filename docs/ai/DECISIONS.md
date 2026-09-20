# BeamLab Engineering and Product Decisions

This file records durable decisions so Account A and Account B do not repeatedly reverse or rediscover them.

Do not delete old decisions when they are superseded. Mark them as superseded and link to the newer decision.

---

## D-001 — GitHub is the shared source of truth

**Status:** Accepted

**Decision:**  
When Account A and Account B alternate development, the repository and validated implementation take priority over either account's old chat history.

**Reason:**  
The two ChatGPT accounts do not share complete conversation history. Git provides a common, auditable project state.

---

## D-002 — Use one deterministic structural solver

**Status:** Accepted

**Decision:**  
BeamLab maintains one authoritative numerical solver. Learning levels, explanations and UI modes may change presentation but not silently produce different structural answers.

**Reason:**  
This prevents divergence between learning and engineering modes and keeps regression evidence meaningful.

---

## D-003 — Experienced users are not gated by lessons

**Status:** Accepted

**Decision:**  
Users who already understand structural engineering must be able to access BeamLab's engineering tools without completing learning material first.

**Reason:**  
BeamLab serves both learners and capable users. Education should assist rather than obstruct direct engineering use.

---

## D-004 — Use proper mathematical notation in the UI

**Status:** Accepted

**Decision:**  
Where practical, user-facing mathematics should use proper symbols and formatting, such as x², ΣF, ΣM, Δ and θ, instead of raw programming-style notation.

**Reason:**  
BeamLab is an engineering learning environment, so mathematical presentation should look natural to engineering users.

---

## D-005 — Show Why must explain cause, not just answer

**Status:** Accepted

**Decision:**  
“Show Why” should explain relevant equilibrium, behaviour, boundary conditions, sign conventions, equations and diagram relationships rather than merely restating the computed result.

**Reason:**  
Its purpose is to build engineering intuition.

---

## D-006 — Preserve established numerical tolerances and conventions

**Status:** Accepted

**Decision:**  
Do not casually loosen tolerances, alter sign conventions or rewrite expected numerical behaviour to make a test pass.

**Reason:**  
The restored regression history is a key safety mechanism for an engineering education tool.

---

## D-007 — Build and Learn are experiences, not separate solvers

**Status:** Accepted

**Decision:**  
BeamLab may present Build/Explore and Learn as distinct user experiences, but both must operate on the same underlying structural model and numerical authority.

**Reason:**  
The user wants a clearer path for knowledgeable users without sacrificing coherent educational behaviour.

---

## D-008 — Do not claim deployment from a source commit alone

**Status:** Accepted

**Decision:**  
A GitHub commit, test pass or Vercel build start is not enough to claim the public app is updated. Production must be verified when deployment state matters.

**Reason:**  
Source, build artifacts and public deployment can diverge.

---

## D-009 — Optional AI tutor is never the solver

**Status:** Accepted

**Decision:**  
The optional contextual tutor may explain the model, but it must never become the numerical authority or be required for normal analysis.

**Reason:**  
BeamLab must remain deterministic and usable without provider credentials or network availability.

---

## D-010 — Keep future engineering stages explicit

**Status:** Accepted

**Decision:**  
Features such as verified code design, general FEM, concrete design, TrussLab, FrameLab, dynamics and other major numerical stages must not be represented as completed simply by adding interface controls.

**Reason:**  
These require independent engineering implementation and validation.

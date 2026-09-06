---
type: craft_rule
id: constraint_aware_drafting_and_assumptions
title: "Constraint-Aware Drafting & The Assumption Register: Pre-Flight Production Disciplines"
academic_basis: "ICM Layer 2 Production State Machine & SAGA Ledger Architecture"
last_modified: 2026-09-06
stages: [02_planning, 03_drafting]
genres: []
scope: chapter
subtype: plot_template
confidence: practitioner_method
provides: [constraint_aware_drafting, assumption_register, pre_flight_checklist]
requires: [pov_modes_and_epistemic_boundaries, agent_safe_editorial_conduct]
diagnostics: [continuity, voice_drift]
keywords: ["constraint aware drafting", "assumption register", "pre flight checklist", "canon verification", "drafting boundaries"]
---

# Constraint-Aware Drafting & The Assumption Register

Before writing a single sentence of active prose, an agent or co-writer must calibrate against the **Chapter Drafting Envelope**. Unconstrained drafting causes voice drift, canon violations, and unearned plot developments.

---

## 1. The Pre-Flight Drafting Envelope

Every chapter generation pass must verify eight explicit boundary constraints:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. POV & Tense        : Designated focalizer and tense from beats.    │
│ 2. Chapter Purpose    : Value shift (+ to -, or - to +).              │
│ 3. Epistemic Limits   : What this POV character CANNOT know here.      │
│ 4. Must-Include Beats : Obligatory trope/ledger items due this chapter.│
│ 5. Must-Avoid Traps   : Banned tells, premature reveals, cliché plots. │
│ 6. Trailing Voice Link: Rhythm of the last 500w of previous chapter.   │
│ 7. Word-Count Target  : Commercial target (±15% variance).             │
│ 8. Open Questions     : Intentionally unresolved ambiguities.          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The Assumption Register Protocol

When an agent drafts, gaps in world lore, character backstory, or spatial geography will inevitably arise. The agent must handle these through the **Assumption Register**:

1. **Provisional Assumption:** If a minor detail is needed for narrative flow (e.g. the name of a tavern or a horse's breed), invent provisionally and append to `canon.md` tagged with `[unverified chN]`.
2. **Major Fork Warning:** If the missing lore dictates character motivation or plot outcomes (e.g. whether a mentor is truly dead or secretly allied with the enemy), **STOP**. Never invent unilaterally. Present the decision fork to the writer.
3. **Reconciliation at Stage 04 Gate:** Before a chapter passes Stage 04, all `[unverified chN]` tags must be confirmed, modified, or ratified by the author.

---

## 3. Pre-Flight Verification Checklist

* [ ] Are the designated focalizer's physical coordinates verified?
* [ ] Is the trailing 500-word voice exemplar loaded for cadence matching?
* [ ] Are obligatory trope beats from `structure_plan.md` integrated into the scene beat?
* [ ] Are provisional inventions tagged with `[unverified chN]`?

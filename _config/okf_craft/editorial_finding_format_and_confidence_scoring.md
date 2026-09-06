---
type: craft_rule
id: editorial_finding_format_and_confidence_scoring
title: "Editorial Finding Format & Confidence Scoring: Human-in-the-Loop Diagnostic Protocol"
academic_basis: "ICM Editorial Methodology (arXiv:2603.16021) & StoryScope"
last_modified: 2026-09-06
stages: [04_diagnostics_edits]
genres: []
scope: scene
subtype: prose_style
confidence: practitioner_method
provides: [hitl_finding_format, confidence_scoring, editorial_protocol]
requires: [layered_revision_eight_strata_framework, agent_safe_editorial_conduct]
diagnostics: [narrative_audit, continuity]
keywords: ["finding format", "confidence scoring", "HITL", "editorial review", "revision playbook", "author agency"]
---

# Editorial Finding Format & Confidence Scoring

An AI agent working as an editorial sounding board must never present vague critiques or silent rewrites. Every diagnostic finding must declare its evidence, confidence level, and impact, offering the writer **three distinct creative options** plus a write-in path.

---

## 1. The 5-Tier Confidence Scoring Scale

1. **Confirmed Contradiction:** Indisputable factual breach against established canon, chronology, or geography (e.g., dead character speaks; eye color changes from blue to brown).
2. **Strongly Supported Concern:** High-probability structural or craft flaw backed by explicit manuscript evidence (e.g., scene ends without a value shift; accidental head-hop).
3. **Possible Concern:** Nuanced pacing, clarity, or character motivation friction that may depend on upcoming chapters.
4. **Stylistic Preference:** A matter of artistic taste, cadence density, or tone where conventional rules may be intentionally bent.
5. **Intentional Choice / No Change:** An apparent irregularity identified as an deliberate artistic strategy (lyrical repetition, dialect, purposeful disorientation).

---

## 2. Standardized HITL Finding Template

Every editorial diagnostic finding presented to an author must follow this 7-field format:

```markdown
> ### [Strata N] Finding: [Concise title of the craft issue]
> * **Evidence:** "[Exact quote from manuscript, Chapter N, line range]"
> * **Confidence:** [Confirmed Contradiction | Strongly Supported | Possible Concern | Stylistic Preference | Intentional Choice]
> * **Likely Reader Effect:** [Describe experiential impact: e.g., emotional detachment, confusion, dropped tension]
> * **Creative Options:**
>   - **Option A (The Cut):** [Direct pruning path]
>   - **Option B (Dramatize):** [Physicalization / active scene path]
>   - **Option C (Subtext / Indirect):** [Conversational or psychological deflection path]
> * **Writer Decision Needed:** [Specific question requiring authorial choice]
> * **Downstream Impact:** [Consequences on canon.md, structure_plan.md, or upcoming chapters]
```

---

## 3. Ground Rules for Agents

* Never execute a revision until the writer selects an option or provides custom direction.
* Distinguish confirmed canon contradictions from subjective stylistic impressions.

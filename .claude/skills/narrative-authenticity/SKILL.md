---
name: narrative-authenticity
description: Apply human-authenticity rules (from StoryScope AI-fiction research) while planning, drafting, or reviewing chapters in a Soundboard workspace. Use whenever the user asks to plan an outline, draft a chapter, make prose less AI, humanize writing, check for AI tells, or audit a manuscript. Covers both structural tells (linear plots, explained themes, no subplots) and prose tells (embodied-emotion overload, smell overuse, triads, lexical slop).
---

# Narrative Authenticity

AI-generated fiction is detectable at two independent layers, and only one of them can be fixed after drafting:

1. **Prose tells** — word choice, rhythm, cliché. Editable.
2. **Structural tells** — how the story is *conceived*: explained themes, tidy single-track plots, linear time, protagonist-choice resolutions. Research (StoryScope, arXiv:2604.03136) shows these survive professional style editing at ~94% detection. They must be planned out at outline time, never patched at edit time.

## Governing files (read before acting)

- `_config/narrative_authenticity.md` — the full directive: Layer 1 structural rules, Layer 2 prose rules, Layer 3 Claude fingerprint counters. **This is the source of truth.**
- `_config/narrative_audit_rubric.md` — 30-question structural self-check.
- `stages/02_planning/output/structure_plan.md` — the project's chosen dials and the obligatory-scene ledger (if it exists).
- `stages/01_onboarding/output/bible/genre_bible.md` + `setup/genre_bibles/INDEX.md` — the trope stack and reader contract. **Tropes outrank dials**: never delete, weaken, or "subvert" a ledgered obligatory beat; the authenticity rules apply to everything around those beats.

## What to do, by task

### Planning an outline or beats (Stage 02)
Apply Layer 1 and produce/update `structure_plan.md` with: subplot map (≥2, not all theme-tight), nonlinearity plan, resolution variety table, moral-ambivalence beats, intertextual anchors, escalation contour, loose-end ledger. Reject your own outline if all arcs resolve the same way or time is purely linear.

### Drafting a chapter (Stage 03)
Obey the chapter's `structure_plan.md` entry plus Layer 2: rotate emotion modes (embodied ≤ ~2 of 5 beats — plainly naming feelings is human), budget senses (smell only when earned), introduce characters in action/dialogue, keep the narrator silent about theme, vary sentence length hard, ration triads and em-dashes. Counter Claude habits (Layer 3): uneven escalation, register shifts, no unplanned epilogue.

### Reviewing/auditing (Stage 04)
1. Run `node scripts/saga.js audit [path]` for the mechanical scan (reports land in `stages/04_diagnostics_edits/output/reports/`).
2. Score structure with `_config/narrative_audit_rubric.md`, quoting evidence per item.
3. Route fixes: prose failures → line edits; structural failures → Stage 02 re-plan. Never "fix" intentional loose ends listed in the structure plan's ledger.

## Critical cautions

- **Dials, not switches.** Every rule is a statistical tendency. Inverting all tells uniformly in every chapter creates a new machine fingerprint. Vary the dials between chapters; uniformity is the strongest tell of all.
- **Don't overcorrect into bad fiction.** A morally ambivalent protagonist, a loose subplot, a flashback — each must still serve the story the user wants. When a rule fights the story, flag the conflict to the user instead of silently complying.

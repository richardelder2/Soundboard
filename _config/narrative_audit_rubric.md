---
type: AuditRubric
name: Narrative Authenticity Audit Rubric
source: "StoryScope 30 core features (arXiv:2604.03136), inverted into a self-check"
used_by: stages/04_diagnostics_edits
scoring: "Each question scored per chapter (or per book where marked [BOOK]). Target column = human-typical direction."
last_modified: 2026-07-07
---

# Narrative Authenticity Audit Rubric

This rubric runs the published AI-fiction detector *in reverse*: an LLM (or human editor) scores the manuscript on the same discourse-level questions researchers used to separate AI from human fiction. Score every question, then compare to the target. Questions the mechanical scanner (`node scripts/saga.js audit`) already covers are marked [SCAN] and need no manual scoring.

**Scoring discipline**: answer from evidence in the text, quote the supporting passage, and resist grading generously. A chapter that "mostly" avoids a tell still fails that item.

## A. Theme & moralizing (AI over-explains — score LOW)
| # | Question | Scale | Target |
|---|----------|-------|--------|
| A1 | How explicitly does the text articulate its themes or morals? | 1–5 | ≤ 3 |
| A2 | Does the narrator explicitly comment on theme beyond the characters' perspectives? | yes/no | no |
| A3 | What share of dialogue scenes function as philosophical debate? | % | ≤ 25% |
| A4 | How heavily are moral/philosophical questions foregrounded? | 1–5 | ≤ 3 |
| A5 | [BOOK] To what extent do ALL subplots and flourishes serve one central theme? | 1–5 | ≤ 4 (some looseness required) |

## B. Plot shape (AI is tidy — score MESSY)
| # | Question | Scale | Target |
|---|----------|-------|--------|
| B1 | [BOOK] How many subplots exist, and what are their integration modes? | count/list | ≥ 2; not all thematically parallel |
| B2 | How continuous is the causal chain from inciting incident to ending? | 1–5 | ≤ 4 (breaks, coincidence, dead ends present) |
| B3 | [BOOK] Is resolution driven by protagonist choice, external events, or mixed — per arc? | per-arc list | varied; not all protagonist_choice |
| B4 | [BOOK] How many arcs resolve via quiet internal acceptance/understanding? | count | ≤ 1 |
| B5 | Are the protagonist's key choices framed as morally clear or ambivalent? | clear/ambivalent | ambivalent in most arcs |
| B6 | [BOOK] Are there intentional loose ends left unresolved? | count | ≥ 1 per act (cross-check the loose-end ledger) |

## C. Time (humans subvert linearity — score NONLINEAR)
| # | Question | Scale | Target |
|---|----------|-------|--------|
| C1 | How often does the narrative jump across time? | 1–5 | ≥ 2.5 |
| C2 | How heavily does it use flashback/flash-forward? | 1–5 | ≥ 2.5 |
| C3 | Does any revelation force reinterpretation of earlier scenes? | 1–5 | ≥ 3 at book level |
| C4 | Are time jumps used to *stage* revelations (delayed disclosure)? | 1–5 | ≥ 2 |
| C5 | Does narrator temporal distance vary across chapters? | yes/no | yes |

## D. Emotion & senses (AI over-writes the body — score MIXED) [SCAN assists]
| # | Question | Scale | Target |
|---|----------|-------|--------|
| D1 | Dominant emotional expression mode? | label/behavioral/embodied | rotated; embodied NOT dominant |
| D2 | Are feelings sometimes plainly named ("she was afraid")? | yes/no | yes [SCAN] |
| D3 | Is smell used only where it earns its place? | yes/no | yes [SCAN] |
| D4 | Does the setting mirror characters' inner states? | 1–5 | ≤ 3 |
| D5 | Is sensory density uniform across scenes? | yes/no | no (varies with viscosity dial) |
| D6 | Depth of interior access — uniform or varied? | uniform/varied | varied |

## E. World engagement (humans name things — score SPECIFIC)
| # | Question | Scale | Target |
|---|----------|-------|--------|
| E1 | Are there explicit NAMED references to works/brands/places/songs (real or in-world)? | count | present; not only vague allusions |
| E2 | How many distinct physical locales does the story inhabit? | count | more than minimum required |
| E3 | Does the narrative voice ever acknowledge a reader/audience (where genre permits)? | 0–4 | dial deliberately set, logged in structure_plan |

## F. Craft surface (AI is uniform — score VARIED) [mostly SCAN]
| # | Question | Scale | Target |
|---|----------|-------|--------|
| F1 | Dialogue-to-narration proportion | 1–5 | ≥ 3 [SCAN] |
| F2 | Sentence-length variance | CV | ≥ 0.5 [SCAN] |
| F3 | How is the central character introduced? | external_desc/in-action/in-dialogue/inner_thought | NOT external description |
| F4 | Opening grounding: spatial establishing shot? | yes/no | varies by chapter; not always yes |
| F5 | Event escalation contour across chapters | flat/monotonic/uneven | uneven |
| F6 | Is there an epilogue? | yes/no | only if structure_plan called for it |
| F7 | Does any chapter shift narrative register from its neighbors? | yes/no | yes |

## Verdict template
For each failed item: **item id → quoted evidence → routed fix** (structural items route to Stage 02 revision; prose items to Stage 03 redraft). Summarize as:
- `PASS` — ship to Stage 05
- `PROSE REWORK` — Stage 03 targeted redraft
- `STRUCTURE REWORK` — Stage 02 re-plan (these are the failures style editing cannot fix)

# Output Template & Continuity Tracker Router (Layer 3)

Per ICM §3.2, agents consult this index to instantiate schema skeletons per stage and genre rather than inlining every template into prompt memory.

---

## 1. Universal Planning Templates (Stage 02)

| Template | Output Path | Purpose |
|---|---|---|
| `foolscap.template.md` | `stages/02_planning/output/foolscap.md` | One-page narrative architecture (commandments, theme). |
| `outline.template.md` | `stages/02_planning/output/outline.md` | Beat-sheet outline expanding foolscap. |
| `structure_plan.template.md` | `stages/02_planning/output/structure_plan.md` | Scene ledger, subplots, escalation, dials. |
| `character_arcs.template.md` | `stages/02_planning/output/character_arcs.md` | Cast arcs, lie/truth schedules, resolution. |
| `scene_beat.template.md` | `stages/02_planning/output/beats/chNN.md` | Granular 5-commandments, addiction loop. |
| `manuscript.template.json` | `manuscript.json` | Central per-chapter production ledger. |
| `canon.template.md` | `stages/02_planning/output/canon.md` | Living verified and unverified fact registry. |
| `voice_exemplars.template.md` | `stages/02_planning/output/voice_exemplars.md` | POV registers and anti-drift prose targets. |
| `tracker_lore_debt.template.md` | `stages/02_planning/output/trackers/lore_debt.md` | Narrative questions and payoff ledger. |
| `threads.template.md` | `stages/02_planning/output/trackers/threads.md` | Narrative threads and subplot tracker. |

---

## 2. Genre-Conditional Continuity Trackers

Instantiate only the tracker matching the active genre (from `preferences.json`):

| Genre / Mode | Tracker Template | Output Path | Focus |
|---|---|---|---|
| **Romance / Romantasy** | `tracker_romance_heat_ladder.template.md` | `stages/02_planning/output/trackers/heat_ladder.md` | 11-step intimacy ladder, grovel debt. |
| **Fantasy / Progression / Thriller** | `tracker_power_escalation.template.md` | `stages/02_planning/output/trackers/power_escalation.md` | Advancement tiers, upgrades (4–6 ch). |
| **Mystery / Detective / Noir** | `tracker_fair_play_clues.template.md` | `stages/02_planning/output/trackers/fair_play_clues.md` | Planted clues, suspect & alibi grid. |
| **Unlisted / Universal** | *None* | *None* | Use core `tracker_lore_debt.md` only. |

# Output Template & Continuity Tracker Router (Layer 3)

Per ICM §3.2, agents consult this index to instantiate schema skeletons per stage and genre rather than inlining every template into prompt memory.

---

## 1. Universal Planning Templates (Stage 02)

| Template | Output Path | Purpose |
|---|---|---|
| `foolscap.template.md` | `stages/02_planning/output/foolscap.md` | One-page narrative architecture (commandments, movements, theme). |
| `outline.template.md` | `stages/02_planning/output/outline.md` | Beat-sheet outline expanding foolscap into scenes. |
| `structure_plan.template.md` | `stages/02_planning/output/structure_plan.md` | Obligatory-scene ledger, subplots, escalation contour, dials. |
| `character_arcs.template.md` | `stages/02_planning/output/character_arcs.md` | Cast arc classification, lie/truth schedules, resolution modes. |
| `scene_beat.template.md` | `stages/02_planning/output/beats/chNN.md` | Granular 5-commandments, addiction loop, camera viscosity. |
| `manuscript.template.json` | `manuscript.json` | Central production ledger driving per-chapter loops. |
| `canon.template.md` | `stages/02_planning/output/canon.md` | Living verified and unverified story fact registry. |
| `voice_exemplars.template.md` | `stages/02_planning/output/voice_exemplars.md` | POV voice registers and anti-drift prose targets. |
| `tracker_lore_debt.template.md` | `stages/02_planning/output/trackers/lore_debt.md` | Narrative questions and payoff debt ledger. |

---

## 2. Genre-Conditional Continuity Trackers

Instantiate only the tracker matching the active genre (from `preferences.json`):

| Genre / Mode | Tracker Template | Output Path | Focus |
|---|---|---|---|
| **Romance / Romantasy** | `tracker_romance_heat_ladder.template.md` | `stages/02_planning/output/trackers/heat_ladder.md` | 11-step intimacy ladder, grovel debt calculator. |
| **Epic Fantasy / Multi-POV / Progression / Thriller** | `tracker_power_escalation.template.md` | `stages/02_planning/output/trackers/power_escalation.md` | Advancement tiers, metronomic upgrades (4–6 ch). |
| **Mystery / Detective / Cozy / Noir** | `tracker_fair_play_clues.template.md` | `stages/02_planning/output/trackers/fair_play_clues.md` | 3+ planted clues, suspect & alibi grid, dual timeline. |
| **Unlisted / Universal** | *None* | *None* | Use core `tracker_lore_debt.md` only. |

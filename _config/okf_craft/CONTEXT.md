# OKF Narrative Craft Knowledge Router (Layer 3)

This router acts as the Layer 3 decision matrix for the SAGA & Soundboard workspace. Per ICM §3.2 (Footnote 4), agents and pipeline scripts consult this decision table to load only the 2–4 targeted craft modules required for the specific genre, stage, scope, or diagnostic failure, never inlining the entire 80+ module library.

---

## 1. Stage-Based Craft Routing Table

| Stage | Default Core Modules to Consult | Token Footprint |
|---|---|---|
| **01 Onboarding** | `universal_narrative_lexicon_rosetta_stone.md`, `anthropological_worldbuilding.md` | ~2,200 tok |
| **02 Planning (Macro)** | `story_grid_macro.md`, `four_corner_opposition_and_foil_matrix.md`, `nonlinear_timeline_framework.md` | ~1,800 tok |
| **02 Planning (Beats)** | `scene_level_five_commandments_coyne.md`, `cpocl_plan_threat_conflict_engine.md` | ~1,500 tok |
| **03 Drafting (Prose)** | `psychic_distance_and_narrative_zoom.md`, `three_registers_of_dialogue_subtext.md`, `swain_mru_and_pacing_velocity_equations.md` | ~1,900 tok |
| **04 Diagnostics & Edits** | `full_manuscript_continuity_pass_methodology.md`, `adversarial_prose_auditing_and_slop_filtering.md` | ~1,100 tok |

---

## 2. Genre-Specific Reference Decision Table

When planning or drafting in a specific genre, load the matching genre pair:

| Genre / Mode | Primary Craft Modules | Secondary / Complementary |
|---|---|---|
| **Thriller / Suspense** | `thriller_escalation_pacing.md`, `hitchcock_bomb_suspense.md` | `murch_rule_of_six_pacing.md` |
| **Mystery / Detective** | `fair_play_whodunit_rules.md`, `red_herring_misdirection_matrix.md` | `police_procedural_evidentiary_and_institutional_engine.md` |
| **Romance / Romantasy** | `romance_escalation_ladder.md`, `dark_romantasy_touch_her_and_die.md` | `status_transactions_and_dominance_choreography.md` |
| **Horror / Weird Fiction** | `cosmic_horror_existential_dread.md`, `procedural_dread_and_administrative_terror.md` | `surreal_atmosphere_dream_logic.md` |
| **Sci-Fi / Dystopian** | `dystopian_systemic_tension.md`, `emergent_ai_and_synthetic_archetypes.md` | `non_human_cognitive_narration.md` |
| **Epic Fantasy / Multi-POV**| `epic_fantasy_polyphonic_convergence_and_avalanche.md`, `courtly_intrigue_political_web.md` | `multi_pov_structure.md` |
| **Noir / Crime** | `noir_hardboiled_fatalism.md`, `tragic_flaw_investigation_chinatown.md` | `anti_hero_moral_ambiguity.md` |
| **Adventure / Survival** | `adventure_quest_survival_dynamics.md`, `cpocl_plan_threat_conflict_engine.md` | `mythic_archetypal_journey.md` |
| **Comedy / Satire** | `comedy_farce_and_satirical_timing_engine.md`, `satirical_escalation_blueprint.md` | `irony_typology_and_lateral_omission_paralipsis.md` |
| **Non-Western / Kishōtenketsu** | `kishotenketsu_four_act_non_conflict_structure.md` *(Conflicts with standard Western 3-act)* | `dual_track_counterpoint_narrative.md` |

---

## 3. Diagnostic Remediation Routing

When automated audits or rubric evaluations flag issues, route directly to the corrective craft module:

| Audit Flag / Symptom | Target Remediation Module | Key Mechanism |
|---|---|---|
| **Rhythm Monotony / Low CV** | `prose_syntax_and_acoustic_cadence.md` | Christensen cumulative syntax, Provost cadence variation |
| **Melodramatic Emotion / Embodied Overuse** | `free_indirect_discourse_and_voice_blending.md` | Shift from physical cliches to internal perception & tone |
| **Flat Dialogue / Stilted Talk** | `three_registers_of_dialogue_subtext.md` | Text vs Subtext vs Inchoate, status games |
| **Sagging Middle / Loss of Tension** | `murch_rule_of_six_pacing.md`, `thriller_escalation_pacing.md` | Value shift compression, cutting informational beats |
| **Predictable AI Default Plots** | `four_corner_opposition_and_foil_matrix.md` | Generate 3 candidates, eliminate predictable middle |
| **Lore Dump / Clunky Exposition** | `primitive_epistemic_asymmetry.md` | Filter lore strictly through character stakes and ignorance |
| **Lack of Suspense in Threat Scenes** | `hitchcock_bomb_suspense.md` | Show the ticking clock early rather than relying on jump-scares |
| **Unearned Moral Acceptance** | `anti_hero_moral_ambiguity.md` | Preserve moral friction; resist neat thematic wrapping |

---

## 4. Graph Cross-Link Hub

For deep dives across the knowledge graph, traverse along these core thematic axes:
- **Character Depth Axis:** `archetypal_character_transformation_arcs.md` ↔ `enneagram_character_fixations_and_disintegration.md` ↔ `jungian_archetypes_and_shadow_integration.md` ↔ `vogler_mythic_character_masks.md`
- **Dramatic Architecture Axis:** `story_grid_macro.md` ↔ `scene_level_five_commandments_coyne.md` ↔ `primitive_dialectic_value_shift.md` ↔ `chekhovs_gun_and_plant_payoff.md`
- **Voice & Texture Axis:** `psychic_distance_and_narrative_zoom.md` ↔ `free_indirect_discourse_and_voice_blending.md` ↔ `syntactic_symbolism_and_cumulative_sentence_rhetoric.md`

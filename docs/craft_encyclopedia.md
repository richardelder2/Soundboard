# The 92-Module Narrative Craft Encyclopedia & Rosetta Stone

## Overview: Literature as an Engineered Art

Soundboard ships with a self-validating, token-disciplined library of **92 narrative craft modules** located in `_config/okf_craft/`. Rather than relying on generic LLM instincts, Soundboard provides your conversational agent with explicit, codified dramaturgical equations from the masters of the craft.

Every module adheres to the **Open Knowledge Format (OKF)**:
- **Token Disciplined:** Strict budget ceiling ($\le 750$ words, $\le 900$ tokens) to minimize context window bloat.
- **Machine-Searchable:** Annotated with YAML frontmatter declaring active pipeline stages (`stages:`), functional subtype (`subtype:`), and heuristic confidence.
- **Concrete & Actionable:** Contains worked formulas, diagnostic rubrics, and direct examples rather than vague theoretical advice.

---

## The Masters & Theoretical Lineage

The craft library synthesizes decades of foundational narratology, dramaturgy, and commercial storytelling frameworks:

| Master / Source | Core Contribution in Soundboard | Key Modules |
|---|---|---|
| **Shawn Coyne** (*The Story Grid*) | Macro story math, 5 Commandments of the Micro-Scene, value shifts, obligatory scene ledgers. | `scene_level_five_commandments_coyne.md`, `story_grid_macro.md` |
| **John Truby** (*The Anatomy of Story*) | Designing principles, moral arguments vs. plot machinery, 22-step building blocks, 4-corner opposition. | `truby_designing_principle_and_moral_argument.md`, `four_corner_opposition_and_foil_matrix.md` |
| **Brandon Sanderson** | Laws of magic system engineering, resource attrition, escalating costs, foreshadowing payoffs. | `sandersons_laws_of_magic_and_magic_system_engineering.md`, `chekhovs_gun_and_plant_payoff.md` |
| **K.M. Weiland** | Character arc anatomy: the Lie the character believes, the Wound, the Want vs. the Need. | `character_arc_anatomy_lie_wound_want_need.md`, `archetypal_character_transformation_arcs.md` |
| **Dwight Swain** (*Techniques of the Selling Writer*) | Motivation-Reaction Units (MRUs), pacing velocity equations, micro-compression curves. | `swain_mru_and_pacing_velocity_equations.md`, `chapter_architecture_and_ending_hooks.md` |
| **Virginia Tufte & Francis Christensen** | Cumulative sentence rhetoric, syntactic symbolism, cadence variance, musical phonosemantics. | `syntactic_symbolism_and_cumulative_sentence_rhetoric.md`, `prose_syntax_and_acoustic_cadence.md` |
| **Gérard Genette** (*Narrative Discourse*) | Focalization levels (zero, internal, external), anachrony, prolepsis, psychic distance zoom. | `primitive_focalization_filter_levels.md`, `psychic_distance_and_narrative_zoom.md` |
| **Keith Johnstone** (*Impro*) | Status transactions, dominance choreography, physical staging, conversational seesaws. | `status_transactions_and_dominance_choreography.md`, `three_registers_of_dialogue_subtext.md` |
| **Walter Murch** (*In the Blink of an Eye*) | The Rule of Six for narrative cutting, scene transitions, and rhythm pacing. | `murch_rule_of_six_pacing.md` |

---

## The Universal Narrative Lexicon Rosetta Stone

Authors arrive with diverse craft vocabularies: some plan using *Save the Cat!*, others follow *The Hero's Journey*, *Story Grid*, or *Dan Harmon's Story Circle*. 

Soundboard never forces an author to learn internal taxonomy. Located in `_config/okf_craft/universal_narrative_lexicon_rosetta_stone.md`, the **Rosetta Stone** provides bi-directional translation across major narrative schools:

| Story Grid (Coyne) | Save the Cat! (Snyder) | Hero's Journey (Campbell/Vogler) | Harmon Story Circle | Truby (22 Building Blocks) | First-Principles Structural Mechanics |
|---|---|---|---|---|---|
| **Inciting Incident** | Catalyst (10%) | Call to Adventure | Need (You) | Inciting Event | Initial equilibrium disrupted; irreversible value disturbance. |
| **Progressive Complication** | Break into Two (20%) | Crossing the Threshold | Go (Search) | Drive & Attacks by Opponent | Stakes scale upward; easier pathways eliminated. |
| **Crisis (Best Bad Choice)** | All Hope is Lost / Dark Night (75%) | The Ordeal / Supreme Crisis | Find & Take | Battle / Self-Revelation | Decision under irreconcilable value conflict. |
| **Climax** | Break into Three (80%) | The Resurrection | Return | Moral Choice | Core thematic thesis tested under active agency. |
| **Resolution** | Final Image (100%) | Return with Elixir | Change | New Equilibrium | The aftermath and lasting transformed state. |

When you speak to your AI agent in *Save the Cat!* terms ("Let's nail the 'All Hope is Lost' beat"), your agent mirrors your exact language while executing the underlying causal mechanics behind the scenes.

---

## Dynamic Symptom-Based Craft Search

Writers do not search for abstract narratological theories when stuck; they search by emotional and structural **symptoms**.

Soundboard includes an intelligent synonym expansion engine (`_config/okf_craft/synonyms.md`):
```bash
# Query by writer symptom:
node scripts/soundboard.js craft search "sagging middle"
```
The engine automatically maps "sagging middle" to related craft mechanics:
- `swain_mru_and_pacing_velocity_equations.md`
- `thriller_escalation_pacing.md`
- `status_transactions_and_dominance_choreography.md`
- `four_corner_opposition_and_foil_matrix.md`

Your agent leverages this system dynamically in chat whenever you express creative frustration, providing targeted, battle-tested solutions tailored to your story's immediate needs.

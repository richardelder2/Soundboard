---
type: okf_specification
title: SAGA-ICM Open Knowledge Format (OKF) Specification
version: 0.3.0
updated: 2026-09-05
---

# SAGA-ICM Open Knowledge Format (OKF) Specification

This document defines the schema rules, frontmatter standards, routing taxonomies, and linking conventions for all narrative craft knowledge assets in Soundboard and SAGA-ICM.

## 1. Core Principles

1. **Vendor-Neutral & Portable:** All knowledge assets are plain UTF-8 Markdown files with YAML frontmatter. No BOM, LF endings.
2. **Mandatory Type & Identity:** Every OKF file MUST contain a `type` field and unique `id` matching its file basename (without `.md`).
3. **Graph-Traversable:** Entities cross-reference each other using standard Markdown link syntax (`[Elena](../characters/elena.md)`) and explicit `requires` / `conflicts_with` frontmatter arrays.
4. **Minimal Token Footprint:** Individual concept files should be focused and concise (target < 600 tokens / ~450 words, maximum 900 tokens).
5. **Machine-Readable Routing Frontmatter:** Every craft module declares its applicability across stages, genres, scope, capabilities, diagnostics, and keywords.
6. **Catalog & Router Coverage:** Every module MUST appear in the auto-indexed `index.md` catalog and be routed in `_config/okf_craft/CONTEXT.md` (or declare `routing: implicit`).

---

## 2. Frozen Routing Taxonomy (Closed Vocabulary)

Every craft module in `_config/okf_craft/` MUST adhere strictly to the following closed vocabulary:

### A. Stages (`stages: [...]`)
Legal values (empty not allowed; must assign to at least one stage):
- `01_onboarding` — Worldbuilding, cast design, thematic premise, trope discovery.
- `02_planning` — Macro structure, beat sheets, obligatory scenes, continuity tracking.
- `03_drafting` — Prose generation, scene construction, dialogue, sensory grounding.
- `04_diagnostics_edits` — Line editing, rhythm auditing, continuity verification, macro revision.
- `05_publishing` — Manuscript compilation, front/back matter, formatting.

### B. Genres (`genres: [...]`)
Legal values (use empty array `[]` for universal / cross-genre craft principles):
- `thriller_suspense`
- `mystery_detective`
- `romance_romantasy`
- `horror_weird`
- `scifi_dystopian`
- `epic_fantasy`
- `noir_crime`
- `adventure_survival`
- `comedy_satire`
- `kishotenketsu`

### C. Structural Scope (`scope: <value>`)
Exact single enum value:
- `book` — Macro architecture spanning the entire novel/series.
- `chapter` — Structural containers, escalation steps, hooks.
- `scene` — Local dramatic units, 5 commandments, micro value shifts.
- `sentence` — Syntax, acoustic cadence, diction, line-level craft.

### D. Subtype (`subtype: <value>`)
Exact single enum value:
- `genre_convention` — Obligatory genre tropes, reader contracts, archetype matrices.
- `plot_template` — Structural sequence maps (Story Grid, 3-Act, Save the Cat, Kishotenketsu).
- `character_engine` — Psychology, arc mechanics, opposing foils, status transactions.
- `narrative_mode` — POV, focalization, psychic distance, nonlinear timeframes.
- `dialectic_pattern` — Thematic opposing truths, moral ambiguity, philosophy in action.
- `pacing_rhythm` — Velocity equations, MRU units, scene-sequel cadences.
- `prose_style` — Sentence syntax, anti-tell filters, sensory budgets, subtext registers.

### E. Confidence (`confidence: <value>`)
Exact single enum value:
- `peer_reviewed` — Supported by computational narratology or empirical literature research (e.g. Genette, StoryScope).
- `practitioner_method` — Industry-standard professional craft doctrines (McKee, Coyne, Swain, Truby, Snyder, Murch).
- `workshop_heuristic` — Practical rule of thumb refined through editorial workshops.

### F. Diagnostics (`diagnostics: [...]`)
Recognized automated and manual audit tools/flags:
- `rhythm` — Sentence length CV and acoustic variation.
- `dread` — Pacing acceleration and tension contours.
- `lore_density` — Information dump vs character stakes filtration.
- `sensory_anchor` — 5-sense grounding and olfactory budget.
- `lexical_tells` — Density-normalized AI slop and filter word scanner.
- `dialogue_ratio` — Proportion of spoken dialogue vs exposition.
- `voice_drift` — POV register consistency and trailing anchor match.
- `narrative_audit` — Full automated Chapter Audit script (`scripts/narrative_audit.js`).
- `continuity` — Proper noun and fact consistency scanner (`scripts/continuity_scan.js`).

### G. Graph Relations & Search
- `provides`: Array of 2–5 snake_case capability tags delivered by this module.
- `requires`: Array of module IDs (must match existing filenames in `_config/okf_craft/` without `.md`).
- `conflicts_with`: (Optional) Array of conflicting module IDs (e.g. `kishotenketsu_four_act_non_conflict_structure` conflicts with standard Western 3-act).
- `keywords`: Array of 4–8 author-facing search phrases used for retrieval and discovery.
- `routing`: (Optional) Set to `implicit` if module is an underlying primitive accessed only via dependency graph.

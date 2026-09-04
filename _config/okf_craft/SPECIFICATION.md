---
type: okf_specification
title: SAGA-ICM Open Knowledge Format (OKF) Specification
version: 0.2.0
updated: 2026-09-04
---

# SAGA-ICM Open Knowledge Format (OKF) Specification

This document defines the schema rules, frontmatter standards, and linking conventions for all knowledge assets in SAGA-ICM.

## 1. Core Principles

1. **Vendor-Neutral & Portable:** All knowledge assets are plain UTF-8 Markdown files with YAML frontmatter.
2. **Mandatory Type Field:** Every OKF file MUST contain a `type` field in its frontmatter.
3. **Graph-Traversable:** Entities cross-reference each other using standard Markdown link syntax (`[Elena](../characters/elena.md)`).
4. **Minimal Token Footprint:** Individual concept files should be focused and concise (aim for < 600 tokens per file).
5. **Catalog Indexing:** Every bundle directory includes an auto-generated or easily maintained `index.md` mapping concepts by type.

## 2. Standard Entity Types

### A. Static Craft Bundle (`_config/okf_craft/`)
- `type: craft_structure`: Macro narrative architectures (Story Grid, Harmon Circle, 3-Act).
- `type: trope_stack`: Standardized genre trope bundles with obligatory scenes.
- `type: craft_rule`: Computational narratology rules (anti-tell dials, sensory budgets, subtext guidelines).
- `type: dialectic_pattern`: Theme vs. counter-theme dialectic frameworks.

### B. Dynamic Project Bundle (`stages/01_onboarding/output/` and sub-stages)
- `type: character`: Character arc engines, voices, and surface traits.
- `type: setting`: Location, atmosphere, sensory anchors, and technological/magic rules.
- `type: faction`: Organizations, allegiances, goals, and internal tensions.
- `type: canon_entry`: Verified or unverified established story facts (`canon.md`).
- `type: scene_beat`: Granular scene-level planning units with value shifts and conflicts.
- `type: chapter_record`: Production ledger entry tracked in `manuscript.json`.

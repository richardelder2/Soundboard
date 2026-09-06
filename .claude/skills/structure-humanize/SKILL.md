---
name: structure-humanize
description: Diagnose and repair STRUCTURAL AI tells in an existing draft — explained themes, missing subplots, all-linear time, uniform resolutions, flat escalation — the tells that survive style editing. Use when the user says a finished draft still feels AI despite prose polish, asks to humanize the structure, restructure a story, fix the plot shape, or run a structural audit on existing chapters. For word/rhythm-level fixes use narrative-authenticity guidance or a prose-humanize pass instead.
---

# Structure Humanize

Style-level humanizing (removing cliché, purple prose, slop words) does NOT remove structural AI tells — detection drops less than 2 points after professional style editing (StoryScope, arXiv:2604.03136). This skill performs the structural rewrite that actually moves the needle. It is more invasive than a prose pass: it reorders scenes, adds subplots, and changes endings. Always present the diagnosis and get the user's approval of the revision map **before** rewriting anything.

## Procedure

### 1. Diagnose (read-only)
Score the draft against `_config/narrative_audit_rubric.md`, sections A–C, E, F (structural items). For each failed item record: item id, quoted evidence, severity. The highest-signal offenders, in order of detection weight:

1. **Theme explained** — narrator states the moral/lesson anywhere, especially chapter endings.
2. **No subplots** — single-track plot where every element serves the main arc.
3. **All-linear time** — no flashbacks, no delayed disclosure, no revelation that recontextualizes earlier scenes.
4. **Uniform resolutions** — every arc resolved by protagonist choice and/or quiet internal acceptance.
5. **Morally clean protagonist** — no choice a reader could reasonably condemn.
6. **No named references** — only vague allusions; nothing real or specifically named in-world.
7. **Flat escalation** — event intensity rises evenly to a tidy quiet ending; epilogue present by habit.

### 2. Propose a revision map
For each confirmed failure, propose the *minimal structural intervention*, e.g.:
- Cut theme-stating sentences outright (deletion, not paraphrase — paraphrased moralizing is still moralizing).
- Promote an existing minor character or background detail into a subplot rather than inventing from nothing; let one subplot stay loose or contrasting.
- Re-stage one revelation out of order: move the disclosure scene later and open on its aftermath, so earlier scenes reread differently.
- Convert one resolution to external fate, another to unresolved.
- Give the protagonist one defensible-but-condemnable decision with real cost.
- Replace two vague allusions with named works/places (real, or invented-but-named in-world).
- Re-contour escalation: mark one chapter to deflate, one to spike; delete habitual epilogue.

Present the map as a table (failure → intervention → affected chapters/scenes) and **wait for user approval**.

### 3. Execute
Apply approved interventions chapter by chapter, preserving voice, characters, and all content the diagnosis didn't flag. After rewriting, re-run the rubric on changed sections and `node scripts/saga.js audit` for prose regressions, and update `stages/02_planning/output/structure_plan.md` so the plan matches the new reality.

## Cautions
- Change structure, not voice: this pass must not introduce new prose tells (check the Layer 2 rules in `_config/narrative_authenticity.md` while rewriting).
- Not every draft needs every fix — an intervention that fights the story's genre contract (e.g., romance requires the ending to resolve) should be flagged, not forced. If the project has a genre bible, its obligatory-scene ledger in `structure_plan.md` is untouchable: interventions reshape the tissue between ledgered beats, never the beats themselves (see `setup/genre_bibles/INDEX.md`).
- Respect intentional choices: check the structure plan's loose-end ledger and dial settings before "fixing" something the author chose.

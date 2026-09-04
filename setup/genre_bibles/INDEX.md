---
type: GenreBibleIndex
name: Genre Bible & Trope Stack Registry
description: Selector and usage contract for the genre series-bible templates. Consumed in Stage 01 (trope discovery) and Stage 02 (beat mapping).
last_modified: 2026-07-07
---

# Genre Bibles — Trope Stack Registry

Each bible is a fill-in series template for a commercial genre cluster: a flagship **trope stack** (the reader promise that goes in the blurb's first 40 words), a chapter-level **beat sheet** with obligatory scenes, and **continuity trackers**. Tropes are chosen here at *discovery*, scheduled at *planning*, and audited at *diagnostics*.

## The registry

| Bible | Flagship stack | Structure | Length |
|---|---|---|---|
| [romance_romantasy_dark.md](romance_romantasy_dark.md) | Enemies to Lovers + Forced Proximity + He Falls First (dark variant: Fated Mates + Morally Gray + Touch Her and Die) | 3–5 book series, same couple | ~100k / 38 ch |
| [romcom_summer_reads.md](romcom_summer_reads.md) | Small Town Return + Grumpy/Sunshine + Save-the-Shop (variant: Vacation Fling + Boss Reveal) | Interconnected standalones, town = brand | ~80k / 32 ch |
| [cozy_cottagecore_folksy.md](cozy_cottagecore_folksy.md) | Inherited Shop + Hedge Witch + Shop Cat (variant: Burnt-Out Professional cozy fantasy) | Rotating-protagonist village series | ~70k / 28 ch |
| [thriller_cozy_mystery.md](thriller_cozy_mystery.md) | A: Perfect-Life Lie + Gaslight Engine + Techno-Paranoia (standalone) · B: Hook Occupation + Festival Murder + Gossip Network + Pet Deputy (15-book cozy) | A: standalone pen-name · B: long series | A: ~85k / 45 ch · B: ~62k / 26 ch |
| [fantasy_scifi_horror.md](fantasy_scifi_horror.md) | A: Magic Academy + Bonded Beast + Enemies-to-Lovers · B: Progression + Military SF + Underdog Awakening · C: Folk Horror + Missing-Person Spine + Dual Timeline | A: trilogy+ · B: open series · C: standalone | 80–140k |

No exact match for the project's genre? Pick the *nearest chassis* and adapt (e.g., comfort hard sci-fi runs well on the cozy-fantasy variant's comfort contract plus Template B's technical-competence beats). The stack format is portable: **[dynamic] + [situation] + [flavor]**.

## How the pipeline consumes these

**Stage 01 — Trope discovery.** After the questionnaire, select the genre bible with the user and fill its SERIES BIBLE section together (every `[FIELD]` — the bibles' own rule applies: *if a field is hard to fill, the concept isn't ready*). Save the filled copy to `stages/01_onboarding/output/bible/genre_bible.md` and record the chosen trope stack in `preferences.json`.

**Stage 02 — Beat mapping.** The bible's beat sheet is the outline's chassis. Build the **obligatory-scene ledger** in `structure_plan.md`: every obligatory beat the stack promises (the one-bed beat, the bonding, the proof-object scene, the grovel, the cat's approval…) → scheduled chapter → delivered ✓/✗. Run the bible's trackers (lore-debt ledger, heat ladder, fair-play audit, comfort-contract audit) as living files in `stages/02_planning/output/`.

**Stage 04 — Trope delivery audit.** Verify every ledger entry was delivered on page, at roughly the beat sheet's position, at full strength.

## Tropes vs. the authenticity directive (read this twice)

`_config/narrative_authenticity.md` says human fiction subverts convention, resists tidy plots, and varies structure. The genre bibles say deliver the obligatory scenes on schedule. **Both are true, at different altitudes:**

- **The trope stack is a reader contract — never subvert it.** The HEA, the fair-play reveal, the cat's survival, the rank-up crescendo are the product. Skipping them isn't "human," it's a refund request. Genre fiction by humans delivers these beats too.
- **The authenticity rules govern the *telling between and inside* the beats.** Human genre novels hit the one-bed beat AND carry loose subplots, morally ambivalent leads, nonlinear disclosure, unexplained theme, uneven escalation. AI tells live in the connective tissue and the prose, not in the trope stack.
- Practical rule: an authenticity dial may never delete or invert a ledger entry; it may (and should) roughen everything around it. When the two genuinely collide (e.g., "ban the acceptance ending" vs. a genre's required warm resolution), the genre contract wins and the collision gets noted in `structure_plan.md`.

## Provenance note

These bibles reference companion documents from their source conversation ("Trope Master D5," "Playbook 02/03/05" — trend ledgers, launch calendars, merch pipelines). Those files are not in this repo; the references are kept intact so the docs can be reunited later. Nothing in the pipeline depends on them.

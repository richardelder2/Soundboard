---
type: StageContract
stage_id: "02_planning"
name: Beat Sheet Planning & Narrative Structures
inputs:
  - stages/01_onboarding/output/preferences.json
  - stages/01_onboarding/output/bible/
  - stages/01_onboarding/output/bible/genre_bible.md
  - stages/01_onboarding/output/characters/
  - _config/okf_craft/CONTEXT.md
  - _config/narrative_authenticity.md
outputs:
  - stages/02_planning/output/foolscap.md
  - stages/02_planning/output/outline.md
  - stages/02_planning/output/structure_plan.md
  - stages/02_planning/output/character_arcs.md
  - stages/02_planning/output/trackers/
  - stages/02_planning/output/beats/
  - stages/02_planning/output/canon.md
  - stages/02_planning/output/voice_exemplars.md
  - manuscript.json
templates:
  - _config/templates/CONTEXT.md
  - _config/templates/foolscap.template.md
  - _config/templates/structure_plan.template.md
  - _config/templates/scene_beat.template.md
  - _config/templates/manuscript.template.json
---

# Stage 02: Planning Beat Sheets

## Process
1. **Foolscap first** — fill `_config/templates/foolscap.template.md` → `stages/02_planning/output/foolscap.md`: whole book on one page (genres, trope stack, engine, controlling idea, 3 movements × 5 commandments, promised scenes). If it won't fit on one page, resolve with author before outlining. Later artifacts must agree.
2. **Outline expansion** — expand foolscap into beat structures in `stages/02_planning/output/outline.md` (see `_config/templates/CONTEXT.md`), following the filled genre bible beat sheet (`stages/01_onboarding/output/bible/genre_bible.md`).
3. **Trope Delivery Pass & Continuity Trackers** — schedule the reader contract in `stages/02_planning/output/structure_plan.md` (`_config/templates/structure_plan.template.md`):
   - Consult `_config/templates/CONTEXT.md` to identify universal tracker (`tracker_lore_debt.template.md`) and genre tracker (heat ladder, power escalation, fair play clues). Instantiate into `stages/02_planning/output/trackers/`.
   - Build **obligatory-scene ledger** in `structure_plan.md`: every trope beat → scheduled chapter → target position. Authenticity dials may roughen context but never delete or invert ledgered beats.
4. **Character Arc Pass** — write `stages/02_planning/output/character_arcs.md` (see `_config/templates/CONTEXT.md`):
   - Assign cast arc types (positive change / flat / disillusionment / corruption / static). Apply anti-default rule to ensemble mix.
   - Schedule 9 arc beats per arcing character mapped to chapters.
   - Cross-wire arc beats into scene beats and resolution variety table.
5. **Structural Authenticity Pass** — apply Layer 1 of `_config/narrative_authenticity.md` to outline and record in `structure_plan.md`:
   - Subplot map (≥2 subplots; ≥1 thematically loose/contrasting).
   - Nonlinearity plan (delayed disclosure, recontextualizing revelation).
   - Resolution variety table (arcs do not all resolve by protagonist choice).
   - Moral ambivalence beats (protagonist choices reader could condemn).
   - Intertextual anchors (named works, places, songs, brands).
   - Escalation contour (deliberately uneven line 1–5; no flat contours).
   - Loose-end ledger (threads intentionally left unresolved).
   - Anti-default decisions (§10): 3 candidates per major beat; discard first as AI default.
6. **Scene beat files** — create individual chapter beats in `stages/02_planning/output/beats/` from `_config/templates/scene_beat.template.md`:
   - Story Grid 5 Commandments & 4-Step Narrative Addiction Loop.
   - Viscosity (High, Medium, Low) varied per escalation contour.
   - Structural dials, obligatory-scene ledger entries, and arc beats.
7. **Initialize production ledger and living reference docs**:
   - `manuscript.json` (from `_config/templates/manuscript.template.json`).
   - `stages/02_planning/output/canon.md` (from `canon.template.md`).
   - `stages/02_planning/output/voice_exemplars.md` (from `voice_exemplars.template.md`).

## Verification
- `foolscap.md` exists, fits one page, and agrees with outline.
- `structure_plan.md` exists, follows template, contains obligatory-scene ledger and 3 candidates per major beat.
- `character_arcs.md` exists with ensemble map and beat schedules.
- `manuscript.json` exists with one entry per beat file; `canon.md` and `voice_exemplars.md` seeded.
- Required genre-conditional tracker instantiated in `stages/02_planning/output/trackers/`.

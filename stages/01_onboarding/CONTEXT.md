---
type: StageContract
stage_id: "01_onboarding"
name: Project Kickoff & Context Compilation
inputs:
  - setup/comfort_scifi_blueprint.md
  - setup/thriller_domestic_blueprint.md
  - setup/cozy_mystery_blueprint.md
  - setup/romance_romantasy_blueprint.md
  - setup/romcom_contemporary_blueprint.md
  - setup/cozy_fantasy_cottagecore_blueprint.md
  - setup/academy_fantasy_blueprint.md
  - setup/progression_military_scifi_blueprint.md
  - setup/folk_horror_blueprint.md
  - setup/genre_bibles/INDEX.md
outputs:
  - stages/01_onboarding/output/preferences.json
  - stages/01_onboarding/output/bible/world_bible.md
  - stages/01_onboarding/output/bible/genre_bible.md
  - stages/01_onboarding/output/bible/locations/
  - stages/01_onboarding/output/bible/factions/
  - stages/01_onboarding/output/characters/
templates:
  - _config/templates/world_bible.template.md
  - _config/templates/character.template.md
  - _config/templates/location.template.md
  - _config/templates/faction.template.md
  - _config/templates/magic_tech_system.template.md
  - _config/templates/timeline.template.md
  - _config/templates/sensory_lexicon.template.md
---

# Stage 01: Onboarding Context

## 📁 Workspace Isolation Rule: One Book = One Dedicated Folder
**Every novel project MUST exist in its own dedicated workspace folder.** Never write novel artifacts or draft chapters directly inside the Soundboard engine/template repository.
- **Check Workspace Context:** Before launching the onboarding interview, verify if the agent is operating inside the root Soundboard tool repository or a dedicated book folder.
- **Scaffold Dedicated Folder:** If starting a new novel from the root tool repository, determine the project title or directory name with the author and scaffold the book vault: `node scripts/soundboard.js init <folder_path>`.
- **Target Outputs to Project Vault:** All onboarding artifacts (`preferences.json`, `world_bible.md`, `genre_bible.md`, `characters/`) and downstream stages belong strictly inside that novel's dedicated folder.

Three execution paths produce **identical artifacts**. Path A is preferred whenever an agent harness (Claude Code, Codex, Antigravity, …) is present; Path B is the fallback for terminal-only or headless use; Path C applies whenever the author arrives with existing material — which is often.

## Path A — Agent-led interview (no API key required)
1. Load the active questionnaire blueprint from `setup/` (default: `comfort_scifi_blueprint.md`; honor the user's choice of any other blueprint).
2. Ask the blueprint's questions **one at a time in chat**, in order. After each answer, play the blueprint's coach persona yourself (for the sci-fi blueprint: encouraging, validates hard-science plausibility, ≤ 3 sentences of feedback) — then ask the next question. Adaptive follow-ups are allowed; skipping questions is not.
3. Reserve the blueprint's final synthesis items for the end: synthesize all answers into the concept summary + logline, present them for approval, and revise until approved.
4. Continue to Trope Discovery (below), then write the Output Artifacts exactly as specified.

## Path B — Terminal wizard (needs a model backend in `.env`)
1. Run `node scripts/soundboard.js wizard onboard [--blueprint=<name>]`.
2. The wizard asks the same questions via readline, coaches via the configured model, and writes the same artifacts (steps 3–4 of Path A still apply if run inside an agent session afterward).

## Path C — Intake of existing material (agent-led)
Authors rarely arrive empty-handed: a synopsis, a foolscap, character sheets, a pinboard of notes, even drafted chapters. The artifacts are the contract; the interview is only one route to them.
1. **Inventory** everything provided. For each piece, identify which pipeline artifact(s) it feeds (synopsis → world bible + foolscap; character notes → character profiles; a draft chapter → chapter + canon facts + voice exemplars).
2. **Normalize, don't paraphrase away.** Move content into the standard artifact formats, preserving the author's own wording wherever it carries voice or specificity. Note provenance (`source: author's original synopsis`) in frontmatter.
3. **Diff against required fields** (blueprint questions, genre-bible `[FIELD]`s, character template). Interview ONLY the gaps — never re-ask what the material already answers; confirm inferences instead ("your notes imply first person past — correct?").
4. **If drafts exist:** register them in `manuscript.json` as `status: drafted`, harvest hard facts into `canon.md` tagged `[unverified chN]`, reverse-engineer their beat sheets, and queue them for the full Stage 04 audit. Existing prose is input, never exempt.
5. Present the normalized artifact set to the author for confirmation before Stage 02.

## Trope Discovery (both paths, agent-led)
1. Open `setup/genre_bibles/INDEX.md`; select the genre bible matching the project (or the nearest chassis, adapted).
2. Confirm the **trope stack** with the user — [dynamic] + [situation] + [flavor] — or assemble a custom stack in that format.
3. Fill the bible's SERIES BIBLE section with the user, every `[FIELD]`. Apply the bibles' own gate: *if a field is hard to fill, the concept isn't ready* — loop back rather than leaving blanks.

## Output Artifacts (exact conventions — Stage 02 depends on these)
1. **`output/preferences.json`**:
   ```json
   {
     "blueprint": "setup/<blueprint file>",
     "genre_bible": "setup/genre_bibles/<bible file>",
     "trope_stack": "<dynamic> + <situation> + <flavor>",
     "responses": [ { "question": "...", "answer": "..." } ],
     "synthesis": "<approved concept summary>",
     "logline": "<approved logline>"
   }
   ```
2. **`output/bible/world_bible.md`** — frontmatter `type: WorldBible`, `genre`, `focus`, `last_modified`; body = the approved synthesis grouped into: Core Tech & World Rules · Setting & Aesthetic · Character Dynamics · Central Emergency & Stakes.
3. **`output/bible/genre_bible.md`** — the chosen genre bible template with every `[FIELD]` filled.
4. **`output/characters/<name>.md`** (one per significant character) — from `_config/templates/character.template.md`: role, **arc_type** (positive change / flat / disillusionment / corruption / static), the arc engine (want / need / wound / lie / truth), introduction mode, voice register + sample lines. During the interview, listen for arc raw material — the wound and the lie usually surface in answers about flaws and blindspots; capture them in the character's own fields, and let Stage 02's Character Arc Pass make the arc-type call with the author.


---
type: StageContract
stage_id: "03_drafting"
name: Sensory Drafting
inputs:
  - stages/02_planning/output/beats/
  - stages/02_planning/output/structure_plan.md
  - stages/02_planning/output/character_arcs.md
  - stages/02_planning/output/canon.md
  - stages/02_planning/output/voice_exemplars.md
  - manuscript.json
  - _config/voice.md
  - _config/narrative_authenticity.md
outputs:
  - stages/03_drafting/output/chapters/
---

# Stage 03: Drafting Prose

## Process
1. **Load the chapter kit** for the target chapter (the next `status: planned` entry in `manuscript.json`, unless the user names one):
   - Its beat sheet from `stages/02_planning/output/beats/` and its `structure_plan.md` entries (escalation value, anachrony, subplot touchpoints, ledgered obligatory scenes).
   - Its **arc beats** from `character_arcs.md`: which characters' interior beats land in this chapter and what each must show. Arc beats surface through choice, behavior, and image — never through the narrator naming the lie, the truth, or the lesson.
   - **Canon** (`stages/02_planning/output/canon.md`): every fact drafted must agree with it — names/spellings, world rules, object states, numbers, timeline, who-knows-what.
   - **Voice kit** (anti-drift, mandatory): `voice_exemplars.md` PLUS the final ~500 words of the previous chapter's draft. Calibrate to these before writing a word; they are targets, not text to copy.
2. **Execute the Drafting Pathway**:
   - **Path A (Agent-Drafted):** Generate active, sensory prose following the beats, the style guide (`_config/voice.md`), and **Layer 2 (prose rules) of `_config/narrative_authenticity.md`**. In particular:
      - Rotate emotion modes: explicit label / behavioral cue / embodied sensation. Embodied carries at most ~2 of 5 emotion beats; plainly naming a feeling is allowed and encouraged.
      - Sensory budget: one or two senses per scene, chosen by POV relevance; smell only when it earns its place.
      - Introduce characters in action or dialogue, not external description.
      - Setting stays mostly indifferent to mood — no reflexive pathetic fallacy.
      - Prefer dialogue over narration when either would work; let characters interrupt and talk past each other.
      - The narrator never states the theme or the lesson.
      - Vary sentence and paragraph length aggressively; ration triads and em-dashes.
      - Apply Layer 3 fingerprint counters (escalation contour, register shifts between chapters, no unplanned epilogue).
   - **Path B (Author-Drafted / Workspace Custodian):** If the author is writing the prose directly:
      - The agent stands down from text generation.
      - The agent monitors the workspace, auto-detects newly created drafts or raw text, moves them to the correct output path declared in `manuscript.json`, formats them with proper template frontmatter, and archives previous revisions.
3. **Fact Harvesting & Bookkeeping** (required before the chapter counts as drafted):
   - **Fact Harvesting:** Read the final draft (from either Path A or Path B). Identify any new hard facts established (names, numbers, physical attributes, timeline dates, object states). Append these to `canon.md` tagged `[unverified chN]`.
   - **Ledger Update:** Count the chapter's words, update the word counts and metadata, and change the chapter's `status` to `drafted` in `manuscript.json`.
4. **Self-check**: Run `node scripts/soundboard.js audit` on the new chapter. If Path A, resolve red flags automatically. If Path B, compile the audit findings and present them gently to the author as editorial feedback.


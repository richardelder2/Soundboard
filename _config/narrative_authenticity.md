---
type: StyleGuide
name: Narrative Authenticity Directive
source: "StoryScope core features (Russell et al., arXiv:2604.03136) + known lexical tells"
applies_to: [02_planning, 03_drafting, 04_diagnostics_edits]
layers: [structural, prose, model_fingerprint]
last_modified: 2026-07-07
---

# Narrative Authenticity Directive

AI fiction is detectable at two layers. **Prose tells** (word choice, rhythm, cliché) can be edited out after drafting. **Structural tells** (plot shape, time handling, theme delivery) cannot — research shows AI stories remain detectable at ~94% accuracy from narrative structure alone, *even after professional style editing*. Structure must therefore be fixed at the planning stage, prose at the drafting stage.

## How to use this file

These are **dials, not switches**. Every rule below is a statistical tendency in human fiction, not a law. Mechanically inverting every AI tell in every chapter creates a new, equally artificial fingerprint.

**Precedence — tropes outrank dials.** If the project has a genre bible (`stages/01_onboarding/output/bible/genre_bible.md`), its obligatory scenes and trope stack are a reader contract: no rule in this file may delete, weaken, or "subvert" a ledgered obligatory beat (the HEA, the fair-play reveal, the rank-up crescendo…). These dials govern the telling *between and inside* those beats — the connective tissue, where the AI tells actually live. See "Tropes vs. the authenticity directive" in `setup/genre_bibles/INDEX.md`. Then:

1. During **planning (Stage 02)**, make deliberate choices on each structural dial and record them in `structure_plan.md`.
2. During **drafting (Stage 03)**, obey the structure plan and the prose rules.
3. During **diagnostics (Stage 04)**, audit against both (see `_config/narrative_audit_rubric.md` and `node scripts/soundboard.js audit`).
4. **Vary the dials between chapters.** Uniformity is itself the strongest tell.

---

## Layer 1: Structural rules (set at planning time)

### Theme — never explain it
- The narrator NEVER states the story's theme, moral, or lesson. No "she understood now that…", no closing paragraph that names what was learned. Theme surfaces only through consequence and choice. (AI narrators explain the theme 77% of the time; humans 52%.)
- Dialogue-as-philosophy-seminar: at most 1 scene in 4 may use dialogue to debate ideas. Most dialogue advances plot, reveals character sideways, or is simply people talking.
- Not every subplot and image must serve the central theme. Budget: at least one subplot or recurring element that is thematically loose or *contrasting* — there because life is like that.

### Plot shape — allow mess
- **Subplots are mandatory.** A novel carries at least two; a novella at least one. (79% of AI stories have zero subplots vs. 57% human.) Mix integration: one thematically parallel, one loose/contrasting.
- **Causal chain may break.** Coincidence, dead-end efforts, irrelevant events, and unexplained occurrences are human. Not every setup pays off; leave at least one loose end per act unresolved.
- **Resolution variety.** Across the book, endings of arcs must not all be protagonist-choice-driven (AI default: 69% vs. 46% human). Some arcs resolve by external fate, luck, other characters, or not at all.
- **Ban the acceptance ending as default.** "Internal understanding / quiet acceptance" may close at most one major arc per book (AI default: 47% vs. 27%). Endings may be abrupt, ambiguous, external, pyrrhic, or unresolved.
- **Moral ambivalence.** The protagonist's key choices should read as morally mixed in the majority of arcs (human: 59% ambivalent; AI: 38%). Give the protagonist at least one decision the reader can reasonably condemn.

### Time — subvert linearity
- Plan anachrony explicitly: flashbacks, flash-forwards, time skips, achronological chapter order where genre permits. (Strongest human-side markers in the research.)
- **Delayed disclosure:** at least once per act, withhold a key fact and reveal it out of chronological order — open at the funeral, spiral backward.
- **Recontextualization:** at least one revelation per book must force the reader to reinterpret earlier scenes, not merely surprise them.
- Vary narrator temporal distance between chapters (immediate scene vs. retrospective telling).

### World — engage the outside
- **Named references:** where the story world permits, characters reference real, named works, authors, brands, songs, places (human: 47% explicit named references; AI: 24% vague allusions). In secondary worlds, invent named in-world texts/brands and have characters cite them specifically.
- **Location variety:** more distinct locales than feels necessary. Humans wander.
- **Reader address / fourth wall:** where the narrative voice supports it, permit occasional asides. Never forced — this dial can sit at zero for close-third genre fiction, but consider it for framed or retrospective narrators.

### Escalation — vary the contour
- Plot event intensity must have a deliberate, uneven contour: quiet chapters, spikes, false peaks. Flat, evenly-rising escalation is a machine signature.
- Endings may be avalanches. Not everything winds down gently.

### Rarity — beat the default
- The research's deepest finding: AI stories cluster in a shared region of narrative space; human stories are statistically *rarer* (mean rarity percentile 0.71 vs 0.49) and more dispersed. The first idea a model produces is, almost by definition, the center of that cluster.
- Rule for every major beat (act turns, midpoint, arc climaxes, endings): generate **three candidate approaches, discard the first as the presumed default**, and pick the rarest that still serves the story. Log default vs. chosen in `structure_plan.md` §10.
- Obligatory trope beats are exempt from deletion but not from this rule: the beat must land, but *how* it lands gets three candidates too.

---

## Layer 2: Prose rules (applied at drafting time)

### Emotion — rotate the mode
- Three modes: **explicit label** ("she was afraid"), **behavioral cue** (she checked the lock twice), **embodied sensation** (her chest tightened).
- AI defaults to embodied 81% of the time; humans 38%, and humans *plainly name* feelings 29% of the time vs. AI's 8%. So: rotate all three modes. Embodied sensation carries at most ~2 of every 5 emotion beats. Plain statement of feeling is not weak writing — it is human writing. "Show don't tell" applied relentlessly is itself a tell.
- Ban the stock body kit: tightening chests, breath catching, stomachs dropping/knotting, cold sweat, hammering hearts — each allowed rarely, never as reflex.

### Senses — budget, don't blanket
- Do not cycle through all five senses per scene. Pick the one or two that matter to the POV character in that moment.
- **Olfactory quota:** smell appears in 82% of AI stories vs. 57% human. Use smell only when it earns its place (memory trigger, danger, food). Never the reflexive "the room smelled of X and Y" establishing beat.
- Sensory density follows the viscosity dial (`_config/voice.md`), and viscosity varies by scene — not every scene is High.

### Setting — let the weather be innocent
- The environment must NOT consistently mirror the character's inner state (rain for grief, storm for conflict). Most of the time, setting is indifferent to mood. Pathetic fallacy: at most once per act, and preferably subverted.
- Openings: do not always ground the reader with a spatial establishing shot. Open in dialogue, in motion, in thought, mid-argument.

### Character — introduce sideways
- Introduce characters **in action or in dialogue**, not by external physical description (AI: 52% external description; humans: 30%). Physical details arrive late, partial, and filtered through another character's attention.
- Vary depth of interior access between scenes; sometimes stay on surfaces.

### Dialogue — more of it
- Humans write proportionally more dialogue than AI. When in doubt, convert narration to talk. Let characters interrupt, misunderstand, and talk past each other.

### Lexical anti-slop (supersedes the short list in voice.md)
Banned or strictly rationed:
- Filler verb frames: *began to, started to, seemed to, managed to, found herself, couldn't help but*
- AI vocabulary: *delve, tapestry, testament (to), myriad, palpable, unwavering, sentinel, symphony (of), kaleidoscope, liminal, cacophony, "a beat," "something shifted"*
- **Triad stacking / rule-of-three:** "not X, not Y, but Z"; "it was A, B, and C"; three-item rhythmic lists closing a paragraph. One triad per chapter, maximum.
- Em-dash rationing: em-dashes are fine but AI over-deploys them; keep under ~4 per 1,000 words and vary with commas, parentheses, and periods.
- Anaphora abuse: consecutive sentences/paragraphs opening with the same word or frame.
- Redundant explanation: never restate in narration what dialogue or action just showed.

### Rhythm
- Sentence length must show real variance (target coefficient of variation ≥ 0.5 within a chapter): fragments, and also long, winding sentences that take their time. Paragraph lengths likewise — one-line paragraphs exist.

---

## Layer 3: Model fingerprint counters (Claude-drafted prose)

When Claude (or a Claude-based agent) drafts, it exhibits specific measured habits. Counter each deliberately:

| Claude habit | Counter |
|---|---|
| Flat event escalation, quiet endings | Plan an escalation contour with spikes; permit at least one "avalanche" climax |
| Uniform narrative voice | Shift register between POVs/chapters; let some chapters be told rougher, faster, or stranger |
| Epilogue habit | No epilogue unless the structure plan explicitly calls for one |
| Avoids dream sequences | Dreams/visions are permitted tools when the story wants them |
| Reverent to genre convention | At least one deliberate subversion of a genre expectation per book |
| Careful consistency | Allow characters to be inconsistent, wrong, or irrational without authorial correction |

---

## Verification

- Mechanical scan: `node scripts/soundboard.js audit` (counts what is countable — emotion modes, smell density, dialogue ratio, tells, rhythm variance).
- Judgment audit: score chapters against `_config/narrative_audit_rubric.md` (the un-countable structural features).
- Both run in Stage 04; structural failures route back to Stage 02, prose failures to Stage 03.

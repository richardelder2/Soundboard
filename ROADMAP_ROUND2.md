# Soundboard & SAGA-ICM — Round 2 Master Remediation Roadmap

**Reference:** `soundboard_audit_report-round2.md`  
**Methodology:** Interpretable Context Methodology (ICM, arXiv:2603.16021v2)  
**Target Repositories:**
- Primary: `C:\Users\richa\soundboard` (`richardelder2/Soundboard.git`)
- Secondary: `c:\Users\richa\saga_icm` (`richardelder2/saga-icm.git`)

---

## Progress Overview

| Sprint | Focus | Tickets | Status |
|---|---|---|---|
| **Sprint 1** | Budget Conformance & Bundle Integrity | T-01, T-02, T-03, T-04 | ✅ Completed |
| **Sprint 2** | Make the Knowledge Teach | T-05, T-06, T-07 | 📋 Backlog |
| **Sprint 3** | State & The Concierge | T-09, T-10, T-08 | 📋 Backlog |
| **Sprint 4** | Reach & Polish | T-11, T-12, T-13 | 📋 Backlog |

---

## Sprint 1: Budget Conformance & Bundle Integrity

### [x] T-01 · Genre-Route the Stage 02 Template Block
- **Priority:** P1 · ICM violation (Layered Context Loading)
- **Problem:** Stage 02 packet is ~15,352 tokens (~60k chars), roughly 2× the 8,000 token ICM ceiling, because `stages/02_planning/CONTEXT.md` declares all 12 templates unconditionally, including genre-specific trackers (heat ladder ~912 tok, power escalation ~794 tok, fair play ~1,067 tok).
- **Implementation Tasks:**
  1. Create `_config/templates/CONTEXT.md` (Layer 3 Template Router) with:
     - Universal templates table (foolscap, outline, structure_plan, character_arcs, scene_beat, manuscript.json, canon, voice_exemplars, tracker_lore_debt).
     - Genre-conditional trackers table:
       - Romance / Romantasy → `tracker_romance_heat_ladder.template.md`
       - Epic Fantasy / Multi-POV / Thriller → `tracker_power_escalation.template.md`
       - Mystery / Detective / Cozy / Noir → `tracker_fair_play_clues.template.md`
       - Unlisted / universal → none.
  2. Update `stages/02_planning/CONTEXT.md`:
     - Replace the 3 genre trackers with `_config/templates/CONTEXT.md` in `templates:`.
     - Remove redundant `setup/genre_bibles/INDEX.md` from `inputs:`.
     - Add Process step instructing author/agent to consult `_config/templates/CONTEXT.md`.
  3. Teach `handleRunStage()` in `scripts/soundboard.js` and `scripts/saga.js` to inspect `stages/01_onboarding/output/preferences.json` (or CLI flags) and include only the matching genre tracker.
- **Acceptance Criteria:**
  - `node scripts/soundboard.js run-stage 02` packet is under 32,000 characters (~8,000 tokens).
  - Packet footer reports token estimate inside 2,000–8,000 band.
  - With `preferences.json` genre = `mystery`, only `tracker_fair_play_clues` is emitted.
  - Test added to `tests/run_tests.js`.

---

### [x] T-02 · Backfill Routing Frontmatter Across All 92 OKF Modules
- **Priority:** P1 · Blocks T-03 & T-05
- **Problem:** 86 of 92 craft modules lack machine-readable routing frontmatter (`stages`, `genres`, `scope`, `provides`, `requires`, `diagnostics`, `keywords`, `confidence`).
- **Implementation Tasks:**
  1. Freeze closed vocabulary in `_config/okf_craft/SPECIFICATION.md`:
     - `stages`: `[01_onboarding, 02_planning, 03_drafting, 04_diagnostics_edits, 05_publishing]`
     - `genres`: `[thriller_suspense, mystery_detective, romance_romantasy, horror_weird, scifi_dystopian, epic_fantasy, noir_crime, adventure_survival, comedy_satire, kishotenketsu]` (empty `[]` for universal)
     - `scope`: `book | chapter | scene | sentence`
     - `subtype`: `genre_convention | plot_template | character_engine | narrative_mode | dialectic_pattern | pacing_rhythm | prose_style`
     - `confidence`: `peer_reviewed | practitioner_method | workshop_heuristic`
     - `diagnostics`: script names/flags (`rhythm`, `dread`, `lore_density`, `sensory_anchor`, `lexical_tells`, `dialogue_ratio`, `voice_drift`, etc.)
     - `provides`: array of snake_case capability tags
     - `requires`: array of module IDs (must be valid filenames without `.md`)
     - `conflicts_with`: optional array of module IDs
     - `keywords`: 4–8 author-facing search phrases
  2. Batch-backfill frontmatter across all modules:
     - Batch A: `craft_primitive` (15 modules)
     - Batch B: `craft_rule` (18 modules)
     - Batch C: `craft_structure` (53 modules) + remaining specialized modules
  3. Ensure UTF-8 with NO BOM and LF line endings.
- **Acceptance Criteria:**
  - `grep -L "^stages:" _config/okf_craft/*.md | grep -vE "index|SPECIFICATION|CONTEXT"` returns empty.
  - Test added to `tests/run_tests.js`.

---

### [x] T-03 · `sb okf-lint` — Validate Bundle Against Its Own Spec
- **Priority:** P1 · Depends on T-02
- **Problem:** Unchecked module size (>450 words), missing cross-references, and 6 newly authored modules currently unreferenced in `_config/okf_craft/CONTEXT.md`.
- **Implementation Tasks:**
  1. Create `scripts/okf_lint.js` (wired via `soundboard okf-lint` and `saga okf-lint`):
     - Check frontmatter completeness and legal enums.
     - Token budget: warn > 600 tokens (~450 words), fail > 900 tokens under `--strict`.
     - Referential integrity: all `requires` and `conflicts_with` map to existing modules; all `diagnostics` map to recognized scripts.
     - Router coverage: every module appears in at least one table in `_config/okf_craft/CONTEXT.md` (or has `routing: implicit`).
     - Markdown link resolution and BOM check.
  2. Wire the 6 new modules into `_config/okf_craft/CONTEXT.md`:
     - `chapter_architecture_and_ending_hooks.md` → Stage 02 (Beats) & Stage 03 (Drafting)
     - `voice_differentiation_across_ensemble.md` → Stage 03 (Drafting) & Diagnostic Remediation
     - `developmental_revision_and_layered_passes.md` → Stage 04 (Diagnostics & Edits)
     - `series_architecture_and_cross_book_arcs.md` → Genre/Mode table (Series)
     - `short_story_form_and_single_effect.md` → §5 Form-Based Routing
     - `novella_form_and_compressed_turn.md` → §5 Form-Based Routing
  3. Add `okf-lint` to `npm test` and `.github/workflows/audit.yml`.
- **Acceptance Criteria:**
  - `node scripts/soundboard.js okf-lint` exits 0.
  - Omitting any module from the router causes `okf-lint` to fail.

---

### [x] T-04 · Density-Normalize the Lexical Tell Threshold
- **Priority:** P1
- **Problem:** Absolute tell count flags 3 literary words as a FAIL in 4,000-word chapters identically to 140-word snippets. The report states target 0 when code threshold is 3. `tell_allowlist.md` is unlinked in onboarding.
- **Implementation Tasks:**
  1. Update `scripts/narrative_audit.js`:
     ```javascript
     const tellsPer1k = (r.tellTotal / Math.max(r.words, 1)) * 1000;
     // RED: tellsPer1k > 2.0 && r.tellTotal >= 3  (or any single tell repeated >= 2)
     // WARN: (tellsPer1k > 0.8 && r.words >= 800)
     ```
  2. Retain single-tell repetition rule (`some(c => c >= 2)`) as RED regardless of density.
  3. Retain `words >= 800` sample guard (below 800 words capped at WARN with note).
  4. Fix report line: `| Lexical tells (per 1k) | ${tellsPer1k.toFixed(2)} | ≤ 2.0, none repeated |`.
  5. Wire allowlist into onboarding:
     - Add `stages/01_onboarding/output/tell_allowlist.md` to `stages/01_onboarding/CONTEXT.md` `outputs:`.
     - Create `_config/templates/tell_allowlist.template.md`.
     - Audit loader checks project allowlist first, fallback to `_config/tell_allowlist.md`.
     - Update onboarding interview prompt and `AGENTS.md`.
- **Acceptance Criteria:**
  - 4,000w fixture with 3 distinct single-use tells → PASS with WARN.
  - 4,000w fixture with 1 tell repeated 4× → FAIL.
  - 140w fixture → WARN (short sample guard).
  - Allowlisted words ignored.
  - 4 new assertions in `tests/run_tests.js`.

---

## Sprint 2: Make the Knowledge Teach

### [ ] T-05 · Operational Diagnostic → Craft-Module Links
- **Priority:** P2 · Depends on T-02, T-03
- **Goal:** Diagnostic failures must provide educational remediation, linking the audit flag to the relevant craft module and technique from `_config/okf_craft/CONTEXT.md`.
- **Tasks:**
  - Map flags to remediation modules (e.g. rhythm monotony → `prose_syntax_and_acoustic_cadence`, embodied emotion overuse → `free_indirect_discourse_and_voice_blending`, dialogue ratio → `three_registers_of_dialogue_subtext`, tells → `adversarial_prose_auditing_and_slop_filtering`).
  - Add `## Corrective Craft Remediation` section to the chapter audit report.

### [ ] T-06 · Retrieval Upgrade for `craft search`
- **Priority:** P2 · Depends on T-02
- **Goal:** Intelligent plain-text retrieval without vector/binary dependencies.
- **Tasks:**
  - Weighted scoring: `keywords` 3×, `title` 2×, body 1×.
  - Add CLI flags: `--stage=<id>`, `--genre=<name>`, `--scope=<level>`.
  - Create `_config/okf_craft/synonyms.md` mapping author symptom terms to modules.
  - Fallback to router table when 0 matches found.

### [ ] T-07 · Form-Based Routing (Short Story, Novella, Series)
- **Priority:** P2 · Depends on T-03
- **Goal:** Support non-novel structures without forcing 40-chapter novel infrastructure.
- **Tasks:**
  - Add §5 Form-Based Routing to `_config/okf_craft/CONTEXT.md`.
  - Add `form` to `preferences.json` (`short_story | novelette | novella | novel | series`).
  - Add Stage 02 short-form branch (foolscap + single beat file + canon; skips novel trackers).
  - Support generic `units` in `manuscript.json` (`unit_type: chapter | section | story`).
  - Expand `short_story_form_and_single_effect.md` and `novella_form_and_compressed_turn.md` to 450–550 words.
  - Add `--form` flag to `init`.

---

## Sprint 3: State & The Concierge

### [ ] T-09 · State Model: Structured Canon, Timeline, Thread Ledger
- **Priority:** P2
- **Tasks:**
  - **9a (Structured Canon):** Migrate `canon.md` to tabular format (`entity | attribute | value | first_asserted | status`), add `soundboard canon query <entity>`, update `pack-chapter` to inline only relevant entity rows (preserving 6,000-token kit budget).
  - **9b (Timeline):** Support `story_date` and `elapsed` in frontmatter; implement `soundboard timeline` chronology checker.
  - **9c (Thread Ledger):** Create `stages/02_planning/output/trackers/threads.md`; implement `soundboard threads` command.

### [ ] T-10 · Machine-Checkable Stage 04 Gate
- **Priority:** P2 · Depends on T-09
- **Goal:** Enforce ICM §6.2 verification via reproducible artifacts rather than trust in an unverified status string.
- **Tasks:**
  - Define verdict artifact schema (`check`, `chapter`, `verdict: PASS|FAIL|SKIP`, `evidence`, `timestamp`).
  - Emit 4 verdict JSON artifacts per chapter (`scan`, `canon_check`, `rubric`, `ledger_delivery`).
  - Implement `soundboard gate <chapter>` as sole setter of `status: passed`.
  - Enforce gate artifacts in `compile_manuscript.js`.

### [ ] T-08 · Book-Level Analysis (`soundboard manuscript-report`)
- **Priority:** P2
- **Tasks:**
  - Create `scripts/manuscript_report.js` computing escalation contour, voice drift (>2σ outliers), POV budget, cross-chapter 4-gram repetition, and ledger delivery.

---

## Sprint 4: Reach & Polish

### [ ] T-11 · `sb brief` — Cold-Start State Dump
- **Priority:** P3 · Depends on T-09
- **Tasks:**
  - Create `soundboard brief` CLI command reporting project state facts (chapters, open threads, overdue promises, failed audit flags) without prescribing actions (ICM §5.2).

### [ ] T-12 · Import and Export
- **Priority:** P3
- **Tasks:**
  - Implement `soundboard import <file>` for `.md` and `.docx`, registering chapters with `status: imported`.
  - Implement `soundboard export --format=docx` via pandoc with clear error when pandoc is absent.

### [ ] T-13 · Housekeeping
- **Priority:** P3
- **Tasks:**
  - Add `"engines": { "node": ">=18" }` to `package.json`.
  - Dynamic module count in CLI help.
  - Tolerant JSON parser with friendly error reporting for `manuscript.json`.
  - Add schema versioning to `manuscript.json`.
  - Add `--stage` filter to `soundboard status`.
  - Align root `CONTEXT.md` to Layer 1 task routing.

---

## Rules to Preserve Across All Sprints
1. **Plain text as the interface:** No vector stores, binary databases, or hidden indexes.
2. **`dependencies: {}`:** Zero runtime npm dependencies.
3. **Layered context discipline:** Respect token budgets (Stage packets 2,000–8,000 tok, Chapter kits <6,000 tok, OKF modules <600 tok).
4. **Scripts report facts; contracts route decisions:** No compiled-in next-action dictation.
5. **Always synchronize both repos:** `C:\Users\richa\soundboard` and `c:\Users\richa\saga_icm`.

---
type: StageContract
stage_id: "04_diagnostics_edits"
name: Diagnostic Audits & Copy-Editing Revisions
inputs:
  - stages/03_drafting/output/chapters/
  - stages/02_planning/output/structure_plan.md
  - stages/02_planning/output/character_arcs.md
  - stages/02_planning/output/trackers/
  - stages/02_planning/output/canon.md
  - stages/02_planning/output/voice_exemplars.md
  - manuscript.json
  - _config/narrative_authenticity.md
  - _config/narrative_audit_rubric.md
  - _config/templates/revision_playbook.template.md
---

# Stage 04: Diagnostics & Copy-Edits

## Process
1. **Mechanical scan**: run `node scripts/soundboard.js audit` (wraps `scripts/narrative_audit.js`). It writes per-chapter reports to `stages/04_diagnostics_edits/output/reports/` covering emotion-mode balance, olfactory density, dialogue ratio, sentence/paragraph rhythm variance, lexical tells, triad stacking, em-dash rate, and end-of-chapter moralizing — and records each chapter's verdict as `last_audit` in `manuscript.json`.
2. **Continuity check**:
   - Run `node scripts/soundboard.js continuity` (near-duplicate and orphaned proper nouns → `reports/continuity_names.md`).
   - Verify the chapter against `canon.md`: every `[unverified chN]` tag is checked against prior canon — on conflict the DRAFT loses unless the change is a deliberate amendment logged in canon's Amendments table. Untag verified facts and bump `last_verified_chapter`.
3. **Judgment audit**: score the manuscript against `_config/narrative_audit_rubric.md` (the structural features no scanner can count). Cross-check intentional loose ends against the `structure_plan.md` ledger so they are not "fixed."
4. **Trope delivery audit**: walk the obligatory-scene ledger in `structure_plan.md` — every promised beat delivered on page, at roughly the genre bible's percentage position, at full strength. Run the bible's own audits from `stages/02_planning/output/trackers/` (fair-play accounting, comfort-contract check, heat-ladder progression, lore-debt due dates). A missing or weakened obligatory scene is a **structural failure** — route to Stage 02/03, and never accept "we subverted it" as a fix for a reader-contract beat.
5. **Arc delivery audit**: walk each beat schedule in `character_arcs.md` — every arc beat scheduled in the audited chapters delivered on page, through choice/behavior/image. Two failure modes, both structural: the beat is missing (plot happened, nobody changed), or the beat is *narrated* ("she understood now that…" — quote it, cut it, re-render as action). Check the checkbox in the arc sheet only when delivered.
6. Execute legacy diagnostics (prose rhythm standard deviations, dialogue heat register analysis, character timeline resource tracking) and merge findings into the reports.
7. Generate developmental editorial reports inside `stages/04_diagnostics_edits/output/reports/`.
8. **Create and execute the Revision Playbook (HITL Process)**:
   - For chapters failing audits, instantiate a copy of `_config/templates/revision_playbook.template.md` in `stages/04_diagnostics_edits/output/playbooks/revision_playbook_ch[X].md`.
   - **Critique & Options:** Log the audit details and present 2–3 actionable options for each failure.
   - **HITL Choice:** Present the options to the author. Wait for their selection or custom direction.
   - **Final Plan:** Consolidate selected options into a checklist.
   - **Rewrite:** Execute the revisions in the chapter file. Run a final audit scan and update the log in the playbook to confirm the gate passes.
   - For **structural failures** (theme explained, missing subplots, uniform resolutions), do not attempt to fix with line edits; route the playbook choices back to Stage 02 planning modifications first.
9. **Bookkeeping**: set the chapter's `status` in `manuscript.json` — `audited` while findings are open, `passed` when the gate clears. On pass, consider harvesting one standout passage into `voice_exemplars.md` (keep 2–3 per POV, rotate stale ones out).

## Gate
A chapter passes to Stage 05 only when: mechanical scan shows no red flags, canon check is clean (no remaining `[unverified]` tags for it), the rubric verdict is `PASS`, and its obligatory-scene ledger entries AND scheduled arc beats are delivered. Then and only then set `status: passed`.


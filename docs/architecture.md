# Soundboard Engine Architecture & Technical Specification

## Architectural Overview

Soundboard is an agent-native, token-disciplined novel engineering studio built upon the **Interpretable Context Methodology (ICM)**. It coordinates multi-agent or agent-author pairs across five stages governed by explicit markdown contracts, a central production ledger (`manuscript.json`), and deterministic zero-dependency CLI tooling.

```
                  ┌─────────────────────────────────────┐
                  │          _config/ Layer 3           │
                  │   Rules, Templates, 92 Craft Cards  │
                  └──────────────────┬──────────────────┘
                                     │ Context
                                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   STAGE 01   │ ──> │   STAGE 02   │ ──> │   STAGE 03   │ ──> │   STAGE 04   │ ──> │   STAGE 05   │
│  Onboarding  │     │   Planning   │     │   Drafting   │     │ Diagnostics  │     │  Publishing  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                 ▲                    │
                                                 └──── Revision ──────┘
```

---

## 1. The 5-Stage Contract State Machine

Every stage folder contains a canonical `CONTEXT.md` defining:
- `inputs:` Exact prerequisite files required before execution.
- `outputs:` Target artifacts produced upon stage completion.
- `templates:` Skeleton conventions from `_config/templates/`.
- `process:` Numbered, deterministic author/agent procedures.

| Stage | Contract Path | Primary Outputs | Gating Invariant |
|---|---|---|---|
| **01 · Onboarding** | `stages/01_onboarding/CONTEXT.md` | `world_bible.md`, `characters/`, `genre_bible.md`, `tell_allowlist.md` | In-world terminology allowlisted; obligatory tropes identified. |
| **02 · Planning** | `stages/02_planning/CONTEXT.md` | `foolscap.md`, `structure_plan.md`, `beats/`, `manuscript.json` | Obligatory scene ledger scheduled; Swain pacing formulas set. |
| **03 · Drafting** | `stages/03_drafting/CONTEXT.md` | `chapters/chXX.md`, `canon.md` (unverified facts) | Chapter kit packed with trailing voice anchor; facts tagged. |
| **04 · Diagnostics** | `stages/04_diagnostics_edits/CONTEXT.md` | `reports/chXX_audit.md`, `revision_playbook.md` | Passes all 4 quality gates; canon conflicts reconciled. |
| **05 · Publishing** | `stages/05_publishing/CONTEXT.md` | `manuscript.html`, `manuscript.epub` | Compiler refuses any chapter without 4/4 passing audit attestations. |

---

## 2. Core State Ledgers

### `manuscript.json` (The Master Production Ledger)
Created at Stage 02 and maintained in the project root, `manuscript.json` records single-source-of-truth progress across the book:
```json
{
  "schema_version": "2.0.0",
  "book": {
    "title": "The Obsidian Threshold",
    "genre": "Epic Fantasy / Grimdark",
    "target_words": 85000
  },
  "chapters": [
    {
      "number": 1,
      "title": "The Ash Gate",
      "target_words": 3500,
      "actual_words": 3620,
      "pov": "Kaelen Vance",
      "status": "passed",
      "last_audit": {
        "verdict": "pass",
        "tell_density": 0.22,
        "cadence_variance": 7.4
      }
    }
  ]
}
```

### `stages/03_drafting/output/canon.md`
The immutable ground truth of narrative facts:
- Entities are recorded in structured markdown tables (Characters, Factions, Locations, World Rules).
- New facts added during drafting are flagged `[unverified chN]`.
- When Chapter N clears Stage 04 diagnostics, unverified tags are permanently confirmed.
- Rule of Contradiction: **The draft always loses to canon.** To alter canon, an explicit amendment must be logged with a retrofit list.

---

## 3. The Chapter Production Loop

1. **Kit Assembly (`soundboard pack-chapter <N>`):**
   - Assembles beats, relevant canon entities, active story threads, and the voice kit (exemplars + trailing 500 words from Chapter $N-1$).
   - Enforces strict token ceilings ($\le 6,000$ tokens total) to maximize reasoning bandwidth for active prose generation.
2. **Drafting (Stage 03):**
   - Author-First (Solo) or Co-Writing (Agent-Drafted) pathway.
   - Appends newly coined facts tagged `[unverified chN]` to `canon.md`.
3. **Editorial Audit & HITL Revision Playbook (Stage 04):**
   - Runs `soundboard audit` (prose tells, cadence variance) and `soundboard continuity` (proper-noun consistency).
   - **Playbook Generation:** If mechanical or craft diagnostics flag issues, the agent creates `stages/04_diagnostics_edits/output/playbooks/revision_playbook_ch[X].md` based on `_config/templates/revision_playbook.template.md`.
   - **State Transition:** `manuscript.json` marks the chapter as `audited` (or `playbook_active`).
   - **Author Decision Gate:** The agent presents 2–3 creative strategies per finding (e.g., Cut vs. Dramatize vs. Subtext) with author write-in support. Under no circumstances may an agent perform an autonomous rewrite.
   - **Targeted Revision & Re-Audit:** The agent executes edits solely per the author's approved playbook choices, then re-runs diagnostics. Once all gates clear, status advances to `passed` and unverified canon tags are confirmed.
4. **Publishing Compilation (Stage 05):**
   - `soundboard compile` scans `manuscript.json` and verification artifacts. If any chapter lacks verified clearance, the compilation halts.

---

## 4. Mechanical CLI Command Reference

All CLI commands run in zero-dependency Node.js ($\ge 18$):

| Command | Usage | Description |
|---|---|---|
| `soundboard status` | `node scripts/soundboard.js status` | Full telemetry console: pipeline gates, chapter ledger, word counts. |
| `soundboard brief` | `node scripts/soundboard.js brief` | Dense single-line cold-start facts for agent context initialization. |
| `soundboard pack-chapter <N>` | `node scripts/soundboard.js pack-chapter 3` | Assembles token-disciplined drafting kit for Chapter N. |
| `soundboard audit <path>` | `node scripts/soundboard.js audit stages/03_drafting/output/chapters/ch01.md` | Scans for AI tells, sentence cadence, and POV adherence. |
| `soundboard continuity` | `node scripts/soundboard.js continuity` | Proper-noun near-duplicate and orphaned character detector. |
| `soundboard canon query "<q>"`| `node scripts/soundboard.js canon query "Elena"` | Extracts tabular canon entity facts on demand. |
| `soundboard compile` | `node scripts/soundboard.js compile` | Builds gated `manuscript.html` and `.epub` from passed chapters. |
| `soundboard okf-index` | `npm run okf-index` | Rebuilds static markdown catalogs across OKF craft bundles. |
| `soundboard okf-lint` | `npm run okf-lint -- --strict` | Audits craft cards for token budgets ($\le 900$ tok) and YAML frontmatter. |

---

## 5. Multi-Project & Series Architecture

Soundboard workspaces are fully self-contained and cwd-relative. Parallel books cannot contaminate each other.

For multi-book series, a sibling `series/` folder acts as the shared cross-book layer:
```
my-series/
  series/               # Shared across all books (Read-mostly)
  │   ├── series_canon.md
  │   ├── romance_ladder.md
  │   └── lore_debt_ledger.md
  book-01/              # Standard Soundboard workspace
  book-02/              # Standard Soundboard workspace
```
Upon completion of Stage 04 for Book $N$, verified facts and cross-book trackers are promoted to `series/`, giving Book $N+1$ instant, zero-drift series memory.

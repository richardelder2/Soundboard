# Soundboard — Pitch & Feature Guide for @thenextnewthingai

## High-Concept Hook (The 15-Second Hook)
> *"Almost every AI writing tool today is just a chatbot wrapper asking you for chapter ideas and vomiting out generic prose that falls apart by Chapter 4. Soundboard is different: it's an open-source, zero-dependency novel engineering studio that turns Claude Code, Antigravity, or Cursor into an Executive Writing Concierge—solving the #1 reason AI fiction feels fake: narrative structure."*

---

## 3 Reasons Your Audience Will Love This

### 1. It Solves The Real Problem Behind AI Novel Tells
- Most AI tools obsess over word choice or sentence tweaking. But recent research (*StoryScope*, arXiv:2604.03136) proves AI novels are detectable at **~94% accuracy from narrative structure alone** (flat linear pacing, unearned resolutions, missing subplots, on-the-nose theme statements).
- Soundboard fixes structure where it is actually created: **at the outline level** (Stage 02 Planning) using a Story Grid foolscap page, four-corner character oppositions, and obligatory-scene ledgers.

### 2. "Folder Structure as Agent Architecture" (Interpretable Context Methodology)
- Built on the academic principles of ICM (*arXiv:2603.16021*), Soundboard eliminates vector databases, fragile JSON embeddings, and framework lock-in.
- Everything is plain markdown files in staged folders:
  - `stages/01_onboarding` -> Story Bible & Trope Stacks
  - `stages/02_planning` -> Foolscap, Beats & Production Ledger
  - `stages/03_drafting` -> Voice-Calibrated Chapter Prose
  - `stages/04_diagnostics_edits` -> Machine-Checkable Quality Gates
  - `stages/05_publishing` -> Gated Compilation (HTML/EPUB)
- If an agent loses memory or crashes, any model can inspect `manuscript.json` cold and resume with zero context loss.

### 3. Concrete Quality Gates & Zero-Dependency CLI
- Authors never have to wrestle with the plumbing: the agent conducts an interview in chat, while running mechanical diagnostics behind the scenes.
- Includes a 4-gate verification check (mechanical tell scanner, continuity scanner, N-gram cross-chapter repetition check, and living canon consistency).
- **Zero runtime dependencies (`dependencies: {}` in package.json)**—pure Node.js built-ins.

---

## Suggested Video Flow / Demo Ideas

1. **The Cold Start (0:00 - 2:00):**
   - Clone repo, open in Claude Code or Antigravity, type: *"Read AGENTS.md and onboard me for a new sci-fi thriller."*
   - Show how the AI acts as a creative writing concierge rather than a generic coding assistant.
2. **The Structural Authenticity Reveal (2:00 - 5:00):**
   - Show how it plans the book on a single Pressfield/Coyne Foolscap page.
   - Highlight the 92 peer-reviewed craft modules (Truby, Sanderson Magic Laws, Swain MRUs) and the Rosetta Stone lexicon that translates between Save the Cat and Story Grid.
3. **The Anti-Drift Engine (5:00 - 8:00):**
   - Run `pack-chapter 2` to show how trailing voice anchors prevent tone drift.
   - Show `sb status` and `sb audit` catching tells and repetition in real time.
4. **Conclusion & GitHub Link (8:00 - 10:00):**
   - Free, open source (MIT), zero API lock-in.

---

## Quick Links
- **Repository:** https://github.com/richardelder2/saga-icm
- **Methodology Paper:** Van Clief & McDermott, *Interpretable Context Methodology* (arXiv:2603.16021)

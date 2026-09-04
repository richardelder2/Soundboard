# Soundboard — Novel Engineering Studio & Narrative Console

> *"The Author's Intelligent Sounding Board & Narrative Console"*

**Soundboard** is a portable, token-disciplined novel engineering system built on the Interpretable Context Methodology (ICM). Designed specifically for creative authors working inside modern **Agentic Development Environments (ADEs)**—such as Antigravity, Claude Code, and Gemini CLI—Soundboard acts as an elite executive novel assistant, creative sounding board, and narrative mixing console.

---

## 🎻 Why "Soundboard"?

In music and lutherie, a vibrating string in thin air makes almost no sound—it is tinny, weak, and barely audible. The **soundboard** (in a piano, harp, cello, or guitar) is the resonant wooden body that catches those quiet vibrations, enriches them with complex harmonics, and amplifies them into a room-filling acoustic symphony.

In creative collaboration, a **sounding board** is the trusted, intelligent confidant you test your ideas against—someone who listens, reflects back with nuance, catches false notes, and helps you discover the story's true resonance.

The author provides the melody, the character, and the human spark. **Soundboard** provides the resonance, the structural architecture, and the precision mixing console.

---

## 🎛️ The 5-Stage Narrative Pipeline

Soundboard moves manuscripts through five disciplined stages, governed by plain Markdown contracts (`CONTEXT.md`):

| Stage | Workspace Folder | Produces |
|---|---|---|
| **1. Onboarding** | `stages/01_onboarding/` | Author preferences, world bible, characters, **filled genre bible + trope stack** |
| **2. Planning** | `stages/02_planning/` | **Foolscap page**, macro outline, **structure plan**, canon + voice exemplars, **production ledger (`manuscript.json`)**, scene beats |
| **3. Drafting** | `stages/03_drafting/` | Chapter prose (canon-consistent, voice-calibrated, token-disciplined) |
| **4. Diagnostics & Edits** | `stages/04_diagnostics_edits/` | Full-spectrum audits, continuity scans, HITL revision playbooks, gate pass |
| **5. Publishing** | `stages/05_publishing/` | Typeset serif HTML, print layout, and EPUB compilation |

---

## 🧠 The Static Craft Knowledge Bundle (81 Modules)

Soundboard comes equipped with an extensive Open Knowledge Format (`OKF`) library resident in `_config/okf_craft/`:
*   **14 Neurocognitive Primitives:** Possible Worlds Theory (Ryan), Theory of Mind recursion (Zunshine), Chronesthesia pacing ratios, Mimetic Desire (Girard), Triad of Agency, and Focalization Filters.
*   **45 Macro Structures & Archetypes:** Tragic corruption arcs (*The Godfather*, *Chinatown*), Spatial allegories (*Parasite*), Fair-Play Whodunits, Heist capers, Jungian Shadow Integration, Vogler Mythic Masks, Truby 4-Corner Opposition, and Enneagram character fixations.
*   **21 Micro-Syntactic & Acoustic Rules:** Virginia Tufte syntactic symbolism, Francis Christensen cumulative sentences, Gary Provost sentence cadence, Phonosemantics (plosives vs. sibilants), Dwight Swain MRUs and velocity equations, Keith Johnstone status transactions, and Steve Kaplan comedy/farce pressure cookers.
*   **The Universal Narrative Rosetta Stone:** Instant cross-translation between Story Grid, Save the Cat!, The Hero's Journey, Dan Harmon's Story Circle, K.M. Weiland, and Brandon Sanderson.

---

## ⚙️ The Soundboard CLI (`soundboard` or `sb`)

Fast, mechanical, zero-token tools running locally:

```bash
# Workspace status and production ledger
node scripts/soundboard.js status
# (or with npm link: soundboard status / sb status)

# Instant semantic craft search across the 81-module library
node scripts/soundboard.js craft search "dark night of the soul"
node scripts/soundboard.js craft search "status transaction"
node scripts/soundboard.js craft search "pacing compression" --json

# Token-disciplined chapter context packager (<6,000 tokens)
node scripts/soundboard.js pack-chapter 1

# Full-spectrum diagnostic suite
node scripts/soundboard.js audit stages/03_drafting/output/chapter_01.md
node scripts/soundboard.js continuity
node scripts/prose_rhythm_diagnostic.js
node scripts/dialogue_diagnostic.js

# Gate-verified publishing
node scripts/soundboard.js compile
```

---

## 🚀 Getting Started in the ADE

Soundboard requires no web UI. The ADE *is* your studio.

1. Open this workspace in **Antigravity** or **Claude Code**.
2. Say to the agent:
   > *"Read AGENTS.md and let's onboard a new novel."*
3. The agent will run the conversational interview, map your genre trope stack, and guide you stage by stage through drafting, auditing, and publishing.

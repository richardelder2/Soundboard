<p align="center">
  <img src="assets/soundboard_logo.png" alt="Soundboard — Narrative Production Studio" width="480" />
</p>

<h2 align="center">The Author's Intelligent Sounding Board &amp; Novel Production Studio</h2>
<p align="center"><em>A disciplined workspace and structural sounding board for novelists collaborating with AI agents.</em></p>

<p align="center">
  <a href="https://github.com/richardelder2/saga-icm/actions"><img src="https://img.shields.io/github/actions/workflow/status/richardelder2/saga-icm/audit.yml?branch=main&amp;label=CI%20Audit&amp;logo=github" alt="CI Status" /></a>
  <a href="package.json"><img src="https://img.shields.io/badge/dependencies-0%20runtime-brightgreen.svg" alt="Zero Runtime Dependencies" /></a>
  <a href="package.json"><img src="https://img.shields.io/badge/node-%3E%3D18-blue.svg" alt="Node Version" /></a>
  <a href="_config/okf_craft/"><img src="https://img.shields.io/badge/OKF%20Craft-92%20modules-blueviolet.svg" alt="Craft Bundle" /></a>
  <a href="docs/methodology.md"><img src="https://img.shields.io/badge/methodology-ICM%20(arXiv%3A2603.16021)-orange.svg" alt="Methodology" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
</p>

---

## Writing a Novel is Hard. Writing One With Raw AI is Frustrating.

If you have tried using ChatGPT or Claude in a web browser to write long-form fiction, you have probably run into the same familiar walls:

* **The Amnesia Problem:** Around Chapter 3 or 4, the model begins forgetting earlier plot turns, subtly changing character details, or dropping established subplots.
* **The Web Chat Silo:** You spend half your energy copying and pasting snippets between a chat window and Google Docs or Microsoft Word, quickly losing track of drafts and version history.
* **The "AI Prose" Trap:** Left uncalibrated, language models gravitate toward predictable rhythms, melodramatic clichés (*"a testament to..."*, *"shivers down spines"*), and characters who resolve deep conflict with neat, tidy apologies.
* **Lack of Narrative Architecture:** AI is great at generating sentences, but weak at long-term dramatic pacing, moral stakes, and structural tension.

**Soundboard doesn't pretend to write your book for you.** Writing a good novel still takes real human taste, emotional vulnerability, and hard editorial decisions. 

What Soundboard does is provide a **disciplined studio environment on your own computer**—getting you out of fragile web chat windows and into clean, plain markdown files you fully own. It gives your AI agent the memory, structure, and craft rules it needs to be a truly helpful sounding board instead of a chaotic autocomplete engine.

<p align="center">
  <img src="assets/soundboard_hero_banner.jpg" alt="Soundboard Studio Workstation" width="100%" />
</p>

---

## How It Works: A Structural Scaffold for Your Story

When you collaborate with an AI coding agent (such as **Claude Code**, **Google Antigravity**, **Cursor**, or **Gemini CLI**), the agent is only as helpful as the context it can see. Overload it with unstructured notes, and it gets confused; starve it of context, and it drifts.

Soundboard acts as the structural spine for your project:
* **You bring the soul, the premise, and the creative vision.**
* **Soundboard keeps the canon organized, the chapter beats focused, and the voice consistent.**

Behind the scenes, Soundboard manages:
1. **A Single-Source Canon Ledger:** An auditable, plain-text record of established world rules, character traits, and active story threads so facts stay straight across 80,000 words.
2. **Anti-Drift Voice Anchoring:** Calibrates active chapter drafting against your chosen voice samples and the trailing prose of previous chapters to help prevent stylistic decay.
3. **92 Modular Craft Guides:** Focused reference modules in `_config/okf_craft/` synthesizing practical techniques from Shawn Coyne (*Story Grid*), John Truby (*Anatomy of Story*), Brandon Sanderson, K.M. Weiland, and Dwight Swain.

---

## The 5 Creative Studio Workspaces

Soundboard breaks a book project into five manageable, sequential workspaces:

<p align="center">
  <img src="assets/pipeline_workflow.svg" alt="Soundboard 5 Creative Workspaces Flowchart" width="100%" />
</p>

### 1. 🛋️ The Discovery Lounge (Stage 01 · Onboarding)
A focused brainstorming session to get your story off the ground. Your agent interviews you about your premise, core cast, world dynamics, and genre expectations. It organizes everything into a clear **Story Bible** and creates an **In-World Allowlist** so your world's unique terminology isn't accidentally flagged as cliché.

### 2. 📋 The Storyboard Wall (Stage 02 · Planning)
Before jumping into prose, map your book's spine on a virtual storyboard. You establish a **1-Page Foolscap Roadmap**, outline key obligatory genre scenes, balance subplots, and break your narrative into concrete, chapter-by-chapter beat sheets.

### 3. ✍️ The Writing Desk (Stage 03 · Drafting)
Write in whatever way fits your personal creative rhythm:
* **Co-Writing:** Brainstorm scene beats with your agent and have it draft scenes against your voice guide for your live review and iteration.
* **Solo-Writing:** Write the prose yourself. Your agent functions as workspace custodian—formatting frontmatter, tracking word counts, and updating your production ledger.
* **Anti-Drift Anchoring:** Every drafting packet includes the last 500 words of the previous chapter to help maintain consistent tone and psychic distance.

### 4. 🔍 The Editorial Desk (Stage 04 · Diagnostics)
A thorough, automated first-pass editorial sweep before you share your drafts with beta readers:
* **Continuity Check:** Scans proper nouns and cross-references established facts to catch contradictory eyes, timeline hiccups, or orphaned names.
* **Cadence & Rhythm Review:** Analyzes sentence length variation and paragraph rhythm to identify monotonous patches.
* **AI Tell Scanner:** Flags common synthetic phrasing patterns and overused tropes so you can replace them with authentic human voice.
* **Collaborative Revision:** When issues are found, your agent suggests 2–3 creative options for resolving them rather than rewriting your work.

### 5. 🖨️ The Printing Press (Stage 05 · Publishing)
Once your chapters have passed their editorial checks, a single command compiles your manuscript into clean, reader-ready **HTML** and standard **EPUB** formats—ready for e-readers, formatting tools, or submission.

---

## Quickstart for Writers

You don't need programming experience, command-line skills, or complicated setup to use Soundboard:

1. **Clone or download** this repository to a folder on your computer.
2. **Open the folder** in **Claude Code**, **Google Antigravity**, **Cursor**, or your preferred agent tool.
3. **Start the conversation in chat:**
   > *"Read AGENTS.md and let's brainstorm my novel."*
4. Your agent will read the contracts and walk you through Stage 01 at your own pace.

---

## What It Looks Like Behind the Scenes

While you focus on the creative story in chat, your agent uses lightweight, zero-dependency mechanical tools to track state and maintain continuity:

### The Production Console
Your agent monitors project progression, word count targets, and chapter states through a clean status summary:

<p align="center">
  <img src="assets/terminal_status.svg" alt="Soundboard Live Telemetry Console" width="100%" />
</p>

### The Editorial Diagnostic Scan
Before marking any chapter as ready, your agent runs a diagnostic sweep to catch continuity slips and cadence issues:

<p align="center">
  <img src="assets/terminal_audit.svg" alt="Soundboard Editorial Review Suite" width="100%" />
</p>

---

## The 92-Module Craft Reference Library

Soundboard provides your agent with explicit, codified reference cards in `_config/okf_craft/` covering time-tested storytelling principles:
* **The Story Grid (Shawn Coyne):** The 5 Commandments of the Micro-Scene and macro value shifts.
* **The Anatomy of Story (John Truby):** Moral arguments, designing principles, and 4-corner opposition.
* **Sanderson's Laws of Magic:** Systematic worldbuilding, costs, and escalating consequences.
* **Character Arc Anatomy (K.M. Weiland):** The Lie characters believe, the Wound, the Want vs. the Need.
* **Swain MRUs (Dwight Swain):** Motivation-Reaction Units for micro-pacing and dramatic tension.
* **Universal Narrative Rosetta Stone:** Whether you think in *Save the Cat!*, *Hero's Journey*, or *Story Grid* terms, your agent understands and mirrors your preferred vocabulary.

---

## Explore the Deep Architecture

For developers, technical authors, or curious creators who want to peek into the engine room:

* 📖 **[The Science of Narrative Authenticity](docs/methodology.md):** The *StoryScope* research, why plain folders beat vector databases, and the Interpretable Context Methodology (ICM).
* ⚙️ **[Technical Architecture & CLI Reference](docs/architecture.md):** The 5-stage state machine, data schemas (`manuscript.json`, `canon.md`), and zero-dependency mechanical CLI.
* 📚 **[Narrative Craft Encyclopedia & Rosetta Stone](docs/craft_encyclopedia.md):** Complete catalog of the 92 OKF craft cards, theory lineages, and symptom-based craft search.
* 🤝 **[Contributing Guide](CONTRIBUTING.md):** Architectural invariants, zero-dependency requirements, and PR checklists.

---

## Inspiration & Dedication

Soundboard stands on the shoulders of brilliant researchers, open-source pioneers, and a real-life creative partnership:

* **For Axie:** Dedicated with love to my partner, **Axie**, an author for whom I have served as a personal sounding board across years of late-night brainstorming, worldbuilding, and plot puzzles. Soundboard was built from that exact creative rhythm—engineered so that AI can finally keep up with her boundless imagination the way a devoted human partner can.
* **Jake Van Clief & William McDermott (ICM):** Boundless credit for the foundational breakthrough of the *Interpretable Context Methodology* ([ICM, arXiv:2603.16021](https://arxiv.org/abs/2603.16021)). Their philosophy—that transparent, plain-text folder architectures and token-disciplined contracts beat black-box vector databases—provides the structural spine of this studio.
* **Nous Research (`autonovel`):** Gratitude to the team at Nous Research, whose early *autonovel* experiments proved that AI could tackle long-form fiction and inspired the quest to give writers a true, disciplined creative sounding board.

---

## License

MIT License. Designed with care for novelists, storytellers, and creative partners.

# Contributing to Soundboard

Thank you for your interest in contributing to **Soundboard**! Soundboard is an open-source, token-disciplined novel engineering studio built on the Interpretable Context Methodology (ICM).

Whether you are a novelist, narrative theorist, software engineer, or prompt designer, your contributions are welcome.

---

## 🏛️ Architecture Overview

Soundboard is designed around three core pillars:

1. **Deterministic Mechanical CLI (`scripts/soundboard.js` or `sb`):**
   - Zero-token, instant Node.js tooling for workspace status, chapter packaging, craft search, diagnostics, and publishing.
2. **Interpretable Context Methodology (ICM):**
   - 5 contract-governed stages (`stages/01_onboarding` through `stages/05_publishing`), keeping human and agent state transparent through plain Markdown and JSON files.
3. **Open Knowledge Format (`OKF`) Craft Engine (`_config/okf_craft/`):**
   - 81+ modular, strictly-typed narrative theory files (Primitives, Structures, Rules) linked via an index catalog and semantic search.

---

## 🛠️ Areas You Can Contribute

### 1. OKF Craft Modules (`_config/okf_craft/`)
We are always expanding the codified craft knowledge base:
- **Neurocognitive Primitives** (e.g., narrative empathy, spatial immersion).
- **Macro Structures** (e.g., specific genre blueprints, mythic variations).
- **Micro-Syntactic Rules** (e.g., cadence, rhythm, rhetorical figures).

When adding a new craft module:
- Follow the schema in existing modules (Objective, Neurocognitive / Craft Mechanics, Failure Modes, Concrete Before/After Examples, Detection Signatures).
- Run `node scripts/soundboard.js okf-index` to rebuild the catalog `_config/okf_craft/index.md`.

### 2. Genre Bibles & Trope Stacks (`setup/genre_bibles/`)
- Expand existing genre files (`thriller.md`, `fantasy.md`, `romance.md`, etc.) with obligatory scene ledgers, conventions, and trope stacks.
- Add new subgenres or hybrid blueprints to `setup/genre_bibles/INDEX.md`.

### 3. Diagnostic & Audit Scripts (`scripts/`)
- Develop or refine local regex / NLP diagnostics (such as rhythm scanners, dialogue balance checkers, filter word detectors).
- Diagnostics must be fast, mechanical, and have zero mandatory external dependencies.

---

## 🔄 Development Workflow

1. **Fork and Clone:**
   ```bash
   git clone https://github.com/richardelder2/Soundboard.git
   cd Soundboard
   ```
2. **Verify System Integrity:**
   ```bash
   node scripts/soundboard.js status
   node scripts/soundboard.js okf-index
   node scripts/soundboard.js craft search "theory of mind"
   ```
3. **Make Your Changes:**
   - Keep files UTF-8 encoded and formatted cleanly with Markdown or modern ES modules.
4. **Submit a Pull Request:**
   - Provide a clear description of the craft theory or code added.
   - Reference any relevant narratology texts or craft authorities.

---

## 📜 Code of Conduct & Philosophy

- **Respect the Writer:** The human author is always the pilot; the tool and agent are the sounding board and console.
- **Craft Over Hype:** We prioritize concrete, time-tested narrative principles over vague prompt gimmicks.
- **License:** All contributions are submitted under the [MIT License](LICENSE).

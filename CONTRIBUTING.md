# Contributing to Soundboard

Thank you for your interest in contributing to Soundboard! Soundboard is built on the **Interpretable Context Methodology (ICM)** and the **Open Knowledge Format (OKF)** for token-disciplined, agentic novel writing.

## Core Architectural Invariants

Before proposing any changes or pull requests, please respect the following non-negotiable principles:

1. **Zero Runtime Dependencies:**
   - Soundboard maintains `"dependencies": {}` in `package.json`.
   - All tools, parsers, and utilities must run on standard Node.js built-ins (`fs`, `path`, `child_process`, `crypto`).
   - No external npm runtime packages may be added.

2. **Plain-Text Interpretable Glass Box:**
   - No opaque vector databases, hidden embeddings, or proprietary binary formats.
   - All state, memory, and lore must remain cwd-relative plain text (`.md` or `.json`).

3. **OKF Craft Module Budget Discipline:**
   - Craft modules in `_config/okf_craft/` must adhere to the Open Knowledge Format:
     - Word count: $\le 750$ words.
     - Token estimate: $\le 900$ tokens (`raw.length / 4`).
     - Required frontmatter: `stages:`, `subtype:`, and `confidence:`.
     - Worked examples, equations, and tables must be preserved.
     - Verify with: `npm run okf-lint -- --strict`.

4. **Multi-OS Cross-Platform Support:**
   - Automated tests and commands must execute cleanly on both Windows (`cmd`/`powershell`) and POSIX (`bash`/Linux/macOS) runners without hardcoded shell overrides.

---

## Development Workflow

1. **Clone & Setup:**
   ```bash
   git clone https://github.com/richardelder2/saga-icm.git
   cd saga-icm
   npm test
   ```

2. **Making Changes to Craft Modules:**
   - After adding or updating modules in `_config/okf_craft/`, update the catalog index:
     ```bash
     npm run okf-index
     ```
   - Verify that strict linting passes with zero errors:
     ```bash
     npm run okf-lint -- --strict
     ```

3. **Running the Automated Test Suite:**
   - Run the full test suite before committing:
     ```bash
     npm test
     ```

4. **Pull Request Checklist:**
   - [ ] Automated tests pass (`npm test`).
   - [ ] Strict OKF lint passes (`npm run okf-lint -- --strict`).
   - [ ] Catalog index is updated (`git diff --exit-code _config/okf_craft/index.md` is clean).
   - [ ] Zero runtime dependencies maintained (`dependencies: {}`).

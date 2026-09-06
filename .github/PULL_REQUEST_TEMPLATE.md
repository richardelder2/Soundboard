## Summary of Changes
A clear explanation of what this PR introduces, refactors, or fixes.

## Architectural Invariants Checklist
- [ ] **Zero Runtime Dependencies:** `dependencies: {}` in `package.json` remains untouched.
- [ ] **OKF Token Budgets:** Any new or edited craft cards adhere to $\le 750$ words / $\le 900$ tokens (`npm run okf-lint -- --strict`).
- [ ] **No Catalog Drift:** Ran `npm run okf-index` and verified `git diff --exit-code _config/okf_craft/index.md` passes.
- [ ] **Multi-OS Test Suite:** Ran `npm test` and all 54 tests pass without UTF-8 BOM bytes or platform defects.
- [ ] **Human-Readable:** All state changes reside in transparent, human-auditable markdown/JSON.

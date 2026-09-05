---
type: StageContract
stage_id: "05_publishing"
name: Serial Manuscript Compilation & eBook Rendering
inputs:
  - stages/03_drafting/output/chapters/  # gated by manuscript.json status
  - manuscript.json
outputs:
  - stages/05_publishing/output/manuscript.html
  - stages/05_publishing/output/manuscript.epub
---

# Stage 05: Publishing Compiled Outputs

## Process
1. Run `node scripts/soundboard.js compile` (wraps `scripts/compile_manuscript.js`):
   - Compiles chapters in `manuscript.json` order into a single print-serif HTML file (title page, small-caps chapter heads, scene-break glyphs, justified indented paragraphs).
   - **Only chapters with `status: passed` are included** — the Stage 04 gate is enforced here. `--all` overrides for preview builds.
   - When `pandoc` is installed, also exports `manuscript.epub` with title/author metadata.
2. Review the compiled HTML for rendering issues (broken scene breaks, orphaned headings) before distributing the EPUB.
3. Optional: run further Pandoc conversions (docx for editors, pdf via a LaTeX engine) from the same HTML.


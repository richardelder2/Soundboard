#!/usr/bin/env node
// Stage 05: compile chapters into a typeset HTML manuscript, and an EPUB when pandoc is available.
// Chapter order comes from manuscript.json when present (root of the project), else filename sort.
//
// Usage: node scripts/compile_manuscript.js [--all]
//   Default: only chapters with status "passed" in manuscript.json (the Stage 04 gate).
//   --all:   include every chapter file regardless of status (or when no manifest exists).
// Outputs: stages/05_publishing/output/manuscript.html (+ .epub via pandoc)

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

const CHAPTERS_DIR = path.join('stages', '03_drafting', 'output', 'chapters');
const OUT_DIR = path.join('stages', '05_publishing', 'output');
const MANIFEST = 'manuscript.json';

function stripFrontmatter(text) {
  return text.replace(/^\uFEFF/, '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Minimal prose-oriented markdown → HTML (headings, hr, em/strong, scene-break asterisks, paragraphs)
function mdToHtml(md) {
  const blocks = md.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return blocks.map(block => {
    const b = block.trim();
    if (!b) return '';
    const h = b.match(/^(#{1,3})\s+(.*)$/);
    if (h) return `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;
    if (/^(---+|\*\s*\*\s*\*|#)$/.test(b)) return '<hr class="scene-break">';
    return `<p>${b.split('\n').map(inline).join('<br>')}</p>`;
  }).filter(Boolean).join('\n');

  function inline(s) {
    return escapeHtml(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST)) return null;
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  } catch (e) {
    console.error(`Warning: could not parse ${MANIFEST}: ${e.message}`);
    return null;
  }
}

export function compileManuscript(args = []) {
  const includeAll = args.includes('--all');
  const manifest = loadManifest();

  // Resolve ordered chapter list
  let chapters = [];
  if (manifest && Array.isArray(manifest.chapters) && manifest.chapters.length) {
    const skipped = [];
    for (const ch of manifest.chapters) {
      const p = (ch.draft_file || '').replace(/\//g, path.sep);
      if (!p || !fs.existsSync(p)) { skipped.push(`ch ${ch.id} (no draft file)`); continue; }
      if (!includeAll) {
        if (ch.status !== 'passed') {
          skipped.push(`ch ${ch.id} (status: ${ch.status})`);
          continue;
        }
        // Enforce T-10 machine-checkable Stage 04 gate artifacts
        const pad = String(ch.id).padStart(2, '0');
        const vDir = path.join('stages', '04_diagnostics_edits', 'output', 'verdicts', `ch${pad}`);
        const requiredChecks = ['scan', 'canon_check', 'rubric', 'ledger_delivery'];
        const gateIssues = [];
        for (const req of requiredChecks) {
          const vFile = path.join(vDir, `${req}.json`);
          if (!fs.existsSync(vFile)) {
            gateIssues.push(`missing ${req}`);
          } else {
            try {
              const vData = JSON.parse(fs.readFileSync(vFile, 'utf8'));
              if (vData.verdict !== 'PASS' && vData.verdict !== 'SKIP') {
                gateIssues.push(`failed ${req}`);
              }
            } catch (e) {
              gateIssues.push(`corrupted ${req}`);
            }
          }
        }
        if (gateIssues.length > 0) {
          skipped.push(`ch ${ch.id} (unverified Stage 04 gate: ${gateIssues.join(', ')})`);
          continue;
        }
      }
      chapters.push({ title: ch.title || `Chapter ${ch.id}`, file: p });
    }
    if (skipped.length) {
      console.log(`Skipped ${skipped.length} chapter(s): ${skipped.join(', ')}`);
      if (!includeAll) console.log('Use --all to compile regardless of the Stage 04 gate.');
    }
  } else {
    if (!fs.existsSync(CHAPTERS_DIR)) {
      console.error(`No ${MANIFEST} and no chapters at ${CHAPTERS_DIR}.`);
      process.exitCode = 1;
      return;
    }
    chapters = fs.readdirSync(CHAPTERS_DIR)
      .filter(f => /\.(md|markdown|txt)$/i.test(f)).sort()
      .map(f => ({ title: f.replace(/\.(md|markdown|txt)$/i, '').replace(/[_-]+/g, ' '), file: path.join(CHAPTERS_DIR, f) }));
  }

  if (chapters.length === 0) {
    console.error('Nothing to compile — no eligible chapters.');
    process.exitCode = 1;
    return;
  }

  const title = manifest?.title && !manifest.title.startsWith('[') ? manifest.title : 'Untitled Manuscript';
  const author = manifest?.author && !manifest.author.startsWith('[') ? manifest.author : '';
  let totalWords = 0;

  const bodyHtml = chapters.map((ch, i) => {
    const raw = stripFrontmatter(fs.readFileSync(ch.file, 'utf8'));
    totalWords += (raw.match(/[\w'’-]+/g) || []).length;
    // Drop a leading markdown H1 if it duplicates the chapter title slot
    const cleaned = raw.replace(/^#\s+.*\n+/, '');
    return `<section class="chapter">\n<h2 class="chapter-title">${escapeHtml(ch.title)}</h2>\n${mdToHtml(cleaned)}\n</section>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #1a1a1a; margin: 0; }
  main { max-width: 34em; margin: 0 auto; padding: 3rem 1.5rem; }
  .title-page { text-align: center; padding: 30vh 0 10vh; page-break-after: always; }
  .title-page h1 { font-size: 2.2em; letter-spacing: .02em; margin: 0 0 .5em; }
  .title-page .author { font-variant: small-caps; font-size: 1.1em; }
  .chapter { page-break-before: always; }
  .chapter-title { text-align: center; font-variant: small-caps; margin: 4rem 0 2.5rem; font-weight: normal; font-size: 1.3em; }
  p { margin: 0; text-indent: 1.4em; text-align: justify; }
  .chapter p:first-of-type, hr.scene-break + p { text-indent: 0; }
  hr.scene-break { border: none; text-align: center; margin: 1.4em 0; }
  hr.scene-break::after { content: "⁂"; color: #666; }
</style>
</head>
<body>
<main>
<div class="title-page"><h1>${escapeHtml(title)}</h1>${author ? `<div class="author">${escapeHtml(author)}</div>` : ''}</div>
${bodyHtml}
</main>
</body>
</html>
`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const htmlPath = path.join(OUT_DIR, 'manuscript.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`\x1b[32m✔\x1b[0m ${htmlPath} (${chapters.length} chapters, ${totalWords.toLocaleString()} words)`);

  const wantsDocx = args.includes('--docx') || args.includes('--format=docx');
  const wantsEpub = args.includes('--epub') || args.includes('--format=epub');

  // Pandoc export
  const probe = spawnSync('pandoc --version', { shell: true, stdio: 'ignore' });
  if (probe.status === 0) {
    const q = s => `"${String(s).replace(/"/g, '')}"`;

    if (!wantsDocx || wantsEpub) {
      const epubPath = path.join(OUT_DIR, 'manuscript.epub');
      let cmd = `pandoc ${q(htmlPath)} -o ${q(epubPath)} --split-level=1 --metadata ${q(`title=${title}`)}`;
      if (author) cmd += ` --metadata ${q(`author=${author}`)}`;
      const res = spawnSync(cmd, { shell: true, encoding: 'utf8' });
      if (res.status === 0) console.log(`\x1b[32m✔\x1b[0m ${epubPath}`);
      else console.error(`pandoc EPUB export failed: ${(res.stderr || '').trim()}`);
    }

    if (wantsDocx) {
      const docxPath = path.join(OUT_DIR, 'manuscript.docx');
      let docxCmd = `pandoc ${q(htmlPath)} -o ${q(docxPath)} --metadata ${q(`title=${title}`)}`;
      if (author) docxCmd += ` --metadata ${q(`author=${author}`)}`;
      const docxRes = spawnSync(docxCmd, { shell: true, encoding: 'utf8' });
      if (docxRes.status === 0) console.log(`\x1b[32m✔\x1b[0m ${docxPath}`);
      else console.error(`pandoc DOCX export failed: ${(docxRes.stderr || '').trim()}`);
    }
  } else {
    if (wantsDocx || wantsEpub) {
      console.log(`\x1b[33mNote: Exporting to ${wantsDocx ? '.docx' : '.epub'} requires pandoc (https://pandoc.org).\x1b[0m`);
      console.log(`Your manuscript has been compiled to HTML at ${htmlPath}, which can be opened directly in Microsoft Word and saved as .docx.`);
    } else {
      console.log('pandoc not found — HTML only. Install pandoc (https://pandoc.org) for EPUB and DOCX export.');
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('compile_manuscript.js')) {
  compileManuscript(process.argv.slice(2));
}

#!/usr/bin/env node
// Mechanical continuity assist (Stage 04).
// Scans all chapters for proper-noun issues the judgment audit easily misses:
//   1. Near-duplicate names (Elara/Elera — likely a misspelled character)
//   2. Single-chapter names (possible renamed/orphaned characters)
//   3. A name-first-appearance index (for canon.md cross-checking)
// Judgment-level continuity (facts, timeline, knowledge state) stays with the
// canon check in stages/04_diagnostics_edits/CONTEXT.md — this is only the countable part.
//
// Usage: node scripts/continuity_scan.js [chapters-dir]
// Report: stages/04_diagnostics_edits/output/reports/continuity_names.md

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_INPUT = path.join('stages', '03_drafting', 'output', 'chapters');
const REPORT_DIR = path.join('stages', '04_diagnostics_edits', 'output', 'reports');

// Common capitalized non-names to ignore (sentence starters slip through the mid-sentence filter occasionally)
const STOPWORDS = new Set(['The', 'She', 'He', 'They', 'It', 'And', 'But', 'Then', 'When', 'What', 'That', 'This', 'There', 'Her', 'His', 'You', 'Not', 'Now', 'Once', 'After', 'Before', 'Inside', 'Outside', 'Chapter', 'God', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'North', 'South', 'East', 'West', 'Earth', 'Everyone', 'Everything', 'Nobody', 'Nothing', 'Someone', 'Something', 'Maybe', 'Yes', 'No', 'Okay', 'Fine', 'Right', 'Well', 'Look', 'Wait', 'Stop', 'Please', 'Thanks', 'Sorry', 'Jesus', 'Christ', 'Mom', 'Dad', 'Mother', 'Father', 'Doctor', 'Captain', 'Sergeant', 'Commander', 'Chief', 'Professor', 'Mister', 'Miss']);

function stripFrontmatter(text) {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

// Extract capitalized tokens with positional evidence. Names in prose usually OPEN
// sentences, so a pure mid-sentence filter misses them; instead we count every
// occurrence and track two "definitely a name" signals per token:
//   mid  — appeared mid-sentence at least once
//   poss — appeared with a possessive ('s) at least once
function extractTokens(text) {
  const tokens = new Map(); // word → { total, mid, poss }
  const re = /(^|[\s"“”'‘(—-])([A-Z][a-z]{2,})(['’]s)?\b/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const word = m[2];
    if (STOPWORDS.has(word)) continue;
    const entry = tokens.get(word) || { total: 0, mid: 0, poss: 0 };
    entry.total++;
    // mid-sentence: the char before the separator isn't a sentence terminator/line start
    const before = text.slice(Math.max(0, m.index - 1), m.index);
    if (m[1] && before && !/[.!?\n]/.test(before) && !/[\n]/.test(m[1])) entry.mid++;
    if (m[3]) entry.poss++;
    tokens.set(word, entry);
  }
  return tokens;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

export function runContinuityScan(targets) {
  const dir = targets && targets.length ? targets[0] : DEFAULT_INPUT;
  if (!fs.existsSync(dir)) {
    console.error(`Chapters directory not found: ${dir}`);
    process.exitCode = 1;
    return;
  }
  const files = fs.readdirSync(dir).filter(f => /\.(md|txt|markdown)$/i.test(f)).sort();
  if (files.length === 0) {
    console.error(`No chapter files in ${dir}`);
    process.exitCode = 1;
    return;
  }

  // word → { total, mid, poss, chapters: Map(file → count), first: file }
  const registry = new Map();
  for (const file of files) {
    const text = stripFrontmatter(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const [word, t] of extractTokens(text)) {
      if (!registry.has(word)) registry.set(word, { total: 0, mid: 0, poss: 0, chapters: new Map(), first: file });
      const entry = registry.get(word);
      entry.total += t.total;
      entry.mid += t.mid;
      entry.poss += t.poss;
      entry.chapters.set(file, t.total);
    }
  }

  // Confirmed names: ≥2 occurrences with at least one strong name signal (mid-sentence or possessive use)
  const names = [...registry.entries()]
    .filter(([, e]) => e.total >= 2 && (e.mid >= 1 || e.poss >= 1))
    .sort((a, b) => b[1].total - a[1].total);

  // 1. Near-duplicates: confirmed names vs ALL tokens (so a one-off typo like "Marra"
  //    still gets caught against the real "Mara"). Distance budget scales with length.
  const nearDupes = [];
  const seenPair = new Set();
  const allTokens = [...registry.entries()];
  for (const [a, ea] of names) {
    for (const [b, eb] of allTokens) {
      if (a === b) continue;
      const minLen = Math.min(a.length, b.length);
      if (minLen < 4) continue;
      const maxD = minLen >= 6 ? 2 : 1;
      const d = levenshtein(a.toLowerCase(), b.toLowerCase());
      if (d > 0 && d <= maxD) {
        const key = [a, b].sort().join('|');
        if (seenPair.has(key)) continue;
        seenPair.add(key);
        nearDupes.push({ a, b, aCount: ea.total, bCount: eb.total });
      }
    }
  }

  // 2. Single-chapter names with meaningful frequency (≥ 3 mentions in one chapter, nowhere else)
  const singles = names.filter(([, e]) => e.chapters.size === 1 && e.total >= 3);

  const lines = [];
  lines.push('# Continuity Scan — proper nouns');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}  |  Scanned: ${files.length} chapters in ${dir}`);
  lines.push('');
  lines.push('## ⚠️ Near-duplicate names (possible misspellings — verify against canon.md "Names & spellings")');
  if (nearDupes.length === 0) lines.push('- none found');
  nearDupes.forEach(d => lines.push(`- **${d.a}** (×${d.aCount}) vs **${d.b}** (×${d.bCount}) — if these are the same character/place, one spelling is wrong everywhere it appears`));
  lines.push('');
  lines.push('## ℹ️ Names appearing in only one chapter (≥3 mentions — renamed character? dropped thread?)');
  if (singles.length === 0) lines.push('- none found');
  singles.forEach(([name, e]) => lines.push(`- **${name}** ×${e.total}, only in ${e.first}`));
  lines.push('');
  lines.push('## Name index (first appearance — cross-check canon.md)');
  lines.push('| Name | Total | Chapters | First seen |');
  lines.push('|---|---|---|---|');
  names.slice(0, 60).forEach(([name, e]) => lines.push(`| ${name} | ${e.total} | ${e.chapters.size} | ${e.first} |`));
  lines.push('');
  lines.push('> Heuristic scan: mid-sentence capitalized tokens. Judgment continuity (facts, timeline, knowledge state) is the canon check in Stage 04 — this list only feeds it.');

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, 'continuity_names.md');
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

  console.log(`Scanned ${files.length} chapters: ${names.length} recurring names, ${nearDupes.length} near-duplicate pair(s), ${singles.length} single-chapter name(s).`);
  nearDupes.forEach(d => console.log(`  \x1b[33m⚠\x1b[0m ${d.a} / ${d.b}`));
  console.log(`Report: ${reportPath}`);
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('continuity_scan.js')) {
  runContinuityScan(process.argv.slice(2));
}

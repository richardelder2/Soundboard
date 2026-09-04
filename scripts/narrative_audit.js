#!/usr/bin/env node
// Narrative authenticity scanner (Stage 04, mechanical layer).
// Counts the countable subset of _config/narrative_authenticity.md:
// emotion-mode balance, olfactory density, dialogue ratio, rhythm variance,
// lexical tells, triad stacking, em-dash rate, opener repetition, moralizing tails.
// Structural features (subplots, anachrony, resolutions) need the LLM rubric:
// _config/narrative_audit_rubric.md
//
// Usage:
//   node scripts/narrative_audit.js [file-or-dir ...]
// Default input: stages/03_drafting/output/chapters
// Reports: stages/04_diagnostics_edits/output/reports/

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_INPUT = path.join('stages', '03_drafting', 'output', 'chapters');
const REPORT_DIR = path.join('stages', '04_diagnostics_edits', 'output', 'reports');

// ---------- pattern banks ----------

const EMBODIED_PATTERNS = [
  /\bchest (?:tighten|constrict|clench)\w*/gi,
  /\btight(?:ness|ening)? in (?:his|her|their|my) chest\b/gi,
  /\bbreath (?:caught|hitched|stuttered)\b/gi,
  /\bstomach (?:dropped|knotted|clenched|churned|twisted|lurched|flipped)\w*/gi,
  /\bheart (?:hammer|pound|race|thud|clench|stutter|slam)\w*/gi,
  /\bthroat (?:tighten|close|constrict|went dry)\w*/gi,
  /\bcold sweat\b/gi,
  /\bpulse (?:raced|quickened|spiked|pounded)\b/gi,
  /\bblood ran cold\b/gi,
  /\bknuckles whiten\w*|\bwhite-knuckl\w*/gi,
  /\bbile rose\b/gi,
  /\bgut (?:clenched|twisted|churned)\b/gi,
  /\bjaw (?:clenched|tightened|worked)\b/gi,
  /\bhands? (?:trembled|shook|shaking)\b/gi,
  /\bshiver (?:ran|crawled|raced) (?:down|up|through)\b|\bsent a shiver\b/gi,
  /\bgoose ?bumps?\b|\bhairs? (?:rose|stood|prickled)\b/gi,
];

const EMOTION_WORDS = '(?:afraid|scared|terrified|frightened|angry|furious|livid|sad|unhappy|happy|relieved|anxious|nervous|ashamed|guilty|jealous|lonely|embarrassed|humiliated|frustrated|worried|glad|miserable|hopeful|hopeless|heartbroken|content|proud|disgusted|grateful|resentful|bitter|calm|panicked|desperate|exhausted)';
const EXPLICIT_LABEL_PATTERNS = [
  new RegExp(`\\b(?:was|were|felt|feeling|is|am|be(?:en)?|got|grew|became)\\s+(?:so\\s+|very\\s+|suddenly\\s+|too\\s+)?${EMOTION_WORDS}\\b`, 'gi'),
  new RegExp(`\\bfelt\\s+(?:a\\s+(?:wave|surge|stab|flash)\\s+of\\s+)?(?:fear|dread|grief|joy|relief|shame|anger|panic|guilt|envy|hope|despair|pride|disgust)\\b`, 'gi'),
];

const OLFACTORY = /\b(?:smell|smelled|smelling|smells|scent|scented|odor|odour|reek|reeked|stench|whiff|aroma|musty|acrid|fragran\w*|perfume\w*|sniff\w*)\b/gi;

const LEXICAL_TELLS = {
  'began to / started to': /\b(?:began|started) to\b/gi,
  'seemed to': /\bseemed to\b/gi,
  'managed to': /\bmanaged to\b/gi,
  'found him/her/themself': /\bfound (?:himself|herself|themselves|myself)\b/gi,
  "couldn't help but": /\bcouldn'?t help but\b/gi,
  'something shifted': /\bsomething shifted\b/gi,
  'delve': /\bdelv(?:e|ed|ing|es)\b/gi,
  'tapestry': /\btapestr(?:y|ies)\b/gi,
  'testament (to)': /\btestament\b/gi,
  'myriad': /\bmyriad\b/gi,
  'palpable': /\bpalpable\b/gi,
  'unwavering': /\bunwavering\b/gi,
  'kaleidoscope': /\bkaleidoscop\w*/gi,
  'cacophony': /\bcacophon\w*/gi,
  'liminal': /\bliminal\b/gi,
  'symphony of': /\bsymphony of\b/gi,
  'a beat (pause)': /\b(?:waited|paused for|let|after) a beat\b|\ba beat passed\b/gi,
};

const TRIAD_PATTERNS = [
  /\bnot (?:just |only |merely )?[^,.;]{2,40}, (?:not|nor) [^,.;]{2,40},? but\b/gi, // not X, not Y, but Z
  /\bno [^,.;]{2,30}, no [^,.;]{2,30}, (?:just|only|no)\b/gi,                       // no X, no Y, just Z
  /\b\w+ed, \w+ed, (?:and |then )?\w+ed\b/gi,                                       // verbed, verbed, verbed
];
const GENERIC_LIST_TRIAD = /\b[\w'’-]+, [\w'’-]+, and [\w'’-]+\b/g;

const MORALIZING_TAIL = /\b(?:learned|understood|understanding|realized|realised|knew now|in the end|what (?:really )?mattered|the lesson|had taught (?:him|her|them)|come to (?:see|understand|accept)|it was enough)\b/gi;

const ANACHRONY_MARKERS = /\b(?:years? (?:later|earlier|before|ago)|months? (?:later|earlier|ago)|decades? (?:later|earlier|ago)|would (?:later|one day|come to)|had been\b|back (?:then|when)|long before|that (?:was|had been) (?:before|after)|remember(?:ed|ing)\b)/gi;

// ---------- helpers ----------

function stripFrontmatter(text) {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

function countMatches(text, regex) {
  const m = text.match(regex);
  return m ? m.length : 0;
}

function stats(nums) {
  if (nums.length === 0) return { mean: 0, sd: 0, cv: 0 };
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
  const sd = Math.sqrt(variance);
  return { mean, sd, cv: mean > 0 ? sd / mean : 0 };
}

function splitSentences(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?…])\s+(?=["“‘'A-Z])|\n{2,}/)
    .map(s => s.trim())
    .filter(s => s.split(/\s+/).length >= 1 && /\w/.test(s));
}

function per1k(count, words) {
  return words > 0 ? (count / words) * 1000 : 0;
}

// ---------- core analysis ----------

function analyze(text) {
  const body = stripFrontmatter(text);
  const words = (body.match(/[\w'’-]+/g) || []).length;
  const sentences = splitSentences(body);
  const sentenceLens = sentences.map(s => (s.match(/[\w'’-]+/g) || []).length).filter(n => n > 0);
  const paragraphs = body.split(/\n{2,}/).map(p => p.trim()).filter(p => /\w/.test(p));
  const paraLens = paragraphs.map(p => (p.match(/[\w'’-]+/g) || []).length);

  // dialogue ratio: share of characters inside quotation marks
  const dialogueChars = (body.match(/"[^"\n]{2,}"|“[^”\n]{2,}”/g) || []).join('').length;
  const dialogueRatio = body.length > 0 ? dialogueChars / body.length : 0;

  // emotion modes
  const embodied = EMBODIED_PATTERNS.reduce((n, re) => n + countMatches(body, re), 0);
  const explicit = EXPLICIT_LABEL_PATTERNS.reduce((n, re) => n + countMatches(body, re), 0);
  const emotionTotal = embodied + explicit;
  const embodiedShare = emotionTotal > 0 ? embodied / emotionTotal : 0;

  // lexical tells
  const tells = {};
  let tellTotal = 0;
  for (const [name, re] of Object.entries(LEXICAL_TELLS)) {
    const c = countMatches(body, re);
    if (c > 0) tells[name] = c;
    tellTotal += c;
  }

  // triads
  const patternTriads = TRIAD_PATTERNS.reduce((n, re) => n + countMatches(body, re), 0);
  const listTriads = countMatches(body, GENERIC_LIST_TRIAD);

  // opener repetition
  const openers = sentences.map(s => (s.replace(/^["“‘']+/, '').match(/[\w'’-]+/) || [''])[0].toLowerCase());
  let maxRun = 1, run = 1;
  for (let i = 1; i < openers.length; i++) {
    run = openers[i] && openers[i] === openers[i - 1] ? run + 1 : 1;
    if (run > maxRun) maxRun = run;
  }
  const openerFreq = {};
  openers.forEach(o => { if (o) openerFreq[o] = (openerFreq[o] || 0) + 1; });
  const topOpener = Object.entries(openerFreq).sort((a, b) => b[1] - a[1])[0] || ['', 0];

  // moralizing tail: last 15% of the text
  const tail = body.slice(Math.floor(body.length * 0.85));
  const moralizing = tail.match(MORALIZING_TAIL) || [];

  return {
    words,
    sentenceCount: sentenceLens.length,
    sentence: stats(sentenceLens),
    paragraph: stats(paraLens),
    oneLineParas: paraLens.filter(n => n <= 12).length,
    dialogueRatio,
    embodied, explicit, embodiedShare,
    olfactoryCount: countMatches(body, OLFACTORY),
    olfactoryPer1k: per1k(countMatches(body, OLFACTORY), words),
    emDashCount: countMatches(body, /—|--/g),
    emDashPer1k: per1k(countMatches(body, /—|--/g), words),
    tells, tellTotal,
    patternTriads,
    listTriadsPer1k: per1k(listTriads, words),
    maxOpenerRun: maxRun,
    topOpener: { word: topOpener[0], share: sentenceLens.length ? topOpener[1] / sentenceLens.length : 0 },
    moralizing: [...new Set(moralizing.map(m => m.toLowerCase()))],
    anachronyPer1k: per1k(countMatches(body, ANACHRONY_MARKERS), words),
  };
}

// ---------- flags (thresholds from _config/narrative_authenticity.md) ----------

function flag(cond, level, msg) {
  return cond ? { level, msg } : null;
}

function buildFlags(r) {
  return [
    flag(r.embodiedShare > 0.5 && r.embodied >= 3, 'RED', `Embodied emotion dominates (${(r.embodiedShare * 100).toFixed(0)}% of detected emotion beats; target ≤ ~40%). Rotate in explicit labels and behavioral cues.`),
    flag(r.explicit === 0 && r.embodied >= 3, 'RED', 'No plainly named feelings detected. Humans state emotions outright far more than AI does.'),
    flag(r.olfactoryPer1k > 1.5 && r.olfactoryCount >= 3, 'WARN', `Olfactory density ${r.olfactoryPer1k.toFixed(2)}/1k words (${r.olfactoryCount} refs) — smell is the most over-used AI sense. Keep only beats that earn their place.`),
    flag(r.sentence.cv < 0.5, 'RED', `Sentence-length variation too low (CV ${r.sentence.cv.toFixed(2)}; target ≥ 0.5). Mix fragments with long winding sentences.`),
    flag(r.emDashPer1k > 4 && r.emDashCount >= 4, 'RED', `Em-dash rate ${r.emDashPer1k.toFixed(1)}/1k words (${r.emDashCount} total; target ≤ 4/1k). Swap some for commas, parentheses, periods.`),
    flag(r.tellTotal > 0, 'RED', `Lexical tells found: ${Object.entries(r.tells).map(([k, v]) => `${k} ×${v}`).join(', ')}.`),
    flag(r.patternTriads > 0, 'WARN', `"Not X, not Y, but Z"-style constructions: ${r.patternTriads}. One rhetorical triad per chapter max.`),
    flag(r.listTriadsPer1k > 2, 'WARN', `Three-item lists at ${r.listTriadsPer1k.toFixed(1)}/1k words — the rule-of-three is an AI rhythm. Break some into ones and twos.`),
    flag(r.dialogueRatio < 0.15, 'WARN', `Dialogue is only ${(r.dialogueRatio * 100).toFixed(0)}% of text. Humans write proportionally more dialogue; convert narration to talk where possible.`),
    flag(r.maxOpenerRun >= 3, 'WARN', `${r.maxOpenerRun} consecutive sentences open with the same word.`),
    flag(r.topOpener.share > 0.25 && r.sentenceCount > 20, 'WARN', `"${r.topOpener.word}" opens ${(r.topOpener.share * 100).toFixed(0)}% of sentences.`),
    flag(r.moralizing.length > 0, 'WARN', `Possible stated-lesson language near the ending: ${r.moralizing.join(', ')}. The narrator must not explain the theme.`),
    flag(r.anachronyPer1k < 1 && r.words > 1500, 'INFO', 'Few time-shift markers detected — verify this chapter\'s anachrony assignment in structure_plan.md (linear-only time is an AI tell at book level).'),
  ].filter(Boolean);
}

// ---------- report ----------

function fmtReport(name, r, flags) {
  const lines = [];
  lines.push(`# Narrative Audit — ${name}`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}  |  Scanner: scripts/narrative_audit.js  |  Rules: _config/narrative_authenticity.md`);
  lines.push('');
  const reds = flags.filter(f => f.level === 'RED').length;
  const warns = flags.filter(f => f.level === 'WARN').length;
  lines.push(`**Verdict: ${reds > 0 ? '❌ FAIL' : warns > 0 ? '⚠️ REVIEW' : '✅ CLEAN'}** (${reds} red, ${warns} warn)`);
  lines.push('');
  if (flags.length) {
    lines.push('## Flags');
    flags.forEach(f => lines.push(`- **[${f.level}]** ${f.msg}`));
    lines.push('');
  }
  lines.push('## Metrics');
  lines.push('| Metric | Value | Human-typical target |');
  lines.push('|---|---|---|');
  lines.push(`| Words | ${r.words} | — |`);
  lines.push(`| Sentence length mean / CV | ${r.sentence.mean.toFixed(1)} / ${r.sentence.cv.toFixed(2)} | CV ≥ 0.5 |`);
  lines.push(`| Paragraph length mean / CV | ${r.paragraph.mean.toFixed(1)} / ${r.paragraph.cv.toFixed(2)} | varied; short paras exist |`);
  lines.push(`| Dialogue share of text | ${(r.dialogueRatio * 100).toFixed(0)}% | ≥ ~15–20%, genre-dependent |`);
  lines.push(`| Emotion beats: explicit / embodied | ${r.explicit} / ${r.embodied} | embodied ≤ ~40% of beats |`);
  lines.push(`| Olfactory refs per 1k words | ${r.olfactoryPer1k.toFixed(2)} | ≤ 1.5 |`);
  lines.push(`| Em-dashes per 1k words | ${r.emDashPer1k.toFixed(1)} | ≤ 4 |`);
  lines.push(`| Lexical tells | ${r.tellTotal} | 0 |`);
  lines.push(`| Rhetorical triads / list triads per 1k | ${r.patternTriads} / ${r.listTriadsPer1k.toFixed(1)} | ≤ 1 per chapter / ≤ 2 |`);
  lines.push(`| Max same-word sentence-opener run | ${r.maxOpenerRun} | ≤ 2 |`);
  lines.push(`| Time-shift markers per 1k | ${r.anachronyPer1k.toFixed(1)} | cross-check structure_plan |`);
  lines.push('');
  lines.push('> Structural features (subplots, resolution variety, recontextualizing revelations, moral ambivalence) cannot be counted mechanically — score them with `_config/narrative_audit_rubric.md`.');
  return lines.join('\n');
}

// ---------- main ----------

function collectFiles(targets) {
  const files = [];
  for (const t of targets) {
    if (!fs.existsSync(t)) {
      console.error(`\x1b[33mSkipping missing path: ${t}\x1b[0m`);
      continue;
    }
    const stat = fs.statSync(t);
    if (stat.isDirectory()) {
      fs.readdirSync(t)
        .filter(f => /\.(md|txt|markdown)$/i.test(f))
        .forEach(f => files.push(path.join(t, f)));
    } else {
      files.push(t);
    }
  }
  return files;
}

export function runAudit(targets) {
  const inputs = targets && targets.length ? targets : [DEFAULT_INPUT];
  const files = collectFiles(inputs);
  if (files.length === 0) {
    console.error(`No chapter files found in: ${inputs.join(', ')}`);
    console.error('Pass a file or directory: node scripts/narrative_audit.js <path>');
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const summary = [];

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const r = analyze(text);
    const flags = buildFlags(r);
    const name = path.basename(file).replace(/\.(md|txt|markdown)$/i, '');
    const reportPath = path.join(REPORT_DIR, `audit_${name}.md`);
    fs.writeFileSync(reportPath, fmtReport(name, r, flags), 'utf8');

    const reds = flags.filter(f => f.level === 'RED').length;
    const warns = flags.filter(f => f.level === 'WARN').length;
    const badge = reds > 0 ? '\x1b[31mFAIL\x1b[0m' : warns > 0 ? '\x1b[33mREVIEW\x1b[0m' : '\x1b[32mCLEAN\x1b[0m';
    console.log(`${badge}  ${name}  (${r.words} words, ${reds} red / ${warns} warn)  → ${reportPath}`);
    flags.filter(f => f.level === 'RED').forEach(f => console.log(`   \x1b[31m•\x1b[0m ${f.msg}`));
    summary.push({ name, reds, warns, words: r.words });
  }

  updateManifest(summary);

  const summaryMd = [
    '# Narrative Audit Summary', '',
    `Generated: ${new Date().toISOString()}`, '',
    '| Chapter | Words | Red | Warn |', '|---|---|---|---|',
    ...summary.map(s => `| ${s.name} | ${s.words} | ${s.reds} | ${s.warns} |`),
    '', 'Structural audit still required: `_config/narrative_audit_rubric.md`.',
  ].join('\n');
  fs.writeFileSync(path.join(REPORT_DIR, 'audit_summary.md'), summaryMd, 'utf8');
  console.log(`\nSummary written to ${path.join(REPORT_DIR, 'audit_summary.md')}`);
  console.log('Reminder: this scanner covers prose tells only. Structural tells require the rubric audit.');
}

// If a manuscript.json production ledger exists, record each chapter's scan verdict
// (matched by draft_file basename). Statuses are owned by the stage contracts; only last_audit is written here.
function updateManifest(summary) {
  if (!fs.existsSync('manuscript.json')) return;
  try {
    const manifest = JSON.parse(fs.readFileSync('manuscript.json', 'utf8'));
    if (!Array.isArray(manifest.chapters)) return;
    let touched = 0;
    for (const s of summary) {
      const ch = manifest.chapters.find(c => {
        const base = path.basename(c.draft_file || '').replace(/\.(md|txt|markdown)$/i, '');
        return base && base === s.name;
      });
      if (ch) {
        ch.last_audit = s.reds > 0 ? 'FAIL' : s.warns > 0 ? 'REVIEW' : 'CLEAN';
        touched++;
      }
    }
    if (touched > 0) {
      fs.writeFileSync('manuscript.json', JSON.stringify(manifest, null, 2) + '\n', 'utf8');
      console.log(`Updated last_audit for ${touched} chapter(s) in manuscript.json.`);
    }
  } catch (e) {
    console.error(`Could not update manuscript.json: ${e.message}`);
  }
}

// Run directly (not imported)
if (process.argv[1] && path.resolve(process.argv[1]).endsWith('narrative_audit.js')) {
  runAudit(process.argv.slice(2));
}

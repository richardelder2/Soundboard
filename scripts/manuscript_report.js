import * as fs from 'fs';
import * as path from 'path';

const STOP_4GRAM_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'beneath', 'under',
  'above', 'it', 'was', 'is', 'that', 'this', 'there', 'he', 'she', 'they', 'i',
  'you', 'we', 'had', 'have', 'were', 'been', 'would', 'could', 'should'
]);

function stripFrontmatter(text) {
  return text.replace(/^\uFEFF/, '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

function parseFrontmatter(text) {
  const match = text.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const meta = {};
  match[1].split(/\r?\n/).forEach(line => {
    const colon = line.indexOf(':');
    if (colon > 0) {
      const key = line.slice(0, colon).trim().toLowerCase();
      let val = line.slice(colon + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[key] = val;
    }
  });
  return meta;
}

export function analyzeManuscript(options = {}) {
  const chaptersDir = path.join('stages', '03_drafting', 'output', 'chapters');
  let chapterFiles = [];

  const manifestPath = 'manuscript.json';
  let manifest = null;
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (Array.isArray(manifest.chapters)) {
        for (const ch of manifest.chapters) {
          const p = (ch.draft_file || '').replace(/\//g, path.sep);
          if (p && fs.existsSync(p)) {
            chapterFiles.push({ id: ch.id, title: ch.title || `Chapter ${ch.id}`, path: p });
          }
        }
      }
    } catch (e) {
      // fallback
    }
  }

  if (chapterFiles.length === 0 && fs.existsSync(chaptersDir)) {
    const files = fs.readdirSync(chaptersDir)
      .filter(f => /\.(md|txt|markdown)$/i.test(f))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '') || '0', 10);
        const numB = parseInt(b.replace(/\D/g, '') || '0', 10);
        return numA - numB;
      });
    chapterFiles = files.map((f, i) => {
      const num = parseInt(f.replace(/\D/g, '') || String(i + 1), 10);
      return { id: num, title: f.replace(/\.(md|txt|markdown)$/i, '').replace(/[_-]+/g, ' '), path: path.join(chaptersDir, f) };
    });
  }

  if (chapterFiles.length === 0) {
    return {
      error: 'No chapter files found to analyze.',
      totalChapters: 0,
      totalWords: 0
    };
  }

  const chaptersData = [];
  const povMap = {};
  const global4grams = new Map(); // 4gram -> Set of chapter IDs

  for (const ch of chapterFiles) {
    const raw = fs.readFileSync(ch.path, 'utf8');
    const meta = parseFrontmatter(raw);
    const body = stripFrontmatter(raw);

    // Words & sentences
    const words = body.match(/[\w'’-]+/g) || [];
    const wordCount = words.length;

    // Sentence splitting
    const rawSentences = body
      .replace(/([.?!])\s+/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0 && /[\w]/.test(s));

    const sentenceLengths = rawSentences.map(s => (s.match(/[\w'’-]+/g) || []).length).filter(l => l > 0);
    const sentenceCount = sentenceLengths.length || 1;
    const avgSentenceLength = wordCount / sentenceCount;

    // Standard deviation of sentence length
    const variance = sentenceLengths.reduce((acc, l) => acc + Math.pow(l - avgSentenceLength, 2), 0) / sentenceCount;
    const sentenceLengthStdev = Math.sqrt(variance);

    // Dialogue ratio
    const dialogueMatches = body.match(/["“][^"”]*["”]|«[^»]*»/g) || [];
    let dialogueWords = 0;
    dialogueMatches.forEach(d => {
      dialogueWords += (d.match(/[\w'’-]+/g) || []).length;
    });
    const dialogueRatio = wordCount > 0 ? (dialogueWords / wordCount) * 100 : 0;

    // POV Tracking
    const pov = meta.pov || meta.character || 'Default POV';
    if (!povMap[pov]) {
      povMap[pov] = { pov, words: 0, chapters: [] };
    }
    povMap[pov].words += wordCount;
    povMap[pov].chapters.push(ch.id);

    // 4-grams extraction
    const cleanTokens = words.map(w => w.toLowerCase());
    for (let i = 0; i < cleanTokens.length - 3; i++) {
      const g = [cleanTokens[i], cleanTokens[i + 1], cleanTokens[i + 2], cleanTokens[i + 3]];
      // Check if mostly stop words
      const stopCount = g.filter(w => STOP_4GRAM_WORDS.has(w)).length;
      if (stopCount < 3) {
        const key = g.join(' ');
        if (!global4grams.has(key)) {
          global4grams.set(key, new Set());
        }
        global4grams.get(key).add(ch.id);
      }
    }

    chaptersData.push({
      id: ch.id,
      title: ch.title,
      pov,
      story_date: meta.story_date || meta.date || null,
      elapsed: meta.elapsed || null,
      words: wordCount,
      sentenceCount,
      avgSentenceLength,
      sentenceLengthStdev,
      dialogueRatio
    });
  }

  const totalWords = chaptersData.reduce((acc, c) => acc + c.words, 0);

  // Cross-Chapter Voice Drift Analysis (> 2 sigma)
  const n = chaptersData.length;
  const meanSentLen = chaptersData.reduce((acc, c) => acc + c.avgSentenceLength, 0) / n;
  const sentLenVariance = chaptersData.reduce((acc, c) => acc + Math.pow(c.avgSentenceLength - meanSentLen, 2), 0) / (n || 1);
  const sentLenSigma = Math.sqrt(sentLenVariance);

  const meanDialRatio = chaptersData.reduce((acc, c) => acc + c.dialogueRatio, 0) / n;
  const dialVariance = chaptersData.reduce((acc, c) => acc + Math.pow(c.dialogueRatio - meanDialRatio, 2), 0) / (n || 1);
  const dialSigma = Math.sqrt(dialVariance);

  const voiceDriftOutliers = [];
  chaptersData.forEach(c => {
    const sentZ = sentLenSigma > 0 ? (c.avgSentenceLength - meanSentLen) / sentLenSigma : 0;
    const dialZ = dialSigma > 0 ? (c.dialogueRatio - meanDialRatio) / dialSigma : 0;

    c.sentZ = sentZ;
    c.dialZ = dialZ;

    if (Math.abs(sentZ) >= 2.0) {
      voiceDriftOutliers.push({
        chapter: c.id,
        metric: 'Average Sentence Length',
        value: c.avgSentenceLength.toFixed(1),
        mean: meanSentLen.toFixed(1),
        zScore: sentZ.toFixed(2),
        direction: sentZ > 0 ? 'Significantly Longer' : 'Significantly Shorter'
      });
    }
    if (Math.abs(dialZ) >= 2.0) {
      voiceDriftOutliers.push({
        chapter: c.id,
        metric: 'Dialogue Ratio',
        value: `${c.dialogueRatio.toFixed(1)}%`,
        mean: `${meanDialRatio.toFixed(1)}%`,
        zScore: dialZ.toFixed(2),
        direction: dialZ > 0 ? 'Heavy Dialogue Spike' : 'Dialogue Deprivation'
      });
    }
  });

  // Cross-chapter 4-grams appearing in 3+ chapters
  const repeating4grams = [];
  for (const [phrase, chSet] of global4grams.entries()) {
    if (chSet.size >= 3) {
      repeating4grams.push({
        phrase,
        chapterCount: chSet.size,
        chapters: Array.from(chSet).sort((a, b) => a - b)
      });
    }
  }
  repeating4grams.sort((a, b) => b.chapterCount - a.chapterCount);

  // POV Budget calculation
  const povBudget = Object.values(povMap).map(p => ({
    pov: p.pov,
    words: p.words,
    percentage: totalWords > 0 ? ((p.words / totalWords) * 100).toFixed(1) : '0.0',
    chapters: p.chapters
  })).sort((a, b) => b.words - a.words);

  return {
    totalChapters: n,
    totalWords,
    meanSentLen,
    sentLenSigma,
    meanDialRatio,
    dialSigma,
    chapters: chaptersData,
    voiceDriftOutliers,
    repeating4grams: repeating4grams.slice(0, 15),
    povBudget
  };
}

export function formatManuscriptReport(report) {
  const lines = [];
  lines.push('# Manuscript Health & Escalation Report');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Total Chapters: ${report.totalChapters} | Total Manuscript Words: ${report.totalWords.toLocaleString()}\n`);

  lines.push('## 1. Rhythm & Escalation Contour');
  lines.push('| Chapter | Words | Avg Sent Len | StDev | Dialogue % | Sent Z-Score | Dial Z-Score |');
  lines.push('|---|---|---|---|---|---|---|');
  report.chapters.forEach(c => {
    lines.push(`| Ch ${String(c.id).padStart(2, '0')} | ${c.words.toLocaleString()} | ${c.avgSentenceLength.toFixed(1)}w | ${c.sentenceLengthStdev.toFixed(1)} | ${c.dialogueRatio.toFixed(1)}% | ${c.sentZ > 0 ? '+' : ''}${c.sentZ.toFixed(2)}σ | ${c.dialZ > 0 ? '+' : ''}${c.dialZ.toFixed(2)}σ |`);
  });
  lines.push(`\n**Manuscript Baseline:** Avg Sentence Length = ${report.meanSentLen.toFixed(1)}w (σ = ${report.sentLenSigma.toFixed(1)}w) | Mean Dialogue = ${report.meanDialRatio.toFixed(1)}% (σ = ${report.dialSigma.toFixed(1)}%)\n`);

  lines.push('## 2. Voice Drift Outliers (>2.0σ)');
  if (report.voiceDriftOutliers.length === 0) {
    lines.push('✔ No voice drift outliers detected. Stylistic rhythm remains within normal variance across all chapters.\n');
  } else {
    lines.push('| Chapter | Metric | Chapter Value | Manuscript Mean | Z-Score | Observation |');
    lines.push('|---|---|---|---|---|---|');
    report.voiceDriftOutliers.forEach(o => {
      lines.push(`| Ch ${o.chapter} | ${o.metric} | ${o.value} | ${o.mean} | ${o.zScore}σ | ${o.direction} |`);
    });
    lines.push('\n*Recommendation: Review outlier chapters against `_config/voice.md` or voice exemplars to confirm deliberate narrative pacing shifts versus accidental register drift.*\n');
  }

  lines.push('## 3. POV Distribution & Pacing Budget');
  lines.push('| POV Character | Word Count | % of Manuscript | Chapter Count | Chapters |');
  lines.push('|---|---|---|---|---|');
  report.povBudget.forEach(p => {
    lines.push(`| **${p.pov}** | ${p.words.toLocaleString()} words | ${p.percentage}% | ${p.chapters.length} ch | ${p.chapters.map(c => `Ch ${c}`).join(', ')} |`);
  });
  lines.push('');

  lines.push('## 4. Cross-Chapter 4-Gram Echoes & Repetition');
  if (report.repeating4grams.length === 0) {
    lines.push('✔ No cross-chapter 4-gram repetition detected across 3 or more chapters.\n');
  } else {
    lines.push('| Repeating 4-Gram Phrase | Chapter Frequency | Distinct Chapters |');
    lines.push('|---|---|---|');
    report.repeating4grams.forEach(r => {
      lines.push(`| "${r.phrase}" | ${r.chapterCount} chapters | ${r.chapters.map(c => `Ch ${c}`).join(', ')} |`);
    });
    lines.push('\n*Recommendation: Scan repeating 4-grams to eliminate accidental authorial verbal tics and redundant descriptive formulas.*\n');
  }

  return lines.join('\n');
}

export function runManuscriptReport(args = []) {
  const report = analyzeManuscript();
  if (report.error) {
    console.error(`\x1b[31mError: ${report.error}\x1b[0m`);
    return;
  }

  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const formatted = formatManuscriptReport(report);
  const outDir = path.join('stages', '04_diagnostics_edits', 'output', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const reportPath = path.join(outDir, 'manuscript_report.md');
  fs.writeFileSync(reportPath, formatted, 'utf8');

  console.log(`\n========================================`);
  console.log(`       Manuscript Health Report`);
  console.log(`========================================`);
  console.log(`Total Chapters Analyzed: ${report.totalChapters}`);
  console.log(`Total Word Count:        ${report.totalWords.toLocaleString()}`);
  console.log(`Rhythm Baseline:         ${report.meanSentLen.toFixed(1)} w/sent | ${report.meanDialRatio.toFixed(1)}% dialogue`);
  console.log(`Voice Drift Outliers:    ${report.voiceDriftOutliers.length > 0 ? `\x1b[33m${report.voiceDriftOutliers.length} detected\x1b[0m` : '\x1b[32m0 (clean)\x1b[0m'}`);
  console.log(`Cross-Chapter Echoes:    ${report.repeating4grams.length > 0 ? `\x1b[33m${report.repeating4grams.length} frequent 4-grams\x1b[0m` : '\x1b[32m0 (clean)\x1b[0m'}`);
  console.log(`Full Report Written To:  ${reportPath}\n`);
}

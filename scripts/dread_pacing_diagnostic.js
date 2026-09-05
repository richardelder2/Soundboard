#!/usr/bin/env node

/**
 * Dread & Suspense Pacing Analyzer (SAGA 3.0)
 * Zero dependencies, pure ESM Node.js script.
 * 
 * Analyzes dread-vocabulary density and sentence length compression in horror/suspense
 * scenes to verify that high-threat moments use staccato sentence pacing in 04_Review/.
 */

import * as fs from 'fs';
import * as path from 'path';

import { getReviewDir, getChapterFiles } from './path_helper.js';

const customTarget = process.argv[2];
const files = getChapterFiles(customTarget);
const REVIEW_DIR = getReviewDir();
const OUTPUT_REPORT = path.join(REVIEW_DIR, 'dread_report.md');

if (files.length === 0) {
  console.log('No drafting chapters found. Provide a chapter path or run from a novel workspace.');
  process.exit(0);
}

console.log(`Analyzing dread pacing across ${files.length} chapter(s)...`);

const DREAD_LEXICON = /\b(darkness|shadow|cold|threat|dread|panic|heartbeat|bpm|screaming|shriek|chase|chased|terror|horror|pulse|blood|breath|suffocate|suffocating|vacuum|die|dying|death|danger|warn|warning|alert)\b/i;

const chaptersData = [];

files.forEach(file => {
  const filePath = file;
  const fileName = path.basename(file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const cleanContent = content.replace(/^---[\s\S]*?---/, '');
  const paragraphs = cleanContent.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  
  let totalDreadWords = 0;
  let wordCount = 0;
  const sluggishSuspenseBlocks = [];

  paragraphs.forEach((p, idx) => {
    if (p.startsWith('#') || p.startsWith('[')) return;
    
    const words = p.split(/\s+/).filter(Boolean);
    wordCount += words.length;
    
    let dreadCount = 0;
    words.forEach(w => {
      const clean = w.replace(/[^\w]/g, '').toLowerCase();
      if (DREAD_LEXICON.test(clean)) {
        dreadCount++;
        totalDreadWords++;
      }
    });

    const dreadDensity = (dreadCount / words.length) * 100;
    
    // Heuristic: If dread density is high (>8%), check sentence lengths.
    // Suspense needs short, compressed sentences. If average sentence length in a dread paragraph is > 18 words, it's sluggish.
    if (dreadDensity > 8.0 && words.length > 50) {
      // Split paragraph into sentences
      const sentences = p.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
      const sentenceCount = sentences.length || 1;
      const avgSentenceLength = words.length / sentenceCount;
      
      if (avgSentenceLength > 18.0) {
        sluggishSuspenseBlocks.push({
          paraNum: idx + 1,
          wordCount: words.length,
          avgSentence: parseFloat(avgSentenceLength.toFixed(1)),
          dreadDensity: parseFloat(dreadDensity.toFixed(1)),
          text: p.length > 200 ? p.slice(0, 200) + '...' : p
        });
      }
    }
  });

  const overallDensity = (totalDreadWords / wordCount) * 1000 || 0;

  chaptersData.push({
    file: fileName,
    wordCount,
    dreadCount: totalDreadWords,
    density: parseFloat(overallDensity.toFixed(1)),
    sluggishSuspenseBlocks
  });
});

// Generate Markdown Report
let mdReport = `# Dread & Suspense Pacing Report
> Reference Craft Module: `_config/okf_craft/hitchcock_bomb_suspense.md`\n\n
*Generated on: ${new Date().toISOString().split('T')[0]}*

This report maps the "Dread Index" of your novel. It flags suspense blocks where high-dread vocabulary (vacuum, danger, panic, pulse) is combined with long, sluggish sentences. High-tension moments require staccato sentence pacing to build reading excitement.

---

## 📈 Dread Index (Density per 1k Words)

| Chapter | Word Count | Dread Mentions | Dread Index / 1k | Status |
| :--- | :---: | :---: | :---: | :---: |
`;

chaptersData.forEach(ch => {
  const status = ch.density >= 5.0 ? '🔴 (High Suspense)' : (ch.density >= 2.0 ? '🟡 (Moderate tension)' : '🟢 (Low Dread)');
  mdReport += `| [${ch.file}](file:///./stages/03_drafting/output/chapters/${ch.file}) | ${ch.wordCount} | ${ch.dreadCount} | **${ch.density}** | ${status} |\n`;
});

mdReport += `
---

## 🔍 Flagged Sluggish Suspense Blocks

The following paragraphs feature a high density of dread terms, but use long, complex sentences (average size $>18$ words). Consider breaking these clauses into short, punchy sentence segments.

`;

let sluggishCount = 0;
chaptersData.forEach(ch => {
  if (ch.sluggishSuspenseBlocks.length === 0) return;
  mdReport += `### [${ch.file}](file:///./stages/03_drafting/output/chapters/${ch.file})\n`;
  ch.sluggishSuspenseBlocks.forEach(block => {
    mdReport += `- **Paragraph (Line/Segment ${block.paraNum})**: *"${block.text}"*\n  * **Size**: ${block.wordCount} words\n  * **Dread Density**: ${block.dreadDensity}%\n  * **Average Sentence Length**: **${block.avgSentence} words** -> **Sluggish pacing.**\n`;
    sluggishCount++;
  });
  mdReport += '\n';
});

if (sluggishCount === 0) {
  mdReport += `*No sluggish suspense paragraphs found. Your action-pacing is beautifully staccato!*`;
}

fs.writeFileSync(OUTPUT_REPORT, mdReport, 'utf8');

console.log(`Dread pacing analysis complete:`);
console.log(`- Markdown report written to: 04_Review/dread_report.md`);

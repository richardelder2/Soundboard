#!/usr/bin/env node

/**
 * Prose Rhythm & Sentence Length Variability Analyzer (SAGA 3.0)
 * Zero dependencies, pure ESM Node.js script.
 * 
 * Analyzes sentence length standard deviation and distributions across
 * chapter files to diagnostic prose cadence, writing style, and monotones.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getDraftingDir, getReviewDir, getChapterFiles } from './path_helper.js';

const cwd = process.cwd();
const DRAFTING_DIR = getDraftingDir(cwd);
const REVIEW_DIR = getReviewDir(cwd);
const OUTPUT_REPORT = path.join(REVIEW_DIR, 'prose_rhythm_report.md');

if (!fs.existsSync(DRAFTING_DIR)) {
  console.error(`Error: Directory ${DRAFTING_DIR} does not exist.`);
  process.exit(1);
}

if (!fs.existsSync(REVIEW_DIR)) {
  fs.mkdirSync(REVIEW_DIR, { recursive: true });
}

const files = fs.readdirSync(DRAFTING_DIR)
  .filter(f => /^(chapter_?\d+|ch_?\d+)\.md$/i.test(f))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
    return numA - numB;
  });

console.log(`Analyzing prose rhythm in ${files.length} chapters...`);

const abbreviations = new Set(['mr', 'mrs', 'dr', 'st', 'vs', 'etc', 'eg', 'ie', 'approx', 'ch', 'vol', 'sec', 'inc', 'ltd']);

function splitIntoSentences(text) {
  // Strip YAML front matter if any
  const cleanText = text.replace(/^---[\s\S]*?---/, '');
  
  // Basic sentence tokenizer
  // Split on punctuation followed by whitespace, keeping track of common abbreviations
  const rawSegments = cleanText.split(/([.!?])\s+/);
  const sentences = [];
  
  for (let i = 0; i < rawSegments.length; i += 2) {
    let segment = rawSegments[i];
    const punctuation = rawSegments[i + 1] || '';
    
    if (!segment) continue;
    
    segment = segment.trim();
    
    // Check if segment ends with an abbreviation
    const lastWordMatch = segment.match(/\b(\w+)$/);
    if (lastWordMatch && abbreviations.has(lastWordMatch[1].toLowerCase()) && punctuation === '.') {
      // It's an abbreviation, merge it with the next segment
      if (i + 2 < rawSegments.length) {
        rawSegments[i + 2] = segment + punctuation + ' ' + rawSegments[i + 2];
        continue;
      }
    }
    
    sentences.push(segment + punctuation);
  }
  
  return sentences.filter(s => s.trim().split(/\s+/).filter(Boolean).length > 1);
}

const chaptersData = [];
let overallSentenceLengths = [];

files.forEach(file => {
  const filePath = path.join(DRAFTING_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const sentences = splitIntoSentences(content);
  
  if (sentences.length === 0) return;
  
  const sentenceLengths = sentences.map(s => {
    // Clean sentence of punctuation and count words
    const words = s.replace(/[^\w\s-]/g, '').split(/\s+/).filter(Boolean);
    return words.length;
  }).filter(len => len > 0);
  
  overallSentenceLengths.push(...sentenceLengths);
  
  // Calculate Statistics
  const sentenceCount = sentenceLengths.length;
  const wordCount = sentenceLengths.reduce((a, b) => a + b, 0);
  const average = wordCount / sentenceCount;
  
  // Standard Deviation (Variability)
  const variance = sentenceLengths.reduce((sqSum, len) => sqSum + Math.pow(len - average, 2), 0) / sentenceCount;
  const stdDev = Math.sqrt(variance);
  
  // Sentence distribution categories
  // Short: < 10 words, Medium: 10 - 25 words, Long: > 25 words
  let shortCount = 0;
  let mediumCount = 0;
  let longCount = 0;
  
  sentenceLengths.forEach(len => {
    if (len < 10) shortCount++;
    else if (len <= 25) mediumCount++;
    else longCount++;
  });
  
  // Consecutive rhythm monotony check
  // Look for runs of 4+ sentences in the same category in a row
  let consecutiveMonotony = 0;
  let currentRunType = null;
  let currentRunLength = 0;
  
  sentenceLengths.forEach(len => {
    let type = 'medium';
    if (len < 10) type = 'short';
    else if (len > 25) type = 'long';
    
    if (type === currentRunType) {
      currentRunLength++;
      if (currentRunLength >= 4) {
        consecutiveMonotony++;
      }
    } else {
      currentRunType = type;
      currentRunLength = 1;
    }
  });

  chaptersData.push({
    file,
    wordCount,
    sentenceCount,
    average: parseFloat(average.toFixed(1)),
    stdDev: parseFloat(stdDev.toFixed(1)),
    shortPercent: parseFloat(((shortCount / sentenceCount) * 100).toFixed(1)),
    mediumPercent: parseFloat(((mediumCount / sentenceCount) * 100).toFixed(1)),
    longPercent: parseFloat(((longCount / sentenceCount) * 100).toFixed(1)),
    consecutiveMonotony
  });
});

// Overall metrics
const totalWords = overallSentenceLengths.reduce((a,b) => a+b, 0);
const totalSentences = overallSentenceLengths.length;
const overallAverage = totalWords / totalSentences;
const overallVariance = overallSentenceLengths.reduce((sqSum, len) => sqSum + Math.pow(len - overallAverage, 2), 0) / totalSentences;
const overallStdDev = Math.sqrt(overallVariance);

let overallShort = 0;
let overallMedium = 0;
let overallLong = 0;

overallSentenceLengths.forEach(len => {
  if (len < 10) overallShort++;
  else if (len <= 25) overallMedium++;
  else overallLong++;
});

// Generate report
let report = `# Prose Rhythm & Cadence Report
> Reference Craft Module: `_config/okf_craft/prose_syntax_and_acoustic_cadence.md`\n\n
*Generated on: ${new Date().toISOString().split('T')[0]}*

This report analyzes sentence length distribution and standard deviation (variability) across your draft chapters. 

> [!NOTE]
> **What is Sentence Length Variability?**
> Sentence variability (measured as Standard Deviation) tracks the rhythmic diversity of your prose. 
> - **Low Std Dev (< 5.0)**: Indicates flat, monotonous prose where sentences share identical sizes.
> - **High Std Dev (> 9.0)**: Indicates vibrant, musical prose with a healthy mix of short punches, medium movements, and flowing clauses.

---

## 📊 Manuscript Rhythm Summary
* **Total Word Count**: ${totalWords} words
* **Total Sentence Count**: ${totalSentences} sentences
* **Average Sentence Length**: ${overallAverage.toFixed(1)} words
* **Standard Deviation (Rhythm Score)**: **${overallStdDev.toFixed(1)}**
* **Distribution Profile**:
  * **Short sentences (< 10 words)**: ${((overallShort / totalSentences) * 100).toFixed(1)}%
  * **Medium sentences (10-25 words)**: ${((overallMedium / totalSentences) * 100).toFixed(1)}%
  * **Long sentences (> 25 words)**: ${((overallLong / totalSentences) * 100).toFixed(1)}%

---

## 📈 Chapter Rhythm Leaderboard

| Chapter | Words | Sentences | Avg Sentence | Std Dev (Rhythm) | Short (%) | Med (%) | Long (%) | Rhythmic Monotonies |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;

chaptersData.forEach(ch => {
  const scoreClass = ch.stdDev >= 9.0 ? '🟢 (Good)' : (ch.stdDev >= 6.5 ? '🟡 (Moderate)' : '🔴 (Flat)');
  report += `| [${ch.file}](file:///./stages/03_drafting/output/chapters/${ch.file}) | ${ch.wordCount} | ${ch.sentenceCount} | ${ch.average} | **${ch.stdDev}** ${scoreClass} | ${ch.shortPercent}% | ${ch.mediumPercent}% | ${ch.longPercent}% | ${ch.consecutiveMonotony} |\n`;
});

report += `
---

## 🛠️ Actionable Rhythm Targets

### 1. The Monotony Hotspots (Consecutive sentence lengths)
Chapters with high "Rhythmic Monotonies" contain clusters where 4 or more consecutive sentences fall into the exact same length category (e.g. 5 extremely short sentences or 4 long winding clauses in a row). 
**Focus revision on these chapters first** to break up sentence patterns, injecting short punctuation hits into long paragraphs, or merging short fragments into coordinate clauses.

### 2. Cadence Rules of Thumb
- **Action Scenes**: Aim for a **higher Short % (35%+)** and a lower average sentence length (8-12 words).
- **Reflective/Lore Scenes**: Aim for a **higher Long % (25%+)** to establish sweeping, evocative atmosphere.
- **Always Keep Std Dev above 8.5** globally to maintain reader momentum.
`;

fs.writeFileSync(OUTPUT_REPORT, report, 'utf8');

console.log(`Prose rhythm analysis complete:`);
console.log(`- Markdown report written to: 04_Review/prose_rhythm_report.md`);

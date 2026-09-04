#!/usr/bin/env node

/**
 * Tense & Chronological Slip Detector (SAGA 3.0)
 * Zero dependencies, pure ESM Node.js script.
 * 
 * Scans narrative paragraphs for past vs. present tense verb occurrences,
 * determines dominant chapter tenses, and lists tense slips in 04_Review/.
 */

import * as fs from 'fs';
import * as path from 'path';

import { getReviewDir, getChapterFiles } from './path_helper.js';

const customTarget = process.argv[2];
const files = getChapterFiles(customTarget);
const REVIEW_DIR = getReviewDir();
const OUTPUT_REPORT = path.join(REVIEW_DIR, 'tense_consistency_report.md');

if (files.length === 0) {
  console.log('No drafting chapters found. Provide a chapter path or run from a novel workspace.');
  process.exit(0);
}

console.log(`Analyzing tense consistency across ${files.length} chapter(s)...`);

// High-confidence past/present verb indicators (expanded for high recall)
const PAST_INDICATORS = /\b(walked|ran|said|whispered|looked|noticed|saw|gasped|grunted|seemed|turned|reached|pulled|pushed|tensed|held|stood|collapsed|degraded|overloaded|booted|was|were|had|went|did|took|made|told|came|asked|thought|knew|shouted|replied|cried|called|felt|heard|spoke|left|began|started|tried)\b/i;
const PRESENT_INDICATORS = /\b(walks|runs|says|whispers|looks|notices|sees|gasps|grunts|seems|turns|reaches|pulls|pushes|tenses|holds|stands|collapses|degrades|overloads|boots|is|are|has|go|goes|do|does|take|takes|make|makes|tell|tells|come|comes|ask|asks|think|thinks|know|knows|shout|shouts|reply|replies|cry|cries|call|calls|feel|feels|hear|hears|see|sees|speak|speaks|leave|leaves|begin|begins|start|starts|try|tries)\b/i;

const chaptersData = [];

files.forEach(file => {
  const filePath = file;
  const fileName = path.basename(file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const cleanContent = content.replace(/^---[\s\S]*?---/, '');
  const lines = cleanContent.split('\n');
  
  let pastCount = 0;
  let presentCount = 0;
  const slips = [];

  // Stateful quote-stripping parser to support multi-line dialogue blocks
  let inQuote = false;
  const narrativeLines = lines.map((line, idx) => {
    const cleanLine = line.trim();
    if (cleanLine === '') {
      inQuote = false;
      return null;
    }
    if (cleanLine.startsWith('#') || cleanLine.startsWith('[') || cleanLine.startsWith('>')) {
      return null;
    }
    
    let narrative = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === '“' || char === '”') {
        inQuote = !inQuote;
        continue;
      }
      if (!inQuote) {
        narrative += char;
      }
    }
    return {
      lineNum: idx + 1,
      rawText: cleanLine,
      narrativeText: narrative.trim()
    };
  }).filter(Boolean);

  narrativeLines.forEach(item => {
    const words = item.narrativeText.split(/\s+/).filter(Boolean);
    let linePast = 0;
    let linePresent = 0;

    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (PAST_INDICATORS.test(cleanWord)) { pastCount++; linePast++; }
      if (PRESENT_INDICATORS.test(cleanWord)) { presentCount++; linePresent++; }
    });

    if (linePast > 0 && linePresent > 0) {
      slips.push({
        lineNum: item.lineNum,
        type: 'Mixed Line',
        text: item.rawText,
        reason: `Found both past and present verbs on this line (Past: ${linePast}, Present: ${linePresent}).`
      });
    }
  });

  const dominantTense = pastCount > presentCount ? 'past' : 'present';
  const confidence = pastCount + presentCount > 0 ? (Math.max(pastCount, presentCount) / (pastCount + presentCount)) * 100 : 100;

  // Re-sweep to identify lines that violate the chapter's dominant tense
  narrativeLines.forEach(item => {
    // Avoid double-flagging lines already listed as Mixed Line
    const alreadyFlagged = slips.some(s => s.lineNum === item.lineNum && s.type === 'Mixed Line');
    if (alreadyFlagged) return;

    const words = item.narrativeText.split(/\s+/).filter(Boolean);
    
    let violationCount = 0;
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (dominantTense === 'past' && PRESENT_INDICATORS.test(cleanWord)) violationCount++;
      if (dominantTense === 'present' && PAST_INDICATORS.test(cleanWord)) violationCount++;
    });

    if (violationCount > 1) {
      slips.push({
        lineNum: item.lineNum,
        type: 'Tense slip',
        text: item.rawText,
        reason: `Dominant tense is ${dominantTense.toUpperCase()}, but line contains ${violationCount} verb(s) of the opposite tense.`
      });
    }
  });

  chaptersData.push({
    file: fileName,
    dominantTense,
    confidence: parseFloat(confidence.toFixed(1)),
    pastCount,
    presentCount,
    slips: slips.sort((a,b) => a.lineNum - b.lineNum)
  });
});

// Generate Markdown Report
let mdReport = `# Tense Consistency Audit Report

*Generated on: ${new Date().toISOString().split('T')[0]}*

This report maps the dominant tense of each chapter and audits slips where present and past tenses are incorrectly mixed within narrative sentences.

---

## 📊 dominant Chapter Tenses

| Chapter | Dominant Tense | Past Verbs | Present Verbs | Confidence (%) | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
`;

chaptersData.forEach(ch => {
  const status = ch.confidence >= 90.0 ? '🟢 (Consistent)' : (ch.confidence >= 70.0 ? '🟡 (Warning)' : '🔴 (High Slippage)');
  mdReport += `| [${ch.file}](file:///./02_Drafting/${ch.file}) | **${ch.dominantTense.toUpperCase()}** | ${ch.pastCount} | ${ch.presentCount} | ${ch.confidence}% | ${status} |\n`;
});

mdReport += `
---

## 🔍 Specific Line Tense Slips

Review the following lines flagged for tense slip-ups. Focus on correcting these verbs to align with the chapter's dominant tense.

`;

let slipCount = 0;
chaptersData.forEach(ch => {
  const badSlips = ch.slips.filter(s => ch.confidence < 95.0 || s.type === 'Mixed Line');
  if (badSlips.length === 0) return;
  
  mdReport += `### [${ch.file}](file:///./02_Drafting/${ch.file})\n`;
  badSlips.forEach(s => {
    mdReport += `- **Line ${s.lineNum} (${s.type})**: *"${s.text}"*\n  * ${s.reason}\n`;
    slipCount++;
  });
  mdReport += '\n';
});

if (slipCount === 0) {
  mdReport += `*No tense consistency slips found! Your tenses are completely consistent.*`;
}

fs.writeFileSync(OUTPUT_REPORT, mdReport, 'utf8');

console.log(`Tense consistency audit complete:`);
console.log(`- Markdown report written to: 04_Review/tense_consistency_report.md`);

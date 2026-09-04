#!/usr/bin/env node

/**
 * Lore Density & Info-Dump Analyzer (SAGA 3.0)
 * Zero dependencies, pure ESM Node.js script.
 * 
 * Scans narrative paragraphs for dense concentrations of worldbuilding terms,
 * proper nouns, and settings locations to identify info-dumps in 04_Review/.
 */

import * as fs from 'fs';
import * as path from 'path';

import { getReviewDir, getChapterFiles } from './path_helper.js';

const cwd = process.cwd();
const customTarget = process.argv[2];
const files = getChapterFiles(customTarget);
const REVIEW_DIR = getReviewDir();
const OUTPUT_REPORT = path.join(REVIEW_DIR, 'lore_density_report.md');

const BIBLE_DIR = path.join(cwd, 'stages', '01_onboarding', 'output', 'bible');
const LEGACY_SETTINGS_DIR = path.join(cwd, '00_Story_Bible', 'settings');

// 1. Compile Settings and Lore Terms
const LORE_TERMS = new Set(['conglomerate', 'hephaestus', 'aegis', 'saganet', 'high deck', 'sector zero', 'hab-ring', 'promenade', 'cradle']);

[BIBLE_DIR, LEGACY_SETTINGS_DIR].forEach(dir => {
  if (fs.existsSync(dir)) {
    const termFiles = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    termFiles.forEach(file => {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const baseName = path.basename(file, '.md').toLowerCase();
      LORE_TERMS.add(baseName);
    
      // Add words from headers as potential lore terms
      const lines = content.split(/\r?\n/);
      lines.forEach(line => {
        const headerMatch = line.match(/^#+\s+(.+)/);
        if (headerMatch) {
          headerMatch[1].split(' ').forEach(w => {
            const clean = w.replace(/[^\w]/g, '').toLowerCase();
            if (clean.length > 3) LORE_TERMS.add(clean);
          });
        }
      });
    });
  }
});

// Pre-compile term regexes for multi-word and hyphenated support
const termRegexes = Array.from(LORE_TERMS).map(term => {
  const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const startBoundary = /^\w/.test(term) ? '\\b' : '';
  const endBoundary = /\w$/.test(term) ? '\\b' : '';
  return {
    term,
    regex: new RegExp(startBoundary + escaped + endBoundary, 'gi')
  };
});

if (files.length === 0) {
  console.log('No drafting chapters found. Provide a chapter path or run from a novel workspace.');
  process.exit(0);
}

console.log(`Analyzing lore density across ${files.length} chapter(s)...`);

const chaptersData = [];

files.forEach(file => {
  const filePath = file;
  const fileName = path.basename(file);
  const content = fs.readFileSync(filePath, 'utf8');
  const cleanContent = content.replace(/^---[\s\S]*?---/, '');
  const paragraphs = cleanContent.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  
  let totalWords = 0;
  let totalLoreMentions = 0;
  const infoDumps = [];

  paragraphs.forEach((p, idx) => {
    if (p.startsWith('#') || p.startsWith('[')) return;
    
    // Remove dialogue (focus on narrative exposition)
    const narrativeOnly = p.replace(/"[^"]+"/g, '').replace(/“[^”]+/g, '');
    const words = narrativeOnly.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;
    
    totalWords += words.length;
    let paraLoreCount = 0;
    const matchedTerms = [];

    termRegexes.forEach(item => {
      const matches = narrativeOnly.match(item.regex);
      if (matches) {
        paraLoreCount += matches.length;
        totalLoreMentions += matches.length;
        if (!matchedTerms.includes(item.term)) matchedTerms.push(item.term);
      }
    });

    const density = (paraLoreCount / words.length) * 100;
    if (words.length > 80 && density > 12.0) {
      infoDumps.push({
        paraNum: idx + 1,
        wordCount: words.length,
        density: parseFloat(density.toFixed(1)),
        matchedTerms,
        text: p.length > 200 ? p.slice(0, 200) + '...' : p
      });
    }
  });

  const overallDensity = (totalLoreMentions / totalWords) * 100 || 0;

  chaptersData.push({
    file: fileName,
    wordCount: totalWords,
    loreCount: totalLoreMentions,
    density: parseFloat(overallDensity.toFixed(2)),
    infoDumps
  });
});

// Generate Markdown Report
let mdReport = `# Lore Density & Info-Dump Report

*Generated on: ${new Date().toISOString().split('T')[0]}*

This report measures the density of speculative terminology and proper nouns in narrative exposition. High lore density (e.g., $>12\%$) in long paragraphs indicates potential "info-dumps" that stall story pacing.

---

## 📈 Lore Terminology Density Leaderboard

| Chapter | Exposition Words | Lore Mentions | Overall Lore Density (%) | Status |
| :--- | :---: | :---: | :---: | :---: |
`;

chaptersData.forEach(ch => {
  const status = ch.density < 8.0 ? '🟢 (Balanced)' : (ch.density < 12.0 ? '🟡 (High Detail)' : '🔴 (Exposition Heavy)');
  mdReport += `| [${ch.file}](file:///./02_Drafting/${ch.file}) | ${ch.wordCount} | ${ch.loreCount} | ${ch.density}% | ${status} |\n`;
});

mdReport += `
---

## 🔍 Flagged Info-Dumps

The following paragraphs contain $>80$ words and a speculative term density of **over $12\%$**. Consider breaking these up, converting details into active dialogue, or spreading them out.

`;

let dumpCount = 0;
chaptersData.forEach(ch => {
  if (ch.infoDumps.length === 0) return;
  mdReport += `### [${ch.file}](file:///./02_Drafting/${ch.file})\n`;
  ch.infoDumps.forEach(dump => {
    mdReport += `- **Paragraph (Line/Segment ${dump.paraNum})**: *"${dump.text}"*\n  * **Exposition size**: ${dump.wordCount} words\n  * **Lore density**: **${dump.density}%**\n  * **Matched terms**: \`${dump.matchedTerms.join(', ')}\`\n`;
    dumpCount++;
  });
  mdReport += '\n';
});

if (dumpCount === 0) {
  mdReport += `*No info-dumps flagged. Your worldbuilding details are well integrated!*`;
}

fs.writeFileSync(OUTPUT_REPORT, mdReport, 'utf8');

const relReport = path.relative(cwd, OUTPUT_REPORT).replace(/\\/g, '/');
console.log(`Lore density analysis complete:`);
console.log(`- Markdown report written to: ${relReport}`);

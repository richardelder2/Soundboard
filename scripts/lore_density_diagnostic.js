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
import { getDraftingDir, getReviewDir, getChapterFiles } from './path_helper.js';

const cwd = process.cwd();
const DRAFTING_DIR = getDraftingDir(cwd);
const STORY_BIBLE_SETTINGS_DIR = path.join(cwd, '00_Story_Bible', 'settings');
const REVIEW_DIR = getReviewDir(cwd);
const OUTPUT_REPORT = path.join(REVIEW_DIR, 'lore_density_report.md');

if (!fs.existsSync(DRAFTING_DIR)) {
  console.error(`Error: Directory ${DRAFTING_DIR} does not exist.`);
  process.exit(1);
}

if (!fs.existsSync(REVIEW_DIR)) {
  fs.mkdirSync(REVIEW_DIR, { recursive: true });
}

// 1. Compile Settings and Lore Terms from Story Bible
const LORE_TERMS = new Set(['conglomerate', 'hephaestus', 'aegis', 'saganet', 'high deck', 'sector zero', 'hab-ring', 'promenade', 'cradle']);

if (fs.existsSync(STORY_BIBLE_SETTINGS_DIR)) {
  const settingsFiles = fs.readdirSync(STORY_BIBLE_SETTINGS_DIR).filter(f => f.endsWith('.md'));
  settingsFiles.forEach(file => {
    const filePath = path.join(STORY_BIBLE_SETTINGS_DIR, file);
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

const files = fs.readdirSync(DRAFTING_DIR)
  .filter(f => /^(chapter_?\d+|ch_?\d+)\.md$/i.test(f))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
    return numA - numB;
  });

const chaptersData = [];

files.forEach(file => {
  const filePath = path.join(DRAFTING_DIR, file);
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
    file,
    wordCount: totalWords,
    loreCount: totalLoreMentions,
    density: parseFloat(overallDensity.toFixed(2)),
    infoDumps
  });
});

// Generate Markdown Report
let mdReport = `# Lore Density & Info-Dump Report
> Reference Craft Module: `_config/okf_craft/primitive_epistemic_asymmetry.md`\n\n
*Generated on: ${new Date().toISOString().split('T')[0]}*

This report measures the density of speculative terminology and proper nouns in narrative exposition. High lore density (e.g., $>12\%$) in long paragraphs indicates potential "info-dumps" that stall story pacing.

---

## 📈 Lore Terminology Density Leaderboard

| Chapter | Exposition Words | Lore Mentions | Overall Lore Density (%) | Status |
| :--- | :---: | :---: | :---: | :---: |
`;

chaptersData.forEach(ch => {
  const status = ch.density < 8.0 ? '🟢 (Balanced)' : (ch.density < 12.0 ? '🟡 (High Detail)' : '🔴 (Exposition Heavy)');
  mdReport += `| [${ch.file}](file:///./stages/03_drafting/output/chapters/${ch.file}) | ${ch.wordCount} | ${ch.loreCount} | ${ch.density}% | ${status} |\n`;
});

mdReport += `
---

## 🔍 Flagged Info-Dumps

The following paragraphs contain $>80$ words and a speculative term density of **over $12\%$**. Consider breaking these up, converting details into active dialogue, or spreading them out.

`;

let dumpCount = 0;
chaptersData.forEach(ch => {
  if (ch.infoDumps.length === 0) return;
  mdReport += `### [${ch.file}](file:///./stages/03_drafting/output/chapters/${ch.file})\n`;
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

console.log(`Lore density analysis complete:`);
console.log(`- Markdown report written to: 04_Review/lore_density_report.md`);

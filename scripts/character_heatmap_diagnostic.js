#!/usr/bin/env node

/**
 * Character Presence & Interaction Heatmap Analyzer (SAGA 3.0)
 * Zero dependencies, pure ESM Node.js script.
 * 
 * Maps character appearances, co-occurrences (scenes shared), and
 * highlights character absence thresholds across chapters in 04_Review/.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getDraftingDir, getReviewDir, getChapterFiles } from './path_helper.js';

const cwd = process.cwd();
const DRAFTING_DIR = getDraftingDir(cwd);
const STORY_BIBLE_CHARS_DIR = path.join(cwd, '00_Story_Bible', 'characters');
const REVIEW_DIR = getReviewDir(cwd);
const OUTPUT_REPORT = path.join(REVIEW_DIR, 'character_heatmap_report.md');

if (!fs.existsSync(DRAFTING_DIR)) {
  console.error(`Error: Directory ${DRAFTING_DIR} does not exist.`);
  process.exit(1);
}

if (!fs.existsSync(REVIEW_DIR)) {
  fs.mkdirSync(REVIEW_DIR, { recursive: true });
}

// 1. Load Character Aliases from Story Bible
const CHARACTER_PROFILES = [];

if (fs.existsSync(STORY_BIBLE_CHARS_DIR)) {
  const charFiles = fs.readdirSync(STORY_BIBLE_CHARS_DIR).filter(f => f.endsWith('.md'));
  charFiles.forEach(file => {
    const filePath = path.join(STORY_BIBLE_CHARS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const baseName = path.basename(file, '.md').toLowerCase();
    
    let fullName = baseName;
    let aliases = [baseName];
    
    const lines = content.split(/\r?\n/);
    lines.forEach(line => {
      const nameMatch = line.match(/^#\s+(?:Character Profile:\s*)?(.+)/i);
      if (nameMatch) {
        fullName = nameMatch[1].trim().toLowerCase();
        if (!aliases.includes(fullName)) aliases.push(fullName);
      }
      const fullNameFieldMatch = line.match(/-\s+\*\*Full Name\*\*:\s*(.+)/i);
      if (fullNameFieldMatch) {
        const fn = fullNameFieldMatch[1].trim().toLowerCase();
        if (fn && !aliases.includes(fn)) aliases.push(fn);
      }
      const aliasMatch = line.match(/-\s+\*\*Aliases\*\*:\s*\[?([^\]\r\n]+)\]?/i);
      if (aliasMatch) {
        aliasMatch[1].split(',').forEach(a => {
          const cleanAlias = a.replace(/["']/g, '').trim().toLowerCase();
          if (cleanAlias && !aliases.includes(cleanAlias)) aliases.push(cleanAlias);
        });
      }
    });
    
    const charId = fullName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    CHARACTER_PROFILES.push({
      id: charId,
      aliases: aliases,
      mentions: 0,
      activeChapters: []
    });
  });
}

if (CHARACTER_PROFILES.length === 0) {
  console.log('No characters profiles found in 00_Story_Bible/characters/. Exiting.');
  process.exit(0);
}

const files = fs.readdirSync(DRAFTING_DIR)
  .filter(f => /^(chapter_?\d+|ch_?\d+)\.md$/i.test(f))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
    return numA - numB;
  });

const matrix = {}; // character interactions grid
CHARACTER_PROFILES.forEach(c1 => {
  matrix[c1.id] = {};
  CHARACTER_PROFILES.forEach(c2 => {
    matrix[c1.id][c2.id] = 0;
  });
});

const chapterBreakdown = [];

files.forEach(file => {
  const filePath = path.join(DRAFTING_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const cleanContent = content.replace(/^---[\s\S]*?---/, '');
  const paragraphs = cleanContent.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const chNum = parseInt(file.match(/\d+/)?.[0] || '0', 10);
  
  const chMentions = {};
  CHARACTER_PROFILES.forEach(c => { chMentions[c.id] = 0; });

  paragraphs.forEach(p => {
    if (p.startsWith('#') || p.startsWith('[')) return;
    const lowerPara = p.toLowerCase();
    
    const presentInPara = [];
    CHARACTER_PROFILES.forEach(char => {
      let isPresent = false;
      char.aliases.forEach(alias => {
        const regex = new RegExp(`\\b${alias}\\b`, 'i');
        if (regex.test(lowerPara)) {
          isPresent = true;
        }
      });

      if (isPresent) {
        chMentions[char.id]++;
        char.mentions++;
        presentInPara.push(char.id);
      }
    });

    // Record proximity interactions (co-occurring in same paragraph)
    for (let i = 0; i < presentInPara.length; i++) {
      for (let j = i + 1; j < presentInPara.length; j++) {
        const c1 = presentInPara[i];
        const c2 = presentInPara[j];
        matrix[c1][c2]++;
        matrix[c2][c1]++;
      }
    }
  });

  const activeCharsInCh = [];
  CHARACTER_PROFILES.forEach(char => {
    if (chMentions[char.id] > 0) {
      char.activeChapters.push(chNum);
      activeCharsInCh.push(char.id);
    }
  });

  chapterBreakdown.push({
    file,
    chapter: chNum,
    mentions: chMentions,
    active: activeCharsInCh
  });
});

// Generate Markdown Report
let mdReport = `# Character Presence & Interaction Heatmap
> Reference Craft Module: `_config/okf_craft/archetypal_character_transformation_arcs.md`\n\n
*Generated on: ${new Date().toISOString().split('T')[0]}*

This report analyzes character frequency, active chapter presence, and co-occurrences (shared paragraphs) to map narrative relationships and check for pacing gaps.

---

## 👥 Character Mentions Summary

| Character | Total Mentions | Active Chapters | Presence Density |
| :--- | :---: | :--- | :---: |
`;

CHARACTER_PROFILES.sort((a,b) => b.mentions - a.mentions).forEach(char => {
  const presenceRatio = ((char.activeChapters.length / files.length) * 100).toFixed(1);
  mdReport += `| **${char.id}** | ${char.mentions} | Chs: ${char.activeChapters.join(', ')} | ${presenceRatio}% |\n`;
});

mdReport += `
---

## 🗺️ Interaction Matrix (Co-occurrences)
This grid counts how many times two characters appear together in the same paragraph (indicating direct scenes or dialogue).

| Character | ${CHARACTER_PROFILES.map(c => c.id).join(' | ')} |
| :--- | ${CHARACTER_PROFILES.map(() => ':---:').join(' | ')} |
`;

CHARACTER_PROFILES.forEach(c1 => {
  mdReport += `| **${c1.id}** | `;
  const counts = CHARACTER_PROFILES.map(c2 => {
    if (c1.id === c2.id) return '-';
    return matrix[c1.id][c2.id];
  });
  mdReport += counts.join(' | ') + ' |\n';
});

mdReport += `
---

## 🔍 Narrative Presence Audits

### ⚠️ Cold Cases (Prolonged Absence)
Checks if any character defined in your Story Bible disappears for more than 5 consecutive chapters after their introduction.

`;

let coldCasesCount = 0;
const totalChapters = files.length;

CHARACTER_PROFILES.forEach(char => {
  let maxGap = 0;
  let gapDetails = '';
  
  if (char.activeChapters.length > 0) {
    const headGap = char.activeChapters[0] - 1;
    if (headGap > maxGap) {
      maxGap = headGap;
      gapDetails = `before introduction (absent for Ch 1 to Ch ${char.activeChapters[0] - 1})`;
    }
    
    for (let i = 0; i < char.activeChapters.length - 1; i++) {
      const gap = char.activeChapters[i + 1] - char.activeChapters[i] - 1;
      if (gap > maxGap) {
        maxGap = gap;
        gapDetails = `between Ch ${char.activeChapters[i]} and Ch ${char.activeChapters[i + 1]}`;
      }
    }
    
    const tailGap = totalChapters - char.activeChapters[char.activeChapters.length - 1];
    if (tailGap > maxGap) {
      maxGap = tailGap;
      gapDetails = `after last appearance in Ch ${char.activeChapters[char.activeChapters.length - 1]} (absent until Ch ${totalChapters})`;
    }
  } else {
    maxGap = totalChapters;
    gapDetails = `never appears in any drafted chapters (absent for all ${totalChapters} chapters)`;
  }

  if (maxGap > 5) {
    mdReport += `- **${char.id}** disappears for a gap of **${maxGap} chapters** ${gapDetails}.\n`;
    coldCasesCount++;
  }
});

if (coldCasesCount === 0) {
  mdReport += `*No cold cases found. Character presence is consistently paced across the manuscript.*`;
}

fs.writeFileSync(OUTPUT_REPORT, mdReport, 'utf8');

console.log(`Character presence heatmap complete:`);
console.log(`- Markdown report written to: 04_Review/character_heatmap_report.md`);

#!/usr/bin/env node

/**
 * Dialogue Diagnostic Utility (SAGA 3.0 - Portable)
 * Zero dependencies, pure ESM Node.js script.
 * 
 * Scans chapter files, extracts dialogue, attributes speakers using character profiles,
 * and generates structured diagnostic analysis in 04_Review/.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getDraftingDir, getReviewDir, getChapterFiles } from './path_helper.js';

const cwd = process.cwd();
const DRAFTING_DIR = getDraftingDir(cwd);
const STORY_BIBLE_CHARS_DIR = path.join(cwd, '00_Story_Bible', 'characters');
const REVIEW_DIR = getReviewDir(cwd);
const OUTPUT_REPORT = path.join(REVIEW_DIR, 'dialogue_diagnostic_report.md');
const OUTPUT_JSON = path.join(REVIEW_DIR, 'dialogue_diagnostic_data.json');

// 1. Establish Character Profiles from Story Bible
const CHARACTER_MAP = {};

if (fs.existsSync(STORY_BIBLE_CHARS_DIR)) {
  const charFiles = fs.readdirSync(STORY_BIBLE_CHARS_DIR).filter(f => f.endsWith('.md'));
  charFiles.forEach(file => {
    const filePath = path.join(STORY_BIBLE_CHARS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const baseName = path.basename(file, '.md').toLowerCase();
    
    let fullName = baseName;
    let aliases = [baseName];
    let gender = 'unknown';
    
    const lines = content.split(/\r?\n/);
    lines.forEach(line => {
      // Parse header name
      const nameMatch = line.match(/^#\s+(?:Character Profile:\s*)?(.+)/i);
      if (nameMatch) {
        fullName = nameMatch[1].trim().toLowerCase();
        if (!aliases.includes(fullName)) aliases.push(fullName);
      }
      
      // Parse full name field
      const fullNameFieldMatch = line.match(/-\s+\*\*Full Name\*\*:\s*(.+)/i);
      if (fullNameFieldMatch) {
        const fn = fullNameFieldMatch[1].trim().toLowerCase();
        if (fn && !aliases.includes(fn)) aliases.push(fn);
      }
      
      // Parse aliases array/list
      const aliasMatch = line.match(/-\s+\*\*Aliases\*\*:\s*\[?([^\]\r\n]+)\]?/i);
      if (aliasMatch) {
        aliasMatch[1].split(',').forEach(a => {
          const cleanAlias = a.replace(/["']/g, '').trim().toLowerCase();
          if (cleanAlias && !aliases.includes(cleanAlias)) aliases.push(cleanAlias);
        });
      }
    });
    
    const charId = fullName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    CHARACTER_MAP[baseName] = {
      id: charId,
      aliases: aliases
    };
  });
}

// Fallback characters if none exist
if (Object.keys(CHARACTER_MAP).length === 0) {
  CHARACTER_MAP['unknown'] = { id: 'Unknown', aliases: [] };
}

// 2. Define target analysis items (profanity, slang, slurs)
const TARGET_WORDS = {
  profanity: [
    /\b(fuck|fucking|fucker|shit|shitty|damn|goddamn|bastard|bitches?|crap|piss)\b/gi,
    /\b(what the hell|go to hell|hell of a|hellish)\b/gi
  ],
  slang: [
    /\b(slag|vented|debt-locked|rust-brain|cog-head|solder-slop|decompressed|bracket-trash|circuit-fried)\b/gi
  ],
  slurs: [
    /\b(surplus labor|unallocated units?|inventory leaks?|contract-breakers?|dregs|sub-deckers?|deficit assets?)\b/gi
  ]
};

// 3. Scan and Analyze drafting files
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

console.log(`Analyzing dialogue in ${files.length} chapters...`);

let dialogueLines = [];
let overallStats = {
  totalChapters: files.length,
  totalWords: 0,
  totalDialogueWords: 0,
  totalLines: 0,
  profanityCount: 0,
  slangCount: 0,
  slursCount: 0,
  byCharacter: {}
};

// Initialize character stats
Object.values(CHARACTER_MAP).forEach(c => {
  overallStats.byCharacter[c.id] = { linesCount: 0, wordsCount: 0, profanity: 0, slang: 0, slurs: 0 };
});
overallStats.byCharacter['Unknown'] = { linesCount: 0, wordsCount: 0, profanity: 0, slang: 0, slurs: 0 };

files.forEach(file => {
  const filePath = path.join(DRAFTING_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const chNumber = file.match(/\d+/)?.[0] || '00';
  
  const paragraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  
  paragraphs.forEach((para, paraIdx) => {
    const paraWords = para.split(/\s+/).filter(Boolean).length;
    overallStats.totalWords += paraWords;

    // Check for bracketed system log dialog
    const systemLogMatch = para.match(/\[([A-Z0-9_]+):\s*["“]([^"”]+)["”]\s*\]/i);
    let extractedQuotes = [];
    
    if (systemLogMatch) {
      extractedQuotes.push({
        speakerTag: systemLogMatch[1],
        dialogue: systemLogMatch[2],
        isSystemLog: true
      });
    } else {
      const quoteRegex = /["“]([^"”\\]*(?:\\.[^"”\\]*)*)["”]/g;
      let match;
      while ((match = quoteRegex.exec(para)) !== null) {
        if (match[1].trim()) {
          extractedQuotes.push({
            dialogue: match[1].trim(),
            isSystemLog: false
          });
        }
      }
    }

    if (extractedQuotes.length === 0) return;

    let nonQuotedText = para;
    extractedQuotes.forEach(q => {
      nonQuotedText = nonQuotedText.replace(q.dialogue, '');
    });

    extractedQuotes.forEach(q => {
      let speaker = 'Unknown';
      
      if (q.speakerTag) {
        // Resolve system tag
        const tagLower = q.speakerTag.toLowerCase();
        const found = Object.values(CHARACTER_MAP).find(c => c.aliases.includes(tagLower));
        speaker = found ? found.id : q.speakerTag;
      } else {
        // Dialogue heuristics: check nearby tags in non-quoted text
        const wordsInTagArea = nonQuotedText.toLowerCase().split(/[^\w]+/);
        let bestMatch = null;
        let matchIndex = 999;
        
        Object.values(CHARACTER_MAP).forEach(c => {
          c.aliases.forEach(alias => {
            const idx = wordsInTagArea.indexOf(alias);
            if (idx !== -1 && idx < matchIndex) {
              matchIndex = idx;
              bestMatch = c.id;
            }
          });
        });
        
        if (bestMatch) speaker = bestMatch;
      }

      // Count metrics
      const dialogueWords = q.dialogue.split(/\s+/).filter(Boolean).length;
      overallStats.totalDialogueWords += dialogueWords;
      overallStats.totalLines += 1;

      let profWords = [];
      let slangWords = [];
      let slurWords = [];

      TARGET_WORDS.profanity.forEach(regex => {
        const matches = q.dialogue.match(regex);
        if (matches) profWords.push(...matches);
      });
      TARGET_WORDS.slang.forEach(regex => {
        const matches = q.dialogue.match(regex);
        if (matches) slangWords.push(...matches);
      });
      TARGET_WORDS.slurs.forEach(regex => {
        const matches = q.dialogue.match(regex);
        if (matches) slurWords.push(...matches);
      });

      overallStats.profanityCount += profWords.length;
      overallStats.slangCount += slangWords.length;
      overallStats.slursCount += slurWords.length;

      if (!overallStats.byCharacter[speaker]) {
        overallStats.byCharacter[speaker] = { linesCount: 0, wordsCount: 0, profanity: 0, slang: 0, slurs: 0 };
      }

      overallStats.byCharacter[speaker].linesCount += 1;
      overallStats.byCharacter[speaker].wordsCount += dialogueWords;
      overallStats.byCharacter[speaker].profanity += profWords.length;
      overallStats.byCharacter[speaker].slang += slangWords.length;
      overallStats.byCharacter[speaker].slurs += slurWords.length;

      dialogueLines.push({
        chapter: parseInt(chNumber, 10),
        speaker,
        dialogue: q.dialogue,
        words: dialogueWords,
        profanity: profWords,
        slang: slangWords,
        slurs: slurWords
      });
    });
  });
});

// Calculate percentages
const dialogueDensity = ((overallStats.totalDialogueWords / overallStats.totalWords) * 100).toFixed(1);

// Generate Markdown Report
let mdReport = `# Dialogue Diagnostic Report
> Reference Craft Module: `_config/okf_craft/three_registers_of_dialogue_subtext.md`\n\n
*Generated on: ${new Date().toISOString().split('T')[0]}*

This report analyzes dialogue attribution, density, slang, and profanity across all chapters.

## 📊 Global Metrics
* **Total Word Count**: ${overallStats.totalWords}
* **Total Dialogue Word Count**: ${overallStats.totalDialogueWords} (${dialogueDensity}% density)
* **Total Dialogue Lines**: ${overallStats.totalLines}
* **Average Words Per Line**: ${(overallStats.totalDialogueWords / overallStats.totalLines || 0).toFixed(1)}

---

## 👥 Character Profiles Dialogue Breakdown
| Character | Lines | Words | Profanity | Slang | Slurs | Words/Line |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
`;

Object.keys(overallStats.byCharacter).sort((a,b) => overallStats.byCharacter[b].linesCount - overallStats.byCharacter[a].linesCount).forEach(char => {
  const c = overallStats.byCharacter[char];
  if (c.linesCount === 0) return;
  const avg = (c.wordsCount / c.linesCount).toFixed(1);
  mdReport += `| **${char}** | ${c.linesCount} | ${c.wordsCount} | ${c.profanity} | ${c.slang} | ${c.slurs} | ${avg} |\n`;
});

mdReport += `
---

## 🔍 Quality Gate & Tone Highlights
* **Profanity Instances**: ${overallStats.profanityCount} (Density: ${((overallStats.profanityCount / overallStats.totalDialogueWords) * 1000 || 0).toFixed(2)} per 1000 dialogue words)
* **Slang Instances**: ${overallStats.slangCount}
* **Slurs Instances**: ${overallStats.slursCount}

### Top 10 Swearing Chapters
`;

const chStats = {};
dialogueLines.forEach(line => {
  if (!chStats[line.chapter]) chStats[line.chapter] = { prof: 0, total: 0 };
  chStats[line.chapter].prof += line.profanity.length;
  chStats[line.chapter].total += line.words;
});

const sortedChapters = Object.keys(chStats).sort((a,b) => chStats[b].prof - chStats[a].prof).slice(0, 10);
sortedChapters.forEach(ch => {
  const stat = chStats[ch];
  const density = ((stat.prof / stat.total) * 1000 || 0).toFixed(1);
  mdReport += `- **Chapter ${ch}**: ${stat.prof} swear words (Density: ${density}/1000 words)\n`;
});

fs.writeFileSync(OUTPUT_REPORT, mdReport, 'utf8');
fs.writeFileSync(OUTPUT_JSON, JSON.stringify({ overallStats, dialogueLines }, null, 2), 'utf8');

console.log(`Diagnostic complete:`);
console.log(`- Markdown report written to: 04_Review/dialogue_diagnostic_report.md`);
console.log(`- Raw data written to: 04_Review/dialogue_diagnostic_data.json`);

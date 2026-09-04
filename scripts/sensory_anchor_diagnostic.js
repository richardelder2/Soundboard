#!/usr/bin/env node

/**
 * Sensory Anchor Immediacy Analyzer (SAGA 3.0)
 * Zero dependencies, pure ESM Node.js script.
 * 
 * Audits draft chapters for visual, auditory, tactile, and olfactory/gustatory
 * sensory anchors to ensure high immediacy and active scene-viscosity.
 */

import * as fs from 'fs';
import * as path from 'path';

import { getReviewDir, getChapterFiles } from './path_helper.js';

const customTarget = process.argv[2];
const files = getChapterFiles(customTarget);
const REVIEW_DIR = getReviewDir();
const OUTPUT_REPORT = path.join(REVIEW_DIR, 'sensory_anchor_report.md');

if (files.length === 0) {
  console.log('No drafting chapters found. Provide a chapter path or run from a novel workspace.');
  process.exit(0);
}

console.log(`Analyzing sensory anchors across ${files.length} chapter(s)...`);

const SENSORY_WORDS = {
  visual: [
    'shine', 'light', 'dark', 'bright', 'glow', 'shadow', 'color', 'red', 'blue', 'green', 'white', 'black', 
    'flash', 'dim', 'glare', 'crimson', 'neon', 'chrome', 'glisten', 'sparkle', 'illumination', 'beam', 'beams', 
    'dusk', 'dawn', 'prism', 'gleam', 'murky'
  ],
  auditory: [
    'sound', 'hum', 'buzz', 'scream', 'shriek', 'rasp', 'crackle', 'silence', 'silent', 'echo', 'whisper', 
    'quiet', 'noise', 'hiss', 'clatter', 'whine', 'rumble', 'thud', 'screech', 'clang', 'mutter', 'drone', 
    'groan', 'clink', 'tick', 'whistle'
  ],
  tactile: [
    'cold', 'hot', 'heat', 'warm', 'freeze', 'chill', 'rough', 'smooth', 'pressure', 'soft', 'hard', 
    'wet', 'dry', 'sharp', 'vibrate', 'vibration', 'damp', 'prickle', 'slime', 'slimy', 'grainy', 'greasy', 
    'frigid', 'scorch', 'seep', 'numb'
  ],
  olfactoryGustatory: [
    'scent', 'odor', 'aroma', 'perfume', 'stink', 'sweet', 'sour', 'bitter', 'salty', 'metallic', 'ozone', 
    'sulfur', 'mold', 'copper', 'grease', 'stench', 'reek', 'flavor', 'stale', 'pungent', 'rot', 'rotten', 
    'acidic', 'spicy'
  ]
};

const CUSTOM_LEXICON_PATH = path.join(cwd, '00_Story_Bible', 'sensory_lexicon.md');
if (fs.existsSync(CUSTOM_LEXICON_PATH)) {
  const customLexContent = fs.readFileSync(CUSTOM_LEXICON_PATH, 'utf8');
  const customSections = customLexContent.split(/(?:^|\n)#+\s+/);
  customSections.forEach(section => {
    const sectionLines = section.split(/\r?\n/);
    if (sectionLines.length === 0) return;
    const header = sectionLines[0].trim().toLowerCase();
    
    let category = null;
    if (header.includes('visual')) category = 'visual';
    else if (header.includes('auditory') || header.includes('audio') || header.includes('hear')) category = 'auditory';
    else if (header.includes('tactile') || header.includes('feel')) category = 'tactile';
    else if (header.includes('olfactory') || header.includes('gustatory') || header.includes('smell') || header.includes('taste')) category = 'olfactoryGustatory';
    
    if (category) {
      sectionLines.slice(1).forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine.startsWith('#')) return;
        const words = cleanLine.replace(/^-\s+/, '').split(',');
        words.forEach(w => {
          const cleanWord = w.trim().toLowerCase();
          if (cleanWord) {
            // Escape regex special characters
            const escapedWord = cleanWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            if (!SENSORY_WORDS[category].includes(escapedWord)) {
              SENSORY_WORDS[category].push(escapedWord);
            }
          }
        });
      });
    }
  });
}

const SENSORY_LEXICON = {
  visual: new RegExp(`\\b(${SENSORY_WORDS.visual.join('|')})\\b`, 'i'),
  auditory: new RegExp(`\\b(${SENSORY_WORDS.auditory.join('|')})\\b`, 'i'),
  tactile: new RegExp(`\\b(${SENSORY_WORDS.tactile.join('|')})\\b`, 'i'),
  olfactoryGustatory: new RegExp(`\\b(${SENSORY_WORDS.olfactoryGustatory.join('|')})\\b`, 'i')
};

const chaptersData = [];

files.forEach(file => {
  const filePath = file;
  const fileName = path.basename(file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Clean frontmatter
  const cleanContent = content.replace(/^---[\s\S]*?---/, '');
  const paragraphs = cleanContent.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  
  let chVisual = 0;
  let chAuditory = 0;
  let chTactile = 0;
  let chOlfactory = 0;
  let wordCount = 0;
  
  const abstractParagraphs = [];

  paragraphs.forEach((p, idx) => {
    // Skip headers and code/system blocks
    if (p.startsWith('#') || p.startsWith('[')) return;
    
    const words = p.split(/\s+/).filter(Boolean);
    wordCount += words.length;
    
    let visualMatches = 0;
    let auditoryMatches = 0;
    let tactileMatches = 0;
    let olfactoryMatches = 0;

    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (SENSORY_LEXICON.visual.test(cleanWord)) { chVisual++; visualMatches++; }
      if (SENSORY_LEXICON.auditory.test(cleanWord)) { chAuditory++; auditoryMatches++; }
      if (SENSORY_LEXICON.tactile.test(cleanWord)) { chTactile++; tactileMatches++; }
      if (SENSORY_LEXICON.olfactoryGustatory.test(cleanWord)) { chOlfactory++; olfactoryMatches++; }
    });

    const totalSensory = visualMatches + auditoryMatches + tactileMatches + olfactoryMatches;
    if (words.length > 60 && totalSensory === 0) {
      abstractParagraphs.push({
        paraNum: idx + 1,
        text: p.length > 150 ? p.slice(0, 150) + '...' : p
      });
    }
  });

  const totalChSensory = chVisual + chAuditory + chTactile + chOlfactory;
  const sensoryDensity = ((totalChSensory / wordCount) * 1000 || 0).toFixed(1);

  chaptersData.push({
    file: fileName,
    wordCount,
    visual: chVisual,
    auditory: chAuditory,
    tactile: chTactile,
    olfactory: chOlfactory,
    density: parseFloat(sensoryDensity),
    abstractParagraphs
  });
});

let mdReport = `# Sensory Anchor Audit Report

*Generated on: ${new Date().toISOString().split('T')[0]}*

This report audits sensory anchor density across the draft chapters, highlighting areas that lack tactile, auditory, or olfactory grounding (abstract/clinical zones).

---

## 📈 Leaderboard: Sensory Anchor Density

| Chapter | Words | Visual | Auditory | Tactile | Smell/Taste | Density / 1k Words | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;

chaptersData.forEach(ch => {
  const status = ch.density >= 12.0 ? '🟢 (Visceral)' : (ch.density >= 6.0 ? '🟡 (Moderate)' : '🔴 (Flat)');
  mdReport += `| [${ch.file}](file:///./02_Drafting/${ch.file}) | ${ch.wordCount} | ${ch.visual} | ${ch.auditory} | ${ch.tactile} | ${ch.olfactory} | **${ch.density}** | ${status} |\n`;
});

mdReport += `
---

## 🔍 Abstract Exposition Paragraphs (No Sensory Grounding)

The following paragraphs contain $>60$ words but feature **zero** sensory anchors. These abstract zones are prime candidates for sensory injections during revisions.

`;

let abstractCount = 0;
chaptersData.forEach(ch => {
  if (ch.abstractParagraphs.length === 0) return;
  mdReport += `### [${ch.file}](file:///./02_Drafting/${ch.file})\n`;
  ch.abstractParagraphs.forEach(p => {
    mdReport += `- **Paragraph (Line/Segment ${p.paraNum})**: *"${p.text}"*\n`;
    abstractCount++;
  });
  mdReport += '\n';
});

if (abstractCount === 0) {
  mdReport += `*No abstract exposition paragraphs found! Your manuscript has excellent sensory grounding.*`;
}

fs.writeFileSync(OUTPUT_REPORT, mdReport, 'utf8');

console.log(`Sensory audit complete:`);
console.log(`- Markdown report written to: 04_Review/sensory_anchor_report.md`);

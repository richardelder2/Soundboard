#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { getDraftingDir, getReviewDir, getChapterFiles } from './path_helper.js';
import * as readline from 'readline';
import { callGemini } from './gemini_helper.js';

const cwd = process.cwd();
const DRAFTING_DIR = getDraftingDir(cwd);
const PLANNING_DIR = path.join(cwd, '01_Planning');

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function main() {
  console.log('\x1b[36m=== SAGA Writer\'s Block Wizard (/unstuck) ===\x1b[0m\n');

  if (!fs.existsSync(DRAFTING_DIR)) {
    console.error(`Error: Directory ${DRAFTING_DIR} does not exist. Please initialize project first.`);
    process.exit(1);
  }

  // Find active chapters
  const chapters = fs.readdirSync(DRAFTING_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  if (chapters.length === 0) {
    console.log('No drafting chapters found in 02_Drafting/. Please initialize a chapter first.');
    process.exit(1);
  }

  console.log('Available drafting files:');
  chapters.forEach((ch, idx) => console.log(`  [${idx + 1}] ${ch}`));
  
  const chChoice = await askQuestion('\nSelect active chapter (default: last): ');
  const chIdx = chChoice ? parseInt(chChoice, 10) - 1 : chapters.length - 1;
  const activeChapterFile = chapters[chIdx] || chapters[chapters.length - 1];
  const activeChapterPath = path.join(DRAFTING_DIR, activeChapterFile);
  
  console.log(`\nReading context from \x1b[33m02_Drafting/${activeChapterFile}\x1b[0m...`);
  const content = fs.readFileSync(activeChapterPath, 'utf8');
  const lastLines = content.split('\n').slice(-40).join('\n');

  // Read beatsheet if available
  let beatsheetContent = '';
  const beatsDir = path.join(PLANNING_DIR, 'beats');
  const baseNum = activeChapterFile.match(/\d+/)?.[0] || '01';
  const beatsFile = `chapter_${baseNum}_beats.md`;
  const beatsPath = path.join(beatsDir, beatsFile);
  if (fs.existsSync(beatsPath)) {
    console.log(`Found beatsheet: \x1b[32m01_Planning/beats/${beatsFile}\x1b[0m`);
    beatsheetContent = fs.readFileSync(beatsPath, 'utf8');
  }

  console.log('\n\x1b[35mWhat kind of roadblock are we facing?\x1b[0m');
  console.log('  [1] Pacing - The scene feels slow or lacks energy.');
  console.log('  [2] Geography - I don\'t know how to move characters to the next room/location.');
  console.log('  [3] Conflict - There is not enough friction or emotional tension between characters.');
  console.log('  [4] Surprise - I need a sudden twist, complication, or environmental trigger.');

  const typeChoice = await askQuestion('\nChoose [1-4]: ');
  const typesMap = {
    '1': 'Pacing (need to speed up, shorten sentences, or add immediate physical actions)',
    '2': 'Geography (need transition to move characters to the next location naturally)',
    '3': 'Conflict (need emotional friction, secrets brought up, status changes, or dialogue arguments)',
    '4': 'Surprise (need a sudden external event, system malfunction, discovery, or interruption)'
  };
  const selectedType = typesMap[typeChoice] || typesMap['1'];

  const extraDetails = await askQuestion('\nAny extra details/context you want to guide the suggestions? (optional): ');

  console.log('\n\x1b[36mCalling Gemini to generate narrative forks...\x1b[0m');
  
  const systemInstruction = 'You are the SAGA Developmental Editor. Your goal is to help a stuck co-author find a creative way forward. Avoid generic advice; give 3 concrete narrative options specifically tailored to the characters, setting, and roadblock. No fluff, no introductory chatter, only the options.';
  
  const prompt = `ROADBLOCK TYPE: ${selectedType}
${extraDetails ? `EXTRA WRITER CONTEXT: ${extraDetails}\n` : ''}
---
LAST 40 LINES OF DRAFT:
${lastLines}
---
${beatsheetContent ? `BEATSHEET CONTEXT:\n${beatsheetContent}\n---` : ''}
Generate 3 distinct, highly specific creative directions (Option A, Option B, Option C) to get the author unstuck. For each option, write a short title, a description of what happens, and 2-3 opening lines showing how to draft it. Make sure it adheres to high-viscosity, active, sensory-rich prose and avoids AI slop words.`;

  const suggestions = await callGemini(prompt, systemInstruction);
  console.log('\n\x1b[32m--- Suggestions from SAGA Editor ---\x1b[0m\n');
  console.log(suggestions);
  console.log('\n\x1b[32m------------------------------------\x1b[0m');

  const appendChoice = await askQuestion('\nWould you like to append these suggestions to the draft as a comment/scratchpad? (y/n): ');
  if (appendChoice.toLowerCase() === 'y') {
    fs.appendFileSync(activeChapterPath, `\n\n<!--\n=== SAGA UNSTUCK SUGGESTIONS ===\nRoadblock: ${selectedType}\n\n${suggestions}\n-->\n`);
    console.log(`\n\x1b[32mSuggestions appended to 02_Drafting/${activeChapterFile} inside a HTML comment block!\x1b[0m`);
  }
}

main().catch(console.error);

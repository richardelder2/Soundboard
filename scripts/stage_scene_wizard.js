#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { callGemini } from './gemini_helper.js';
import { getBeatsDir } from './path_helper.js';

const cwd = process.cwd();
const BEATS_DIR = getBeatsDir(cwd);

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
  console.log('\x1b[36m=== Soundboard Scene Setup Wizard (/stage-scene) ===\x1b[0m\n');

  if (!fs.existsSync(BEATS_DIR)) {
    fs.mkdirSync(BEATS_DIR, { recursive: true });
  }

  const chNumStr = await askQuestion('Enter chapter number (e.g. 01, 02): ');
  if (!chNumStr) {
    console.error('Error: Chapter number is required.');
    process.exit(1);
  }

  const paddedNum = chNumStr.padStart(2, '0');
  const beatsFile = `chapter_${paddedNum}_beats.md`;
  const beatsPath = path.join(BEATS_DIR, beatsFile);

  const sceneGoal = await askQuestion('\nWhat is the main goal or inciting incident of this scene?\n> ');
  const characters = await askQuestion('\nWhich characters are in this scene and what are their immediate desires?\n> ');
  const stateShift = await askQuestion('\nHow should the emotional state shift by the end? (e.g., suspicious -> terrified)\n> ');
  const setting = await askQuestion('\nDescribe the setting or room atmosphere:\n> ');

  console.log('\n\x1b[36mCalling model to generate sensory anchors and opening hooks...\x1b[0m');

  const systemInstruction = 'You are the Soundboard Architect. Your goal is to construct a rigorous scene setup beatsheet. Output a clean markdown structure containing sensory anchors and opening hook recommendations. Do not add introductory conversational text.';
  
  const prompt = `SCENE DETAILS:
- Chapter Number: ${paddedNum}
- Goal/Inciting Incident: ${sceneGoal}
- Characters & Goals: ${characters}
- Emotional State Shift: ${stateShift}
- Setting: ${setting}

TASK:
1. Recommend 3 concrete, visceral sensory anchors (sights, sounds, smells, textures) specific to this setting that avoid generic AI cliches.
2. Generate 3 distinct opening hook variations:
   - Action-focused opening
   - Introspective/character-focused opening
   - Atmosphere/setting-focused opening
Provide these hooks in clean markdown formatting.`;

  const suggestions = await callGemini(prompt, systemInstruction);

  console.log('\n\x1b[32m--- Generated Scene Recommendations ---\x1b[0m\n');
  console.log(suggestions);
  console.log('\n\x1b[32m---------------------------------------\x1b[0m');

  const confirmChoice = await askQuestion('\nWould you like to write this scene setup to the beatsheet file? (y/n): ');
  if (confirmChoice.toLowerCase() === 'y') {
    const beatsheetContent = `# Chapter ${paddedNum} Scene Setup

## 🎯 Scene Goal & Inciting Incident
${sceneGoal}

## 👥 Characters & Value Shifts
- **Characters Present**: ${characters}
- **Value Shift**: ${stateShift}

## 🏛️ Setting & Atmosphere
${setting}

## 🎨 Recommended Sensory Anchors & Hooks
${suggestions}

## 📝 Outline Beats
- [ ] Beat 1: Inciting Incident (The value shift begins)
- [ ] Beat 2: Progressive Complication (An obstacle arise)
- [ ] Beat 3: Crisis (The best bad choice)
- [ ] Beat 4: Climax (The decision executed)
- [ ] Beat 5: Resolution (The new emotional state established)
`;
    fs.writeFileSync(beatsPath, beatsheetContent, 'utf8');
    const relBeatsPath = path.relative(cwd, beatsPath).replace(/\\/g, '/');
    console.log(`\n\x1b[32mBeatsheet initialized and saved to: ${relBeatsPath}\x1b[0m`);
  }
}

main().catch(console.error);

#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { callGemini } from './gemini_helper.js';

const cwd = process.cwd();
const STORY_BIBLE_DIR = path.join(cwd, '00_Story_Bible');

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
  console.log('\x1b[36m=== SAGA Lore & Subplot Brainstorming Wizard (/brainstorm) ===\x1b[0m\n');

  if (!fs.existsSync(STORY_BIBLE_DIR)) {
    fs.mkdirSync(STORY_BIBLE_DIR, { recursive: true });
  }

  console.log('What would you like to brainstorm today?');
  console.log('  [1] Character Secret or Motivations');
  console.log('  [2] Sci-Fi Technology, Magic Systems, or Lore elements');
  console.log('  [3] Factions, Guilds, or Environmental Backstory');

  const topicChoice = await askQuestion('\nChoose [1-3]: ');
  const topicsMap = {
    '1': 'Character Secret / Motivation',
    '2': 'Sci-Fi Technology / Lore',
    '3': 'Faction / Environmental Backstory'
  };
  const topicName = topicsMap[topicChoice] || topicsMap['1'];

  const coreIdea = await askQuestion('\nEnter your rough idea or prompt to start with:\n> ');
  
  // Interactive narrowing down questions
  console.log('\nLet\'s narrow down the aesthetic and tone...');
  const tone = await askQuestion('Should the tone be clinical and corporate, or gritty and decaying? (or enter custom style guide terms):\n> ');
  const connection = await askQuestion('How does this affect our protagonist or create immediate scene conflict?\n> ');

  console.log('\n\x1b[36mGenerating brainstorming cards with Gemini...\x1b[0m');

  const systemInstruction = 'You are the SAGA Lorekeeper. Output a clean, structured markdown world-building entry card with clear, punchy sections. No greetings or meta-chatter.';
  
  const prompt = `TOPIC: ${topicName}
CORE IDEA: ${coreIdea}
ESTABLISHED TONE/AESTHETIC: ${tone}
NARRATIVE CONNECTION: ${connection}

TASK:
Create a detailed worldbuilding/lore entry card containing:
1. **Lore Summary**: A concise, vivid description of this element.
2. **Secrets & Subtext**: Hidden elements or subplots related to this.
3. **Drafting Prompts**: 3 specific imagery prompts or scene beats that demonstrate this lore element actively (rather than as exposition).
Avoid passive tells and AI slop words.`;

  const suggestions = await callGemini(prompt, systemInstruction);

  console.log('\n\x1b[32m--- Brainstormed Entry Card ---\x1b[0m\n');
  console.log(suggestions);
  console.log('\n\x1b[32m--------------------------------\x1b[0m');

  const saveChoice = await askQuestion('\nWould you like to save this card to your Story Bible? (y/n): ');
  if (saveChoice.toLowerCase() === 'y') {
    const defaultFileName = topicName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_card.md';
    const filename = await askQuestion(`Enter filename (default: ${defaultFileName}): `) || defaultFileName;
    
    // Check characters folder
    const targetFolder = topicChoice === '1' ? path.join(STORY_BIBLE_DIR, 'characters') : STORY_BIBLE_DIR;
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const finalPath = path.join(targetFolder, filename);
    fs.writeFileSync(finalPath, `# Brainstorm Card: ${coreIdea.slice(0, 40)}\n\n*Created via SAGA Brainstorm Wizard*\n\n${suggestions}\n`, 'utf8');
    console.log(`\n\x1b[32mSaved card directly to: 00_Story_Bible/${topicChoice === '1' ? 'characters/' : ''}${filename}\x1b[0m`);
  }
}

main().catch(console.error);

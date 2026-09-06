#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { callGemini } from './gemini_helper.js';

const cwd = process.cwd();
const CHARACTERS_DIR = path.join(cwd, '00_Story_Bible', 'characters');

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
  console.log('\x1b[36m=== SAGA "What Would X Do" Scenario Wizard (/wwxdu) ===\x1b[0m\n');

  if (!fs.existsSync(CHARACTERS_DIR)) {
    fs.mkdirSync(CHARACTERS_DIR, { recursive: true });
  }

  // Find characters
  const charFiles = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.md'));
  if (charFiles.length === 0) {
    console.log('No characters found in 00_Story_Bible/characters/. Let\'s register one first.');
    const name = await askQuestion('Character name: ');
    if (!name) {
      console.error('Error: Character name is required.');
      process.exit(1);
    }
    fs.writeFileSync(path.join(CHARACTERS_DIR, `${name.toLowerCase()}.md`), `# ${name}\n\nVoice profile to be generated.\n`, 'utf8');
    charFiles.push(`${name.toLowerCase()}.md`);
  }

  console.log('Select character to drop-test:');
  charFiles.forEach((file, idx) => console.log(`  [${idx + 1}] ${path.basename(file, '.md')}`));

  const choice = await askQuestion('\nChoose [1-' + charFiles.length + ']: ');
  const chosenFile = charFiles[parseInt(choice, 10) - 1] || charFiles[0];
  const charName = path.basename(chosenFile, '.md');
  const charPath = path.join(CHARACTERS_DIR, chosenFile);

  const scenario = await askQuestion('\nDescribe the situation or scenario you want to drop them into:\n> ');
  if (!scenario) {
    console.error('Error: Scenario description is required.');
    process.exit(1);
  }

  console.log(`\n\x1b[35mStarting scenario chat with ${charName.toUpperCase()}...\x1b[0m`);
  console.log(`Scenario: "${scenario}"`);
  console.log('Type your questions/statements to see what they would do. We will do 4 rounds of conversation.');

  const conversationHistory = [];
  const charProfile = fs.readFileSync(charPath, 'utf8');

  for (let i = 0; i < 4; i++) {
    const userInput = await askQuestion(`\nRound ${i + 1} - Author: `);
    if (!userInput) break;

    conversationHistory.push({ role: 'author', text: userInput });

    console.log(`\x1b[33m${charName.toUpperCase()} is responding...\x1b[0m`);

    const systemInstruction = `You are playing the role of the character ${charName} from a novel. Adopt their traits, vocabulary, dialect, status, and emotional disposition. Speak directly to the author in-character as you deal with the scenario: "${scenario}". Do not drop character. Here is your character profile: \n\n${charProfile}`;
    
    const prompt = `CONVERSATION LOG SO FAR:
${conversationHistory.map(h => `${h.role === 'author' ? 'Author' : charName}: "${h.text}"`).join('\n')}
${charName}, respond to the Author's latest statement in your authentic voice, showing how you navigate the situation. Keep it to 1-3 sentences.`;

    const charResponse = await callGemini(prompt, systemInstruction);
    console.log(`\n\x1b[32m${charName.toUpperCase()}: "${charResponse}"\x1b[0m`);
    conversationHistory.push({ role: charName, text: charResponse });
  }

  console.log('\n\x1b[36mCompiling character choices and plot insights...\x1b[0m');

  const analysisSystem = 'You are the SAGA Lorekeeper. Output a clean markdown summary of the character\'s choices, motives, and dialogue beats in the scenario. No greetings or meta-chatter.';
  const analysisPrompt = `CHARACTER NAME: ${charName}
SCENARIO: ${scenario}
CONVERSATION LOG:
${conversationHistory.map(h => `${h.role === 'author' ? 'Author' : charName}: "${h.text}"`).join('\n')}

Analyze the character's reaction and decisions in this scenario. List:
1. **Immediate Reaction & Mood**: How they felt/behaved initially.
2. **Key Decisions Made**: What actions they took or resolved to take.
3. **Dialogue Hooks**: 2-3 of the best raw dialogue lines from the chat that could be directly pasted into the novel.
Generate a structured scenario logcard.`;

  const logcard = await callGemini(analysisPrompt, analysisSystem);

  console.log('\n\x1b[32m--- Scenario Logcard ---\x1b[0m\n');
  console.log(logcard);
  console.log('\n\x1b[32m------------------------\x1b[0m');

  const saveChoice = await askQuestion('\nWould you like to save this scenario logcard to the character profile? (y/n): ');
  if (saveChoice.toLowerCase() === 'y') {
    fs.appendFileSync(charPath, `\n\n## 🧪 Scenario Log: ${scenario.slice(0, 40)}\n\n${logcard}\n`);
    console.log(`\nCharacter profile 00_Story_Bible/characters/${chosenFile} updated!`);
  }
}

main().catch(console.error);

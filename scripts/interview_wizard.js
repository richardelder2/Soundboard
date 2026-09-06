#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { callGemini } from './gemini_helper.js';

const cwd = process.cwd();
const CHARACTERS_DIR = path.join(cwd, '00_Story_Bible', 'characters');
const STYLE_GUIDE_PATH = path.join(cwd, '00_Story_Bible', 'style_guide.md');

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
  console.log('\x1b[36m=== SAGA Character Voice Finder Interview (/interview) ===\x1b[0m\n');

  if (!fs.existsSync(CHARACTERS_DIR)) {
    fs.mkdirSync(CHARACTERS_DIR, { recursive: true });
  }

  // Find characters
  const charFiles = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.md'));
  if (charFiles.length === 0) {
    console.log('No characters found in 00_Story_Bible/characters/. Let\'s register one.');
    const name = await askQuestion('Character name: ');
    if (!name) {
      console.error('Error: Character name is required.');
      process.exit(1);
    }
    fs.writeFileSync(path.join(CHARACTERS_DIR, `${name.toLowerCase()}.md`), `# ${name}\n\nVoice profile to be generated.\n`, 'utf8');
    charFiles.push(`${name.toLowerCase()}.md`);
  }

  console.log('Select character to interview:');
  charFiles.forEach((file, idx) => console.log(`  [${idx + 1}] ${path.basename(file, '.md')}`));

  const choice = await askQuestion('\nChoose [1-' + charFiles.length + ']: ');
  const chosenFile = charFiles[parseInt(choice, 10) - 1] || charFiles[0];
  const charName = path.basename(chosenFile, '.md');
  const charPath = path.join(CHARACTERS_DIR, chosenFile);

  console.log(`\n\x1b[35mStarting roleplay interview with ${charName.toUpperCase()}...\x1b[0m`);
  console.log('Type your questions/statements to the character. We will do 4 rounds of conversation.');

  const conversationHistory = [];
  const charProfile = fs.readFileSync(charPath, 'utf8');

  for (let i = 0; i < 4; i++) {
    const userInput = await askQuestion(`\nRound ${i + 1} - Author: `);
    if (!userInput) break;

    conversationHistory.push({ role: 'author', text: userInput });

    console.log(`\x1b[33m${charName.toUpperCase()} is thinking...\x1b[0m`);

    const systemInstruction = `You are playing the role of the character ${charName} from a novel. Adopt their traits, vocabulary, dialect, status, and emotional disposition. Speak directly to the author. Do not drop character. Here is your character profile: \n\n${charProfile}`;
    
    const prompt = `CONVERSATION LOG SO FAR:
${conversationHistory.map(h => `${h.role === 'author' ? 'Author' : charName}: "${h.text}"`).join('\n')}
${charName}, respond to the Author's latest statement in your authentic voice. Keep it to 1-3 sentences.`;

    const charResponse = await callGemini(prompt, systemInstruction);
    console.log(`\n\x1b[32m${charName.toUpperCase()}: "${charResponse}"\x1b[0m`);
    conversationHistory.push({ role: charName, text: charResponse });
  }

  console.log('\n\x1b[36mAnalyzing voice mannerisms and dialect...\x1b[0m');

  const analysisSystem = 'You are the SAGA Line & Copy Editor. Extract concrete dialogue rules, mannerisms, slang, and structural habits from the conversation log. Output clean markdown rules.';
  const analysisPrompt = `CHARACTER NAME: ${charName}
CONVERSATION LOG:
${conversationHistory.map(h => `${h.role === 'author' ? 'Author' : charName}: "${h.text}"`).join('\n')}

Analyze the dialogue patterns of ${charName}. List:
1. **Sentence Structure**: (e.g. clipped sentences, run-on thoughts, formal vs informal registers).
2. **Vocabulary & Slang**: Dialect choices, words overused or avoided.
3. **Mannerisms**: Physical cues or linguistic tics implied in speech.
Generate a structured voice card.`;

  const voiceCard = await callGemini(analysisPrompt, analysisSystem);

  console.log('\n\x1b[32m--- Voice Analysis Card ---\x1b[0m\n');
  console.log(voiceCard);
  console.log('\n\x1b[32m---------------------------\x1b[0m');

  const saveChoice = await askQuestion('\nWould you like to save this voice card to the character profile? (y/n): ');
  if (saveChoice.toLowerCase() === 'y') {
    fs.appendFileSync(charPath, `\n\n## 🗣️ Stylistic Voice Profile\n\n${voiceCard}\n`);
    console.log(`\nCharacter profile 00_Story_Bible/characters/${chosenFile} updated!`);

    if (fs.existsSync(STYLE_GUIDE_PATH)) {
      fs.appendFileSync(STYLE_GUIDE_PATH, `\n\n### Character Voice: ${charName.toUpperCase()}\n\n${voiceCard}\n`);
      console.log('Story Bible style_guide.md updated with voice profiles!');
    }
  }
}

main().catch(console.error);

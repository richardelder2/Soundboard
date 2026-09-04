#!/usr/bin/env node

import * as readline from 'readline';
import { callGemini } from './gemini_helper.js';

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
  console.log('\x1b[36m=== Soundboard Thematic Resonance Wizard (/theme-weaver) ===\x1b[0m\n');

  const theme = await askQuestion('What core theme do you want to highlight in this scene? (e.g. Isolation, System Decay, Trust, Hubris):\n> ');
  if (!theme) {
    console.error('Error: Theme cannot be empty.');
    process.exit(1);
  }

  const setting = await askQuestion('\nDescribe the setting or room where the scene takes place:\n> ');

  console.log('\n\x1b[36mCalling model to weave theme...\x1b[0m');

  const systemInstruction = 'You are the Soundboard Developmental Editor. Your goal is to guide the writer in weaving thematic symbolism, physical motifs, and environmental metaphors into their story without being preachy or using exposition. Output only the suggestions and examples in clean markdown. Do not add introductory conversational text.';
  
  const prompt = `THEME: ${theme}
SETTING: ${setting}

TASK:
Provide 3 specific suggestions to weave this theme into the scene using:
1. **Environmental Symbolism**: Specific physical objects, lighting elements, or atmospheric changes in the room.
2. **Character Actions/Motifs**: Small physical actions, mechanical tics, or habits characters perform.
3. **Dialogue / Subtext cues**: Ideas for conversation undertones.
Provide 1 short draft passage demonstrating these elements blended together.`;

  const suggestions = await callGemini(prompt, systemInstruction);

  console.log('\n\x1b[32m--- Theme-Weaver Suggestions ---\x1b[0m\n');
  console.log(suggestions);
  console.log('\n\x1b[32m--------------------------------\x1b[0m');
}

main().catch(console.error);

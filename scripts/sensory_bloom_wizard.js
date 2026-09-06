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
  console.log('\x1b[36m=== SAGA Sensory Expansion Wizard (/sensory-bloom) ===\x1b[0m\n');

  console.log('Paste the paragraph you want to bloom (press Enter when done):');
  const passage = await askQuestion('> ');
  if (!passage) {
    console.error('Error: Passage cannot be empty.');
    process.exit(1);
  }

  console.log('\nSelect the target senses to enrich:');
  console.log('  [1] Scent & Taste (olfactory anchors)');
  console.log('  [2] Sound & Acoustics (auditory registers)');
  console.log('  [3] Tactile & Temperature (physical textures, cold/heat)');
  console.log('  [4] Visceral Sight & Shadows (lighting, geometry, movements)');

  const senseChoice = await askQuestion('\nChoose [1-4]: ');
  const sensesMap = {
    '1': 'Scent & Taste',
    '2': 'Sound & Acoustics',
    '3': 'Tactile & Temperature',
    '4': 'Visceral Sight & Shadows'
  };
  const selectedSense = sensesMap[senseChoice] || sensesMap['3'];

  console.log('\n\x1b[36mCalling SAGA Scribe to bloom this passage...\x1b[0m');

  const systemInstruction = 'You are the SAGA Scribe. Your goal is to write high-viscosity, sensory-rich prose. Avoid all clichés, tells, and AI slop words. Provide only the expanded paragraphs and a brief explanation of the added details. No conversational intro.';
  
  const prompt = `PASSAGE TO ENRICH:
"${passage}"

TARGET SENSE: ${selectedSense}

TASK:
Rewrite the passage to weave in visceral, concrete sensory details focused on the target sense. Avoid passive "telling" (e.g. do not say "he felt the room was cold", instead say "his boots squeaked against the frost-rimmed floor"). Give 2 rewritten alternatives, one subtle and one highly descriptive.`;

  const suggestions = await callGemini(prompt, systemInstruction);

  console.log('\n\x1b[32m--- Sensory Bloomed Alternatives ---\x1b[0m\n');
  console.log(suggestions);
  console.log('\n\x1b[32m------------------------------------\x1b[0m');
}

main().catch(console.error);

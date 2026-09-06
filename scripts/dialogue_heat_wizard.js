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
  console.log('\x1b[36m=== SAGA Dialogue Tension Wizard (/dialogue-heat) ===\x1b[0m\n');

  console.log('Paste the flat dialogue exchange you want to heat up (press Enter when done):');
  const dialogueInput = await askQuestion('> ');
  if (!dialogueInput) {
    console.error('Error: Dialogue input cannot be empty.');
    process.exit(1);
  }

  console.log('\nSelect the conflict mode to inject:');
  console.log('  [1] Subtext (characters speak in double meanings or hide their true intent)');
  console.log('  [2] Status Play (one character attempts to assert conversational dominance)');
  console.log('  [3] Avoidance (one character actively pivots away from a sensitive subject)');

  const conflictChoice = await askQuestion('\nChoose [1-3]: ');
  const conflictMap = {
    '1': 'Subtext',
    '2': 'Status Play',
    '3': 'Avoidance'
  };
  const selectedConflict = conflictMap[conflictChoice] || conflictMap['1'];

  console.log('\n\x1b[36mCalling SAGA Editor to heat up dialogue...\x1b[0m');

  const systemInstruction = 'You are the SAGA Developmental Editor. Your goal is to rewrite dialogue to add narrative friction, subtext, status changes, and dramatic tension. Output only the rewritten dialogue blocks and a brief explanation of how the tension is achieved. Do not add introductory conversational text.';
  
  const prompt = `DIALOGUE SNIPPET:
"${dialogueInput}"

CONFLICT MODE: ${selectedConflict}

TASK:
Rewrite this dialogue snippet to demonstrate the selected conflict mode in action. Make sure to capture the character's status differences, subtextual motivations, and body tics. Give 2 rewritten alternatives showing different intensities of the conflict.`;

  const suggestions = await callGemini(prompt, systemInstruction);

  console.log('\n\x1b[32m--- Tense Dialogue Alternatives ---\x1b[0m\n');
  console.log(suggestions);
  console.log('\n\x1b[32m-----------------------------------\x1b[0m');
}

main().catch(console.error);

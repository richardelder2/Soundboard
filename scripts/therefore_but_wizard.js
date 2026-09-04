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
  console.log('\x1b[36m=== Soundboard Causal Plot Linker Wizard (/therefore-but) ===\x1b[0m\n');

  if (!fs.existsSync(BEATS_DIR)) {
    console.error(`Error: Beatsheet directory ${BEATS_DIR} does not exist. Please run stage-scene first.`);
    process.exit(1);
  }

  const beatsFiles = fs.readdirSync(BEATS_DIR).filter(f => f.endsWith('.md'));
  if (beatsFiles.length === 0) {
    const relBeats = path.relative(cwd, BEATS_DIR).replace(/\\/g, '/');
    console.log(`No beatsheets found under ${relBeats}/. Run /stage-scene to initialize one.`);
    process.exit(1);
  }

  console.log('Select beatsheet to audit for causality:');
  beatsFiles.forEach((file, idx) => console.log(`  [${idx + 1}] ${file}`));

  const choice = await askQuestion('\nChoose [1-' + beatsFiles.length + ']: ');
  const chosenFile = beatsFiles[parseInt(choice, 10) - 1] || beatsFiles[0];
  const beatsPath = path.join(BEATS_DIR, chosenFile);
  const relChosen = path.relative(cwd, beatsPath).replace(/\\/g, '/');

  console.log(`\nReading \x1b[33m${relChosen}\x1b[0m...`);
  const lines = fs.readFileSync(beatsPath, 'utf8').split('\n');

  // Extract beat lines
  const beatItems = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
      beatItems.push({
        lineNum: idx,
        statusChar: trimmed.slice(3, 4),
        rawText: trimmed,
        beatText: trimmed.slice(5).trim()
      });
    }
  });

  if (beatItems.length < 2) {
    console.log('Found fewer than 2 beats in this file. Causal linking requires at least two beats.');
    process.exit(0);
  }

  console.log(`\nFound ${beatItems.length} beats. Auditing sequential connections...`);
  let modifiedCount = 0;

  for (let i = 0; i < beatItems.length - 1; i++) {
    const beatA = beatItems[i];
    const beatB = beatItems[i + 1];

    console.log(`\n\x1b[35m[Connection ${i + 1}/${beatItems.length - 1}]\x1b[0m`);
    console.log(`  Beat A: "\x1b[33m${beatA.beatText}\x1b[0m"`);
    console.log(`  Beat B: "\x1b[33m${beatB.beatText}\x1b[0m"`);
    console.log('\nHow are these two beats connected?');
    console.log('  [1] Therefore (Beat B is a direct consequence of Beat A)');
    console.log('  [2] But (Beat B is an obstacle, reversal, or turn interrupting Beat A)');
    console.log('  [3] Keep as-is (Sequential "and then" connection is fine)');

    const relationChoice = await askQuestion('\nChoose [1-3]: ');
    if (relationChoice === '3' || !relationChoice) {
      console.log('Kept connection as-is.');
      continue;
    }

    const type = relationChoice === '1' ? 'therefore' : 'but';
    console.log(`\n\x1b[36mCalling model to suggest a causal link rewrite...\x1b[0m`);

    const systemInstruction = 'You are the Soundboard Architect. Rewrite Beat B to connect causally to Beat A using either a "therefore" (direct consequence) or a "but" (obstacle/turn) relationship. Output only the rewritten beat in one sentence. No conversational intro.';
    const prompt = `BEAT A: "${beatA.beatText}"
BEAT B: "${beatB.beatText}"
RELATIONSHIP TYPE: ${type === 'therefore' ? 'Therefore (Consequence)' : 'But (Obstacle/Turn)'}

Provide a rewritten version of Beat B that establishes a clear causal link from Beat A.`;

    const rewrittenBeat = await callGemini(prompt, systemInstruction);
    console.log(`\nSuggested Rewrite for Beat B:\n  "\x1b[32m${rewrittenBeat}\x1b[0m"`);

    const acceptChoice = await askQuestion('\nAccept rewrite? (y/n): ');
    if (acceptChoice.toLowerCase() === 'y') {
      beatB.beatText = rewrittenBeat;
      // Update in our lines array
      lines[beatB.lineNum] = `- [${beatB.statusChar}] ${rewrittenBeat}`;
      modifiedCount++;
      console.log('Beat updated!');
    }
  }

  if (modifiedCount > 0) {
    fs.writeFileSync(beatsPath, lines.join('\n'), 'utf8');
    console.log(`\n\x1b[32mCausality audit complete! Updated ${modifiedCount} beats in ${relChosen}\x1b[0m`);
  } else {
    console.log('\nNo changes made to the beatsheet.');
  }
}

main().catch(console.error);

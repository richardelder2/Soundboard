#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { callGemini } from './gemini_helper.js';

const BLUEPRINT_PATH = process.env.SAGA_BLUEPRINT || path.join('setup', 'comfort_scifi_blueprint.md');
const OUTPUT_DIR = path.join('stages', '01_onboarding', 'output');
const BIBLE_DIR = path.join(OUTPUT_DIR, 'bible');
const CHARACTERS_DIR = path.join(OUTPUT_DIR, 'characters');

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

// Function to extract questions from markdown file
function parseQuestions(markdownPath) {
  if (!fs.existsSync(markdownPath)) {
    console.error(`Blueprint not found at: ${markdownPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(markdownPath, 'utf8');
  const lines = content.split('\n');
  const questions = [];
  
  lines.forEach(line => {
    // Match line starting with number and a dot, e.g. "2. 'What specific field...'" or "2. What specific..."
    const match = line.match(/^\d+\.\s+(.*)$/);
    if (match) {
      questions.push(match[1].replace(/^["']|["']$/g, '')); // Strip outer quotes if any
    }
  });
  return questions;
}

async function main() {
  console.log('\n\x1b[1m\x1b[35m=== SAGA Hard Sci-Fi Comfort Onboarding Wizard ===\x1b[0m\n');
  console.log('Reading blueprint questions...');
  const questions = parseQuestions(BLUEPRINT_PATH);
  
  if (questions.length === 0) {
    console.error('No questions found in comfort_scifi_blueprint.md');
    process.exit(1);
  }

  const responses = [];
  const systemInstruction = `You are an encouraging, highly analytical creative writing coach executing a specialized "Hard Sci-Fi Comfort Book" onboarding process. 
Your mission is to help the user design a scientifically rigorous, high-stakes sci-fi story that targets their ultimate intellectual comforts—such as problem-solving, competence porn, realistic space aesthetics, and fascinating speculative tech rooted in real physics.
Enthusiastically validate their technical ideas and offer concise suggestions to sharpen the realism, checking scientific plausibility (e.g. thermodynamics, relativity, realistic spacecraft biology) before requesting the next response. Keep your feedback under 3 sentences.`;

  for (let i = 0; i < questions.length - 2; i++) { // Leave the last 2 questions (Synthesis & Logline) for automated processing
    console.log(`\n\x1b[36m[Question ${i + 1}/${questions.length - 2}]\x1b[0m`);
    console.log(`\x1b[1m${questions[i]}\x1b[0m`);
    
    const answer = await askQuestion('\nYour Response: ');
    responses.push({ question: questions[i], answer });

    // Technical validation / sharpening loop using Gemini
    console.log('\n\x1b[33mRefinement coaching...\x1b[0m');
    const prompt = `Question asked: "${questions[i]}"\nUser's answer: "${answer}"\n\nValidate the user's idea, verify hard science plausibility, and offer a quick tip to sharpen the realism.`;
    const feedback = await callGemini(prompt, systemInstruction);
    console.log(`\x1b[32mCoach: ${feedback}\x1b[0m\n`);
  }

  // Stage 6: Synthesis & Logline Compilation
  console.log('\x1b[35mCompiling technical synthesis concept & logline...\x1b[0m');
  const synthesisPrompt = `Here are the responses gathered from the onboarding questionnaire:
${responses.map((r, idx) => `${idx + 1}. Q: ${r.question}\nA: ${r.answer}`).join('\n\n')}

Synthesize these elements into a rich, cohesive, mathematically and scientifically grounded narrative concept summary. Group the synthesis into these OKF categories:
1. Core Tech & Scientific Rules (orbital mechanics, physics constraints)
2. Setting & Comfort Aesthetic (sounds, visuals, environment)
3. Foil Characters & Competence Dynamic
4. Technical Emergency & Stakes

Followed by a punchy, science-oriented logline.`;

  const synthesisOutput = await callGemini(synthesisPrompt, systemInstruction, true);
  
  console.log('\n\x1b[1m\x1b[32m=== SCI-FI CONCEPT SYNTHESIS ===\x1b[0m\n');
  console.log(synthesisOutput);
  console.log('\n\x1b[32m=================================\x1b[0m\n');

  // Ensure output folders exist
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(BIBLE_DIR, { recursive: true });
  fs.mkdirSync(CHARACTERS_DIR, { recursive: true });

  // Save compiled preferences JSON
  fs.writeFileSync(path.join(OUTPUT_DIR, 'preferences.json'), JSON.stringify({ responses, synthesis: synthesisOutput }, null, 2), 'utf8');

  // Create OKF World Bible File
  const bibleContent = `---
type: WorldBible
genre: Hard Sci-Fi
focus: Comfort Hard Sci-Fi
last_modified: ${new Date().toISOString().split('T')[0]}
---

# Global Sci-Fi Concept Synthesis

${synthesisOutput}
`;
  fs.writeFileSync(path.join(BIBLE_DIR, 'world_bible.md'), bibleContent, 'utf8');

  // Create OKF Character Files based on responses
  const charA = responses[9]?.answer || 'Expert A'; // Question 10 is Character A discipline/persona
  const charAFlaw = responses[10]?.answer || '';
  const charB = responses[11]?.answer || 'Expert B'; // Question 12 is Character B
  
  const charAProfile = `---
type: CharacterProfile
name: "${charA.split(' ')[0]}"
role: Primary Expert
discipline: "${charA}"
flaw: "${charAFlaw}"
status: Seeded
---

# ${charA.split(' ')[0]}

Seeded during Hard Sci-Fi comfort onboarding.
`;

  const charBProfile = `---
type: CharacterProfile
name: "${charB.split(' ')[0]}"
role: Partner Foil
discipline: "${charB}"
status: Seeded
---

# ${charB.split(' ')[0]}

Seeded during Hard Sci-Fi comfort onboarding.
`;

  fs.writeFileSync(path.join(CHARACTERS_DIR, `character_a.md`), charAProfile, 'utf8');
  fs.writeFileSync(path.join(CHARACTERS_DIR, `character_b.md`), charBProfile, 'utf8');

  console.log(`\n\x1b[32m✔ Onboarding complete! Created preferences.json, world_bible.md, character_a.md, and character_b.md under stages/01_onboarding/output/\x1b[0m\n`);
}

main().catch(console.error);

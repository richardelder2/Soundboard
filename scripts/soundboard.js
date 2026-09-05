#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BIN_NAME = path.basename(process.argv[1], '.js') || 'soundboard';
const APP_NAME = BIN_NAME === 'saga' ? 'SAGA-ICM' : 'Soundboard';

export function readText(p) {
  return fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
}

const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

const STAGES = [
  '01_onboarding',
  '02_planning',
  '03_drafting',
  '04_diagnostics_edits',
  '05_publishing'
];

function printHeader(text) {
  console.log(`\n\x1b[1m\x1b[35m=== ${text} ===\x1b[0m`);
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (path.basename(src) === 'output') return;
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function handleInit(targetFolder) {
  printHeader('Initializing Soundboard Workspace');
  
  const templateDir = path.dirname(__dirname);
  
  let targetDir = process.cwd();
  if (targetFolder) {
    targetDir = path.isAbsolute(targetFolder) ? targetFolder : path.resolve(process.cwd(), targetFolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  }

  if (path.resolve(templateDir) === path.resolve(targetDir)) {
    console.log('\x1b[33mWarning: You are running init inside the template repository itself.\x1b[0m');
    console.log('Each novel must live in its own separate project folder.');
    console.log('To initialize a clean novel workspace in a dedicated folder, run:');
    console.log(`  node "${path.join(templateDir, 'scripts', 'soundboard.js')}" init <folder_name>`);
    console.log('Or create a blank directory elsewhere, cd into it, and run init.');
    return;
  }

  console.log(`Initializing clean workspace at: ${targetDir}`);
  console.log(`Template source: ${templateDir}`);

  const items = [
    '_config',
    'setup',
    'stages',
    'scripts',
    '.claude',
    'package.json',
    'AGENTS.md',
    'CLAUDE.md',
    'GEMINI.md',
    'CONTEXT.md',
    'README.md',
    'LOCAL_SETUP.md',
    'LICENSE'
  ];

  console.log('\nConfiguring files...');

  items.forEach(item => {
    const srcPath = path.join(templateDir, item);
    const destPath = path.join(targetDir, item);
    if (fs.existsSync(srcPath)) {
      copyRecursiveSync(srcPath, destPath);
      console.log(`  ✔ Copied: ${item}`);
    }
  });

  // Copy project.gitignore if target doesn't have .gitignore
  const gitignoreDest = path.join(targetDir, '.gitignore');
  const projectGitignoreSrc = path.join(templateDir, '_config', 'templates', 'project.gitignore');
  if (!fs.existsSync(gitignoreDest) && fs.existsSync(projectGitignoreSrc)) {
    fs.copyFileSync(projectGitignoreSrc, gitignoreDest);
    console.log('  ✔ Created project .gitignore (preserves manuscript.json and stage outputs).');
  }

  // Support --form flag in preferences.json
  const formArg = (process.argv.slice(2) || []).find(a => a.startsWith('--form='));
  const formVal = formArg ? formArg.split('=')[1].toLowerCase() : 'novel';
  const validForms = ['short_story', 'novelette', 'novella', 'novel', 'series'];
  const chosenForm = validForms.includes(formVal) ? formVal : 'novel';
  const isShort = ['short_story', 'novelette'].includes(chosenForm);

  const onboardingDir = path.join(targetDir, 'stages', '01_onboarding', 'output');
  if (!fs.existsSync(onboardingDir)) fs.mkdirSync(onboardingDir, { recursive: true });
  const prefTarget = path.join(onboardingDir, 'preferences.json');
  if (!fs.existsSync(prefTarget)) {
    fs.writeFileSync(prefTarget, JSON.stringify({
      form: chosenForm,
      unit_type: isShort ? 'section' : 'chapter',
      target_words: chosenForm === 'short_story' ? 5000 : chosenForm === 'novella' ? 30000 : 90000
    }, null, 2), 'utf8');
    console.log(`  ✔ Configured project form: ${chosenForm} in preferences.json`);
  }

  // Write default .env template if it doesn't exist
  const envPath = path.join(targetDir, '.env');
  if (!fs.existsSync(envPath)) {
    const envContent = [
      `# ${APP_NAME} Environment Variables`,
      '# Option A: Local Edge (Ollama)',
      'LOCAL_MODEL=true',
      'LOCAL_MODEL_URL=http://localhost:11434/v1/chat/completions',
      'LOCAL_MODEL_NAME=gemma2',
      '',
      '# Option B: OpenRouter',
      '# USE_OPENROUTER=true',
      '# OPENROUTER_API_KEY=your_key',
      '# OPENROUTER_MODEL=meta-llama/llama-3-8b-instruct:free',
      '',
      '# Option C: Gemini Cloud',
      '# GEMINI_API_KEY=your_key',
      ''
    ].join('\n');
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('  ✔ Created template .env file.');
  }

  console.log(`\n\x1b[32m✔ ${APP_NAME} Workspace successfully initialized! Run "npm install" to configure dependencies.\x1b[0m\n`);
}

function handleStatus() {
  printHeader('Soundboard Stage Pipeline Status');

  STAGES.forEach(stage => {
    const stagePath = path.join('stages', stage);
    const contractExists = fs.existsSync(path.join(stagePath, 'CONTEXT.md'));
    const outputFiles = getFilesRecursive(path.join(stagePath, 'output'));

    let statusText = '\x1b[31mNot Started\x1b[0m';
    if (outputFiles.length > 0) {
      statusText = '\x1b[32mHas Output\x1b[0m';
    } else if (contractExists) {
      statusText = '\x1b[33mActive / Configured\x1b[0m';
    }

    console.log(`- \x1b[1mStage ${stage}\x1b[0m: ${statusText}`);
    outputFiles.forEach(file => console.log(`    ↳ \x1b[90m${file}\x1b[0m`));
  });

  printManuscriptStatus();
}

const STATUS_COLORS = { planned: '\x1b[90m', drafted: '\x1b[33m', audited: '\x1b[36m', passed: '\x1b[32m' };

function printManuscriptStatus() {
  if (!fs.existsSync('manuscript.json')) {
    console.log('\n\x1b[90mNo manuscript.json — Stage 02 creates the production ledger (see _config/templates/manuscript.template.json).\x1b[0m');
    return;
  }
  let manifest;
  try {
    manifest = JSON.parse(readText('manuscript.json'));
  } catch (e) {
    console.error(`\nCould not parse manuscript.json: ${e.message}`);
    return;
  }
  const chapters = manifest.chapters || [];
  printHeader(`Manuscript: ${manifest.title || 'untitled'} (${chapters.length} chapters)`);

  let totalWords = 0;
  chapters.forEach(ch => {
    let words = 0;
    const draft = (ch.draft_file || '').replace(/\//g, path.sep);
    if (draft && fs.existsSync(draft)) {
      const raw = readText(draft);
      words = (raw.match(/[\w'’-]+/g) || []).length;
    }
    totalWords += words;
    const color = STATUS_COLORS[ch.status] || '';
    const audit = ch.last_audit ? `  audit:${ch.last_audit}` : '';
    const wordStr = words ? `${words}${ch.target_words ? '/' + ch.target_words : ''}w` : '';
    console.log(`  ch ${String(ch.id).padStart(2)}  ${color}${(ch.status || 'planned').padEnd(8)}\x1b[0m ${wordStr.padEnd(12)}${audit}  \x1b[90m${ch.title || ''}\x1b[0m`);
  });

  const target = manifest.target_words ? ` / ${manifest.target_words.toLocaleString()} target` : '';
  console.log(`\n  Total: ${totalWords.toLocaleString()} words${target}`);

  const next = chapters.find(ch => ch.status !== 'passed');
  if (!next) {
    console.log(`  \x1b[32mAll chapters passed — next action: Stage 05 compile (node scripts/${binName}.js compile)\x1b[0m`);
  } else {
    const action = {
      planned: `draft it (Stage 03 — beats: ${next.beat_file || 'n/a'})`,
      drafted: `audit it (Stage 04 — node scripts/${binName}.js audit, then the rubric)`,
      audited: `resolve findings and pass the Stage 04 gate`,
    }[next.status] || 'check its status value';
    console.log(`  Next action → chapter ${next.id}: ${action}`);
  }
}

function handleBrief() {
  printHeader('Soundboard Project Brief & Executive Summary');
  if (!fs.existsSync('manuscript.json')) {
    console.log('No manuscript.json found. Run Stage 01 onboarding or Stage 02 planning first.');
    return;
  }
  let manifest;
  try {
    manifest = JSON.parse(readText('manuscript.json'));
  } catch (e) {
    console.error(`Could not parse manuscript.json: ${e.message}`);
    return;
  }
  const chapters = manifest.chapters || [];
  const statusCounts = { planned: 0, drafted: 0, audited: 0, passed: 0 };
  let totalWords = 0;
  chapters.forEach(c => {
    statusCounts[c.status || 'planned'] = (statusCounts[c.status || 'planned'] || 0) + 1;
    const draftPath = (c.draft_file || '').replace(/\//g, path.sep);
    if (draftPath && fs.existsSync(draftPath)) {
      const raw = readText(draftPath);
      totalWords += (raw.match(/[\w'’-]+/g) || []).length;
    }
  });

  console.log(`Title:        ${manifest.title || 'Untitled'}`);
  console.log(`Author:       ${manifest.author || 'Author'}`);
  console.log(`Target Words: ${manifest.target_words ? manifest.target_words.toLocaleString() : 'N/A'}`);
  console.log(`Drafted:      ${totalWords.toLocaleString()} words (${manifest.target_words ? Math.round((totalWords / manifest.target_words) * 100) : 0}%)`);
  console.log(`Chapters:     ${chapters.length} total [Passed: ${statusCounts.passed}, Audited: ${statusCounts.audited}, Drafted: ${statusCounts.drafted}, Planned: ${statusCounts.planned}]`);

  // Check trackers
  const trackerDir = path.join('stages', '02_planning', 'output', 'trackers');
  if (fs.existsSync(trackerDir)) {
    const trackers = fs.readdirSync(trackerDir).filter(f => f.endsWith('.md'));
    console.log(`Trackers:     ${trackers.length} active tracker files in ${trackerDir}`);
  }
  console.log('');
}

function getFilesRecursive(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursive(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

async function handleDiagnostic(subCmd, extraArgs = []) {
  const diagMap = {
    rhythm: 'prose_rhythm_diagnostic.js',
    dialogue: 'dialogue_diagnostic.js',
    tense: 'tense_slip_diagnostic.js',
    sensory: 'sensory_anchor_diagnostic.js',
    dread: 'dread_pacing_diagnostic.js',
    lore: 'lore_density_diagnostic.js',
    heatmap: 'character_heatmap_diagnostic.js',
    resource: 'resource_consistency_diagnostic.js',
    playbook: 'generate_curated_playbook.js',
  };

  if (!subCmd || subCmd === 'list' || subCmd === '--help' || subCmd === 'help') {
    printHeader('Soundboard Diagnostics Suite');
    console.log(`
Available diagnostics:
  node scripts/${binName}.js diag audit [path]         Full AI prose tell & rhythm scan
  node scripts/${binName}.js diag continuity [dir]     Proper noun & character continuity scan
  node scripts/${binName}.js diag rhythm [chapter]     Sentence length standard deviation & cadence
  node scripts/${binName}.js diag dialogue [chapter]   Speaker attribution & dialogue ratio
  node scripts/${binName}.js diag tense [chapter]      Past vs. present tense consistency & slips
  node scripts/${binName}.js diag sensory [chapter]    Sensory anchor density (visual/auditory/tactile)
  node scripts/${binName}.js diag dread [chapter]      Dread pacing & sluggish suspense blocks
  node scripts/${binName}.js diag lore [chapter]       Lore density & exposition info-dump scanner
  node scripts/${binName}.js diag heatmap              Character presence & interaction matrix
  node scripts/${binName}.js diag resource             Physical resource tracking
  node scripts/${binName}.js diag playbook [chapter]   Generate curated revision playbook
  node scripts/${binName}.js diag all [chapter]        Run all mechanical diagnostics sequentially
    `);
    return;
  }

  if (subCmd === 'audit') {
    await handleAudit(extraArgs);
    return;
  }
  if (subCmd === 'continuity') {
    await handleContinuity(extraArgs);
    return;
  }

  if (subCmd === 'all') {
    printHeader('Running Full Diagnostic Suite');
    console.log('\n--- 1. Narrative Prose Audit ---');
    await handleAudit(extraArgs);
    console.log('\n--- 2. Character & Proper-Noun Continuity ---');
    await handleContinuity(extraArgs);

    const sequence = ['rhythm', 'dialogue', 'tense', 'sensory', 'dread', 'lore'];
    for (let i = 0; i < sequence.length; i++) {
      const name = sequence[i];
      console.log(`\n--- ${i + 3}. ${name.toUpperCase()} Diagnostic ---`);
      const scriptFullPath = path.join(__dirname, diagMap[name]);
      const child = fork(scriptFullPath, extraArgs);
      await new Promise(res => child.on('close', res));
    }
    return;
  }

  const scriptFile = diagMap[subCmd];
  if (!scriptFile) {
    console.error(`Unknown diagnostic: "${subCmd}". Run "node scripts/${binName}.js diag" to see available tools.`);
    return;
  }

  const scriptFullPath = path.join(__dirname, scriptFile);
  const child = fork(scriptFullPath, extraArgs);
  child.on('close', code => process.exit(code || 0));
}

function handleWizard(type, extraArgs = []) {
  const wizardMap = {
    onboard: 'onboard_wizard.js',
    unstuck: 'unstuck_wizard.js',
    brainstorm: 'brainstorm_wizard.js',
    interview: 'interview_wizard.js',
    heat: 'dialogue_heat_wizard.js',
    bloom: 'sensory_bloom_wizard.js',
    scene: 'stage_scene_wizard.js',
    theme: 'theme_weaver_wizard.js',
    'therefore-but': 'therefore_but_wizard.js',
    wwxdu: 'wwxdu_wizard.js'
  };

  if (!type || type === 'list' || type === '--help' || type === 'help') {
    printHeader('Soundboard Creative Wizards');
    console.log(`
Available interactive wizards:
  node scripts/${binName}.js wizard onboard [--blueprint=<name>]   Start novel onboarding session
  node scripts/${binName}.js wizard unstuck                         Overcome writer's block (pacing, twists)
  node scripts/${binName}.js wizard brainstorm                      Brainstorm premise & core tensions
  node scripts/${binName}.js wizard interview                       Character deep-dive interrogation
  node scripts/${binName}.js wizard heat                            Dialogue escalation & subtext intensifier
  node scripts/${binName}.js wizard bloom                           Sensory expansion & setting viscosity
  node scripts/${binName}.js wizard scene                           Scene staging & physical blocking
  node scripts/${binName}.js wizard theme                           Theme weaver & subtle resonance
  node scripts/${binName}.js wizard therefore-but                   Causal calculus ("Therefore / But" links)
  node scripts/${binName}.js wizard wwxdu                           "What Would X Do Unexpectedly" subversion
    `);
    return;
  }

  const scriptFile = wizardMap[type];
  if (!scriptFile) {
    console.error(`Unknown wizard: "${type}". Run "node scripts/${binName}.js wizard" to see available wizards.`);
    return;
  }

  const env = { ...process.env };
  if (type === 'onboard') {
    const blueprintArg = args.find(a => a.startsWith('--blueprint='));
    if (blueprintArg) {
      const name = blueprintArg.split('=')[1].replace(/-/g, '_');
      const candidates = [
        path.join('setup', `${name}.md`),
        path.join('setup', `${name}_blueprint.md`),
      ];
      const resolved = candidates.find(c => fs.existsSync(c));
      if (!resolved) {
        console.error(`Blueprint not found. Tried: ${candidates.join(', ')}`);
        process.exit(1);
      }
      env.SOUNDBOARD_BLUEPRINT = resolved;
      env.SB_BLUEPRINT = resolved;
      env.SAGA_BLUEPRINT = resolved;
    }
  }

  const scriptFullPath = path.join(__dirname, scriptFile);
  const wizardProcess = fork(scriptFullPath, extraArgs, { env });
  wizardProcess.on('close', (code) => {
    process.exit(code || 0);
  });
}

async function handleAudit(customArgs) {
  const { runAudit } = await import('./narrative_audit.js');
  const auditArgs = customArgs !== undefined ? customArgs : args.slice(1);
  runAudit(auditArgs);
}

async function handleContinuity(customArgs) {
  const { runContinuityScan } = await import('./continuity_scan.js');
  const contArgs = customArgs !== undefined ? customArgs : args.slice(1);
  runContinuityScan(contArgs);
}

async function handleCompile() {
  const { compileManuscript } = await import('./compile_manuscript.js');
  compileManuscript(args.slice(1));
}

function parseFrontmatterList(content, key) {
  const clean = content.replace(/^\uFEFF/, '');
  const fm = clean.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return [];
  const lines = fm[1].split(/\r?\n/);
  const items = [];
  let inBlock = false;
  for (const line of lines) {
    if (new RegExp(`^${key}:\\s*$`).test(line)) { inBlock = true; continue; }
    if (inBlock) {
      const item = line.match(/^\s+-\s+(\S[^#]*?)\s*(#.*)?$/);
      if (item) items.push(item[1].trim());
      else if (/^\S/.test(line)) inBlock = false;
    }
  }
  return items;
}

const PACKET_FILE_CAP = 48 * 1024;
let totalPacketChars = 0;

function emitPacketEntry(label, filePath) {
  console.log(`\n--- ${label}: ${filePath} ---`);
  const raw = readText(filePath);
  totalPacketChars += raw.length;
  if (raw.length > PACKET_FILE_CAP) {
    console.log(raw.slice(0, PACKET_FILE_CAP));
    console.log(`\n[TRUNCATED at ${PACKET_FILE_CAP} chars — read the file directly for the remainder: ${filePath}]`);
  } else {
    console.log(raw);
  }
}

function handleRunStage(stageId) {
  const matchingStage = STAGES.find(s => s.startsWith(stageId) || s === stageId);
  if (!matchingStage) {
    console.error(`Invalid stage ID: "${stageId}". Choose from: ${STAGES.join(', ')}`);
    process.exit(1);
  }

  const stagePath = path.join('stages', matchingStage);
  const contractPath = path.join(stagePath, 'CONTEXT.md');

  if (!fs.existsSync(contractPath)) {
    console.error(`Stage contract not found at: ${contractPath}`);
    process.exit(1);
  }

  totalPacketChars = 0;
  const contract = readText(contractPath);
  console.log(`=== STAGE PACKET: ${matchingStage} ===`);
  emitPacketEntry('CONTRACT', contractPath);

  const inputs = parseFrontmatterList(contract, 'inputs');
  const templates = parseFrontmatterList(contract, 'templates');
  const missing = [];

  for (const [label, group] of [['INPUT', inputs], ['TEMPLATE', templates]]) {
    for (const item of group) {
      const p = item.replace(/\//g, path.sep);
      if (!fs.existsSync(p)) {
        missing.push(item);
        continue;
      }
      if (fs.statSync(p).isDirectory()) {
        const files = getFilesRecursive(p).filter(f => /\.(md|txt|json|markdown)$/i.test(f));
        if (files.length === 0) missing.push(`${item} (directory is empty)`);
        files.forEach(f => emitPacketEntry(label, f));
      } else {
        emitPacketEntry(label, p);
      }
    }
  }

  // Stage 02 Genre-Conditional Trackers (ICM Layer 3 Template Routing)
  if (matchingStage.startsWith('02')) {
    let genre = null;
    const prefPath = path.join('stages', '01_onboarding', 'output', 'preferences.json');
    if (fs.existsSync(prefPath)) {
      try {
        const pref = JSON.parse(readText(prefPath));
        genre = (pref.genre || pref.primary_genre || pref.subgenre || '').toLowerCase();
      } catch (_) {}
    }
    const genreArg = (process.argv.slice(2) || []).find(a => a.startsWith('--genre='));
    if (genreArg) {
      genre = genreArg.split('=')[1].toLowerCase();
    }

    let form = 'novel';
    if (fs.existsSync(prefPath)) {
      try {
        const pref = JSON.parse(readText(prefPath));
        if (pref.form) form = pref.form.toLowerCase();
      } catch (_) {}
    }
    const formArg = (process.argv.slice(2) || []).find(a => a.startsWith('--form='));
    if (formArg) {
      form = formArg.split('=')[1].toLowerCase();
    }

    const isShortForm = ['short_story', 'novelette'].includes(form);

    if (isShortForm) {
      console.log(`\n--- FORM ADAPTATION: ${form.toUpperCase()} ---`);
      console.log(`Form-Based Architecture: Single beat structure (beats/main.md), living canon, and zero-subplot discipline.`);
      console.log(`Novel continuity trackers omitted per _config/okf_craft/short_story_form_and_single_effect.md.\n`);
    } else if (genre) {
      let tracker = null;
      if (genre.includes('romance') || genre.includes('romantasy')) {
        tracker = path.join('_config', 'templates', 'tracker_romance_heat_ladder.template.md');
      } else if (genre.includes('fantasy') || genre.includes('thriller') || genre.includes('progression') || genre.includes('multi-pov')) {
        tracker = path.join('_config', 'templates', 'tracker_power_escalation.template.md');
      } else if (genre.includes('mystery') || genre.includes('detective') || genre.includes('cozy') || genre.includes('noir')) {
        tracker = path.join('_config', 'templates', 'tracker_fair_play_clues.template.md');
      }
      if (tracker && fs.existsSync(tracker)) {
        emitPacketEntry('GENRE TEMPLATE', tracker);
      }
    }
  }

  const estTokens = Math.ceil(totalPacketChars / 4);
  console.log(`\n=== END PACKET: ${matchingStage} (Est: ${estTokens.toLocaleString()} tokens / target: 2,000–8,000) ===`);
  if (estTokens > 8000) {
    console.log(`\x1b[33mWarning: Stage packet exceeds ICM recommended budget of 8,000 tokens (${estTokens.toLocaleString()} tokens).\x1b[0m`);
  }
  if (missing.length) {
    console.log(`\nMissing inputs (produce these via the earlier stage, or proceed if the contract marks them optional):`);
    missing.forEach(m => console.log(`  ✗ ${m}`));
  }
  console.log(`\nExecutor instructions: follow the CONTRACT's Process section. Write outputs to the exact paths its frontmatter declares, using the TEMPLATE structures where provided. Verify against the contract's Verification section before marking the stage complete.`);
}

function handlePackChapter(chId) {
  if (!chId) {
    console.error(`Error: Please specify a chapter number (e.g. node scripts/${binName}.js pack-chapter 1)`);
    process.exit(1);
  }

  const num = parseInt(chId, 10);
  const padNum = String(num).padStart(2, '0');
  printHeader(`Chapter ${num} Context Kit Packaging`);

  let totalKitChars = 0;
  function emitKitSection(title, content) {
    console.log(`--- ${title} ---`);
    console.log(content.trim());
    console.log('-------------------------------------------------------\n');
    totalKitChars += content.length;
  }

  let manifest = null;
  let chEntry = null;
  if (fs.existsSync('manuscript.json')) {
    try {
      manifest = JSON.parse(readText('manuscript.json'));
      if (Array.isArray(manifest.chapters)) {
        chEntry = manifest.chapters.find(c => c.id === num);
      }
    } catch (e) {
      console.warn(`Could not read manuscript.json: ${e.message}`);
    }
  }

  // 1. Resolve Beat file from manuscript.json or conventions
  let beatFile = null;
  if (chEntry && chEntry.beat_file && fs.existsSync(chEntry.beat_file.replace(/\//g, path.sep))) {
    beatFile = chEntry.beat_file.replace(/\//g, path.sep);
  } else {
    const candidates = [
      path.join('stages', '02_planning', 'output', 'beats', `ch${padNum}.md`),
      path.join('stages', '02_planning', 'output', 'beats', `ch${num}.md`),
      path.join('stages', '02_planning', 'output', 'beats', `chapter_${padNum}_beats.md`),
      path.join('stages', '02_planning', 'output', 'beats', `chapter_${num}_beats.md`)
    ];
    beatFile = candidates.find(c => fs.existsSync(c));
  }

  if (!beatFile) {
    console.log(`\x1b[33mWarning: Beat file for Chapter ${num} not found.\x1b[0m`);
  } else {
    console.log(`\x1b[32m✔ Loaded Beats: ${beatFile}\x1b[0m\n`);
    const beatContent = readText(beatFile);
    emitKitSection('CHAPTER BEATS', beatContent);

    const linkMatches = [...beatContent.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];
    if (linkMatches.length > 0) {
      let entitySection = '';
      linkMatches.forEach(match => {
        const linkPath = match[2].replace(/\//g, path.sep);
        const resolved = path.resolve(path.dirname(beatFile), linkPath);
        if (fs.existsSync(resolved)) {
          entitySection += `\n### Entity: ${match[1]} (${linkPath})\n` + readText(resolved).trim() + '\n';
        }
      });
      if (entitySection) {
        emitKitSection('RESOLVED ENTITY CONTEXT NODES', entitySection);
      }
    }
  }

  // 2. Mandatory Canon Facts (Layer 4)
  const canonFile = path.join('stages', '02_planning', 'output', 'canon.md');
  if (fs.existsSync(canonFile)) {
    emitKitSection('ESTABLISHED CANON (Mandatory Facts)', readText(canonFile));
  }

  // 3. Structure Plan rows for this chapter
  const structPlanFile = path.join('stages', '02_planning', 'output', 'structure_plan.md');
  if (fs.existsSync(structPlanFile)) {
    const spContent = readText(structPlanFile);
    const spLines = spContent.split(/\r?\n/);
    const relevantLines = spLines.filter(line => {
      const match = line.match(/\|\s*(\d+)\s*\|/);
      return match && parseInt(match[1], 10) === num;
    });
    if (relevantLines.length > 0) {
      emitKitSection(`STRUCTURE PLAN CONTEXT (Ch ${num})`, relevantLines.join('\n'));
    }
  }

  // 4. Character Arc Beats for this chapter
  const arcsFile = path.join('stages', '02_planning', 'output', 'character_arcs.md');
  if (fs.existsSync(arcsFile)) {
    const arcsContent = readText(arcsFile);
    const arcLines = arcsContent.split(/\r?\n/);
    const chArcLines = arcLines.filter(line => new RegExp(`\\b(?:Ch|Chapter)\\s*0?${num}\\b`, 'i').test(line));
    if (chArcLines.length > 0) {
      emitKitSection(`SCHEDULED CHARACTER ARC BEATS (Ch ${num})`, chArcLines.join('\n'));
    }
  }

  // 5. Voice Exemplars (Layer 4 vs Layer 3 Fix)
  const exemplarsFile = path.join('stages', '02_planning', 'output', 'voice_exemplars.md');
  if (fs.existsSync(exemplarsFile)) {
    emitKitSection('VOICE EXEMPLARS (Layer 4 Anti-Drift Target)', readText(exemplarsFile));
  } else {
    const voiceFile = path.join('_config', 'voice.md');
    if (fs.existsSync(voiceFile)) {
      emitKitSection('DEFAULT VOICE GUIDE (Layer 3 Baseline)', readText(voiceFile));
    }
  }

  // 6. Anti-drift calibration: Trailing ~500 words of previous chapter (clean without frontmatter)
  if (num > 1) {
    const prevNum = num - 1;
    const prevPad = String(prevNum).padStart(2, '0');
    let prevDraft = null;
    if (manifest && Array.isArray(manifest.chapters)) {
      const prevEntry = manifest.chapters.find(c => c.id === prevNum);
      if (prevEntry && prevEntry.draft_file && fs.existsSync(prevEntry.draft_file.replace(/\//g, path.sep))) {
        prevDraft = prevEntry.draft_file.replace(/\//g, path.sep);
      }
    }
    if (!prevDraft) {
      const candidates = [
        path.join('stages', '03_drafting', 'output', 'chapters', `ch${prevPad}.md`),
        path.join('stages', '03_drafting', 'output', 'chapters', `ch${prevNum}.md`),
        path.join('stages', '03_drafting', 'output', 'chapters', `chapter_${prevPad}.md`),
        path.join('stages', '03_drafting', 'output', 'chapters', `chapter_${prevNum}.md`)
      ];
      prevDraft = candidates.find(p => fs.existsSync(p));
    }

    if (prevDraft) {
      let raw = readText(prevDraft);
      raw = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
      const paras = raw.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
      let tailWords = [];
      for (let i = paras.length - 1; i >= 0; i--) {
        const words = paras[i].split(/\s+/);
        tailWords.unshift(...words);
        if (tailWords.length >= 500) break;
      }
      const anchor = tailWords.slice(-500).join(' ');
      emitKitSection(`PREVIOUS CHAPTER TRAILING ANCHOR (Ch ${prevNum})`, anchor);
    }
  }

  const estTokens = Math.ceil(totalKitChars / 4);
  console.log(`\x1b[32m✔ Context kit compiled successfully. Ready for Stage 03 drafting.\x1b[0m`);
  console.log(`\x1b[1m[ICM Kit Budget: ~${estTokens.toLocaleString()} tokens / 6,000 target]\x1b[0m\n`);
  if (estTokens > 6000) {
    console.log(`\x1b[33mWarning: Chapter kit exceeds target 6,000 tokens (${estTokens.toLocaleString()} tokens). Consider trimming referenced entity descriptions.\x1b[0m\n`);
  }
}

function handleOkfIndex() {
  printHeader('Rebuilding OKF Catalogs');
  const craftDir = path.join('_config', 'okf_craft');
  if (fs.existsSync(craftDir)) {
    const files = fs.readdirSync(craftDir)
      .filter(f => f.endsWith('.md') && f !== 'index.md' && f !== 'CONTEXT.md')
      .sort();
    let lastIndexed = new Date().toISOString().split('T')[0];
    const indexPath = path.join(craftDir, 'index.md');
    if (fs.existsSync(indexPath)) {
      const existing = readText(indexPath);
      const dateMatch = existing.match(/last_indexed:\s*(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        lastIndexed = dateMatch[1];
      }
    }
    let indexContent = `---\ntype: okf_index\ntitle: "Static Narrative Craft OKF Catalog"\nlast_indexed: ${lastIndexed}\n---\n\n# ${APP_NAME} Static Craft Knowledge Catalog\n\n`;
    
    files.forEach(f => {
      const fullPath = path.join(craftDir, f);
      const content = readText(fullPath);
      let title = f;
      const titleQuotedMatch = content.match(/title:\s*"([^"\r\n]+)"/) || content.match(/title:\s*'([^'\r\n]+)'/) || content.match(/title:\s*([^\r\n]+)/);
      if (titleQuotedMatch) {
        title = titleQuotedMatch[1].trim();
      }
      const typeMatch = content.match(/type:\s*([^\r\n]+)/);
      const type = typeMatch ? typeMatch[1].trim() : 'uncategorized';
      indexContent += `- [${title}](${f}) — \`type: ${type}\`\n`;
    });

    fs.writeFileSync(path.join(craftDir, 'index.md'), indexContent, 'utf8');
    console.log(`  ✔ Rebuilt static craft index at ${path.join(craftDir, 'index.md')}`);
  }
}

async function handleOkfLint() {
  const { runOkfLint } = await import('./okf_lint.js');
  const result = runOkfLint({ rootDir: process.cwd(), strict: args.includes('--strict') });
  if (!result.ok) {
    process.exit(1);
  }
}

const CRAFT_SYNONYMS = {
  'sagging middle': ['murch_rule_of_six_pacing', 'thriller_escalation_pacing', 'story_grid_macro'],
  'slow pacing': ['thriller_escalation_pacing', 'swain_mru_and_pacing_velocity_equations'],
  'flat dialogue': ['three_registers_of_dialogue_subtext', 'voice_differentiation_across_ensemble'],
  'exposition': ['primitive_epistemic_asymmetry', 'lore_density_diagnostic'],
  'middle book': ['series_architecture_and_cross_book_arcs'],
  'short story': ['short_story_form_and_single_effect'],
  'novella': ['novella_form_and_compressed_turn'],
  'cliffhanger': ['chapter_architecture_and_ending_hooks', 'hitchcock_bomb_suspense'],
};

function loadSynonyms(rootDir) {
  const synPath = path.join(rootDir, '_config', 'okf_craft', 'synonyms.md');
  const map = { ...CRAFT_SYNONYMS };
  if (!fs.existsSync(synPath)) return map;
  const content = fs.readFileSync(synPath, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('Author Symptom')) continue;
    const parts = line.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const phrase = parts[0].toLowerCase();
      const targets = parts[1].replace(/[`\s]/g, '').split(',').map(t => t.replace(/\.md$/, ''));
      map[phrase] = targets;
    }
  }
  return map;
}

function parseYamlListFromContent(text, key) {
  const m = text.match(new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, 'm'));
  if (m) {
    return m[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  }
  const lines = text.split(/\r?\n/);
  let inKey = false;
  const items = [];
  for (const line of lines) {
    if (new RegExp(`^${key}:\\s*$`).test(line)) {
      inKey = true;
      continue;
    }
    if (inKey) {
      const itemMatch = line.match(/^\s+-\s+["']?([^"'\\r\\n#]+)["']?/);
      if (itemMatch) {
        items.push(itemMatch[1].trim());
      } else if (/^\S/.test(line)) {
        inKey = false;
      }
    }
  }
  return items;
}

function handleCraftSearch(searchArgs) {
  const isJson = searchArgs.includes('--json');
  const stageFlag = (searchArgs.find(a => a.startsWith('--stage=')) || '').replace('--stage=', '').trim();
  const genreFlag = (searchArgs.find(a => a.startsWith('--genre=')) || '').replace('--genre=', '').trim().toLowerCase();
  const scopeFlag = (searchArgs.find(a => a.startsWith('--scope=')) || '').replace('--scope=', '').trim();

  const terms = searchArgs.filter(a => !a.startsWith('--') && a !== 'search');
  const query = terms.join(' ').trim();
  
  if (!query && !stageFlag && !genreFlag && !scopeFlag) {
    console.log(`\x1b[33mUsage: node scripts/${binName}.js craft search <query> [--stage=<id>] [--genre=<name>] [--scope=<level>] [--json]\x1b[0m`);
    return;
  }
  
  const craftDir = path.join('_config', 'okf_craft');
  if (!fs.existsSync(craftDir)) {
    console.error(`Craft directory not found at ${craftDir}`);
    return;
  }
  
  const files = fs.readdirSync(craftDir).filter(f => f.endsWith('.md') && !['index.md', 'CONTEXT.md', 'SPECIFICATION.md', 'synonyms.md'].includes(f));
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);
  const synonyms = loadSynonyms(process.cwd());
  const results = [];
  
  files.forEach(f => {
    const fullPath = path.join(craftDir, f);
    const content = readText(fullPath);
    const titleMatch = content.match(/title:\s*"([^"\r\n]+)"/) || content.match(/title:\s*'([^'\r\n]+)'/) || content.match(/title:\s*([^\r\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : f;
    const typeMatch = content.match(/type:\s*([^\r\n]+)/);
    const type = typeMatch ? typeMatch[1].trim() : 'uncategorized';
    const scopeMatch = content.match(/scope:\s*([^"\r\n]+)/);
    const scope = scopeMatch ? scopeMatch[1].trim() : '';

    const stages = parseYamlListFromContent(content, 'stages');
    const genres = parseYamlListFromContent(content, 'genres');
    const keywordsList = parseYamlListFromContent(content, 'keywords');
    const keywords = keywordsList.join(' ').toLowerCase();
    
    // Apply CLI flag filters
    if (stageFlag && !stages.includes(stageFlag)) return;
    if (genreFlag && genres.length > 0 && !genres.some(g => g.toLowerCase().includes(genreFlag))) return;
    if (scopeFlag && scope !== scopeFlag) return;

    let score = 0;
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();
    const baseName = f.replace(/\.md$/, '').toLowerCase();
    
    if (queryLower) {
      // Whole phrase matches
      if (lowerTitle.includes(queryLower)) score += 30;
      if (baseName.includes(queryLower.replace(/\s+/g, '_'))) score += 25;
      if (keywords.includes(queryLower)) score += 35;
      if (lowerContent.includes(queryLower)) score += 10;
      
      // Synonym mappings lookup
      for (const [synonym, targets] of Object.entries(synonyms)) {
        if ((queryLower.includes(synonym) || synonym.includes(queryLower)) && targets.some(t => baseName.includes(t))) {
          score += 40;
        }
      }

      // Word-level weighted scoring: keywords 3x, title 2x, id 2x, body 1x
      queryWords.forEach(w => {
        if (keywords.includes(w)) score += 36;
        if (lowerTitle.includes(w)) score += 24;
        if (baseName.includes(w)) score += 20;
        const bodyCount = (lowerContent.match(new RegExp(`\\b${w}`, 'gi')) || []).length;
        score += Math.min(bodyCount, 10);
      });
    } else {
      score = 10;
    }
    
    if (score > 0) {
      const lines = content.split('\n');
      let summary = '';
      for (const line of lines) {
        if (line.trim().startsWith('# ') || line.trim().startsWith('---') || line.trim().length === 0) continue;
        if (!line.includes(':') && line.length > 20) {
          summary = line.trim();
          break;
        }
      }
      results.push({
        file: f,
        path: path.join(craftDir, f).replace(/\\/g, '/'),
        title,
        type,
        scope,
        stages,
        genres,
        score,
        summary: summary.slice(0, 160) + (summary.length > 160 ? '...' : '')
      });
    }
  });
  
  results.sort((a, b) => b.score - a.score);
  const topResults = results.slice(0, 8);
  
  if (isJson) {
    console.log(JSON.stringify(topResults, null, 2));
    return;
  }
  
  const filterDesc = [
    stageFlag ? `stage=${stageFlag}` : null,
    genreFlag ? `genre=${genreFlag}` : null,
    scopeFlag ? `scope=${scopeFlag}` : null,
  ].filter(Boolean).join(', ');

  const titleHeader = query 
    ? `${APP_NAME} Craft Search: "${query}"${filterDesc ? ` [${filterDesc}]` : ''} (${results.length} matches)`
    : `${APP_NAME} Craft Search [${filterDesc}] (${results.length} matches)`;

  printHeader(titleHeader);

  if (topResults.length === 0) {
    console.log(`  No matching craft modules found for "${query}".\n`);
    console.log(`  \x1b[1m\x1b[36mRecommended Starting Points from Layer 3 Router (_config/okf_craft/CONTEXT.md):\x1b[0m`);
    console.log(`  • Macro Planning:      story_grid_macro.md, four_corner_opposition_and_foil_matrix.md`);
    console.log(`  • Scene & Beats:       scene_level_five_commandments_coyne.md, cpocl_plan_threat_conflict_engine.md`);
    console.log(`  • Pacing & Rhythm:     murch_rule_of_six_pacing.md, thriller_escalation_pacing.md`);
    console.log(`  • Dialogue & Subtext:  three_registers_of_dialogue_subtext.md, subtext_and_implied_meaning.md`);
    console.log(`  • Diagnostics & Slop:  adversarial_prose_auditing_and_slop_filtering.md, anti_tell_suppression.md\n`);
    console.log(`  \x1b[90mTip: Consult _config/okf_craft/synonyms.md for full author symptom search index.\x1b[0m\n`);
    return;
  }
  
  topResults.forEach((r, idx) => {
    console.log(`  \x1b[36m${idx + 1}. [${r.title}]\x1b[0m (${r.type} | ${r.scope || 'universal'})`);
    console.log(`     \x1b[90mPath: ${r.path}\x1b[0m`);
    if (r.summary) {
      console.log(`     \x1b[37m${r.summary}\x1b[0m`);
    }
    console.log('');
  });
}

function showHelp() {
  console.log(`
${APP_NAME} novel engineering CLI

Usage:
  node scripts/${BIN_NAME}.js init [folder] [--form]  Scaffold workspace (forms: short_story, novella, novel, series)
  node scripts/${BIN_NAME}.js status                 Show the status of each pipeline stage
  node scripts/${BIN_NAME}.js brief                  Executive summary of manuscript progress & state
  node scripts/${BIN_NAME}.js craft search <query>   Search craft modules (flags: --stage, --genre, --scope, --json)
  node scripts/${BIN_NAME}.js okf-lint              Validate all craft modules against ICM standards
  node scripts/${BIN_NAME}.js diag [name] [args]     Run diagnostic tools (rhythm, dialogue, tense, etc.)
  node scripts/${BIN_NAME}.js wizard [name] [args]   Run creative wizards (onboard, unstuck, heat, etc.)
  node scripts/${BIN_NAME}.js run-stage <stage_id>   Compile the stage packet for the executing agent
  node scripts/${BIN_NAME}.js pack-chapter <N>       Assemble token-disciplined drafting kit for Chapter N
  node scripts/${BIN_NAME}.js okf-index              Rebuild index.md catalogs for OKF knowledge bundles
  node scripts/${BIN_NAME}.js audit [path ...]       Scan chapters for AI prose tells
  node scripts/${BIN_NAME}.js continuity [dir]       Scan chapters for proper-noun consistency
  node scripts/${BIN_NAME}.js compile [--all]        Compile passed chapters into manuscript.html (+ .epub via pandoc)
  `);
}

switch (command) {
  case 'init':
    handleInit(subCommand);
    break;
  case 'status':
    handleStatus();
    break;
  case 'brief':
  case 'resume':
    handleBrief();
    break;
  case 'craft':
    handleCraftSearch(args.slice(1));
    break;
  case 'okf-lint':
  case 'lint':
    handleOkfLint();
    break;
  case 'diag':
  case 'diagnostic':
  case 'diagnostics':
    handleDiagnostic(subCommand, args.slice(2));
    break;
  case 'wizard':
  case 'wizards':
    handleWizard(subCommand, args.slice(2));
    break;
  case 'run-stage':
    handleRunStage(subCommand || args[2]);
    break;
  case 'pack-chapter':
    handlePackChapter(subCommand || args[1]);
    break;
  case 'okf-index':
    handleOkfIndex();
    break;
  case 'audit':
    handleAudit();
    break;
  case 'continuity':
    handleContinuity();
    break;
  case 'compile':
    handleCompile();
    break;
  case '--help':
  case 'help':
  default:
    showHelp();
    break;
}

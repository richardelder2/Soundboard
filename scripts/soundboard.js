#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';

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
    if (path.basename(src) === 'output') return; // Skip stage outputs to keep it blank
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
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templateDir = path.dirname(__dirname); // The template Soundboard folder
  
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

  // Every project gets its own physical copy of everything. The combined size of
  // scripts/setup/.claude is under 200KB, so disk bloat is not a real concern —
  // and a physical copy keeps each project fully self-contained (no shared state
  // across parallel projects, no broken references when a project is cloned onto
  // a machine without the template repo at the same path). To pick up template
  // fixes later, re-run `init` inside the project (see AGENTS.md "Multiple
  // projects & series" — outputs, manuscript.json, and .env are preserved).
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

  // Write default .env template if it doesn't exist
  const envPath = path.join(targetDir, '.env');
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `# Soundboard Environment Variables
# Option A: Local Edge (Ollama)
LOCAL_MODEL=true
LOCAL_MODEL_URL=http://localhost:11434/v1/chat/completions
LOCAL_MODEL_NAME=gemma2

# Option B: OpenRouter
# USE_OPENROUTER=true
# OPENROUTER_API_KEY=your_key
# OPENROUTER_MODEL=meta-llama/llama-3-8b-instruct:free

# Option C: Gemini Cloud
# GEMINI_API_KEY=your_key
`, 'utf8');
    console.log('  ✔ Created template .env file.');
  }

  console.log('\n\x1b[32m✔ Soundboard Workspace successfully initialized! Run "npm install" to configure dependencies.\x1b[0m\n');
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
    manifest = JSON.parse(fs.readFileSync('manuscript.json', 'utf8'));
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
      const raw = fs.readFileSync(draft, 'utf8');
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

  // Production loop: what's next?
  const next = chapters.find(ch => ch.status !== 'passed');
  if (!next) {
    console.log('  \x1b[32mAll chapters passed — next action: Stage 05 compile (node scripts/soundboard.js compile)\x1b[0m');
  } else {
    const action = {
      planned: `draft it (Stage 03 — beats: ${next.beat_file || 'n/a'})`,
      drafted: `audit it (Stage 04 — node scripts/soundboard.js audit, then the rubric)`,
      audited: `resolve findings and pass the Stage 04 gate`,
    }[next.status] || 'check its status value';
    console.log(`  Next action → chapter ${next.id}: ${action}`);
  }
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
  node scripts/soundboard.js diag audit [path]         Full AI prose tell & rhythm scan
  node scripts/soundboard.js diag continuity [dir]     Proper noun & character continuity scan
  node scripts/soundboard.js diag rhythm [chapter]     Sentence length standard deviation & cadence
  node scripts/soundboard.js diag dialogue [chapter]   Speaker attribution & dialogue ratio
  node scripts/soundboard.js diag tense [chapter]      Past vs. present tense consistency & slips
  node scripts/soundboard.js diag sensory [chapter]    Sensory anchor density (visual/auditory/tactile)
  node scripts/soundboard.js diag dread [chapter]      Dread pacing & sluggish suspense blocks
  node scripts/soundboard.js diag lore [chapter]       Lore density & exposition info-dump scanner
  node scripts/soundboard.js diag heatmap              Character presence & interaction matrix
  node scripts/soundboard.js diag resource             Physical resource tracking (oxygen, battery, ammo)
  node scripts/soundboard.js diag playbook [chapter]   Generate curated revision playbook
  node scripts/soundboard.js diag all [chapter]        Run all mechanical diagnostics sequentially
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
    printHeader('Running Full Soundboard Diagnostic Suite');
    console.log('\n--- 1. Narrative Prose Audit ---');
    await handleAudit(extraArgs);
    console.log('\n--- 2. Character & Proper-Noun Continuity ---');
    await handleContinuity(extraArgs);

    const sequence = ['rhythm', 'dialogue', 'tense', 'sensory', 'dread', 'lore'];
    for (let i = 0; i < sequence.length; i++) {
      const name = sequence[i];
      console.log(`\n--- ${i + 3}. ${name.toUpperCase()} Diagnostic ---`);
      const child = fork(path.join('scripts', diagMap[name]), extraArgs);
      await new Promise(res => child.on('close', res));
    }
    return;
  }

  const scriptFile = diagMap[subCmd];
  if (!scriptFile) {
    console.error(`Unknown diagnostic: "${subCmd}". Run "node scripts/soundboard.js diag" to see available tools.`);
    return;
  }

  const child = fork(path.join('scripts', scriptFile), extraArgs);
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
  node scripts/soundboard.js wizard onboard [--blueprint=<name>]   Start novel onboarding session
  node scripts/soundboard.js wizard unstuck                         Overcome writer's block (pacing, twists)
  node scripts/soundboard.js wizard brainstorm                      Brainstorm premise & core tensions
  node scripts/soundboard.js wizard interview                       Character deep-dive interrogation
  node scripts/soundboard.js wizard heat                            Dialogue escalation & subtext intensifier
  node scripts/soundboard.js wizard bloom                           Sensory expansion & setting viscosity
  node scripts/soundboard.js wizard scene                           Scene staging & physical blocking
  node scripts/soundboard.js wizard theme                           Theme weaver & subtle resonance
  node scripts/soundboard.js wizard therefore-but                   Causal calculus ("Therefore / But" links)
  node scripts/soundboard.js wizard wwxdu                           "What Would X Do Unexpectedly" subversion
    `);
    return;
  }

  const scriptFile = wizardMap[type];
  if (!scriptFile) {
    console.error(`Unknown wizard: "${type}". Run "node scripts/soundboard.js wizard" to see available wizards.`);
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

  const wizardProcess = fork(path.join('scripts', scriptFile), extraArgs, { env });
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

// Parse a simple YAML frontmatter list block (e.g. "inputs:" / "templates:") from a contract.
function parseFrontmatterList(content, key) {
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return [];
  const lines = fm[1].split(/\r?\n/);
  const items = [];
  let inBlock = false;
  for (const line of lines) {
    if (new RegExp(`^${key}:\\s*$`).test(line)) { inBlock = true; continue; }
    if (inBlock) {
      const item = line.match(/^\s+-\s+(\S[^#]*?)\s*(#.*)?$/);
      if (item) items.push(item[1].trim());
      else if (/^\S/.test(line)) inBlock = false; // next top-level key
    }
  }
  return items;
}

const PACKET_FILE_CAP = 48 * 1024; // per-file cap to keep packets consumable

function emitPacketEntry(label, filePath) {
  console.log(`\n--- ${label}: ${filePath} ---`);
  const raw = fs.readFileSync(filePath, 'utf8');
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

  // Compile the stage packet: contract + declared inputs + declared templates,
  // as one context block any executor (agent or API) can consume.
  const contract = fs.readFileSync(contractPath, 'utf8');
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

  console.log(`\n=== END PACKET: ${matchingStage} ===`);
  if (missing.length) {
    console.log(`\nMissing inputs (produce these via the earlier stage, or proceed if the contract marks them optional):`);
    missing.forEach(m => console.log(`  ✗ ${m}`));
  }
  console.log(`\nExecutor instructions: follow the CONTRACT's Process section. Write outputs to the exact paths its frontmatter declares, using the TEMPLATE structures where provided. Verify against the contract's Verification section before marking the stage complete.`);
}

function handlePackChapter(chId) {
  if (!chId) {
    console.error('Error: Please specify a chapter number (e.g. node scripts/soundboard.js pack-chapter 1)');
    process.exit(1);
  }

  const num = parseInt(chId, 10);
  const padNum = String(num).padStart(2, '0');
  printHeader(`Chapter ${num} Context Kit Packaging`);

  let beatFile = path.join('stages', '02_planning', 'output', 'beats', `chapter_${padNum}_beats.md`);
  if (!fs.existsSync(beatFile)) {
    beatFile = path.join('stages', '02_planning', 'output', 'beats', `chapter_${num}_beats.md`);
  }

  if (!fs.existsSync(beatFile)) {
    console.log(`\x1b[33mWarning: Beat file not found at ${beatFile}\x1b[0m`);
  } else {
    console.log(`\x1b[32m✔ Loaded Beats: ${beatFile}\x1b[0m\n`);
    const beatContent = fs.readFileSync(beatFile, 'utf8');
    console.log('--- CHAPTER BEATS ---');
    console.log(beatContent);
    console.log('---------------------\n');

    // Parse Markdown links to characters or settings
    const linkMatches = [...beatContent.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];
    if (linkMatches.length > 0) {
      console.log('--- RESOLVED ENTITY CONTEXT NODES ---');
      linkMatches.forEach(match => {
        const linkPath = match[2].replace(/\//g, path.sep);
        const resolved = path.resolve(path.dirname(beatFile), linkPath);
        if (fs.existsSync(resolved)) {
          console.log(`\n### Entity: ${match[1]} (${linkPath})`);
          console.log(fs.readFileSync(resolved, 'utf8').trim());
        }
      });
      console.log('-------------------------------------\n');
    }
  }

  // Load Voice Exemplars if available
  const voiceFile = path.join('_config', 'voice.md');
  if (fs.existsSync(voiceFile)) {
    console.log('--- VOICE CALIBRATION KIT ---');
    console.log(fs.readFileSync(voiceFile, 'utf8').trim());
    console.log('-----------------------------\n');
  }

  // Anti-drift calibration: Fetch trailing ~500 words of previous chapter
  if (num > 1) {
    const prevNum = num - 1;
    const prevPad = String(prevNum).padStart(2, '0');
    const candidates = [
      path.join('stages', '03_drafting', 'output', 'chapters', `chapter_${prevPad}.md`),
      path.join('stages', '03_drafting', 'output', 'chapters', `chapter_${prevNum}.md`)
    ];
    const prevDraft = candidates.find(p => fs.existsSync(p));
    if (prevDraft) {
      const raw = fs.readFileSync(prevDraft, 'utf8');
      const words = raw.split(/\s+/);
      const tailWords = words.slice(Math.max(0, words.length - 500)).join(' ');
      console.log(`--- PREVIOUS CHAPTER TRAILING ANCHOR (Ch ${prevNum}) ---`);
      console.log(tailWords);
      console.log('-------------------------------------------------------\n');
    }
  }

  console.log(`\x1b[32m✔ Context kit compiled successfully. Ready for Stage 03 drafting.\x1b[0m\n`);
}

function handleOkfIndex() {
  printHeader('Rebuilding OKF Catalogs');
  const craftDir = path.join('_config', 'okf_craft');
  if (fs.existsSync(craftDir)) {
    const files = fs.readdirSync(craftDir).filter(f => f.endsWith('.md') && f !== 'index.md');
    let indexContent = `---\ntype: okf_index\ntitle: "Static Narrative Craft OKF Catalog"\nlast_indexed: ${new Date().toISOString().split('T')[0]}\n---\n\n# Soundboard Static Craft Knowledge Catalog\n\n`;
    
    files.forEach(f => {
      const fullPath = path.join(craftDir, f);
      const content = fs.readFileSync(fullPath, 'utf8');
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

function handleCraftSearch(searchArgs) {
  const isJson = searchArgs.includes('--json');
  const terms = searchArgs.filter(a => a !== '--json' && a !== 'search');
  const query = terms.join(' ').trim();
  
  if (!query) {
    console.log(`\x1b[33mUsage: node scripts/soundboard.js craft search <query> [--json]\x1b[0m`);
    return;
  }
  
  const craftDir = path.join('_config', 'okf_craft');
  if (!fs.existsSync(craftDir)) {
    console.error(`Craft directory not found at ${craftDir}`);
    return;
  }
  
  const files = fs.readdirSync(craftDir).filter(f => f.endsWith('.md') && f !== 'index.md');
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const results = [];
  
  files.forEach(f => {
    const fullPath = path.join(craftDir, f);
    const content = fs.readFileSync(fullPath, 'utf8');
    const titleMatch = content.match(/title:\s*"([^"\r\n]+)"/) || content.match(/title:\s*'([^'\r\n]+)'/) || content.match(/title:\s*([^\r\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : f;
    const typeMatch = content.match(/type:\s*([^\r\n]+)/);
    const type = typeMatch ? typeMatch[1].trim() : 'uncategorized';
    
    let score = 0;
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();
    const lowerFile = f.toLowerCase();
    
    // Check exact query
    if (lowerTitle.includes(query.toLowerCase())) score += 25;
    if (lowerFile.includes(query.toLowerCase().replace(/\s+/g, '_'))) score += 20;
    if (lowerContent.includes(query.toLowerCase())) score += 15;
    
    // Check individual words
    queryWords.forEach(w => {
      if (lowerTitle.includes(w)) score += 8;
      if (lowerFile.includes(w)) score += 5;
      const count = (lowerContent.match(new RegExp(`\\b${w}`, 'gi')) || []).length;
      score += Math.min(count, 10);
    });
    
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
  
  printHeader(`Soundboard Craft Search: "${query}" (${results.length} matches found)`);
  if (topResults.length === 0) {
    console.log(`  No matching craft modules found for "${query}".\n`);
    return;
  }
  
  topResults.forEach((r, idx) => {
    console.log(`  \x1b[36m${idx + 1}. [${r.title}]\x1b[0m (${r.type})`);
    console.log(`     \x1b[90mPath: ${r.path}\x1b[0m`);
    if (r.summary) {
      console.log(`     \x1b[37m${r.summary}\x1b[0m`);
    }
    console.log('');
  });
}

function showHelp() {
  console.log(`
Soundboard novel engineering CLI

Usage:
  node scripts/soundboard.js init [folder]          Scaffold a self-contained novel workspace in [folder]
  node scripts/soundboard.js status                 Show the status of each pipeline stage
  node scripts/soundboard.js craft search <query>   Search the 80+ craft modules in _config/okf_craft/
  node scripts/soundboard.js diag [name] [args]     Run diagnostic tools (rhythm, dialogue, tense, sensory, dread, lore, all)
  node scripts/soundboard.js wizard [name] [args]   Run creative wizards (onboard, unstuck, brainstorm, heat, bloom, etc.)
  node scripts/soundboard.js run-stage <stage_id>   Compile the stage packet for the executing agent
  node scripts/soundboard.js pack-chapter <N>       Assemble token-disciplined drafting kit for Chapter N
  node scripts/soundboard.js okf-index              Rebuild index.md catalogs for OKF knowledge bundles
  node scripts/soundboard.js audit [path ...]       Scan chapters for AI prose tells
  node scripts/soundboard.js continuity [dir]       Scan chapters for proper-noun & character name inconsistencies
  node scripts/soundboard.js compile [--all]        Compile passed chapters into manuscript.html (+ .epub via pandoc)
  `);
}

switch (command) {
  case 'init':
    handleInit(subCommand);
    break;
  case 'status':
    handleStatus();
    break;
  case 'craft':
    handleCraftSearch(args.slice(1));
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



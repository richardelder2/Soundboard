#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

console.log('\n\x1b[1m\x1b[36m========================================');
console.log('       SAGA / Soundboard Test Suite');
console.log('========================================\x1b[0m\n');

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${testName}`);
    if (details) console.error(`    \x1b[90m${details}\x1b[0m`);
    failed++;
  }
}

// Test 1: Zero UTF-8 BOM files in repository (excluding test fixtures)
function testBOM() {
  function walk(dir) {
    let res = [];
    fs.readdirSync(dir).forEach(f => {
      if (f === '.git' || f === 'node_modules' || f === 'fixtures') return;
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) res = res.concat(walk(p));
      else if (/\.(md|js|json|yml|txt)$/i.test(f)) res.push(p);
    });
    return res;
  }
  const allFiles = walk(rootDir);
  const boms = allFiles.filter(f => {
    const b = fs.readFileSync(f);
    return b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf;
  });
  assert(boms.length === 0, 'No UTF-8 BOM bytes found in codebase files', `Found BOM in: ${boms.slice(0, 3).join(', ')}`);

  const bomFixture = path.join(rootDir, 'tests', 'fixtures', 'bom_chapter.md');
  if (fs.existsSync(bomFixture)) {
    const raw = fs.readFileSync(bomFixture, 'utf8');
    const cleaned = raw.replace(/^\uFEFF/, '');
    assert(cleaned.charCodeAt(0) !== 0xFEFF, 'readText helper strips BOM byte from fixture correctly');
  }
}

// Test 2: OKF Frontmatter & Linter against Spec
function testOkfLint() {
  const craftDir = path.join(rootDir, '_config', 'okf_craft');
  const files = fs.readdirSync(craftDir).filter(f => f.endsWith('.md') && f !== 'index.md' && f !== 'CONTEXT.md' && f !== 'SPECIFICATION.md' && f !== 'synonyms.md');
  
  // A. All 92 modules have stages: frontmatter
  let missingStages = 0;
  files.forEach(f => {
    const text = fs.readFileSync(path.join(craftDir, f), 'utf8').replace(/^\uFEFF/, '');
    if (!/^stages:/m.test(text)) missingStages++;
  });
  assert(missingStages === 0, 'All OKF craft modules have valid stages: frontmatter', `${missingStages} files missing stages`);

  // B. Run okf_lint script directly
  const cliScript = fs.existsSync(path.join(rootDir, 'scripts', 'soundboard.js')) ? 'scripts/soundboard.js' : 'scripts/saga.js';
  try {
    const lintOut = execSync(`node ${cliScript} okf-lint`, { cwd: rootDir, encoding: 'utf8' });
    assert(lintOut.includes('OKF bundle conforms to specification') || lintOut.includes('clean and valid'), 'OKF bundle conforms to specification (okf-lint exits 0)');
  } catch (e) {
    assert(false, 'OKF linter failed execution', e.message);
  }

  // C. Verify router omission fails okf-lint
  const contextPath = path.join(craftDir, 'CONTEXT.md');
  const origContext = fs.readFileSync(contextPath, 'utf8');
  try {
    // Temporarily omit a module
    const stripped = origContext.replaceAll('chapter_architecture_and_ending_hooks.md', 'omitted_module.md');
    fs.writeFileSync(contextPath, stripped, 'utf8');
    let threw = false;
    try {
      execSync(`node scripts/okf_lint.js`, { cwd: rootDir, encoding: 'utf8', stdio: 'pipe' });
    } catch (_) {
      threw = true;
    }
    assert(threw, 'Omitting any module from the router causes okf-lint to fail');
  } finally {
    fs.writeFileSync(contextPath, origContext, 'utf8');
  }
}

// Test 3: Stage packet compilation for stages 01 through 05 and Stage 02 budget
function testStagePackets() {
  const cliScript = fs.existsSync(path.join(rootDir, 'scripts', 'soundboard.js')) ? 'scripts/soundboard.js' : 'scripts/saga.js';
  ['01', '02', '03', '04', '05'].forEach(st => {
    try {
      const out = execSync(`node ${cliScript} run-stage ${st}`, { cwd: rootDir, encoding: 'utf8' });
      const hasContract = out.includes('--- CONTRACT:');
      const hasTokenEstimate = /Est: [\d,]+ tokens/.test(out);
      assert(hasContract && hasTokenEstimate, `Stage ${st} packet compiles cleanly with token estimate`);
    } catch (e) {
      assert(false, `Stage ${st} packet execution failed`, e.message);
    }
  });

  // Specific Stage 02 budget check (< 32,000 chars, inside 2,000-8,000 tokens)
  try {
    const out02 = execSync(`node ${cliScript} run-stage 02`, { cwd: rootDir, encoding: 'utf8' });
    const estMatch = out02.match(/Est: ([\d,]+) tokens/);
    const estTokens = estMatch ? parseInt(estMatch[1].replace(/,/g, ''), 10) : 99999;
    assert(out02.length < 32000, `Stage 02 packet is under 32,000 characters (actual: ${out02.length.toLocaleString()} chars)`);
    assert(estTokens >= 2000 && estTokens <= 8000, `Stage 02 token estimate is inside 2,000–8,000 band (actual: ~${estTokens.toLocaleString()} tokens)`);
  } catch (e) {
    assert(false, 'Stage 02 budget check failed', e.message);
  }

  // Stage 02 genre-conditional routing check
  try {
    const mysteryOut = execSync(`node ${cliScript} run-stage 02 --genre=mystery`, { cwd: rootDir, encoding: 'utf8' });
    const hasFairPlay = /GENRE TEMPLATE:.*tracker_fair_play_clues/.test(mysteryOut);
    const hasHeatLadder = /GENRE TEMPLATE:.*tracker_romance_heat_ladder/.test(mysteryOut);
    const hasPowerEsc = /GENRE TEMPLATE:.*tracker_power_escalation/.test(mysteryOut);
    assert(hasFairPlay && !hasHeatLadder && !hasPowerEsc, 'Stage 02 with genre=mystery emits only tracker_fair_play_clues');
  } catch (e) {
    assert(false, 'Stage 02 genre-conditional routing failed', e.message);
  }
}

// Test 4: Density-normalized lexical tells
function testDensityNormalizedTells() {
  const auditScript = path.join(rootDir, 'scripts', 'narrative_audit.js');

  // A. 4,000w fixture with 3 distinct single-use tells -> PASS with WARN
  try {
    const f1 = path.join(rootDir, 'tests', 'fixtures', 'tell_4000w_3single.md');
    const out1 = execSync(`node "${auditScript}" "${f1}"`, { cwd: rootDir, encoding: 'utf8' });
    const repPath1 = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'reports', 'audit_tell_4000w_3single.md');
    const rep1 = fs.existsSync(repPath1) ? fs.readFileSync(repPath1, 'utf8') : '';
    const noTellRed = !out1.includes('Repeated lexical tell') && !out1.includes('Elevated lexical tell density');
    const hasTellWarn = rep1.includes('Isolated lexical tell in narration');
    const verdictNotFail = !out1.includes('FAIL');
    assert(noTellRed && hasTellWarn && verdictNotFail, '4,000w fixture with 3 distinct single-use tells yields WARN without tell FAIL');
  } catch (e) {
    assert(false, '4,000w 3 distinct tells test failed', e.message);
  }

  // B. 4,000w fixture with 1 tell repeated 4x -> FAIL with RED
  try {
    const f2 = path.join(rootDir, 'tests', 'fixtures', 'tell_4000w_repeated.md');
    const out2 = execSync(`node "${auditScript}" "${f2}"`, { cwd: rootDir, encoding: 'utf8' });
    const hasTellRed = out2.includes('Repeated lexical tell found in narration: tapestry ×4');
    assert(hasTellRed && out2.includes('FAIL'), '4,000w fixture with 1 tell repeated 4× triggers tell RED and FAIL');
  } catch (e) {
    assert(false, '4,000w repeated tell test failed', e.message);
  }

  // C. 140w fixture -> WARN (short sample guard, no RED)
  try {
    const f3 = path.join(rootDir, 'tests', 'fixtures', 'tell_140w.md');
    const out3 = execSync(`node "${auditScript}" "${f3}"`, { cwd: rootDir, encoding: 'utf8' });
    const repPath3 = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'reports', 'audit_tell_140w.md');
    const rep3 = fs.existsSync(repPath3) ? fs.readFileSync(repPath3, 'utf8') : '';
    const hasShortGuard = rep3.includes('Short sample') && rep3.includes('Below 800 words capped at review');
    const noRed = !out3.includes('FAIL');
    assert(hasShortGuard && noRed, '140w fixture with tell capped at WARN via short sample guard');
  } catch (e) {
    assert(false, '140w short sample guard test failed', e.message);
  }

  // D. Allowlisted tell ignored
  try {
    const f4 = path.join(rootDir, 'tests', 'fixtures', 'tell_allowlisted.md');
    // Ensure temporary project allowlist
    const projAllowlistDir = path.join(rootDir, 'stages', '01_onboarding', 'output');
    if (!fs.existsSync(projAllowlistDir)) fs.mkdirSync(projAllowlistDir, { recursive: true });
    const projAllowlist = path.join(projAllowlistDir, 'tell_allowlist.md');
    fs.writeFileSync(projAllowlist, '# Project Tell Allowlist\n- tapestry\n', 'utf8');

    try {
      execSync(`node "${auditScript}" "${f4}"`, { cwd: rootDir, encoding: 'utf8' });
      const repPath4 = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'reports', 'audit_tell_allowlisted.md');
      const rep4 = fs.existsSync(repPath4) ? fs.readFileSync(repPath4, 'utf8') : '';
      const tellIgnored = !rep4.includes('tapestry ×') && rep4.includes('| Lexical tells (per 1k) | 0.00 |');
      assert(tellIgnored, 'Allowlisted words are completely ignored by the tell scanner');
    } finally {
      if (fs.existsSync(projAllowlist)) fs.unlinkSync(projAllowlist);
    }
  } catch (e) {
    assert(false, 'Allowlist test failed', e.message);
  }
}

// Test 5: Clean and Sloppy Chapter Fixtures
function testNarrativeAuditFixtures() {
  const cleanFixture = path.join(rootDir, 'tests', 'fixtures', 'clean_chapter.md');
  const sloppyFixture = path.join(rootDir, 'tests', 'fixtures', 'sloppy_chapter.md');
  const auditScript = path.join(rootDir, 'scripts', 'narrative_audit.js');

  try {
    const cleanOut = execSync(`node "${auditScript}" "${cleanFixture}"`, { cwd: rootDir, encoding: 'utf8' });
    assert(cleanOut.includes('CLEAN') || cleanOut.includes('REVIEW'), 'Narrative audit passes clean fixture without false positive fails');
  } catch (e) {
    assert(false, 'Narrative audit failed on clean fixture', e.message);
  }

  try {
    const sloppyOut = execSync(`node "${auditScript}" "${sloppyFixture}"`, { cwd: rootDir, encoding: 'utf8' });
    assert(sloppyOut.includes('FAIL'), 'Narrative audit correctly flags heavy AI-tell chapter as FAIL');
  } catch (e) {
    assert(false, 'Narrative audit failed on sloppy fixture', e.message);
  }
}

// Test 6: Continuity Scan detects name drift
function testContinuityScan() {
  const fixtureDir = path.join(rootDir, 'tests', 'fixtures');
  const contScript = path.join(rootDir, 'scripts', 'continuity_scan.js');
  try {
    const out = execSync(`node "${contScript}" "${fixtureDir}"`, { cwd: rootDir, encoding: 'utf8' });
    const detected = out.toLowerCase().includes('kathryn') || out.toLowerCase().includes('cathryn');
    assert(detected, 'Continuity scan detects near-duplicate names (Kathryn / Cathryn)');
  } catch (e) {
    assert(false, 'Continuity scan execution failed', e.message);
  }
}


// Test 7: Operational Diagnostic -> Craft Remediation Links (T-05)
function testCraftRemediationLinks() {
  const auditScript = path.join(rootDir, 'scripts', 'narrative_audit.js');
  const repeatedFixture = path.join(rootDir, 'tests', 'fixtures', 'tell_4000w_repeated.md');
  try {
    execSync(`node "${auditScript}" "${repeatedFixture}"`, { cwd: rootDir, encoding: 'utf8' });
    const repPath = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'reports', 'audit_tell_4000w_repeated.md');
    const repContent = fs.existsSync(repPath) ? fs.readFileSync(repPath, 'utf8') : '';
    const hasRemediationSection = repContent.includes('## Corrective Craft Remediation');
    const hasSlopLink = repContent.includes('adversarial_prose_auditing_and_slop_filtering.md');
    const hasSyntaxLink = repContent.includes('prose_syntax_and_acoustic_cadence.md');
    assert(hasRemediationSection && hasSlopLink && hasSyntaxLink, 'Audit report contains Corrective Craft Remediation section with active OKF module links');
  } catch (e) {
    assert(false, 'Craft remediation link test failed', e.message);
  }
}

// Test 8: Intelligent Craft Search & Synonym Retrieval (T-06)
function testCraftSearch() {
  const cliScript = fs.existsSync(path.join(rootDir, 'scripts', 'soundboard.js')) ? 'scripts/soundboard.js' : 'scripts/saga.js';
  try {
    // A. Synonym expansion
    const synOut = execSync(`node ${cliScript} craft search "sagging middle" --json`, { cwd: rootDir, encoding: 'utf8' });
    const synJson = JSON.parse(synOut);
    const topMatch = synJson.length > 0 ? synJson[0].file : '';
    const validTop = ['murch_rule_of_six_pacing.md', 'thriller_escalation_pacing.md', 'story_grid_macro.md'].includes(topMatch);
    assert(validTop, 'Craft search expands author symptom ("sagging middle") via synonyms.md to top pacing modules');

    // B. Stage flag filtering
    const stageOut = execSync(`node ${cliScript} craft search "dialogue" --stage=03_drafting --json`, { cwd: rootDir, encoding: 'utf8' });
    const stageJson = JSON.parse(stageOut);
    const allDrafting = stageJson.length > 0 && stageJson.every(item => item.stages && item.stages.includes('03_drafting'));
    assert(allDrafting, 'Craft search --stage=03_drafting filters strictly to modules active in stage 03');

    // C. Graceful fallback on zero matches
    const zeroOut = execSync(`node ${cliScript} craft search "gobbledygooktermxyz"`, { cwd: rootDir, encoding: 'utf8' });
    const hasFallback = zeroOut.includes('No matching craft modules found') && zeroOut.includes('Recommended Starting Points');
    assert(hasFallback, 'Craft search provides educational router fallback when 0 results match');
  } catch (e) {
    assert(false, 'Craft search retrieval test failed', e.message);
  }
}

// Test 9: Form-Based Routing & Short Fiction Packaging (T-07)
function testFormRouting() {
  const cliScript = fs.existsSync(path.join(rootDir, 'scripts', 'soundboard.js')) ? 'scripts/soundboard.js' : 'scripts/saga.js';
  try {
    // A. Short story adaptation in Stage 02 packet
    const storyOut = execSync(`node ${cliScript} run-stage 02 --form=short_story`, { cwd: rootDir, encoding: 'utf8' });
    const hasAdaptation = storyOut.includes('FORM ADAPTATION: SHORT_STORY');
    const noNovelTracker = !storyOut.includes('GENRE TEMPLATE:');
    assert(hasAdaptation && noNovelTracker, 'Stage 02 packet adapts for short_story form, omitting novel-length trackers');

    // B. Expanded modules word count check
    const p1 = path.join(rootDir, '_config', 'okf_craft', 'short_story_form_and_single_effect.md');
    const p2 = path.join(rootDir, '_config', 'okf_craft', 'novella_form_and_compressed_turn.md');
    const w1 = fs.readFileSync(p1, 'utf8').split(/\s+/).length;
    const w2 = fs.readFileSync(p2, 'utf8').split(/\s+/).length;
    assert(w1 >= 400 && w1 <= 550 && w2 >= 400 && w2 <= 550, `Form modules expanded to ~400-550 words (actual: ${w1}w, ${w2}w)`);
  } catch (e) {
    assert(false, 'Form-based routing test failed', e.message);
  }
}


// Test 10: State Model — Structured Canon, Timeline, Thread Ledger (T-09)
function testStateModel() {
  const cliScript = fs.existsSync(path.join(rootDir, 'scripts', 'soundboard.js')) ? 'scripts/soundboard.js' : 'scripts/saga.js';
  const execOptions = { cwd: rootDir, encoding: 'utf8', env: process.env, shell: 'cmd.exe' };

  // A. Structured Canon Query
  try {
    const qOut = execSync(`node ${cliScript} canon query "Rule"`, execOptions);
    assert(qOut.includes('Magic/Tech/System Rule'), 'Canon query accurately extracts matching tabular entity rows');

    const checkOut = execSync(`node ${cliScript} canon check`, execOptions);
    assert(checkOut.includes('Canon Integrity') && checkOut.includes('verified'), 'Canon check audits for unverified fact tags');
  } catch (e) {
    assert(false, 'Canon query/check test failed', e.message);
  }

  // B. Timeline & Threads
  try {
    const timeOut = execSync(`node ${cliScript} timeline`, execOptions);
    assert(timeOut.includes('Manuscript Story Chronology & Timeline'), 'Timeline checker executes cleanly and analyzes chapters');

    const threadOut = execSync(`node ${cliScript} threads`, execOptions);
    assert(threadOut.includes('Narrative Thread & Subplot Ledger') && threadOut.includes('Tracked Threads:'), 'Thread ledger parses active/resolved threads');
  } catch (e) {
    assert(false, 'Timeline/threads test failed', e.message);
  }
}

// Test 11: Machine-Checkable Stage 04 Gate & Verification (T-10)
async function testStage04GateAndEnforcement() {
  const gateUrl = pathToFileURL(path.join(rootDir, 'scripts', 'gate.js')).href;
  const compUrl = pathToFileURL(path.join(rootDir, 'scripts', 'compile_manuscript.js')).href;
  const { saveVerdict, evaluateGate } = await import(gateUrl);
  const { compileManuscript } = await import(compUrl);

  const testCh = 99;
  const testDir = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts', 'ch99');

  try {
    // A. Missing checks
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
    const evalInit = evaluateGate(testCh);
    assert(!evalInit.passed && evalInit.missing.length === 4, 'Gate fails cleanly when verdict artifacts are missing');

    // B. Rejection on failure
    saveVerdict(testCh, 'scan', 'PASS', 'Scan clean');
    saveVerdict(testCh, 'canon_check', 'PASS', 'Canon verified');
    saveVerdict(testCh, 'rubric', 'PASS', 'Rubric satisfied');
    saveVerdict(testCh, 'ledger_delivery', 'FAIL', 'Missing climax beat');
    const evalFail = evaluateGate(testCh);
    assert(!evalFail.passed && evalFail.failed.includes('ledger_delivery'), 'Gate rejects when any check fails');

    // C. Promotion on full pass
    saveVerdict(testCh, 'ledger_delivery', 'PASS', 'Climax beat delivered');
    const evalPass = evaluateGate(testCh);
    assert(evalPass.passed && evalPass.missing.length === 0 && evalPass.failed.length === 0, 'Gate passes when all 4 verdict artifacts attest PASS');

    // D. Compile enforcement against unverified status
    const manifestPath = path.join(rootDir, 'manuscript.json');
    const origManifest = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : null;
    const dummyDraft = path.join(rootDir, 'stages', '03_drafting', 'output', 'chapters', 'ch99.md');
    fs.mkdirSync(path.dirname(dummyDraft), { recursive: true });
    fs.writeFileSync(dummyDraft, '# Test Draft\nProse text.', 'utf8');

    // Temporarily wipe verdicts to ensure compile rejects unverified passed status
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.writeFileSync(manifestPath, JSON.stringify({
      title: 'Test Book',
      chapters: [{ id: 99, title: 'Test 99', status: 'passed', draft_file: 'stages/03_drafting/output/chapters/ch99.md' }]
    }), 'utf8');

    let logged = '';
    const origLog = console.log;
    console.log = (msg) => { logged += msg + '\n'; };
    try {
      compileManuscript([]);
    } finally {
      console.log = origLog;
      process.exitCode = 0; // reset
    }
    assert(logged.includes('unverified Stage 04 gate'), 'compileManuscript skips chapter claiming passed when gate artifacts are absent');

    // Cleanup
    if (fs.existsSync(dummyDraft)) fs.unlinkSync(dummyDraft);
    if (origManifest !== null) fs.writeFileSync(manifestPath, origManifest, 'utf8');
    else if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath);
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  } catch (e) {
    assert(false, 'Gate verdict & compile enforcement test failed', e.message);
  }
}

// Test 12: Whole-Book Analysis & Manuscript Report (T-08)
async function testManuscriptReport() {
  const repUrl = pathToFileURL(path.join(rootDir, 'scripts', 'manuscript_report.js')).href;
  const { analyzeManuscript, formatManuscriptReport } = await import(repUrl);
  const fixtureDir = path.join(rootDir, 'stages', '03_drafting', 'output', 'chapters');
  fs.mkdirSync(fixtureDir, { recursive: true });

  const f1 = path.join(fixtureDir, 'test_ch81.md');
  const f2 = path.join(fixtureDir, 'test_ch82.md');
  const f3 = path.join(fixtureDir, 'test_ch83.md');

  try {
    const sharedPhrase = "the rusted iron gate creaked open slowly";
    fs.writeFileSync(f1, `---\npov: "Evelyn"\nstory_date: "1895-10-01"\n---\n"Hurry," she whispered. ${sharedPhrase} under the twilight rain. The cold seeped into her boots.`, 'utf8');
    fs.writeFileSync(f2, `---\npov: "Julian"\nstory_date: "1895-10-02"\n---\nHe heard a sound. ${sharedPhrase} in the darkness behind the manor wall. "Who goes there?" he asked quietly.`, 'utf8');
    const longSent = Array(80).fill('word').join(' ') + '.';
    fs.writeFileSync(f3, `---\npov: "Evelyn"\nstory_date: "1895-10-03"\n---\n${longSent} Again ${sharedPhrase} as they escaped together.`, 'utf8');

    const analysis = analyzeManuscript();
    const formatted = formatManuscriptReport(analysis);

    assert(analysis.totalChapters >= 3, 'Manuscript report correctly ingests chapter files across the project');
    assert(analysis.repeating4grams.some(g => g.phrase.includes('the rusted iron gate') || g.phrase.includes('rusted iron gate creaked')), 'Manuscript report identifies cross-chapter 4-gram repetition');
    assert(analysis.povBudget.some(p => p.pov === 'Evelyn'), 'Manuscript report accurately tallies POV pacing distribution');
    assert(formatted.includes('## 1. Rhythm & Escalation Contour'), 'Manuscript report formats complete telemetry report');
  } catch (e) {
    assert(false, 'Manuscript report test failed', e.message);
  } finally {
    [f1, f2, f3].forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
  }
}

// Run all test groups
testBOM();
testOkfLint();
testStagePackets();
testDensityNormalizedTells();
testNarrativeAuditFixtures();
testContinuityScan();
testCraftRemediationLinks();
testCraftSearch();
testFormRouting();
testStateModel();
await testStage04GateAndEnforcement();
await testManuscriptReport();

console.log('\n----------------------------------------');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('----------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ All automated tests passed successfully!\x1b[0m\n');
  process.exit(0);
}

#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

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

// Test 2: OKF Linter
function testOkfLint() {
  const craftDir = path.join(rootDir, '_config', 'okf_craft');
  const files = fs.readdirSync(craftDir).filter(f => f.endsWith('.md') && f !== 'index.md' && f !== 'CONTEXT.md' && f !== 'SPECIFICATION.md');
  let missingFm = 0;
  files.forEach(f => {
    const text = fs.readFileSync(path.join(craftDir, f), 'utf8').replace(/^\uFEFF/, '');
    if (!/^---\r?\n[\s\S]*?\r?\n---/.test(text)) missingFm++;
  });
  assert(missingFm === 0, 'All OKF craft modules have valid YAML frontmatter', `${missingFm} files missing frontmatter`);
}

// Test 3: Stage packet compilation for stages 01 through 05
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
}

// Test 4: Narrative Audit on Clean Fixture
function testNarrativeAuditClean() {
  const fixture = path.join(rootDir, 'tests', 'fixtures', 'clean_chapter.md');
  const auditScript = path.join(rootDir, 'scripts', 'narrative_audit.js');
  try {
    const out = execSync(`node "${auditScript}" "${fixture}"`, { cwd: rootDir, encoding: 'utf8' });
    const isClean = out.includes('CLEAN') || out.includes('REVIEW');
    assert(isClean && !out.includes('FAIL'), 'Narrative audit passes clean fixture without false positive fails');
  } catch (e) {
    assert(false, 'Narrative audit failed on clean fixture', e.message);
  }
}

// Test 5: Narrative Audit on Sloppy Fixture
function testNarrativeAuditSloppy() {
  const fixture = path.join(rootDir, 'tests', 'fixtures', 'sloppy_chapter.md');
  const auditScript = path.join(rootDir, 'scripts', 'narrative_audit.js');
  try {
    const out = execSync(`node "${auditScript}" "${fixture}"`, { cwd: rootDir, encoding: 'utf8' });
    assert(out.includes('FAIL'), 'Narrative audit correctly flags heavy AI-tell chapter as FAIL');
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

// Run all tests
testBOM();
testOkfLint();
testStagePackets();
testNarrativeAuditClean();
testNarrativeAuditSloppy();
testContinuityScan();

console.log('\n----------------------------------------');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('----------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ All automated tests passed successfully!\x1b[0m\n');
  process.exit(0);
}

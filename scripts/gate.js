import * as fs from 'fs';
import * as path from 'path';

const VERDICTS_DIR = path.join('stages', '04_diagnostics_edits', 'output', 'verdicts');
const REQUIRED_CHECKS = ['scan', 'canon_check', 'rubric', 'ledger_delivery'];

export function getChapterVerdictDir(chapterNum) {
  const pad = String(chapterNum).padStart(2, '0');
  return path.join(VERDICTS_DIR, `ch${pad}`);
}

export function saveVerdict(chapterNum, check, verdict, evidence, details = {}) {
  if (!REQUIRED_CHECKS.includes(check)) {
    throw new Error(`Invalid check type: "${check}". Must be one of: ${REQUIRED_CHECKS.join(', ')}`);
  }
  const validVerdicts = ['PASS', 'FAIL', 'SKIP'];
  if (!validVerdicts.includes(verdict)) {
    throw new Error(`Invalid verdict: "${verdict}". Must be one of: ${validVerdicts.join(', ')}`);
  }

  const chDir = getChapterVerdictDir(chapterNum);
  if (!fs.existsSync(chDir)) {
    fs.mkdirSync(chDir, { recursive: true });
  }

  const payload = {
    check,
    chapter: parseInt(chapterNum, 10),
    verdict,
    evidence: typeof evidence === 'string' ? evidence : JSON.stringify(evidence),
    details,
    timestamp: new Date().toISOString()
  };

  const filePath = path.join(chDir, `${check}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

export function getVerdicts(chapterNum) {
  const chDir = getChapterVerdictDir(chapterNum);
  const results = {};

  for (const check of REQUIRED_CHECKS) {
    const file = path.join(chDir, `${check}.json`);
    if (fs.existsSync(file)) {
      try {
        results[check] = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch (e) {
        results[check] = { check, verdict: 'FAIL', evidence: `Corrupted verdict file: ${e.message}` };
      }
    } else {
      results[check] = null;
    }
  }
  return results;
}

export function evaluateGate(chapterNum) {
  const verdicts = getVerdicts(chapterNum);
  const missing = [];
  const failed = [];

  for (const check of REQUIRED_CHECKS) {
    const v = verdicts[check];
    if (!v) {
      missing.push(check);
    } else if (v.verdict !== 'PASS' && v.verdict !== 'SKIP') {
      failed.push(check);
    }
  }

  const passed = missing.length === 0 && failed.length === 0;
  return {
    chapter: parseInt(chapterNum, 10),
    passed,
    missing,
    failed,
    verdicts
  };
}

export function handleGate(chId, options = {}) {
  if (!chId) {
    console.error('Error: Please specify a chapter number (e.g. soundboard gate 1)');
    process.exitCode = 1;
    return;
  }

  const num = parseInt(chId, 10);
  const result = evaluateGate(num);

  console.log(`\n========================================`);
  console.log(`   Stage 04 Gate Evaluation: Chapter ${num}`);
  console.log(`========================================\n`);

  for (const check of REQUIRED_CHECKS) {
    const v = result.verdicts[check];
    if (!v) {
      console.log(`  \x1b[31m✗ ${check.padEnd(16)}: MISSING (No verdict artifact)\x1b[0m`);
    } else if (v.verdict === 'PASS') {
      console.log(`  \x1b[32m✔ ${check.padEnd(16)}: PASS\x1b[0m — ${v.evidence.slice(0, 70)}`);
    } else if (v.verdict === 'SKIP') {
      console.log(`  \x1b[33m- ${check.padEnd(16)}: SKIP\x1b[0m — ${v.evidence.slice(0, 70)}`);
    } else {
      console.log(`  \x1b[31m✗ ${check.padEnd(16)}: FAIL\x1b[0m — ${v.evidence.slice(0, 70)}`);
    }
  }

  const manifestPath = 'manuscript.json';
  if (!fs.existsSync(manifestPath)) {
    console.warn('\nWarning: manuscript.json not found. Gate result evaluated but manifest status unchanged.');
    return result;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    console.error(`Error reading manuscript.json: ${e.message}`);
    process.exitCode = 1;
    return result;
  }

  const chEntry = (manifest.chapters || []).find(c => c.id === num);
  if (!chEntry) {
    console.warn(`\nWarning: Chapter ${num} not found in manuscript.json`);
    return result;
  }

  if (result.passed) {
    chEntry.status = 'passed';
    chEntry.gate_passed_at = new Date().toISOString();
    chEntry.gate_verdicts = {
      scan: result.verdicts.scan?.verdict,
      canon_check: result.verdicts.canon_check?.verdict,
      rubric: result.verdicts.rubric?.verdict,
      ledger_delivery: result.verdicts.ledger_delivery?.verdict
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`\n\x1b[32m✔ Gate PASSED. Chapter ${num} status set to "passed" in manuscript.json.\x1b[0m\n`);
  } else {
    if (chEntry.status === 'passed') {
      chEntry.status = 'audited'; // Revoke passed if gate checks fail
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    }
    console.log(`\n\x1b[31m✗ Gate FAILED. Chapter ${num} cannot be passed.\x1b[0m`);
    if (result.missing.length) {
      console.log(`  Missing checks: ${result.missing.join(', ')}`);
    }
    if (result.failed.length) {
      console.log(`  Failing checks: ${result.failed.join(', ')}`);
    }
    console.log(`  Remediate the failing checks and re-run "soundboard gate ${num}".\n`);
  }

  return result;
}

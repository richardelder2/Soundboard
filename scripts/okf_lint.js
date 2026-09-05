import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const LEGAL_STAGES = new Set(['01_onboarding', '02_planning', '03_drafting', '04_diagnostics_edits', '05_publishing']);
const LEGAL_GENRES = new Set(['thriller_suspense', 'mystery_detective', 'romance_romantasy', 'horror_weird', 'scifi_dystopian', 'epic_fantasy', 'noir_crime', 'adventure_survival', 'comedy_satire', 'kishotenketsu']);
const LEGAL_SCOPES = new Set(['book', 'chapter', 'scene', 'sentence']);
const LEGAL_SUBTYPES = new Set(['genre_convention', 'plot_template', 'character_engine', 'narrative_mode', 'dialectic_pattern', 'pacing_rhythm', 'prose_style']);
const LEGAL_CONFIDENCE = new Set(['peer_reviewed', 'practitioner_method', 'workshop_heuristic']);
const LEGAL_DIAGNOSTICS = new Set(['rhythm', 'dread', 'lore_density', 'sensory_anchor', 'lexical_tells', 'dialogue_ratio', 'voice_drift', 'narrative_audit', 'continuity']);

function parseYamlArray(text, key) {
  // matches: key: [a, b, c]
  const inlineMatch = text.match(new RegExp(`^${key}:\\s*\\[(.*?)\\]`, 'm'));
  if (inlineMatch) {
    if (!inlineMatch[1].trim()) return [];
    return inlineMatch[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }
  // matches multiline yaml list:
  // key:
  //   - a
  //   - b
  const lines = text.split(/\r?\n/);
  let inKey = false;
  const items = [];
  for (const line of lines) {
    if (new RegExp(`^${key}:\\s*$`).test(line)) {
      inKey = true;
      continue;
    }
    if (inKey) {
      const m = line.match(/^\s+-\s+["']?([^"'\r\n#]+)["']?/);
      if (m) {
        items.push(m[1].trim());
      } else if (/^\S/.test(line)) {
        inKey = false;
      }
    }
  }
  return items;
}

function parseYamlScalar(text, key) {
  const m = text.match(new RegExp(`^${key}:\\s*["']?([^"'\r\n#]+)["']?`, 'm'));
  return m ? m[1].trim() : null;
}

export function runOkfLint(options = {}) {
  const strict = options.strict || process.argv.includes('--strict');
  const rootDir = options.rootDir || process.cwd();
  const craftDir = path.join(rootDir, '_config', 'okf_craft');
  const contextPath = path.join(craftDir, 'CONTEXT.md');

  console.log('\n=== OKF Knowledge Bundle Linter ===\n');

  if (!fs.existsSync(craftDir)) {
    console.error('Error: _config/okf_craft directory not found.');
    return { ok: false, errors: ['Directory _config/okf_craft missing'] };
  }

  const files = fs.readdirSync(craftDir).filter(f => f.endsWith('.md'));
  const craftModules = files.filter(f => !['index.md', 'CONTEXT.md', 'SPECIFICATION.md', 'synonyms.md'].includes(f));
  const moduleIds = new Set(craftModules.map(f => f.replace(/\.md$/, '')));

  let totalBoms = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  const errorLogs = [];
  const warnLogs = [];

  const contextContent = fs.existsSync(contextPath) ? fs.readFileSync(contextPath, 'utf8') : '';

  // 1. Check every file for BOM
  files.forEach(f => {
    const filePath = path.join(craftDir, f);
    const buf = fs.readFileSync(filePath);
    if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      totalBoms++;
      errorLogs.push(`BOM detected in ${f}`);
    }
  });

  // 2. Validate every craft module
  craftModules.forEach(f => {
    const filePath = path.join(craftDir, f);
    const modId = f.replace(/\.md$/, '');
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);

    if (!match) {
      totalErrors++;
      errorLogs.push(`${f}: Missing YAML frontmatter block.`);
      return;
    }

    const fm = match[1];
    const body = raw.slice(match[0].length);

    // Check type
    const type = parseYamlScalar(fm, 'type');
    if (!type || !['craft_primitive', 'craft_rule', 'craft_structure', 'trope_stack', 'dialectic_pattern'].includes(type)) {
      totalErrors++;
      errorLogs.push(`${f}: Invalid or missing type: "${type}"`);
    }

    // Check id
    const id = parseYamlScalar(fm, 'id');
    if (!id) {
      totalErrors++;
      errorLogs.push(`${f}: Missing "id:" in frontmatter.`);
    } else if (id !== modId) {
      totalErrors++;
      errorLogs.push(`${f}: ID "${id}" does not match filename "${modId}".`);
    }

    // Check stages
    const stages = parseYamlArray(fm, 'stages');
    if (!stages || stages.length === 0) {
      totalErrors++;
      errorLogs.push(`${f}: "stages" must declare at least one valid stage.`);
    } else {
      stages.forEach(s => {
        if (!LEGAL_STAGES.has(s)) {
          totalErrors++;
          errorLogs.push(`${f}: Illegal stage "${s}". Must be one of: ${[...LEGAL_STAGES].join(', ')}`);
        }
      });
    }

    // Check genres
    const genres = parseYamlArray(fm, 'genres');
    genres.forEach(g => {
      if (!LEGAL_GENRES.has(g)) {
        totalErrors++;
        errorLogs.push(`${f}: Illegal genre "${g}". Must be one of: ${[...LEGAL_GENRES].join(', ')}`);
      }
    });

    // Check scope
    const scope = parseYamlScalar(fm, 'scope');
    if (!scope || !LEGAL_SCOPES.has(scope)) {
      totalErrors++;
      errorLogs.push(`${f}: Illegal scope "${scope}". Must be one of: ${[...LEGAL_SCOPES].join(', ')}`);
    }

    // Check subtype
    const subtype = parseYamlScalar(fm, 'subtype');
    if (subtype && !LEGAL_SUBTYPES.has(subtype)) {
      totalErrors++;
      errorLogs.push(`${f}: Illegal subtype "${subtype}". Must be one of: ${[...LEGAL_SUBTYPES].join(', ')}`);
    }

    // Check confidence
    const confidence = parseYamlScalar(fm, 'confidence');
    if (confidence && !LEGAL_CONFIDENCE.has(confidence)) {
      totalErrors++;
      errorLogs.push(`${f}: Illegal confidence "${confidence}". Must be one of: ${[...LEGAL_CONFIDENCE].join(', ')}`);
    }

    // Check diagnostics
    const diags = parseYamlArray(fm, 'diagnostics');
    diags.forEach(d => {
      if (!LEGAL_DIAGNOSTICS.has(d)) {
        totalErrors++;
        errorLogs.push(`${f}: Illegal diagnostic "${d}". Must be one of: ${[...LEGAL_DIAGNOSTICS].join(', ')}`);
      }
    });

    // Check requires referential integrity
    const requires = parseYamlArray(fm, 'requires');
    requires.forEach(req => {
      if (!moduleIds.has(req)) {
        totalErrors++;
        errorLogs.push(`${f}: "requires" references unknown module "${req}".`);
      }
    });

    // Check conflicts_with referential integrity
    const conflicts = parseYamlArray(fm, 'conflicts_with');
    conflicts.forEach(conf => {
      if (!moduleIds.has(conf)) {
        totalErrors++;
        errorLogs.push(`${f}: "conflicts_with" references unknown module "${conf}".`);
      }
    });

    // Check keywords
    const keywords = parseYamlArray(fm, 'keywords');
    if (!keywords || keywords.length < 2) {
      totalWarnings++;
      warnLogs.push(`${f}: Sparse keywords (${keywords ? keywords.length : 0} tags; recommend 4–8).`);
    }

    // Check router coverage
    const isImplicit = parseYamlScalar(fm, 'routing') === 'implicit';
    if (!isImplicit && !contextContent.includes(f)) {
      totalErrors++;
      errorLogs.push(`${f}: Not routed in _config/okf_craft/CONTEXT.md and does not declare "routing: implicit".`);
    }

    // Check word count & token budget
    const words = (raw.match(/[\w'’-]+/g) || []).length;
    const estTokens = Math.ceil(raw.length / 4);
    if (words > 750 || estTokens > 900) {
      if (strict) {
        totalErrors++;
        errorLogs.push(`${f}: Exceeds maximum token budget (${words} words, ~${estTokens} tokens > 900 limit).`);
      } else {
        totalWarnings++;
        warnLogs.push(`${f}: Exceeds recommended target (${words} words, ~${estTokens} tokens). Consider trimming.`);
      }
    } else if (words > 450 || estTokens > 600) {
      totalWarnings++;
      warnLogs.push(`${f}: Approaching budget limit (${words} words, ~${estTokens} tokens; recommended < 600 tok).`);
    }

    // Check markdown links
    const linkMatches = [...raw.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];
    linkMatches.forEach(m => {
      const link = m[2];
      if (link.endsWith('.md') && !link.includes('/') && !link.startsWith('http')) {
        const targetPath = path.join(craftDir, link);
        if (!fs.existsSync(targetPath)) {
          totalErrors++;
          errorLogs.push(`${f}: Broken local link to "${link}".`);
        }
      }
    });
  });

  console.log(`Audited ${craftModules.length} craft modules in ${craftDir}.`);
  console.log(`Results: ${totalErrors === 0 ? '0' : totalErrors} errors, ${totalWarnings} warnings, ${totalBoms} BOMs.`);

  if (warnLogs.length > 0 && process.argv.includes('--verbose')) {
    console.log('\nWarnings:');
    warnLogs.forEach(w => console.log(`  \x1b[33m⚠ ${w}\x1b[0m`));
  }

  if (totalErrors > 0 || totalBoms > 0) {
    console.log('\nErrors:');
    errorLogs.forEach(e => console.log(`  \x1b[31m✗ ${e}\x1b[0m`));
    console.log('\n\x1b[31mFAIL: OKF lint failed.\x1b[0m\n');
    return { ok: false, errors: errorLogs, warnings: warnLogs };
  } else {
    console.log('\n\x1b[32m✔ OKF bundle conforms to specification!\x1b[0m\n');
    return { ok: true, errors: [], warnings: warnLogs };
  }
}

// Support CLI execution
if (process.argv[1] && (process.argv[1].endsWith('okf_lint.js') || process.argv[1].includes('okf_lint'))) {
  const result = runOkfLint();
  process.exit(result.ok ? 0 : 1);
}

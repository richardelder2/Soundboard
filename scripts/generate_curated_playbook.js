import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const DRAFTING_DIR = path.join(cwd, '02_Drafting');
const REVISION_DIR = path.join(cwd, '03_Revision');
const PLAYBOOK_PATH = path.join(REVISION_DIR, 'curated_grammar_playbook.md');

if (!fs.existsSync(DRAFTING_DIR)) {
  console.error(`Error: Drafting directory ${DRAFTING_DIR} does not exist.`);
  process.exit(1);
}

if (!fs.existsSync(REVISION_DIR)) {
  fs.mkdirSync(REVISION_DIR, { recursive: true });
}

const files = fs.readdirSync(DRAFTING_DIR)
  .filter(f => /^chapter_\d+\.md$/.test(f))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
    return numA - numB;
  });

const VERB_MAP = {
  dragging: 'dragged',
  running: 'ran',
  carrying: 'carried',
  whining: 'whined',
  hoping: 'hoped',
  vibrating: 'vibrated',
  screaming: 'screamed',
  surging: 'surged',
  clinging: 'clung',
  pulsing: 'pulsed',
  flashing: 'flashed',
  leaving: 'left',
  rattling: 'rattled',
  shaking: 'shook',
  floating: 'floated',
  scraping: 'scraped',
  sliding: 'slid',
  cutting: 'cut',
  sending: 'sent',
  painting: 'painted',
  focusing: 'focused',
  representing: 'represented',
  attempting: 'attempted',
  looking: 'looked',
  breathing: 'breathed',
  cooling: 'cooled',
  venting: 'vented',
  spitting: 'spat',
  chewing: 'chewed',
  squeezing: 'squeezed',
  vocalizing: 'vocalized',
  matching: 'matched',
  resisting: 'resisted',
  striking: 'struck',
  unraveling: 'unraveled'
};

// Syntactic heuristics to identify true participial clauses and exclude adjective lists
const DETERMINERS = new Set(['the', 'a', 'an', 'his', 'her', 'its', 'their', 'my', 'your', 'our', 'these', 'those', 'this', 'that']);
const PREPOSITIONS = new Set(['to', 'through', 'in', 'on', 'at', 'with', 'by', 'from', 'into', 'onto', 'for', 'over', 'under', 'above', 'below', 'behind', 'against', 'about', 'across', 'after', 'before', 'of', 'off', 'out', 'up', 'down']);
const PRONOUNS = new Set(['him', 'her', 'it', 'them', 'us', 'me', 'you', 'himself', 'herself', 'itself', 'themselves']);
const ADVERBS = new Set(['gently', 'rapidly', 'slowly', 'suddenly', 'silently', 'quietly', 'violently', 'instantly', 'tightly', 'softly', 'heavily', 'lightly']);

let playbookCount = 0;
let markdown = `# Curated Grammar Humanization Playbook\n`;
markdown += `*Generated: ${new Date().toISOString().split('T')[0]}*\n\n`;
markdown += `This playbook contains a curated selection of high-confidence grammar edits. By targeting only key occurrences, we reduce the density of AI style tells (semicolons, starting conjunctions, and participial splices) to natural human baseline levels without over-sanitizing the prose.\n\n`;

markdown += `> [Spacer/Note]\n`;
markdown += `> - **Syd's thoughts are preserved**: Em-dashes, parentheses, and bracketed system logs are left as-is to preserve his subconscious AI narration voice.\n`;
markdown += `> - **Front matter is skipped**: \`chapter_00.md\` has been omitted from this sweep.\n`;
markdown += `> - **Natural variety is kept**: We only apply edits where we can cleanly convert passive splices to active past-tense coordinate clauses, preserving some participial phrases for sentence flow.\n\n`;

files.forEach(file => {
  // Skip front matter completely
  if (file === 'chapter_00.md') return;

  const content = fs.readFileSync(path.join(DRAFTING_DIR, file), 'utf8');
  const lines = content.split('\n');
  let chPlaybook = [];
  
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const cleanLine = line.trim();
    
    if (!cleanLine || cleanLine.startsWith('#') || cleanLine.startsWith('[')) return;
    
    // 1. Semicolons (Split only when clean; avoid HTML entities using negative lookbehind)
    if (cleanLine.includes(';')) {
      const parts = cleanLine.split(/(?<!&[a-zA-Z0-9#]{2,10});/);
      if (parts.length === 2) {
        const part2 = parts[1].trim();
        const capitalizedPart2 = part2.charAt(0).toUpperCase() + part2.slice(1);
        const suggestion = `${parts[0].trim()}. ${capitalizedPart2}`;
        chPlaybook.push({
          lineNum,
          type: 'Semicolon Split',
          original: cleanLine,
          suggested: suggestion
        });
      }
    }
    
    // 2. Sentence-Initial Conjunctions (Select only "But" or "And" starting paragraphs or clear actions)
    const conjMatch = cleanLine.match(/^(But|And|Yet)\b\s+(.*)/i);
    if (conjMatch) {
      const conj = conjMatch[1];
      const remainder = conjMatch[2];
      const capitalizedRemainder = remainder.charAt(0).toUpperCase() + remainder.slice(1);
      chPlaybook.push({
        lineNum,
        type: 'Initial Conjunction Cut',
        original: cleanLine,
        suggested: capitalizedRemainder
      });
    }
    
    // 3. Participial Coordinates (Select ONLY clean dictionary matches that represent true clauses)
    const spliceMatch = cleanLine.match(/,\s+\b(\w+ing)\b(?:\s+(\w+))?/i);
    if (spliceMatch) {
      const ingVerb = spliceMatch[1];
      const nextWord = spliceMatch[2] ? spliceMatch[2].toLowerCase() : null;
      
      const pastVerb = VERB_MAP[ingVerb.toLowerCase()];
      if (pastVerb) {
        // Syntactic heuristic check
        const isClause = !nextWord || 
                         DETERMINERS.has(nextWord) || 
                         PREPOSITIONS.has(nextWord) || 
                         PRONOUNS.has(nextWord) || 
                         ADVERBS.has(nextWord);
                         
        if (isClause) {
          const target = `, ${ingVerb}`;
          const replacement = ` and ${pastVerb}`;
          const suggestion = cleanLine.replace(target, replacement);
          chPlaybook.push({
            lineNum,
            type: 'Participial Coordinate',
            original: cleanLine,
            suggested: suggestion
          });
        }
      }
    }
  });
  
  if (chPlaybook.length > 0) {
    markdown += `## [${file}](file:///./02_Drafting/${file})\n\n`;
    chPlaybook.forEach(s => {
      markdown += `### Line ${s.lineNum} — ${s.type}\n`;
      markdown += `- **Original**: \`${s.original}\`\n`;
      markdown += `- **Suggested**: \`${s.suggested}\`\n\n`;
      playbookCount++;
    });
    markdown += `\n---\n\n`;
  }
});

fs.writeFileSync(PLAYBOOK_PATH, markdown, 'utf8');
console.log(`Curated playbook generated:`);
console.log(`- Path: 03_Revision/curated_grammar_playbook.md`);
console.log(`- Total suggested edits: ${playbookCount}`);

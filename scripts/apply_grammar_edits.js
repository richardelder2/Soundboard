import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const REVISION_DIR = path.join(cwd, '03_Revision');
const DRAFTING_DIR = path.join(cwd, '02_Drafting');
const PLAYBOOK_PATH = path.join(REVISION_DIR, 'curated_grammar_playbook.md');

if (!fs.existsSync(PLAYBOOK_PATH)) {
  console.error(`Playbook not found: ${PLAYBOOK_PATH}`);
  process.exit(1);
}

const content = fs.readFileSync(PLAYBOOK_PATH, 'utf8');
const lines = content.split(/\r?\n/);

let currentFile = null;
let currentLineNum = null;
let currentOriginal = null;
let currentSuggested = null;

let edits = {};

const origPrefix = "- **Original**: `";
const sugPrefix = "- **Suggested**: `";

lines.forEach(line => {
  const fileMatch = line.match(/^##\s+\[(chapter_\d+\.md)\]/);
  if (fileMatch) {
    currentFile = fileMatch[1];
    if (!edits[currentFile]) {
      edits[currentFile] = [];
    }
  }
  
  const lineMatch = line.match(/^###\s+Line\s+(\d+)\s+—/);
  if (lineMatch) {
    currentLineNum = parseInt(lineMatch[1], 10);
  }
  
  if (line.startsWith(origPrefix) && line.endsWith("`")) {
    currentOriginal = line.substring(origPrefix.length, line.length - 1);
  } else if (line.startsWith(sugPrefix) && line.endsWith("`")) {
    currentSuggested = line.substring(sugPrefix.length, line.length - 1);
    
    if (currentFile && currentLineNum && currentOriginal !== null) {
      edits[currentFile].push({
        lineNum: currentLineNum,
        original: currentOriginal,
        suggested: currentSuggested
      });
    }
    // Reset line state
    currentLineNum = null;
    currentOriginal = null;
    currentSuggested = null;
  }
});

let totalApplied = 0;
let totalFailed = 0;

Object.keys(edits).forEach(file => {
  const filePath = path.join(DRAFTING_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  let fileContent = fs.readFileSync(filePath, 'utf8');
  let fileLines = fileContent.split(/\r?\n/);
  
  // Sort edits in descending order by line number to keep indexes safe
  const fileEdits = edits[file].sort((a, b) => b.lineNum - a.lineNum);
  
  fileEdits.forEach(edit => {
    const idx = edit.lineNum - 1;
    if (idx >= fileLines.length) {
      console.error(`Line number ${edit.lineNum} out of bounds for ${file}`);
      totalFailed++;
      return;
    }
    
    const actualLine = fileLines[idx].trim();
    const expectedLine = edit.original.trim();
    
    if (actualLine === expectedLine) {
      const leadingWhitespace = fileLines[idx].match(/^\s*/)[0];
      fileLines[idx] = leadingWhitespace + edit.suggested.trim();
      totalApplied++;
    } else {
      // Soft check for minor carriage return mismatch
      const actualClean = actualLine.replace(/\r/g, '');
      const expectedClean = expectedLine.replace(/\r/g, '');
      
      if (actualClean === expectedClean) {
        const leadingWhitespace = fileLines[idx].match(/^\s*/)[0];
        fileLines[idx] = leadingWhitespace + edit.suggested.trim();
        totalApplied++;
      } else {
        console.error(`Mismatch in ${file} line ${edit.lineNum}:`);
        console.error(`  Expected: "${expectedLine}"`);
        console.error(`  Actual:   "${actualLine}"`);
        totalFailed++;
      }
    }
  });
  
  fs.writeFileSync(filePath, fileLines.join('\n'), 'utf8');
});

console.log(`\nApply complete:`);
console.log(`- Successfully applied: ${totalApplied} edits`);
console.log(`- Failed/Mismatched: ${totalFailed} edits`);

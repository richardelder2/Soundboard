import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

function stripBOM(str) {
  return str.replace(/^\uFEFF/, '');
}

function checkPandoc() {
  try {
    const res = spawnSync('pandoc', ['-v'], { encoding: 'utf8', stdio: 'pipe' });
    return res.status === 0;
  } catch (_) {
    return false;
  }
}

export function importManuscript(sourcePath, options = {}) {
  if (!sourcePath) {
    console.error('Error: Please specify a file to import (e.g. soundboard import manuscript.md)');
    process.exitCode = 1;
    return { success: false, error: 'No source file specified' };
  }

  const resolvedSource = path.resolve(process.cwd(), sourcePath);
  if (!fs.existsSync(resolvedSource)) {
    console.error(`Error: Source file not found: ${resolvedSource}`);
    process.exitCode = 1;
    return { success: false, error: 'File not found' };
  }

  const ext = path.extname(resolvedSource).toLowerCase();
  let markdownText = '';

  if (ext === '.docx') {
    if (!checkPandoc()) {
      const errMsg = 'Importing .docx files requires pandoc. Please install pandoc or save your document as Markdown (.md) before importing.';
      console.error(`\x1b[31mError: ${errMsg}\x1b[0m`);
      process.exitCode = 1;
      return { success: false, error: errMsg };
    }

    const tempMd = path.join(path.dirname(resolvedSource), `__temp_import_${Date.now()}.md`);
    try {
      const res = spawnSync('pandoc', [resolvedSource, '-t', 'markdown', '-o', tempMd], { encoding: 'utf8' });
      if (res.status !== 0 || !fs.existsSync(tempMd)) {
        throw new Error(res.stderr || 'Pandoc failed to convert .docx');
      }
      markdownText = fs.readFileSync(tempMd, 'utf8');
    } finally {
      if (fs.existsSync(tempMd)) fs.unlinkSync(tempMd);
    }
  } else if (['.md', '.markdown', '.txt'].includes(ext)) {
    markdownText = fs.readFileSync(resolvedSource, 'utf8');
  } else {
    const errMsg = `Unsupported file format: ${ext}. Please provide a .md, .txt, or .docx file.`;
    console.error(`\x1b[31mError: ${errMsg}\x1b[0m`);
    process.exitCode = 1;
    return { success: false, error: errMsg };
  }

  markdownText = stripBOM(markdownText);

  // Parse and split chapters
  const lines = markdownText.split(/\r?\n/);
  const rawChapters = [];
  let currentTitle = '';
  let currentLines = [];
  let chapterIndex = 0;

  function pushCurrent() {
    if (currentLines.length > 0) {
      const body = currentLines.join('\n').trim();
      if (body.length > 0) {
        chapterIndex++;
        rawChapters.push({
          num: chapterIndex,
          title: currentTitle || `Chapter ${chapterIndex}`,
          content: body
        });
      }
    }
    currentLines = [];
  }

  const chapterHeadingRegex = /^(?:#{1,3})\s+(?:chapter\s+(\d+|[ivxlcdm]+|\w+)[:.]?|(prologue|epilogue)|(\d+)[.:]\s+)(.*)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(chapterHeadingRegex);
    if (match) {
      pushCurrent();
      currentTitle = line.replace(/^#{1,3}\s+/, '').trim();
    } else {
      currentLines.push(line);
    }
  }
  pushCurrent();

  // If no chapter headings were found, treat entire content as single chapter
  if (rawChapters.length === 0 && markdownText.trim().length > 0) {
    const baseName = path.basename(resolvedSource, ext).replace(/[_-]+/g, ' ');
    rawChapters.push({
      num: 1,
      title: baseName,
      content: markdownText.trim()
    });
  }

  if (rawChapters.length === 0) {
    console.error('Error: Source file was empty. Nothing imported.');
    process.exitCode = 1;
    return { success: false, error: 'Empty file' };
  }

  // Write chapters into stages/03_drafting/output/chapters/
  const chaptersDir = path.join('stages', '03_drafting', 'output', 'chapters');
  fs.mkdirSync(chaptersDir, { recursive: true });

  const importedList = [];
  for (const ch of rawChapters) {
    const pad = String(ch.num).padStart(2, '0');
    const chFilename = `ch${pad}.md`;
    const targetFile = path.join(chaptersDir, chFilename);

    let finalContent = ch.content;
    const hasFrontmatter = /^---\r?\n[\s\S]*?\r?\n---/.test(finalContent);

    if (!hasFrontmatter) {
      const fm = [
        '---',
        `chapter: ${ch.num}`,
        `title: "${ch.title.replace(/"/g, '\\"')}"`,
        'status: "imported"',
        `imported_from: "${path.basename(resolvedSource)}"`,
        `imported_at: "${new Date().toISOString()}"`,
        '---',
        ''
      ].join('\n');
      finalContent = fm + finalContent;
    }

    fs.writeFileSync(targetFile, finalContent, 'utf8');
    const wordCount = (finalContent.match(/[\w'’-]+/g) || []).length;
    importedList.push({
      id: ch.num,
      title: ch.title,
      draft_file: path.join('stages', '03_drafting', 'output', 'chapters', chFilename).replace(/\\/g, '/'),
      status: 'imported',
      words: wordCount
    });
  }

  // Register in manuscript.json
  const manifestPath = 'manuscript.json';
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (_) {
      manifest = {};
    }
  }

  if (!manifest.title) {
    manifest.title = path.basename(resolvedSource, ext).replace(/[_-]+/g, ' ');
  }
  if (!manifest.schema_version) {
    manifest.schema_version = '2.0.0';
  }

  manifest.chapters = importedList.map(c => ({
    id: c.id,
    title: c.title,
    draft_file: c.draft_file,
    status: 'imported',
    words: c.words,
    last_audit: null
  }));

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`\n\x1b[32m✔ Successfully imported ${importedList.length} chapter(s) from "${path.basename(resolvedSource)}"\x1b[0m`);
  console.log(`  Destination: ${chaptersDir}/`);
  console.log(`  Registered in manuscript.json with status: "imported"\n`);

  return {
    success: true,
    chaptersCount: importedList.length,
    chapters: importedList
  };
}

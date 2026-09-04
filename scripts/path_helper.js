import * as fs from 'fs';
import * as path from 'path';

/**
 * Shared path & directory resolver for Soundboard diagnostics and wizards.
 * Prioritizes ICM stage outputs while maintaining backward compatibility with legacy layouts.
 */

export function getDraftingDir(cwd = process.cwd()) {
  const candidates = [
    path.join(cwd, 'stages', '03_drafting', 'output', 'chapters'),
    path.join(cwd, 'stages', '03_drafting', 'output'),
    path.join(cwd, '02_Drafting'),
    path.join(cwd, 'drafts'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(cwd, 'stages', '03_drafting', 'output');
}

export function getReviewDir(cwd = process.cwd()) {
  const candidates = [
    path.join(cwd, 'stages', '04_diagnostics_edits', 'output', 'reports'),
    path.join(cwd, 'stages', '04_diagnostics_edits', 'output'),
    path.join(cwd, '04_Review'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const target = path.join(cwd, 'stages', '04_diagnostics_edits', 'output', 'reports');
  fs.mkdirSync(target, { recursive: true });
  return target;
}

export function getCharactersDir(cwd = process.cwd()) {
  const candidates = [
    path.join(cwd, 'stages', '01_onboarding', 'output', 'characters'),
    path.join(cwd, '00_Story_Bible', 'characters'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(cwd, 'stages', '01_onboarding', 'output', 'characters');
}

export function getStoryBibleDir(cwd = process.cwd()) {
  const candidates = [
    path.join(cwd, 'stages', '01_onboarding', 'output'),
    path.join(cwd, '00_Story_Bible'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(cwd, 'stages', '01_onboarding', 'output');
}

export function getPlanningDir(cwd = process.cwd()) {
  const candidates = [
    path.join(cwd, 'stages', '02_planning', 'output'),
    path.join(cwd, '01_Planning'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(cwd, 'stages', '02_planning', 'output');
}

export function getBeatsDir(cwd = process.cwd()) {
  const candidates = [
    path.join(cwd, 'stages', '02_planning', 'output', 'beats'),
    path.join(cwd, 'stages', '02_planning', 'output'),
    path.join(cwd, '01_Planning', 'beats'),
    path.join(cwd, '01_Planning'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(cwd, 'stages', '02_planning', 'output', 'beats');
}

export function getChapterFiles(customPath) {
  if (customPath) {
    const resolved = path.isAbsolute(customPath) ? customPath : path.resolve(process.cwd(), customPath);
    if (fs.existsSync(resolved)) {
      if (fs.statSync(resolved).isFile()) {
        return [resolved];
      }
      return getChapterFilesFromDir(resolved);
    }
  }
  return getChapterFilesFromDir(getDraftingDir());
}

function getChapterFilesFromDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir);
  return entries
    .filter(f => /^(chapter_?\d+|ch_?\d+)\.md$/i.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
      const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
      return numA - numB;
    })
    .map(f => path.join(dir, f));
}

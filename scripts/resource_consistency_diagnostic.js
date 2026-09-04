#!/usr/bin/env node

/**
 * Resource Depletion & Inventory Consistency Auditor (SAGA 3.0)
 * Zero dependencies, pure ESM Node.js script.
 * 
 * Scans chapters for numerical inventory tracking (e.g. oxygen hours, credits, battery %, ammo)
 * and generates a timeline report in 04_Review/ to check for narrative consistency.
 */

import * as fs from 'fs';
import * as path from 'path';

import { getReviewDir, getChapterFiles } from './path_helper.js';

const customTarget = process.argv[2];
const files = getChapterFiles(customTarget);
const REVIEW_DIR = getReviewDir();
const OUTPUT_REPORT = path.join(REVIEW_DIR, 'resource_report.md');

if (files.length === 0) {
  console.log('No drafting chapters found. Provide a chapter path or run from a novel workspace.');
  process.exit(0);
}

console.log(`Analyzing resource consistency across ${files.length} chapter(s)...`);

const RESOURCE_PATTERNS = [
  { name: 'Battery', regex: /(\d+)\s*%\s*(?:battery|charge|power|capacitors)/i },
  { name: 'Oxygen', regex: /(\d+)\s*(hours|h|minutes|mins)\b\s*(?:of\s*)?(?:oxygen|air|life-support|reserve)/i },
  { name: 'Credits', regex: /(\d+[\d,]*\b)\s*(?:credits|credits|tokens|credits)/i },
  { name: 'Ammunition', regex: /(\d+)\s*(?:rounds|bullets|shots|magazines)/i }
];

const timeline = [];

files.forEach(file => {
  const filePath = file;
  const fileName = path.basename(file);
  const content = fs.readFileSync(filePath, 'utf8');
  const cleanContent = content.replace(/^---[\s\S]*?---/, '');
  const lines = cleanContent.split('\n');
  const chNum = parseInt(fileName.match(/\d+/)?.[0] || '0', 10);

  lines.forEach((line, idx) => {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith('#') || cleanLine.startsWith('[')) return;

    RESOURCE_PATTERNS.forEach(res => {
      const match = cleanLine.match(res.regex);
      if (match) {
        const value = match[1].replace(/,/g, '');
        const unit = match[2] ? match[2].toLowerCase() : null;
        const displayValue = value + (unit ? ' ' + unit : '');
        let normalizedValue = parseInt(value, 10);
        
        // Normalize Oxygen to minutes
        if (res.name === 'Oxygen' && unit) {
          if (unit.startsWith('h')) {
            normalizedValue = normalizedValue * 60;
          }
        }

        timeline.push({
          chapter: chNum,
          file,
          lineNum: idx + 1,
          resource: res.name,
          value: normalizedValue,
          displayValue: displayValue,
          rawText: cleanLine.length > 120 ? cleanLine.slice(0, 120) + '...' : cleanLine
        });
      }
    });
  });
});

// Generate Markdown Report
let mdReport = `# Resource Consistency Audit Report

*Generated on: ${new Date().toISOString().split('T')[0]}*

This report extracts and tracks numerical counts associated with consumable items (credits, battery %, oxygen reserves, ammo) across chapters to verify continuity.

---

## 📈 Resource Mentions Timeline

| Chapter | Line | Resource | Recorded Value | Context |
| :--- | :---: | :---: | :---: | :--- |
`;

timeline.sort((a, b) => {
  if (a.chapter !== b.chapter) return a.chapter - b.chapter;
  return a.lineNum - b.lineNum;
}).forEach(item => {
  mdReport += `| [${item.file}](file:///./02_Drafting/${item.file}#L${item.lineNum}) | Line ${item.lineNum} | **${item.resource}** | ${item.displayValue || item.value} | *"${item.rawText}"* |\n`;
});

mdReport += `
---

## 🔍 Consistency Audits

### 🔋 Battery Drain Checks
Verify that battery levels decrease over chronological order unless a recharge scene is explicitly shown.
`;

let batteryWarnings = 0;
let lastBattery = null;
let lastBatteryCh = null;
let lastBatteryLine = null;

timeline.filter(t => t.resource === 'Battery').forEach(item => {
  const currentVal = item.value;
  if (lastBattery !== null) {
    if (currentVal > lastBattery) {
      mdReport += `- **⚠️ Warning (Possible power increase)**: Battery jumps from **${lastBattery}%** (Ch ${lastBatteryCh}, Line ${lastBatteryLine}) up to **${currentVal}%** (Ch ${item.chapter}, Line ${item.lineNum}) without registered recharge events.\n`;
      batteryWarnings++;
    }
  }
  lastBattery = currentVal;
  lastBatteryCh = item.chapter;
  lastBatteryLine = item.lineNum;
});

if (batteryWarnings === 0) {
  mdReport += `*No battery anomalies detected. Levels decline chronologically.*`;
}

mdReport += `

### 💨 Air & Oxygen Reserves
Verify that air hours decrease logically during consecutive chapters of escape or lockdown.
`;

let airWarnings = 0;
let lastAir = null;
let lastAirCh = null;
let lastAirLine = null;
let lastAirDisplay = null;

timeline.filter(t => t.resource === 'Oxygen').forEach(item => {
  const currentVal = item.value;
  if (lastAir !== null) {
    if (currentVal > lastAir) {
      mdReport += `- **⚠️ Warning (Possible air increase)**: Oxygen reserves jump from **${lastAirDisplay}** (Ch ${lastAirCh}, Line ${lastAirLine}) up to **${item.displayValue}** (Ch ${item.chapter}, Line ${item.lineNum}).\n`;
      airWarnings++;
    }
  }
  lastAir = currentVal;
  lastAirCh = item.chapter;
  lastAirLine = item.lineNum;
  lastAirDisplay = item.displayValue;
});

if (airWarnings === 0) {
  mdReport += `*No oxygen anomalies detected.*`;
}

fs.writeFileSync(OUTPUT_REPORT, mdReport, 'utf8');

console.log(`Resource consistency audit complete:`);
console.log(`- Markdown report written to: 04_Review/resource_report.md`);

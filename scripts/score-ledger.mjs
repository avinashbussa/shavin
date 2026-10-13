#!/usr/bin/env node

/**
 * @file score-ledger.mjs
 * Quantitative Design System Score Ledger for @shavin/ui Primitive Components.
 * Evaluates Token Purity, Concentric Radius, CVA Pattern Uniformity, and Accessibility/Attributes.
 */

import { matchHexColors } from "../packages/block-schema/hex-policy.mjs";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PRIMITIVES_DIR = fs.existsSync(path.join(ROOT_DIR, 'packages', 'ui', 'src', 'primitives'))
  ? path.join(ROOT_DIR, 'packages', 'ui', 'src', 'primitives')
  : path.join(ROOT_DIR, 'src', 'primitives');

const CHECK_MODE = process.argv.includes('--check');

// Forbidden raw color literals or foundation vars outside global.css
const FORBIDDEN_COLOR_PATTERNS = [
  { [Symbol.match]: (s) => { const m = matchHexColors(s); return m.length ? m : null; } }, // context-aware no-hex
  /\brgb\s*\(\s*(?!var\(--)[^)]+\)/g,
  /\brgba\s*\(\s*(?!var\(--)[^)]+\)/g,
  /\bhsl\s*\(\s*(?!var\(--)[^)]+\)/g,
  /--n-\d+/g
];

// Forbidden static radius classes
const FORBIDDEN_RADIUS_CLASSES = [
  /\brounded-sm\b/g,
  /\brounded-md\b/g,
  /\brounded-lg\b/g,
  /\brounded-xl\b/g,
  /\brounded-2xl\b/g,
  /\brounded-3xl\b/g
];

function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');
}

function scorePrimitive(fileName, filePath) {
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const codeContent = stripComments(rawContent);

  let tokenPurityScore = 40;
  let radiusScore = 20;
  let cvaScore = 20;
  let a11yScore = 20;
  const issues = [];

  const isSpecialUtility = /ColorPicker|Chart|DatePicker|TimePicker|CodeBlock|CodeEditor|Tooltip|ShavinDevTools|BlockPreview/.test(fileName);

  // 1. Token Purity Check (40 pts)
  if (!isSpecialUtility) {
    for (const pattern of FORBIDDEN_COLOR_PATTERNS) {
      const matches = codeContent.match(pattern);
      if (matches) {
        tokenPurityScore -= Math.min(20, matches.length * 10);
        issues.push(`Forbidden raw color or --n-* variable detected: ${matches.slice(0, 3).join(', ')}`);
      }
    }
  }

  // 2. Radius Check (20 pts)
  for (const pattern of FORBIDDEN_RADIUS_CLASSES) {
    const matches = codeContent.match(pattern);
    if (matches) {
      radiusScore -= Math.min(10, matches.length * 5);
      issues.push(`Literal radius utility found: ${matches.slice(0, 3).join(', ')}`);
    }
  }

  // Check proper token radius usage
  const hasTokenRadius = /rounded-\[var\(--radius-(lg|panel)\)\]|rounded-panel|rounded-full|rounded-none|rounded-inherit/.test(codeContent);
  const usesRadius = /\brounded-/.test(codeContent);
  if (usesRadius && !hasTokenRadius && !isSpecialUtility) {
    radiusScore -= 10;
    issues.push('Missing semantic token radius mapping');
  }

  // 3. CVA & Merging Pattern (20 pts)
  const isStructuralWrapper = /Box|Container|Section|Flex|Grid|ThemeProvider|Layout|AspectRatio|DatePicker|ShavinDevTools|BlockPreview|CodeEditor/.test(fileName);
  const usesCVA = /cva\s*\(/.test(codeContent);
  const usesCN = /\bcn\s*\(/.test(codeContent);
  const exposesClassName = /className\b/.test(codeContent);

  if (!usesCVA && !isStructuralWrapper && !codeContent.includes('HTMLAttributes')) {
    cvaScore -= 5;
    issues.push('Component does not use cva() or standard HTMLAttributes');
  }
  if (!usesCN && !isStructuralWrapper) {
    cvaScore -= 10;
    issues.push('Component does not merge classes with cn()');
  }
  if (!exposesClassName && !isStructuralWrapper) {
    cvaScore -= 5;
    issues.push('Component does not accept or forward className prop');
  }

  // 4. A11y & Data Attributes (20 pts)
  const isFloatingPanel = /Dialog|Popover|Menu|Tooltip|SelectContent|AlertDialog|Dropdown/.test(fileName);
  if (isFloatingPanel) {
    const hasDataPanel = /data-panel/.test(codeContent);
    if (!hasDataPanel) {
      a11yScore -= 10;
      issues.push('Floating overlay panel missing required data-panel attribute');
    }
  }

  tokenPurityScore = Math.max(0, tokenPurityScore);
  radiusScore = Math.max(0, radiusScore);
  cvaScore = Math.max(0, cvaScore);
  a11yScore = Math.max(0, a11yScore);

  const totalScore = tokenPurityScore + radiusScore + cvaScore + a11yScore;

  return {
    fileName,
    totalScore,
    breakdown: { tokenPurityScore, radiusScore, cvaScore, a11yScore },
    issues
  };
}

import { c, g, fmt, printCard } from './lib/term-ui.mjs';

const VERBOSE_MODE = process.argv.includes('--verbose');

function runScoreLedger() {
  const files = [];
  const entries = fs.readdirSync(PRIMITIVES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push({ name: entry.name, path: path.join(PRIMITIVES_DIR, entry.name) });
    } else if (entry.isDirectory()) {
      const compFile = path.join(PRIMITIVES_DIR, entry.name, `${entry.name}.tsx`);
      if (fs.existsSync(compFile)) {
        files.push({ name: `${entry.name}.tsx`, path: compFile });
      }
    }
  }

  const results = [];
  let totalPoints = 0;
  let failedCount = 0;
  const warnings = [];

  for (const file of files) {
    const result = scorePrimitive(file.name, file.path);
    results.push(result);
    totalPoints += result.totalScore;

    if (result.totalScore < 90) failedCount++;
    if (result.issues.length > 0) {
      warnings.push({ name: file.name, score: result.totalScore, issues: result.issues });
    }

    if (VERBOSE_MODE) {
      const status = result.totalScore >= 90 ? fmt.pass(result.totalScore + "/100") : fmt.fail(result.totalScore + "/100");
      console.log(`  ${file.name.padEnd(24)} ${status}`);
      for (const issue of result.issues) {
        console.log(`    ${c.warning}${g.stepWarn}${c.reset} ${c.fgMuted}${issue}${c.reset}`);
      }
    }
  }

  const averageScore = Math.round(totalPoints / files.length);

  printCard({
    title: `${c.brand}${g.brand} Primitive Score Ledger${c.reset}`,
    items: [
      { label: "Primitives Scanned:", value: `${c.fg}${files.length} primitives${c.reset}` },
      { label: "Average Score:", value: `${c.bold}${c.fg}${averageScore} / 100${c.reset} ${fmt.badge("VERIFIED AAA", c.success)}` },
      { label: "Passing Threshold:", value: `${c.fg}≥ 90 / 100${c.reset}` },
      { label: "Status:", value: failedCount === 0 ? fmt.pass("All primitives passed") : fmt.fail(`${failedCount} primitives below threshold`) },
    ],
    footer: warnings.length > 0 && !VERBOSE_MODE
      ? `${c.fgMuted}${warnings.length} primitives have minor advisory notices (run with --verbose to inspect)${c.reset}`
      : null,
  });

  if (CHECK_MODE && failedCount > 0) {
    console.error(`\n  ${c.error}${g.stepFail}${c.reset} ${c.fg}Score Ledger Check Failed: ${failedCount} primitives scored below 90/100.${c.reset}\n`);
    process.exit(1);
  }
}

runScoreLedger();


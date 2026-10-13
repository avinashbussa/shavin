/**
 * Tool: audit_source — Source-level architecture linter for @shavin/ui.
 *
 * Scans .tsx/.jsx source files for architectural compliance with the Shavin
 * design system. Unlike the live DOM audit (runtime CSS) and validate_code
 * (token regex), this tool inspects source-code patterns:
 *
 *   1. Raw HTML elements where a Shavin primitive exists
 *      (<div> → <Box>, <p> → <Text>, <a> → <Link>, etc.)
 *   2. Deep imports from @shavin/ui/primitives/* instead of root @shavin/ui
 *   3. Missing cva() in components that define variant-like patterns
 *   4. Missing cn() for className merging in components with variant props
 *   5. Raw <button> instead of <Button> primitive
 *   6. Raw <section> instead of <Section> primitive
 *
 * ALL findings are reported as WARNINGS (never errors), because users may
 * intentionally mix frameworks (e.g. plain HTML in a Next.js page that also
 * uses Shavin primitives, or third-party components that produce raw elements).
 *
 * The tool accepts a target directory and walks it recursively, skipping
 * node_modules, .next, dist, build, and test/fixture files.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative, extname } from "node:path";
import { findViewportShellPatterns } from "./responsive-lint.mjs";

// ── Primitive mapping: raw HTML element → recommended Shavin primitive ──────

const ELEMENT_TO_PRIMITIVE = {
  div: { primitive: "Box", reason: "Generic container — use <Box> for token-safe structural blocks" },
  section: { primitive: "Section", reason: "Page section — use <Section> for semantic layout sections" },
  p: { primitive: "Text", reason: "Paragraph text — use <Text> for themed typography" },
  span: { primitive: "Text", reason: "Inline text — use <Text as=\"span\"> or <Em>/<Strong> for styled inline text" },
  a: { primitive: "Link", reason: "Hyperlink — use <Link> for token-styled navigation links" },
  button: { primitive: "Button", reason: "Interactive button — use <Button> for accessible styled buttons" },
  // These are lower priority — many are fine as raw HTML in specific contexts
  ul: { primitive: "List", reason: "Unordered list — consider <List> + <ListItem> for themed lists" },
  ol: { primitive: "List", reason: "Ordered list — consider <List> + <ListItem> for themed lists" },
  // h1-h6 → Heading (but only warn for h2-h6; h1 is often fine)
  h1: { primitive: "Heading", reason: "Heading — use <Heading> for themed heading typography" },
  h2: { primitive: "Heading", reason: "Heading — use <Heading> for themed heading typography" },
  h3: { primitive: "Heading", reason: "Heading — use <Heading> for themed heading typography" },
  h4: { primitive: "Heading", reason: "Heading — use <Heading> for themed heading typography" },
};

// Elements that are commonly fine as raw HTML — don't warn
const SKIP_ELEMENTS = new Set([
  "html", "head", "body", "meta", "link", "script", "style", "title",
  "img",  // <Image> from Shavin is different from next/image — context dependent
  "br", "hr", "wbr",
  "table", "thead", "tbody", "tr", "th", "td", // Table primitives exist but are often fine raw
  "form", "label", "fieldset", "legend",
  "input", "textarea", "select", "option", "optgroup",
  "nav", "main", "header", "footer", "aside", "article",
  "figure", "figcaption", "picture", "source", "video", "audio", "canvas", "svg",
  "code", "pre", "blockquote", "kbd", "mark", "small", "sub", "sup", "time",
  "details", "summary", "dialog",
  "iframe", "embed", "object", "param",
  "col", "colgroup", "caption",
  "area", "map",
]);

// ── Directories to skip during traversal ─────────────────────────────────────

const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", "dist", "build", ".turbo", "out",
  ".cache", "coverage", ".storybook", "__pycache__",
  ".svelte-kit", ".vercel", ".out",
]);

// ── File patterns to skip ─────────────────────────────────────────────────────

const SKIP_FILE_PATTERNS = [
  /\.test\./, /\.spec\./, /\.stories\./, /\.fixture\./,
  /\/test\//, /\/tests\//, /\/__tests__\//, /\/fixtures\//,
  /\/mocks\//, /\/__mocks__\//,
];

// Files that are data registries / config, not UI components — skip missing-cva check
const DATA_FILE_PATTERNS = [
  /registry/i, /blockSchema/i, /block-registry/i,
  /\.config\./, /\.d\.ts$/, /types\./i,
];

// ── Scanning helpers ──────────────────────────────────────────────────────────

function walkDir(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkDir(join(dir, entry.name), files);
    } else if (entry.isFile()) {
      const ext = extname(entry.name);
      if (ext === ".tsx" || ext === ".jsx" || ext === ".ts" || ext === ".js") {
        const fullPath = join(dir, entry.name);
        if (SKIP_FILE_PATTERNS.some((p) => p.test(fullPath))) continue;
        files.push(fullPath);
      }
    }
  }
  return files;
}

// Extract raw JSX element tags from source text.
// Matches <div, <span, <p, <section, <button, <a, <h1..h6, <ul, <ol
// Self-closing and namespaced tags are handled.
// Strips string literals (quoted/template) to avoid false positives from
// HTML strings like defaults: { html: "<p>Raw markup</p>" }.
function findRawElements(source) {
  const findings = [];
  // Strip string literals so HTML inside quotes/template strings isn't counted as JSX
  // Replace double-quoted, single-quoted, and template-literal contents with empty strings
  let cleanSource = source
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')   // double-quoted strings
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")   // single-quoted strings
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");   // template literal strings
  // Match opening JSX tags: <tagname followed by space, >, /, or newline
  // Exclude closing tags </tag> and fragments <>
  const tagRegex = /<([a-z][a-z0-9]*)\b/g;
  let match;
  const counts = {};
  while ((match = tagRegex.exec(cleanSource)) !== null) {
    const tag = match[1];
    if (SKIP_ELEMENTS.has(tag)) continue;
    if (ELEMENT_TO_PRIMITIVE[tag]) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  for (const [tag, count] of Object.entries(counts)) {
    findings.push({ tag, count, ...ELEMENT_TO_PRIMITIVE[tag] });
  }
  return findings;
}

// Detect deep imports from @shavin/ui/primitives/*
function findDeepImports(source) {
  const findings = [];
  // Match: from "@shavin/ui/primitives/..." or from "@shavin/ui/lib/..."
  const deepImportRegex = /from\s+["']@shavin\/ui\/(primitives|lib|styles)\/[^"']+["']/g;
  let match;
  while ((match = deepImportRegex.exec(source)) !== null) {
    findings.push(match[0]);
  }
  return findings;
}

// Detect cva usage
function hasCvaUsage(source) {
  return /\bcva\s*\(/.test(source) || /class-variance-authority/.test(source);
}

// Detect cn usage
function hasCnUsage(source) {
  return /\bcn\s*\(/.test(source);
}

// Detect if file looks like a component with variant-like patterns
// (has className prop with conditional logic, size/variant props, etc.)
function detectVariantPattern(source) {
  const signals = [];
  // Has size/variant/tone props
  if (/\b(size|variant|tone|color|radius)\s*[?:]/.test(source)) signals.push("variant-props");
  // Has conditional className (ternary with className or template literal with className)
  if (/className\s*[?]/.test(source) || /className\s*=\s*`/.test(source)) signals.push("conditional-className");
  // Has multiple style branches
  if (/if\s*\(.*size|switch\s*\(.*size|case\s+["']/.test(source)) signals.push("style-switch");
  return signals;
}

// Detect if file imports from @shavin/ui at all
function usesShavinUI(source) {
  return /@shavin\/ui/.test(source);
}

// ── Main scan function ────────────────────────────────────────────────────────

function scanFile(filePath, rootDir) {
  const issues = [];
  let source;
  try {
    source = readFileSync(filePath, "utf8");
  } catch {
    return issues;
  }

  const relPath = relative(rootDir, filePath);
  const isShavinConsumer = usesShavinUI(source);

  // 1. Raw HTML elements (only warn if the file already uses @shavin/ui —
  //    otherwise it might be a non-Shavin file)
  if (isShavinConsumer) {
    const rawElements = findRawElements(source);
    for (const finding of rawElements) {
      issues.push({
        type: "raw-element",
        severity: "warning",
        file: relPath,
        element: finding.tag,
        count: finding.count,
        primitive: finding.primitive,
        message: `${finding.count}× raw <${finding.tag}> — ${finding.reason}`,
      });
    }
  }

  // 2. Deep imports (always warn — this is a hard rule in AGENTS.md)
  const deepImports = findDeepImports(source);
  for (const imp of deepImports) {
    issues.push({
      type: "deep-import",
      severity: "warning",
      file: relPath,
      message: `Deep import: ${imp} — use root import "from \"@shavin/ui\"" instead`,
    });
  }

  // 2b. Sparkles icon (AP-13): never use unless the user asks
  if (/name=["']sparkles?["']|icon=["']sparkles?["']|\bSparkles?\b[^a-zA-Z]|\u2728/.test(source)) {
    issues.push({
      type: "sparkles-icon",
      severity: "warning",
      file: relPath,
      message: "Sparkles icon/emoji used — AP-13: never use unless the user asked. Omit it, pick a domain icon, or use <Murmur> for AI activity.",
    });
  }

  // 2c. Hand-written viewport shells (AppFrame / SidebarTrigger / frame classes replace them)
  if (isShavinConsumer) {
    for (const w of findViewportShellPatterns(source)) {
      issues.push({ type: "responsive-shell", severity: "warning", file: relPath, line: w.line, message: `L${w.line}: ${w.message}` });
    }
  }

  // 3. Missing cva() in variant-pattern files (skip data/registry/config files)
  const isDataFile = DATA_FILE_PATTERNS.some((p) => p.test(filePath));
  if (isShavinConsumer && !isDataFile && !hasCvaUsage(source)) {
    const variantSignals = detectVariantPattern(source);
    if (variantSignals.length >= 2) {
      issues.push({
        type: "missing-cva",
        severity: "warning",
        file: relPath,
        signals: variantSignals,
        message: `Component has variant-like patterns (${variantSignals.join(", ")}) but no cva() — consider using class-variance-authority for type-safe variants`,
      });
    }
  }

  // 4. Missing cn() when className is conditionally merged
  if (isShavinConsumer && !hasCnUsage(source)) {
    // Check for className concatenation patterns without cn()
    if (/className\s*=\s*\{.*\+.*\}/.test(source) || /className\s*=\s*`.*\$\{/.test(source)) {
      issues.push({
        type: "missing-cn",
        severity: "warning",
        file: relPath,
        message: "className is built with string concatenation/template literals without cn() — use cn() for safe class merging",
      });
    }
  }

  return issues;
}

export function scanDirectory(targetDir) {
  const files = walkDir(targetDir);
  const allIssues = [];
  const fileStats = {};

  for (const file of files) {
    const issues = scanFile(file, targetDir);
    if (issues.length > 0) {
      allIssues.push(...issues);
      fileStats[file] = issues.length;
    }
  }

  // Aggregate summary
  const summary = {
    filesScanned: files.length,
    filesWithIssues: Object.keys(fileStats).length,
    totalWarnings: allIssues.length,
    byType: {},
    byFile: {},
  };

  for (const issue of allIssues) {
    summary.byType[issue.type] = (summary.byType[issue.type] || 0) + 1;
    summary.byFile[issue.file] = (summary.byFile[issue.file] || 0) + 1;
  }

  // Top offending files
  const topFiles = Object.entries(summary.byFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([file, count]) => ({ file, warnings: count }));

  return { issues: allIssues, summary, topFiles };
}

// ── Report formatters ─────────────────────────────────────────────────────────

function formatDense(result) {
  const { summary, topFiles, issues } = result;
  if (summary.totalWarnings === 0) {
    return `PASS: 0 warnings. ${summary.filesScanned} files scanned. Source architecture is clean.`;
  }

  const lines = [
    `WARN (${summary.totalWarnings} warnings across ${summary.filesWithIssues}/${summary.filesScanned} files):`,
    `  raw-element: ${summary.byType["raw-element"] || 0} | deep-import: ${summary.byType["deep-import"] || 0} | missing-cva: ${summary.byType["missing-cva"] || 0} | missing-cn: ${summary.byType["missing-cn"] || 0}`,
    "",
    "Top files by warning count:",
    ...topFiles.map((f) => `  ${f.warnings}× ${f.file}`),
    "",
    "Sample warnings (first 15):",
    ...issues.slice(0, 15).map((i) => {
      if (i.type === "raw-element") return `  [${i.file}] ${i.count}× <${i.element}> → <${i.primitive}>`;
      return `  [${i.file}] ${i.message}`;
    }),
  ];
  if (issues.length > 15) lines.push(`  ... and ${issues.length - 15} more`);
  return lines.join("\n");
}

function formatFull(result) {
  const { summary, topFiles, issues } = result;
  if (summary.totalWarnings === 0) {
    return [
      "## ✅ Source Architecture is Clean!",
      "",
      `Scanned **${summary.filesScanned}** source files. Zero architectural warnings found.`,
      "",
      "- No raw HTML elements where Shavin primitives exist",
      "- No deep imports from @shavin/ui/primitives/*",
      "- All variant-pattern components use cva()",
      "- All className merging uses cn()",
    ].join("\n");
  }

  const lines = [
    `## ⚠️ Source Architecture Warnings (${summary.totalWarnings})`,
    "",
    `Scanned **${summary.filesScanned}** files — **${summary.filesWithIssues}** have warnings.`,
    "",
    "### Warning Breakdown",
    "",
    "| Type | Count | What it means |",
    "|---|---|---|",
    `| Raw HTML elements | ${summary.byType["raw-element"] || 0} | Using <div>/<p>/<span> etc. instead of <Box>/<Text>/<Link> |`,
    `| Deep imports | ${summary.byType["deep-import"] || 0} | Importing from @shavin/ui/primitives/* instead of @shavin/ui |`,
    `| Missing cva() | ${summary.byType["missing-cva"] || 0} | Component has variant patterns but doesn't use class-variance-authority |`,
    `| Missing cn() | ${summary.byType["missing-cn"] || 0} | className built with string concat instead of cn() |`,
    "",
    "### Top Files by Warning Count",
    "",
    "| Warnings | File |",
    "|---|---|",
    ...topFiles.map((f) => `| ${f.warnings} | \`${f.file}\` |`),
    "",
    "### All Warnings (grouped by file)",
    "",
  ];

  // Group issues by file
  const byFile = {};
  for (const issue of issues) {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  }

  for (const [file, fileIssues] of Object.entries(byFile).sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`#### \`${file}\` (${fileIssues.length} warnings)`);
    lines.push("");
    for (const i of fileIssues) {
      if (i.type === "raw-element") {
        lines.push(`- ⚠️ **${i.count}× raw \`<${i.element}>\`** → consider \`<${i.primitive}>\` — ${i.reason || i.message}`);
      } else if (i.type === "deep-import") {
        lines.push(`- ⚠️ **Deep import**: \`${i.message}\``);
      } else if (i.type === "missing-cva") {
        lines.push(`- ⚠️ **Missing cva()**: ${i.message}`);
      } else if (i.type === "missing-cn") {
        lines.push(`- ⚠️ **Missing cn()**: ${i.message}`);
      } else {
        lines.push(`- ⚠️ ${i.message}`);
      }
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("> **Note:** All findings are warnings, not errors. Projects may intentionally mix frameworks or use raw HTML in specific contexts. Use your judgment to decide which to fix.");
  return lines.join("\n");
}

// ── Tool registration ─────────────────────────────────────────────────────────

export function registerArchLintTool(server) {
  return {
    schema: {
      name: "audit_source",
      description:
        "Call on a project folder after writing code. Scans .tsx/.jsx for architecture issues the live audit can't see: raw HTML where a Shavin primitive exists, deep @shavin/ui imports, variant components without cva(), className merging without cn(). Pair with check_page({ targetDir }).",
      inputSchema: {
        type: "object",
        properties: {
          targetDir: {
            type: "string",
            description: "Target project/app directory to scan (e.g. 'apps/website' or 'apps/docs'). Defaults to process.cwd().",
          },
          density: {
            type: "string",
            enum: ["dense", "full"],
            description: "Output format: 'dense' (compact summary, default) or 'full' (detailed markdown report grouped by file).",
          },
        },
      },
    },
    handler: async (args) => {
      const targetDir = args?.targetDir ? resolve(args.targetDir) : process.cwd();
      const density = args?.density || "dense";

      try {
        const stat = statSync(targetDir);
        if (!stat.isDirectory()) {
          return {
            content: [{ type: "text", text: `Error: ${targetDir} is not a directory.` }],
            isError: true,
          };
        }
      } catch {
        return {
          content: [{ type: "text", text: `Error: Directory not found: ${targetDir}` }],
          isError: true,
        };
      }

      const result = scanDirectory(targetDir);
      const text = density === "full" ? formatFull(result) : formatDense(result);

      return { content: [{ type: "text", text }] };
    },
  };
}

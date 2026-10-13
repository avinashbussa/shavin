#!/usr/bin/env node
/**
 * Token-discipline lint (P0.2). Enforces, mechanically, the rules AGENTS.md
 * only ever stated as convention:
 *
 *   1. no-hex      — no raw hex color literals in components/pages
 *   2. no-rgb      — no rgb()/rgba() literal (numeric) colors; use rgb(var(--token)) instead
 *   3. no-foundation — no `--n-*` foundation token outside src/styles/global.css
 *   4. no-literal-radius — no literal rounded-{sm,md,lg,xl,2xl,3xl}; use rounded-[var(--radius-*)]
 *      (rounded-full and rounded-[...] arbitrary values are allowed)
 *
 * Scope: .ts / .tsx under the package and app source dirs listed in `targets`.
 *
 * Escape hatch for the documented, legitimate exceptions (Tooltip forced
 * tones, native <input type=color>, the colors-page raw-alpha demo):
 *   // ds-lint-disable-next-line <rule> — <reason>
 *   <code>                                        // ds-lint-disable-line <rule> — <reason>
 *
 * Exits non-zero on any un-disabled violation. Wire into CI + a `lint`
 * npm script so a raw hex turns the build red instead of shipping silently.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { stripComments, walk } from "./lib/scan.mjs";
import { hasHexViolation } from "../packages/block-schema/hex-policy.mjs";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

// Files where a given rule does NOT apply because the file is the source of
// truth for that concept (not a violation site).
const FILE_EXEMPT = {
  // theme-presets.ts maps semantic vars to the --n-* scale (theme definition
  // data); ShavinDevTools.tsx's audit rule only MENTIONS --n-* in comments.
  "no-foundation": [
    join("packages", "ui", "src", "lib", "theme-presets.ts"),
    join("packages", "ui", "src", "primitives", "ShavinDevTools", "ShavinDevTools.tsx"),
  ],
  // theme-presets.ts IS the accent/gray palette definition — hex belongs here,
  // same way global.css owns the --n-* foundation scale.
  // media-overlays.tsx IS the overlay preset table definition — intentional
  // black/white-alpha scrims over background imagery (theme-independent by
  // design), plus the runtime user-hex conversion and user-color fallbacks.
  // Same source-of-truth status. Rendered overlays carry data-overlay="true"
  // and are exempted by the live DOM audit (mirrors data-swatch).
  // StudioColorPicker.tsx is a color-picking tool surface: its swatch grids
  // ARE palette data (the 24 Radix accents, the theme's semantic colors per
  // mode, the fixed hue-spectrum rainbow). Hex is the domain, not styling.
  "no-hex": [
    // ShavinMdStipple: SVG brand artwork; gradient stops are fixed white masks.
    join("apps", "website", "src", "components", "ShavinMdStipple.tsx"),
    join("packages", "ui", "src", "lib", "theme-presets.ts"),
    join("packages", "ui", "src", "lib", "media-overlays.tsx"),
    join("apps", "studio", "src", "components", "StudioColorPicker.tsx"),
    join("apps", "docs", "src", "app", "foundations", "colors", "page.tsx"),
    join("apps", "docs", "src", "app", "foundations", "theming", "page.tsx"),
    join("apps", "docs", "src", "app", "get-started", "styling-libraries", "page.tsx"),
    // BgMediaDocs.tsx documents the bgOverlays shorthand syntax with hex/gradient
    // examples in <code> blocks — DATA (syntax reference), not styling.
    join("apps", "docs", "src", "components", "BgMediaDocs.tsx"),
    // Layout primitive doc pages show bgOverlays shorthand examples with hex
    // colors and gradients in DocExample code strings and intro <code> blocks
    // — DATA (syntax reference), not styling.
    join("apps", "docs", "src", "app", "components", "flex", "page.tsx"),
    join("apps", "docs", "src", "app", "components", "section", "page.tsx"),
    join("apps", "docs", "src", "app", "components", "grid", "page.tsx"),
    join("apps", "docs", "src", "app", "components", "box", "page.tsx"),
    join("apps", "docs", "src", "app", "components", "container", "page.tsx"),
    join("apps", "docs", "src", "app", "components", "card", "page.tsx"),
    // ColorPicker.tsx: color-picking UI primitive with HSL/RGB hue spectrums & swatch palettes
    join("packages", "ui", "src", "primitives", "ColorPicker", "ColorPicker.tsx"),
    // FxPlayground.tsx & FX showcase pages: creative shader parameter controls with hex uniform presets
    join("apps", "docs", "src", "components", "FxPlayground.tsx"),
    join("apps", "docs", "src", "app", "fx", "fluid-silk", "page.tsx"),
    join("apps", "docs", "src", "app", "fx", "hyperspeed", "page.tsx"),
    join("apps", "docs", "src", "app", "fx", "mesh-gradient", "page.tsx"),
  ],
  "no-rgb": [
    join("packages", "ui", "src", "lib", "theme-presets.ts"),
    join("src", "lib", "theme-presets.ts"),
    join("packages", "ui", "src", "lib", "media-overlays.tsx"),
    join("packages", "ui", "src", "lib", "media-overlay-presets.ts"),
  ],
  "no-literal-radius": [
    join("apps", "website", "src", "components", "CodeCompactnessComparison.tsx"),
  ],
};

const RULES = [
  {
    name: "no-hex",
    // Context-aware (packages/block-schema/hex-policy.mjs): flags hex only in
    // colour contexts (className arbitrary values, style, colour keys/attrs,
    // standalone colour strings) — "Order #1543" / "#142" ids pass.
    test: (line) => hasHexViolation(line),
    msg: "raw hex color literal — use a semantic token (e.g. text-fg, bg-surface, border-hairline)",
    // A literal hex is legitimate when it's DATA passed to the theming API —
    // that's the supported way to set a custom brand color (ThemeProvider's
    // `accentColor` accepts a "#rrggbb"). Blocking it would make the theming
    // API hostile to its own purpose. Ad-hoc styling (className / style={{}})
    // does NOT match these and stays blocked.
    allowLineIncludes: [
      /accentColor\s*:\s*["']#[0-9a-fA-F]+["']/,
      /grayColor\s*:\s*["']#[0-9a-fA-F]+["']/,
      /type=["']color["']/,
      /\brawAlpha\b/,
      // Overlay data defaults (black scrims) and the user-hex conversion
      // fallback — DATA for the bg-media feature, not styling.
      /\bcolor:\s*"#(?:000000|ffffff)"/,
      /fallbackHex\s*\|\|\s*"#000000"/,
      // bgOverlays/bgImage/bgVideo prop values — these accept hex colors
      // and URLs as DATA for the bg-media feature. Users intentionally
      // try different color shades to enhance background media.
      /\bbgOverlays\s*=\s*["'`].*#[0-9a-fA-F]/,
      /\bbgImage\s*=\s*["'`].*#[0-9a-fA-F]/,
      /\bbgVideo\s*=\s*["'`].*#[0-9a-fA-F]/,
    ],
  },
  {
    name: "no-rgb",
    // rgb(/rgba( immediately followed by a number → a literal color.
    // rgb(var(--token)) is fine and won't match.
    re: /\brgba?\s*\(\s*\d+[\s,]/,
    msg: "numeric rgb()/rgba() color literal — use rgb(var(--token)) or a semantic class",
    allowLineIncludes: [
      // bgOverlays prop values may contain rgba() in JSON fallback format.
      /\bbgOverlays\s*=\s*["'`].*rgba?\s*\(/,
    ],
  },
  {
    name: "no-foundation",
    re: /--n-\d/,
    msg: "foundation token (--n-*) referenced outside global.css — use a semantic token",
    // Scoped theme remaps (a demo panel mirroring the .dark token mapping so
    // a preview re-themes independently) ARE a theme definition surface.
    allowLineIncludes: [
      /data-scope-theme/,
    ],
  },
  {
    name: "no-literal-radius",
    re: /\brounded-(?:sm|md|lg|xl|2xl|3xl)\b/,
    msg: "literal radius — use rounded-[var(--radius-lg|xl|panel)] by role (rounded-full is allowed)",
  },
];

// Every kit under kits/<name>/src (private, sold separately).
function kitSourceDirs() {
  const dir = join(ROOT, "kits");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => join(dir, d.name, "src"));
}

const targets = [
  join(ROOT, "packages", "ui", "src"),
  join(ROOT, "packages", "block-schema", "src"),
  join(ROOT, "packages", "block-schema", "blocks"),
  join(ROOT, "packages", "blocks-pro", "blocks"),
  join(ROOT, "packages", "blocks-pro", "src"),
  join(ROOT, "packages", "block-renderer", "src"),
  join(ROOT, "apps", "docs", "src"),
  join(ROOT, "apps", "website", "src"),
  join(ROOT, "apps", "studio", "src"),
  join(ROOT, "apps", "community", "src"),
  join(ROOT, "apps", "kits", "src"),
  join(ROOT, "playground", "src"),
  ...kitSourceDirs(),
  join(ROOT, "src"),
].filter(existsSync);
const files = targets.flatMap((d) => walk(d));

const violations = [];
for (const file of files) {
  const rel = relative(ROOT, file);
  const raw = readFileSync(file, "utf8").split("\n"); // for disable directives (live in comments)
  const lines = stripComments(raw.join("\n")).split("\n"); // for matching (comments blanked)
  for (const rule of RULES) {
    const exempt = (FILE_EXEMPT[rule.name] || []).some((ex) => rel === ex || rel.startsWith(ex + "/"));
    if (exempt) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!(rule.test ? rule.test(line) : rule.re.test(line))) continue;
      // legitimate theming-API data (e.g. accentColor="#..."), not styling?
      if ((rule.allowLineIncludes || []).some((rx) => rx.test(line))) continue;
      // disable on the same line?
      if (new RegExp(`ds-lint-disable-line\\s+${rule.name}\\b`).test(raw[i] || "")) continue;
      // disable on the previous line?
      if (new RegExp(`ds-lint-disable-next-line\\s+${rule.name}\\b`).test(raw[i - 1] || "")) continue;
      violations.push({ rel, ln: i + 1, rule: rule.name, msg: rule.msg, snippet: (raw[i] || line).trim().slice(0, 90) });
    }
  }
}

import { c, g, fmt } from './lib/term-ui.mjs';

if (violations.length === 0) {
  console.log(`  ${c.success}${g.stepDone}${c.reset} ${c.fg}token-lint:${c.reset} ${c.fgSubtle}${files.length} files clean (zero raw token violations)${c.reset}`);
  process.exit(0);
}

console.error(`\n  ${c.error}${g.stepFail}${c.reset} ${c.bold}${c.error}token-lint:${c.reset} ${violations.length} violation(s) found:\n`);
for (const v of violations) {
  console.error(`    ${c.brand}${v.rel}:${v.ln}${c.reset}  ${c.fgMuted}[${v.rule}]${c.reset}  ${v.msg}`);
  console.error(`      ${c.fgSubtle}${v.snippet}${c.reset}`);
}
console.error(
  `\n  ${c.fgMuted}Fix, or if legitimately intentional add:\n    // ds-lint-disable-next-line <rule> — <reason>${c.reset}\n`,
);
process.exit(1);

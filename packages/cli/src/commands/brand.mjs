/**
 * @shavin/cli — `brand` command
 *
 *   npx shavin brand           (re)generate derived tokens + Tailwind preset
 *   npx shavin brand --check   exit non-zero if stale (CI)
 *   npx shavin brand --init    scaffold brand-tokens.css into the project
 *
 * Zero-dependency ESM. Uses the shared brand-tokens engine from lib/.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  parseBrandTokens,
  computeBrandTokens,
  computeBrandTokensOklch,
  rebuildCSS,
  rebuildCSOklch,
  generateTailwindPreset,
  generateThemeV4CSS,
  generateThemeV4CSSOklch,
  DEFAULT_BRAND_TOKENS_CSS,
} from "../lib/brand-tokens.mjs";
import { detectTailwindVersion } from "../lib/detect-tailwind.mjs";

// ── Path detection ──────────────────────────────────────────────────────

function findBrandCSS(cwd) {
  const candidates = [
    // Consumer: alongside global CSS (Next.js app router)
    "src/app/brand-tokens.css",
    // Consumer: alongside global CSS (Next.js pages router / common)
    "src/styles/brand-tokens.css",
    "styles/brand-tokens.css",
    // Consumer: Vite / React
    "src/brand-tokens.css",
    // Root / flat
    "brand-tokens.css",
    // Monorepo source
    "packages/ui/src/styles/brand-tokens.css",
  ];

  for (const rel of candidates) {
    const full = join(cwd, rel);
    if (existsSync(full)) {
      // Preset goes alongside the CSS file
      return {
        cssPath: full,
        presetPath: join(dirname(full), "brand-preset.mjs"),
      };
    }
  }
  return null;
}

// ── Scaffolding ─────────────────────────────────────────────────────────

/** Scaffolds brand-tokens.css at the given path and generates the initial preset/theme. */
function scaffoldBrandTokens(cssPath, isTailwindV4, oklch = false) {
  // Ensure directory exists
  const dir = dirname(cssPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  // Write the default template
  writeFileSync(cssPath, DEFAULT_BRAND_TOKENS_CSS, "utf-8");

  // Generate initial output
  const cssText = readFileSync(cssPath, "utf-8");
  const { declarations } = parseBrandTokens(cssText);
  const tokens = oklch
    ? computeBrandTokensOklch(declarations)
    : computeBrandTokens(declarations);
  const newCSS = oklch
    ? rebuildCSOklch(cssText, tokens)
    : rebuildCSS(cssText, tokens);

  if (isTailwindV4) {
    // v4: generate @theme inline CSS
    const themeFileName = oklch ? "brand-theme-v4-oklch.css" : "brand-theme-v4.css";
    const themePath = join(dir, themeFileName);
    const newTheme = oklch
      ? generateThemeV4CSSOklch(tokens.colorNames, tokens.aliasNames)
      : generateThemeV4CSS(tokens.colorNames, tokens.aliasNames);
    writeFileSync(cssPath, newCSS, "utf-8");
    writeFileSync(themePath, newTheme, "utf-8");
    return { cssPath, presetPath: themePath, hexCount: tokens.colorNames.length, aliasCount: tokens.aliasNames.length };
  } else {
    // v3: generate JS preset
    const presetPath = join(dir, "brand-preset.mjs");
    const newPreset = generateTailwindPreset(tokens.colorNames, tokens.aliasNames);
    writeFileSync(cssPath, newCSS, "utf-8");
    writeFileSync(presetPath, newPreset, "utf-8");
    return { cssPath, presetPath, hexCount: tokens.colorNames.length, aliasCount: tokens.aliasNames.length };
  }
}

// ── Main command ────────────────────────────────────────────────────────

export async function brandCommand(args = []) {
  const cwd = process.cwd();
  const checkMode = args.includes("--check");
  const initMode = args.includes("--init");
  const useOklchFlag = args.includes("--oklch");

  // ── Scaffolding mode ──
  if (initMode) {
    const twInfo = detectTailwindVersion(cwd);
    const isTailwindV4 = twInfo.version === 4;
    const existing = findBrandCSS(cwd);
    if (existing) {
      console.log(`  ✓ brand-tokens.css already exists at ${existing.cssPath}`);
      console.log(`    Run \`npx shavin brand\` to regenerate derived tokens.`);
      return;
    }

    // Default scaffold location: src/styles/ (most common for Next.js/Vite)
    // Fallback: project root
    let scaffoldDir = join(cwd, "src", "styles");
    if (!existsSync(join(cwd, "src"))) {
      scaffoldDir = join(cwd, "styles");
    }
    if (!existsSync(join(cwd, "styles"))) {
      scaffoldDir = cwd; // root
    }

    const cssPath = join(scaffoldDir, "brand-tokens.css");
    const result = scaffoldBrandTokens(cssPath, isTailwindV4, useOklch);

    console.log(`  ✓ Created ${result.cssPath.replace(cwd + "/", "")}`);
    console.log(`  ✓ Created ${result.presetPath.replace(cwd + "/", "")}`);
    console.log(`    Edit the INPUT section to add brand colors, then run \`npm run brand:gen\``);
    return;
  }

  // ── Generate / Check mode ──
  const paths = findBrandCSS(cwd);
  if (!paths) {
    if (checkMode) {
      console.error("  ✗ brand-tokens.css not found. Run `npx shavin brand --init` to scaffold it.");
      process.exit(1);
    }
    console.error("  ✗ brand-tokens.css not found. Run `npx shavin brand --init` to scaffold it.");
    process.exit(1);
  }

  const { cssPath, presetPath } = paths;

  // Colour space: explicit --oklch, or auto-detected so a plain `brand` run
  // (e.g. the predev hook) never rewrites an OKLCH project's tokens as RGB.
  const cssTextForDetect = existsSync(cssPath) ? readFileSync(cssPath, "utf-8") : "";
  const useOklch = useOklchFlag
    || existsSync(join(dirname(cssPath), "brand-theme-v4-oklch.css"))
    || /:\s*oklch\(/.test(cssTextForDetect);

  // Detect Tailwind version for correct output format
  const twInfo = detectTailwindVersion(cwd);
  const isTailwindV4 = twInfo.version === 4;
  const themeV4Name = useOklch ? "brand-theme-v4-oklch.css" : "brand-theme-v4.css";
  const outputPath = isTailwindV4
    ? join(dirname(cssPath), themeV4Name)
    : presetPath;

  if (!existsSync(cssPath)) {
    if (checkMode) {
      console.error("  ✗ brand-tokens.css not found at:", cssPath);
      process.exit(1);
    }
    console.error("  ✗ brand-tokens.css not found. Run `npx shavin brand --init` to scaffold it.");
    process.exit(1);
  }

  const cssText = readFileSync(cssPath, "utf-8");
  const { declarations } = parseBrandTokens(cssText);
  const tokens = useOklch
    ? computeBrandTokensOklch(declarations)
    : computeBrandTokens(declarations);

  // Generate outputs
  const newCSS = useOklch
    ? rebuildCSOklch(cssText, tokens)
    : rebuildCSS(cssText, tokens);
  const newOutput = isTailwindV4
    ? (useOklch
      ? generateThemeV4CSSOklch(tokens.colorNames, tokens.aliasNames)
      : generateThemeV4CSS(tokens.colorNames, tokens.aliasNames))
    : generateTailwindPreset(tokens.colorNames, tokens.aliasNames);

  if (checkMode) {
    const existingCSS = readFileSync(cssPath, "utf-8");
    const outputExists = existsSync(outputPath);
    const existingOutput = outputExists ? readFileSync(outputPath, "utf-8") : "";

    if (newCSS === existingCSS && newOutput === existingOutput) {
      console.log("  ✓ brand-tokens: up to date");
      process.exit(0);
    } else {
      console.error("  ✗ brand-tokens: stale — run `npm run brand:gen` to regenerate");
      if (newCSS !== existingCSS) console.error("    ↳ brand-tokens.css needs update");
      if (newOutput !== existingOutput) console.error(`    ↳ ${isTailwindV4 ? themeV4Name : "brand-preset.mjs"} needs update`);
      process.exit(1);
    }
  }

  // Write files
  writeFileSync(cssPath, newCSS, "utf-8");
  writeFileSync(outputPath, newOutput, "utf-8");

  const hexCount = tokens.colorNames.length;
  const aliasCount = tokens.aliasNames.length;
  const totalTwColors = aliasCount + hexCount * 7;
  console.log(`  ✓ brand-tokens: ${hexCount} color${hexCount !== 1 ? "s" : ""}` +
    (aliasCount ? `, ${aliasCount} alias${aliasCount !== 1 ? "es" : ""}` : "") +
    ` → ${cssPath.replace(cwd + "/", "")}`);
  console.log(`  ✓ ${isTailwindV4 ? themeV4Name.replace(/\.css$/, "") : "brand-preset"}: ${totalTwColors} Tailwind utilit${totalTwColors !== 1 ? "ies" : "y"} → ${outputPath.replace(cwd + "/", "")}`);
}

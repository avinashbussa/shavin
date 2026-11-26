import { existsSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { relPosix } from "../lib/paths.mjs";
import { resolve, join, basename, dirname } from "node:path";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

import { DEFAULT_BRAND_TOKENS_CSS, parseBrandTokens, computeBrandTokens, computeBrandTokensOklch, rebuildCSS, rebuildCSOklch, generateTailwindPreset, generateThemeV4CSS, generateThemeV4CSSOklch } from "../lib/brand-tokens.mjs";
import { detectTailwindVersion, relativeAgentsPath, relativeShavinUiPath, detectFramework } from "../lib/detect-tailwind.mjs";
import { c, fmt, g, printBanner, printCard, startSpinner } from "../ui.mjs";
import { SHADCN_BRIDGE_CSS, SHADCN_BRIDGE_FILE } from "../lib/shadcn-bridge.mjs";
import {
  GLOBAL_CSS_CANDIDATES,
  addCssImports,
  addTailwindPreset,
  detectOtherUi,
  mergeClaudeHook,
  findGlobalCss,
  isEsmTailwindConfig,
  addBrandPresetRef,
  nextTsConfigImportBreaksDev,
  hasShavinThemeProvider,
  isShadcnProject,
  usesNextThemes,
  wrapRenderCall,
  addToastProvider,
  hasToastProvider,
  checkFrameworkSupport,
} from "../lib/init-detect.mjs";
import { detectPackageManager } from "../lib/package-manager.mjs";

async function askYesNo(question, defaultValue = true) {
  // Non-interactive (CI, piped stdin) — return default without prompting
  if (!process.stdin.isTTY) return defaultValue;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const hint = defaultValue ? "Y/n" : "y/N";
  return new Promise((resolve) => {
    rl.question(`${question} [${hint}] `, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === "") return resolve(defaultValue);
      return resolve(trimmed === "y" || trimmed === "yes");
    });
  });
}

const CLAUDE_BLOCK_START = "<!-- @shavin:claude -->";
const CLAUDE_BLOCK_END = "<!-- @shavin:claude-end -->";
const CLAUDE_BLOCK_START_RE = /<!-- @shavin:claude -->/;

// ── Patch a root layout file to wrap its JSX return in <ThemeProvider> ──
function patchLayoutWithThemeProvider(src, oklch = false) {
  // Already has Shavin's ThemeProvider — skip
  if (hasShavinThemeProvider(src)) {
    return { patched: false, reason: "already-wired" };
  }

  const providerTag = oklch
    ? '<ThemeProvider colorSpace="oklch">'
    : '<ThemeProvider>';

  // 1. Add import after the last existing import
  const importLine = `import { ThemeProvider } from "@shavin/ui";`;
  const importRegex = /^import\s.+$/gm;
  const imports = [...src.matchAll(importRegex)];
  if (imports.length > 0) {
    const last = imports[imports.length - 1];
    src = src.slice(0, last.index + last[0].length) +
          "\n" + importLine +
          src.slice(last.index + last[0].length);
  } else {
    src = importLine + "\n" + src;
  }

  // 2a. Root layouts (<html><body>…</body></html>): the provider goes INSIDE <body>,
  // like Shavin's own apps. Wrapping <html> would render the theme script and dev
  // tools outside the document root, which Next.js rejects at hydration.
  const bodyOpen = src.match(/<body\b[^>]*>/);
  const bodyCloseIdx = src.lastIndexOf("</body>");
  if (bodyOpen && bodyCloseIdx > bodyOpen.index) {
    const openEnd = bodyOpen.index + bodyOpen[0].length;
    const inner = src.slice(openEnd, bodyCloseIdx);
    const indent = (src.slice(0, bodyOpen.index).match(/[ \t]*$/) || [""])[0];
    const innerTrim = inner.trim();
    src = src.slice(0, openEnd) +
          `\n${indent}  ${providerTag}\n${indent}    ${innerTrim}\n${indent}  </ThemeProvider>\n${indent}` +
          src.slice(bodyCloseIdx);
    // The theme script sets the .dark class on <html> before hydration.
    src = src.replace(/<html\b(?![^>]*suppressHydrationWarning)/, "<html suppressHydrationWarning");
    return { patched: true, src };
  }

  // 2b. App entry (Vite, plain React): wrap the JSX handed to createRoot(…).render(…).
  const rendered = wrapRenderCall(src, providerTag);
  if (rendered) return { patched: true, src: rendered };

  // 2c. Other components: wrap the return JSX
  // Pattern 1: return ( ... );  — parenthesized return
  const parenReturn = src.match(/return\s*\(/);
  if (parenReturn) {
    const returnStart = parenReturn.index;
    const afterParen = returnStart + parenReturn[0].length;
    let depth = 1;
    let i = afterParen;
    for (; i < src.length; i++) {
      if (src[i] === "(") depth++;
      else if (src[i] === ")") { depth--; if (depth === 0) break; }
    }
    if (depth === 0 && i < src.length) {
      const closeIdx = i;
      const semiIdx = src[closeIdx + 1] === ";" ? closeIdx + 1 : closeIdx;
      const inner = src.slice(afterParen, closeIdx).trim();
      src = src.slice(0, returnStart) +
            `return (\n        ${providerTag}\n          ` +
            inner +
            `\n        </ThemeProvider>\n      )` +
            (semiIdx > closeIdx ? ";" : "") +
            src.slice(semiIdx + 1);
      return { patched: true, src };
    }
  }

  // Pattern 2: return <Foo ... />;  — bare self-closing
  const bareSelfClosing = src.match(/return\s+(<[\w.]+[^>]*\/>)\s*;?/);
  if (bareSelfClosing) {
    src = src.replace(
      /return\s+(<[\w.]+[^>]*\/>)\s*;?/,
      `return (\n        ${providerTag}\n          $1\n        </ThemeProvider>\n      );`
    );
    return { patched: true, src };
  }

  // Pattern 3: return <Foo> ... </Foo>;  — bare element with close tag
  const bareElement = src.match(/return\s+(<[\w.]+[^>]*>)/);
  if (bareElement) {
    const compName = bareElement[1].match(/<([\w.]+)/)[1];
    const closeTag = `</${compName}>`;
    const lastClose = src.lastIndexOf(closeTag);
    if (lastClose !== -1) {
      const closeEnd = lastClose + closeTag.length;
      const semiIdx = src[closeEnd] === ";" ? closeEnd : closeEnd - 1;
      const before = src.slice(0, bareElement.index);
      const jsx = src.slice(bareElement.index + "return ".length, closeEnd);
      const after = src.slice(semiIdx + 1);
      src = before +
            `return (\n        ${providerTag}\n          ` +
            jsx +
            `\n        </ThemeProvider>\n      );` +
            after;
      return { patched: true, src };
    }
  }

  return { patched: false, reason: "no-jsx-return-detected" };
}

/** Insert an import after the last top-level import, else at the very top. */
function insertImport(src, importLine) {
  const lines = src.split("\n");
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s.+from\s.+;?\s*$/.test(lines[i])) last = i;
  }
  if (last >= 0) {
    lines.splice(last + 1, 0, importLine);
    return lines.join("\n");
  }
  return `${importLine}\n${src}`;
}

/**
 * Wire the Agent-Browser bridge to auto-start with the dev server by editing the
 * framework config. Idempotent, conservative (falls back to a printed snippet
 * rather than risk breaking a config it does not recognise), and never throws.
 * @returns {{ status: "created"|"wired"|"already"|"manual", file?: string, snippet?: string }}
 */
function wireBridgeAutoStart(cwd, framework) {
  try {
    if (framework === "nextjs") return wireNextBridge(cwd);
    if (framework === "vite") return wireViteBridge(cwd);
  } catch {
    /* fall through to manual */
  }
  return { status: "manual" };
}

export function wireNextBridge(cwd, nodeVersion = process.versions.node) {
  const esm = ["next.config.mjs", "next.config.ts"];
  const cjs = ["next.config.js", "next.config.cjs"];
  const existing = [...esm, ...cjs].map((f) => join(cwd, f)).find((p) => existsSync(p));
  const importLine = `import { withShavinBridge } from "@shavin/mcp/next";`;

  if (!existing) {
    const dest = join(cwd, "next.config.mjs");
    writeFileSync(dest, `${importLine}\n\n/** @type {import('next').NextConfig} */\nconst nextConfig = {};\n\nexport default withShavinBridge(nextConfig);\n`, "utf8");
    return { status: "created", file: "next.config.mjs" };
  }

  const file = basename(existing);
  let src = readFileSync(existing, "utf8");
  if (src.includes("withShavinBridge")) return { status: "already", file };

  if (nextTsConfigImportBreaksDev(file, nodeVersion)) {
    return {
      status: "manual", file,
      note: `Node ${nodeVersion}: Next 15 dev returns 500 on every request when ${file} imports anything on Node 22.12 and 22.13, so init left ${file} alone. Use Node 22.14 or newer, then add the import by hand; until then run the bridge with: npx @shavin/cli bridge`,
      snippet: `import { withShavinBridge } from "@shavin/mcp/next";\n// then wrap your exported config:\nexport default withShavinBridge(yourNextConfig);`,
    };
  }

  const isEsm = file.endsWith(".mjs") || file.endsWith(".ts") || /export\s+default/.test(src);
  // Only auto-wrap the common `export default <identifier>;` shape; anything else
  // (inline object, defineConfig(...), module.exports, function config) → manual.
  const m = isEsm ? src.match(/export default (\w+);/) : null;
  if (isEsm && m) {
    src = insertImport(src, importLine).replace(`export default ${m[1]};`, `export default withShavinBridge(${m[1]});`);
    writeFileSync(existing, src, "utf8");
    return { status: "wired", file };
  }
  return { status: "manual", file, snippet: `import { withShavinBridge } from "@shavin/mcp/next";\n// then wrap your exported config:\nexport default withShavinBridge(yourNextConfig);` };
}

function wireViteBridge(cwd) {
  const existing = ["vite.config.ts", "vite.config.mjs", "vite.config.js", "vite.config.cjs"].map((f) => join(cwd, f)).find((p) => existsSync(p));
  const importLine = `import { shavinBridge } from "@shavin/mcp/vite";`;
  if (!existing) return { status: "manual", snippet: `import { shavinBridge } from "@shavin/mcp/vite";\n// add to your Vite config:\nplugins: [shavinBridge(), /* ... */]` };

  const file = basename(existing);
  let src = readFileSync(existing, "utf8");
  if (src.includes("shavinBridge")) return { status: "already", file };

  const isEsm = file.endsWith(".mjs") || file.endsWith(".ts") || /export\s+default/.test(src);
  if (isEsm && /plugins:\s*\[/.test(src)) {
    src = insertImport(src, importLine).replace(/plugins:\s*\[/, "plugins: [shavinBridge(), ");
    writeFileSync(existing, src, "utf8");
    return { status: "wired", file };
  }
  return { status: "manual", file, snippet: `import { shavinBridge } from "@shavin/mcp/vite";\n// add to your Vite config:\nplugins: [shavinBridge(), /* ... */]` };
}

export async function initCommand(args = {}) {
  const { oklch = false } = args;
  const cwd = process.cwd();
  printBanner("@shavin/cli", "Set up Shavin in this project");

  let modifiedCount = 0;

  // Framework gate: Next.js and Vite (with React) are supported today. Check before anything is installed or
  // written, so an unsupported project is left exactly as it was.
  const fwInfo = detectFramework(cwd);
  const support = checkFrameworkSupport(cwd, fwInfo);
  if (!support.ok) {
    const [head, ...rest] = support.lines;
    console.error(fmt.error(head));
    for (const line of rest) console.error(line ? `  ${line}` : "");
    console.error("");
    process.exit(1);
  }

  // 0. Install @shavin/ui
  const pm = detectPackageManager(cwd);
  const pkgJsonPath = resolve(cwd, "package.json");
  const isAlreadyInstalled = existsSync(pkgJsonPath) &&
    JSON.parse(readFileSync(pkgJsonPath, "utf8")).dependencies?.["@shavin/ui"];

  if (!isAlreadyInstalled) {
    const installCmd = pm === "npm"
      ? "npm install @shavin/ui"
      : pm === "pnpm"
      ? "pnpm add @shavin/ui"
      : pm === "yarn"
      ? "yarn add @shavin/ui"
      : "bun add @shavin/ui";
    console.log(fmt.subtle(`Installing @shavin/ui with ${pm}...`));
    try {
      execSync(installCmd, { cwd, stdio: "inherit" });
      console.log(fmt.success(`Installed @shavin/ui`));
      modifiedCount++;
    } catch {
      console.error(fmt.error(`Failed to install @shavin/ui. Run: ${installCmd}`));
    }
  } else {
    console.log(fmt.success(`@shavin/ui already installed`));
  }

  // 0b. Detect Tailwind version + framework
  const twInfo = detectTailwindVersion(cwd);
  const isTailwindV4 = twInfo.version === 4;
  console.log(fmt.subtle(`Tailwind CSS v${twInfo.version} detected (via ${twInfo.source})`));
  console.log(fmt.subtle(`Framework: ${fwInfo.framework} (via ${fwInfo.source})`));

  // 1. Tailwind Config (v3 only — v4 uses CSS-first config via @theme inline)
  const tailwindPath = [
    join(cwd, "tailwind.config.ts"),
    join(cwd, "tailwind.config.js"),
    join(cwd, "tailwind.config.mjs"),
  ].find(existsSync);

  if (tailwindPath) {
    let twSrc = readFileSync(tailwindPath, "utf8");
    const preset = addTailwindPreset(twSrc, { esm: isEsmTailwindConfig(tailwindPath, twSrc) });
    if (preset.changed) {
      writeFileSync(tailwindPath, preset.src, "utf8");
      console.log(fmt.success(`Added @shavin/ui preset to ${basename(tailwindPath)}`));
      modifiedCount++;
    } else if (!preset.already) {
      console.log(fmt.warn(`Couldn't find where to add the preset in ${basename(tailwindPath)}. Add it by hand:`));
      console.log(fmt.subtle(`  presets: [require("@shavin/ui/tailwind-preset")],`));
    }
    // The preset ships `content: []`; Tailwind must also scan @shavin/ui itself,
    // or the classes used inside its components are never generated.
    twSrc = readFileSync(tailwindPath, "utf8");
    if (!twSrc.includes("@shavin/ui/**") && /content:\s*\[/.test(twSrc)) {
      twSrc = twSrc.replace(/content:\s*\[/, `content: [\n    "./node_modules/@shavin/ui/**/*.{js,mjs,ts,tsx}",\n    `);
      writeFileSync(tailwindPath, twSrc, "utf8");
      console.log(fmt.success(`Added node_modules/@shavin/ui to content in ${basename(tailwindPath)}`));
      modifiedCount++;
    } else if (!twSrc.includes("@shavin/ui/**")) {
      console.log(fmt.warn(`Add "./node_modules/@shavin/ui/**/*.{js,mjs,ts,tsx}" to content in ${basename(tailwindPath)}`));
    }
  } else if (!isTailwindV4) {
    // v3 project but no tailwind.config.* found — create one with the preset
    const newConfigPath = join(cwd, "tailwind.config.ts");
    const newConfig = `import type { Config } from "tailwindcss";\n\nexport default {\n  presets: [require("@shavin/ui/tailwind-preset")],\n  content: [\n    "./node_modules/@shavin/ui/**/*.{js,mjs,ts,tsx}",\n    "./src/**/*.{js,ts,jsx,tsx,mdx}",\n    "./app/**/*.{js,ts,jsx,tsx,mdx}",\n    "./pages/**/*.{js,ts,jsx,tsx,mdx}",\n    "./components/**/*.{js,ts,jsx,tsx,mdx}",\n  ],\n} satisfies Config;\n`;
    writeFileSync(newConfigPath, newConfig, "utf8");
    console.log(fmt.success(`Created tailwind.config.ts with @shavin/ui preset`));
    modifiedCount++;
  }

  // 2. Global CSS Stylesheet. The imports themselves are added in 2c, once brand-tokens.css exists,
  // so they land together and in the documented order (after Tailwind's own import).
  const cssPaths = findGlobalCss(cwd);
  // Tailwind 4 loads the element defaults (body, focus ring, scrollbars) in the base layer, so utilities,
  // including another library's such as shadcn/ui's, win over them. Tailwind 3 has no native layers:
  // it takes styles.css, which includes them.
  const sfx = oklch ? "-oklch" : "";
  const stylesImport = isTailwindV4
    ? `@import "@shavin/ui/tokens${sfx}.css";\n@import "@shavin/ui/base${sfx}.css" layer(base);`
    : `@import "@shavin/ui/${oklch ? "global-oklch" : "styles"}.css";`;
  if (!cssPaths) {
    console.log(fmt.warn(`No global stylesheet found (looked for ${GLOBAL_CSS_CANDIDATES.slice(0, 4).join(", ")} and others).`));
    console.log(fmt.subtle(`  Add these lines to the stylesheet your app loads, after @import "tailwindcss":`));
    for (const l of stylesImport.split("\n")) console.log(fmt.subtle(`  ${l}`));
    if (isTailwindV4) console.log(fmt.subtle(`  ${oklch ? '@import "@shavin/ui/theme-v4-oklch.css";' : '@import "@shavin/ui/theme-v4.css";'}`));
  }

  // 2b. Scaffold brand-tokens.css + brand-preset.mjs
  const brandDirCandidates = [
    join(cwd, "src", "styles"),
    join(cwd, "styles"),
    join(cwd, "src"),
    cwd,
  ];
  // Prefer the directory that already contains the global CSS file
  let brandDir = brandDirCandidates[0];
  if (cssPaths) {
    const cssDir = dirname(cssPaths);
    brandDir = cssDir;
  } else {
    brandDir = brandDirCandidates.find((d) => existsSync(d)) || brandDirCandidates[0];
  }

  const brandCSSPath = join(brandDir, "brand-tokens.css");
  const relPath = relPosix(cwd, brandCSSPath);
  const brandPresetPath = join(brandDir, "brand-preset.mjs");

  if (!existsSync(brandCSSPath)) {
    // Ensure directory exists
    if (!existsSync(brandDir)) mkdirSync(brandDir, { recursive: true });

    // Write the default template
    writeFileSync(brandCSSPath, DEFAULT_BRAND_TOKENS_CSS, "utf8");

    // Generate initial derived tokens + Tailwind preset (v3) or @theme inline CSS (v4)
    const cssText = readFileSync(brandCSSPath, "utf8");
    const { declarations } = parseBrandTokens(cssText);
    const tokens = oklch
      ? computeBrandTokensOklch(declarations)
      : computeBrandTokens(declarations);
    const generatedCSS = oklch
      ? rebuildCSOklch(cssText, tokens)
      : rebuildCSS(cssText, tokens);
    writeFileSync(brandCSSPath, generatedCSS, "utf8");

    if (isTailwindV4) {
      // v4: generate @theme inline CSS file
      const generatedThemeV4CSS = oklch
        ? generateThemeV4CSSOklch(tokens.colorNames, tokens.aliasNames)
        : generateThemeV4CSS(tokens.colorNames, tokens.aliasNames);
      const themeV4FileName = oklch ? "brand-theme-v4-oklch.css" : "brand-theme-v4.css";
      writeFileSync(join(brandDir, themeV4FileName), generatedThemeV4CSS, "utf8");
      console.log(fmt.success(`Created ${relPath} (brand color tokens — edit INPUT section to add colors)`));
      console.log(fmt.success(`Created ${relPosix(cwd, join(brandDir, themeV4FileName))} (auto-generated @theme inline CSS${oklch ? " — OKLCH" : ""})`));
    } else {
      // v3: generate JS preset as before
      const generatedPreset = generateTailwindPreset(tokens.colorNames, tokens.aliasNames);
      writeFileSync(brandPresetPath, generatedPreset, "utf8");
      console.log(fmt.success(`Created ${relPath} (brand color tokens — edit INPUT section to add colors)`));
      console.log(fmt.success(`Created ${relPosix(cwd, brandPresetPath)} (auto-generated Tailwind preset)`));
    }
    modifiedCount++;
  } else {
    console.log(fmt.success(`brand-tokens.css already exists at ${relPosix(cwd, brandCSSPath)}`));
  }

  // 2b2. shadcn/ui already in the project (Tailwind 4): map its variables to Shavin's tokens so one brand change restyles both.
  const shadcnBridge = Boolean(cssPaths) && isTailwindV4 && isShadcnProject(cwd);
  if (shadcnBridge) {
    const bridgePath = join(dirname(cssPaths), SHADCN_BRIDGE_FILE);
    if (!existsSync(bridgePath)) {
      writeFileSync(bridgePath, SHADCN_BRIDGE_CSS, "utf8");
      console.log(fmt.success(`Created ${relPosix(cwd, bridgePath)} (shadcn/ui variables follow Shavin's brand)`));
      modifiedCount++;
    }
  }

  // 2c. Import Shavin's CSS in the global stylesheet: brand tokens, the DS styles, and on Tailwind 4
  // the @theme bridge, the generated brand theme and @source lines. Each line is added only if missing.
  if (cssPaths) {
    let cssSrc = readFileSync(cssPaths, "utf8");
    const brandThemeFile = oklch ? "brand-theme-v4-oklch.css" : "brand-theme-v4.css";
    const themeV4Import = oklch ? '@import "@shavin/ui/theme-v4-oklch.css";' : '@import "@shavin/ui/theme-v4.css";';
    const lines = [
      ...(existsSync(join(dirname(cssPaths), "brand-tokens.css")) ? ['@import "./brand-tokens.css";'] : []),
      // A project set up before the split keeps its styles.css import; don't add the pieces next to it.
      ...(/@import\s+["']@shavin\/ui\/(styles|global-oklch)\.css["']/.test(cssSrc) ? [] : stylesImport.split("\n")),
      ...(isTailwindV4 ? [themeV4Import] : []),
      ...(isTailwindV4 && existsSync(join(dirname(cssPaths), brandThemeFile)) ? [`@import "./${brandThemeFile}";`] : []),
      ...(shadcnBridge ? [`@import "./${SHADCN_BRIDGE_FILE}";`] : []),
    ];
    const { src: withImports, added } = addCssImports(cssSrc, lines);
    cssSrc = withImports;

    const sourceAdded = [];
    if (isTailwindV4) {
      // v4 skips node_modules when scanning for classes: register @shavin/ui so its components' utilities
      // are generated, and keep the scanner out of .agents/ and .claude/ (skill markdown would produce bogus utilities).
      const uiRel = relativeShavinUiPath(cssPaths, cwd);
      const skillDirs = [".agents", ".claude"].map((f) => relativeAgentsPath(cssPaths, cwd, f));
      const sourceLines = [
        ...(/@source\s+"[^"]*@shavin\/ui[^"]*"/.test(cssSrc) ? [] : [`@source "${uiRel}";`]),
        ...skillDirs.filter((rel) => !cssSrc.includes(`@source not "${rel}"`)).map((rel) => `@source not "${rel}";`),
      ];
      if (sourceLines.length) {
        const imports = [...cssSrc.matchAll(/@import\s[^;]+;/g)];
        const last = imports[imports.length - 1];
        const at = last ? last.index + last[0].length : 0;
        cssSrc = cssSrc.slice(0, at) + (at ? "\n" : "") + sourceLines.join("\n") + (at ? "" : "\n") + cssSrc.slice(at);
        sourceAdded.push(...sourceLines);
      }
    }

    if (added.length || sourceAdded.length) {
      writeFileSync(cssPaths, cssSrc, "utf8");
      const rel = relPosix(cwd, cssPaths);
      console.log(fmt.success(`Updated ${rel}: ${[...added, ...sourceAdded].map((l) => l.replace(/;$/, "")).join(", ")}`));
      modifiedCount++;
    } else {
      console.log(fmt.success(`${relPosix(cwd, cssPaths)} already imports Shavin's CSS`));
    }
  }

  // Merge brand-preset into Tailwind config
  if (tailwindPath && existsSync(brandPresetPath)) {
    let twSrc = readFileSync(tailwindPath, "utf8");
    // brand-preset.mjs is an ES module: import it in TS/ESM configs; in a CommonJS config require()
    // returns its namespace, so take `.default` (Tailwind does not unwrap it on presets).
    const brandPresetRel = `./${relPosix(cwd, brandPresetPath)}`;
    const esm = tailwindPath.endsWith(".ts") || isEsmTailwindConfig(tailwindPath, twSrc);
    const brandPresetImport = esm
      ? `import brandPreset from "${brandPresetRel}";`
      : `const brandPreset = require("${brandPresetRel}").default;`;

    if (!twSrc.includes("brand-preset") && !twSrc.includes("brandPreset")) {
      // The import/require is chosen by the config's real module format, never by the word "import" appearing anywhere
      // (the stock `tailwindcss init` JSDoc line `@type {import('tailwindcss').Config}` is not an ES import).
      twSrc = addBrandPresetRef(twSrc, brandPresetImport, { esm });

      writeFileSync(tailwindPath, twSrc, "utf8");
      console.log(fmt.success(`Merged brand-preset into ${basename(tailwindPath)}`));
      modifiedCount++;
    }
  }

  // Brand scripts. With @shavin/cli installed locally they run its `shavin` binary, and predev/prebuild
  // regenerate the brand tokens; without it, builds must not depend on fetching the CLI with npx, so only
  // the manual scripts are added.
  const wireBrandScripts = (cliLocal) => {
    if (!existsSync(pkgJsonPath)) return;
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    pkg.scripts ??= {};
    const before = JSON.stringify(pkg.scripts);
    const oklchFlag = oklch ? " --oklch" : "";
    const bin = cliLocal ? "shavin" : "npx @shavin/cli";
    pkg.scripts["brand:gen"] ??= `${bin} brand${oklchFlag}`;
    pkg.scripts["brand:check"] ??= `${bin} brand --check${oklchFlag}`;
    if (cliLocal) {
      for (const hook of ["predev", "prebuild"]) {
        const cur = pkg.scripts[hook];
        if (!cur) pkg.scripts[hook] = "npm run brand:gen";
        else if (!cur.includes("brand:gen")) pkg.scripts[hook] = `npm run brand:gen && ${cur}`;
      }
    }
    if (JSON.stringify(pkg.scripts) === before) return;
    writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log(fmt.success(cliLocal
      ? `Added brand:gen and brand:check to package.json, run before dev and build`
      : `Added brand:gen and brand:check to package.json`));
    if (!cliLocal) console.log(fmt.subtle(`  Run npm run brand:gen after editing brand-tokens.css, or install @shavin/cli to run it before every dev and build.`));
    modifiedCount++;
  };

  // 3. Scaffold <ThemeProvider> in root layout (mandatory — activates theme config + ShavinDevInspector)
  const layoutCandidates = [
    "src/app/layout.tsx",
    "src/app/layout.ts",
    "app/layout.tsx",
    "app/layout.ts",
    "src/pages/_app.tsx",
    "pages/_app.tsx",
    "src/main.tsx",
    "src/main.jsx",
    "src/App.tsx",
    "src/App.jsx",
    "App.tsx",
    "App.jsx",
    "app/root.tsx",
    "app/root.ts",
  ].map((f) => resolve(cwd, f));

  const layoutPath = layoutCandidates.find(existsSync);
  let themeProviderAdded = false;

  const shadcn = isShadcnProject(cwd);
  if (shadcn) {
    if (isTailwindV4) {
      console.log(fmt.subtle(`shadcn/ui detected (components.json). Shavin uses its own variable names and loads its element defaults in Tailwind's base layer, so both libraries work side by side.`));
    } else {
      console.log(fmt.warn(`shadcn/ui detected (components.json). On Tailwind 3 Shavin's element defaults are not layered and can override shadcn's base styles.`));
      console.log(fmt.subtle(`  Review ${cssPaths ? relPosix(cwd, cssPaths) : "your global stylesheet"} before shipping, or move to Tailwind 4.`));
    }
  }

  if (layoutPath) {
    let layoutSrc = readFileSync(layoutPath, "utf8");
    if (hasShavinThemeProvider(layoutSrc)) {
      console.log(fmt.success(`ThemeProvider already wired in ${basename(layoutPath)}`));
      themeProviderAdded = true;
    } else if (shadcn || usesNextThemes(layoutSrc) || /\bThemeProvider\b/.test(layoutSrc)) {
      // Another theme provider (next-themes, shadcn's theme-provider) already owns the .dark class;
      // Shavin's would fight it. Shavin's components follow .dark on their own.
      console.log(fmt.warn(`${basename(layoutPath)} already has a theme provider, so Shavin's ThemeProvider was not added.`));
      console.log(fmt.subtle(`  Shavin follows the .dark class your provider sets. To use Shavin's theme settings or the Dev Inspector,`));
      console.log(fmt.subtle(`  wrap your app in <ThemeProvider> from "@shavin/ui" and remove the other one.`));
    } else {
      const result = patchLayoutWithThemeProvider(layoutSrc, oklch);
      if (result.patched) {
        writeFileSync(layoutPath, result.src, "utf8");
        console.log(fmt.success(`Added <ThemeProvider> to ${basename(layoutPath)}`));
        console.log(fmt.subtle(`Ensure your entire app sits inside <ThemeProvider> — ShavinDevInspector auto-mounts in dev`));
        themeProviderAdded = true;
        modifiedCount++;
      } else {
        console.log(fmt.warn(`Could not auto-detect JSX return pattern in ${basename(layoutPath)} (${result.reason})`));
        console.log(fmt.subtle(`Manually add to ${basename(layoutPath)}:`));
        console.log(fmt.subtle(`1. import { ThemeProvider } from "@shavin/ui"`));
        console.log(fmt.subtle(`2. Wrap your entire app in <ThemeProvider>...</ThemeProvider>`));
      }
    }
    // 3b. ToastProvider inside ThemeProvider: useToast() works with no setup (success and error states).
    if (themeProviderAdded) {
      const current = readFileSync(layoutPath, "utf8");
      if (hasToastProvider(current)) {
        console.log(fmt.success(`ToastProvider already wired in ${basename(layoutPath)}`));
      } else {
        const toast = addToastProvider(current);
        if (toast.patched) {
          writeFileSync(layoutPath, toast.src, "utf8");
          console.log(fmt.success(`Added <ToastProvider> inside <ThemeProvider> in ${basename(layoutPath)}, so useToast() works anywhere`));
          modifiedCount++;
        } else {
          console.log(fmt.warn(`Could not add <ToastProvider> to ${basename(layoutPath)} (${toast.reason})`));
          console.log(fmt.subtle(`  Add it yourself: import { ToastProvider } from "@shavin/ui" and render <ToastProvider>{children}</ToastProvider> directly inside <ThemeProvider>.`));
        }
      }
    }
  } else {
    console.log(fmt.warn(`No root layout file found (checked app/layout, pages/_app, src/App, app/root)`));
    console.log(fmt.subtle(`Manually add to your root layout:`));
    console.log(fmt.subtle(`1. import { ThemeProvider } from "@shavin/ui"`));
    console.log(fmt.subtle(`2. Wrap your entire app in <ThemeProvider>...</ThemeProvider>`));
  }

  // 4. SHAVIN.md Project Brain
  const targetShavinMd = resolve(cwd, "SHAVIN.md");
  if (!existsSync(targetShavinMd)) {
    // Generated by scripts/gen-agents.mjs from packages/skills/agents/SHAVIN.template.md,
    // the same template the MCP shavin_steer init_brain action uses.
    const shavinTemplatePath = fileURLToPath(new URL("../templates/SHAVIN.md", import.meta.url));
    const other = detectOtherUi(cwd);
    const defaultShavinMd = readFileSync(shavinTemplatePath, "utf8")
      .replace("[project name]", basename(cwd))
      .replace("- **Other UI library**: `none`", `- **Other UI library**: \`${other.libs.length ? other.libs.join(", ") : "none"}\``)
      .replace("- **Legacy paths**: `none`", `- **Legacy paths**: \`${other.legacyPaths.length ? other.legacyPaths.join(", ") : "none"}\``);
    writeFileSync(targetShavinMd, defaultShavinMd, "utf8");
    console.log(fmt.success(`Created SHAVIN.md (your project's design brief for agents)`));
    modifiedCount++;
  }

  // 5. .shavin/ structure
  const shavinDir = resolve(cwd, ".shavin");
  const shavinDirs = [
    shavinDir,
    resolve(shavinDir, "prompts"),
    resolve(shavinDir, "prompts", "context-history"),
    resolve(shavinDir, "snapshots"),
    resolve(shavinDir, ".cache"),
  ];

  for (const d of shavinDirs) {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  }

  const targetConfig = resolve(shavinDir, "config.json");
  if (!existsSync(targetConfig)) {
    writeFileSync(targetConfig, JSON.stringify({
      version: "0.1.0",
      engine: "@shavin/ui",
      presets: { brandColor: "monochrome", grayColor: "zinc", radius: "medium", scaling: "100%" },
      brandConfirmed: false,
      initializedAt: new Date().toISOString(),
    }, null, 2), "utf8");
    console.log(fmt.success(`Initialized .shavin/config.json`));
    modifiedCount++;
  }

  // 6. Install the agent tools (@shavin/mcp + @shavin/skills)
  const mcpPkgName = "@shavin/mcp";
  const skillsPkgName = "@shavin/skills";
  const cliPkgName = "@shavin/cli";

  const existingPkg = existsSync(pkgJsonPath) ? JSON.parse(readFileSync(pkgJsonPath, "utf8")) : {};
  const allDeps = { ...(existingPkg.dependencies || {}), ...(existingPkg.devDependencies || {}) };

  const mcpAlreadyInstalled = Boolean(allDeps[mcpPkgName]);
  const skillsAlreadyInstalled = Boolean(allDeps[skillsPkgName]);
  const allAiAlreadyInstalled = mcpAlreadyInstalled && skillsAlreadyInstalled;

  let mcpInstalled = mcpAlreadyInstalled;
  let skillsInstalled = skillsAlreadyInstalled;
  let cliInstalled = Boolean(allDeps[cliPkgName]);

  if (allAiAlreadyInstalled) {
    console.log(fmt.success(`@shavin/mcp and @shavin/skills already installed`));
  } else {
    console.log(""); // spacing before prompt
    const shouldInstallAi = await askYesNo(
      "  Install the agent tools (@shavin/mcp and @shavin/skills)? Recommended: they give your editor's AI the Shavin MCP server and design rules.",
      true
    );

    if (shouldInstallAi) {
      const pkgsToInstall = [];
      if (!mcpAlreadyInstalled) pkgsToInstall.push(mcpPkgName);
      if (!skillsAlreadyInstalled) pkgsToInstall.push(skillsPkgName);
      if (!allDeps[cliPkgName]) pkgsToInstall.push(cliPkgName);

      const aiInstallCmd = pm === "npm"
        ? `npm install -D ${pkgsToInstall.join(" ")}`
        : pm === "pnpm"
        ? `pnpm add -D ${pkgsToInstall.join(" ")}`
        : pm === "yarn"
        ? `yarn add -D ${pkgsToInstall.join(" ")}`
        : `bun add -D ${pkgsToInstall.join(" ")}`;

      try {
        execSync(aiInstallCmd, { cwd, stdio: "inherit" });
        console.log(fmt.success(`Installed ${pkgsToInstall.join(", ")}`));
        mcpInstalled = true;
        skillsInstalled = true;
        if (pkgsToInstall.includes(cliPkgName)) cliInstalled = true;
        modifiedCount++;
      } catch {
        console.error(fmt.error(`Failed to install AI packages. Install manually with:\n    ${aiInstallCmd}`));
      }
    } else {
      console.log(fmt.warn(`Skipped the agent tools. Install them later with:\n    ${pm} install -D ${mcpPkgName} ${skillsPkgName}`));
    }
  }

  wireBrandScripts(cliInstalled);

  // Deploy skills to .agents/skills/ via the package's installer
  let skillsDeployed = false;
  if (skillsInstalled) {
    try {
      const localInstaller = resolve(cwd, "node_modules", "@shavin", "skills", "bin", "install.mjs");
      if (existsSync(localInstaller)) {
        execSync(`node "${localInstaller}"`, { cwd, stdio: "inherit" });
      } else {
        execSync("npx @shavin/skills", { cwd, stdio: "inherit" });
      }
      skillsDeployed = true;
      modifiedCount++;
    } catch {
      console.error(fmt.error(`Failed to deploy skills. Run manually: npx @shavin/skills`));
    }
  }

  // Edit hook: Claude Code runs validate_code's rules on every .tsx/.jsx the agent writes (needs the local @shavin/mcp bin).
  if (mcpInstalled) {
    const settingsPath = resolve(cwd, ".claude", "settings.json");
    const merged = mergeClaudeHook(existsSync(settingsPath) ? readFileSync(settingsPath, "utf8") : "");
    if (!merged) {
      console.log(fmt.warn(`.claude/settings.json is not valid JSON, so the Shavin edit hook was not added. Add a PostToolUse hook running "npx --no-install shavin-mcp --hook" for Write|Edit|MultiEdit.`));
    } else if (merged.changed) {
      mkdirSync(dirname(settingsPath), { recursive: true });
      writeFileSync(settingsPath, merged.src, "utf8");
      console.log(fmt.success(`Added the Shavin edit hook to .claude/settings.json (checks every .tsx/.jsx Claude writes)`));
      modifiedCount++;
    }
  }

  // 4b. AGENTS.md and CLAUDE.md Scaffolding
  const targetAgentsMd = resolve(cwd, "AGENTS.md");
  // Generated by scripts/gen-agents.mjs (the same rules the MCP install_skills tool writes).
  const agentsTemplatePath = fileURLToPath(new URL("../templates/AGENTS.md", import.meta.url));
  const defaultAgentsMd = readFileSync(agentsTemplatePath, "utf8");

  if (!existsSync(targetAgentsMd)) {
    writeFileSync(targetAgentsMd, defaultAgentsMd, "utf8");
    console.log(fmt.success(`Created AGENTS.md (rules for AI agents in this repo)`));
    modifiedCount++;
  } else {
    let agentsContent = readFileSync(targetAgentsMd, "utf8");
    // The current heading, plus the older ones, so a project set up by an earlier version doesn't get the section twice.
    const SHAVIN_SECTION_MARKERS = ["UI workflow: look up, build to the rules, validate", "Mandatory 3-Step UI Execution Protocol", "Anti-Slop Law"];
    if (!SHAVIN_SECTION_MARKERS.some((m) => agentsContent.includes(m))) {
      agentsContent = defaultAgentsMd + "\n\n" + agentsContent;
      writeFileSync(targetAgentsMd, agentsContent, "utf8");
      console.log(fmt.success(`Added the Shavin section to your existing AGENTS.md`));
      modifiedCount++;
    }
  }

  const targetClaudeMd = resolve(cwd, "CLAUDE.md");
  // The MCP-first workflow lives in src/templates/CLAUDE.md so there is one source of truth.
  const claudeTemplatePath = fileURLToPath(new URL("../templates/CLAUDE.md", import.meta.url));
  const defaultClaudeMd = existsSync(claudeTemplatePath)
    ? readFileSync(claudeTemplatePath, "utf8")
    : "# Claude instructions\n\nBuild all UI through the Shavin MCP: get_components, get_tokens, validate_code. See AGENTS.md and SHAVIN.md.\n";

  if (!existsSync(targetClaudeMd)) {
    writeFileSync(targetClaudeMd, defaultClaudeMd, "utf8");
    console.log(fmt.success(`Created CLAUDE.md (instructions for Claude Code)`));
    modifiedCount++;
  } else {
    // The project already has a CLAUDE.md: keep it, add the Shavin block (with the SHAVIN.md / AGENTS.md imports) once.
    const current = readFileSync(targetClaudeMd, "utf8");
    if (!CLAUDE_BLOCK_START_RE.test(current) && !/^@SHAVIN\.md\s*$/m.test(current)) {
      const body = defaultClaudeMd.slice(defaultClaudeMd.indexOf("\n") + 1).trim();
      writeFileSync(targetClaudeMd, `${current.trimEnd()}\n\n${CLAUDE_BLOCK_START}\n${body}\n${CLAUDE_BLOCK_END}\n`, "utf8");
      console.log(fmt.success(`Added the Shavin section to your existing CLAUDE.md (imports SHAVIN.md and AGENTS.md)`));
      modifiedCount++;
    }
  }

  // 8. IDE MCP Integration (.cursor/mcp.json, .vscode/mcp.json, and root .mcp.json for Claude Code)
  const claudeMcpPath = resolve(cwd, ".mcp.json");
  if (existsSync(claudeMcpPath)) {
    try {
      const raw = readFileSync(claudeMcpPath, "utf8");
      const parsed = JSON.parse(raw);
      parsed.mcpServers = parsed.mcpServers || {};
      if (!parsed.mcpServers["shavin"]) {
        parsed.mcpServers["shavin"] = {
          command: "npx",
          args: ["-y", "@shavin/mcp"],
        };
        writeFileSync(claudeMcpPath, JSON.stringify(parsed, null, 2), "utf8");
        console.log(fmt.success(`Added shavin to .mcp.json (Claude Code)`));
        modifiedCount++;
      }
    } catch {
      // Safe fallback
    }
  } else {
    writeFileSync(
      claudeMcpPath,
      JSON.stringify(
        {
          mcpServers: {
            "shavin": {
              command: "npx",
              args: ["-y", "@shavin/mcp"],
            },
          },
        },
        null,
        2
      ),
      "utf8"
    );
    console.log(fmt.success(`Created .mcp.json (MCP server for Claude Code)`));
    modifiedCount++;
  }

  // Cursor reads `mcpServers`; VS Code reads a top-level `servers` key with an explicit `type`.
  // https://code.visualstudio.com/docs/agents/reference/mcp-configuration
  const shavinServer = { command: "npx", args: ["-y", "@shavin/mcp"] };
  const ideConfigs = [
    { name: "Cursor", dirName: ".cursor", key: "mcpServers", entry: shavinServer },
    { name: "VS Code", dirName: ".vscode", key: "servers", entry: { type: "stdio", ...shavinServer } },
  ];

  for (const { name, dirName, key, entry } of ideConfigs) {
    const ideDir = resolve(cwd, dirName);
    const mcpPath = resolve(ideDir, "mcp.json");

    if (existsSync(mcpPath)) {
      try {
        const raw = readFileSync(mcpPath, "utf8");
        const parsed = JSON.parse(raw);
        let changed = false;
        // Older versions of init wrote VS Code's file with `mcpServers`, which VS Code ignores.
        if (key === "servers" && parsed.mcpServers?.shavin) {
          delete parsed.mcpServers.shavin;
          if (Object.keys(parsed.mcpServers).length === 0) delete parsed.mcpServers;
          changed = true;
        }
        parsed[key] = parsed[key] || {};
        if (!parsed[key]["shavin"]) {
          parsed[key]["shavin"] = entry;
          changed = true;
        }
        if (changed) {
          writeFileSync(mcpPath, JSON.stringify(parsed, null, 2), "utf8");
          console.log(fmt.success(`Added shavin to ${dirName}/mcp.json`));
          modifiedCount++;
        }
      } catch {
        // Safe fallback: do not overwrite corrupted or custom format json
      }
    } else {
      if (!existsSync(ideDir)) mkdirSync(ideDir, { recursive: true });
      writeFileSync(mcpPath, JSON.stringify({ [key]: { shavin: entry } }, null, 2), "utf8");
      console.log(fmt.success(`Created ${dirName}/mcp.json (MCP server for ${name})`));
      modifiedCount++;
    }
  }

  // 9. IDE Autocomplete & Snippet Helpers (.vscode/)
  const vscodeDir = resolve(cwd, ".vscode");
  if (!existsSync(vscodeDir)) mkdirSync(vscodeDir, { recursive: true });

  const templatesDir = resolve(fileURLToPath(new URL("../templates/vscode", import.meta.url)));
  if (existsSync(templatesDir)) {
    // Copy vscode.html-custom-data.json
    const htmlDataSrc = join(templatesDir, "vscode.html-custom-data.json");
    const htmlDataDest = join(vscodeDir, "vscode.html-custom-data.json");
    if (existsSync(htmlDataSrc)) {
      writeFileSync(htmlDataDest, readFileSync(htmlDataSrc, "utf8"), "utf8");
    }

    // Copy shavin-ui.code-snippets
    const snippetsSrc = join(templatesDir, "shavin-ui.code-snippets");
    const snippetsDest = join(vscodeDir, "shavin-ui.code-snippets");
    if (existsSync(snippetsSrc)) {
      writeFileSync(snippetsDest, readFileSync(snippetsSrc, "utf8"), "utf8");
    }

    // Merge or write settings.json
    const settingsDest = join(vscodeDir, "settings.json");
    let settingsObj = {
      "html.customData": ["./.vscode/vscode.html-custom-data.json"],
      "editor.suggest.snippetPreventQuickSuggestions": false,
      "typescript.suggest.completeFunctionCalls": true,
      "css.lint.unknownAtRules": "ignore",
      "scss.lint.unknownAtRules": "ignore",
    };

    if (existsSync(settingsDest)) {
      try {
        const rawSettings = JSON.parse(readFileSync(settingsDest, "utf8"));
        const customData = Array.isArray(rawSettings["html.customData"]) ? rawSettings["html.customData"] : [];
        if (!customData.includes("./.vscode/vscode.html-custom-data.json")) {
          customData.push("./.vscode/vscode.html-custom-data.json");
        }
        settingsObj = {
          ...rawSettings,
          "html.customData": customData,
          "typescript.suggest.completeFunctionCalls": rawSettings["typescript.suggest.completeFunctionCalls"] ?? true,
        };
      } catch {
        // preserve safe fallback
      }
    }
    writeFileSync(settingsDest, JSON.stringify(settingsObj, null, 2), "utf8");
    console.log(fmt.success(`Configured VS Code / Cursor IDE helpers (.vscode/vscode.html-custom-data.json & snippets)`));
    modifiedCount++;
  }

  // 8. Auto-start the dev bridge with the dev server (needs @shavin/mcp)
  let bridgeWiring = { status: "skipped" };
  if (mcpInstalled) {
    bridgeWiring = wireBridgeAutoStart(cwd, fwInfo.framework);
    if (bridgeWiring.status === "created") {
      console.log(fmt.success(`Created ${bridgeWiring.file} — bridge auto-starts with your dev server`));
      modifiedCount++;
    } else if (bridgeWiring.status === "wired") {
      console.log(fmt.success(`Wired ${bridgeWiring.file} — bridge auto-starts with your dev server`));
      modifiedCount++;
    } else if (bridgeWiring.status === "already") {
      console.log(fmt.success(`Bridge auto-start already wired in ${bridgeWiring.file}`));
    } else if (bridgeWiring.status === "manual") {
      console.log(fmt.warn(`Add bridge auto-start to your ${fwInfo.framework === "vite" ? "Vite" : fwInfo.framework === "nextjs" ? "Next" : "dev-server"} config:`));
      if (bridgeWiring.note) console.log(fmt.warn(bridgeWiring.note));
      if (bridgeWiring.snippet) console.log(`${c.fgMuted}    ${bridgeWiring.snippet.split("\n").join("\n    ")}${c.reset}`);
      else console.log(`${c.fgMuted}    Run the bridge with: npx @shavin/cli bridge${c.reset}`);
    }
  }

  // ─── Completion Summary ───
  const summaryItems = [
    { label: "Tailwind:", value: `${fmt.pass(`v${twInfo.version}`)} ${c.fgMuted}(${isTailwindV4 ? "CSS-first @theme inline" : "JS preset (tailwind-preset)"}${oklch ? " · OKLCH" : ""})${c.reset}` },
    { label: "Framework:", value: `${fmt.pass(fwInfo.framework)}${c.fgMuted}(${fwInfo.source})${c.reset}` },
    { label: "Primitives:", value: `${c.fg}import { Button, Card } from '@shavin/ui'${c.reset}` },
    { label: "Stylesheet:", value: cssPaths ? fmt.pass(relPosix(cwd, cssPaths)) : fmt.warn("Not found: add Shavin's imports by hand") },
  ];

  if (themeProviderAdded) {
    summaryItems.push({ label: "ThemeProvider:", value: fmt.pass("Wired (DevInspector auto-mounts)") });
  } else if (layoutPath) {
    summaryItems.push({ label: "ThemeProvider:", value: fmt.warn("Not added: see the note above") });
  } else {
    summaryItems.push({ label: "ThemeProvider:", value: fmt.warn("No root layout found") });
  }

  summaryItems.push({ label: "Project Brain:", value: fmt.pass("SHAVIN.md, AGENTS.md, CLAUDE.md active") });
  summaryItems.push({ label: "IDE MCP:", value: fmt.pass(".mcp.json, .cursor/ & .vscode/") });
  if (bridgeWiring.status === "created" || bridgeWiring.status === "wired" || bridgeWiring.status === "already") {
    summaryItems.push({ label: "Dev Bridge:", value: `${fmt.pass("Auto-starts with dev server")}${bridgeWiring.file ? ` ${c.fgMuted}(${bridgeWiring.file})${c.reset}` : ""}` });
  } else if (bridgeWiring.status === "manual") {
    summaryItems.push({ label: "Dev Bridge:", value: fmt.warn("Wire withShavinBridge / shavinBridge() in your config") });
  }
  summaryItems.push({ label: "IDE Helpers:", value: fmt.pass("component tags, props and snippets") });
  summaryItems.push({ label: "Brand Tokens:", value: `${fmt.pass("Ready")} ${c.fgMuted}(edit brand-tokens.css, run npm run brand:gen)${c.reset}` });

  if (skillsDeployed) {
    summaryItems.push({ label: "Agent Skills:", value: fmt.pass(".agents/skills/ deployed") });
    summaryItems.push({ label: "Slash Commands:", value: `${fmt.pass("Ready")} ${c.fgMuted}(/create-screen, /create-block, /audit-ui)${c.reset}` });
  } else if (skillsInstalled) {
    summaryItems.push({ label: "Agent Skills:", value: fmt.warn("Installed but deploy failed") });
  } else {
    summaryItems.push({ label: "Agent Skills:", value: fmt.warn("Install @shavin/skills to enable") });
  }

  if (mcpInstalled) {
    summaryItems.push({ label: "Context Extractor:", value: fmt.pass("npx @shavin/cli context") });
  } else {
    summaryItems.push({ label: "Context Extractor:", value: fmt.warn("Install @shavin/mcp to enable") });
  }

  const footerLines = [
    `${c.fgSubtle}Next steps:${c.reset}`,
    ``,
    `  ${fmt.code("npm run dev")}         ${c.fgMuted}→ Start the dev server${c.reset}`,
    `  ${fmt.code("npx @shavin/cli add hero-centered-media")}  ${c.fgMuted}→ Add a block${c.reset}`,
    `  ${fmt.code("npx @shavin/cli check")}                  ${c.fgMuted}→ Check the setup${c.reset}`,
  ];

  printCard({
    title: `${c.brand}${g.brand} ${cssPaths ? "@shavin/ui is set up" : "@shavin/ui is installed: finish the stylesheet step"}${c.reset}`,
    items: summaryItems,
    footer: footerLines.join("\n"),
    border: c.brandMuted,
  });
}

import { existsSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { resolve, join, basename, dirname } from "node:path";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

import { DEFAULT_BRAND_TOKENS_CSS, parseBrandTokens, computeBrandTokens, computeBrandTokensOklch, rebuildCSS, rebuildCSOklch, generateTailwindPreset, generateThemeV4CSS, generateThemeV4CSSOklch } from "../lib/brand-tokens.mjs";
import { detectTailwindVersion, relativeAgentsPath, relativeShavinUiPath, detectFramework } from "../lib/detect-tailwind.mjs";
import { c, fmt, g, printBanner, printCard, startSpinner } from "../ui.mjs";

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

// ── Patch a root layout file to wrap its JSX return in <ThemeProvider> ──
function patchLayoutWithThemeProvider(src, oklch = false) {
  // Already has ThemeProvider — skip
  if (src.includes("ThemeProvider")) {
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

  // 2b. Other components: wrap the return JSX
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

function wireNextBridge(cwd) {
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
  printBanner("@shavin/cli", "Design System & AI Agent Ecosystem Initialization");

  let modifiedCount = 0;

  // 0. Install @shavin/ui
  const detectPM = () => {
    if (existsSync(resolve(cwd, "pnpm-lock.yaml"))) return "pnpm";
    if (existsSync(resolve(cwd, "yarn.lock"))) return "yarn";
    if (existsSync(resolve(cwd, "bun.lockb"))) return "bun";
    return "npm";
  };

  const pm = detectPM();
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
  const fwInfo = detectFramework(cwd);
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
    if (!twSrc.includes("tailwind-preset") && !twSrc.includes("@shavin/ui/tailwind-preset")) {
      if (twSrc.includes("presets:")) {
        twSrc = twSrc.replace(/presets:\s*\[/, `presets: [require("@shavin/ui/tailwind-preset"), `);
      } else {
        twSrc = twSrc.replace(/(module\.exports\s*=\s*\{|export\s+default\s*\{)/, `$1\n  presets: [require("@shavin/ui/tailwind-preset")],`);
      }
      writeFileSync(tailwindPath, twSrc, "utf8");
      console.log(fmt.success(`Added @shavin/ui preset to ${basename(tailwindPath)}`));
      modifiedCount++;
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

  // 2. Global CSS Stylesheet
  const cssPaths = [
    "src/styles/global.css",
    "src/app/globals.css",
    "src/index.css",
    "styles/globals.css",
    "styles/global.css",
  ].map((f) => resolve(cwd, f)).find(existsSync);

  if (cssPaths) {
    let cssSrc = readFileSync(cssPaths, "utf8");
    const stylesImport = oklch
      ? '@import "@shavin/ui/global-oklch.css";'
      : '@import "@shavin/ui/styles.css";';
    if (!cssSrc.includes(stylesImport)) {
      cssSrc = `${stylesImport}\n` + cssSrc;
      writeFileSync(cssPaths, cssSrc, "utf8");
      console.log(fmt.success(`Imported ${oklch ? '@shavin/ui/global-oklch.css' : '@shavin/ui/styles.css'} in ${basename(cssPaths)}`));
      modifiedCount++;
    }
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
  const relPath = brandCSSPath.replace(cwd + "/", "");
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
      console.log(fmt.success(`Created ${join(brandDir, themeV4FileName).replace(cwd + "/", "")} (auto-generated @theme inline CSS${oklch ? " — OKLCH" : ""})`));
    } else {
      // v3: generate JS preset as before
      const generatedPreset = generateTailwindPreset(tokens.colorNames, tokens.aliasNames);
      writeFileSync(brandPresetPath, generatedPreset, "utf8");
      console.log(fmt.success(`Created ${relPath} (brand color tokens — edit INPUT section to add colors)`));
      console.log(fmt.success(`Created ${brandPresetPath.replace(cwd + "/", "")} (auto-generated Tailwind preset)`));
    }
    modifiedCount++;
  } else {
    console.log(fmt.success(`brand-tokens.css already exists at ${brandCSSPath.replace(cwd + "/", "")}`));
  }

  // Also import brand-tokens.css in the global CSS (before @shavin/ui import
  // so brand tokens are available to DS components too)
  if (cssPaths && existsSync(brandCSSPath)) {
    let cssSrc = readFileSync(cssPaths, "utf8");
    // The scaffolded file is always brand-tokens.css (it holds OKLCH values in --oklch mode).
    const brandImport = `@import "./brand-tokens.css";`;
    const shavinImport = oklch
      ? '@import "@shavin/ui/global-oklch.css";'
      : '@import "@shavin/ui/styles.css";';
    if (!cssSrc.includes(brandImport)) {
      // Insert before the @shavin/ui import line
      if (cssSrc.includes(shavinImport)) {
        cssSrc = cssSrc.replace(
          shavinImport,
          `${brandImport}\n${shavinImport}`
        );
      } else {
        // Prepend if no shavin import found
        cssSrc = `${brandImport}\n` + cssSrc;
      }
      writeFileSync(cssPaths, cssSrc, "utf8");
      console.log(fmt.success(`Imported brand-tokens.css in ${basename(cssPaths)}`));
      modifiedCount++;
    }
  }

  // 2c. v4-specific directives: @theme inline import + @source exclusion
  if (isTailwindV4 && cssPaths) {
    let cssSrc = readFileSync(cssPaths, "utf8");

    // Add @import for the v4 theme bridge (OKLCH or RGB variant)
    const themeV4Import = oklch
      ? '@import "@shavin/ui/theme-v4-oklch.css";'
      : '@import "@shavin/ui/theme-v4.css";';
    const stylesImportStr = oklch
      ? '@import "@shavin/ui/global-oklch.css";'
      : '@import "@shavin/ui/styles.css";';
    if (!cssSrc.includes(themeV4Import)) {
      if (cssSrc.includes(stylesImportStr)) {
        cssSrc = cssSrc.replace(
          stylesImportStr,
          stylesImportStr + '\n' + themeV4Import
        );
      } else {
        cssSrc = themeV4Import + "\n" + cssSrc;
      }
    }

    // Brand colours: the generated @theme inline file must load after the DS theme bridge
    const brandThemeFile = oklch ? "brand-theme-v4-oklch.css" : "brand-theme-v4.css";
    const brandThemeImport = `@import "./${brandThemeFile}";`;
    if (existsSync(join(dirname(cssPaths), brandThemeFile)) && !cssSrc.includes(brandThemeImport)) {
      cssSrc = cssSrc.replace(themeV4Import, themeV4Import + "\n" + brandThemeImport);
    }

    // v4 skips node_modules when scanning for classes — register @shavin/ui
    // explicitly so the utilities its components use are generated.
    const uiRel = relativeShavinUiPath(cssPaths, cwd);
    const sourceUi = `@source "${uiRel}";`;
    const hasUiSource = /@source\s+"[^"]*@shavin\/ui[^"]*"/.test(cssSrc);

    // Add @source not for .agents directory (prevents v4 scanner from
    // reading skill markdown files and generating invalid utilities)
    const agentsRel = relativeAgentsPath(cssPaths, cwd);
    const sourceNot = `@source not "${agentsRel}";`;
    const sourceLines = [
      ...(hasUiSource ? [] : [sourceUi]),
      ...(cssSrc.includes("@source not") ? [] : [sourceNot]),
    ];
    if (sourceLines.length) {
      // Add after the last @import line
      const imports = [...cssSrc.matchAll(/@import\s.+;/g)];
      if (imports.length > 0) {
        const last = imports[imports.length - 1];
        cssSrc = cssSrc.slice(0, last.index + last[0].length) +
                "\n" + sourceLines.join("\n") +
                cssSrc.slice(last.index + last[0].length);
      } else {
        cssSrc = sourceLines.join("\n") + "\n" + cssSrc;
      }
    }

    writeFileSync(cssPaths, cssSrc, "utf8");
    console.log(fmt.success(`Added ${oklch ? '@shavin/ui/theme-v4-oklch.css' : '@shavin/ui/theme-v4.css'} import for Tailwind v4`));
    if (!hasUiSource) console.log(fmt.success(`Added @source "${uiRel}" (v4 skips node_modules — needed for @shavin/ui component classes)`));
    console.log(fmt.success(`Added @source not "${agentsRel}" (excludes skill docs from v4 scanner)`));
    modifiedCount++;
  }

  // Add brand:gen + brand:check scripts to package.json
  if (existsSync(pkgJsonPath)) {
    let pkgChanged = false;
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    if (!pkg.scripts) pkg.scripts = {};

    const oklchFlag = oklch ? " --oklch" : "";
    if (!pkg.scripts["brand:gen"]) {
      pkg.scripts["brand:gen"] = `npx @shavin/cli brand${oklchFlag}`;
      pkgChanged = true;
    }
    if (!pkg.scripts["brand:check"]) {
      pkg.scripts["brand:check"] = `npx @shavin/cli brand --check${oklchFlag}`;
      pkgChanged = true;
    }
    // Wire predev hook — fires brand:gen before every `npm run dev`
    if (!pkg.scripts["predev"]) {
      pkg.scripts["predev"] = "npm run brand:gen";
      pkgChanged = true;
    } else if (!pkg.scripts["predev"].includes("brand:gen")) {
      // Prepend brand:gen to existing predev
      pkg.scripts["predev"] = `npm run brand:gen && ${pkg.scripts["predev"]}`;
      pkgChanged = true;
    }
    // Wire prebuild hook — ensures production builds always have fresh tokens
    if (!pkg.scripts["prebuild"]) {
      pkg.scripts["prebuild"] = "npm run brand:gen";
      pkgChanged = true;
    } else if (!pkg.scripts["prebuild"].includes("brand:gen")) {
      pkg.scripts["prebuild"] = `npm run brand:gen && ${pkg.scripts["prebuild"]}`;
      pkgChanged = true;
    }

    if (pkgChanged) {
      writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
      console.log(fmt.success(`Added brand:gen + brand:check + predev + prebuild scripts to package.json`));
      modifiedCount++;
    }
  }

  // Merge brand-preset into Tailwind config
  if (tailwindPath && existsSync(brandPresetPath)) {
    let twSrc = readFileSync(tailwindPath, "utf8");
    const brandPresetImport = tailwindPath.endsWith(".ts")
      ? `import brandPreset from "./${brandPresetPath.replace(cwd + "/", "")}";`
      : `const brandPreset = require("./${brandPresetPath.replace(cwd + "/", "")}");`;

    if (!twSrc.includes("brand-preset") && !twSrc.includes("brandPreset")) {
      // Add the import/require after existing imports
      if (twSrc.includes("import")) {
        // TS/ESM: add after last import
        const importRegex = /^import\s.+$/gm;
        const imports = [...twSrc.matchAll(importRegex)];
        if (imports.length > 0) {
          const last = imports[imports.length - 1];
          twSrc = twSrc.slice(0, last.index + last[0].length) +
            "\n" + brandPresetImport +
            twSrc.slice(last.index + last[0].length);
        }
      } else {
        // CJS: add after first require or at top
        const requireRegex = /^const\s.+require\(.+\);?\s*$/gm;
        const requires = [...twSrc.matchAll(requireRegex)];
        if (requires.length > 0) {
          const last = requires[requires.length - 1];
          twSrc = twSrc.slice(0, last.index + last[0].length) +
            "\n" + brandPresetImport +
            twSrc.slice(last.index + last[0].length);
        } else {
          twSrc = brandPresetImport + "\n" + twSrc;
        }
      }

      // Add brandPreset to presets array
      if (twSrc.includes("presets:")) {
        // Check if shavin preset is already there and add after it
        if (twSrc.includes("shavin/ui/tailwind-preset") || twSrc.includes("tailwind-preset")) {
          twSrc = twSrc.replace(
            /(presets:\s*\[.*?(?:tailwind-preset|shavin\/ui\/tailwind-preset).*?)(\s*\])/,
            `$1, brandPreset$2`
          );
        } else {
          twSrc = twSrc.replace(/presets:\s*\[/, `presets: [brandPreset, `);
        }
      }

      writeFileSync(tailwindPath, twSrc, "utf8");
      console.log(fmt.success(`Merged brand-preset into ${basename(tailwindPath)}`));
      modifiedCount++;
    }
  }

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

  if (layoutPath) {
    let layoutSrc = readFileSync(layoutPath, "utf8");
    if (layoutSrc.includes("ThemeProvider")) {
      console.log(fmt.success(`\u2713 ThemeProvider already wired in ${basename(layoutPath)}`));
      themeProviderAdded = true;
    } else {
      const result = patchLayoutWithThemeProvider(layoutSrc, oklch);
      if (result.patched) {
        writeFileSync(layoutPath, result.src, "utf8");
        console.log(fmt.success(`\u2713 Added <ThemeProvider> to ${basename(layoutPath)}`));
        console.log(fmt.subtle(`Ensure your entire app sits inside <ThemeProvider> — ShavinDevInspector auto-mounts in dev`));
        themeProviderAdded = true;
        modifiedCount++;
      } else {
        console.log(fmt.warn(`\u26a0 Could not auto-detect JSX return pattern in ${basename(layoutPath)} (${result.reason})`));
        console.log(fmt.subtle(`Manually add to ${basename(layoutPath)}:`));
        console.log(fmt.subtle(`1. import { ThemeProvider } from "@shavin/ui"`));
        console.log(fmt.subtle(`2. Wrap your entire app in <ThemeProvider>...</ThemeProvider>`));
      }
    }
  } else {
    console.log(fmt.warn(`\u26a0 No root layout file found (checked app/layout, pages/_app, src/App, app/root)`));
    console.log(fmt.subtle(`Manually add to your root layout:`));
    console.log(fmt.subtle(`1. import { ThemeProvider } from "@shavin/ui"`));
    console.log(fmt.subtle(`2. Wrap your entire app in <ThemeProvider>...</ThemeProvider>`));
  }

  // 4. SHAVIN.md Project Brain
  const targetShavinMd = resolve(cwd, "SHAVIN.md");
  if (!existsSync(targetShavinMd)) {
    // Generated by scripts/gen-agents.mjs from @shavin/skills' shavin-core/SHAVIN.template.md,
    // the same template the MCP shavin_steer init_brain action uses.
    const shavinTemplatePath = fileURLToPath(new URL("../templates/SHAVIN.md", import.meta.url));
    const defaultShavinMd = readFileSync(shavinTemplatePath, "utf8").replace("[project name]", basename(cwd));
    writeFileSync(targetShavinMd, defaultShavinMd, "utf8");
    console.log(fmt.success(`Created SHAVIN.md (Persistent Project Design Brain)`));
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
      presets: { accentColor: "monochrome", grayColor: "zinc", radius: "medium", scaling: "95%" },
      initializedAt: new Date().toISOString(),
    }, null, 2), "utf8");
    console.log(fmt.success(`Initialized .shavin/config.json`));
    modifiedCount++;
  }

  // 6. Install AI Agent Ecosystem (@shavin/mcp + @shavin/skills + @shavin/cli)
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

  if (allAiAlreadyInstalled) {
    console.log(fmt.success(`AI Agent Ecosystem (@shavin/mcp + @shavin/skills) already installed`));
  } else {
    console.log(""); // spacing before prompt
    const shouldInstallAi = await askYesNo(
      "  Install AI Agent Ecosystem (@shavin/mcp + @shavin/skills)? [recommended] — enables IDE MCP tools, context extraction & agent design rules",
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
        console.log(fmt.success(`Installed AI Agent Ecosystem (${pkgsToInstall.join(", ")})`));
        mcpInstalled = true;
        skillsInstalled = true;
        modifiedCount++;
      } catch {
        console.error(fmt.error(`Failed to install AI packages. Install manually with:\n    ${aiInstallCmd}`));
      }
    } else {
      console.log(fmt.warn(`Skipped AI ecosystem. Install it later with:\n    ${pm} install -D ${mcpPkgName} ${skillsPkgName}`));
    }
  }

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

  // 4b. AGENTS.md and CLAUDE.md Scaffolding
  const targetAgentsMd = resolve(cwd, "AGENTS.md");
  // Generated by scripts/gen-agents.mjs (the same rules the MCP install_skills tool writes).
  const agentsTemplatePath = fileURLToPath(new URL("../templates/AGENTS.md", import.meta.url));
  const defaultAgentsMd = readFileSync(agentsTemplatePath, "utf8");

  if (!existsSync(targetAgentsMd)) {
    writeFileSync(targetAgentsMd, defaultAgentsMd, "utf8");
    console.log(fmt.success(`Created AGENTS.md (Agent Constitution & 3-Step Anti-Slop Protocol)`));
    modifiedCount++;
  } else {
    let agentsContent = readFileSync(targetAgentsMd, "utf8");
    if (!agentsContent.includes("Mandatory 3-Step UI Execution Protocol") && !agentsContent.includes("Anti-Slop Law")) {
      agentsContent = defaultAgentsMd + "\n\n" + agentsContent;
      writeFileSync(targetAgentsMd, agentsContent, "utf8");
      console.log(fmt.success(`Injected Mandatory 3-Step Protocol into existing AGENTS.md`));
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
    console.log(fmt.success(`Created CLAUDE.md (Claude Code CLI Directives)`));
    modifiedCount++;
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
    console.log(fmt.success(`Created .mcp.json (Claude Code AI tooling)`));
    modifiedCount++;
  }

  const ideConfigs = [
    { name: "Cursor", dirName: ".cursor" },
    { name: "VS Code", dirName: ".vscode" },
  ];

  for (const { name, dirName } of ideConfigs) {
    const ideDir = resolve(cwd, dirName);
    const mcpPath = resolve(ideDir, "mcp.json");

    if (existsSync(mcpPath)) {
      try {
        const raw = readFileSync(mcpPath, "utf8");
        const parsed = JSON.parse(raw);
        parsed.mcpServers = parsed.mcpServers || {};
        if (!parsed.mcpServers["shavin"]) {
          parsed.mcpServers["shavin"] = {
            command: "npx",
            args: ["-y", "@shavin/mcp"],
          };
          writeFileSync(mcpPath, JSON.stringify(parsed, null, 2), "utf8");
          console.log(fmt.success(`Added shavin to ${dirName}/mcp.json`));
          modifiedCount++;
        }
      } catch {
        // Safe fallback: do not overwrite corrupted or custom format json
      }
    } else {
      if (!existsSync(ideDir)) mkdirSync(ideDir, { recursive: true });
      writeFileSync(
        mcpPath,
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
      console.log(fmt.success(`Created ${dirName}/mcp.json (${name} AI tooling)`));
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
      if (bridgeWiring.snippet) console.log(`${c.fgMuted}    ${bridgeWiring.snippet.split("\n").join("\n    ")}${c.reset}`);
      else console.log(`${c.fgMuted}    Run the bridge with: npx @shavin/cli bridge${c.reset}`);
    }
  }

  // ─── Completion Summary ───
  const summaryItems = [
    { label: "Tailwind:", value: `${fmt.pass(`v${twInfo.version}`)} ${c.fgMuted}(${isTailwindV4 ? "CSS-first @theme inline" : "JS preset (tailwind-preset)"}${oklch ? " · OKLCH" : ""})${c.reset}` },
    { label: "Framework:", value: `${fmt.pass(fwInfo.framework)}${c.fgMuted}(${fwInfo.source})${c.reset}` },
    { label: "Primitives:", value: `${c.fg}import { Button, Card } from '@shavin/ui'${c.reset}` },
  ];

  if (themeProviderAdded) {
    summaryItems.push({ label: "ThemeProvider:", value: fmt.pass("Wired (DevInspector auto-mounts)") });
  } else if (layoutPath) {
    summaryItems.push({ label: "ThemeProvider:", value: fmt.warn("Add <ThemeProvider> to root layout") });
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
    `  ${fmt.code("npm run dev")}         ${c.fgMuted}→ Start dev server (predev hook auto-generates brand tokens)${c.reset}`,
    `  ${fmt.code("npx @shavin/cli add hero-centered-media")}  ${c.fgMuted}→ Add a block${c.reset}`,
    `  ${fmt.code("npx @shavin/cli check")}                  ${c.fgMuted}→ Audit token discipline${c.reset}`,
  ];

  printCard({
    title: `${c.brand}${g.brand} @shavin/ui Setup Complete${c.reset}`,
    items: summaryItems,
    footer: footerLines.join("\n"),
    border: c.brandMuted,
  });
}

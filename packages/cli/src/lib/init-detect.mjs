/**
 * Pure helpers for `shavin init`: finding the files it edits and editing them. Kept separate from
 * the command so each rule can be tested without running an install.
 */
import { parseJson } from "./json-file.mjs";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readDeclaredDeps } from "./package-manager.mjs";

/**
 * Where projects keep their global stylesheet, most specific first. `app/globals.css` is the
 * create-next-app default (no src/), `src/app/globals.css` the src/ variant, `app/app.css` React
 * Router 7 / Remix, `src/index.css` Vite.
 */
export const GLOBAL_CSS_CANDIDATES = [
  "app/globals.css",
  "src/app/globals.css",
  "app/global.css",
  "src/app/global.css",
  "app/app.css",
  "src/styles/globals.css",
  "src/styles/global.css",
  "styles/globals.css",
  "styles/global.css",
  "src/index.css",
  "src/globals.css",
  "src/global.css",
];

export function findGlobalCss(cwd) {
  return GLOBAL_CSS_CANDIDATES.map((f) => resolve(cwd, f)).find(existsSync);
}

/**
 * shadcn/ui writes components.json at the project root. Other tools use the same file name (Shavin's own
 * component manifest is one), so it counts only if it looks like shadcn's: a $schema on ui.shadcn.com, or
 * shadcn's `aliases` together with `tailwind` or `style`.
 */
export function isShadcnProject(cwd) {
  const file = resolve(cwd, "components.json");
  if (!existsSync(file)) return false;
  let json;
  try {
    json = parseJson(readFileSync(file, "utf8"));
  } catch {
    return false;
  }
  if (!json || typeof json !== "object") return false;
  if (typeof json.$schema === "string" && json.$schema.includes("shadcn")) return true;
  return typeof json.aliases === "object" && json.aliases !== null && ("tailwind" in json || "style" in json);
}

/** UI libraries other than Shavin, by package name prefix → display name. */
const OTHER_UI = [
  ["@radix-ui/", "Radix UI"], ["@headlessui/", "Headless UI"], ["@mui/", "MUI"], ["@chakra-ui/", "Chakra UI"], ["antd", "Ant Design"],
  ["@mantine/", "Mantine"], ["@nextui-org/", "NextUI"], ["@heroui/", "HeroUI"], ["react-bootstrap", "React Bootstrap"], ["@ariakit/", "Ariakit"],
];
/**
 * Other UI libraries already in the project and where their components live, so SHAVIN.md can list them as
 * legacy (reported by the checks, not failed) and agents leave them alone.
 * @returns {{ libs: string[], legacyPaths: string[] }}
 */
export function detectOtherUi(cwd) {
  const deps = readDeclaredDeps(cwd);
  const libs = new Set();
  if (isShadcnProject(cwd)) libs.add("shadcn/ui");
  for (const [prefix, name] of OTHER_UI) if (Object.keys(deps).some((d) => d === prefix || d.startsWith(prefix))) libs.add(name);
  const legacyPaths = ["src/components/ui", "components/ui", "app/components/ui"].filter((p) => existsSync(resolve(cwd, p)));
  return { libs: [...libs], legacyPaths };
}

/** The command init registers as a Claude Code PostToolUse hook (the local @shavin/mcp bin; no network). */
export const SHAVIN_HOOK_COMMAND = "npx --no-install shavin-mcp --hook";

/**
 * Add the Shavin edit hook to the text of `.claude/settings.json` (Write/Edit/MultiEdit run validate_code's rules
 * and feed failures back to the agent). Keeps everything else in the file. Idempotent.
 * @param {string} text  current file content ("" when the file does not exist)
 * @returns {{ src: string, changed: boolean } | null}  null when the file is not valid JSON (left alone)
 */
export function mergeClaudeHook(text) {
  let json = {};
  if (text && text.trim()) {
    try { json = parseJson(text); } catch { return null; }
    if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  }
  const hooks = (json.hooks = json.hooks && typeof json.hooks === "object" ? json.hooks : {});
  const post = (hooks.PostToolUse = Array.isArray(hooks.PostToolUse) ? hooks.PostToolUse : []);
  const has = post.some((g) => Array.isArray(g?.hooks) && g.hooks.some((h) => typeof h?.command === "string" && /shavin-hook|shavin-mcp\s+--hook/.test(h.command)));
  if (has) return { src: text, changed: false };
  post.push({ matcher: "Write|Edit|MultiEdit", hooks: [{ type: "command", command: SHAVIN_HOOK_COMMAND }] });
  return { src: JSON.stringify(json, null, 2) + "\n", changed: true };
}

/** True only when the file imports Shavin's ThemeProvider (another library's ThemeProvider doesn't count). */
export function hasShavinThemeProvider(src) {
  return /import\s*\{[^}]*\bThemeProvider\b[^}]*\}\s*from\s*["']@shavin\/ui["']/.test(src);
}

/** True when the source renders Shavin's <ToastProvider> (useToast() throws without one above it). */
export function hasToastProvider(src) {
  return /<ToastProvider\b/.test(src);
}

/**
 * Mount <ToastProvider> directly inside Shavin's <ThemeProvider>, so a fresh project can call
 * useToast() with no setup (state-components spec §3). Adds ToastProvider to the existing
 * `@shavin/ui` import. Idempotent.
 * @returns {{ patched: boolean, src?: string, reason?: string }}
 */
export function addToastProvider(src) {
  if (hasToastProvider(src)) return { patched: false, reason: "already-wired" };
  const open = src.match(/<ThemeProvider\b[^>]*>/);
  const closeIdx = src.lastIndexOf("</ThemeProvider>");
  if (!open || closeIdx < open.index) return { patched: false, reason: "no-theme-provider" };
  const openEnd = open.index + open[0].length;
  let out = src.slice(0, openEnd) + "<ToastProvider>" + src.slice(openEnd, closeIdx) + "</ToastProvider>" + src.slice(closeIdx);
  const importRe = /import\s*\{([^}]*)\}\s*from\s*(["'])@shavin\/ui\2;?/;
  if (importRe.test(out)) {
    out = out.replace(importRe, (m, names, q) =>
      /\bToastProvider\b/.test(names) ? m : `import { ${names.trim().replace(/,\s*$/, "")}, ToastProvider } from ${q}@shavin/ui${q};`,
    );
  } else {
    out = `import { ToastProvider } from "@shavin/ui";\n${out}`;
  }
  return { patched: true, src: out };
}

/** next-themes (used by shadcn and many Next apps) already manages the `.dark` class. */
export function usesNextThemes(src) {
  return /from\s*["']next-themes["']/.test(src) || /from\s*["']@\/components\/theme-provider["']/.test(src);
}

const PRESET = `require("@shavin/ui/tailwind-preset")`;
const PRESET_IMPORT = `import shavinPreset from "@shavin/ui/tailwind-preset";`;

/**
 * An ES module Tailwind config where `require` is not defined: `.mjs`/`.mts`, or a `.js` file that
 * uses `import`/`export default` (a `"type": "module"` project). TypeScript configs are loaded by
 * jiti, which accepts both forms, so they keep the existing behaviour.
 */
export function isEsmTailwindConfig(file, src) {
  if (/\.m[jt]s$/.test(file)) return true;
  return /\.js$/.test(file) && /^\s*(import\s|export\s+default\b)/m.test(src);
}

/**
 * Add the @shavin/ui preset to a Tailwind 3 config. Handles an existing `presets` array,
 * `module.exports = {`, `export default {`, and the named-object form templates use:
 * `const config = { … } satisfies Config; export default config`.
 * Returns { src, changed }; changed is false when the shape isn't recognised, so the caller can say so.
 * With `{ esm: true }` (see isEsmTailwindConfig) it adds an `import shavinPreset` line instead of `require()`.
 */
export function addTailwindPreset(src, { esm = false } = {}) {
  if (src.includes("@shavin/ui/tailwind-preset")) return { src, changed: false, already: true };
  const ref = esm ? "shavinPreset" : PRESET;
  const done = (out) => ({ src: esm ? addImportLine(out, PRESET_IMPORT) : out, changed: true });
  if (/presets:\s*\[/.test(src)) return done(src.replace(/presets:\s*\[/, `presets: [${ref}, `));
  const direct = /(module\.exports\s*=\s*\{|export\s+default\s*\{)/;
  if (direct.test(src)) return done(src.replace(direct, `$1\n  presets: [${ref}],`));
  // `export default config` (optionally `config satisfies Config`) → find `const config … = {`.
  const exported = src.match(/export\s+default\s+([A-Za-z_$][\w$]*)/);
  if (exported) {
    const name = exported[1];
    const decl = new RegExp(`((?:const|let|var)\\s+${name}\\s*(?::\\s*[\\w.<>\\[\\]]+\\s*)?=\\s*\\{)`);
    if (decl.test(src)) return done(src.replace(decl, `$1\n  presets: [${ref}],`));
  }
  return { src, changed: false };
}

/**
 * Add the `brandPreset` import (ESM/TS) or require (CommonJS) line to a Tailwind 3 config: after the last real
 * `import` statement or top-level `const x = require(...)`, else at the very top. Detection is by the config's module
 * format (`esm`), not by the substring "import", which also appears in the stock JSDoc `@type {import('tailwindcss').Config}`.
 */
export function addBrandPresetRef(src, line, { esm }) {
  let out;
  if (esm) out = addImportLine(src, line);
  else {
    const requires = [...src.matchAll(/^(?:const|let|var)\s.+require\(.+\);?\s*$/gm)];
    if (!requires.length) out = `${line}\n${src}`;
    else {
      const last = requires[requires.length - 1];
      const at = last.index + last[0].length;
      out = `${src.slice(0, at)}\n${line}${src.slice(at)}`;
    }
  }
  // Reference it in the `presets` array (after the Shavin preset when that is already there).
  if (out.includes("presets:")) {
    out = /tailwind-preset|shavinPreset/.test(out)
      ? out.replace(/(presets:\s*\[.*?(?:tailwind-preset|shavinPreset).*?)(\s*\])/, "$1, brandPreset$2")
      : out.replace(/presets:\s*\[/, "presets: [brandPreset, ");
  }
  return out;
}

/**
 * Next 15 dev answers 500 on EVERY request on Node 22.12.0 to 22.13.x when `next.config.ts` has any runtime import (even
 * `import path from "node:path"`): the config is compiled to CommonJS and the CSS pipeline's require() of an ES module then
 * fails with ERR_REQUIRE_ESM. Fixed from Node 22.14 (checked on 22.14 to 22.18). Found by the fresh-consumer harness.
 * `init` must therefore not add an import to a TypeScript Next config on those Node versions.
 */
export function nextTsConfigImportBreaksDev(file, nodeVersion) {
  if (!/\.m?ts$/.test(file)) return false;
  const [major, minor] = String(nodeVersion).split(".").map(Number);
  return major === 22 && minor >= 12 && minor <= 13;
}

/** Put `line` after the file's last `import` statement, or at the top. */
export function addImportLine(src, line) {
  if (src.includes(line)) return src;
  const imports = [...src.matchAll(/^import\s.+$/gm)];
  if (!imports.length) return `${line}\n${src}`;
  const last = imports[imports.length - 1];
  const at = last.index + last[0].length;
  return `${src.slice(0, at)}\n${line}${src.slice(at)}`;
}

/**
 * Insert CSS @import lines so they load right after Tailwind's own import (`@import "tailwindcss"`
 * in v4), which is where the docs put them; with no Tailwind import, after the last @import; with
 * none at all, at the top. Lines already present are skipped. Returns { src, added }.
 */
export function addCssImports(src, lines) {
  const missing = lines.filter((l) => !src.includes(l));
  if (!missing.length) return { src, added: [] };
  const block = missing.join("\n");
  const tw = src.match(/@import\s+["']tailwindcss["'][^;]*;/);
  if (tw) {
    const end = tw.index + tw[0].length;
    return { src: src.slice(0, end) + "\n" + block + src.slice(end), added: missing };
  }
  const imports = [...src.matchAll(/@import\s[^;]+;/g)];
  if (imports.length) {
    const last = imports[imports.length - 1];
    const end = last.index + last[0].length;
    return { src: src.slice(0, end) + "\n" + block + src.slice(end), added: missing };
  }
  return { src: block + "\n" + src, added: missing };
}

/**
 * Vite / plain React entry: wrap the JSX passed to `createRoot(…).render(…)` (or `ReactDOM.render`)
 * in the provider, keeping <StrictMode> on the outside. Returns the new source, or null when the
 * file has no render call with a JSX argument.
 */
export function wrapRenderCall(src, providerTag = "<ThemeProvider>") {
  const call = src.match(/\.render\(\s*/);
  if (!call) return null;
  const argStart = call.index + call[0].length;
  if (src[argStart] !== "<") return null;
  let depth = 1;
  let i = call.index + call[0].indexOf("(") + 1;
  for (; i < src.length; i++) {
    if (src[i] === "(") depth++;
    else if (src[i] === ")" && --depth === 0) break;
  }
  if (depth !== 0) return null;
  // The JSX argument ends before the closing paren (or before a second argument, e.g. a container).
  let arg = src.slice(argStart, i);
  const rest = arg.match(/>\s*,[\s\S]*$/);
  const tail = rest ? arg.slice(rest.index + 1) : "";
  if (rest) arg = arg.slice(0, rest.index + 1);
  const jsx = arg.trimEnd();
  const trailing = arg.slice(jsx.length);

  const strict = jsx.match(/^<(React\.)?StrictMode>([\s\S]*)<\/(React\.)?StrictMode>$/);
  const closeTag = "</ThemeProvider>";
  let wrapped;
  if (strict) {
    const open = `<${strict[1] ?? ""}StrictMode>`;
    const close = `</${strict[3] ?? ""}StrictMode>`;
    wrapped = `${open}\n    ${providerTag}\n      ${strict[2].trim()}\n    ${closeTag}\n  ${close}`;
  } else if (call[0].includes("\n")) {
    wrapped = `${providerTag}\n    ${jsx}\n  ${closeTag}`;
  } else {
    // Single-line call: break it onto its own lines.
    wrapped = `\n  ${providerTag}\n    ${jsx}\n  ${closeTag}${tail ? "" : "\n"}`;
  }
  return src.slice(0, argStart) + wrapped + trailing + tail + src.slice(i);
}

/** The frameworks `shavin init` can set up today. Everything else is planned, not available. */
export const SUPPORTED_FRAMEWORKS = ["nextjs", "vite"];
export const SUPPORTED_FRAMEWORKS_TEXT = "Next.js and Vite (with React 19)";

/**
 * Can `shavin init` set this project up? Pure: reads only package.json (through the declared deps) and the
 * result of detectFramework. Supported means Next.js, or Vite with React. Anything else (Remix, Astro,
 * SvelteKit, Nuxt, Angular, no framework at all, a monorepo root without an app) fails with what was found
 * and what to do.
 * @param {string} cwd
 * @param {{ framework: string, name?: string, source?: string }} fw  result of detectFramework(cwd)
 * @returns {{ ok: true } | { ok: false, found: string, reason: string, lines: string[] }}
 *   `lines` is the full recovery text, plain, one line per entry (the command colours it).
 */
export function checkFrameworkSupport(cwd, fw) {
  if (fw.framework === "nextjs") return { ok: true };
  const deps = readDeclaredDeps(cwd);
  if (fw.framework === "vite" && deps["react"]) return { ok: true };

  let found;
  let reason;
  if (fw.framework === "vite") {
    found = "Vite without React";
    reason = "Shavin is a React design system: this Vite project does not list react in package.json.";
  } else if (fw.framework === "remix" || fw.framework === "other") {
    found = fw.name || "an unsupported framework";
    reason = `${found} is not supported yet.`;
  } else {
    const hasPkg = existsSync(resolve(cwd, "package.json"));
    found = hasPkg ? "no Next.js or Vite app" : "no package.json";
    reason = hasPkg
      ? "No Next.js or Vite app was found in this folder (checked package.json, config files and src/app or src/main)."
      : "There is no package.json in this folder, so there is no project to set up.";
  }
  const lines = [
    `Shavin init did not run: ${reason}`,
    `Supported today: ${SUPPORTED_FRAMEWORKS_TEXT}. Other frameworks are planned for later, not available yet.`,
    "Nothing was installed or changed in this folder.",
    "",
    "What to do:",
    "  1. Start from a supported app (pick one):",
    "       npx create-next-app@latest my-app                       Next.js",
    "       npm create vite@latest my-app -- --template react-ts    Vite + React",
    "  2. Go into it and run init there:",
    "       cd my-app && npx @shavin/cli init",
    "  3. Already have a Next.js or Vite app in a subfolder or a monorepo? cd into that app's folder and run init there, not at the repo root.",
    ...(fw.framework === "vite" ? ["  4. Vite without React: add react and react-dom (npm install react@19 react-dom@19) and the React plugin, then run init again."] : []),
  ];
  return { ok: false, found, reason, lines };
}

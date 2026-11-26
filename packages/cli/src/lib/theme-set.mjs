/**
 * theme-set — `shavin brand --color ... --display-font ... --body-font ... --mode ... --confirm`
 *
 * Applies a theme choice in one step: the ThemeProvider props in the root layout, the labelled lines in
 * SHAVIN.md and `.shavin/config.json`. `--confirm` records that the user has seen the theme
 * (`brandConfirmed: true`); until then the MCP reminds the agent to tell the user what it chose.
 *
 * The name lists mirror @shavin/ui's theme presets; tests/unit/theme-set-lists.test.ts keeps them in step.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { relPosix } from "./paths.mjs";
import { readJsonFile, invalidJsonMessage } from "./json-file.mjs";

export const BRAND_PRESET_NAMES = [
  "monochrome", "tomato", "red", "ruby", "crimson", "pink", "plum", "purple", "violet", "iris", "indigo", "blue",
  "cyan", "teal", "jade", "green", "grass", "lime", "mint", "sky", "amber", "gold", "bronze", "brown",
];

export const FONT_NAMES = [
  "Aboreto", "Barlow", "Baskervville", "BBH Bartle", "Bebas Neue", "Figtree", "Fragment Mono", "Fraunces",
  "Funnel Display", "Funnel Sans", "Google Sans", "Google Sans Flex", "Host Grotesk", "Inter", "JetBrains Mono",
  "Jura", "Lexend", "Lora", "Montserrat", "Montserrat Alternates", "Noto Serif", "Nunito Sans", "Onest",
  "Open Sans", "Outfit", "Playfair Display", "Plus Jakarta Sans", "PT Serif", "Public Sans", "Rethink Sans",
  "Roboto", "Saira", "Source Serif 4", "Space Grotesk", "Staatliches", "Titillium Web", "Urbanist", "Work Sans",
];

/** Grey scale hue: "neutral" keeps the plain grey (default), "brand" tints the greys toward the brand colour (opt-in). */
export const NEUTRALS_MODES = ["brand", "neutral"];
export const NEUTRALS_AMOUNTS = ["subtle", "medium"];
export const DEFAULT_NEUTRALS = "neutral";
export const DEFAULT_NEUTRALS_AMOUNT = "subtle";

export const MODES = { "dark-first": "dark", "light-first": "light", system: "system" };

const LAYOUT_CANDIDATES = [
  "src/app/layout.tsx", "app/layout.tsx", "src/app/layout.jsx", "app/layout.jsx",
  "src/main.tsx", "src/main.jsx", "src/index.tsx", "src/App.tsx", "pages/_app.tsx", "src/pages/_app.tsx",
];

/** Reads `--flag value` and `--flag=value`. */
export function readFlag(args, name) {
  const eq = args.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = args.indexOf(name);
  if (i !== -1 && args[i + 1] && !args[i + 1].startsWith("--")) return args[i + 1];
  return undefined;
}

export function isThemeInvocation(args) {
  return ["--color", "--display-font", "--body-font", "--mode", "--neutrals", "--neutrals-amount", "--confirm"].some((f) => args.some((a) => a === f || a.startsWith(`${f}=`)));
}

function canonicalFont(name) {
  return FONT_NAMES.find((f) => f.toLowerCase() === String(name).trim().toLowerCase());
}

/** Validates the flags; returns { values } or { error }. */
export function parseThemeFlags(args) {
  const values = {};
  const color = readFlag(args, "--color");
  if (color !== undefined) {
    const c = color.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) values.color = c.toLowerCase();
    else if (BRAND_PRESET_NAMES.includes(c.toLowerCase())) values.color = c.toLowerCase();
    else return { error: `Unknown colour "${color}". Use a hex (#0f766e) or one of: ${BRAND_PRESET_NAMES.join(", ")}.` };
  }
  for (const [flag, key] of [["--display-font", "displayFont"], ["--body-font", "bodyFont"]]) {
    const v = readFlag(args, flag);
    if (v === undefined) continue;
    const font = canonicalFont(v);
    if (!font) return { error: `Unknown font "${v}" for ${flag}. Use one of: ${FONT_NAMES.join(", ")}.` };
    values[key] = font;
  }
  const mode = readFlag(args, "--mode");
  if (mode !== undefined) {
    if (!MODES[mode]) return { error: `Unknown mode "${mode}". Use one of: ${Object.keys(MODES).join(", ")}.` };
    values.mode = mode;
  }
  const neutrals = readFlag(args, "--neutrals");
  if (neutrals !== undefined) {
    if (!NEUTRALS_MODES.includes(neutrals)) return { error: `Unknown --neutrals "${neutrals}". Use one of: ${NEUTRALS_MODES.join(", ")}.` };
    values.neutrals = neutrals;
  }
  const amount = readFlag(args, "--neutrals-amount");
  if (amount !== undefined) {
    if (!NEUTRALS_AMOUNTS.includes(amount)) return { error: `Unknown --neutrals-amount "${amount}". Use one of: ${NEUTRALS_AMOUNTS.join(", ")}.` };
    values.neutralsAmount = amount;
  }
  values.confirm = args.includes("--confirm");
  return { values };
}

function setJsxProp(attrs, name, value) {
  const without = attrs.replace(new RegExp(`\\s+${name}=(?:"[^"]*"|'[^']*'|\\{[^{}]*\\})`, "g"), "");
  return `${without} ${name}="${value}"`;
}

function removeJsxProp(attrs, name) {
  return attrs.replace(new RegExp(`\\s+${name}=(?:"[^"]*"|'[^']*'|\\{[^{}]*\\})`, "g"), "");
}

/** Patches the first plain <ThemeProvider ...> opening tag. Returns the new source or null. */
export function patchThemeProvider(src, props) {
  if (!/import\s*\{[^}]*\bThemeProvider\b[^}]*\}\s*from\s*["']@shavin\/ui["']/.test(src)) return null;
  const m = src.match(/<ThemeProvider\b([^<>]*?)(\/?)>/);
  if (!m) return null;
  let attrs = m[1];
  // A value of null removes the prop (used for the defaults of the neutrals options, which are not written out).
  for (const [name, value] of Object.entries(props)) attrs = value === null ? removeJsxProp(attrs, name) : setJsxProp(attrs, name, value);
  return src.replace(m[0], `<ThemeProvider${attrs}${m[2]}>`);
}

function setLabelLine(md, label, value, insertAfterLabel) {
  const re = new RegExp(`^(- \\*\\*${label}\\*\\*:).*$`, "m");
  const line = `- **${label}**: \`${value}\``;
  if (re.test(md)) return md.replace(re, line);
  if (insertAfterLabel) {
    const after = new RegExp(`^(- \\*\\*${insertAfterLabel}\\*\\*:.*)$`, "m");
    if (after.test(md)) return md.replace(after, `$1\n${line}`);
  }
  return md;
}

/**
 * Applies the values. Returns { changed: string[], paste: string[], notes: string[] }.
 * `paste` carries ThemeProvider lines to add by hand when the layout could not be patched.
 */
export function applyTheme(cwd, values) {
  const changed = [];
  const paste = [];
  const notes = [];

  const providerProps = {};
  if (values.color) providerProps.brandColor = values.color;
  if (values.displayFont) providerProps.displayFont = values.displayFont;
  if (values.bodyFont) providerProps.bodyFont = values.bodyFont;
  if (values.mode) providerProps.defaultTheme = MODES[values.mode];
  // Only non-default neutrals choices appear in the layout; the defaults (neutral, subtle) are what the provider does anyway.
  if (values.neutrals) providerProps.neutrals = values.neutrals === DEFAULT_NEUTRALS ? null : values.neutrals;
  if (values.neutralsAmount) providerProps.neutralsAmount = values.neutralsAmount === DEFAULT_NEUTRALS_AMOUNT ? null : values.neutralsAmount;

  if (Object.keys(providerProps).length) {
    let patched = false;
    for (const rel of LAYOUT_CANDIDATES) {
      const p = join(cwd, rel);
      if (!existsSync(p)) continue;
      const src = readFileSync(p, "utf8");
      const next = patchThemeProvider(src, providerProps);
      if (next && next !== src) {
        writeFileSync(p, next, "utf8");
        changed.push(relPosix(cwd, p));
        patched = true;
        break;
      }
      if (next === src) { patched = true; break; }
    }
    if (!patched) {
      if (Object.values(providerProps).some((v) => v !== null)) paste.push(`<ThemeProvider ${Object.entries(providerProps).filter(([, v]) => v !== null).map(([k, v]) => `${k}="${v}"`).join(" ")}>`);
      notes.push("No plain <ThemeProvider> found in the root layout; add the props above by hand.");
    }
  }

  const mdPath = ["SHAVIN.md", "shavin.md"].map((f) => join(cwd, f)).find((p) => existsSync(p));
  if (mdPath) {
    let md = readFileSync(mdPath, "utf8");
    const before = md;
    if (values.color) md = setLabelLine(md, "Primary Brand", values.color);
    if (values.mode) md = setLabelLine(md, "Theme Mode", values.mode);
    if (values.neutrals || values.neutralsAmount) {
      const cur = md.match(/^- \*\*Neutrals\*\*:\s*`?([^`\n]*)`?/m);
      const [curMode, curAmount] = cur ? cur[1].split("/").map((x) => x.trim()) : [];
      md = setLabelLine(md, "Neutrals", `${values.neutrals || curMode || DEFAULT_NEUTRALS} / ${values.neutralsAmount || curAmount || DEFAULT_NEUTRALS_AMOUNT}`, "Theme Mode");
    }
    if (values.displayFont || values.bodyFont) {
      const cur = md.match(/^- \*\*Display \/ Body Font\*\*:\s*`?([^`\n]*)`?/m);
      const [curD, curB] = cur && !/unset/i.test(cur[1]) ? cur[1].split("/").map((s) => s.trim()) : [];
      const d = values.displayFont || curD || values.bodyFont;
      const b = values.bodyFont || curB || values.displayFont;
      md = setLabelLine(md, "Display / Body Font", `${d} / ${b}`, "Primary Brand");
    }
    if (md !== before) {
      writeFileSync(mdPath, md, "utf8");
      changed.push(relPosix(cwd, mdPath));
    }
  }

  const cfgPath = join(cwd, ".shavin", "config.json");
  let cfg = {};
  if (existsSync(cfgPath)) {
    try {
      cfg = readJsonFile(cfgPath);
    } catch (err) {
      // Writing a fresh file over one we cannot read would throw its other settings away.
      notes.push(invalidJsonMessage(".shavin/config.json", err, "the choice was not recorded there"));
      return { changed, paste, notes };
    }
  }
  cfg.presets = cfg.presets || {};
  if (values.color) cfg.presets.brandColor = values.color;
  if (values.displayFont) cfg.presets.displayFont = values.displayFont;
  if (values.bodyFont) cfg.presets.bodyFont = values.bodyFont;
  if (values.mode) cfg.presets.mode = values.mode;
  // Choosing a colour records the neutrals default too, so the config shows what the provider does.
  if (values.color) {
    cfg.presets.neutrals ??= DEFAULT_NEUTRALS;
    cfg.presets.neutralsAmount ??= DEFAULT_NEUTRALS_AMOUNT;
  }
  if (values.neutrals) cfg.presets.neutrals = values.neutrals;
  if (values.neutralsAmount) cfg.presets.neutralsAmount = values.neutralsAmount;
  if (values.confirm) cfg.brandConfirmed = true;
  mkdirSync(dirname(cfgPath), { recursive: true });
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), "utf8");
  changed.push(relPosix(cwd, cfgPath));

  return { changed, paste, notes };
}

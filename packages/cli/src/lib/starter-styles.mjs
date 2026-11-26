/**
 * The styles `create-next-app` leaves in app/globals.css: `--background` / `--foreground` as plain white and
 * near-black (flipped by a prefers-color-scheme block) and `body { font-family: Arial, Helvetica, sans-serif }`.
 * They come after Shavin's imports and win over Shavin's body rules, so a freshly set-up page is Arial on white and
 * the Shavin canvas, text and font tokens are never used.
 *
 * `neutraliseStarterStyles` rewrites only the known stock blocks (Next 14 and Next 15, Tailwind 3 and 4, with or
 * without a src folder). Any other file is left as it is: a stylesheet the user has changed is theirs. Pure: no
 * file access and no output, so init, check and the tests share it.
 */

const stockToRegex = (text) =>
  new RegExp(text.trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s*"), "");

/** `:root { --background: #ffffff; --foreground: #171717; }`, with the usual spellings of white. */
const STOCK_ROOT = /:root\s*\{\s*--background:\s*#(?:ffffff|fff)\s*;\s*--foreground:\s*#171717\s*;\s*\}/;
const STOCK_DARK = stockToRegex(`@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}`);
/** Next 15 writes background, color, font-family; Next 14 writes color, background, font-family. */
const STOCK_BODY = [
  stockToRegex(`body { background: var(--background); color: var(--foreground); font-family: Arial, Helvetica, sans-serif; }`),
  stockToRegex(`body { color: var(--foreground); background: var(--background); font-family: Arial, Helvetica, sans-serif; }`),
];

const STARTER_BODY_FONT = /body\s*\{[^}]*font-family:\s*Arial,\s*Helvetica,\s*sans-serif/;
const ALREADY = /--background:\s*rgb\(\s*var\(--bg-canvas\)\s*\)/;

const NEW_ROOT = ":root {\n  --background: rgb(var(--bg-canvas));\n  --foreground: rgb(var(--fg));\n}";
const NEW_BODY = "body {\n  background: var(--background);\n  color: var(--foreground);\n  font-family: var(--font-body), ui-sans-serif, system-ui, sans-serif;\n}";

/** True when the stylesheet still has the starter body style (Arial) and has not been fixed. */
export function hasStarterBodyStyle(css) {
  const text = String(css).replace(/^﻿/, "");
  return STARTER_BODY_FONT.test(text) && !ALREADY.test(text);
}

/**
 * @returns {{ css: string, status: "fixed" | "already" | "none" | "edited" }}
 *   fixed   the stock blocks were replaced
 *   already a previous run did it: nothing to change
 *   none    no starter body style in the file
 *   edited  the starter style is there but the file differs from the stock one: left alone, css is unchanged
 */
export function neutraliseStarterStyles(css) {
  const bom = String(css).startsWith("﻿") ? "﻿" : "";
  const raw = String(css).slice(bom.length);
  if (ALREADY.test(raw)) return { css, status: "already" };
  if (!STARTER_BODY_FONT.test(raw)) return { css, status: "none" };

  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  let text = raw.replace(/\r\n/g, "\n");

  const body = STOCK_BODY.find((re) => re.test(text));
  const hasDarkBlock = /prefers-color-scheme:\s*dark/.test(text);
  if (!STOCK_ROOT.test(text) || !body || (hasDarkBlock && !STOCK_DARK.test(text))) return { css, status: "edited" };

  text = text.replace(STOCK_ROOT, NEW_ROOT).replace(body, NEW_BODY);
  if (hasDarkBlock) text = text.replace(new RegExp(STOCK_DARK.source + "\\n*"), "");
  return { css: bom + (eol === "\r\n" ? text.replace(/\n/g, "\r\n") : text), status: "fixed" };
}

/** The edit to make by hand in `file`. */
export function starterStylesFix(file) {
  return `in ${file}: set --background to rgb(var(--bg-canvas)) and --foreground to rgb(var(--fg)) in :root, delete the @media (prefers-color-scheme: dark) block, and set the body font-family to var(--font-body), ui-sans-serif, system-ui, sans-serif.`;
}

/** What to tell the user about a stylesheet init did not rewrite. `file` is the path shown to the user. */
export function starterStylesAdvice(file) {
  return `${file} still has the create-next-app starter styles (the page body is Arial on plain white, and the Shavin canvas, text and font tokens are not used), and it differs from the stock file, so init left it alone. Make this edit by hand, ${starterStylesFix(file)}`;
}

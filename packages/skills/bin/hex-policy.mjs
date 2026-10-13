// GENERATED from packages/block-schema/hex-policy.mjs by scripts/sync-hex-policy.mjs — do not edit.
/**
 * hex-policy — the ONE context-aware "no raw hex colour" rule.
 *
 * Shared by every checker (scripts/lint-tokens.mjs, @shavin/mcp validate_code /
 * autofix_code / synthesize gate / steer / project audit, @shavin/cli publish,
 * the community quality gate, evals graders). Pure, zero-dependency ESM so Node
 * scripts, .mjs packages and TS apps can all import it.
 * packages/skills/bin/hex-policy.mjs is a GENERATED copy (zero-dep package) —
 * regenerate with `node scripts/sync-hex-policy.mjs`; `--check` gates drift.
 *
 * A `#…` hex run is a VIOLATION only when it is unmistakably a colour:
 *   1. any hex in a CSS/SCSS source (lang "css");
 *   2. inside a `style` prop/attribute/object on the same line;
 *   3. a Tailwind arbitrary value: `bg-[#…]`, `fill-[#…]`, `[--x:#…]`, …;
 *   4. the value of a colour-ish key/prop/attr: color, background(-color), bg,
 *      fill, stroke, stop-color/stopColor, border*, outline*, *shadow, any
 *      `*Color` / `*colour` key — also inside gradient()/rgba()/color-mix();
 *   5. a standalone string literal whose whole value is a hex AND it contains
 *      an a–f letter, OR has 6/8 digits, OR is a repeated-digit grey (#000,
 *      #999), OR carries an alpha suffix (`#000/50`).
 * NOT flagged: JSX text / human copy ("Order #1543", "Shell #4410",
 * "Invoice #A1B2-77"), digit-only short ids ("#142") outside colour contexts,
 * URL fragments (`href="#faq"`, `/docs#abc`, `url(#grad)`), HTML entities
 * (`&#123;`), markdown headings, and 5/7-digit runs (never valid colours).
 * Opt-out stays the caller's job: `// ds-lint-disable-next-line no-hex`.
 */

/** #rgb #rgba #rrggbb #rrggbbaa — not followed by a word char / hyphen. */
const HEX_RE = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;

/** Chars allowed right before `#` (else it's a URL fragment / id / entity). */
const PRE_OK = /[\s"'`[(,:={>_]/;

/** Colour-ish key/prop/attr directly assigning this value (rule 4). */
const COLOR_KEY_RE =
  /(?<![\w$-])(?:[\w-]*colou?r|background[\w-]*|bg|fill|stroke|border[\w-]*|outline[\w-]*|[\w-]*shadow)\s*["']?\s*[:=]\s*\{?\s*["'`]?[^;"'`{}]*$/i;

/** Inside a CSS colour function in the same string/line. */
const COLOR_FN_RE = /(?:(?:linear|radial|conic)-gradient|rgba?|hsla?|color-mix)\([^)]*$/i;

/** Tailwind arbitrary value: `xxx-[…#` or `[--prop:#` / `[color:#`. */
const ARBITRARY_RE = /(?:-\[|(?:^|[\s"'`{])\[[\w-]+:)[^\]\s"'`]*$/;

/** `style={{ … #` / `style="… #` / `style: { … #` on the same line. */
const STYLE_RE = /\bstyle\s*(?:=\s*\{\{?[^}]*|=\s*["'][^"']*|:\s*\{[^}]*)$/;

/** String values passed to URL / selector-ish props are never colours. */
const URLISH_KEY_RE =
  /(?:href|to|src|action|hash|anchor|link|path|url|selector|querySelector(?:All)?\(|getElementById\(|closest\()\s*[:=(]?\s*\{?\s*$/i;

/** Alpha / opacity suffix after a standalone hex: `#000/50`, `#000 / 0.4`. */
const ALPHA_SUFFIX_RE = /^\s*\/\s*[\d.]+%?\s*$/;

/** Find the string literal (on this line) enclosing column `col`, if any. */
function enclosingString(line, col) {
  let quote = null;
  let start = -1;
  for (let i = 0; i < col; i++) {
    const c = line[i];
    if (quote) {
      if (c === "\\") { i++; continue; }
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === "`") {
      quote = c;
      start = i;
    }
  }
  if (!quote) return null;
  let end = line.length;
  for (let i = col; i < line.length; i++) {
    const c = line[i];
    if (c === "\\") { i++; continue; }
    if (c === quote) { end = i; break; }
  }
  return { quote, start, end, value: line.slice(start + 1, end) };
}

/** True when a bare hex (no context) is unmistakably a colour (rule 5). */
export function looksLikeColorHex(hex, suffix = "") {
  const digits = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3,8}$/.test(digits) || ![3, 4, 6, 8].includes(digits.length)) return false;
  if (/[a-f]/i.test(digits)) return true;
  if (digits.length === 6 || digits.length === 8) return true;
  if (/^(\d)\1+$/.test(digits)) return true;
  return ALPHA_SUFFIX_RE.test(suffix);
}

/**
 * Classify one hex match on a line. Returns the reason string when it is a
 * colour violation, or null when it is content (ids, fragments, copy).
 */
function classify(line, col, hex, lang) {
  if (lang === "css") {
    return /url\(\s*["']?$/i.test(line.slice(0, col)) ? null : "css";
  }
  const before = col > 0 ? line[col - 1] : "";
  if (before && !PRE_OK.test(before)) return null; // `/docs#abc`, `&#123;`, `a#b`
  const prefix = line.slice(0, col);
  if (/url\(\s*["']?$/i.test(prefix)) return null; // SVG `url(#grad)`

  if (ARBITRARY_RE.test(prefix)) return "arbitrary-class";

  const str = enclosingString(line, col);
  const before_str = str ? line.slice(0, str.start) : prefix;
  if (str && URLISH_KEY_RE.test(before_str)) return null; // href="#abc"

  if (STYLE_RE.test(prefix)) return "style";
  if (COLOR_KEY_RE.test(prefix)) return "color-key";
  if (str && COLOR_FN_RE.test(line.slice(str.start + 1, col))) return "color-fn";

  if (str) {
    const value = str.value;
    const offset = col - (str.start + 1);
    const lead = value.slice(0, offset);
    const rest = value.slice(offset + hex.length);
    if (lead.trim() === "" && (rest.trim() === "" || ALPHA_SUFFIX_RE.test(rest))) {
      return looksLikeColorHex(hex, rest) ? "standalone" : null;
    }
  }
  return null; // JSX text / human copy / prose
}

/**
 * Find raw-hex COLOUR violations in source text.
 * @param {string} source  code (one line or a whole file)
 * @param {{ lang?: "css" | "js", filename?: string }} [opts]
 * @returns {{ hex: string, index: number, line: number, reason: string }[]}
 */
export function findHexViolations(source, opts = {}) {
  const lang =
    opts.lang ?? (opts.filename && /\.(?:css|scss|sass|less|pcss)$/i.test(opts.filename) ? "css" : "js");
  const out = [];
  const lines = String(source ?? "").split("\n");
  let base = 0;
  for (let ln = 0; ln < lines.length; ln++) {
    const line = lines[ln];
    HEX_RE.lastIndex = 0;
    let m;
    while ((m = HEX_RE.exec(line))) {
      const reason = classify(line, m.index, m[0], lang);
      if (reason) out.push({ hex: m[0], index: base + m.index, line: ln + 1, reason });
    }
    base += line.length + 1;
  }
  return out;
}

/** Convenience: the flagged hex strings (dupes kept, source order). */
export function matchHexColors(source, opts) {
  return findHexViolations(source, opts).map((v) => v.hex);
}

/** Convenience: does the source contain at least one hex colour violation? */
export function hasHexViolation(source, opts) {
  return findHexViolations(source, opts).length > 0;
}

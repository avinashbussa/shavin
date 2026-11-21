/**
 * Enforcement rules shared by validate_code, audit_source, check_page and the edit hook (shavin-mcp --hook).
 *
 * What the baseline eval showed: agents rarely hand-roll a plain <button>, but they will import another
 * UI library, imitate a component with a styled <div>, set sizes with arbitrary values, colour things
 * with inline styles, and ship screens with no loading/empty/error state. These checks make those FAIL
 * instead of warn, and they are coexistence-aware: files that SHAVIN.md lists as legacy (another UI
 * library the project already used) are reported, not failed.
 *
 * Pure string analysis, no dependencies. Every finding: { rule, severity: "error" | "warn", line, message, fix }.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// ── what counts as a foreign UI library ─────────────────────────────────────
const FOREIGN_UI = [
  /^@radix-ui\//, /^@headlessui\//, /^@mui\//, /^@emotion\/(react|styled)$/, /^@chakra-ui\//, /^antd$/, /^@ant-design\//, /^@mantine\//, /^react-bootstrap$/,
  /^reactstrap$/, /^@ariakit\//, /^@nextui-org\//, /^@heroui\//, /^semantic-ui-react$/, /^@blueprintjs\//, /^primereact\//, /^@fluentui\//, /^@react-aria\//,
  /^react-aria(-components)?$/, /^@ark-ui\//, /^@base-ui(-components)?\//, /^sonner$/, /^vaul$/, /^cmdk$/, /^react-hot-toast$/, /^react-toastify$/, /^react-select$/,
  /^@shadcn\//, /^shadcn/,
];
const SHADCN_LOCAL = /(^|\/)components\/ui\//;
/** `@shavin/ui/<sub>` imports that are fine; everything else under @shavin/ui/ is a deep import. */
const SHAVIN_SUBPATH_OK = /^(server|panels|icons)$|\.(css|json|mjs)$|^(tailwind-preset|brand-preset)$/;

// ── helpers ─────────────────────────────────────────────────────────────────
const lineOf = (code, index) => code.slice(0, index).split("\n").length;

/** Blank out comments and template literals (keeps offsets), so code samples in strings do not trigger rules. */
export function blankNonCode(code) {
  let out = "";
  let i = 0;
  while (i < code.length) {
    const c = code[i], n = code[i + 1];
    if (c === "/" && n === "*") {
      const end = code.indexOf("*/", i + 2);
      const stop = end < 0 ? code.length : end + 2;
      out += code.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
    } else if (c === "/" && n === "/" && code[i - 1] !== ":") {
      const end = code.indexOf("\n", i);
      const stop = end < 0 ? code.length : end;
      out += " ".repeat(stop - i);
      i = stop;
    } else if (c === "`") {
      // template literal: keep the backticks, blank the middle unless it is a className template (keep those readable)
      let j = i + 1;
      while (j < code.length && !(code[j] === "`" && code[j - 1] !== "\\")) j++;
      const body = code.slice(i + 1, j);
      const keep = /\b(?:rounded|border|bg|px|py|animate|text|p)-/.test(body) && !/[<>]\s*[A-Za-z]/.test(body);
      out += keep ? code.slice(i, j + 1) : "`" + body.replace(/[^\n]/g, " ") + "`";
      i = j + 1;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

/** Opening tags `<div className="…" onClick={…}>` as { tag, attrs, index }. Handles `{…}` and quotes inside attributes. */
function openingTags(code) {
  const tags = [];
  const re = /<([a-z][a-z0-9]*)(?=[\s/>])/g;
  let m;
  while ((m = re.exec(code))) {
    let i = re.lastIndex, depth = 0, quote = null;
    for (; i < code.length; i++) {
      const c = code[i];
      if (quote) { if (c === quote && code[i - 1] !== "\\") quote = null; continue; }
      if (depth === 0 && (c === '"' || c === "'")) { quote = c; continue; }
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
    }
    tags.push({ tag: m[1], attrs: code.slice(re.lastIndex, i), index: m.index });
    re.lastIndex = Math.max(re.lastIndex, m.index + 1);
  }
  return tags;
}

const classText = (attrs) => {
  const m = attrs.match(/\bclassName\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([\s\S]*)\})/);
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : "";
};

// ── the rules ───────────────────────────────────────────────────────────────
/**
 * @param {string} code
 * @returns {{ rule: string, severity: "error"|"warn", line: number, message: string, fix: string }[]}
 */
export function checkEnforcement(code) {
  const findings = [];
  const add = (rule, index, message, fix, severity = "error") => findings.push({ rule, severity, line: lineOf(code, index), message, fix });
  const src = blankNonCode(code);

  // 1. Hand-rolled controls
  const TEXTLIKE = "TextField";
  const INPUT_TYPE = {
    text: TEXTLIKE, email: TEXTLIKE, password: TEXTLIKE, search: TEXTLIKE, tel: TEXTLIKE, url: TEXTLIKE, number: TEXTLIKE,
    checkbox: "Checkbox (or Switch for an on/off setting)", radio: "RadioGroup", range: "Slider", date: "DatePicker", time: "TimePicker", color: "ColorPicker",
    submit: "Button", reset: "Button", button: "Button",
    // no Shavin counterpart, so never flagged: hidden, file, image, datetime-local, month, week
  };
  const CONTROL = { button: "Button / IconButton", input: "TextField / Checkbox / Radio / Switch", select: "Select / Dropdown", textarea: "TextArea", table: "Table, TableHeader, TableRow, TableCell", dialog: "Dialog / AlertDialog" };
  for (const t of openingTags(src)) {
    if (!(t.tag in CONTROL)) continue;
    if (t.tag === "input") {
      // Map by type; flag only where Shavin has a component. hidden, file, image and a dynamic type={…} are left alone.
      const type = t.attrs.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)')/);
      const dynamic = /\btype\s*=\s*\{/.test(t.attrs);
      const kind = (type ? (type[1] ?? type[2]) : "text").toLowerCase();
      const target = INPUT_TYPE[kind];
      if (dynamic || !target) continue;
      add("raw-control", t.index, `Raw <input type="${kind}">`, `Use ${target} from @shavin/ui`);
      continue;
    }
    add("raw-control", t.index, `Raw <${t.tag}>`, `Use ${CONTROL[t.tag]} from @shavin/ui`);
  }

  // 2. Styled-element imitations of components
  const CLICKABLE_ROLES = "button|dialog|alertdialog|tab|tablist|tabpanel|switch|checkbox|radio|menu|menuitem|listbox|option|tooltip|progressbar|combobox|slider|alert|status";
  for (const t of openingTags(src)) {
    if (!/^(div|span|section|article|li|ul|a|p)$/.test(t.tag)) continue;
    const cls = classText(t.attrs);
    const role = t.attrs.match(/\brole\s*=\s*["']([a-z]+)["']/)?.[1];
    if (/\bonClick\s*=/.test(t.attrs) && /^(div|span|section|article|li)$/.test(t.tag)) {
      add("fake-component", t.index, `<${t.tag}> with onClick imitates a button`, "Use Button, IconButton or Link");
      continue;
    }
    if (role && new RegExp(`^(${CLICKABLE_ROLES})$`).test(role) && /^(div|span|section|article|li|ul)$/.test(t.tag)) {
      add("fake-component", t.index, `<${t.tag} role="${role}"> imitates a component`, `Use the Shavin component for role "${role}" (Button, Dialog, Tabs, Switch, Callout, Progress, …)`);
      continue;
    }
    if (/^(div|span|section|article|li)$/.test(t.tag) && /\banimate-spin\b/.test(cls)) { add("fake-component", t.index, "Hand-made spinner (animate-spin)", "Use Spinner"); continue; }
    if (/^(div|span)$/.test(t.tag) && /\banimate-pulse\b/.test(cls)) { add("fake-component", t.index, "Hand-made skeleton (animate-pulse)", "Use Skeleton or SkeletonMimic"); continue; }
    if (/^(div|section|article|li)$/.test(t.tag) && /\brounded/.test(cls) && /\b(border(?!-0)|shadow)/.test(cls) && /\b(bg-|p-\d|p[xy]-\d)/.test(cls)) {
      add("fake-component", t.index, `<${t.tag}> styled as a card (rounded + border/shadow + background/padding)`, "Use Card (children in <Flex direction=\"column\" gap=\"3\">), or Callout for a notice");
      continue;
    }
    if (/^(span|div)$/.test(t.tag) && /\brounded/.test(cls) && /\bpx-\d/.test(cls) && /\bpy-\d/.test(cls) && /\bbg-/.test(cls) && /\btext-(xs|sm|\[)/.test(cls)) {
      add("fake-component", t.index, `<${t.tag}> styled as a badge/chip`, "Use Badge (tone) for status, or Text for plain labels");
    }
  }
  // Foreign animation libraries for what Shavin ships as components are caught by the import rule below.

  // 3. Imports: foreign UI libraries, deep @shavin/ui imports
  const importRe = /(?:import\s+(?:[\w*{}\s,]+\s+from\s+)?|require\(\s*|import\(\s*)["']([^"']+)["']/g;
  let m;
  while ((m = importRe.exec(src))) {
    const spec = m[1];
    if (spec.startsWith("@shavin/ui/")) {
      const sub = spec.slice("@shavin/ui/".length);
      if (!SHAVIN_SUBPATH_OK.test(sub)) add("deep-import", m.index, `Deep import "${spec}"`, 'Import from the package root: import { … } from "@shavin/ui"');
      continue;
    }
    if (FOREIGN_UI.some((r) => r.test(spec)) || (SHADCN_LOCAL.test(spec) && !spec.startsWith("@shavin/"))) {
      add("foreign-ui", m.index, `Imports another UI library ("${spec}")`, "Use the @shavin/ui component. Existing legacy files are listed in SHAVIN.md; new code is Shavin only");
    }
  }

  // 4. Arbitrary type sizes
  const typeRe = /\b(text|leading|tracking)-\[([^\]\s]+)\]/g;
  while ((m = typeRe.exec(src))) {
    const v = m[2];
    if (/^(var\(|length:var|color:|family-name|absolute|image:)/.test(v)) continue;
    if (/^#|^rgb|^hsl|^oklch/.test(v)) continue; // colours are the hex/rgb rules
    if (/^-?\d*\.?\d+(px|rem|em|%|vw|vh|ch)?$/.test(v) || /^clamp\(|^calc\(|^min\(|^max\(/.test(v)) {
      add("arbitrary-type", m.index, `Arbitrary ${m[1]} size ${m[0]}`, m[1] === "text" ? 'Use <Text size="…"> / <Heading size="…"> (the type scale)' : "Use the component's own line-height and tracking (Text / Heading props)");
    }
  }

  // 5. Inline colour styles
  const styleRe = /\bstyle\s*=\s*\{\{([\s\S]*?)\}\}/g;
  while ((m = styleRe.exec(src))) {
    const body = m[1];
    const colourProp = body.matchAll(/\b(color|background|backgroundColor|borderColor|borderTopColor|borderBottomColor|borderLeftColor|borderRightColor|outlineColor|fill|stroke|boxShadow)\s*:\s*(["'`])([^"'`]*)\2/g);
    for (const c of colourProp) {
      if (/^\s*(var\(|inherit|currentColor|transparent|none|initial|unset)/.test(c[3])) continue;
      add("inline-colour", m.index, `Inline ${c[1]} style "${c[3].slice(0, 30)}"`, "Use semantic token classes (bg-surface, text-fg, border-hairline) or a token var(--…)");
    }
  }

  // 6. Removed focus rings (interaction states): warn, since a custom replacement can be fine
  const clsRe = /\bclassName\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  while ((m = clsRe.exec(src))) {
    const cls = m[1] ?? m[2];
    if (/(^|\s)(focus:|focus-visible:)?outline-none(\s|$)/.test(cls) && !/\bfocus-visible:|\bfocus:ring|\bfocus:border|\bfocus-within:/.test(cls)) {
      add("focus-removed", m.index, "A class list removes the focus outline without a replacement", "Keep the default focus ring (base.css draws it from --focus, --focus-width and --focus-offset; tune it with ThemeProvider focusRing), or give a replacement that uses focus-visible:ring-brand-text", "warn");
    }
  }

  // 7. Raw brand fill as a text colour: warn, since a decorative brand mark can be fine
  const rawBrand = /(?<![\w-])((?:[\w[\]=-]+:)*)text-brand(?![-\w])(\/\d+)?/g;
  while ((m = rawBrand.exec(src))) {
    add("raw-brand-text", m.index, `"${m[0]}" paints text or an icon with the brand fill, which fails contrast for light brands (lime, yellow) on light pages and for dark brands in dark mode`, `Use ${m[0].replace("text-brand", "text-brand-text")} (contrast-guaranteed brand text, 4.5:1 for any brand). text-brand-fg is for text on bg-brand-solid`, "warn");
  }

  // 8. Text on the raw brand fill: the exact fill often misses 4.5:1 for white text and looks wrong with dark text
  // (most presets). bg-brand-solid is the accessible fill; text-brand-fg is written for it.
  const lit = /"[^"\n]*"|'[^'\n]*'|`[^`]*`/g;
  while ((m = lit.exec(src))) {
    const t = m[0];
    const raw = /(?<![\w-])((?:[\w[\]=&:()-]+:)*)bg-brand(?![-\w/])/.exec(t);
    if (raw && /(?<![\w-])text-brand-fg(?![\w-])/.test(t)) {
      add("raw-brand-solid", m.index + raw.index, `"${raw[0]}" with text-brand-fg puts text on the exact brand fill, which misses 4.5:1 for white text on most brand colours`, `Use ${raw[0].replace("bg-brand", "bg-brand-solid")} (the accessible solid fill; hover:bg-brand-solid-hover for hover). Keep bg-brand for fills with no text on them`, "warn");
    }
  }

  // 8. Raw brand fill as a border, ring or outline: warn, since a decorative tint or divider can be fine.
  // Alpha tints (border-brand/30) are decorative by definition and are not matched.
  const rawBrandLine = /(?<![\w-])((?:[\w[\]=-]+:)*)((?:border(?:-[trblxy])?|ring|outline|divide))-brand(?![-\w/])/g;
  while ((m = rawBrandLine.exec(src))) {
    add("raw-brand-border", m.index, `"${m[0]}" draws a border, ring or outline with the brand fill, which falls below 3:1 (WCAG 1.4.11) for light brands (lime, yellow) on light pages and for dark brands in dark mode`, `Use ${m[1]}${m[2]}-brand-text (contrast-guaranteed, 3:1 or better for any brand) when the line shows a state (selected, checked, current, focus). Keyboard focus needs no class: the default ring follows --focus. A decorative divider can stay`, "warn");
  }

  return findings;
}

/** Findings as validate_code violation strings. Errors only; warnings are returned separately. */
export function enforcementViolations(code) {
  const f = checkEnforcement(code);
  return {
    errors: f.filter((x) => x.severity === "error").map((x) => `${x.message} (${x.rule}, line ${x.line}). ${x.fix}.`),
    dense: f.filter((x) => x.severity === "error").map((x) => `${x.rule}@L${x.line} ${x.message} -> ${x.fix}`),
    warnings: f.filter((x) => x.severity === "warn").map((x) => `${x.message} (${x.rule}, line ${x.line}). ${x.fix}.`),
  };
}

// ── legacy (coexistence) ────────────────────────────────────────────────────
/**
 * Paths SHAVIN.md lists as legacy (code from another UI library the project already had). Files there are
 * reported by the checks, not failed. `**Legacy paths**: \`src/components/ui, src/old\``.
 */
export function legacyPaths(dir) {
  const file = join(dir, "SHAVIN.md");
  if (!existsSync(file)) return [];
  const m = readFileSync(file, "utf8").match(/\*\*Legacy paths\*\*:\s*`([^`]*)`/);
  if (!m) return [];
  return m[1].split(",").map((p) => p.trim().replace(/^\.\//, "").replace(/\/+$/, "")).filter((p) => p && p.toLowerCase() !== "none");
}
export function isLegacyFile(relPath, legacy) {
  const r = String(relPath).replace(/\\/g, "/").replace(/^\.\//, "");
  return legacy.some((p) => r === p || r.startsWith(`${p}/`));
}

// ── required states (project level; used by check_page) ─────────────────────
const STATE_EVIDENCE = {
  loading: /\b(Skeleton|SkeletonMimic|Spinner)\b|\bisLoading\b|\bisPending\b|aria-busy|Suspense|<(Icon)?Button\b[^>]*\bloading\b/,
  empty: /\bEmptyState\b|\bempty\b|\bno\s+[\w ]{1,30}\s+(yet|found|match(?:es|ing)?|available)\b|\bnothing (here|to show|yet)\b|\b0 results\b|zero\s+(state|results)/i,
  error: /color=["']danger["']|\binvalid\b|\berrorMessage\b|\bFormErrorSummary\b|\bFormField\b[^>]*\berror=|role=["']alert["']|\bonError\b|\bsetError\b|\berror\.tsx\b|\bcatch\s*\(/,
  success: /\buseToast\b|\bToastProvider\b|\bToast\b|color=["']success["']|tone=["']success["']/,
  disabled: /\bdisabled\b|\bdisabledReason\b|\bisDisabled\b|aria-disabled/,
};
const STATE_FIX = {
  loading: "Skeleton / SkeletonMimic shaped like the content; Button loading for an action in progress",
  empty: 'EmptyState kind="empty" (or "first-time" / "no-results") with a Button that fixes it',
  error: 'Callout color="danger" with a retry Button; TextField errorMessage / FormField error; FormErrorSummary on submit',
  success: "useToast() success (ToastProvider inside ThemeProvider) or EmptyState kind=\"success\" for a finished flow",
  disabled: "Button disabledReason, or FormField disabled with the reason in its hint",
};

/**
 * @param {{ file: string, src: string }[]} files  non-legacy source files of the project
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function checkStates(files) {
  const all = files.map((f) => f.src).join("\n");
  const hasFile = (re) => files.some((f) => re.test(f.file));
  if (!/@shavin\/ui/.test(all)) return { errors: [], warnings: [] };
  const hasList = /<Table\b|<TableRow\b|<StatCard\b|<CardList\b|\.map\(\s*\(?\s*\w+[^)]*\)?\s*=>\s*\(?\s*<(Card|TableRow|ListItem|CardListItem)\b/.test(all);
  const hasForm = /<(TextField|TextArea|Select|Checkbox|Switch|RadioGroup)\b|<form\b|\bonSubmit\b/.test(all);
  const needs = [
    ...(hasList ? ["loading", "empty", "error"] : []),
    ...(hasForm ? ["error", "success", "disabled"] : []),
  ];
  const wanted = [...new Set(needs)];
  const errors = [];
  for (const state of wanted) {
    const dirEvidence = state === "loading" ? hasFile(/(^|\/)loading\.(t|j)sx$/) : state === "error" ? hasFile(/(^|\/)error\.(t|j)sx$/) : false;
    if (!dirEvidence && !STATE_EVIDENCE[state].test(all)) {
      const why = hasList && ["loading", "empty"].includes(state) ? "the project renders lists or tables" : hasForm && state !== "loading" ? "the project has forms" : "the project renders data";
      errors.push(`missing ${state} state: ${why} but nothing handles ${state}. Add ${STATE_FIX[state]}.`);
    }
  }
  // Site-level states: a not-found page and an error boundary (Next app router / pages router)
  const has = (re) => files.some((f) => re.test(f.file));
  const appRouter = has(/(^|\/)app\/(.*\/)?page\.(t|j)sx$/);
  const pagesRouter = !appRouter && has(/(^|\/)pages\/(?!_|api\/)[^/]+\.(t|j)sx$/);
  if (appRouter) {
    const base = (files.find((f) => /(^|\/)app\/(.*\/)?page\.(t|j)sx$/.test(f.file))?.file.match(/^(.*?app)\//) || [])[1] || "app";
    if (!has(/(^|\/)app\/not-found\.(t|j)sx$/)) errors.push(`missing not-found page: nothing handles unknown URLs, so visitors get the framework default. Create ${base}/not-found.tsx with a Heading, one line of Text and a Button back home.`);
    if (!has(/(^|\/)app\/(error|global-error)\.(t|j)sx$/)) errors.push(`missing error boundary: a runtime error shows the framework default. Create ${base}/error.tsx ("use client", props { error, reset }) with a Callout color="danger" and a retry Button calling reset(), and ${base}/global-error.tsx for the root layout.`);
  } else if (pagesRouter) {
    if (!has(/(^|\/)pages\/404\.(t|j)sx$/)) errors.push("missing not-found page: create pages/404.tsx with a Heading, one line of Text and a Button back home.");
    if (!has(/(^|\/)pages\/_error\.(t|j)sx$|(^|\/)pages\/500\.(t|j)sx$/)) errors.push('missing error page: create pages/_error.tsx (or pages/500.tsx) with a Callout color="danger" and a retry Button.');
  }
  return { errors, warnings: hasList || hasForm ? ["first-time state is not checked automatically: confirm there is welcome content with one primary action"] : [] };
}

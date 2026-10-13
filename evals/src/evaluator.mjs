import { matchHexColors } from "../../packages/block-schema/hex-policy.mjs";
/**
 * @shavin/ui — Native AI Code Evaluator Engine.
 * Evaluates generated TSX code on:
 * 1. Token & Color Compliance (0 hex, 0 RGB, 0 --n-* leaks)
 * 2. Concentric Radius & Spacing Math
 * 3. Accessibility & Radix Attributes (data-panel)
 * 4. Component Match % (expectedComponents coverage)
 * 5. Anti-Copy Slop & Content Realism
 * 6. Primitive Usage (no raw HTML, no glyphs, no inline styles)
 * 7. Prop Name & Value Compliance (weight not fontWeight, valid enums)
 * 8. Import Hygiene (root @shavin/ui only, no deep imports)
 */

// Components.json prop validation map (loaded lazily)
let _componentPropsCache = null;

function loadComponentProps() {
  if (_componentPropsCache) return _componentPropsCache;
  try {
    const { readFileSync } = await_readFileSync();
    const manifest = JSON.parse(readFileSync("components.json", "utf-8"));
    const map = {};
    for (const comp of manifest.components) {
      map[comp.name] = {
        variants: comp.variants || {},
        props: comp.props || [],
      };
    }
    _componentPropsCache = map;
    return map;
  } catch {
    return {};
  }
}

// Inline readFileSync without top-level import (evaluator is pure JS, no ESM imports needed at module level)
function await_readFileSync() {
  // eslint-disable-next-line no-global-assign
  const fs = globalThis.__shavinFs || (globalThis.__shavinFs = require("fs"));
  return fs;
}

// Known @shavin/ui primitive component names (for raw-HTML detection)
const SHAVIN_PRIMITIVES = new Set([
  "Box", "Flex", "Grid", "Container", "Section", "Text", "Heading", "Link",
  "Button", "IconButton", "Badge", "Card", "Avatar", "Separator", "Icon",
  "TextField", "TextArea", "Select", "Checkbox", "RadioGroup", "Radio",
  "Switch", "Slider", "Tooltip", "Popover", "Dialog", "AlertDialog",
  "Dropdown", "Menu", "ContextMenu", "Tabs", "Accordion", "Table", "List",
  "DataList", "Progress", "Skeleton", "Spinner", "Callout", "Stepper",
  "Toast", "Calendar", "DatePicker", "ColorPicker", "Combobox",
  "ScrollArea", "HoverCard", "Breadcrumbs", "Pagination", "Sidebar",
  "AppFrame", "TopBar", "Spotlight", "ChatBubble",
  "Drawer", "AspectRatio", "Kbd", "Code", "CodeBlock", "Blockquote",
  "Quote", "Em", "Strong", "BottomNav", "ActionBar", "CardList",
  "CardListItem", "CardRow", "Row", "StatCard", "Inset", "Layout",
  "ThemeProvider", "ThemeSwitcher", "SegmentedControl",
]);

// Mapping of raw HTML elements to their @shavin/ui equivalents
const HTML_TO_SHAVIN = {
  div: "Box or Container",
  span: "Text",
  p: "Text",
  h1: "Heading (as=\"h1\")",
  h2: "Heading (as=\"h2\")",
  h3: "Heading (as=\"h3\")",
  h4: "Heading (as=\"h4\")",
  h5: "Heading (as=\"h5\")",
  h6: "Heading (as=\"h6\")",
  button: "Button or IconButton",
  input: "TextField",
  textarea: "TextArea",
  select: "Select",
  label: "Text",
  ul: "List",
  ol: "List",
  li: "ListItem",
  img: "Image",
  video: "Video",
  table: "Table",
  nav: "Sidebar",
  header: "TopBar",
  main: "Section",
  section: "Section",
  article: "Card or Box",
  aside: "Box",
  footer: "Box",
};

// Prop name aliases that cause issues (wrong → correct)
// NOTE: 'align' is valid on Flex/Grid — only flag it on Text/Heading context
const PROP_NAME_ALIASES = {
  fontWeight: "weight",
  fontweight: "weight",
  textSize: "size",
  textsize: "size",
  textColor: "color",
  textcolor: "color",
  iconName: "name",
  iconname: "name",
  icon: "name",
  variantType: "variant",
  buttonVariant: "variant",
  buttonSize: "size",
  bg: "className",
  background: "className",
  alignment: "textAlign",
  rounded: "className",
  radius: "className",
};

// Known invalid prop values for specific components
const INVALID_PROP_VALUES = {
  Button: { tone: ["neutral", "default", "normal", "ghost"] }, // tone only allows "accent", "danger"
};

// Common unicode glyphs/emojis that AI agents use instead of <Icon>
const GLYPH_PATTERNS = [
  { regex: /[\u2713\u2714\u2715\u2716\u2717\u2718]/g, name: "Checkmark glyph (use <Icon name=\"Check\" />)" },
  { regex: /[\u2192\u2190\u2191\u2193\u2194\u279C\u27A4]/g, name: "Arrow glyph (use <Icon name=\"ArrowRight\" /> etc.)" },
  { regex: /[\u2605\u2606\u2729\u272A\u272B\u272C\u272D\u272E\u272F\u2730\u2731\u2732]/g, name: "Star glyph (use <Icon name=\"Star\" />)" },
  { regex: /[\u271A\u271B\u271D\u271E\u271F\u2720\u2721\u2722]/g, name: "Cross/plus glyph (use <Icon name=\"Plus\" /> or <Icon name=\"X\" />)" },
  { regex: /[\u00D7\u2715]/g, name: "X/close glyph (use <Icon name=\"X\" />)" },
  { regex: /[\u2022\u25CF\u25CB\u25AA\u25AB]/g, name: "Bullet/dot glyph (use <Icon name=\"Dot\" /> or <Icon name=\"Circle\" />)" },
  { regex: /[\u26A0\u26A1\u2691\u2705\u274C\u274E\u274F\u2139\u2709\u270F]/g, name: "Status/emoji glyph (use appropriate <Icon name=\"...\" />)" },
  { regex: /[\u2708\u2709\u270A\u270B\u270C\u270D\u270E\u270F\u2710\u2711\u2712]/g, name: "Hand/tool glyph (use appropriate <Icon name=\"...\" />)" },
  { regex: /[\u{1F300}-\u{1F9FF}]/gu, name: "Emoji range (use <Icon name=\"...\" />)" },
];

export function evaluateCode(code, expectedComponents = []) {
  const violations = [];
  let score = 100;

  if (!code || typeof code !== "string" || !code.trim()) {
    return {
      score: 0,
      violations: ["Empty or invalid code string"],
      metrics: {
        hexLeaks: 0,
        foundationLeaks: 0,
        literalRadiusLeaks: 0,
        componentCoverage: 0,
        rawHTMLElements: 0,
        glyphLeaks: 0,
        inlineStyles: 0,
        propNameIssues: 0,
        importIssues: 0,
      },
    };
  }

  // ── 1. Token & Color Compliance ──────────────────────────────────
  const hexMatches = matchHexColors(code);
  if (hexMatches.length > 0) {
    violations.push(`Hex color leaks found: ${hexMatches.join(", ")}`);
    score -= Math.min(25, hexMatches.length * 5);
  }

  if (/rgb\s*\(|rgba\s*\(/.test(code)) {
    violations.push("Raw rgb()/rgba() literals found");
    score -= 15;
  }

  const foundationVars = code.match(/--n-\d+/g) ?? [];
  if (foundationVars.length > 0) {
    violations.push(`Direct --n-* foundation var leaks: ${foundationVars.join(", ")}`);
    score -= 20;
  }

  const rawTailwindColors =
    code.match(
      /\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g
    ) ?? [];
  if (rawTailwindColors.length > 0) {
    violations.push(`Raw Tailwind color scale leaks: ${rawTailwindColors.join(", ")}`);
    score -= 15;
  }

  // Hardcoded font sizes (raw Tailwind text scale instead of DS typography)
  const rawFontSizes = code.match(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g) ?? [];
  // Filter out text-sm etc that might be part of import paths or comments
  const fontInClasses = rawFontSizes.filter((f) => !/import|from|\/\//.test(code.split(f)[0].split("\n").pop()));
  if (fontInClasses.length > 0) {
    violations.push(`Hardcoded Tailwind font sizes found: ${fontInClasses.join(", ")} — use component size props instead`);
    score -= Math.min(10, fontInClasses.length * 3);
  }

  // ── 2. Radius & Spacing Math ─────────────────────────────────────
  const literalRadius = code.match(/\brounded-(sm|md|lg|xl|2xl|3xl)\b/g) ?? [];
  if (literalRadius.length > 0) {
    violations.push(`Literal radius utilities found: ${literalRadius.join(", ")}`);
    score -= Math.min(20, literalRadius.length * 5);
  }

  // Arbitrary pixel radius values (rounded-[8px], rounded-[12px], etc.)
  const arbitraryRadius = code.match(/\brounded-\[\d+px\]/g) ?? [];
  if (arbitraryRadius.length > 0) {
    violations.push(`Arbitrary pixel radius found: ${arbitraryRadius.join(", ")} — use var(--radius-*) tokens`);
    score -= Math.min(15, arbitraryRadius.length * 5);
  }

  if (/calc\s*\(\s*var\s*\(\s*--radius-panel\s*\)\s*-\s*\d+px\s*\)/i.test(code)) {
    violations.push("Ad-hoc pixel subtraction in radius calc found. Use concentric utilities like rounded-panel-p5.");
    score -= 10;
  }

  // ── 3. Accessibility & Radix Attributes ──────────────────────────
  if (/(<PopoverContent|<DialogContent|<HoverCardContent|<MenuContent)/.test(code) && !/data-panel/.test(code)) {
    violations.push("Floating overlay surface missing required 'data-panel' attribute");
    score -= 10;
  }

  // ── 4. Expected Component Match ──────────────────────────────────
  let matchedComponents = 0;
  if (expectedComponents.length > 0) {
    for (const comp of expectedComponents) {
      const regex = new RegExp(`\\b${comp}\\b`);
      if (regex.test(code)) {
        matchedComponents++;
      }
    }
  }
  const coveragePercent =
    expectedComponents.length > 0 ? (matchedComponents / expectedComponents.length) * 100 : 100;
  if (coveragePercent < 100) {
    score -= Math.round((100 - coveragePercent) * 0.2);
  }

  // ── 5. Anti-Copy Slop & Content Realism Check ────────────────────
  const slopPhrases = [
    { regex: /it's not\s+[^.]+\.\s*it's\s+/i, name: "Binary contrast trope ('It's not X. It's Y.')" },
    { regex: /in today's (fast-paced|digital|modern)/i, name: "Throat-clearing opener ('In today's fast-paced...')" },
    { regex: /unleash (the (true )?)?power/i, name: "Vacuous tech buzzword ('Unleash the power')" },
    { regex: /lorem ipsum/i, name: "Dummy placeholder text ('Lorem ipsum')" },
  ];
  for (const s of slopPhrases) {
    if (s.regex.test(code)) {
      violations.push(`AI copy slop detected: ${s.name}`);
      score -= 10;
    }
  }

  // ── 6. Primitive Usage (no raw HTML, no glyphs, no inline styles) ─

  // 6a. Raw HTML element detection (only in JSX context, not import lines)
  const jsxLines = code
    .split("\n")
    .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("import") && !l.trim().startsWith("*"));
  const jsxContent = jsxLines.join("\n");
  const rawHtmlMatches = [];
  for (const [tag, replacement] of Object.entries(HTML_TO_SHAVIN)) {
    // Match <tag> or <tag/> or <tag ... but NOT </tag> (closing is fine) and NOT in strings
    const tagRegex = new RegExp(`<${tag}(\\s|>|/>)`, "g");
    const matches = jsxContent.match(tagRegex);
    if (matches) {
      // Exclude self-closing void elements that are valid HTML (br, hr, etc.)
      rawHtmlMatches.push({ tag, replacement, count: matches.length });
    }
  }
  if (rawHtmlMatches.length > 0) {
    const details = rawHtmlMatches.map((m) => `<${m.tag}> → ${m.replacement} (${m.count}x)`).join("; ");
    violations.push(`Raw HTML elements found (use @shavin/ui primitives): ${details}`);
    score -= Math.min(20, rawHtmlMatches.reduce((sum, m) => sum + m.count, 0) * 5);
  }

  // 6b. Glyph/emoji detection
  let glyphCount = 0;
  for (const pattern of GLYPH_PATTERNS) {
    const matches = code.match(pattern.regex);
    if (matches && matches.length > 0) {
      glyphCount += matches.length;
      violations.push(`Unicode glyph detected: ${pattern.name} (${matches.length}x)`);
    }
  }
  if (glyphCount > 0) {
    score -= Math.min(15, glyphCount * 3);
  }

  // 6c. Inline style detection (style={{ ... }} with color/radius/font values)
  const inlineStyleMatches = code.match(/style\s*=\s*\{\{[^}]*(color|background|borderRadius|fontSize|padding|margin)[^}]*\}\}/gs) ?? [];
  if (inlineStyleMatches.length > 0) {
    violations.push(`Inline styles with visual properties found (${inlineStyleMatches.length}x) — use token-based className utilities`);
    score -= Math.min(15, inlineStyleMatches.length * 5);
  }

  // ── 7. Prop Name & Value Compliance ──────────────────────────────
  let propNameIssues = 0;
  for (const [wrongProp, correctProp] of Object.entries(PROP_NAME_ALIASES)) {
    // Match prop in JSX context: propName= or propName:
    const propRegex = new RegExp(`\\b${wrongProp}\\s*[=:]`, "g");
    const matches = code.match(propRegex);
    if (matches) {
      violations.push(`Invalid prop name '${wrongProp}' found — use '${correctProp}' instead (${matches.length}x)`);
      propNameIssues += matches.length;
    }
  }

  // Invalid prop values for specific components
  for (const [compName, propMap] of Object.entries(INVALID_PROP_VALUES)) {
    for (const [propName, invalidValues] of Object.entries(propMap)) {
      for (const invalidVal of invalidValues) {
        // Match <Component ... propName="invalidVal" or propName='invalidVal'
        const valRegex = new RegExp(`<${compName}[^>]*\\b${propName}\\s*=\\s*["']${invalidVal}["']`, "gi");
        if (valRegex.test(code)) {
          violations.push(`Invalid prop value: ${compName} ${propName}="${invalidVal}" — not in valid enum options`);
          propNameIssues++;
        }
      }
    }
  }
  if (propNameIssues > 0) {
    score -= Math.min(15, propNameIssues * 3);
  }

  // ── 8. Import Hygiene ────────────────────────────────────────────
  let importIssues = 0;

  // Deep imports from @shavin/ui/primitives/* or @shavin/ui/src/*
  const deepImports = code.match(/from\s*["']@shavin\/ui\/(primitives|src|components|lib|tokens|styles|icons|utils)[^"']*["']/g) ?? [];
  if (deepImports.length > 0) {
    violations.push(`Deep imports from @shavin/ui subpaths found: ${deepImports.join(", ")} — import from "@shavin/ui" root only`);
    importIssues += deepImports.length;
  }

  // Note: @shavin/ui/styles.css and @shavin/ui/tailwind-preset are valid exceptions
  const invalidDeepImports = deepImports.filter(
    (d) => !d.includes("styles.css") && !d.includes("tailwind-preset")
  );
  if (invalidDeepImports.length > 0) {
    score -= Math.min(15, invalidDeepImports.length * 5);
  }

  // Check if @shavin/ui import exists at all (when components are used)
  const hasShavinImport = /from\s*["']@shavin\/ui["']/.test(code);
  const usesShavinComponents = /<(Box|Flex|Grid|Container|Section|Text|Heading|Link|Button|IconButton|Badge|Card|Avatar|Separator|Icon|TextField|TextArea|Select|Checkbox|RadioGroup|Radio|Switch|Slider|Tooltip|Popover|Dialog|AlertDialog|Dropdown|Menu|ContextMenu|Tabs|Accordion|Table|List|DataList|Progress|Skeleton|Spinner|Callout|Stepper|Toast|Calendar|DatePicker|ColorPicker|Combobox|ScrollArea|HoverCard|Breadcrumbs|Pagination|Sidebar|AppFrame|TopBar|Spotlight|ChatBubble|Drawer|AspectRatio|Kbd|Code|CodeBlock|Blockquote|Quote|Em|Strong|BottomNav|StatCard|Inset|ThemeProvider|SegmentedControl)\b/.test(
    code
  );
  if (usesShavinComponents && !hasShavinImport) {
    violations.push("Uses @shavin/ui components but missing root import from \"@shavin/ui\"");
    importIssues++;
    score -= 10;
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    isClean: violations.length === 0,
    violations,
    metrics: {
      hexLeaks: hexMatches.length,
      foundationLeaks: foundationVars.length,
      literalRadiusLeaks: literalRadius.length + arbitraryRadius.length,
      componentCoverage: Math.round(coveragePercent),
      rawHTMLElements: rawHtmlMatches.reduce((sum, m) => sum + m.count, 0),
      glyphLeaks: glyphCount,
      inlineStyles: inlineStyleMatches.length,
      propNameIssues,
      importIssues,
    },
  };
}

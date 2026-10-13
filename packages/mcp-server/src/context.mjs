/**
 * @shavin/mcp — Context Extraction Engine (Pure Library Module)
 *
 * Deterministically scans the target workspace, reads SHAVIN.md (persistent brain),
 * evaluates codebase token alignment score, detects project archetype, and outputs
 * an ultra-compact (< 300 tokens) prompt-injection manifest with zero context loss.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, unlinkSync } from "node:fs";
import { matchHexColors } from "@shavin/block-schema/hex-policy";
import { createHash } from "node:crypto";
import { resolve, dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..", "..", "..");

export function loadJSON(path) {
  try {
    if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8"));
  } catch {}
  return null;
}

export function loadText(path) {
  try {
    if (existsSync(path)) return readFileSync(path, "utf8");
  } catch {}
  return null;
}

export function getAllFiles(dir, maxDepth = 4, currentDepth = 0) {
  let files = [];
  if (currentDepth > maxDepth || !existsSync(dir)) return files;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.name.startsWith(".") ||
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === "build" ||
        entry.name === ".next"
      ) {
        continue;
      }
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath, maxDepth, currentDepth + 1));
      } else {
        files.push(fullPath);
      }
    }
  } catch {}
  return files;
}

// ── ThemeProvider prop extraction from root layout ─────────────────────────
// Searches for <ThemeProvider .../> in the user's root layout and extracts
// theme props. This is the RUNTIME source of truth — what's actually rendering.
// Props use capitalized values ("Grass", "Zinc") — normalized to lowercase
// to match SHAVIN.md / config.json convention.
//
// Also resolves `theme="Editorial"` preset props by inlining THEME_PRESETS data.

const THEME_PRESETS_DATA = [
  { name: "Default", accentColor: "Monochrome", grayColor: "Zinc", radius: "medium", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Space Grotesk", bodyFont: "Inter" },
  { name: "Linear", accentColor: "Violet", grayColor: "Zinc", radius: "medium", scaling: 100, panelBackground: "translucent", appearance: "dark", displayFont: "Inter", bodyFont: "Inter" },
  { name: "Nordic", accentColor: "Teal", grayColor: "Gray", radius: "large", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Outfit", bodyFont: "Inter" },
  { name: "Vanguard", accentColor: "Red", grayColor: "Zinc", radius: "medium", scaling: 100, panelBackground: "solid", appearance: "dark", displayFont: "Space Grotesk", bodyFont: "Inter" },
  { name: "Cyber", accentColor: "Lime", grayColor: "Zinc", radius: "large", scaling: 100, panelBackground: "translucent", appearance: "dark", displayFont: "JetBrains Mono", bodyFont: "Inter" },
  { name: "WiseOwl", accentColor: "Lime", grayColor: "Zinc", radius: "large", scaling: 100, panelBackground: "translucent", appearance: "dark", displayFont: "Public Sans", bodyFont: "Inter" },
  { name: "Editorial", accentColor: "Bronze", grayColor: "Stone", radius: "medium", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Fraunces", bodyFont: "Inter" },
  { name: "Neo Tokyo", accentColor: "Ruby", grayColor: "Zinc", radius: "medium", scaling: 100, panelBackground: "translucent", appearance: "dark", displayFont: "Space Grotesk", bodyFont: "Inter" },
  { name: "Oasis", accentColor: "Jade", grayColor: "Stone", radius: "large", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Outfit", bodyFont: "Inter" },
  { name: "Ocean", accentColor: "Mint", grayColor: "Zinc", radius: "medium", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Space Grotesk", bodyFont: "Inter" },
  { name: "Velvet", accentColor: "Plum", grayColor: "Slate", radius: "large", scaling: 100, panelBackground: "translucent", appearance: "dark", displayFont: "Playfair Display", bodyFont: "Inter" },
  { name: "Minimal", accentColor: "Monochrome", grayColor: "Gray", radius: "small", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Outfit", bodyFont: "Inter" },
  { name: "Warm", accentColor: "Amber", grayColor: "Stone", radius: "large", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Lora", bodyFont: "Inter" },
  { name: "Playful", accentColor: "Iris", grayColor: "Slate", radius: "large", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Space Grotesk", bodyFont: "Space Grotesk" },
  { name: "Sunset", accentColor: "Crimson", grayColor: "Stone", radius: "large", scaling: 100, panelBackground: "translucent", appearance: "dark", displayFont: "Outfit", bodyFont: "Inter" },
  { name: "Midnight", accentColor: "Cyan", grayColor: "Zinc", radius: "medium", scaling: 100, panelBackground: "translucent", appearance: "dark", displayFont: "Space Grotesk", bodyFont: "Inter" },
  { name: "Terminal", accentColor: "Green", grayColor: "Zinc", radius: "none", scaling: 100, panelBackground: "solid", appearance: "dark", displayFont: "JetBrains Mono", bodyFont: "JetBrains Mono" },
];

const LAYOUT_CANDIDATES = [
  "src/app/layout.tsx", "app/layout.tsx",
  "src/pages/_app.tsx", "pages/_app.tsx",
  "src/App.tsx", "src/App.jsx", "App.tsx", "App.jsx",
  "app/root.tsx",
];

export function parseThemeProviderFromLayout(targetDir) {
  for (const c of LAYOUT_CANDIDATES) {
    const p = resolve(targetDir, c);
    if (!existsSync(p)) continue;
    const src = readFileSync(p, "utf8");
    if (!src.includes("ThemeProvider")) continue;

    // Extract the first <ThemeProvider ...> tag (may be self-closing or have children)
    const tpMatch = src.match(/<ThemeProvider\b([^>]*)>/);
    if (!tpMatch) return null;

    const propsStr = tpMatch[1];
    const result = {
      source: c,
      theme: null,        // named preset
      accentColor: null,
      grayColor: null,
      radius: null,
      scaling: null,
      panelBackground: null,
      defaultTheme: null, // light/dark/system
      displayFont: null,
      bodyFont: null,
      subheadingFont: null,
    };

    // Extract individual prop="value" or prop={value} pairs
    const extractProp = (name) => {
      // Match: name="value" or name={value} or name={`value`}
      const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]+)"|\\{\\s*"?([\\w]+)"?\\s*\\}|\\{\\\`([^\\\`]+)\\\`\\})`);
      const m = propsStr.match(re);
      return m ? (m[1] || m[2] || m[3]) : null;
    };

    result.theme = extractProp("theme");
    result.accentColor = extractProp("accentColor");
    result.grayColor = extractProp("grayColor");
    result.radius = extractProp("radius");
    result.scaling = extractProp("scaling");
    result.panelBackground = extractProp("panelBackground");
    result.defaultTheme = extractProp("defaultTheme");
    result.displayFont = extractProp("displayFont");
    result.bodyFont = extractProp("bodyFont");
    result.subheadingFont = extractProp("subheadingFont");

    // If theme="PresetName" is set, start from preset values as the base
    // Individual props override the preset (matching ThemeProvider's own logic)
    if (result.theme) {
      const preset = THEME_PRESETS_DATA.find(
        (t) => t.name.toLowerCase() === result.theme.toLowerCase()
      );
      if (preset) {
        if (!result.accentColor) result.accentColor = preset.accentColor;
        if (!result.grayColor) result.grayColor = preset.grayColor;
        if (!result.radius) result.radius = preset.radius;
        if (!result.scaling) result.scaling = String(preset.scaling);
        if (!result.panelBackground) result.panelBackground = preset.panelBackground;
        if (!result.defaultTheme) result.defaultTheme = preset.appearance;
        if (!result.displayFont) result.displayFont = preset.displayFont;
        if (!result.bodyFont) result.bodyFont = preset.bodyFont;
      }
    }

    return result;
  }
  return null;
}

export function parseShavinManifest(targetDir) {
  // ── Priority chain: ThemeProvider (runtime) > SHAVIN.md > config.json > defaults ──
  const tp = parseThemeProviderFromLayout(targetDir);

  // Start from defaults
  const config = {
    hasManifest: true,
    manifestFile: null,
    appName: null,
    domain: null,
    accent: "monochrome",
    neutral: "zinc",
    themeMode: "dark-first",
    density: "95%",
    radius: "medium",
    panelBackground: "solid",
    raw: null,
    themeSource: null, // tracks which source provided theme values
  };

  // Layer 1: ThemeProvider from layout.tsx (runtime truth — highest priority for theme fields)
  if (tp) {
    config.themeSource = "ThemeProvider";
    if (tp.accentColor) config.accent = tp.accentColor.toLowerCase();
    if (tp.grayColor) config.neutral = tp.grayColor.toLowerCase();
    if (tp.radius) config.radius = tp.radius.toLowerCase();
    if (tp.panelBackground) config.panelBackground = tp.panelBackground.toLowerCase();
    if (tp.scaling) config.density = tp.scaling + "%";
    if (tp.defaultTheme) config.themeMode = tp.defaultTheme;
  }

  // Layer 2: SHAVIN.md (human-maintained brain — provides appName/domain, and theme fields
  // as fallback for anything ThemeProvider didn't specify)
  const candidates = ["SHAVIN.md", "shavin.md", "DESIGN.md", "design.md"];
  let shavinContent = null;
  for (const c of candidates) {
    const p = resolve(targetDir, c);
    if (existsSync(p)) {
      shavinContent = readFileSync(p, "utf8");
      config.manifestFile = c;
      config.raw = shavinContent;
      break;
    }
  }

  if (shavinContent) {
    // Regexes use \*{0,2} to match 0, 1, or 2 asterisks — supports
    // plain "Label:", single "*Label*:" and bold "**Label**:" formats.
    const appMatch = shavinContent.match(/Product Name\*{0,2}:\s*([^\n\r]+)/i);
    if (appMatch) config.appName = appMatch[1].replace(/[*`\[\]]/g, "").trim();

    const domainMatch = shavinContent.match(/Domain\*{0,2}:\s*([^\n\r]+)/i);
    if (domainMatch) config.domain = domainMatch[1].replace(/[*`\[\]]/g, "").trim();

    // Only use SHAVIN.md theme fields if ThemeProvider didn't provide them
    if (!tp?.accentColor) {
      const accentMatch = shavinContent.match(/Primary Accent\*{0,2}:\s*`?([a-z-]+)`?/i);
      if (accentMatch) { config.accent = accentMatch[1].trim(); if (!config.themeSource) config.themeSource = "SHAVIN.md"; }
    }
    if (!tp?.grayColor) {
      const neutralMatch = shavinContent.match(/Neutral Scale\*{0,2}:\s*`?([a-z-]+)`?/i);
      if (neutralMatch) config.neutral = neutralMatch[1].trim();
    }
    if (!tp?.defaultTheme) {
      const modeMatch = shavinContent.match(/Theme Mode\*{0,2}:\s*`?([a-z-]+)`?/i);
      if (modeMatch) config.themeMode = modeMatch[1].trim();
    }
    if (!tp?.scaling) {
      const densityMatch = shavinContent.match(/Scaling \/ Density\*{0,2}:\s*`?([0-9%a-z\s()-]+)`?/i);
      if (densityMatch) config.density = densityMatch[1].trim();
    }
    if (!tp?.radius) {
      const radiusMatch = shavinContent.match(/Base Radius\*{0,2}:\s*`?([a-z-]+)`?/i);
      if (radiusMatch) config.radius = radiusMatch[1].trim();
    }
    if (!tp?.panelBackground) {
      const panelMatch = shavinContent.match(/Panel Background\*{0,2}:\s*`?([a-z-]+)`?/i);
      if (panelMatch) config.panelBackground = panelMatch[1].trim();
    }
  }

  // Layer 3: config.json (shavin init defaults — lowest priority fallback)
  if (!config.appName) {
    const pkg = loadJSON(resolve(targetDir, "package.json"));
    if (pkg?.name) config.appName = pkg.name;
  }

  const shavinConfig = loadJSON(resolve(targetDir, ".shavin", "config.json"));
  if (shavinConfig?.presets) {
    if (!tp?.accentColor && !shavinContent?.match(/Primary Accent\*{0,2}:/i) && shavinConfig.presets.accentColor) config.accent = shavinConfig.presets.accentColor;
    if (!tp?.grayColor && !shavinContent?.match(/Neutral Scale\*{0,2}:/i) && shavinConfig.presets.grayColor) config.neutral = shavinConfig.presets.grayColor;
    if (!tp?.radius && !shavinContent?.match(/Base Radius\*{0,2}:/i) && shavinConfig.presets.radius) config.radius = shavinConfig.presets.radius;
    if (!tp?.scaling && !shavinContent?.match(/Scaling \/ Density\*{0,2}:/i) && shavinConfig.presets.scaling) config.density = shavinConfig.presets.scaling;
  }

  if (!config.manifestFile && !tp && !shavinConfig) {
    return { hasManifest: false };
  }

  return config;
}

export function detectProjectArchetype(targetDir) {
  const pkg = loadJSON(resolve(targetDir, "package.json")) || loadJSON(resolve(ROOT, "package.json")) || {};
  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  const filePaths = getAllFiles(targetDir, 3).map((f) => f.toLowerCase());

  let dashboardScore = 0;
  let websiteScore = 0;
  let saasScore = 0;

  if (allDeps["recharts"] || allDeps["chart.js"] || allDeps["@tanstack/react-table"]) dashboardScore += 4;
  if (allDeps["next-auth"] || allDeps["@supabase/supabase-js"] || allDeps["firebase"]) saasScore += 3;
  if (allDeps["framer-motion"] || allDeps["gsap"] || allDeps["lenis"]) websiteScore += 3;

  for (const f of filePaths) {
    if (f.includes("dashboard") || f.includes("admin") || f.includes("analytics") || f.includes("table") || f.includes("metric")) {
      dashboardScore += 2;
    }
    if (f.includes("hero") || f.includes("pricing") || f.includes("landing") || f.includes("marketing") || f.includes("bento") || f.includes("cta")) {
      websiteScore += 2;
    }
    if (f.includes("builder") || f.includes("studio") || f.includes("editor") || f.includes("wizard") || f.includes("flow")) {
      saasScore += 2;
    }
  }

  if (dashboardScore > websiteScore && dashboardScore >= saasScore) {
    return {
      type: "dashboard_app",
      label: "Dashboard & Analytics Application",
      priorityPrimitives: ["Sidebar", "TopBar", "Table", "StatCard", "LineChart", "BarChart", "DataList", "FilterBar", "Badge", "Pagination"],
      compositionRule: "Dense information architecture, concentric panel radius, clear tabular scanning, and high contrast metric cards.",
      recommendedAgentSkill: "shavin-app",
    };
  }

  if (websiteScore >= dashboardScore && websiteScore >= saasScore) {
    return {
      type: "marketing_website",
      label: "Marketing Website & Landing Page",
      priorityPrimitives: ["HeroSection", "BentoGrid", "FeatureCard", "Button", "Badge", "CtaBanner", "Footer", "ThemeSwitcher"],
      compositionRule: "Spacious layout rhythm (py-20/24), ambient blend mesh gradients, strong display typography, and clear CTA visual hierarchy.",
      recommendedAgentSkill: "shavin-pages",
    };
  }

  return {
    type: "saas_web_app",
    label: "SaaS Product & Interactive Web App",
    priorityPrimitives: ["AppFrame", "Stepper", "Dialog", "Select", "TextField", "CodeBlock", "Tabs", "ToastProvider", "Tooltip"],
    compositionRule: "Stateful workflows, multi-step wizards with Stepper, accessible dialog focus traps, and keyboard navigation.",
    recommendedAgentSkill: "shavin-app",
  };
}

export function scanCodebaseAlignment(targetDir) {
  const srcFiles = getAllFiles(targetDir, 4).filter((f) =>
    /\.(tsx|jsx|ts|js|html|css|vue|svelte)$/i.test(f) &&
    !f.includes(".test.") &&
    !f.includes(".spec.") &&
    !f.endsWith(".d.ts") &&
    !f.includes("/docs/") &&
    !f.includes("/.next/") &&
    !f.includes("/dist/") &&
    !f.includes("/build/") &&
    !f.includes("/.agents/") &&
    !f.includes("tokens.json") &&
    !f.includes("components.json")
  );

  let rawHexCount = 0;
  let rawRadiusCount = 0;
  let rawColorScaleCount = 0;
  let directFoundationVarCount = 0;
  let shavinImportCount = 0;
  const detectedHexColors = new Map();

  for (const filePath of srcFiles) {
    try {
      const content = readFileSync(filePath, "utf8");
      if (content.includes("@shavin/ui")) shavinImportCount++;

      const hexes = matchHexColors(content, { filename: filePath });
      for (const h of hexes) {
        rawHexCount++;
        const lower = h.toLowerCase();
        detectedHexColors.set(lower, (detectedHexColors.get(lower) || 0) + 1);
      }

      const radii = content.match(/\brounded-(sm|md|lg|xl|2xl|3xl)\b/g) ?? [];
      rawRadiusCount += radii.length;

      const rawColors = content.match(
        /\b(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|pink)-\d{2,3}\b/g
      ) ?? [];
      rawColorScaleCount += rawColors.length;

      const fVars = content.match(/--n-\d+/g) ?? [];
      if (!filePath.endsWith("global.css")) {
        directFoundationVarCount += fVars.length;
      }
    } catch {}
  }

  const totalViolations = rawHexCount + rawRadiusCount + rawColorScaleCount + directFoundationVarCount;
  
  let score = 100;
  if (srcFiles.length > 0) {
    const penalty = Math.min(90, Math.round((totalViolations / (srcFiles.length * 4)) * 50));
    score = Math.max(10, 100 - penalty);
  }

  let inferredAccent = "monochrome";
  if (detectedHexColors.size > 0) {
    const topHex = [...detectedHexColors.entries()].sort((a, b) => b[1] - a[1])[0][0];
    if (/#(3b82f6|2563eb|1d4ed8|60a5fa|4f46e5|6366f1)/i.test(topHex)) inferredAccent = "indigo";
    else if (/#(10b981|059669|34d399|46a758|22c55e)/i.test(topHex)) inferredAccent = "grass";
    else if (/#(f59e0b|d97706|f97316|ea580c)/i.test(topHex)) inferredAccent = "amber";
    else if (/#(ef4444|dc2626|e11d48|f43f5e)/i.test(topHex)) inferredAccent = "ruby";
    else if (/#(8b5cf6|7c3aed|a855f7)/i.test(topHex)) inferredAccent = "iris";
    else if (/#(06b6d4|0891b2|38bdf8|0ea5e9)/i.test(topHex)) inferredAccent = "sky";
  }

  return {
    score,
    totalFilesScanned: srcFiles.length,
    shavinImportCount,
    rawHexCount,
    rawRadiusCount,
    rawColorScaleCount,
    directFoundationVarCount,
    totalViolations,
    inferredAccent,
  };
}

export function extractProjectContext(options = {}) {
  const targetDir = options.targetDir ? resolve(options.targetDir) : process.cwd();
  const manifest = parseShavinManifest(targetDir);
  const archetype = detectProjectArchetype(targetDir);
  const alignment = scanCodebaseAlignment(targetDir);

  const pkg = loadJSON(resolve(targetDir, "package.json")) || loadJSON(resolve(ROOT, "package.json")) || {};
  const isBrownfield = alignment.shavinImportCount === 0 && !manifest.hasManifest;

  const mode = isBrownfield
    ? "BROWNFIELD_MIGRATION"
    : alignment.score >= 85
    ? "HEALTHY_ALIGNED"
    : "PROGRESSIVE_MIGRATION";

  const accent = manifest.accent || alignment.inferredAccent || "monochrome";
  const neutral = manifest.neutral || "zinc";
  const themeMode = manifest.themeMode || "dark-first";
  const density = manifest.density || "95%";
  const radius = manifest.radius || "medium";
  const appName = manifest.appName || pkg.name || basename(targetDir);

  let promptMarkdown = "";

  if (isBrownfield) {
    promptMarkdown = `<!-- SHAVIN_DESIGN_CONTEXT:START (Mode: BROWNFIELD_MIGRATION | Budget: ~280 tokens) -->
[PROJECT_ENVIRONMENT]
Framework: ${pkg.name || "React"} | Shavin Status: ⚠️ UNINITIALIZED | Alignment Score: ${alignment.score}/100
Detected Debt: ${alignment.rawHexCount} raw hexes, ${alignment.rawRadiusCount} literal radii, ${alignment.rawColorScaleCount} raw color utilities

[INFERRED_BRAND_MAPPING]
Accent: ${accent} | Neutral: ${neutral} | Mode: ${themeMode} | Density: ${density} | Radius: ${radius}

[TARGET_MIGRATION_RULES_FOR_AI]
When generating or refactoring components in this workspace:
1. Replace raw colors with semantic tokens: bg-surface, text-fg, text-fg-subtle, border-hairline, bg-accent.
2. Replace hardcoded radii on cards with rounded-[var(--radius-panel)]; use rounded-[var(--radius-lg)] on controls.
3. Suggest wrapping root with @shavin/ui's <ThemeProvider accentColor="${accent}" grayColor="${neutral}" />.

[AVAILABLE_MCP_TOOLS]
- plan_page: Brief → per-section composition plan (call before writing a page).
- check_page: Check a plan, and code against it (data-composition on every Section).
- get_tokens: Query semantic design tokens and active theme scales.
- get_components: Query primitive props/variants schema on-demand.
- get_skill: Retrieve focused design instructions (e.g. layout-compositions, visual-compositor, shavin-app, shavin-webpage).
- get_block_template: Retrieve verified template code for blocks/sections.
- validate_code: Lint snippets for token violations.
- autofix_code: Transpile legacy classes to @shavin/ui tokens.
- shavin_steer: Run audit / polish with automated snapshot rollback.
<!-- SHAVIN_DESIGN_CONTEXT:END -->`;
  } else {
    promptMarkdown = `<!-- SHAVIN_DESIGN_CONTEXT:START (Mode: ${mode}) -->
[PROJECT_PROFILE]
App: ${appName} | Archetype: ${archetype.label} (${archetype.recommendedAgentSkill})
Theme: ${themeMode} | Accent: ${accent} | Neutral: ${neutral} | Density: ${density} | Radius: ${radius} | Alignment Score: ${alignment.score}/100

[WORKFLOW (call these tools in order; skills load through get_skill, not file paths)]
1. Pages / sections (marketing, landing, pricing, docs, editorial): plan_page({ brief }) → fill the plan → check_page({ plan }).
2. Per section: get_skill({ name: "layout-compositions", section: "<family>" }) + get_components({ name }). Mark it <Section data-composition="<ID>">.
3. App / dashboard screens: get_skill({ name: "shavin-app" }). Typography, polish, concentric radius: get_skill({ name: "visual-compositor", section: "typography-rules" | "interface-polish" | "concentric-laws" }).
4. Motion, after the static page passes: tier1 get_skill({ name: "layout-motion" }); tier2 get_skill({ name: "layout-choreography" }).
5. Finish: validate_code per file → audit_source({ targetDir }) → check_page({ targetDir }).

[ZERO_SLOP_PREMIUM_DEFAULTS (Apply automatically if nothing is specified)]
Never output flat sterile wireframes or generic AI slop. Always apply these premium defaults:
1. Surfaces & Atmosphere: Lummi 3-layer atmospheric backdrop (chromatic photo texture at 20-30% opacity + directional scrim 'from-canvas/30 via-surface/80 to-surface backdrop-blur-[2px]'). Never use stark flat white or detached neon glow balls.
2. Anti-Box Law: Group with proximity and whitespace before containers. Never wrap every sub-metric in a card. For elevated cards, prefer subtle shadows (shadow-panel, shadow-card) over rigid solid borders.
3. Typography Invariants: Mandatory text-balance on headings, text-pretty on body, tabular-nums on numbers/metrics/prices (font-mono only for code, CLI commands, hashes and token keys), and max-w-2xl (680px) measure limit.
4. Tactile Motion: Buttons MUST have 'active:scale-[0.96] transition-transform duration-100 ease-out'. Custom easing 'cubic-bezier(0.23, 1, 0.32, 1)'. Zero ease-in. All UI motion < 300ms. Split & stagger enter (opacity + blur(4px) + translateY(12px)).
5. Optical Craft: Button icon padding offset (icon-side = text-side - 2px). Play button triangle shift (ml-0.5).
6. Software Authenticity: Feature real UI artifacts (Token Inspector with render counter, Concentric Geometry preview) instead of detached 3D clay balls. Use organic metrics (99.94%, <3.2ms, 1,423,690). Ban AI cliches ('Elevate', 'Seamless', 'Unleash'). Never use the sparkles icon or sparkle emoji unless the user asks (use <Murmur> for AI activity).

[STRICT_TOKEN_INVARIANTS]
• Color Purity: ZERO hex/rgb/--n-* literals. Use bg-surface, bg-canvas, text-fg (titles), text-fg-subtle (descriptions), border-hairline, bg-accent.
• Concentric Geometry: Container panels use rounded-[var(--radius-panel)]. Controls use rounded-[var(--radius-lg)]. Concentric inner: rounded-panel-p5 (for p-5) or rounded-panel-p3 (for p-3).
• Floating Panels: Overlays/menus/dialogs MUST include data-panel attribute.

[AVAILABLE_MCP_TOOLS]
• plan_page: Brief → per-section composition plan (call before writing a page).
• check_page: Check a plan, and code against it (data-composition on every Section).
• get_tokens: Query semantic design tokens and active theme scales.
• get_components: Query primitive props/variants schema on-demand.
• get_skill: Retrieve focused design instructions (e.g. layout-compositions, visual-compositor, shavin-app, shavin-webpage).
• get_block_template: Retrieve verified template code for blocks/sections.
• validate_code: Test snippet against token rules & contrast gates.
• shavin_steer: Execute polish / harden / typeset / audit actions with snapshot rollbacks.
<!-- SHAVIN_DESIGN_CONTEXT:END -->`;
  }

  const contextHash = createHash("sha256").update(promptMarkdown).digest("hex").slice(0, 12);
  promptMarkdown = `<!-- SHAVIN_CONTEXT_HASH: ${contextHash} -->\n` + promptMarkdown;

  const result = {
    targetDir,
    mode,
    appName,
    archetype,
    contextHash,
    alignment,
    manifest,
    promptMarkdown,
  };

  if (options.save || existsSync(resolve(targetDir, ".shavin"))) {
    saveContextSnapshots(targetDir, result);
  }

  return result;
}

const MAX_HISTORY_FILES = 20;

export function saveContextSnapshots(targetDir, contextResult) {
  const shavinDir = resolve(targetDir, ".shavin");
  const promptsDir = resolve(shavinDir, "prompts");
  const historyDir = resolve(promptsDir, "context-history");
  const snapshotsDir = resolve(shavinDir, "snapshots");

  for (const d of [shavinDir, promptsDir, historyDir, snapshotsDir]) {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  }

  // Always update context-latest.md (single source of truth for current state)
  writeFileSync(resolve(promptsDir, "context-latest.md"), contextResult.promptMarkdown, "utf8");

  // --- Dedup: only write a new history file if the context hash changed ---
  // The hash is already computed in extractProjectContext() and embedded in
  // promptMarkdown as <!-- SHAVIN_CONTEXT_HASH: xxxxxx -->. We compare against
  // the most recent history file to avoid piling up identical snapshots.
  const hash = contextResult.contextHash;
  let shouldWriteHistory = true;

  if (existsSync(historyDir)) {
    const existing = readdirSync(historyDir)
      .filter((f) => f.endsWith(".md"))
      .sort() // ISO timestamps sort chronographically
      .reverse(); // newest first

    if (existing.length > 0) {
      const latestPath = resolve(historyDir, existing[0]);
      const latestContent = readFileSync(latestPath, "utf8");
      const latestHashMatch = latestContent.match(/SHAVIN_CONTEXT_HASH:\s*([a-f0-9]+)/);
      const latestHash = latestHashMatch ? latestHashMatch[1] : null;

      // Skip if the hash matches — content is identical, no reason to snapshot
      if (hash && latestHash === hash) {
        shouldWriteHistory = false;
      }
    }

    // --- Retention cap: remove oldest files beyond MAX_HISTORY_FILES ---
    if (existing.length >= MAX_HISTORY_FILES) {
      const toRemove = existing.slice(MAX_HISTORY_FILES - 1); // oldest beyond the cap
      for (const f of toRemove) {
        try {
          unlinkSync(resolve(historyDir, f));
        } catch {}
      }
    }
  }

  if (shouldWriteHistory) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    writeFileSync(resolve(historyDir, `context-${timestamp}.md`), contextResult.promptMarkdown, "utf8");
  }

  const auditPath = resolve(shavinDir, "audit-history.json");
  let auditHistory = [];
  if (existsSync(auditPath)) {
    try {
      auditHistory = JSON.parse(readFileSync(auditPath, "utf8"));
      if (!Array.isArray(auditHistory)) auditHistory = [];
    } catch {}
  }

  // Only append to audit-history if the score or violation count changed
  const lastEntry = auditHistory[auditHistory.length - 1];
  const scoreChanged = !lastEntry ||
    lastEntry.score !== contextResult.alignment.score ||
    lastEntry.violations !== contextResult.alignment.totalViolations ||
    lastEntry.mode !== contextResult.mode;

  if (scoreChanged) {
    auditHistory.push({
      timestamp: new Date().toISOString(),
      score: contextResult.alignment.score,
      mode: contextResult.mode,
      violations: contextResult.alignment.totalViolations,
      filesScanned: contextResult.alignment.totalFilesScanned,
    });

    if (auditHistory.length > 50) auditHistory = auditHistory.slice(-50);
    writeFileSync(auditPath, JSON.stringify(auditHistory, null, 2), "utf8");
  }
}

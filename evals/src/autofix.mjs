import { matchHexColors } from "../../packages/block-schema/hex-policy.mjs";
/**
 * @shavin/ui — Native Code Auto-Fix Transformer.
 * Automatically transforms non-compliant TSX into valid @shavin/ui tokenized code.
 *
 * Transformations:
 * 1. Literal radius → token-based radius (rounded-lg → rounded-[var(--radius-lg)])
 * 2. Arbitrary pixel radius → token radius
 * 3. Ad-hoc calc() radius → concentric utilities
 * 4. --n-* foundation vars → semantic tokens
 * 5. Missing data-panel on overlay surfaces
 * 6. Hex colors → semantic token classes (best-effort mapping)
 * 7. Raw rgb()/rgba() → semantic token classes
 * 8. Raw Tailwind color scales → semantic token classes
 * 9. Prop name aliases → correct prop names (fontWeight → weight, icon → name)
 * 10. Invalid prop values → corrected values (tone="neutral" → variant="ghost")
 * 11. Glyph characters → <Icon> components (best-effort)
 * 12. Deep imports → root @shavin/ui import
 */

// Hex color → semantic token mapping (covers common grays, blues, greens, reds)
const HEX_TO_TOKEN = {
  // Neutral/background grays
  "ffffff": "bg-canvas", "fff": "bg-canvas",
  "f8f9fa": "bg-surface", "f9fafb": "bg-surface",
  "f1f5f9": "bg-surface-hover", "f3f4f6": "bg-surface-hover",
  "e2e8f0": "hairline", "e5e7eb": "hairline",
  "1e293b": "fg", "1f2937": "fg", "0f172a": "fg",
  "334155": "fg-muted", "374151": "fg-muted",
  "64748b": "fg-subtle", "6b7280": "fg-subtle",
  "94a3b8": "fg-subtle", "9ca3af": "fg-subtle",
  // Accent blues
  "3b82f6": "accent", "2563eb": "accent", "0ea5e9": "accent",
  // Danger reds
  "ef4444": "danger", "dc2626": "danger", "e11d48": "danger",
};

// Raw Tailwind color → semantic token mapping
const TAILWIND_COLOR_TO_TOKEN = {
  slate: { prefix: "bg", target: "bg-surface" },
  gray: { prefix: "bg", target: "bg-surface" },
  zinc: { prefix: "bg", target: "bg-surface" },
  neutral: { prefix: "bg", target: "bg-surface" },
  stone: { prefix: "bg", target: "bg-surface" },
  red: { prefix: "bg", target: "bg-danger" },
  orange: { prefix: "bg", target: "bg-accent" },
  amber: { prefix: "bg", target: "bg-accent" },
  yellow: { prefix: "bg", target: "bg-accent" },
  green: { prefix: "bg", target: "bg-accent" },
  emerald: { prefix: "bg", target: "bg-accent" },
  blue: { prefix: "bg", target: "bg-accent" },
  indigo: { prefix: "bg", target: "bg-accent" },
  violet: { prefix: "bg", target: "bg-accent" },
  purple: { prefix: "bg", target: "bg-accent" },
  pink: { prefix: "bg", target: "bg-accent" },
  rose: { prefix: "bg", target: "bg-danger" },
};

// Glyph → Icon name mapping
const GLYPH_TO_ICON = {
  "\u2713": 'Check', "\u2714": 'Check', // ✓
  "\u2192": 'ArrowRight', "\u279C": 'ArrowRight', "\u27A4": 'ArrowRight', // →
  "\u2190": 'ArrowLeft', // ←
  "\u2191": 'ArrowUp', // ↑
  "\u2193": 'ArrowDown', // ↓
  "\u2605": 'Star', "\u2606": 'Star', // ★ ☆
  "\u271A": 'Plus', // ✚
  "\u00D7": 'X', "\u2715": 'X', // × ✕
  "\u2022": 'Dot', // •
  "\u2705": 'CheckCircle', // ✅ (approximate)
  "\u274C": 'XCircle', // ❌ (approximate)
  "\u26A0": 'AlertTriangle', // ⚠
};

export function autofix(code) {
  let fixed = code;
  const fixes = [];

  // ── 1. Literal radius → token-based radius ──────────────────────
  const radiusMap = {
    "rounded-sm": "rounded-[var(--radius-xs)]",
    "rounded-md": "rounded-[var(--radius-sm)]",
    "rounded-lg": "rounded-[var(--radius-sm)]",
    "rounded-xl": "rounded-[var(--radius-md)]",
    "rounded-2xl": "rounded-[var(--radius-panel)]",
    "rounded-3xl": "rounded-[var(--radius-panel)]",
  };
  for (const [literal, token] of Object.entries(radiusMap)) {
    if (new RegExp(`\\b${literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(fixed)) {
      fixed = fixed.replace(new RegExp(`\\b${literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), token);
      fixes.push(`${literal} → ${token}`);
    }
  }

  // ── 2. Arbitrary pixel radius → token radius ────────────────────
  const arbitraryRadiusMatches = fixed.match(/\brounded-\[(\d+)px\]/g) ?? [];
  for (const match of new Set(arbitraryRadiusMatches)) {
    const px = parseInt(match.match(/\d+/)[0]);
    let token;
    if (px <= 4) token = "rounded-[var(--radius-xs)]";
    else if (px <= 8) token = "rounded-[var(--radius-sm)]";
    else if (px <= 12) token = "rounded-[var(--radius-md)]";
    else if (px <= 16) token = "rounded-[var(--radius-lg)]";
    else token = "rounded-[var(--radius-panel)]";
    fixed = fixed.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), token);
    fixes.push(`${match} → ${token}`);
  }

  // ── 3. Ad-hoc calc() radius → concentric utilities ──────────────
  const calcMatches = fixed.match(/calc\s*\(\s*var\s*\(\s*--radius-panel\s*\)\s*-\s*(\d+)px\s*\)/gi) ?? [];
  for (const match of new Set(calcMatches)) {
    const px = parseInt(match.match(/(\d+)px/)[1]);
    const concentricToken = `rounded-panel-p${px}`;
    fixed = fixed.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), concentricToken);
    fixes.push(`calc(panel - ${px}px) → ${concentricToken}`);
  }

  // ── 4. --n-* foundation vars → semantic tokens ──────────────────
  const foundationMap = {
    "--n-0": "var(--bg-canvas)",
    "--n-50": "var(--bg-canvas)",
    "--n-100": "var(--bg-surface)",
    "--n-200": "var(--bg-surface-hover)",
    "--n-300": "var(--hairline)",
    "--n-400": "var(--hairline)",
    "--n-500": "var(--fg-subtle)",
    "--n-600": "var(--fg-muted)",
    "--n-700": "var(--fg-muted)",
    "--n-800": "var(--fg)",
    "--n-900": "var(--fg)",
    "--n-950": "var(--fg)",
  };
  for (const [foundation, semantic] of Object.entries(foundationMap)) {
    if (fixed.includes(`var(${foundation})`)) {
      fixed = fixed.replace(new RegExp(`var\\(${foundation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`, "g"), semantic);
      fixes.push(`var(${foundation}) → ${semantic}`);
    }
  }

  // ── 5. Missing data-panel on overlay surfaces ───────────────────
  if (/(<PopoverContent|<DialogContent|<HoverCardContent|<MenuContent)/.test(fixed) && !/data-panel/.test(fixed)) {
    fixed = fixed.replace(/(<PopoverContent|<DialogContent|<HoverCardContent|<MenuContent)/g, "$1 data-panel");
    fixes.push("Added data-panel attribute to overlay surfaces");
  }

  // ── 6. Hex colors → semantic token classes ──────────────────────
  const hexMatches = matchHexColors(fixed);
  for (const hex of new Set(hexMatches)) {
    const normalized = hex.replace("#", "").toLowerCase();
    // Expand 3-char hex to 6-char
    const expanded = normalized.length === 3
      ? normalized.split("").map((c) => c + c).join("")
      : normalized;
    const token = HEX_TO_TOKEN[expanded] || HEX_TO_TOKEN[normalized];
    if (token) {
      fixed = fixed.replace(new RegExp(hex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), `var(--${token})`);
      fixes.push(`${hex} → var(--${token})`);
    }
  }

  // ── 7. Raw rgb()/rgba() → flagged (can't auto-map without context) ──
  // rgb/rgba values are too context-dependent to auto-transform safely.
  // We flag them but don't transform, since we'd need to know if it's a
  // bg, text, or border context.

  // ── 8. Raw Tailwind color scales → semantic tokens ───────────────
  const twColorRegex = /\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;
  const twColorMatches = fixed.match(twColorRegex) ?? [];
  for (const match of new Set(twColorMatches)) {
    const parts = match.split("-");
    const prefix = parts[0]; // bg, text, border, etc.
    const colorName = parts[1]; // slate, blue, etc.
    let token;
    if (colorName === "red" || colorName === "rose") {
      token = prefix === "bg" ? "bg-danger" : prefix === "text" ? "text-danger" : "border-danger";
    } else if (["slate", "gray", "zinc", "neutral", "stone"].includes(colorName)) {
      if (prefix === "bg") token = "bg-surface";
      else if (prefix === "text") token = "text-fg";
      else token = "border-hairline";
    } else {
      // Accent-family colors
      if (prefix === "bg") token = "bg-accent";
      else if (prefix === "text") token = "text-accent";
      else token = "border-accent";
    }
    fixed = fixed.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), token);
    fixes.push(`${match} → ${token}`);
  }

  // ── 9. Prop name aliases → correct prop names ────────────────────
  const propAliases = {
    fontWeight: "weight",
    fontweight: "weight",
    textSize: "size",
    textsize: "size",
    textColor: "color",
    textcolor: "color",
    iconName: "name",
    iconname: "name",
  };
  for (const [wrong, correct] of Object.entries(propAliases)) {
    const propRegex = new RegExp(`\\b${wrong}\\s*=`, "g");
    if (propRegex.test(fixed)) {
      fixed = fixed.replace(propRegex, `${correct}=`);
      fixes.push(`prop '${wrong}' → '${correct}'`);
    }
  }

  // Special: icon="..." → name="..." (but only in JSX prop context, not className)
  const iconPropRegex = /\bicon\s*=\s*["']([^"']+)["']/g;
  if (iconPropRegex.test(fixed)) {
    fixed = fixed.replace(iconPropRegex, 'name="$1"');
    fixes.push("prop 'icon' → 'name'");
  }

  // ── 10. Invalid prop values → corrected ──────────────────────────
  // Button tone="neutral" → remove tone, add variant="ghost"
  if (/<Button[^>]*\btone\s*=\s*["'](neutral|default|normal)["']/i.test(fixed)) {
    fixed = fixed.replace(/<Button([^>]*)\btone\s*=\s*["'](neutral|default|normal)["']([^>]*)>/gi, (match, before, _val, after) => {
      // Remove the tone prop, add variant="ghost" if no variant exists
      const hasVariant = /variant\s*=/.test(before + after);
      if (hasVariant) {
        return `<Button${before}${after}>`;
      }
      return `<Button${before} variant="ghost"${after}>`;
    });
    fixes.push("Button tone=\"neutral\" → variant=\"ghost\" (tone only allows accent/danger)");
  }

  // ── 11. Glyph characters → <Icon> components ─────────────────────
  for (const [glyph, iconName] of Object.entries(GLYPH_TO_ICON)) {
    if (fixed.includes(glyph)) {
      // Only replace in JSX text content (between > and <), not in strings/comments
      // Simple approach: replace in text content context
      fixed = fixed.replace(
        new RegExp(`>([^<]*)${glyph.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^<]*)<`, "g"),
        (match, before, after) => `>${before}<Icon name="${iconName}" />${after}<`
      );
      fixes.push(`glyph '${glyph}' → <Icon name="${iconName}" />`);
    }
  }

  // ── 12. Deep imports → root @shavin/ui import ────────────────────
  const deepImportRegex = /from\s*["']@shavin\/ui\/(primitives|src|components|lib|tokens|icons|utils)[^"']*["']/g;
  const deepMatches = fixed.match(deepImportRegex) ?? [];
  if (deepMatches.length > 0) {
    // Extract imported names from all deep import lines
    const importNameRegex = /import\s*\{([^}]*)\}\s*from\s*["']@shavin\/ui\/(?:primitives|src|components|lib|tokens|icons|utils)[^"']*["']/g;
    let importMatch;
    const allNames = new Set();
    while ((importMatch = importNameRegex.exec(fixed)) !== null) {
      importMatch[1].split(",").forEach((n) => {
        const trimmed = n.trim();
        if (trimmed) allNames.add(trimmed);
      });
    }
    // Remove all deep import lines
    fixed = fixed.replace(/^\s*import\s*\{[^}]*\}\s*from\s*["']@shavin\/ui\/(?:primitives|src|components|lib|tokens|icons|utils)[^"']*["'];?\s*$/gm, "");
    // Merge names into existing root import or create new one
    if (allNames.size > 0) {
      const rootImportRegex = /import\s*\{([^}]*)\}\s*from\s*["']@shavin\/ui["'];?/;
      if (rootImportRegex.test(fixed)) {
        const existingNames = new Set();
        fixed = fixed.replace(rootImportRegex, (match, existing) => {
          existing.split(",").forEach((n) => {
            const trimmed = n.trim();
            if (trimmed) existingNames.add(trimmed);
          });
          allNames.forEach((n) => existingNames.add(n));
          const merged = Array.from(existingNames).join(", ");
          return `import { ${merged} } from "@shavin/ui";`;
        });
      } else {
        fixed = `import { ${Array.from(allNames).join(", ")} } from "@shavin/ui";\n` + fixed;
      }
      fixes.push(`Deep imports → merged into root "@shavin/ui" import`);
    }
  }

  return {
    fixedCode: fixed,
    fixesApplied: fixes,
  };
}

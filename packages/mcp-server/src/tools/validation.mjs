/**
 * Tools: validate_code, autofix_code
 * Lints JSX/Tailwind classes against @shavin/ui design token rules and transpiles legacy syntax.
 *
 * Legitimate exceptions (intentional, not fixable to a token):
 *   - `data-overlay="true"` elements — media overlay scrim layers from the
 *     shared media-overlays module: intentional theme-independent
 *     black/white-alpha scrims over background imagery.
 *   - `data-gradient="true"` elements — decorative gradient/atmosphere
 *     surfaces. Gradients are palette DEFINITION (absolute hsla()/rgb()
 *     values are the point); token-purifying them to solid colors would
 *     destroy the effect. Mirrors the live DOM audit exemption.
 *   - `data-scope-theme="true"` elements — scoped theme remaps that mirror
 *     the .dark token mapping so a preview re-themes independently;
 *     legitimately reference foundation --n-* vars.
 *   Lines containing any of these markers are skipped, mirroring how the
 *   live DOM audit exempts [data-swatch] swatches.
 */

import { checkUsage } from "./usage-check.mjs";
import { findHitAreaWarnings } from "./hit-area-lint.mjs";
import { findBgSurfaceWarnings } from "./bg-surface-lint.mjs";
import { findViewportShellPatterns } from "./responsive-lint.mjs";
import { findHexViolations, matchHexColors } from "@shavin/block-schema/hex-policy";
import { enforcementViolations, legacyPaths, isLegacyFile } from "./enforce.mjs";
import { findConcentricIssues, concentricAutofix } from "./concentric-lint.mjs";
import { relative, resolve, isAbsolute } from "node:path";

function splitLines(code) {
  return code.split(/\r?\n/);
}

/** Exemption-marked lines (data-overlay / data-gradient / data-scope-theme)
 *  are intentional palette/theme definition surfaces — skip them.
 *  Also strip bgOverlays/bgImage/bgVideo prop values — they contain hex colors
 *  and rgba() as DATA for the bg-media feature, not styling. Users intentionally
 *  try different color shades to enhance background media. */
function stripExemptMarkedLines(code) {
  return splitLines(code)
    .filter((l) => !/data-overlay|data-gradient|data-scope-theme/.test(l))
    .map((l) => l.replace(/\bbg(Overlays|Image|Video)\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`)/g, "bg$1=\"\""))
    // brandColor="#hex" on ThemeProvider / ScopedThemeProvider is where a custom brand colour belongs.
    .map((l) => l.replace(/\bbrandColor\s*=\s*(?:"[^"]*"|'[^']*'|\{\s*(?:"[^"]*"|'[^']*')\s*\})/g, 'brandColor="brand"'))
    .join("\n");
}

/**
 * Motion Timeline (Tier 3) correctness, string-level (see docs/architecture/motion-timelines-spec.md).
 * Returns [{ rule, message, warn? }]. Catches the mistakes the runtime silently tolerates:
 *  - a member whose timeline has no scope-root (orphan — nothing drives it),
 *  - a root with no members (dead timeline),
 *  - an element that is both a timeline member and carries its own data-motion-entry/-scroll (double-drive).
 */
export function checkMotionTimelines(code) {
  const out = [];
  const memberIds = [...code.matchAll(/data-motion-tl-member\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]);
  // `data-motion-tl=` only — the regex stops at `=`, so -member/-at/-effect/etc. never match here.
  const rootIds = new Set([...code.matchAll(/data-motion-tl\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]));
  const memberIdSet = new Set(memberIds);

  const orphans = [...new Set(memberIds.filter((id) => !rootIds.has(id)))];
  if (orphans.length) {
    out.push({
      rule: "timeline-orphan-member",
      message: `Timeline member(s) with no scope-root: ${orphans.map((i) => `"${i}"`).join(", ")}. Put data-motion-tl="${orphans[0]}" on the common ancestor that should play them.`,
    });
  }
  const deadRoots = [...rootIds].filter((id) => !memberIdSet.has(id));
  if (deadRoots.length) {
    out.push({
      rule: "timeline-no-members",
      warn: true,
      message: `Timeline root(s) with no members: ${deadRoots.map((i) => `"${i}"`).join(", ")}. Add data-motion-tl-member="${deadRoots[0]}" to the elements to sequence, or remove the timeline.`,
    });
  }
  // Best-effort per-tag conflict (a timeline member must not also run its own entry/scroll).
  const tags = code.match(/<[A-Za-z][^>]*>/gs) || [];
  if (tags.some((t) => /data-motion-tl-member/.test(t) && /(data-motion-entry|data-motion-scroll)\b/.test(t))) {
    out.push({
      rule: "timeline-member-standalone",
      warn: true,
      message: "An element is a timeline member AND has its own data-motion-entry/-scroll. The timeline drives it — remove the standalone entry/scroll so it doesn't double-animate.",
    });
  }
  return out;
}

export function validateCode(code, { enforce = false } = {}) {
  const violations = [];
  const original = code;
  code = stripExemptMarkedLines(code);
  // Context-aware: "Order #1543" / "#142" ids are content, not colours.
  const hexMatches = matchHexColors(code);
  if (hexMatches.length > 0) {
    violations.push(
      `Hardcoded hex colors found: ${hexMatches.join(", ")}. Use semantic token utilities (bg-surface, text-fg, border-hairline, …) instead.`
    );
  }

  if (/rgb\s*\(|rgba\s*\(/.test(code)) {
    violations.push("Raw rgb()/rgba() literals found. Use semantic CSS custom properties via Tailwind utilities instead.");
  }

  const foundationVars = code.match(/--n-\d+/g) ?? [];
  if (foundationVars.length > 0) {
    violations.push(`Direct foundation variable references found: ${foundationVars.join(", ")}. Nothing outside global.css should reference --n-* directly.`);
  }

  // Literal radius and concentric radius (role-aware; every message names the exact class to write).
  // rounded-full stays legal for pills, avatars, dots and switches.
  for (const c of findConcentricIssues(original)) violations.push(c.message);

  const rawColors = code.match(
    /\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g
  ) ?? [];
  if (rawColors.length > 0) {
    violations.push(
      `Raw Tailwind color scale utilities found: ${rawColors.join(", ")}. Use semantic utilities (bg-surface, text-fg, text-fg-muted, border-hairline, bg-brand, …) instead.`
    );
  }

  for (const w of findViewportShellPatterns(code)) violations.push(`Line ${w.line}: ${w.message}`);

  for (const t of checkMotionTimelines(code)) violations.push(`${t.warn ? "Warning" : "Error"} (${t.rule}): ${t.message}`);

  if (enforce) violations.push(...enforcementViolations(original).errors);

  return violations;
}

export function validateCodeDense(code, { enforce = false } = {}) {
  const issues = [];
  const original = code;
  code = stripExemptMarkedLines(code);
  const hexMatches = matchHexColors(code);
  if (hexMatches.length > 0) {
    issues.push(`hex=[${[...new Set(hexMatches)].join(",")}] -> USE bg-*/text-*`);
  }
  if (/rgb\s*\(|rgba\s*\(/.test(code)) {
    issues.push("rgb/rgba -> USE semantic tokens");
  }
  const foundationVars = code.match(/--n-\d+/g) ?? [];
  if (foundationVars.length > 0) {
    issues.push(`foundation=[${[...new Set(foundationVars)].join(",")}] -> USE semantic tokens`);
  }
  for (const c of findConcentricIssues(original)) issues.push(c.dense);
  const rawColors = code.match(
    /\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g
  ) ?? [];
  if (rawColors.length > 0) {
    issues.push(`tailwind-colors=[${[...new Set(rawColors)].slice(0, 5).join(",")}] -> USE bg-surface, text-fg, border-hairline`);
  }
  for (const w of findViewportShellPatterns(code)) {
    const fix = w.rule === "viewport-heading-size" ? "USE Heading size=4xl|5xl (fluid) or one fixed text-*" : "USE AppFrame + SidebarTrigger, shavin-frame-compact-only/-wide-only";
    issues.push(`responsive:${w.rule}@L${w.line} -> ${fix}`);
  }
  for (const t of checkMotionTimelines(code)) issues.push(`${t.rule} -> ${t.message}`);
  if (enforce) issues.push(...enforcementViolations(original).dense);
  return issues;
}

export function autofixCode(code) {
  let fixedCode = code;
  const fixesApplied = [];
  // Only rewrite hex the shared policy calls a colour — never ids in copy.
  let colorAt = new Set(findHexViolations(code).map((v) => v.index));

  fixedCode = fixedCode.replace(/#ffffff|#fff\b/gi, (match, offset, str) => {
    // skip exemption-marked lines (data-overlay / data-gradient / data-scope-theme)
    const lineStart = str.lastIndexOf("\n", offset) + 1;
    const line = str.slice(lineStart, offset + match.length);
    if (/data-overlay|data-gradient|data-scope-theme/.test(line)) return match;
    // skip hex inside bgOverlays/bgImage/bgVideo prop values — DATA for bg-media
    if (/bg(Overlays|Image|Video)\s*=/.test(line)) return match;
    if (!colorAt.has(offset)) return match;
    fixesApplied.push("Replaced white hex with bg-surface / text-fg");
    return "var(--bg-surface)";
  });

  colorAt = new Set(findHexViolations(fixedCode).map((v) => v.index));
  fixedCode = fixedCode.replace(/#000000|#000\b/gi, (match, offset, str) => {
    const lineStart = str.lastIndexOf("\n", offset) + 1;
    const line = str.slice(lineStart, offset + match.length);
    if (/data-overlay|data-gradient|data-scope-theme/.test(line)) return match;
    // skip hex inside bgOverlays/bgImage/bgVideo prop values — DATA for bg-media
    if (/bg(Overlays|Image|Video)\s*=/.test(line)) return match;
    if (!colorAt.has(offset)) return match;
    fixesApplied.push("Replaced black hex with text-fg");
    return "var(--fg)";
  });

  // Radius: role-aware. Controls get --radius-lg, containers --radius-panel, nested elements
  // rounded-panel-pN from the padding; an ambiguous role is reported in `unfixed`, never guessed.
  const radius = concentricAutofix(fixedCode);
  fixedCode = radius.fixedCode;
  fixesApplied.push(...radius.fixesApplied);

  return { fixedCode, fixesApplied, unfixed: radius.unfixed };
}

export function registerValidationTools(server, COMPONENTS) {
  return [
    {
      schema: {
        name: "validate_code",
        description: "Call on every JSX/TSX file or snippet you write or change, on every turn, before returning it. FAILS on: raw hex/rgb/--n-* (hex is allowed only as brandColor on ThemeProvider), raw Tailwind colour scales, literal radius (rounded-lg, rounded-xl, ...), concentric radius (a control with the panel radius, a container with the control radius, a nested rounded element that does not fit its parent's padding; rounded-full is allowed; every message names the exact class to write), raw button/input/select/textarea/table/dialog, styled-div imitations of components, other UI libraries, deep @shavin/ui imports, arbitrary type sizes, inline colour styles. WARNS (does not fail) on hitArea=\"none\" or the hit-area-none class: it can drop a control below the WCAG 2.2 AA 2.5.8 24px floor; restore by removing it or using hitArea=\"default\". Then run audit_source and check_page on the project. Supports 'dense' (default) and 'full'.",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "The JSX, TSX, or HTML code to validate." },
            file: { type: "string", description: "Optional path of the file the code is from (relative to the project). Files listed under Legacy paths in SHAVIN.md (another UI library) are reported, not failed." },
            density: {
              type: "string",
              enum: ["dense", "full"],
              description: "Output format: 'dense' (single-line actionable tuples, default) or 'full' (verbose markdown report with code patch).",
            },
          },
          required: ["code"],
        },
      },
      handler: async (args) => {
        const rawCode = args?.code || "";
        const density = args?.density || "dense";
        const violations = validateCode(rawCode, { enforce: true });
        const usage = checkUsage(rawCode, COMPONENTS);
        for (const u of usage) violations.push(`Component usage: ${u}`);
        // Warning-level findings never fail a file; they ride along with PASS or FAIL.
        const warnings = [...findHitAreaWarnings(rawCode), ...findBgSurfaceWarnings(rawCode)];
        const warnLine = warnings.length ? `\nWARN (${warnings.length}, does not fail): ${warnings.map((w) => `[${w.rule}: ${w.message}]`).join("; ")}` : "";

        // Coexistence: legacy files (another UI library the project already had) are reported, not failed.
        if (args?.file && violations.length) {
          const cwd = process.cwd();
          const abs = isAbsolute(args.file) ? args.file : resolve(cwd, args.file);
          if (isLegacyFile(relative(cwd, abs), legacyPaths(cwd))) {
            const issues = [...validateCodeDense(rawCode, { enforce: true }), ...usage.map((u) => `usage: ${u}`)];
            return { content: [{ type: "text", text: `LEGACY (not failed): ${args.file} is listed under Legacy paths in SHAVIN.md. ${issues.length} finding(s): ${issues.map((i) => `[${i}]`).join("; ")}\nNew and changed code outside the legacy paths is Shavin only; migrate this file only if the user asks.` }] };
          }
        }

        if (violations.length === 0) {
          if (density === "dense") {
            return { content: [{ type: "text", text: `PASS: token pure; component variants/props valid.${warnLine}` }] };
          }
          return {
            content: [{
              type: "text",
              text: "## ✅ Code is 100% Token Pure and Clean!\nZero raw hex, rgb, or literal radius issues detected." +
                (warnings.length ? `\n\n### ⚠️ Warnings (${warnings.length}, do not fail):\n` + warnings.map((w, i) => `${i + 1}. (${w.rule}) ${w.message}`).join("\n") : ""),
            }],
          };
        }

        const { fixedCode, fixesApplied, unfixed } = autofixCode(rawCode);

        if (density === "dense") {
          const denseIssues = [...validateCodeDense(rawCode, { enforce: true }), ...usage.map((u) => `usage: ${u}`)];
          const lines = [
            `FAIL (${violations.length} violations): ${denseIssues.map((i) => `[${i}]`).join("; ")}`,
          ];
          if (warnings.length) lines.push(warnLine.trim());
          if (fixesApplied.length > 0) {
            lines.push(`AUTOFIX (${fixesApplied.length}): ${fixesApplied.join("; ")}`);
          }
          if (unfixed.length > 0) lines.push(`MANUAL (${unfixed.length}, role ambiguous): ${unfixed.join("; ")}`);
          return { content: [{ type: "text", text: lines.join("\n") }] };
        }

        let report = `## ⚠️ Violations Found (${violations.length}):\n\n` + violations.map((v, i) => `${i + 1}. ${v}`).join("\n");
        if (warnings.length) report += `\n\n### Warnings (${warnings.length}, do not fail):\n` + warnings.map((w, i) => `${i + 1}. (${w.rule}) ${w.message}`).join("\n");
        if (fixesApplied.length > 0) {
          report += `\n\n### 🛠️ Self-Healing Suggested Patch (${fixesApplied.length} fixes available):\n`;
          report += fixesApplied.map((f, i) => `- Fix ${i + 1}: ${f}`).join("\n");
          report += `\n\n\`\`\`tsx\n${fixedCode}\n\`\`\``;
        }

        return {
          content: [{
            type: "text",
            text: report,
          }],
        };
      },
    },
    {
      schema: {
        name: "autofix_code",
        description: "Automatically transpile non-compliant code to use @shavin/ui semantic tokens and concentric radii. Radius is role-aware: controls get rounded-[var(--radius-lg)], containers rounded-[var(--radius-panel)], nested elements rounded-panel-pN from the parent padding; an ambiguous role is returned in `unfixed` with both exact options.",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "The legacy code to transpile." },
          },
          required: ["code"],
        },
      },
      handler: async (args) => {
        const result = autofixCode(args?.code || "");
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      },
    },
  ];
}

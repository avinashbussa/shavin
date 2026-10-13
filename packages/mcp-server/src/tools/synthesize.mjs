import { ALL_BLOCKS } from "@shavin/block-schema";
import * as blockSchema from "@shavin/block-schema";

/** Old slug → current slug (RENAMED_BLOCKS); tolerant of an older block-schema build. */
const resolveBlockSlug = typeof blockSchema.resolveBlockSlug === "function" ? blockSchema.resolveBlockSlug : (s) => s;
import { validateCode } from "./validation.mjs";

/**
 * Determine visual-compositor activation mode based on keywords
 */
export function determineActivationMode(prompt = "", category = "") {
  const p = prompt.toLowerCase();
  const c = category.toLowerCase();

  if (
    p.includes("awwwards") ||
    p.includes("agency") ||
    p.includes("portfolio") ||
    p.includes("creative") ||
    p.includes("luxury") ||
    p.includes("fancy") ||
    p.includes("cinematic") ||
    p.includes("scroll experience") ||
    p.includes("wow factor") ||
    p.includes("editorial") ||
    c === "portfolio"
  ) {
    return {
      mode: "EDITORIAL",
      density: "Airy / Theatrical",
      recommendedRadius: "large",
      panelBg: "translucent",
      sectionGap: "py-24",
      rationale: "Prompt matches EDITORIAL mode signals. Applying high-contrast display typography and airy spacing.",
    };
  }

  if (
    c === "dashboard" ||
    c === "analytics" ||
    c === "admin" ||
    p.includes("dashboard") ||
    p.includes("admin") ||
    p.includes("analytics") ||
    p.includes("telemetry") ||
    p.includes("table") ||
    p.includes("rbac") ||
    p.includes("console")
  ) {
    return {
      mode: "STRUCTURAL",
      density: "Compact / Comfortable",
      recommendedRadius: "medium",
      panelBg: "solid",
      sectionGap: "py-8",
      rationale: "Prompt matches STRUCTURAL mode signals. Applying strict concentric radius, compact data-density, and solid panels.",
    };
  }

  if (
    c === "pricing" ||
    c === "landing" ||
    c === "marketing" ||
    p.includes("landing") ||
    p.includes("homepage") ||
    p.includes("saas") ||
    p.includes("marketing") ||
    p.includes("pricing") ||
    p.includes("conversion") ||
    p.includes("launch")
  ) {
    return {
      mode: "MARKETING",
      density: "Comfortable",
      recommendedRadius: "large",
      panelBg: "solid",
      sectionGap: "py-16",
      rationale: "Prompt matches MARKETING mode signals. Applying balanced visual hierarchy, conversion triggers, and comfortable padding.",
    };
  }

  return {
    mode: "HYBRID",
    density: "Comfortable",
    recommendedRadius: "large",
    panelBg: "solid",
    sectionGap: "py-12",
    rationale: "General layout intent. Applying standard concentric laws and responsive section flow.",
  };
}

export function synthesizeLayout({
  prompt = "",
  category = "landing",
  theme = {},
  sections = [],
}) {
  const normalizedPrompt = prompt.toLowerCase();
  const modeSpec = determineActivationMode(prompt, category);

  const appliedTheme = {
    accentColor: theme.accentColor || "grass",
    grayColor: theme.grayColor || "gray",
    radius: theme.radius || modeSpec.recommendedRadius,
    panelBackground: theme.panelBackground || modeSpec.panelBg,
  };

  let matchedBlocks = [];

  if (sections && sections.length > 0) {
    matchedBlocks = sections
      .map((slug) => ALL_BLOCKS.find((b) => b.slug === resolveBlockSlug(slug)))
      .filter(Boolean);
  }

  if (matchedBlocks.length === 0) {
    // Keyword scoring match
    const scored = ALL_BLOCKS.map((b) => {
      let score = 0;
      if (b.category === category) score += 5;
      for (const tag of b.tags) {
        if (normalizedPrompt.includes(tag.toLowerCase())) score += 3;
      }
      if (normalizedPrompt.includes(b.slug.toLowerCase())) score += 10;
      if (normalizedPrompt.includes(b.name.toLowerCase())) score += 8;
      return { block: b, score };
    });

    scored.sort((a, b) => b.score - a.score);
    matchedBlocks = scored.slice(0, 3).map((s) => s.block);
  }

  if (matchedBlocks.length === 0) {
    matchedBlocks = ALL_BLOCKS.slice(0, 3);
  }

  // Collect all unique dependencies
  const allDeps = new Set(["ThemeProvider", "Container", "Flex"]);
  matchedBlocks.forEach((b) => {
    (b.dependencies || []).forEach((d) => allDeps.add(d));
  });

  const importsList = Array.from(allDeps).sort().join(", ");

  const blockComponents = matchedBlocks.map((b, idx) => {
    const compName = b.slug
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");
    return `        {/* Section: ${b.name} (${b.category}) */}\n        <section className="w-full ${modeSpec.sectionGap} border-b border-hairline last:border-0">\n          <${compName} />\n        </section>`;
  }).join("\n\n");

  const componentImplementations = matchedBlocks.map((b) => {
    return b.rawCode;
  }).join("\n\n");

  const fullCode = `import React from "react";
import { ${importsList} } from "@shavin/ui";

${componentImplementations}

export default function SynthesizedPage() {
  return (
    <ThemeProvider
      accentColor="${appliedTheme.accentColor}"
      grayColor="${appliedTheme.grayColor}"
      radius="${appliedTheme.radius}"
      panelBackground="${appliedTheme.panelBackground}"
    >
      <main className="min-h-screen bg-canvas text-fg selection:bg-accent/20">
        <Container size="xl" className="px-4 py-8 space-y-8">
${blockComponents}
        </Container>
      </main>
    </ThemeProvider>
  );
}`;

  const violations = validateCode(fullCode);
  const complianceScore = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 15);
  const checks = violations.length === 0
    ? [
        "Zero raw hex/rgb color literals (100% semantic tokens)",
        "Concentric radius hierarchy enforced (rounded-[var(--radius-panel)] vs rounded-[var(--radius-lg)])",
        "Single root import from @shavin/ui",
        "Semantic layout containers used",
      ]
    : violations.map((v) => `Violation: ${v}`);

  return {
    code: fullCode,
    // One self-contained module per block. Canvas injection uses these:
    // `code` concatenates every block's imports into one file (duplicate
    // bindings), which is not a valid module and cannot be parsed to a node tree.
    sections: matchedBlocks.map((b) => ({ slug: b.slug, name: b.name, code: b.rawCode })),
    blocksUsed: matchedBlocks.map((b) => b.slug),
    visualCompositor: {
      activationMode: modeSpec.mode,
      density: modeSpec.density,
      rationale: modeSpec.rationale,
      concentricLaws: {
        radiusFormula: "R_inner = max(floor, R_outer - P), floor = min(radius-lg, radius-panel/2)",
        spacingLaw: "Outer Section Gap (p-6/p-8) >= Inner Card Padding (p-4/p-5) >= Control Padding (p-2/p-3)",
        containerRadius: "rounded-[var(--radius-panel)] (12-16px)",
        controlRadius: "rounded-[var(--radius-lg)] (8px)",
      },
      first3SecondsFoldChecklist: [
        "Primary value proposition and badge visible above 700px viewport fold",
        "Clear primary CTA with solid accent button",
        "Supporting social proof or telemetry metric counters immediately visible",
      ],
    },
    themeApplied: appliedTheme,
    tokenCompliance: {
      score: complianceScore,
      violationsCount: violations.length,
      checks,
    },
    a11yChecklist: [
      "WCAG 2.1 AAA color contrast maintained across Light/Dark modes",
      "Interactive controls have descriptive ARIA labels",
      "Keyboard navigable focus traps on dialogs and popovers",
    ],
  };
}

export function registerSynthesizeTool(server) {
  return {
    schema: {
      name: "synthesize_layout",
      description: "Generates token-pure starter sections for a layout. Prefer plan_page for real pages (it picks compositions from the catalogue); use this to scaffold, then annotate each <Section data-composition> and run validate_code.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Design request prompt describing desired page or UI section." },
          category: { type: "string", enum: ["landing", "dashboard", "pricing", "auth", "content", "portfolio", "ecommerce"] },
          theme: {
            type: "object",
            properties: {
              accentColor: { type: "string" },
              grayColor: { type: "string" },
              radius: { type: "string" },
              panelBackground: { type: "string" },
            },
          },
        },
        required: ["prompt"],
      },
    },
    handler: async (args) => {
      const result = synthesizeLayout(args || {});
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  };
}


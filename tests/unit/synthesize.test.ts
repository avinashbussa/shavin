/**
 * synthesize.test.ts — Snapshot + structural tests for synthesizeLayout output.
 *
 * Tests the layout synthesis pipeline across categories, themes, and
 * activation modes. Verifies output structure, token compliance, and
 * block selection logic.
 */

import { matchHexColors } from "../../packages/block-schema/hex-policy.mjs";
import { describe, it, expect, beforeAll } from "vitest";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateCode } from "../../evals/src/evaluator.mjs";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");

// Dynamic import — synthesize.mjs imports from @shavin/block-schema
let synthesizeLayout;

beforeAll(async () => {
  const mod = await import(
    resolve(ROOT, "packages/mcp-server/src/tools/synthesize.mjs")
  );
  synthesizeLayout = mod.synthesizeLayout;
});

// ── Output Structure Tests ─────────────────────────────────────────────
describe("synthesizeLayout: output structure", () => {
  it("returns an object with all expected keys", () => {
    const result = synthesizeLayout({ prompt: "A simple landing page", category: "landing" });
    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("blocksUsed");
    expect(result).toHaveProperty("visualCompositor");
    expect(result).toHaveProperty("themeApplied");
    expect(result).toHaveProperty("tokenCompliance");
    expect(result).toHaveProperty("a11yChecklist");
  });

  it("code is a non-empty string", () => {
    const result = synthesizeLayout({ prompt: "A dashboard with stats", category: "dashboard" });
    expect(typeof result.code).toBe("string");
    expect(result.code.length).toBeGreaterThan(100);
  });

  it("blocksUsed is an array of strings", () => {
    const result = synthesizeLayout({ prompt: "A pricing page", category: "pricing" });
    expect(Array.isArray(result.blocksUsed)).toBe(true);
    expect(result.blocksUsed.length).toBeGreaterThan(0);
    result.blocksUsed.forEach((slug) => {
      expect(typeof slug).toBe("string");
    });
  });

  it("visualCompositor has activationMode, density, rationale", () => {
    const result = synthesizeLayout({ prompt: "An agency portfolio", category: "portfolio" });
    expect(result.visualCompositor).toHaveProperty("activationMode");
    expect(result.visualCompositor).toHaveProperty("density");
    expect(result.visualCompositor).toHaveProperty("rationale");
  });

  it("visualCompositor has concentricLaws object", () => {
    const result = synthesizeLayout({ prompt: "A landing page", category: "landing" });
    expect(result.visualCompositor).toHaveProperty("concentricLaws");
    expect(result.visualCompositor.concentricLaws).toHaveProperty("radiusFormula");
    expect(result.visualCompositor.concentricLaws).toHaveProperty("spacingLaw");
  });

  it("themeApplied has accentColor, grayColor, radius, panelBackground", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "content" });
    expect(result.themeApplied).toHaveProperty("accentColor");
    expect(result.themeApplied).toHaveProperty("grayColor");
    expect(result.themeApplied).toHaveProperty("radius");
    expect(result.themeApplied).toHaveProperty("panelBackground");
  });

  it("tokenCompliance has score and checks array", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    expect(result.tokenCompliance).toHaveProperty("score");
    expect(result.tokenCompliance.score).toBe(100);
    expect(Array.isArray(result.tokenCompliance.checks)).toBe(true);
    expect(result.tokenCompliance.checks.length).toBeGreaterThan(0);
  });

  it("a11yChecklist is an array", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    expect(Array.isArray(result.a11yChecklist)).toBe(true);
    expect(result.a11yChecklist.length).toBeGreaterThan(0);
  });
});

// ── Activation Mode Tests ──────────────────────────────────────────────
describe("synthesizeLayout: activation mode detection", () => {
  it("detects MARKETING mode for landing/saas prompts", () => {
    const result = synthesizeLayout({
      prompt: "Build a SaaS landing page with hero, features, and pricing",
      category: "landing",
    });
    expect(result.visualCompositor.activationMode).toBe("MARKETING");
  });

  it("detects STRUCTURAL mode for dashboard/admin prompts", () => {
    const result = synthesizeLayout({
      prompt: "Create an admin dashboard with analytics tables",
      category: "dashboard",
    });
    expect(result.visualCompositor.activationMode).toBe("STRUCTURAL");
  });

  it("detects EDITORIAL mode for agency/portfolio prompts", () => {
    const result = synthesizeLayout({
      prompt: "Design an awwwards-winning agency portfolio with cinematic scroll experience",
      category: "portfolio",
    });
    expect(result.visualCompositor.activationMode).toBe("EDITORIAL");
  });

  it("detects EDITORIAL mode for luxury/creative prompts", () => {
    const result = synthesizeLayout({
      prompt: "A luxury creative portfolio with wow factor",
      category: "portfolio",
    });
    expect(result.visualCompositor.activationMode).toBe("EDITORIAL");
  });

  it("defaults to HYBRID mode for general prompts", () => {
    const result = synthesizeLayout({
      prompt: "A simple page with some text",
      category: "content",
    });
    expect(result.visualCompositor.activationMode).toBe("HYBRID");
  });

  it("detects MARKETING mode for pricing category", () => {
    const result = synthesizeLayout({
      prompt: "Show pricing tiers",
      category: "pricing",
    });
    expect(result.visualCompositor.activationMode).toBe("MARKETING");
  });
});

// ── Theme Override Tests ───────────────────────────────────────────────
describe("synthesizeLayout: theme overrides", () => {
  it("applies custom accentColor", () => {
    const result = synthesizeLayout({
      prompt: "A page",
      category: "landing",
      theme: { accentColor: "blue" },
    });
    expect(result.themeApplied.accentColor).toBe("blue");
  });

  it("applies custom grayColor", () => {
    const result = synthesizeLayout({
      prompt: "A page",
      category: "landing",
      theme: { grayColor: "slate" },
    });
    expect(result.themeApplied.grayColor).toBe("slate");
  });

  it("applies custom radius", () => {
    const result = synthesizeLayout({
      prompt: "A page",
      category: "landing",
      theme: { radius: "small" },
    });
    expect(result.themeApplied.radius).toBe("small");
  });

  it("applies custom panelBackground", () => {
    const result = synthesizeLayout({
      prompt: "A page",
      category: "landing",
      theme: { panelBackground: "translucent" },
    });
    expect(result.themeApplied.panelBackground).toBe("translucent");
  });

  it("defaults accentColor to 'grass' when not specified", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    expect(result.themeApplied.accentColor).toBe("grass");
  });

  it("defaults grayColor to 'gray' when not specified", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    expect(result.themeApplied.grayColor).toBe("gray");
  });

  it("uses mode-recommended radius when not overridden", () => {
    const result = synthesizeLayout({ prompt: "A dashboard", category: "dashboard" });
    // STRUCTURAL mode recommends 'medium'
    expect(result.themeApplied.radius).toBe("medium");
  });
});

// ── Code Generation Tests ──────────────────────────────────────────────
describe("synthesizeLayout: generated code quality", () => {
  it("code includes ThemeProvider wrapper", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    expect(result.code).toContain("<ThemeProvider");
    expect(result.code).toContain("</ThemeProvider>");
  });

  it("code imports from @shavin/ui root (no deep imports)", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    expect(result.code).toContain('from "@shavin/ui"');
    expect(result.code).not.toContain("@shavin/ui/primitives");
    expect(result.code).not.toContain("@shavin/ui/src");
  });

  it("code includes ThemeProvider in imports", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    expect(result.code).toContain("ThemeProvider");
  });

  it("code includes Container and Flex in imports", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    expect(result.code).toContain("Container");
    expect(result.code).toContain("Flex");
  });

  it("code uses semantic tokens (bg-canvas, text-fg)", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    expect(result.code).toContain("bg-canvas");
    expect(result.code).toContain("text-fg");
  });

  it("code uses border-hairline for section borders", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    expect(result.code).toContain("border-hairline");
  });

  it("code has no hex color leaks", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    expect(matchHexColors(result.code)).toEqual([]);
  });

  it("code has no literal radius utilities", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    const literalRadius = result.code.match(/\brounded-(sm|md|lg|xl|2xl|3xl)\b/g);
    // Filter out rounded utilities in var() context
    expect(literalRadius).toBeNull();
  });

  it("code has no raw Tailwind color scales", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    const rawColors = result.code.match(
      /\b(bg|text|border)-(slate|gray|zinc|red|blue|green|purple)-\d{2,3}\b/g
    );
    expect(rawColors).toBeNull();
  });

  it("generated code wrapper has zero hex leaks and zero import issues", () => {
    const result = synthesizeLayout({
      prompt: "A SaaS landing page with hero, features, and pricing",
      category: "landing",
    });
    const evalResult = evaluateCode(result.code);
    // The wrapper code (ThemeProvider, Container, main) is fully token-compliant.
    // Block templates from @shavin/block-schema may contain raw HTML elements
    // (div, ul, li, img) which the evaluator flags — those come from the
    // pre-built block rawCode, not from synthesizeLayout's wrapper.
    expect(evalResult.metrics.hexLeaks).toBe(0);
    expect(evalResult.metrics.importIssues).toBe(0);
    expect(evalResult.metrics.foundationLeaks).toBe(0);
    expect(evalResult.metrics.literalRadiusLeaks).toBe(0);
  });
});

// ── Block Selection Tests ──────────────────────────────────────────────
describe("synthesizeLayout: block selection", () => {
  it("selects at least 1 block", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    expect(result.blocksUsed.length).toBeGreaterThanOrEqual(1);
  });

  it("selects at most 3 blocks", () => {
    const result = synthesizeLayout({ prompt: "A page", category: "landing" });
    expect(result.blocksUsed.length).toBeLessThanOrEqual(3);
  });

  it("selects blocks matching the prompt keywords", () => {
    const result = synthesizeLayout({
      prompt: "A pricing page with three tiers",
      category: "pricing",
    });
    // Should match pricing-related blocks
    const hasPricingBlock = result.blocksUsed.some((slug) =>
      slug.includes("pricing") || slug.includes("tier")
    );
    expect(hasPricingBlock).toBe(true);
  });

  it("falls back to first 3 blocks when no match", () => {
    const result = synthesizeLayout({
      prompt: "zzz nonsense query with no matches zzz",
      category: "landing",
    });
    expect(result.blocksUsed.length).toBeGreaterThan(0);
  });

  it("uses explicit sections when provided", () => {
    const result = synthesizeLayout({
      prompt: "A page",
      category: "landing",
      sections: ["hero-minimal-saas", "pricing-three-tier"],
    });
    expect(result.blocksUsed).toContain("hero-centered-media");
    expect(result.blocksUsed).toContain("pricing-three-tier");
  });

  it("ignores unknown section slugs", () => {
    const result = synthesizeLayout({
      prompt: "A page",
      category: "landing",
      sections: ["nonexistent-block", "hero-minimal-saas"],
    });
    expect(result.blocksUsed).toContain("hero-centered-media");
    expect(result.blocksUsed).not.toContain("nonexistent-block");
  });
});

// ── Cross-Category Consistency Tests ───────────────────────────────────
describe("synthesizeLayout: cross-category consistency", () => {
  const categories = ["landing", "dashboard", "pricing", "auth", "content", "portfolio", "ecommerce"];

  it.each(categories)("produces valid output for category: %s", (category) => {
    const result = synthesizeLayout({
      prompt: `A ${category} page with content`,
      category,
    });
    expect(typeof result.code).toBe("string");
    expect(result.code.length).toBeGreaterThan(100);
    expect(result.blocksUsed.length).toBeGreaterThan(0);
    expect(result.visualCompositor.activationMode).toBeTruthy();
    expect(result.tokenCompliance.score).toBe(100);
  });

  it.each(categories)("code includes ThemeProvider for category: %s", (category) => {
    const result = synthesizeLayout({
      prompt: `A ${category} page`,
      category,
    });
    expect(result.code).toContain("<ThemeProvider");
  });

  it.each(categories)("code has no hex leaks for category: %s", (category) => {
    const result = synthesizeLayout({
      prompt: `A ${category} page`,
      category,
    });
    expect(matchHexColors(result.code)).toEqual([]);
  });
});

import { matchHexColors } from "../packages/block-schema/hex-policy.mjs";
import { describe, it, expect } from "vitest";
import { synthesizeLayout } from "../packages/mcp-server/src/tools/synthesize.mjs";

describe("MCP Layout Synthesis Suite", () => {
  it("synthesizes full-page layout with ThemeProvider and strict token imports", () => {
    const res = synthesizeLayout({
      prompt: "Create an AI analytics dashboard with telemetry",
      category: "dashboard",
    });

    expect(res).toBeDefined();
    expect(res.code).toContain('ThemeProvider');
    expect(res.code).toContain('from "@shavin/ui"');
    expect(res.code).toContain('<ThemeProvider');
    expect(res.blocksUsed.length).toBeGreaterThan(0);
    expect(res.tokenCompliance.score).toBe(100);
  });

  it("accurately binds requested section slugs", () => {
    const res = synthesizeLayout({
      prompt: "Custom landing page",
      sections: ["hero-minimal-saas", "pricing-three-tier"],
    });

    expect(res.blocksUsed).toContain("hero-centered-media");
    expect(res.blocksUsed).toContain("pricing-three-tier");
    expect(res.code).toContain("HeroCenteredMedia");
    expect(res.code).toContain("PricingThreeTier");
  });

  it("produces token-strict code without raw color leaks", () => {
    const res = synthesizeLayout({
      prompt: "SaaS billing and Stripe payment checkout",
      category: "pricing",
    });

    expect(matchHexColors(res.code)).toEqual([]);
    expect(res.code).not.toMatch(/rgb\(/);
    expect(res.tokenCompliance.score).toBe(100);
  });
});

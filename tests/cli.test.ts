import { describe, it, expect } from "vitest";
import { COMMUNITY_BLOCKS, SYSTEM_BLOCKS } from "@shavin/block-schema";
import { runCli } from "../packages/cli/src/index.mjs";

describe("@shavin/cli Suite", () => {
  it("provides all system blocks in registry (COMMUNITY_BLOCKS alias matches SYSTEM_BLOCKS)", () => {
    expect(COMMUNITY_BLOCKS.length).toBe(SYSTEM_BLOCKS.length);
    expect(COMMUNITY_BLOCKS.length).toBeGreaterThanOrEqual(25);
    const slugs = COMMUNITY_BLOCKS.map((b) => b.slug);
    expect(slugs).toContain("hero-centered-media");
    expect(slugs).toContain("features-bento-grid");
    expect(slugs).toContain("pricing-three-tier");
    expect(slugs).toContain("auth-split-screen");
    expect(slugs).toContain("metrics-kpi-grid");
    expect(slugs).toContain("testimonials-review-grid");
    expect(slugs).toContain("nav-header-mega-menu");
    expect(slugs).toContain("cta-mesh-band");
  });

  it("handles help flag without throwing", async () => {
    await expect(runCli(["--help"])).resolves.not.toThrow();
  });
});

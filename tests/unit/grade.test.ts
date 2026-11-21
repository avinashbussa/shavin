import { describe, it, expect } from "vitest";
// @ts-expect-error plain mjs helper
import { gradeScore, renderGrade, gradeBadge, DEFAULT_TIERS, DEFAULT_THRESHOLD, DEFAULT_ACCEPTABLE } from "../../scripts/lib/grade.mjs";

describe("gradeScore", () => {
  it("default preset is data with ascending tiers aligned to the default threshold", () => {
    expect(DEFAULT_TIERS.map((t: { name: string; min: number }) => [t.name, t.min])).toEqual([
      ["bronze", 90], ["silver", 95], ["gold", 98], ["platinum", 100],
    ]);
    expect(DEFAULT_TIERS[0].min).toBe(DEFAULT_THRESHOLD);
    expect(Object.isFrozen(DEFAULT_TIERS)).toBe(true);
  });

  it("acceptable floor is data and defaults to 80", () => {
    expect(DEFAULT_ACCEPTABLE).toBe(80);
  });

  it("needs work below the acceptable floor (mild, not a failure label)", () => {
    for (const s of [0, 50, 79, 79.9]) {
      expect(gradeScore(s)).toMatchObject({ passed: false, band: "needs-work", tier: null, label: "NEEDS WORK", tone: "warning" });
    }
    expect(gradeScore(NaN).band).toBe("needs-work");
  });

  it.each([80, 85, 89, 89.9])("score %s is acceptable (80 up to the threshold)", (score) => {
    expect(gradeScore(score)).toMatchObject({ passed: false, band: "acceptable", tier: null, label: "ACCEPTABLE", tone: "neutral" });
  });

  it.each([
    [90, "bronze"], [94, "bronze"], [95, "silver"], [97, "silver"],
    [98, "gold"], [99, "gold"], [100, "platinum"],
  ])("score %s is verified at tier %s (below, at and above each boundary)", (score, tier) => {
    expect(gradeScore(score)).toMatchObject({ passed: true, tier, label: "VERIFIED", tone: "success" });
  });

  it("honours a per-call threshold and acceptable floor", () => {
    expect(gradeScore(85, { threshold: 80 })).toMatchObject({ passed: true, tier: null, label: "VERIFIED" });
    expect(gradeScore(92, { threshold: 95 })).toMatchObject({ passed: false, band: "acceptable" });
    expect(gradeScore(79, { acceptable: 70 }).band).toBe("acceptable");
    expect(gradeScore(69, { acceptable: 70 }).band).toBe("needs-work");
    expect(gradeScore(70, { acceptable: 70 }).band).toBe("acceptable");
    expect(gradeScore(60, { threshold: 50, acceptable: 90 }).band).toBe("verified");
    expect(gradeScore(95, { threshold: 95 })).toMatchObject({ passed: true, tier: "silver" });
  });

  it("honours a custom preset", () => {
    const tiers = [{ name: "a", min: 50 }, { name: "b", min: 75 }];
    expect(gradeScore(60, { threshold: 50, tiers }).tier).toBe("a");
    expect(gradeScore(80, { threshold: 50, tiers }).tier).toBe("b");
  });

  it("renders plain text with the supplied formatter and never says AAA", () => {
    const fmt = { pass: (t: string) => `ok ${t}`, fail: (t: string) => `bad ${t}`, badge: (t: string) => `[${t}]`, warn: (t: string) => `warn ${t}`, muted: (t: string) => `muted ${t}` };
    const c = { success: "", error: "", warning: "" };
    expect(gradeBadge(99, { fmt, c })).toBe("ok VERIFIED [GOLD]");
    expect(gradeBadge(99, { fmt, c }, undefined, "READY")).toBe("ok VERIFIED [GOLD · READY]");
    expect(gradeBadge(85, { fmt, c })).toBe("muted ACCEPTABLE");
    expect(gradeBadge(70, { fmt, c })).toBe("warn NEEDS WORK [BELOW 80]");
    expect(gradeBadge(70, { fmt, c }, { threshold: 60 })).toBe("ok VERIFIED");
    expect(gradeBadge(99, { fmt, c })).not.toMatch(/AAA/);
  });
});

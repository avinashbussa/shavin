/**
 * autofix.test.ts — Unit tests for the evals/src/autofix.mjs transformer.
 *
 * Tests each autofix transformation to ensure it correctly converts
 * non-compliant code to token-compliant code.
 */

import { describe, it, expect } from "vitest";
import { autofix } from "../../evals/src/autofix.mjs";

// ── Radius Transformations ────────────────────────────────────────────
describe("autofix: literal radius → token radius (role-aware)", () => {
  it("converts rounded-sm → rounded-[var(--radius-lg)] (small radii are controls)", () => {
    const result = autofix(`<div className="rounded-sm" />`);
    expect(result.fixedCode).toContain("rounded-[var(--radius-lg)]");
    expect(result.fixesApplied.some((f) => f.includes("rounded-sm"))).toBe(true);
  });

  it("converts rounded-lg on a control → lg", () => {
    const result = autofix(`<Button className="rounded-lg" />`);
    expect(result.fixedCode).toContain("rounded-[var(--radius-lg)]");
  });

  it("converts rounded-xl / 2xl on a container → panel", () => {
    expect(autofix(`<Card className="rounded-xl" />`).fixedCode).toContain("rounded-[var(--radius-panel)]");
    expect(autofix(`<Card className="rounded-2xl" />`).fixedCode).toContain("rounded-[var(--radius-panel)]");
  });

  it("converts multiple radius in the same className tag by tag", () => {
    const result = autofix(`<Card className="rounded-2xl"><Button className="rounded-lg" /></Card>`);
    expect(result.fixedCode).not.toMatch(/rounded-(lg|2xl)\b/);
  });
});

describe("autofix: arbitrary pixel radius → token radius", () => {
  it("converts rounded-[8px] → token radius", () => {
    const result = autofix(`<div className="rounded-[8px]" />`);
    expect(result.fixedCode).not.toContain("rounded-[8px]");
    expect(result.fixedCode).toContain("var(--radius-");
  });

  it("converts rounded-[16px] → token radius", () => {
    const result = autofix(`<div className="rounded-[16px]" />`);
    expect(result.fixedCode).not.toContain("rounded-[16px]");
    expect(result.fixedCode).toContain("var(--radius-");
  });
});

describe("autofix: ad-hoc calc() radius → concentric utility", () => {
  it("converts calc(panel - 20px) → rounded-panel-p5 (px / 4)", () => {
    const result = autofix(`<div className="rounded-[calc(var(--radius-panel) - 20px)]" />`);
    expect(result.fixedCode).toContain("rounded-panel-p5");
  });
});

// ── Foundation Var Transformations ───────────────────────────────────
describe("autofix: --n-* foundation vars → semantic tokens", () => {
  it("converts var(--n-0) → var(--bg-canvas)", () => {
    const result = autofix(`<div style={{ color: "var(--n-0)" }} />`);
    expect(result.fixedCode).toContain("var(--bg-canvas)");
    expect(result.fixedCode).not.toContain("var(--n-0)");
  });

  it("converts var(--n-900) → var(--fg)", () => {
    const result = autofix(`<div style={{ color: "var(--n-900)" }} />`);
    expect(result.fixedCode).toContain("var(--fg)");
    expect(result.fixedCode).not.toContain("var(--n-900)");
  });
});

// ── Prop Name Transformations ────────────────────────────────────────
describe("autofix: prop name aliases → correct prop names", () => {
  it("converts fontWeight → weight", () => {
    const result = autofix(`<Text fontWeight="bold">text</Text>`);
    expect(result.fixedCode).toContain('weight="bold"');
    expect(result.fixedCode).not.toContain("fontWeight");
  });

  it("converts icon='check' → name='check'", () => {
    const result = autofix(`<Icon icon="check" />`);
    expect(result.fixedCode).toContain('name="check"');
    expect(result.fixedCode).not.toContain('icon="check"');
  });
});

// ── Invalid Prop Value Transformations ───────────────────────────────
describe("autofix: invalid prop values → corrected values", () => {
  it("converts Button tone='neutral' → variant='ghost'", () => {
    const result = autofix(`<Button tone="neutral">Click</Button>`);
    expect(result.fixedCode).not.toContain('tone="neutral"');
    expect(result.fixedCode).toContain('variant="ghost"');
  });
});

// ── Deep Import Transformations ──────────────────────────────────────
describe("autofix: deep imports → root import", () => {
  it("converts deep import to root @shavin/ui import", () => {
    const result = autofix(`import { Button } from "@shavin/ui/primitives/Button";\n<Button />`);
    expect(result.fixedCode).toContain(`from "@shavin/ui"`);
    expect(result.fixedCode).not.toContain("@shavin/ui/primitives");
  });

  it("merges deep import names into existing root import", () => {
    const result = autofix(`import { Card } from "@shavin/ui";\nimport { Button } from "@shavin/ui/src/Button";\n<Card><Button /></Card>`);
    expect(result.fixedCode).toContain(`from "@shavin/ui"`);
    expect(result.fixedCode).not.toContain("@shavin/ui/src");
    // Both Card and Button should be in the merged import
    expect(result.fixedCode).toContain("Card");
    expect(result.fixedCode).toContain("Button");
  });
});

// ── Raw Tailwind Color Transformations ───────────────────────────────
describe("autofix: raw Tailwind colors → semantic tokens", () => {
  it("converts bg-slate-500 → bg-surface", () => {
    const result = autofix(`<div className="bg-slate-500" />`);
    expect(result.fixedCode).toContain("bg-surface");
    expect(result.fixedCode).not.toContain("bg-slate-500");
  });

  it("converts text-blue-600 → text-brand-text", () => {
    const result = autofix(`<Text className="text-blue-600">text</Text>`);
    expect(result.fixedCode).toContain("text-brand-text");
    expect(result.fixedCode).not.toContain("text-blue-600");
  });

  it("converts border-red-300 → border-danger", () => {
    const result = autofix(`<div className="border-red-300" />`);
    expect(result.fixedCode).toContain("border-danger");
    expect(result.fixedCode).not.toContain("border-red-300");
  });
});

// ── data-panel Fix ────────────────────────────────────────────────────
describe("autofix: data-panel attribute", () => {
  it("adds data-panel to PopoverContent", () => {
    const result = autofix(`<PopoverContent>content</PopoverContent>`);
    expect(result.fixedCode).toContain("data-panel");
  });

  it("adds data-panel to DialogContent", () => {
    const result = autofix(`<DialogContent>content</DialogContent>`);
    expect(result.fixedCode).toContain("data-panel");
  });

  it("does not add duplicate data-panel if already present", () => {
    const result = autofix(`<PopoverContent data-panel>content</PopoverContent>`);
    expect(result.fixedCode.match(/data-panel/g)?.length).toBe(1);
  });
});

// ── Glyph Transformations ─────────────────────────────────────────────
describe("autofix: glyph → Icon component", () => {
  it("converts ✓ glyph to <Icon name='Check' />", () => {
    const result = autofix(`<Text>✓ Done</Text>`);
    expect(result.fixedCode).toContain('<Icon name="Check" />');
  });

  it("converts → glyph to <Icon name='ArrowRight' />", () => {
    const result = autofix(`<Text>Go →</Text>`);
    expect(result.fixedCode).toContain('<Icon name="ArrowRight" />');
  });
});

// ── Clean Code (No-Op) ────────────────────────────────────────────────
describe("autofix: clean code remains unchanged", () => {
  it("does not modify fully token-compliant code", () => {
    const clean = `import { Card, Text, Button } from "@shavin/ui";\n<Card><Text>Hello</Text><Button>OK</Button></Card>`;
    const result = autofix(clean);
    // The code should be identical (no transformations needed)
    expect(result.fixesApplied).toHaveLength(0);
  });
});

// ── Multiple Fixes ────────────────────────────────────────────────────
describe("autofix: multiple violations in one snippet", () => {
  it("fixes radius, colors, and prop names together", () => {
    const dirty = `
import { Text, Icon } from "@shavin/ui";
<Card className="bg-slate-100 rounded-lg">
  <Text fontWeight="bold">✓ Check</Text>
  <Icon icon="star" />
</Card>
`;
    const result = autofix(dirty);
    expect(result.fixesApplied.length).toBeGreaterThanOrEqual(3);
    expect(result.fixedCode).not.toContain("rounded-lg");
    expect(result.fixedCode).not.toContain("bg-slate-100");
    expect(result.fixedCode).not.toContain("fontWeight");
    expect(result.fixedCode).not.toContain('icon="star"');
  });
});

describe("autofix: role-aware radius (shared with validate_code)", () => {
  it("never maps a control to the panel radius", () => {
    const result = autofix(`<Button className="rounded-xl" />`);
    expect(result.fixedCode).toContain("rounded-[var(--radius-lg)]");
    expect(result.fixedCode).not.toContain("radius-panel");
  });
  it("maps a container to the panel radius and leaves an ambiguous div alone", () => {
    expect(autofix(`<Card className="rounded-xl" />`).fixedCode).toContain("rounded-[var(--radius-panel)]");
    expect(autofix(`<div className="rounded-xl" />`).fixedCode).toContain("rounded-xl");
  });
  it("leaves an off-scale calc(panel - 5px) alone", () => {
    expect(autofix(`<div className="rounded-[calc(var(--radius-panel) - 5px)]" />`).fixedCode).toContain("calc(var(--radius-panel) - 5px)");
  });
});

/**
 * evaluator.test.ts — Unit tests for the evals/src/evaluator.mjs engine.
 *
 * Tests each evaluator check category to ensure violations are detected
 * and clean code passes without false positives.
 */

import { describe, it, expect } from "vitest";
import { evaluateCode } from "../../evals/src/evaluator.mjs";

// ── Token & Color Compliance ──────────────────────────────────────────
describe("evaluator: hex color detection", () => {
  it("flags hardcoded hex colors in className", () => {
    const result = evaluateCode(`<div className="bg-[#ff0000]" />`);
    expect(result.violations.some((v) => v.includes("Hex color"))).toBe(true);
    expect(result.score).toBeLessThan(100);
  });

  it("passes when using semantic tokens", () => {
    const result = evaluateCode(`<div className="bg-surface" />`);
    expect(result.violations.some((v) => v.includes("Hex"))).toBe(false);
  });
});

describe("evaluator: rgb/rgba detection", () => {
  it("flags raw rgb() literals", () => {
    const result = evaluateCode(`<div style={{ color: "rgb(255,0,0)" }} />`);
    expect(result.violations.some((v) => v.includes("rgb"))).toBe(true);
  });
});

describe("evaluator: --n-* foundation var detection", () => {
  it("flags --n-* references", () => {
    const result = evaluateCode(`<div style={{ color: "var(--n-500)" }} />`);
    expect(result.violations.some((v) => v.includes("foundation"))).toBe(true);
  });
});

describe("evaluator: raw Tailwind color scale detection", () => {
  it("flags bg-slate-500", () => {
    const result = evaluateCode(`<div className="bg-slate-500" />`);
    expect(result.violations.some((v) => v.includes("Tailwind color scale"))).toBe(true);
  });

  it("flags text-blue-600", () => {
    const result = evaluateCode(`<Text className="text-blue-600">hi</Text>`);
    expect(result.violations.some((v) => v.includes("Tailwind color scale"))).toBe(true);
  });
});

// ── Radius & Spacing ──────────────────────────────────────────────────
describe("evaluator: literal radius detection", () => {
  it("flags rounded-lg", () => {
    const result = evaluateCode(`<div className="rounded-lg" />`);
    expect(result.violations.some((v) => v.includes("Literal radius"))).toBe(true);
  });

  it("flags rounded-2xl", () => {
    const result = evaluateCode(`<div className="rounded-2xl" />`);
    expect(result.violations.some((v) => v.includes("Literal radius"))).toBe(true);
  });
});

describe("evaluator: arbitrary pixel radius detection", () => {
  it("flags rounded-[8px]", () => {
    const result = evaluateCode(`<div className="rounded-[8px]" />`);
    expect(result.violations.some((v) => v.includes("Arbitrary pixel radius"))).toBe(true);
  });

  it("flags rounded-[12px]", () => {
    const result = evaluateCode(`<div className="rounded-[12px]" />`);
    expect(result.violations.some((v) => v.includes("Arbitrary pixel radius"))).toBe(true);
  });
});

// ── Primitive Usage ───────────────────────────────────────────────────
describe("evaluator: raw HTML element detection", () => {
  it("flags <div> in JSX", () => {
    const result = evaluateCode(`<div className="p-4">content</div>`);
    expect(result.violations.some((v) => v.includes("Raw HTML") && v.includes("div"))).toBe(true);
  });

  it("flags <p> in JSX", () => {
    const result = evaluateCode(`<p className="text-sm">text</p>`);
    expect(result.violations.some((v) => v.includes("Raw HTML") && v.includes("<p>"))).toBe(true);
  });

  it("flags <h2> in JSX", () => {
    const result = evaluateCode(`<h2>Title</h2>`);
    expect(result.violations.some((v) => v.includes("Raw HTML") && v.includes("h2"))).toBe(true);
  });

  it("flags <button> in JSX", () => {
    const result = evaluateCode(`<button onClick={handleClick}>Click</button>`);
    expect(result.violations.some((v) => v.includes("Raw HTML") && v.includes("button"))).toBe(true);
  });

  it("does not flag @shavin/ui primitives", () => {
    const result = evaluateCode(`<Box className="p-4"><Text>content</Text></Box>`);
    expect(result.violations.some((v) => v.includes("Raw HTML"))).toBe(false);
  });

  it("does not flag import statements", () => {
    const result = evaluateCode(`import { Box } from "@shavin/ui";\n<Box />`);
    expect(result.violations.some((v) => v.includes("Raw HTML"))).toBe(false);
  });
});

describe("evaluator: glyph/emoji detection", () => {
  it("flags checkmark glyph ✓", () => {
    const result = evaluateCode(`<Text>✓ Done</Text>`);
    expect(result.violations.some((v) => v.includes("glyph") && v.includes("Check"))).toBe(true);
  });

  it("flags arrow glyph →", () => {
    const result = evaluateCode(`<Text>Go →</Text>`);
    expect(result.violations.some((v) => v.includes("glyph") && v.includes("Arrow"))).toBe(true);
  });

  it("flags star glyph ★", () => {
    const result = evaluateCode(`<Text>★ Favorite</Text>`);
    expect(result.violations.some((v) => v.includes("glyph") && v.includes("Star"))).toBe(true);
  });

  it("does not flag regular text", () => {
    const result = evaluateCode(`<Text>Hello World</Text>`);
    expect(result.violations.some((v) => v.includes("glyph"))).toBe(false);
  });
});

describe("evaluator: inline style detection", () => {
  it("flags inline styles with color", () => {
    const result = evaluateCode(`<Box style={{ color: "red" }}>text</Box>`);
    expect(result.violations.some((v) => v.includes("Inline style"))).toBe(true);
  });

  it("flags inline styles with borderRadius", () => {
    const result = evaluateCode(`<Box style={{ borderRadius: "8px" }}>text</Box>`);
    expect(result.violations.some((v) => v.includes("Inline style"))).toBe(true);
  });

  it("does not flag inline styles without visual properties", () => {
    const result = evaluateCode(`<Box style={{ display: "flex" }}>text</Box>`);
    expect(result.violations.some((v) => v.includes("Inline style"))).toBe(false);
  });
});

// ── Prop Name & Value Compliance ──────────────────────────────────────
describe("evaluator: prop name alias detection", () => {
  it("flags fontWeight prop", () => {
    const result = evaluateCode(`<Text fontWeight="bold">text</Text>`);
    expect(result.violations.some((v) => v.includes("fontWeight") && v.includes("weight"))).toBe(true);
  });

  it("flags icon prop (should be name)", () => {
    const result = evaluateCode(`<Icon icon="check" />`);
    expect(result.violations.some((v) => v.includes("'icon'") && v.includes("'name'"))).toBe(true);
  });
});

describe("evaluator: invalid prop value detection", () => {
  it("flags Button tone='neutral'", () => {
    const result = evaluateCode(`<Button tone="neutral">Click</Button>`);
    expect(result.violations.some((v) => v.includes("tone") && v.includes("neutral"))).toBe(true);
  });
});

// ── Import Hygiene ─────────────────────────────────────────────────────
describe("evaluator: deep import detection", () => {
  it("flags deep import from @shavin/ui/primitives", () => {
    const result = evaluateCode(`import { Button } from "@shavin/ui/primitives/Button";\n<Button />`);
    expect(result.violations.some((v) => v.includes("Deep import"))).toBe(true);
  });

  it("flags deep import from @shavin/ui/src", () => {
    const result = evaluateCode(`import { Box } from "@shavin/ui/src/components/Box";\n<Box />`);
    expect(result.violations.some((v) => v.includes("Deep import"))).toBe(true);
  });

  it("does not flag root @shavin/ui import", () => {
    const result = evaluateCode(`import { Button } from "@shavin/ui";\n<Button />`);
    expect(result.violations.some((v) => v.includes("Deep import"))).toBe(false);
  });

  it("does not flag @shavin/ui/styles.css import", () => {
    const result = evaluateCode(`import "@shavin/ui/styles.css";`);
    expect(result.violations.some((v) => v.includes("Deep import"))).toBe(false);
  });
});

// ── Component Coverage ────────────────────────────────────────────────
describe("evaluator: component coverage", () => {
  it("reports 100% coverage when all expected components are present", () => {
    const result = evaluateCode(
      `import { Button, Card, Badge } from "@shavin/ui";\n<Card><Button /><Badge /></Card>`,
      ["Button", "Card", "Badge"]
    );
    expect(result.metrics.componentCoverage).toBe(100);
  });

  it("reports partial coverage when some components are missing", () => {
    const result = evaluateCode(
      `import { Button } from "@shavin/ui";\n<Button />`,
      ["Button", "Card", "Badge"]
    );
    expect(result.metrics.componentCoverage).toBeLessThan(100);
  });
});

// ── Anti-Slop ─────────────────────────────────────────────────────────
describe("evaluator: AI copy slop detection", () => {
  it("flags 'In today's fast-paced'", () => {
    const result = evaluateCode(`<Text>In today's fast-paced world</Text>`);
    expect(result.violations.some((v) => v.includes("slop"))).toBe(true);
  });

  it("flags 'Unleash the power'", () => {
    const result = evaluateCode(`<Text>Unleash the power of</Text>`);
    expect(result.violations.some((v) => v.includes("slop"))).toBe(true);
  });

  it("flags 'Lorem ipsum'", () => {
    const result = evaluateCode(`<Text>Lorem ipsum dolor sit amet</Text>`);
    expect(result.violations.some((v) => v.includes("slop") && v.includes("Lorem"))).toBe(true);
  });
});

// ── Clean Code ────────────────────────────────────────────────────────
describe("evaluator: clean code scenarios", () => {
  it("returns score 100 and isClean=true for fully compliant code", () => {
    const clean = `
import { Card, Text, Heading, Button, Badge, Flex } from "@shavin/ui";

export function Component() {
  return (
    <Card padding="4" className="w-full">
      <Flex direction="col" gap="3">
        <Heading as="h2" size="lg">Title</Heading>
        <Text color="muted">Description text</Text>
        <Badge variant="soft" size="sm">New</Badge>
        <Button variant="solid" size="md">Submit</Button>
      </Flex>
    </Card>
  );
}
`;
    const result = evaluateCode(clean, ["Card", "Text", "Heading", "Button", "Badge", "Flex"]);
    expect(result.score).toBe(100);
    expect(result.isClean).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("catches multiple violations in dirty code", () => {
    const dirty = `
import { Button } from "@shavin/ui/primitives/Button";

export function Component() {
  return (
    <div className="bg-[#ff0000] rounded-lg p-4">
      <p className="text-blue-600">✓ Check this out →</p>
      <button onClick={handleClick} style={{ color: "red" }}>Click</button>
    </div>
  );
}
`;
    const result = evaluateCode(dirty);
    expect(result.score).toBeLessThan(60);
    expect(result.violations.length).toBeGreaterThanOrEqual(5);
  });
});

// ── Edge Cases ────────────────────────────────────────────────────────
describe("evaluator: edge cases", () => {
  it("returns score 0 for empty code", () => {
    const result = evaluateCode("");
    expect(result.score).toBe(0);
    expect(result.violations).toContain("Empty or invalid code string");
  });

  it("returns score 0 for null code", () => {
    const result = evaluateCode(null);
    expect(result.score).toBe(0);
  });

  it("returns metrics object with all keys", () => {
    const result = evaluateCode(`<Box />`);
    expect(result.metrics).toHaveProperty("hexLeaks");
    expect(result.metrics).toHaveProperty("foundationLeaks");
    expect(result.metrics).toHaveProperty("literalRadiusLeaks");
    expect(result.metrics).toHaveProperty("componentCoverage");
    expect(result.metrics).toHaveProperty("rawHTMLElements");
    expect(result.metrics).toHaveProperty("glyphLeaks");
    expect(result.metrics).toHaveProperty("inlineStyles");
    expect(result.metrics).toHaveProperty("propNameIssues");
    expect(result.metrics).toHaveProperty("importIssues");
  });
});

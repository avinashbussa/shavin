import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { findConcentricIssues, concentricAutofix, innerClass } from "../../packages/mcp-server/src/tools/concentric-lint.mjs";
// @ts-expect-error — plain .mjs module without types
import { validateCode, validateCodeDense, autofixCode } from "../../packages/mcp-server/src/tools/validation.mjs";

type Issue = { rule: string; message: string; from: string; to: string | null };
const issues = (code: string) => findConcentricIssues(code) as Issue[];
const rules = (code: string) => issues(code).map((i) => i.rule);

describe("concentric lint: invalid nesting, exact fix in every message", () => {
  it("panel inside a p-4 panel keeps the panel radius", () => {
    const [i] = issues(`<Box className="rounded-[var(--radius-panel)] p-4"><Box className="rounded-[var(--radius-panel)]" /></Box>`);
    expect(i.rule).toBe("concentric-nested");
    expect(i.to).toBe("rounded-panel-p4");
    expect(i.message).toContain("write rounded-panel-p4 in place of rounded-[var(--radius-panel)]");
  });

  it("padding decides the class (p-1 -> rounded-panel-p1, p-3 -> p3)", () => {
    expect(issues(`<Box className="rounded-panel p-1"><Box className="rounded-panel" /></Box>`)[0].to).toBe("rounded-panel-p1");
    expect(issues(`<Box className="rounded-panel p-3"><Box className="rounded-panel" /></Box>`)[0].to).toBe("rounded-panel-p3");
  });

  it("an off-scale padding gets the explicit max(floor, calc(panel - X)) value", () => {
    const [i] = issues(`<Box className="rounded-panel p-2.5"><Box className="rounded-panel" /></Box>`);
    expect(i.to).toBe("rounded-[max(min(var(--radius-lg),calc(var(--radius-panel)/2)),calc(var(--radius-panel)_-_0.625rem))]");
    expect(innerClass(12)).toBe("rounded-panel-p3");
  });

  it("a control in a p-1 panel needs rounded-panel-p1, not lg", () => {
    const [i] = issues(`<Box className="rounded-panel p-1"><Button className="rounded-[var(--radius-lg)]" /></Box>`);
    expect(i.to).toBe("rounded-panel-p1");
  });

  it("a control with the panel radius inside a p-4 panel gets lg (role-aware)", () => {
    const [i] = issues(`<Box className="rounded-panel p-4"><Button className="rounded-panel" /></Box>`);
    expect(i.to).toBe("rounded-[var(--radius-lg)]");
  });

  it("a panel inside a control-radius element is too big", () => {
    const [i] = issues(`<Box className="rounded-[var(--radius-lg)] p-2"><Box className="rounded-panel" /></Box>`);
    expect(i.to).toBe("rounded-[var(--radius-lg)]");
  });

  it("transparent wrappers add their padding", () => {
    const [i] = issues(`<Box className="rounded-panel p-1"><Flex className="p-1"><Box className="rounded-panel" /></Flex></Box>`);
    expect(i.to).toBe("rounded-panel-p2");
  });

  it("Card padding prop gives the padding", () => {
    const [i] = issues(`<Card padding="sm"><Box className="rounded-[var(--radius-panel)]" /></Card>`.replace("<Card", `<Card className="rounded-panel"`));
    expect(i.to).toBe("rounded-panel-p4");
  });

  it("a control with the panel radius (no nesting) -> lg", () => {
    const [i] = issues(`<Button className="rounded-[var(--radius-panel)]">Go</Button>`);
    expect(i.rule).toBe("concentric-control-panel");
    expect(i.to).toBe("rounded-[var(--radius-lg)]");
  });

  it("a Card or data-panel container with the control radius -> panel", () => {
    expect(issues(`<Card className="rounded-[var(--radius-lg)]" />`)[0]).toMatchObject({ rule: "concentric-container-control", to: "rounded-[var(--radius-panel)]" });
    expect(issues(`<div data-panel className="rounded-[var(--radius-lg)]" />`)[0].rule).toBe("concentric-container-control");
  });

  it("flows through validateCode and the dense output", () => {
    const code = `<Box className="rounded-panel p-4"><Box className="rounded-panel" /></Box>`;
    expect(validateCode(code).some((v: string) => v.includes("rounded-panel-p4"))).toBe(true);
    expect(validateCodeDense(code).some((v: string) => v.includes("=> rounded-panel-p4"))).toBe(true);
  });
});

describe("concentric lint: valid code and no false positives", () => {
  const ok = (code: string) => expect(rules(code).filter((r) => r !== "literal-radius")).toEqual([]);

  it("correct nested inner radius", () => {
    ok(`<Box className="rounded-panel p-4"><Box className="rounded-panel-p4" /></Box>`);
    ok(`<Box className="rounded-panel p-1"><Box className="rounded-panel-p1" /></Box>`);
  });
  it("lg inside a deeply padded panel equals the floor", () => {
    ok(`<Box className="rounded-panel p-4"><Button className="rounded-[var(--radius-lg)]" /></Box>`);
    ok(`<Card className="rounded-panel" padding="md"><Box className="rounded-[var(--radius-lg)]" /></Card>`);
  });
  it("the library's own calc(panel - Npx) form is accepted and not flagged", () => {
    ok(`<Box className="rounded-panel p-1"><Box className="rounded-[calc(var(--radius-panel)_-_4px)]" /></Box>`);
    expect(validateCode(`<Box className="rounded-[calc(var(--radius-panel)_-_4px)]" />`)).toEqual([]);
  });
  it("rounded-full is allowed everywhere", () => {
    ok(`<Box className="rounded-panel p-4"><Avatar className="rounded-full" /><Badge className="rounded-full" /></Box>`);
    expect(validateCode(`<Box className="rounded-full p-4"><Box className="rounded-panel" /></Box>`)).toEqual([]);
  });
  it("same radius with no padding is concentric", () => {
    ok(`<Box className="rounded-panel"><Box className="rounded-panel" /></Box>`);
  });
  it("unknown padding gives no verdict", () => {
    ok(`<Card className="rounded-panel"><Box className="rounded-panel" /></Card>`);
    ok(`<Widget className="rounded-panel"><Box className="rounded-panel" /></Widget>`);
  });
  it("a sharp bg wrapper is a reference and ends the check", () => {
    ok(`<Box className="rounded-panel p-4"><div className="bg-surface p-4"><Box className="rounded-panel" /></div></Box>`);
  });
  it("controls and containers with the right token are clean", () => {
    ok(`<Button className="rounded-[var(--radius-lg)]" /><Card className="rounded-[var(--radius-panel)]" />`);
  });
  it("generic elements, generics and comparisons do not confuse the scanner", () => {
    ok(`const a: Array<string> = []; if (a.length < 3) { const x = <Box className="rounded-panel p-4"><Box className="rounded-panel-p4" /></Box>; }`);
  });
  it("exempt marked lines are skipped", () => {
    ok(`<Box data-gradient="true" className="rounded-panel p-4"><Box className="rounded-panel" /></Box>`);
  });
});

describe("literal radius: exact fix per role", () => {
  it("control -> lg, container -> panel, small -> lg", () => {
    expect(issues(`<Button className="rounded-xl" />`)[0].to).toBe("rounded-[var(--radius-lg)]");
    expect(issues(`<Card className="rounded-xl" />`)[0].to).toBe("rounded-[var(--radius-panel)]");
    expect(issues(`<div className="rounded-md" />`)[0].to).toBe("rounded-[var(--radius-lg)]");
  });
  it("ambiguous role names both exact options and is flag-only", () => {
    const [i] = issues(`<div className="rounded-xl p-4" />`);
    expect(i.to).toBeNull();
    expect(i.message).toContain("rounded-[var(--radius-panel)]");
    expect(i.message).toContain("rounded-[var(--radius-lg)]");
  });
  it("nested literal -> rounded-panel-pN", () => {
    expect(issues(`<Box className="rounded-panel p-4"><div className="rounded-xl" /></Box>`)[0].to).toBe("rounded-panel-p4");
  });
});

describe("role-aware autofix", () => {
  it("never turns a control into a panel", () => {
    const { fixedCode } = autofixCode(`<Button className="rounded-lg px-4">Go</Button>`);
    expect(fixedCode).toContain("rounded-[var(--radius-lg)]");
    expect(fixedCode).not.toContain("radius-panel");
  });
  it("fixes containers, nested, and concentric mistakes; reports ambiguous ones", () => {
    const code = `<Card className="rounded-2xl p-4"><Box className="rounded-[var(--radius-panel)]" /><div className="rounded-xl" /><Button className="rounded-[var(--radius-panel)]" /></Card>`;
    const r = autofixCode(code);
    expect(r.fixedCode).toContain(`<Card className="rounded-[var(--radius-panel)] p-4">`);
    expect(r.fixedCode).toContain(`<Button className="rounded-[var(--radius-lg)]"`);
    expect(r.fixedCode).toContain("rounded-panel-p4");
    expect(r.fixedCode).not.toMatch(/rounded-(xl|2xl)\b/);
    expect(r.unfixed).toEqual([]);
    const amb = autofixCode(`<div className="rounded-xl" />`);
    expect(amb.fixedCode).toBe(`<div className="rounded-xl" />`);
    expect(amb.unfixed).toHaveLength(1);
  });
  it("keeps variant prefixes and is idempotent", () => {
    const once = concentricAutofix(`<Button className="md:rounded-lg rounded-md" />`).fixedCode;
    expect(once).toBe(`<Button className="md:rounded-[var(--radius-lg)] rounded-[var(--radius-lg)]" />`);
    expect(concentricAutofix(once).fixesApplied).toEqual([]);
  });
});

describe("shared with audit_source and check_page", () => {
  it("scanDirectory reports concentric findings with the exact class", async () => {
    const { mkdtempSync, mkdirSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    // @ts-expect-error — plain .mjs module without types
    const { scanDirectory } = await import("../../packages/mcp-server/src/tools/archlint.mjs");
    const dir = mkdtempSync(join(tmpdir(), "shavin-conc-"));
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { "@shavin/ui": "*" } }));
    writeFileSync(join(dir, "src/page.tsx"), `import { Box } from "@shavin/ui";\nexport const A = () => <Box className="rounded-panel p-4"><Box className="rounded-panel" /></Box>;\n`);
    const res = JSON.stringify(await scanDirectory(dir));
    expect(res).toContain("concentric-nested");
    expect(res).toContain("rounded-panel-p4");
  });
});

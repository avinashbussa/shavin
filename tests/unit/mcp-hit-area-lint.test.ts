import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
// @ts-ignore .mjs
import { findHitAreaWarnings } from "../../packages/mcp-server/src/tools/hit-area-lint.mjs";
// @ts-ignore .mjs
import { registerValidationTools } from "../../packages/mcp-server/src/tools/validation.mjs";

const C = JSON.parse(readFileSync("components.json", "utf8"));
const validate = registerValidationTools({}, C).find((t: any) => t.schema.name === "validate_code")!;
const run = async (code: string, density = "dense"): Promise<string> =>
  (await validate.handler({ code, density })).content[0].text;

describe("validate_code hit-area-none rule (warning level)", () => {
  it('flags hitArea="none" with the AA trade-off and the restore steps', () => {
    const w = findHitAreaWarnings(`<Button hitArea="none">x</Button>`);
    expect(w).toHaveLength(1);
    expect(w[0].rule).toBe("hit-area-none");
    expect(w[0].message).toContain("2.5.8");
    expect(w[0].message).toContain("24px");
    expect(w[0].message).toContain("Button");
    expect(w[0].message).toContain('hitArea="default"');
    expect(w[0].message).toContain("hit-area utility");
  });

  it("covers sub-parts, single quotes and braced literals, one finding per component", () => {
    const code = `<TabsTrigger hitArea='none' /><Radio hitArea={"none"} /><Radio hitArea="none" /><Button onClick={() => go()} hitArea="none" />`;
    const names = findHitAreaWarnings(code).map((w: any) => w.message.match(/<(\w+)/)?.[1]);
    expect(names.sort()).toEqual(["Button", "Radio", "TabsTrigger"]);
  });

  it("flags the hit-area-none class, including with a variant prefix", () => {
    expect(findHitAreaWarnings(`<div className="flex hit-area-none" />`)).toHaveLength(1);
    expect(findHitAreaWarnings(`<div className="coarse:hit-area-none" />`)).toHaveLength(1);
    expect(findHitAreaWarnings(`<div className="flex hit-area-none" />`)[0].message).toContain("24px");
  });

  it("is quiet for default, touch, dynamic values, other classes and lookalikes", () => {
    expect(findHitAreaWarnings(`<Button hitArea="default" /><Switch hitArea="touch" /><Button hitArea={x} /><Button hitArea={a ? "none" : "touch"} /><div className="hit-area hit-area-touch hit-area-none-x my-hit-area-none" />`)).toEqual([]);
  });

  it("validate_code: a warning does not fail the file, it rides along with PASS", async () => {
    const out = await run(`<Button hitArea="none">x</Button>`);
    expect(out).toMatch(/^PASS/);
    expect(out).toContain("WARN (1, does not fail)");
    expect(out).toContain("hit-area-none");
    expect(out).toContain("2.5.8");
    expect(out).toContain('hitArea="default"');
  });

  it("validate_code: clean code has no warning; real violations still FAIL and keep the warning", async () => {
    expect(await run(`<Button>x</Button>`)).toBe("PASS: token pure; component variants/props valid.");
    const out = await run(`<Button hitArea="none" className="bg-red-500">x</Button>`);
    expect(out).toMatch(/^FAIL/);
    expect(out).toContain("WARN (1, does not fail)");
  });

  it("validate_code full density lists the warning too", async () => {
    expect(await run(`<Switch hitArea="none" />`, "full")).toContain("Warnings (1, do not fail)");
  });
});

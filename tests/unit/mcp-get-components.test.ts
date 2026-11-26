import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
// @ts-ignore .mjs
import { registerComponentsTool } from "../../packages/mcp-server/src/tools/components.mjs";

const C = JSON.parse(readFileSync("components.json", "utf8"));
const { handler } = registerComponentsTool({}, C);

describe("get_components dense output", () => {
  it("lists props for every component that has them, within a token budget", async () => {
    for (const c of C.components) {
      const text = (await handler({ name: c.name })).content[0].text as string;
      const has = (c.props ?? []).some((p: any) => !["className","style","ref","key","id","ariaLabel"].includes(p.name) && !/@deprecated/i.test(p.doc ?? ""));
      if (has) expect(text, c.name).toContain("props:");
      expect(text.length, c.name).toBeLessThan(1600);
    }
  });
  it("flags generator gaps (informational)", () => {
    const empty = C.components.filter((c: any) => !(c.props ?? []).length && c.kind !== "plain");
    expect(empty.length).toBeLessThan(C.components.length);
  });
});

describe("get_components usage guidance", () => {
  const dense = async (name: string) => (await handler({ name })).content[0].text as string;

  it("every component stays under 1.5KB", async () => {
    for (const c of C.components) {
      const text = await dense(c.name);
      expect(Buffer.byteLength(text), c.name).toBeLessThan(1500);
    }
  });
  it("includes a usage example when the doc has one", async () => {
    for (const c of C.components.filter((x: any) => x.examples?.length)) {
      expect(await dense(c.name), c.name).toContain("example:");
    }
    expect(await dense("Button")).toContain("<Button");
  });
  it("Toast lists useToast and the provider setup", async () => {
    const t = await dense("Toast");
    expect(t).toContain("useToast");
    expect(t).toMatch(/exports:.*useToast/);
    expect(t).toContain("ToastProvider");
    expect(t).toContain("success(");
  });
  it("Table and Skeleton show their sub-component structure", async () => {
    const t = await dense("Table");
    for (const n of ["TableHeader", "TableRow", "TableColumnHeaderCell", "TableBody", "TableCell"]) expect(t).toContain(n);
    expect(t).not.toContain("props: none");
    expect(await dense("Skeleton")).toContain("SkeletonMimic");
  });
  it("TextField keeps OTP-only props off the main props line", async () => {
    const t = await dense("TextField");
    const props = t.split("\n").find((l) => l.startsWith("props:")) ?? "";
    for (const n of ["label", "hint", "errorMessage", "leadingIcon", "showHidePassword"]) expect(props).toContain(n);
    for (const n of ["onComplete", "slotClassName", "separatorIndex"]) expect(props).not.toContain(n);
  });
  it("Callout and Badge use one prop name per line of output", async () => {
    const callout = await dense("Callout");
    expect(callout).not.toContain("tone=");
    expect(callout).toContain("color=");
    const badge = await dense("Badge");
    expect(badge).not.toMatch(/\bcolor\b/);
    expect(badge).toContain('tone="success"');
  });
  it("exports lists only names the folder index re-exports", async () => {
    const t = await dense("MotionPauseButton");
    expect(t).not.toContain("import:");
  });
});

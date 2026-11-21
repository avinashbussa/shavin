import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
// @ts-ignore .mjs
import { checkUsage } from "../../packages/mcp-server/src/tools/usage-check.mjs";

const C = JSON.parse(readFileSync("components.json", "utf8"));

describe("validate_code component usage", () => {
  it("flags invalid variant values", () => {
    expect(checkUsage(`<Button variant="primary">x</Button>`, C)[0]).toContain("solid/soft/outline/ghost");
  });
  it("flags near-miss prop names", () => {
    expect(checkUsage(`<Button varient="solid" />`, C)[0]).toContain('did you mean "variant"');
  });
  it("ignores valid usage, spreads, dynamic values and DOM attrs", () => {
    expect(checkUsage(`<Button variant="soft" tone={t} onClick={f} aria-label="x" data-x="1" {...p}>a</Button>`, C)).toEqual([]);
  });
});

describe("server-safe imports", () => {
  it("flags cn from the client bundle in a file without use client", () => {
    expect(checkUsage(`import { Button, cn } from "@shavin/ui";`, C)[0]).toContain("@shavin/ui/server");
  });
  it("allows it in client files and from /server", () => {
    expect(checkUsage(`"use client";\nimport { cn } from "@shavin/ui";`, C)).toEqual([]);
    expect(checkUsage(`import { cn } from "@shavin/ui/server";`, C)).toEqual([]);
  });
});

describe("Grid columns=\"auto\" guardrails", () => {
  it("flags auto + stack, auto + grid-cols-*, and minWidth/maxColumns without auto", () => {
    expect(checkUsage(`<Grid columns="auto" stack="auto">x</Grid>`, C).join("\n")).toContain("remove stack");
    expect(checkUsage(`<Grid columns="auto" className="md:grid-cols-4">x</Grid>`, C).join("\n")).toContain("grid-cols-*");
    expect(checkUsage(`<Grid columns="3" maxColumns="3">x</Grid>`, C).join("\n")).toContain('only apply with columns="auto"');
  });
  it("flags auto grids in files that place children with spans", () => {
    const code = `<Grid columns="auto"><Box className="col-span-2">a</Box></Grid>`;
    expect(checkUsage(code, C).join("\n")).toContain("placed layouts");
  });
  it("accepts a plain auto grid with minWidth and maxColumns", () => {
    expect(checkUsage(`<Grid columns="auto" minWidth="md" maxColumns="3" gap="4">x</Grid>`, C).filter((m: string) => m.includes("Grid"))).toEqual([]);
  });
});

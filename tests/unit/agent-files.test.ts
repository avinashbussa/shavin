import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script without types
import { coverageProblems, outputs, renderAgents, renderClaude } from "../../scripts/gen-agents.mjs";

const ROOT = resolve(__dirname, "../..");
const PRIVATE = /blocks-pro|block-renderer|@shavin\/cloud|apps\/(studio|docs|website|community|kits|figma)\b|src\/engine|supabase|kit:pack/i;

describe("generated agent files", () => {
  it("are up to date with their sources", () => {
    for (const [rel, text] of Object.entries(outputs() as Record<string, string>)) {
      expect(readFileSync(resolve(ROOT, rel), "utf8"), rel).toBe(text);
    }
  });

  it("document every skill, command and MCP tool", () => {
    expect(coverageProblems()).toEqual([]);
  });

  it("never name private packages or apps in the public and consumer renderings", () => {
    for (const text of [renderAgents("public"), renderAgents("consumer"), renderClaude("public")]) {
      expect(text).not.toMatch(PRIVATE);
    }
  });

  it("keep the sections get_guidelines looks up", () => {
    const consumer = renderAgents("consumer");
    for (const h of ["Core Mental Model", "Directory Layout & Imports", "Radix & Primitive Selection", "Concentric Radius", "ThemeProvider", "Pre-Flight Quality Gate", "Responsive Design"]) {
      expect(consumer).toContain(h);
    }
    expect(consumer).not.toContain("Component Addition Pipeline");
    expect(renderAgents("public")).toContain("Component Addition Pipeline");
  });

  it("leave no unresolved placeholders or audience markers", () => {
    for (const text of [renderAgents("public"), renderAgents("consumer")]) {
      expect(text).not.toMatch(/\{\{\w+\}\}|<!-- (if:|endif)/);
    }
  });
});

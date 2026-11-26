import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { SHADCN_BRIDGE_CSS, SHADCN_BRIDGE_VARS } from "../../packages/cli/src/lib/shadcn-bridge.mjs";

describe("shadcn bridge", () => {
  it("maps shadcn's core variables", () => {
    for (const v of ["--background", "--foreground", "--primary", "--primary-foreground", "--card", "--muted", "--accent", "--destructive", "--border", "--input", "--ring", "--radius"]) {
      expect(SHADCN_BRIDGE_VARS).toContain(v);
    }
  });
  it("wraps Shavin's RGB-triplet tokens in rgb() and wins over shadcn's :root / .dark by specificity", () => {
    expect(SHADCN_BRIDGE_CSS).toContain("--primary: rgb(var(--brand-solid));");
    expect(SHADCN_BRIDGE_CSS).toContain("html:root,");
    expect(SHADCN_BRIDGE_CSS).toContain("html.dark");
    expect(SHADCN_BRIDGE_CSS).not.toMatch(/--primary:\s*var\(--brand\)/);
    expect(SHADCN_BRIDGE_CSS).toContain("--radius: var(--radius-lg);");
  });
  it("only references tokens that exist in @shavin/ui's tokens.css", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const tokens = readFileSync(join(__dirname, "../../packages/ui/src/styles/tokens.css"), "utf8");
    const used = [...SHADCN_BRIDGE_CSS.matchAll(/var\((--[\w-]+)\)/g)].map((m: RegExpMatchArray) => m[1]);
    for (const v of new Set<string>(used)) expect(tokens, v).toMatch(new RegExp(`^\\s*${v}:`, "m"));
  });
});

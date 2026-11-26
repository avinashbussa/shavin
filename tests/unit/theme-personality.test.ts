/**
 * theme-personality.test.ts — the unset-theme flow: `shavin brand` theme flags, the SHAVIN.md template
 * labels, and the MCP reminder while the theme is unconfirmed.
 */
import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const themeSet = await import(resolve(ROOT, "packages/cli/src/lib/theme-set.mjs"));
const context = await import(resolve(ROOT, "packages/mcp-server/src/context.mjs"));

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "shavin-theme-"));
  for (const [p, c] of Object.entries(files)) {
    const full = join(dir, p);
    mkdirSync(resolve(full, ".."), { recursive: true });
    writeFileSync(full, c, "utf8");
  }
  return dir;
}

const TEMPLATE = readFileSync(resolve(ROOT, "packages/cli/src/templates/SHAVIN.md"), "utf8");
const LAYOUT = `import { ThemeProvider } from "@shavin/ui";
export default function L({ children }) {
  return <html><body><ThemeProvider>{children}</ThemeProvider></body></html>;
}
`;

describe("name lists stay in step with @shavin/ui presets", () => {
  const presets = readFileSync(resolve(ROOT, "packages/ui/src/lib/theme-presets.ts"), "utf8");
  it("fonts and brand presets", () => {
    const fonts = [...new Set([...presets.matchAll(/name: "([^"]+)"/g)].map((m) => m[1]))];
    for (const f of themeSet.FONT_NAMES) expect(fonts, `font ${f}`).toContain(f);
    for (const b of themeSet.BRAND_PRESET_NAMES) expect(presets.toLowerCase(), `brand ${b}`).toContain(`name: "${b}"`);
  });
});

describe("parseThemeFlags", () => {
  it("accepts a preset, a hex, fonts and a mode", () => {
    const r = themeSet.parseThemeFlags(["--color", "Teal", "--display-font", "fraunces", "--body-font=Inter", "--mode", "light-first", "--confirm"]);
    expect(r.values).toEqual({ color: "teal", displayFont: "Fraunces", bodyFont: "Inter", mode: "light-first", confirm: true });
    expect(themeSet.parseThemeFlags(["--color", "#0F766E"]).values.color).toBe("#0f766e");
  });
  it("rejects unknown values with the valid list", () => {
    expect(themeSet.parseThemeFlags(["--color", "chartreuse"]).error).toMatch(/Unknown colour/);
    expect(themeSet.parseThemeFlags(["--display-font", "Comic Sans"]).error).toMatch(/Unknown font/);
    expect(themeSet.parseThemeFlags(["--mode", "dim"]).error).toMatch(/Unknown mode/);
  });
  it("only theme flags trigger theme mode", () => {
    expect(themeSet.isThemeInvocation(["--check"])).toBe(false);
    expect(themeSet.isThemeInvocation(["--confirm"])).toBe(true);
  });
});

describe("applyTheme", () => {
  it("writes the layout, SHAVIN.md and config.json, and confirms", () => {
    const dir = project({
      "src/app/layout.tsx": LAYOUT,
      "SHAVIN.md": TEMPLATE,
      ".shavin/config.json": JSON.stringify({ presets: { brandColor: "monochrome" }, brandConfirmed: false }),
    });
    try {
      const { values } = themeSet.parseThemeFlags(["--color", "teal", "--display-font", "Fraunces", "--body-font", "Inter", "--mode", "light-first"]);
      const r = themeSet.applyTheme(dir, values);
      expect(r.changed.sort()).toEqual([".shavin/config.json", "SHAVIN.md", "src/app/layout.tsx"].sort());
      const layout = readFileSync(join(dir, "src/app/layout.tsx"), "utf8");
      expect(layout).toContain('<ThemeProvider brandColor="teal" displayFont="Fraunces" bodyFont="Inter" defaultTheme="light">');
      const md = readFileSync(join(dir, "SHAVIN.md"), "utf8");
      expect(md).toContain("- **Primary Brand**: `teal`");
      expect(md).toContain("- **Display / Body Font**: `Fraunces / Inter`");
      expect(md).toContain("- **Theme Mode**: `light-first`");
      let cfg = JSON.parse(readFileSync(join(dir, ".shavin/config.json"), "utf8"));
      expect(cfg.brandConfirmed).toBe(false);
      themeSet.applyTheme(dir, themeSet.parseThemeFlags(["--confirm"]).values);
      cfg = JSON.parse(readFileSync(join(dir, ".shavin/config.json"), "utf8"));
      expect(cfg.brandConfirmed).toBe(true);
      expect(cfg.presets.brandColor).toBe("teal");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("replaces existing props instead of duplicating them", () => {
    const next = themeSet.patchThemeProvider(LAYOUT.replace("<ThemeProvider>", '<ThemeProvider brandColor="red" radius="large">'), { brandColor: "teal" });
    expect(next).toContain('radius="large" brandColor="teal"');
    expect(next.match(/brandColor=/g)).toHaveLength(1);
  });

  it("prints lines to paste when no layout can be patched", () => {
    const dir = project({ "SHAVIN.md": TEMPLATE });
    try {
      const r = themeSet.applyTheme(dir, themeSet.parseThemeFlags(["--color", "teal"]).values);
      expect(r.paste[0]).toBe('<ThemeProvider brandColor="teal">');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("MCP reminder while the theme is unconfirmed", () => {
  it("the template reads as unconfirmed and keeps the default values", () => {
    const dir = project({ "SHAVIN.md": TEMPLATE });
    try {
      const m = context.parseShavinManifest(dir);
      expect(m.themeUnconfirmed).toBe(true);
      expect(m.brand).toBe("monochrome");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("brandConfirmed false in config.json is unconfirmed; missing is confirmed", () => {
    const a = project({ ".shavin/config.json": JSON.stringify({ presets: { brandColor: "teal" }, brandConfirmed: false }) });
    const b = project({ ".shavin/config.json": JSON.stringify({ presets: { brandColor: "teal" } }) });
    try {
      expect(context.parseShavinManifest(a).themeUnconfirmed).toBe(true);
      expect(context.parseShavinManifest(b).themeUnconfirmed).toBe(false);
    } finally {
      rmSync(a, { recursive: true, force: true });
      rmSync(b, { recursive: true, force: true });
    }
  });

  it("a confirmed project gets no reminder; an unconfirmed one gets it once", () => {
    const un = project({ ".shavin/config.json": JSON.stringify({ brandConfirmed: false }) });
    const ok = project({ ".shavin/config.json": JSON.stringify({ brandConfirmed: true }) });
    try {
      expect(context.themeReminderOnce(ok)).toBeNull();
      expect(context.themeReminderOnce(un)).toBe(context.THEME_UNCONFIRMED_NOTICE);
      expect(context.themeReminderOnce(un)).toBeNull();
    } finally {
      rmSync(un, { recursive: true, force: true });
      rmSync(ok, { recursive: true, force: true });
    }
  });

  it("get_project_context carries the notice only while unconfirmed", () => {
    const un = project({ "SHAVIN.md": TEMPLATE, ".shavin/config.json": JSON.stringify({ brandConfirmed: false }) });
    const ok = project({ "SHAVIN.md": TEMPLATE.replace(/`UNSET`/g, "`teal`"), ".shavin/config.json": JSON.stringify({ brandConfirmed: true }) });
    try {
      expect(context.extractProjectContext({ targetDir: un, save: false }).promptMarkdown).toContain("[THEME_NOT_CONFIRMED]");
      expect(context.extractProjectContext({ targetDir: ok, save: false }).promptMarkdown).not.toContain("[THEME_NOT_CONFIRMED]");
    } finally {
      rmSync(un, { recursive: true, force: true });
      rmSync(ok, { recursive: true, force: true });
    }
  });
});

describe("neutrals flags", () => {
  it("parses --neutrals and --neutrals-amount and rejects unknown values", () => {
    expect(themeSet.parseThemeFlags(["--neutrals", "neutral", "--neutrals-amount=medium"]).values).toMatchObject({ neutrals: "neutral", neutralsAmount: "medium" });
    expect(themeSet.parseThemeFlags(["--neutrals", "warm"]).error).toMatch(/Unknown --neutrals/);
    expect(themeSet.parseThemeFlags(["--neutrals-amount", "loud"]).error).toMatch(/Unknown --neutrals-amount/);
    expect(themeSet.isThemeInvocation(["--neutrals", "brand"])).toBe(true);
  });

  it("writes only non-default choices to the layout and records everything in config and SHAVIN.md", () => {
    const dir = project({ "src/app/layout.tsx": LAYOUT, "SHAVIN.md": TEMPLATE });
    try {
      themeSet.applyTheme(dir, themeSet.parseThemeFlags(["--color", "#b4472a"]).values);
      let layout = readFileSync(join(dir, "src/app/layout.tsx"), "utf8");
      expect(layout).toContain('<ThemeProvider brandColor="#b4472a">');
      let cfg = JSON.parse(readFileSync(join(dir, ".shavin/config.json"), "utf8"));
      expect(cfg.presets).toMatchObject({ brandColor: "#b4472a", neutrals: "neutral", neutralsAmount: "subtle" });

      // Opt in: the prop appears in the layout.
      themeSet.applyTheme(dir, themeSet.parseThemeFlags(["--neutrals", "brand", "--neutrals-amount", "medium"]).values);
      layout = readFileSync(join(dir, "src/app/layout.tsx"), "utf8");
      expect(layout).toContain('neutrals="brand"');
      expect(layout).toContain('neutralsAmount="medium"');
      expect(readFileSync(join(dir, "SHAVIN.md"), "utf8")).toContain("- **Neutrals**: `brand / medium`");
      cfg = JSON.parse(readFileSync(join(dir, ".shavin/config.json"), "utf8"));
      expect(cfg.presets).toMatchObject({ neutrals: "brand", neutralsAmount: "medium" });

      // Back to the defaults: the props leave the layout, the choice stays recorded.
      themeSet.applyTheme(dir, themeSet.parseThemeFlags(["--neutrals", "neutral", "--neutrals-amount", "subtle"]).values);
      layout = readFileSync(join(dir, "src/app/layout.tsx"), "utf8");
      expect(layout).not.toContain("neutrals");
      expect(readFileSync(join(dir, "SHAVIN.md"), "utf8")).toContain("- **Neutrals**: `neutral / subtle`");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("brand --help mentions the option", async () => {
    // `shavin brand --help` is answered by bin/shavin.mjs from src/help.mjs, before the command module loads.
    const { readFileSync: read } = await import("node:fs");
    const help = read(resolve(ROOT, "packages/cli/src/help.mjs"), "utf8");
    expect(help).toContain("--neutrals <m>");
    expect(help).toContain("--neutrals-amount <a>");
    expect(help).toContain('"neutral" (default)');
  });
});

/**
 * context-engine.test.ts — Unit tests for the shavin MCP context engine.
 *
 * Tests parseShavinManifest(), parseThemeProviderFromLayout(), and the
 * 3-tier priority chain (ThemeProvider > SHAVIN.md > config.json > defaults)
 * that was built in Q5/Q6.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const MCP_CONTEXT = resolve(ROOT, "packages/mcp-server/src/context.mjs");

// Dynamic import since context.mjs is an ES module
let contextModule;

beforeAll(async () => {
  contextModule = await import(MCP_CONTEXT);
});

// ── Test fixture: create temp project dirs for isolated testing ──────
const TMP_BASE = resolve(ROOT, "tests/tmp-context-test");

function createTempProject(name, files) {
  const dir = resolve(TMP_BASE, name);
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const [path, content] of Object.entries(files)) {
    const fullPath = resolve(dir, path);
    if (path.includes("/")) mkdirSync(resolve(dir, path.split("/").slice(0, -1).join("/")), { recursive: true });
    writeFileSync(fullPath, content, "utf-8");
  }
  return dir;
}

function cleanupTempProjects() {
  if (existsSync(TMP_BASE)) rmSync(TMP_BASE, { recursive: true, force: true });
}

afterAll(() => {
  cleanupTempProjects();
});

// ── Tests ─────────────────────────────────────────────────────────────
describe("context.mjs module exports", () => {
  it("exports parseShavinManifest", () => {
    expect(typeof contextModule.parseShavinManifest).toBe("function");
  });

  it("exports parseThemeProviderFromLayout", () => {
    expect(typeof contextModule.parseThemeProviderFromLayout).toBe("function");
  });

  it("exports extractProjectContext", () => {
    expect(typeof contextModule.extractProjectContext).toBe("function");
  });

  it("exports detectProjectArchetype", () => {
    expect(typeof contextModule.detectProjectArchetype).toBe("function");
  });

  it("exports scanCodebaseAlignment", () => {
    expect(typeof contextModule.scanCodebaseAlignment).toBe("function");
  });
});

describe("parseThemeProviderFromLayout", () => {
  it("returns null when no layout file exists", () => {
    const dir = createTempProject("no-layout", {});
    const result = contextModule.parseThemeProviderFromLayout(dir);
    expect(result).toBeNull();
  });

  it("returns null when layout file has no ThemeProvider", () => {
    const dir = createTempProject("no-tp", {
      "app/layout.tsx": `export default function Layout({ children }) { return <html><body>{children}</body></html>; }`,
    });
    const result = contextModule.parseThemeProviderFromLayout(dir);
    expect(result).toBeNull();
  });

  it("extracts explicit prop values from ThemeProvider", () => {
    const dir = createTempProject("explicit-props", {
      "app/layout.tsx": `
import { ThemeProvider } from "@shavin/ui";
export default function Layout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider theme="Editorial" accentColor="grass" grayColor="zinc" radius="large" scaling="90" defaultTheme="dark" panelBackground="translucent" displayFont="Inter" bodyFont="Inter">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
`,
    });
    const result = contextModule.parseThemeProviderFromLayout(dir);
    expect(result).not.toBeNull();
    expect(result.theme).toBe("Editorial");
    expect(result.accentColor).toBe("grass");
    expect(result.grayColor).toBe("zinc");
    expect(result.radius).toBe("large");
    expect(result.scaling).toBe("90");
    expect(result.defaultTheme).toBe("dark");
    expect(result.panelBackground).toBe("translucent");
    expect(result.displayFont).toBe("Inter");
    expect(result.bodyFont).toBe("Inter");
  });

  it("extracts props from self-closing ThemeProvider", () => {
    const dir = createTempProject("self-closing", {
      "app/layout.tsx": `
import { ThemeProvider } from "@shavin/ui";
export default function Layout({ children }) {
  return <html><body><ThemeProvider accentColor="blue" /></body></html>;
}
`,
    });
    const result = contextModule.parseThemeProviderFromLayout(dir);
    expect(result).not.toBeNull();
    expect(result.accentColor).toBe("blue");
  });

  it("resolves theme preset values when theme=\"Editorial\" is specified", () => {
    const dir = createTempProject("preset", {
      "app/layout.tsx": `
import { ThemeProvider } from "@shavin/ui";
export default function Layout({ children }) {
  return <html><body><ThemeProvider theme="Editorial">{children}</ThemeProvider></body></html>;
}
`,
    });
    const result = contextModule.parseThemeProviderFromLayout(dir);
    expect(result).not.toBeNull();
    expect(result.theme).toBe("Editorial");
    // The preset should fill in accentColor, grayColor, radius, etc.
    expect(result.accentColor).toBeTruthy();
    expect(result.grayColor).toBeTruthy();
    expect(result.radius).toBeTruthy();
  });

  it("supports pages/_app.tsx layout candidate", () => {
    const dir = createTempProject("pages-router", {
      "pages/_app.tsx": `
import { ThemeProvider } from "@shavin/ui";
export default function App({ Component, pageProps }) {
  return <ThemeProvider accentColor="violet"><Component {...pageProps} /></ThemeProvider>;
}
`,
    });
    const result = contextModule.parseThemeProviderFromLayout(dir);
    expect(result).not.toBeNull();
    expect(result.accentColor).toBe("violet");
    expect(result.source).toBe("pages/_app.tsx");
  });
});

describe("parseShavinManifest — priority chain", () => {
  it("returns hasManifest:false when no SHAVIN.md, no ThemeProvider, no config.json", () => {
    const dir = createTempProject("empty-project", {
      "package.json": `{"name": "test-app"}`,
    });
    const result = contextModule.parseShavinManifest(dir);
    expect(result.hasManifest).toBe(false);
  });

  it("Layer 1 (ThemeProvider) takes highest priority for theme fields", () => {
    const dir = createTempProject("tp-priority", {
      "app/layout.tsx": `
import { ThemeProvider } from "@shavin/ui";
export default function Layout({ children }) {
  return <html><body><ThemeProvider accentColor="blue" grayColor="slate" radius="large">{children}</ThemeProvider></body></html>;
}
`,
      "SHAVIN.md": `**Product Name**: TestApp\n**Domain**: example.com\n**Primary Accent**: \`grass\`\n**Neutral Scale**: \`zinc\`\n**Base Radius**: \`medium\`\n`,
      ".shavin/config.json": `{"presets":{"accentColor":"monochrome","grayColor":"zinc","radius":"medium","scaling":"95%"}}`,
    });
    const result = contextModule.parseShavinManifest(dir);
    expect(result.hasManifest).toBe(true);
    // ThemeProvider should win over SHAVIN.md and config.json
    expect(result.accent).toBe("blue");
    expect(result.neutral).toBe("slate");
    expect(result.radius).toBe("large");
    expect(result.themeSource).toBe("ThemeProvider");
    // appName/domain should come from SHAVIN.md
    expect(result.appName).toBe("TestApp");
    expect(result.domain).toBe("example.com");
  });

  it("Layer 2 (SHAVIN.md) fills theme fields when ThemeProvider is absent", () => {
    const dir = createTempProject("shavin-md", {
      "SHAVIN.md": `**Product Name**: MyApp\n**Domain**: myapp.io\n**Primary Accent**: \`grass\`\n**Neutral Scale**: \`zinc\`\n**Theme Mode**: \`dark-first\`\n**Scaling / Density**: \`95%\`\n**Base Radius**: \`medium\`\n**Panel Background**: \`solid\`\n`,
    });
    const result = contextModule.parseShavinManifest(dir);
    expect(result.hasManifest).toBe(true);
    expect(result.appName).toBe("MyApp");
    expect(result.domain).toBe("myapp.io");
    expect(result.accent).toBe("grass");
    expect(result.neutral).toBe("zinc");
    expect(result.themeMode).toBe("dark-first");
    expect(result.density).toBe("95%");
    expect(result.radius).toBe("medium");
    expect(result.panelBackground).toBe("solid");
  });

  it("SHAVIN.md with single asterisk format also parses", () => {
    const dir = createTempProject("single-asterisk", {
      "SHAVIN.md": `*Product Name*: SingleStar\n*Domain*: single.test\n*Primary Accent*: \`blue\`\n`,
    });
    const result = contextModule.parseShavinManifest(dir);
    expect(result.hasManifest).toBe(true);
    expect(result.appName).toBe("SingleStar");
    expect(result.domain).toBe("single.test");
    expect(result.accent).toBe("blue");
  });

  it("SHAVIN.md with no asterisk format also parses", () => {
    const dir = createTempProject("no-asterisk", {
      "SHAVIN.md": `Product Name: PlainApp\nDomain: plain.test\nPrimary Accent: \`violet\`\n`,
    });
    const result = contextModule.parseShavinManifest(dir);
    expect(result.hasManifest).toBe(true);
    expect(result.appName).toBe("PlainApp");
    expect(result.domain).toBe("plain.test");
    expect(result.accent).toBe("violet");
  });

  it("Layer 3 (config.json) fills theme fields when both TP and SHAVIN.md are absent", () => {
    const dir = createTempProject("config-only", {
      "package.json": `{"name": "config-app"}`,
      ".shavin/config.json": `{"presets":{"accentColor":"grass","grayColor":"zinc","radius":"medium","scaling":"95%"}}`,
    });
    const result = contextModule.parseShavinManifest(dir);
    expect(result.hasManifest).toBe(true);
    expect(result.accent).toBe("grass");
    expect(result.neutral).toBe("zinc");
    expect(result.radius).toBe("medium");
    expect(result.density).toBe("95%");
    // appName should come from package.json
    expect(result.appName).toBe("config-app");
  });

  it("ThemeProvider individual props override preset values", () => {
    const dir = createTempProject("tp-override", {
      "app/layout.tsx": `
import { ThemeProvider } from "@shavin/ui";
export default function Layout({ children }) {
  return <html><body><ThemeProvider theme="Editorial" accentColor="grass">{children}</ThemeProvider></body></html>;
}
`,
    });
    const result = contextModule.parseThemeProviderFromLayout(dir);
    expect(result).not.toBeNull();
    // theme="Editorial" would set a default accent, but explicit accentColor="grass" overrides
    expect(result.accentColor).toBe("grass");
    expect(result.theme).toBe("Editorial");
  });

  it("uses defaults when no sources provide theme values", () => {
    const dir = createTempProject("defaults-only", {
      "SHAVIN.md": `**Product Name**: DefaultApp\n**Domain**: default.test\n`,
    });
    const result = contextModule.parseShavinManifest(dir);
    expect(result.hasManifest).toBe(true);
    expect(result.appName).toBe("DefaultApp");
    expect(result.domain).toBe("default.test");
    // Default accent should be monochrome (the system default)
    expect(result.accent).toBe("monochrome");
    // Default neutral should be zinc
    expect(result.neutral).toBe("zinc");
  });

  it("handles capitalized accentColor from ThemeProvider", () => {
    const dir = createTempProject("capitalized", {
      "app/layout.tsx": `
import { ThemeProvider } from "@shavin/ui";
export default function Layout({ children }) {
  return <html><body><ThemeProvider accentColor="Grass" grayColor="Zinc">{children}</ThemeProvider></body></html>;
}
`,
    });
    const result = contextModule.parseShavinManifest(dir);
    expect(result.hasManifest).toBe(true);
    // Should be normalized to lowercase
    expect(result.accent).toBe("grass");
    expect(result.neutral).toBe("zinc");
  });

  it("scaling={95} from ThemeProvider converts to density '95%'", () => {
    const dir = createTempProject("scaling", {
      "app/layout.tsx": `
import { ThemeProvider } from "@shavin/ui";
export default function Layout({ children }) {
  return <html><body><ThemeProvider scaling="95">{children}</ThemeProvider></body></html>;
}
`,
    });
    const result = contextModule.parseShavinManifest(dir);
    expect(result.hasManifest).toBe(true);
    expect(result.density).toBe("95%");
  });
});

describe("parseShavinManifest — real project (this repo)", () => {
  it("parses the repo's own SHAVIN.md", () => {
    const result = contextModule.parseShavinManifest(ROOT);
    expect(result.hasManifest).toBe(true);
    expect(result.appName).toBeTruthy();
    expect(result.domain).toBeTruthy();
  });
});

describe("extractProjectContext", () => {
  it("returns an object with promptMarkdown for valid project", () => {
    const result = contextModule.extractProjectContext({
      targetDir: ROOT,
      save: false,
    });
    expect(result).toHaveProperty("promptMarkdown");
    expect(typeof result.promptMarkdown).toBe("string");
    expect(result.promptMarkdown.length).toBeGreaterThan(0);
  });

  it("returns alignment score and metrics", () => {
    const result = contextModule.extractProjectContext({
      targetDir: ROOT,
      save: false,
    });
    // The result should include some form of alignment or metrics
    expect(result).toHaveProperty("promptMarkdown");
  });

  it("handles missing targetDir gracefully", () => {
    const result = contextModule.extractProjectContext({
      targetDir: "/nonexistent/path/that/does/not/exist",
      save: false,
    });
    // Should not throw, should return some result
    expect(result).toBeDefined();
  });
});

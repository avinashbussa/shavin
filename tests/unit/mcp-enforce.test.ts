import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { checkEnforcement, checkStates, isLegacyFile, legacyPaths } from "../../packages/mcp-server/src/tools/enforce.mjs";
// @ts-expect-error — plain .mjs module without types
import { validateCode } from "../../packages/mcp-server/src/tools/validation.mjs";
// @ts-expect-error — plain .mjs module without types
import { checkPage, loadCatalogueFromDir } from "../../packages/mcp-server/src/tools/compose.mjs";
// @ts-expect-error — plain .mjs module without types
import { scanDirectory } from "../../packages/mcp-server/src/tools/archlint.mjs";

type Finding = { rule: string; severity: string; line: number; message: string; fix: string };
const rules = (code: string) => (checkEnforcement(code) as Finding[]).map((f) => f.rule);
function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "shavin-enforce-"));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}

describe("every component named in a fix exists in the manifest", () => {
  it("suggests only real @shavin/ui components", async () => {
    const { readFileSync } = await import("node:fs");
    const manifest = JSON.parse(readFileSync(resolve(__dirname, "../../components.json"), "utf8"));
    const names = new Set<string>((manifest.components ?? manifest).map((c: { name: string }) => c.name));
    const samples = ['<button />', '<input type="checkbox" />', '<input type="radio" />', '<input type="range" />', '<input type="date" />', '<input type="time" />', '<input type="color" />', '<input />', '<select />', '<textarea />', '<table />', '<dialog />'];
    for (const jsx of samples) {
      const [f] = checkEnforcement(`const A = () => ${jsx};`) as Finding[];
      const mentioned = [...f.fix.matchAll(/\b([A-Z][A-Za-z]+)\b/g)].map((m) => m[1]).filter((n) => !["Use", "Switch", "Table", "IconButton"].includes(n) || names.has(n));
      for (const n of mentioned) if (n !== "Use" && n !== "UI") expect(names.has(n), `${jsx} -> ${n}`).toBe(true);
    }
  });
});

describe("hand-rolled controls", () => {
  it("fails raw button, input, select, textarea, table and dialog", () => {
    for (const el of ["button", "input", "select", "textarea", "table", "dialog"]) expect(rules(`export const A = () => <${el} className="x" />;`)).toContain("raw-control");
  });
  it.each([
    ["text", "TextField"], ["email", "TextField"], ["password", "TextField"], ["search", "TextField"], ["tel", "TextField"], ["url", "TextField"], ["number", "TextField"],
    ["checkbox", "Checkbox"], ["radio", "RadioGroup"], ["range", "Slider"], ["date", "DatePicker"], ["time", "TimePicker"], ["color", "ColorPicker"],
    ["submit", "Button"], ["reset", "Button"], ["button", "Button"],
  ])("maps <input type=%s> to %s", (type, component) => {
    const [f] = checkEnforcement(`export const A = () => <input type="${type}" />;`) as Finding[];
    expect(f.rule).toBe("raw-control");
    expect(f.fix).toContain(`Use ${component}`);
  });
  it("treats an input with no type as text, and never flags types Shavin cannot replace", () => {
    expect(rules("export const A = () => <input />;")).toEqual(["raw-control"]);
    for (const t of ["hidden", "file", "image", "datetime-local", "month", "week"]) expect(rules(`export const A = () => <input type="${t}" />;`), t).toEqual([]);
    expect(rules("export const A = () => <input type={kind} />;")).toEqual([]);
  });
  it("allows hidden and file inputs, Shavin components, and elements named in strings or comments", () => {
    expect(rules('export const A = () => <input type="hidden" name="csrf" />;')).toEqual([]);
    expect(rules('import { Button } from "@shavin/ui";\nexport const A = () => <Button>Save</Button>;')).toEqual([]);
    expect(rules("// <button> was replaced\nexport const A = () => <CodeBlock code={`<button>x</button>`} />;")).toEqual([]);
  });
  it("reports the line and the Shavin replacement", () => {
    const [f] = checkEnforcement("const a = 1;\nexport const A = () => <button>x</button>;") as Finding[];
    expect(f.line).toBe(2);
    expect(f.fix).toContain("Button");
  });
});

describe("raw HTML with no Shavin counterpart is never flagged", () => {
  const OK = [
    "<video src={v} controls />", "<audio src={a} />", "<canvas ref={r} />", "<iframe src={u} title=\"x\" />", "<svg viewBox=\"0 0 1 1\"><path d=\"M0 0\" /></svg>",
    "<details><summary>More</summary>x</details>", "<main>x</main>", "<nav aria-label=\"Main\">x</nav>", "<header>x</header>", "<footer>x</footer>", "<aside>x</aside>",
    "<section id=\"a\">x</section>", "<article>x</article>", "<form onSubmit={f}>x</form>", "<label htmlFor=\"a\">x</label>", "<fieldset><legend>x</legend></fieldset>",
    "<img src={i} alt=\"\" />", "<picture><source srcSet={s} /></picture>", "<figure><figcaption>x</figcaption></figure>", "<a href=\"/x\">x</a>", "<p>x</p>", "<h2>x</h2>",
    "<ul><li>x</li></ul>", "<pre><code>x</code></pre>", "<hr />", "<div className=\"flex gap-2\">x</div>", "<span className=\"sr-only\">x</span>",
  ];
  it.each(OK)("%s", (jsx) => {
    expect(rules(`export const A = () => ${jsx};`)).toEqual([]);
  });
  it("audit_source reports them at most as warnings, never errors", () => {
    const dir = project({ "src/app/page.tsx": `import { Heading } from "@shavin/ui";\nexport default () => <main><nav>x</nav><section><p>x</p><video src="a" /><canvas /><iframe src="u" title="t" /><svg /><details><summary>s</summary></details></section></main>;\n` });
    expect(scanDirectory(dir).summary.totalErrors).toBe(0);
  });
});

describe("styled imitations of components", () => {
  it("fails a clickable div, a div with a button role, a hand-styled card, badge, spinner and skeleton", () => {
    expect(rules('<div onClick={go}>Open</div>')).toContain("fake-component");
    expect(rules('<div role="dialog" aria-modal>x</div>')).toContain("fake-component");
    expect(rules('<div className="rounded-[var(--radius-panel)] border border-hairline bg-surface p-4">x</div>')).toContain("fake-component");
    expect(rules('<span className="rounded-full px-2 py-0.5 bg-brand-subtle text-xs">New</span>')).toContain("fake-component");
    expect(rules('<div className="h-4 w-4 animate-spin rounded-full border-2" />')).toContain("fake-component");
    expect(rules('<div className="h-4 w-32 animate-pulse bg-surface" />')).toContain("fake-component");
  });
  it("allows layout divs and Shavin components", () => {
    expect(rules('<div className="mx-auto max-w-2xl">x</div>')).toEqual([]);
    expect(rules('<Card><Flex direction="column" gap="3">x</Flex></Card>')).toEqual([]);
    expect(rules('<div className="grid gap-4">x</div>')).toEqual([]);
  });
});

describe("imports", () => {
  it("fails other UI libraries and shadcn local components", () => {
    expect(rules('import * as Dialog from "@radix-ui/react-dialog";')).toContain("foreign-ui");
    expect(rules('import { toast } from "sonner";')).toContain("foreign-ui");
    expect(rules('import { Button } from "@/components/ui/button";')).toContain("foreign-ui");
    expect(rules('import { Button } from "@mui/material";')).toContain("foreign-ui");
  });
  it("fails deep @shavin/ui imports but allows the root, /server, /panels and css", () => {
    expect(rules('import { Card } from "@shavin/ui/primitives/Card";')).toContain("deep-import");
    expect(rules('import { cn } from "@shavin/ui/lib/cn";')).toContain("deep-import");
    for (const ok of ['"@shavin/ui"', '"@shavin/ui/server"', '"@shavin/ui/panels"', '"@shavin/ui/styles.css"']) expect(rules(`import x from ${ok};`)).toEqual([]);
  });
});

describe("type sizes and inline colours", () => {
  it("fails arbitrary type sizes, allows token vars", () => {
    expect(rules('<p className="text-[40px] leading-[1.1]">x</p>')).toEqual(["arbitrary-type", "arbitrary-type"]);
    expect(rules('<p className="text-[var(--fs-hero)]">x</p>')).toEqual([]);
  });
  it("fails literal inline colours, allows token vars and non-colour styles", () => {
    expect(rules('<Box style={{ color: "red" }} />')).toContain("inline-colour");
    expect(rules('<Box style={{ background: "linear-gradient(#000, #fff)" }} />')).toContain("inline-colour");
    expect(rules('<Box style={{ color: "var(--fg)" }} />')).toEqual([]);
    expect(rules("<Box style={{ width: 10, marginTop: 4 }} />")).toEqual([]);
  });
});

describe("validate_code rules", () => {
  it("only fails the new rules when enforcement is on", () => {
    const code = 'export const A = () => <button className="x">go</button>;';
    expect(validateCode(code)).toEqual([]);
    expect(validateCode(code, { enforce: true }).length).toBe(1);
  });
  it("allows a hex as brandColor on ThemeProvider and fails it anywhere else", () => {
    expect(validateCode('<ThemeProvider brandColor="#0f766e">{children}</ThemeProvider>', { enforce: true })).toEqual([]);
    expect(validateCode('<ThemeProvider brandColor={"#0f766e"}>x</ThemeProvider>', { enforce: true })).toEqual([]);
    expect(validateCode('<Box className="bg-[#0f766e]" />', { enforce: true }).length).toBeGreaterThan(0);
  });
  it("flags literal radius even when the file has imports (the old filter hid it)", () => {
    const code = 'import { Card } from "@shavin/ui";\nexport const A = () => <Card className="rounded-xl" />;';
    expect(validateCode(code).join(" ")).toContain("rounded-xl");
  });
});

describe("legacy (coexistence)", () => {
  it("reads Legacy paths from SHAVIN.md", () => {
    const dir = project({ "SHAVIN.md": "- **Legacy paths**: `src/components/ui, ./old/`\n" });
    expect(legacyPaths(dir)).toEqual(["src/components/ui", "old"]);
    expect(legacyPaths(project({ "SHAVIN.md": "- **Legacy paths**: `none`\n" }))).toEqual([]);
    expect(legacyPaths(project({}))).toEqual([]);
  });
  it("matches files by folder prefix", () => {
    expect(isLegacyFile("src/components/ui/button.tsx", ["src/components/ui"])).toBe(true);
    expect(isLegacyFile("src/components/uikit/x.tsx", ["src/components/ui"])).toBe(false);
  });
  it("audit_source fails new code, but reports legacy files without failing them", () => {
    const bad = 'import { Dialog } from "@radix-ui/react-dialog";\nexport const A = () => <button>x</button>;\n';
    const dir = project({
      "SHAVIN.md": "- **Legacy paths**: `src/components/ui`\n",
      "src/components/ui/button.tsx": bad,
      "src/app/page.tsx": bad,
    });
    const r = scanDirectory(dir);
    expect(r.summary.totalErrors).toBe(2);
    expect(r.issues.filter((i: { severity: string; file: string }) => i.severity === "error").every((i: { file: string }) => i.file === "src/app/page.tsx")).toBe(true);
    expect(r.summary.totalLegacy).toBe(2);
    const onlyLegacy = scanDirectory(project({ "SHAVIN.md": "- **Legacy paths**: `src/components/ui`\n", "src/components/ui/button.tsx": bad }));
    expect(onlyLegacy.summary.totalErrors).toBe(0);
  });
});

describe("required states", () => {
  const files = (src: string, extra: { file: string; src: string }[] = []) => [{ file: "src/components/orders.tsx", src: `import { Table } from "@shavin/ui";\n${src}` }, ...extra];
  it("fails a table with no loading, empty or error state", () => {
    const r = checkStates(files("export default () => <Table><TableRow /></Table>;"));
    expect(r.errors.map((e: string) => e.match(/missing (\w+) state/)![1])).toEqual(["loading", "empty", "error"]);
  });
  it("passes when each state exists somewhere in the project", () => {
    const src = 'export default () => isLoading ? <Skeleton /> : error ? <Callout color="danger">x</Callout> : rows.length === 0 ? <Text>No orders yet</Text> : <Table><TableRow /></Table>;';
    expect(checkStates(files(src)).errors).toEqual([]);
  });
  it("accepts loading.tsx and error.tsx route files as evidence", () => {
    const r = checkStates(files("export default () => rows.length ? <Table /> : <Text>No orders yet</Text>;", [{ file: "src/app/loading.tsx", src: "x" }, { file: "src/app/error.tsx", src: "x" }]));
    expect(r.errors).toEqual([]);
  });
  it("fails a form with no error, success or disabled state", () => {
    const r = checkStates([{ file: "src/components/orders.tsx", src: 'import { TextField } from "@shavin/ui";\nexport default () => <TextField label="Email" />;' }]);
    expect(r.errors.length).toBe(3);
  });
  it("ignores projects that do not use Shavin", () => {
    expect(checkStates([{ file: "a.tsx", src: "<table />" }]).errors).toEqual([]);
  });
});

describe("check_page with a project folder", () => {
  const cat = loadCatalogueFromDir(resolve(fileURLToPath(import.meta.url), "../../../packages/skills/skills/layout-compositions"));
  const page = (body: string) => `import { Section, Table, TableRow } from "@shavin/ui";\nexport default function P() { return <Section data-composition="none">${body}</Section>; }\n`;

  it("fails a data page with no states and lists the hard-rule errors (it used to PASS)", () => {
    const dir = project({ "src/app/page.tsx": page("<Table><TableRow /></Table><button>x</button>") });
    const r = checkPage(cat, { targetDir: dir });
    expect(r.errors.some((e: string) => e.startsWith("states: missing loading state"))).toBe(true);
    expect(r.errors.some((e: string) => e.startsWith("rules:") && e.includes("raw-control"))).toBe(true);
  });

  it("passes a page that covers the states and has no hard-rule errors, and skips legacy files", () => {
    const ok = page('{isLoading ? <Skeleton /> : error ? <Callout color="danger">x</Callout> : rows.length === 0 ? <Text>No orders yet</Text> : <Table><TableRow /></Table>}');
    const dir = project({
      "SHAVIN.md": "- **Legacy paths**: `src/legacy`\n",
      "src/app/page.tsx": ok,
      "src/app/not-found.tsx": 'import { Heading } from "@shavin/ui";\nexport default () => <Heading>Not found</Heading>;\n',
      "src/app/error.tsx": 'import { Callout } from "@shavin/ui";\nexport default () => <Callout color="danger">x</Callout>;\n',
      "src/legacy/old.tsx": "export const O = () => <button>x</button>;\n",
    });
    const r = checkPage(cat, { targetDir: dir });
    expect(r.errors.filter((e: string) => e.startsWith("states:") || e.startsWith("rules:"))).toEqual([]);
  });
});

describe("site-level states and interaction states", () => {
  const f = (file: string, src = 'import { Heading } from "@shavin/ui";\nexport default () => <Heading>x</Heading>;') => ({ file, src });

  it("fails a Next app without a not-found page and an error boundary, with the exact file to create", () => {
    const r = checkStates([f("src/app/page.tsx")]);
    expect(r.errors.some((e: string) => e.startsWith("missing not-found page") && e.includes("src/app/not-found.tsx"))).toBe(true);
    expect(r.errors.some((e: string) => e.startsWith("missing error boundary") && e.includes("src/app/error.tsx") && e.includes("reset()"))).toBe(true);
  });
  it("passes when not-found and error (or global-error) exist", () => {
    expect(checkStates([f("src/app/page.tsx"), f("src/app/not-found.tsx"), f("src/app/error.tsx")]).errors).toEqual([]);
    expect(checkStates([f("app/page.tsx"), f("app/not-found.tsx"), f("app/global-error.tsx")]).errors).toEqual([]);
  });
  it("checks the pages router for 404 and _error, and leaves other setups alone", () => {
    expect(checkStates([f("src/pages/index.tsx")]).errors.length).toBe(2);
    expect(checkStates([f("src/pages/index.tsx"), f("src/pages/404.tsx"), f("src/pages/_error.tsx")]).errors).toEqual([]);
    expect(checkStates([f("src/App.tsx")]).errors).toEqual([]);
  });
  it("warns when a focus outline is removed without a replacement, and not when one is given", () => {
    const warn = (code: string) => (checkEnforcement(code) as Finding[]).filter((x) => x.rule === "focus-removed");
    expect(warn('<Box className="outline-none" />').length).toBe(1);
    expect(warn('<Box className="focus:outline-none" />').length).toBe(1);
    expect(warn('<Box className="outline-none focus-visible:ring-2" />')).toEqual([]);
    expect(warn('<Box className="p-4" />')).toEqual([]);
    expect(warn('<Box className="outline-none" />')[0].severity).toBe("warn");
  });
  it("warns on raw text-brand (the fill) as a text colour, with variants, and not on the contrast-safe tokens", () => {
    const warn = (code: string) => (checkEnforcement(code) as Finding[]).filter((x) => x.rule === "raw-brand-text");
    expect(warn('<Text className="text-brand" />').length).toBe(1);
    expect(warn('<a className="text-fg hover:text-brand" />').length).toBe(1);
    expect(warn('<a className="group-hover:text-brand data-[state=on]:text-brand" />').length).toBe(2);
    expect(warn('<Icon className="text-brand/80" />').length).toBe(1);
    expect(warn('<Text className="text-brand" />')[0].severity).toBe("warn");
    expect(warn('<Text className="text-brand" />')[0].fix).toContain("text-brand-text");
    expect(warn('<Text className="hover:text-brand" />')[0].fix).toContain("hover:text-brand-text");
    expect(warn('<Text className="text-brand-text" />')).toEqual([]);
    expect(warn('<Text className="text-brand-contrast" />')).toEqual([]);
    expect(warn('<Button className="bg-brand text-brand-fg" />')).toEqual([]);
    expect(warn('<Box className="border-brand bg-brand/10" />')).toEqual([]);
    expect(warn("// use text-brand-text, not text-brand\nconst a = 1;")).toEqual([]);
  });
  it("warns on a raw brand fill as a border, ring or outline, with variants, and not on the guaranteed or tinted forms", () => {
    const warn = (code: string) => (checkEnforcement(code) as Finding[]).filter((x) => x.rule === "raw-brand-border");
    expect(warn('<Box className="border border-brand" />').length).toBe(1);
    expect(warn('<Box className="data-[state=checked]:border-brand ring-2 ring-brand" />').length).toBe(2);
    expect(warn('<Box className="focus-visible:outline-brand border-l-brand" />').length).toBe(2);
    expect(warn('<Box className="border-brand" />')[0].severity).toBe("warn");
    expect(warn('<Box className="hover:border-brand" />')[0].fix).toContain("hover:border-brand-text");
    expect(warn('<Box className="border-brand-text ring-brand-text outline-brand-text" />')).toEqual([]);
    expect(warn('<Box className="border-brand/30 bg-brand/10" />')).toEqual([]);
    expect(warn('<Box className="border-brand-coral ring-brand-contrast" />')).toEqual([]);
    expect(warn("// use border-brand-text, not border-brand\nconst a = 1;")).toEqual([]);
  });
  it("warns when text sits on the raw brand fill (bg-brand + text-brand-fg) and suggests bg-brand-solid", () => {
    const warn = (code: string) => (checkEnforcement(code) as Finding[]).filter((x) => x.rule === "raw-brand-solid");
    expect(warn('<Box className="bg-brand text-brand-fg px-3" />').length).toBe(1);
    expect(warn('<Box className="bg-brand text-brand-fg px-3" />')[0].severity).toBe("warn");
    expect(warn('<Box className="bg-brand text-brand-fg" />')[0].fix).toContain("bg-brand-solid");
    expect(warn('<Box className="data-[state=on]:bg-brand data-[state=on]:text-brand-fg" />')[0].fix).toContain("data-[state=on]:bg-brand-solid");
    expect(warn('const c = cn("rounded", active && "bg-brand text-brand-fg");').length).toBe(1);
    // accessible fill, decorative brand fills, tints and a lone text-brand-fg are fine
    expect(warn('<Box className="bg-brand-solid text-brand-fg hover:bg-brand-solid-hover" />')).toEqual([]);
    expect(warn('<span className="h-2 w-2 rounded-full bg-brand" />')).toEqual([]);
    expect(warn('<Box className="bg-brand/10 text-brand-text" />')).toEqual([]);
    expect(warn('<Box className="bg-brand-subtle text-brand-fg" />')).toEqual([]);
    expect(warn('// bg-brand with text-brand-fg\nconst a = 1;')).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
// @ts-expect-error plain ESM
import { analyze, contrastRatio, isLocalUrl, formatReport, DEV_OVERLAY_CSS, summarize, runVisualCheck } from "../../packages/cli/src/lib/visual-check.mjs";

const item = (o: object = {}) => ({ sel: "h1.x", text: "Hello", fontSize: 30, lineHeight: 36, weight: 700, color: "rgb(0, 0, 0)", opacity: 1, lines: 1, x: 0, y: 0, w: 200, h: 36, ...o });
const data = (items: object[], extra: object = {}) => ({ items, interactive: [], scrollW: 1440, innerW: 1440, bodySize: 16, isApp: false, ctaBottom: null, ...extra });
const vp = { width: 1440, height: 900 };
const WHITE = [255, 255, 255];

describe("visual-check analyze", () => {
  it("passes clean text", () => {
    expect(analyze(data([item()]), [WHITE], vp).filter((x: any) => x.severity !== "info")).toEqual([]);
  });
  it("fails a multi-line heading whose line-height is under its font-size", () => {
    const f = analyze(data([item({ lineHeight: 20, lines: 2 })]), [WHITE], vp);
    expect(f[0]).toMatchObject({ severity: "fail", rule: "line-height" });
  });
  it("only warns for a single line", () => {
    const f = analyze(data([item({ lineHeight: 20, lines: 1 })]), [WHITE], vp);
    expect(f[0]).toMatchObject({ severity: "warn", rule: "line-height" });
  });
  it("fails text that vanishes into its backdrop, over the real backdrop not the css one", () => {
    const f = analyze(data([item({ color: "rgb(240, 240, 240)" })]), [WHITE], vp);
    expect(f[0]).toMatchObject({ severity: "fail", rule: "contrast" });
  });
  it("warns, not fails, on a borderline ratio", () => {
    // ~4.4:1 normal text
    const f = analyze(data([item({ fontSize: 16, lineHeight: 24, color: "rgb(125, 125, 125)" })]), [WHITE], vp);
    const r = contrastRatio([125, 125, 125], WHITE);
    expect(r).toBeGreaterThan(4.0); expect(r).toBeLessThan(4.5);
    expect(f[0]).toMatchObject({ severity: "warn", rule: "contrast" });
  });
  it("does not judge contrast on text that is still animating in", () => {
    const f = analyze(data([item({ color: "rgb(240, 240, 240)", animating: true })]), [WHITE], vp);
    expect(f.some((x: any) => x.rule === "contrast")).toBe(false);
  });
  it("flags overlapping text boxes of different elements", () => {
    const f = analyze(data([item(), item({ sel: "p.y", y: 10, h: 30 })]), [WHITE, WHITE], vp);
    expect(f.some((x: any) => x.rule === "overlap")).toBe(true);
  });
  it("does not flag stacked boxes", () => {
    const f = analyze(data([item(), item({ sel: "p.y", y: 40 })]), [WHITE, WHITE], vp);
    expect(f.some((x: any) => x.rule === "overlap")).toBe(false);
  });
  it("fails horizontal overflow and warns on tiny tap targets", () => {
    const f = analyze(data([], { scrollW: 1500, interactive: [{ sel: "a.t", w: 10, h: 10 }] }), [], vp);
    expect(f.map((x: any) => x.rule).sort()).toEqual(["overflow", "tap-24"]);
  });
  it("collapses repeated findings with a count", () => {
    const items = Array.from({ length: 5 }, (_, i) => item({ sel: `h2.n${i}`, lineHeight: 20, lines: 2, y: i * 100 }));
    const f = analyze(data(items), items.map(() => WHITE), vp).filter((x: any) => x.severity === "fail");
    expect(f).toHaveLength(1);
    expect(f[0].count).toBe(5);
  });
  it("mobile reports sub-44px targets as info", () => {
    const f = analyze(data([], { interactive: [{ sel: "button.b", w: 30, h: 30 }] }), [], { width: 390 });
    expect(f[0]).toMatchObject({ severity: "info", rule: "tap-44" });
  });
});

describe("visual-check info notes", () => {
  const big = (o: object = {}) => item({ fontSize: 72, lineHeight: 76, isH1: true, sel: "h1", text: "Headline", ...o });
  const body = (o: object = {}) => item({ fontSize: 16, lineHeight: 24, sel: "p", text: "A normal paragraph of body copy that runs on.", isH1: false, ...o });
  const info = (f: any[], rule: string) => f.filter((x) => x.rule === rule);

  it("passes a marketing page with a 72px H1 over 16px body", () => {
    const f = analyze(data([big(), body()]), [WHITE, WHITE], vp);
    expect(f.filter((x: any) => x.severity === "info")).toEqual([]);
  });
  it("notes a small display scale on a marketing page", () => {
    const f = analyze(data([big({ fontSize: 30, lineHeight: 36 }), body()]), [WHITE, WHITE], vp);
    expect(info(f, "type-scale")[0]).toMatchObject({ severity: "info" });
    expect(info(f, "h1-size")[0].msg).toMatch(/under 48px.*4xl.*5xl is for a short headline/);
  });
  it("does not note a 60px H1, the top of the fluid 4xl hero", () => {
    const f = analyze(data([big({ fontSize: 60, lineHeight: 65 }), body()]), [WHITE, WHITE], vp);
    expect(info(f, "h1-size")).toEqual([]);
  });
  it("notes a 40px H1 and points at 4xl, with 5xl for a short headline", () => {
    const f = analyze(data([big({ fontSize: 40, lineHeight: 44 }), body()]), [WHITE, WHITE], vp);
    expect(info(f, "h1-size")).toHaveLength(1);
    expect(info(f, "h1-size")[0].msg).toMatch(/^H1 is 40px at .* under 48px; .*Heading size="4xl".*5xl is for a short headline/);
  });
  it("skips the marketing type rules on an app page", () => {
    const f = analyze(data([big({ fontSize: 30, lineHeight: 36 }), body()], { isApp: true }), [WHITE, WHITE], vp);
    expect(info(f, "type-scale")).toEqual([]);
    expect(info(f, "h1-size")).toEqual([]);
  });
  it("counts body sentences under 14px but not all-caps labels", () => {
    const f = analyze(data([big(), body({ fontSize: 12, lineHeight: 16 }), body({ fontSize: 11, lineHeight: 14, caps: true, text: "AN EYEBROW LABEL THAT IS LONG ENOUGH TO COUNT" })]), [WHITE, WHITE, WHITE], vp);
    expect(info(f, "small-text")).toHaveLength(1);
    expect(info(f, "small-text")[0].msg).toMatch(/^1 sentence of body copy under 14px/);
  });
  it("notes a phone H1 under 28px and a CTA below the fold", () => {
    const f = analyze(data([big({ fontSize: 24, lineHeight: 28 }), body()], { ctaBottom: 1100 }), [WHITE, WHITE], { width: 390, height: 844 });
    expect(info(f, "h1-size")[0].msg).toMatch(/fluid heading sizes start at 36px/);
    expect(info(f, "cta-fold")[0].msg).toMatch(/1100px, below the 844px phone fold/);
  });
  it("does not judge text that is scrolled out of view (a wide table on a phone)", () => {
    const f = analyze(data([item({ color: "rgb(0, 0, 0)", offscreen: true })]), [[0, 0, 0]], vp);
    expect(f.some((x: any) => x.rule === "contrast")).toBe(false);
  });
  it("treats a table under a small title as an app page", () => {
    const f = analyze(data([big({ fontSize: 30, lineHeight: 36 }), body()], { hasTable: true }), [WHITE, WHITE], vp);
    expect(info(f, "type-scale")).toEqual([]);
    expect(info(f, "h1-size")).toEqual([]);
  });
  it("still judges a marketing hero (48px or more) that has a comparison table", () => {
    const f = analyze(data([big({ fontSize: 56, lineHeight: 60 }), body()], { hasTable: true, bodySize: 20 }), [WHITE, WHITE], vp);
    expect(info(f, "type-scale")).toHaveLength(1);
    expect(info(f, "h1-size")).toEqual([]);
  });
  it("skips the phone H1 note on an app page", () => {
    const f = analyze(data([big({ fontSize: 24, lineHeight: 28 }), body()], { isApp: true }), [WHITE, WHITE], { width: 390, height: 844 });
    expect(info(f, "h1-size")).toEqual([]);
  });
  it("reports looping motion once and ignores its overlaps", () => {
    const a = body({ looping: true, sel: "div.marquee", text: "Logo logo logo logo logo logo logo logo" });
    const b = body({ looping: true, sel: "div.marquee2", y: 5, text: "Logo logo logo logo logo logo logo logo" });
    const f = analyze(data([big(), a, b]), [WHITE, WHITE, WHITE], vp);
    expect(info(f, "auto-motion")[0].msg).toMatch(/2 text elements move on a loop.*WCAG 2.2.2/);
    expect(f.some((x: any) => x.rule === "overlap")).toBe(false);
  });
});

describe("visual-check runner", () => {
  it("hides the dev-server buttons that float over the page", () => {
    expect(DEV_OVERLAY_CSS).toMatch(/nextjs-portal/);
    expect(DEV_OVERLAY_CSS).toMatch(/Toggle Shavin Dev Inspector/);
    expect(DEV_OVERLAY_CSS).toMatch(/\[data-shavin-inspector\]/);
    expect(DEV_OVERLAY_CSS).toMatch(/display:none!important/);
  });
  it("accepts local urls only", () => {
    expect(isLocalUrl("http://localhost:3000/")).toBe(true);
    expect(isLocalUrl("http://127.0.0.1:5173")).toBe(true);
    expect(isLocalUrl("http://app.localhost:3000")).toBe(true);
    expect(isLocalUrl("https://example.com")).toBe(false);
    expect(isLocalUrl("file:///etc/passwd")).toBe(false);
  });
  it("refuses a remote url without launching anything", async () => {
    const r = await runVisualCheck("https://example.com", { launch: { launch: () => { throw new Error("must not launch"); } } });
    expect(r.status).toBe("error");
  });
  it("skips, never fails, when no browser can start", async () => {
    const r = await runVisualCheck("http://localhost:3000", { launch: { launch: async () => { throw new Error("no browser"); } } });
    expect(r.status).toBe("skipped");
    expect(formatReport(r)).toContain("skipped");
  });
  it("retries a page load once, then reports a load error", async () => {
    let tries = 0;
    const page = { on() {}, goto: async () => { tries++; throw new Error("page.goto: Timeout 90000ms exceeded."); } };
    const browser = { newContext: async () => ({ newPage: async () => page, close: async () => {} }), close: async () => {} };
    const r = await runVisualCheck("http://localhost:3000", { launch: { launch: async () => browser } });
    expect(tries).toBe(2);
    expect(r.status).toBe("error");
    expect(r.message).toContain("Could not load");
  });
  it("formats findings and screenshot paths", () => {
    const report = { url: "http://localhost:3000", status: "fail", viewports: { desktop: { width: 1440, textBoxes: 3, screenshot: "/tmp/x/desktop.png", findings: [{ severity: "fail", rule: "contrast", sel: "h1", text: "Hi", msg: "contrast 1.01:1", count: 1, extra: [] }] } } };
    expect(summarize(report)).toMatchObject({ fail: 1, status: "fail" });
    const t = formatReport(report);
    expect(t).toContain("[FAIL] contrast");
    expect(t).toContain("/tmp/x/desktop.png");
  });
});

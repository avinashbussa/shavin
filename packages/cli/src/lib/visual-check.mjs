/**
 * Shavin visual check: loads a page headless at desktop and mobile width and reports defects an agent
 * cannot see from the code: text boxes that overlap, a line box smaller than its glyphs, text contrast
 * measured over the REAL backdrop (photo, video, gradient, mesh), horizontal overflow, small tap targets
 * and console errors. Screenshots are saved so the agent can look at them. Shared by the MCP `render_check`.
 *
 * Read-only. Local pages only (localhost, 127.0.0.1, ::1, *.localhost). Needs Playwright (optional: without
 * it the check is "skipped", never a failure). Uses system Chrome when no Playwright browser is installed.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/** Dev-server chrome that floats over the page (Next and Shavin dev buttons, the Shavin inspector bar, Vite error overlay): hidden so it is not measured or screenshotted. */
export const DEV_OVERLAY_CSS = 'nextjs-portal,[data-nextjs-toast],[data-nextjs-dev-tools-button],#vite-error-overlay,vite-error-overlay,[aria-label="Toggle Shavin Dev Inspector"],[data-shavin-inspector]{display:none!important}';

export const VIEWPORTS = [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
];

export function isLocalUrl(url) {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return false;
    const h = u.hostname.replace(/^\[|\]$/g, "");
    return h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".localhost");
  } catch { return false; }
}

// ---- pure helpers (tested without a browser) ----------------------------------------------------------------

const lum = ([r, g, b]) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
export const contrastRatio = (a, b) => {
  const [hi, lo] = lum(a) > lum(b) ? [a, b] : [b, a];
  return (lum(hi) + 0.05) / (lum(lo) + 0.05);
};
export const parseRgb = (s) => {
  const m = String(s).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
};

const sev = (s) => ({ fail: 0, warn: 1, info: 2 })[s];

/**
 * @param {{items: object[], interactive: object[], scrollW: number, innerW: number}} data  collected in the page
 * @param {(number[]|null)[]} bgs  median backdrop colour under each item (same order as data.items)
 * @param {{width:number}} vp
 * @param {string[]} errors  console errors
 */
export function analyze(data, bgs, vp, errors = []) {
  const out = [];
  const add = (severity, rule, sel, text, msg) => out.push({ severity, rule, sel, text: text || "", msg });
  data.items.forEach((it, i) => {
    if (it.lineHeight < it.fontSize * 0.95) {
      add(it.lines > 1 ? "fail" : "warn", "line-height", it.sel, it.text,
        `line-height ${it.lineHeight.toFixed(0)}px is smaller than font-size ${it.fontSize.toFixed(0)}px${it.lines > 1 ? ` over ${it.lines} lines: lines overlap` : ""}. Give the text an explicit leading (Heading size, or leading-tight/snug).`);
    }
    const fg0 = parseRgb(it.color), bg = bgs[i];
    if (fg0 && bg && !it.animating && !it.offscreen) {
      const a = fg0.a * it.opacity;
      const fg = fg0.rgb.map((c, k) => Math.round(c * a + bg[k] * (1 - a)));
      const large = it.fontSize >= 24 || (it.fontSize >= 18.66 && it.weight >= 700);
      const need = large ? 3 : 4.5;
      const r = contrastRatio(fg, bg);
      // 3% tolerance for sampling error on photos and gradients; below 90% of the need is a hard fail.
      if (r < need * 0.97) add(r < need * 0.9 ? "fail" : "warn", "contrast", it.sel, it.text,
        `contrast ${r.toFixed(2)}:1 over the real backdrop (needs ${need}:1). Set surface="dark-always" or "light-always" on the section, or add a scrim in bgOverlays.`);
    }
  });
  const its = data.items;
  for (let i = 0; i < its.length; i++) for (let j = i + 1; j < its.length; j++) {
    const a = its[i], b = its[j];
    if (a.looping || b.looping) continue;
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ox > 2 && oy > 2) {
      const ratio = (ox * oy) / Math.min(a.w * a.h, b.w * b.h);
      if (ratio > 0.12) add(ratio > 0.3 ? "fail" : "warn", "overlap", `${a.sel} x ${b.sel}`, `${a.text.slice(0, 24)} | ${b.text.slice(0, 24)}`,
        `text boxes overlap by ${Math.round(ox)}x${Math.round(oy)}px. Check line-height, negative margins and absolute positioning.`);
    }
  }
  if (data.scrollW > data.innerW + 1) add("fail", "overflow", "document", "", `horizontal scroll of ${data.scrollW - data.innerW}px at ${vp.width}px wide. Find the element wider than the viewport.`);
  const small = data.interactive.filter((e) => e.w < 24 || e.h < 24);
  if (small.length) add("warn", "tap-24", small.slice(0, 3).map((e) => e.sel).join(", "), "", `${small.length} interactive element(s) under 24px (WCAG 2.5.8).`);
  if (vp.width < 500) {
    const t44 = data.interactive.filter((e) => (e.w < 44 || e.h < 44) && !(e.w < 24 || e.h < 24));
    if (t44.length) add("info", "tap-44", t44.slice(0, 3).map((e) => e.sel).join(", "), "", `${t44.length} interactive element(s) under 44px on mobile.`);
  }
  // Info-level type, fold and motion notes (never FAIL or WARN). Marketing-page type rules skip app pages.
  const largest = data.items.reduce((m, it) => Math.max(m, it.fontSize), 0);
  const h1 = data.items.filter((it) => it.isH1).reduce((m, it) => Math.max(m, it.fontSize), 0);
  const body = data.bodySize || 16;
  // An app or data page: a sidebar, an aside or an app frame, or a table under a small page title (a marketing hero is 48px or more).
  const isApp = data.isApp || (data.hasTable && h1 < 48);
  if (vp.width >= 1024 && !isApp && data.items.length) {
    if (largest < body * 3) add("info", "type-scale", "", "", `largest type is ${(largest / body).toFixed(1)}x the body size (${largest.toFixed(0)}px over ${body.toFixed(0)}px); strong marketing pages use 3x or more`);
    if (h1 && h1 < 64) add("info", "h1-size", "h1", "", `H1 is ${h1.toFixed(0)}px at ${vp.width}px wide${h1 < 48 ? ", well under" : ", under"} 64px; marketing heroes read stronger at 64px or more (Heading size="5xl")`);
  }
  const tiny = data.items.filter((it) => it.fontSize < 14 && !it.caps && !it.offscreen && it.text.length >= 30);
  if (tiny.length) add("info", "small-text", tiny[0].sel, tiny[0].text, `${tiny.length} sentence${tiny.length > 1 ? "s" : ""} of body copy under 14px (${tiny[0].fontSize.toFixed(0)}px); keep secondary text at 14px or more`);
  if (vp.width < 500) {
    if (h1 && h1 < 28 && !isApp) add("info", "h1-size", "h1", "", `H1 is ${h1.toFixed(0)}px at ${vp.width}px wide; fluid heading sizes start at 36px`);
    if (data.ctaBottom != null && vp.height && data.ctaBottom > vp.height) add("info", "cta-fold", "", "", `the first call to action ends at ${Math.round(data.ctaBottom)}px, below the ${vp.height}px phone fold; keep the primary CTA above it`);
  }
  const looping = data.items.filter((it) => it.looping);
  if (looping.length) add("info", "auto-motion", looping[0].sel, looping[0].text, `${looping.length} text element${looping.length > 1 ? "s" : ""} move on a loop that never ends (marquee or ticker): needs a visible pause control (WCAG 2.2.2) and a still version under prefers-reduced-motion`);
  if (errors.length) add("warn", "console", "", "", `console error: ${errors[0]}`);
  return dedupe(out).sort((a, b) => sev(a.severity) - sev(b.severity));
}

/** Same rule + same message on many nodes collapses to one finding with a count; max 6 per rule. */
function dedupe(list) {
  const seen = new Map();
  for (const f of list) {
    const key = `${f.rule}|${f.severity}|${f.msg.replace(/\d+(\.\d+)?/g, "#")}`;
    const hit = seen.get(key);
    if (hit) { hit.count++; if (hit.extra.length < 2) hit.extra.push(f.sel); } else seen.set(key, { ...f, count: 1, extra: [] });
  }
  const perRule = {};
  return [...seen.values()].filter((f) => (perRule[f.rule] = (perRule[f.rule] || 0) + 1) <= 6);
}

export function summarize(report) {
  const all = Object.values(report.viewports).flatMap((v) => v.findings);
  const fail = all.filter((f) => f.severity === "fail").length;
  const warn = all.filter((f) => f.severity === "warn").length;
  return { fail, warn, status: fail ? "fail" : warn ? "warn" : "pass" };
}

// ---- in-page collector --------------------------------------------------------------------------------------

/** Runs in the page (self-contained). Skips hidden, sr-only, aria-hidden and disabled elements. */
function collect() {
  const skip = (el) => {
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      if (e.getAttribute("aria-hidden") === "true" || e.hasAttribute("inert") || e.disabled || e.getAttribute("aria-disabled") === "true") return true;
    }
    return false;
  };
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    let e = el, op = 1;
    while (e && e.nodeType === 1) { op *= parseFloat(getComputedStyle(e).opacity); e = e.parentElement; }
    return op > 0.05 ? op : false;
  };
  const desc = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${[...el.classList].slice(0, 2).map((c) => "." + c).join("")}`;
  const seen = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName) || skip(el)) continue;
    const op = vis(el);
    if (!op) continue;
    const r = document.createRange();
    r.selectNodeContents(n);
    const rects = [...r.getClientRects()].filter((q) => q.width > 1 && q.height > 1);
    if (!rects.length) continue;
    const eb = el.getBoundingClientRect();
    if (eb.width <= 2 && eb.height <= 2) continue; // sr-only
    const rec = seen.get(el) ?? { el, rects: [], text: "" };
    rec.rects.push(...rects.map((q) => ({ x: q.x + scrollX, y: q.y + scrollY, w: q.width, h: q.height })));
    rec.text += n.nodeValue.trim() + " ";
    rec.op = op;
    seen.set(el, rec);
  }
  const items = [];
  for (const rec of seen.values()) {
    const cs = getComputedStyle(rec.el);
    const fs = parseFloat(cs.fontSize);
    const lh = cs.lineHeight === "normal" ? fs * 1.2 : parseFloat(cs.lineHeight);
    const x0 = Math.min(...rec.rects.map((q) => q.x)), y0 = Math.min(...rec.rects.map((q) => q.y));
    const x1 = Math.max(...rec.rects.map((q) => q.x + q.w)), y1 = Math.max(...rec.rects.map((q) => q.y + q.h));
    // A fade or slide still running samples a half-visible colour: do not judge contrast on it.
    // A loop that never ends (marquee, ticker) moves text under the sampler: skip overlap on it and report it once.
    let animating = false, looping = false;
    for (let e = rec.el; e && e.nodeType === 1 && !(animating && looping); e = e.parentElement) {
      if (typeof e.getAnimations !== "function") continue;
      for (const a of e.getAnimations()) {
        if (a.playState !== "running" || !a.effect) continue;
        if (a.effect.getComputedTiming().iterations === Infinity) looping = true; else animating = true;
      }
    }
    const caps = cs.textTransform === "uppercase" || (parseFloat(cs.letterSpacing) > 0.5 && rec.text === rec.text.toUpperCase());
    items.push({
      offscreen: x0 >= innerWidth - 1 || x1 <= 1, animating, looping, caps, isH1: !!rec.el.closest("h1"), sel: desc(rec.el), text: rec.text.trim().slice(0, 60), fontSize: fs, lineHeight: lh,
      weight: parseInt(cs.fontWeight, 10) || 400, color: cs.color, opacity: rec.op,
      lines: new Set(rec.rects.map((q) => Math.round(q.y))).size, x: x0, y: y0, w: x1 - x0, h: y1 - y0,
    });
  }
  const interactive = [...document.querySelectorAll("a[href],button,input,select,textarea,[role=button],[role=tab]")]
    .filter((el) => vis(el) && !skip(el)).filter((el) => {
      // WCAG 2.5.8 exempts a link inside a sentence.
      if (el.tagName !== "A" || getComputedStyle(el).display !== "inline") return true;
      return ![...el.parentNode.childNodes].some((n) => n !== el && n.nodeType === 3 && n.nodeValue.trim());
    }).map((el) => {
      const q = el.getBoundingClientRect();
      // The hit area may be a pseudo-element (hit-area utility): measure it too and take the larger box.
      const pe = getComputedStyle(el, "::after");
      const inset = pe.content !== "none" && pe.position === "absolute" ? { w: parseFloat(pe.width) || 0, h: parseFloat(pe.height) || 0 } : { w: 0, h: 0 };
      return { sel: desc(el), w: Math.max(q.width, inset.w), h: Math.max(q.height, inset.h), vis: q.width > 0 && q.height > 0 };
    }).filter((e) => e.vis && !(e.w <= 2 && e.h <= 2)); // sr-only skip links
  // First call to action in the page body (not the header or nav), for the phone fold check.
  const cta = [...document.querySelectorAll("main a[href], main button, body > div a[href], body > div button")].find((el) => !el.closest("header, nav, footer") && vis(el) && !skip(el));
  const ctaBottom = cta ? cta.getBoundingClientRect().bottom + scrollY : null;
  const hasTable = !!document.querySelector("table, [role=table]");
  const isApp = !!document.querySelector('aside, [class*="shavin-frame"], nav[aria-label*="idebar" i]');
  return { items, interactive, isApp, hasTable, ctaBottom, bodySize: parseFloat(getComputedStyle(document.body).fontSize) || 16, scrollW: document.documentElement.scrollWidth, innerW: innerWidth };
}

/** Median backdrop colour under each box from a text-transparent full-page screenshot. Runs in the page. */
async function sampleBackdrops({ bgUrl, boxes }) {
  const img = new Image(); img.src = bgUrl; await img.decode();
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
  return boxes.map((b) => {
    const x = Math.max(0, Math.floor(b.x)), y = Math.max(0, Math.floor(b.y));
    const w = Math.max(1, Math.min(Math.ceil(b.w), c.width - x)), h = Math.max(1, Math.min(Math.ceil(b.h), c.height - y));
    if (y >= c.height || x >= c.width) return null;
    const d = g.getImageData(x, y, w, h).data, px = [];
    const step = Math.max(1, Math.floor((w * h) / 400));
    for (let i = 0; i < w * h; i += step) px.push([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
    const med = (k) => px.map((p) => p[k]).sort((a, b) => a - b)[Math.floor(px.length / 2)];
    return [med(0), med(1), med(2)];
  });
}

// ---- runner -------------------------------------------------------------------------------------------------

async function loadChromium(launch) {
  if (launch) return launch;
  for (const name of ["playwright", "playwright-core", "@playwright/test"]) {
    try { const m = await import(name); if (m.chromium) return m.chromium; } catch { /* next */ }
  }
  return null;
}

/**
 * @param {string} url  a local page, for example http://localhost:3000/
 * @param {{ outDir?: string, timeoutMs?: number, launch?: object, viewports?: typeof VIEWPORTS }} [opts]
 */
export async function runVisualCheck(url, { outDir, timeoutMs = 90000, launch, viewports = VIEWPORTS } = {}) {
  if (!isLocalUrl(url)) return { status: "error", message: "render_check loads local pages only (localhost, 127.0.0.1, *.localhost). Start the dev server and pass its URL.", viewports: {} };
  const chromium = await loadChromium(launch);
  if (!chromium) return { status: "skipped", message: "Playwright is not installed. Run: npm i -D playwright (system Chrome is used when no Playwright browser is installed).", viewports: {} };
  const dir = resolve(outDir || join(tmpdir(), `shavin-render-${Date.now()}`));
  mkdirSync(dir, { recursive: true });
  let browser;
  try {
    try { browser = await chromium.launch({ headless: true }); }
    catch { browser = await chromium.launch({ headless: true, channel: "chrome" }); }
  } catch (e) {
    return { status: "skipped", message: `No browser could start (${String(e.message || e).split("\n")[0]}). Install one: npx playwright install chromium, or install Google Chrome.`, viewports: {} };
  }
  const report = { url, status: "pass", screenshotDir: dir, viewports: {} };
  try {
    for (const [name, vp] of viewports) {
      const ctx = await browser.newContext({ viewport: vp, reducedMotion: "reduce", colorScheme: "light", deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const errors = [];
      // A missing favicon or other 404 asset is not a page defect; script and runtime errors are.
      page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource.*\b404\b/.test(m.text())) errors.push(m.text().slice(0, 140)); });
      // A dev server compiles a route on its first request, which can take a minute: wait, then retry once.
      let loadError = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try { await page.goto(url, { waitUntil: "load", timeout: timeoutMs }); loadError = null; break; }
        catch (e) { loadError = e; }
      }
      if (loadError) { await ctx.close(); return { status: "error", message: `Could not load ${url}: ${String(loadError.message || loadError).split("\n")[0]}`, viewports: report.viewports }; }
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {}); // dev servers keep an HMR socket: best effort
      await page.evaluate(async () => { await document.fonts.ready; });
      await page.addStyleTag({ content: DEV_OVERLAY_CSS });
      await page.waitForTimeout(1200);
      // Let fades and slides finish (capped), so text is measured at its final colour.
      await page.evaluate(() => Promise.race([
        Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))),
        new Promise((r) => setTimeout(r, 3000)),
      ]));
      const data = await page.evaluate(collect);
      const shot = join(dir, `${name}.png`);
      writeFileSync(shot, await page.screenshot({ fullPage: true }));
      await page.addStyleTag({ content: "*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important}" });
      await page.waitForTimeout(250);
      const bgUrl = "data:image/png;base64," + (await page.screenshot({ fullPage: true })).toString("base64");
      const bgs = await page.evaluate(sampleBackdrops, { bgUrl, boxes: data.items.map((i) => ({ x: i.x, y: i.y, w: i.w, h: i.h })) });
      report.viewports[name] = { width: vp.width, textBoxes: data.items.length, screenshot: shot, findings: analyze(data, bgs, vp, errors) };
      await ctx.close();
    }
  } finally {
    await browser.close().catch(() => {});
  }
  report.status = summarize(report).status;
  return report;
}

/** Plain-text report for the MCP tool: findings first, screenshots to look at, then what to do. */
export function formatReport(report) {
  if (report.status === "error" || report.status === "skipped") return `# render_check: ${report.status}\n\n${report.message}`;
  const s = summarize(report);
  const lines = [`# render_check: ${s.status.toUpperCase()} (${s.fail} fail, ${s.warn} warn)`, "", `Page: ${report.url}`];
  for (const [name, v] of Object.entries(report.viewports)) {
    lines.push("", `## ${name} ${v.width}px (${v.textBoxes} text boxes)`);
    if (!v.findings.length) lines.push("- no defects found");
    for (const f of v.findings) {
      const more = f.count > 1 ? ` (x${f.count}${f.extra.length ? `, also ${f.extra.join(", ")}` : ""})` : "";
      lines.push(`- [${f.severity.toUpperCase()}] ${f.rule} \`${f.sel}\`${f.text ? ` "${f.text}"` : ""}: ${f.msg}${more}`);
    }
  }
  lines.push("", "## Look at the screenshots", ...Object.entries(report.viewports).map(([n, v]) => `- ${n}: ${v.screenshot}`),
    "", "Open each screenshot and judge it: hero strength, empty or cramped areas, alignment, anything the checks cannot see. Fix every FAIL, then run render_check again.");
  return lines.join("\n");
}

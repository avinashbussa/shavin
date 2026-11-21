/**
 * Shavin render check: loads one page in a headless browser and confirms that Shavin actually renders
 * styled, not just that the setup files exist. Complements doctor.mjs (static checks); shared by
 * `shavin check --render <url>` and the MCP `inspect_environment({ renderUrl })`.
 *
 * Read-only. Needs a running dev or preview server and Playwright (optional: without it the check is
 * "skipped", never a failure).
 *
 * Probes:
 *   tokens     the Shavin CSS variables resolve on <html>         (tokens.css imported and loaded)
 *   utilities  a probe element with `bg-surface` gets a background (Tailwind ran, theme-v4 + @source cover Shavin)
 *   component  a Shavin component on the page has real radius/padding (its arbitrary classes were generated)
 */

/** Pure scoring of what the page reported, so it can be tested without a browser. */
export function scoreRender(probe) {
  const checks = [];
  const add = (id, status, label, message, fix) => checks.push({ id, group: "render", status, label, message, ...(fix ? { fix } : {}) });
  if (!probe.loaded) {
    add("page", "fail", "Page", probe.error || "The page did not load", "Start the dev server and pass its URL");
    return finish(checks);
  }
  add("page", "pass", "Page", `HTTP ${probe.status}`);
  if (probe.status >= 400) checks[0] = { ...checks[0], status: "fail", message: `HTTP ${probe.status}`, fix: "Pass the URL of a page that loads" };
  add("tokens", probe.tokens ? "pass" : "fail", "Shavin tokens", probe.tokens ? "CSS variables resolve" : "No Shavin CSS variables on <html>: the stylesheet is not loaded or does not import @shavin/ui/tokens.css",
    probe.tokens ? undefined : "Run shavin check: import globals.css in the root layout and the tokens import in it");
  add("utilities", probe.utilities ? "pass" : "fail", "Tailwind utilities", probe.utilities ? "bg-surface has a background" : "bg-surface renders transparent: Tailwind did not generate Shavin's utilities",
    probe.utilities ? undefined : "Check the @shavin/ui theme import, the @source for @shavin/ui and the PostCSS/Vite plugin (shavin check lists the exact lines)");
  if (probe.component === null) add("component", "info", "Shavin component", "No Shavin component on this page to probe");
  else add("component", probe.component ? "pass" : "fail", "Shavin component", probe.component ? "Radius and padding applied" : "A Shavin component has no radius or padding: its classes were not generated",
    probe.component ? undefined : 'Add @source "<path>/node_modules/@shavin/ui"; to the global stylesheet (Tailwind 4) or the @shavin/ui path to content (Tailwind 3)');
  return finish(checks);
}

function finish(checks) {
  const failed = checks.some((c) => c.status === "fail");
  return { ok: !failed, status: failed ? "fail" : "pass", checks };
}

/** In-page probe, run with page.evaluate. Self-contained (no closures). */
function probeInPage() {
  const root = getComputedStyle(document.documentElement);
  const tokens = !!(root.getPropertyValue("--bg-canvas").trim() || root.getPropertyValue("--fg").trim() || root.getPropertyValue("--brand").trim());
  const el = document.createElement("div");
  el.className = "bg-surface";
  el.style.cssText = "position:absolute;left:-9999px;width:10px;height:10px";
  document.body.appendChild(el);
  const bg = getComputedStyle(el).backgroundColor;
  el.remove();
  const utilities = !!bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
  const sample = [...document.querySelectorAll('[class*="--radius-lg"], [class*="--radius-panel"]')].slice(0, 5);
  let component = null;
  if (sample.length) component = sample.some((n) => { const s = getComputedStyle(n); return parseFloat(s.borderTopLeftRadius) > 0 || parseFloat(s.paddingLeft) > 0; });
  return { tokens, utilities, component };
}

/**
 * @param {string} url  page to load, for example http://localhost:3000/
 * @returns {Promise<{ ok: boolean, status: "pass"|"fail"|"skipped", checks: object[] }>}
 */
export async function runRenderCheck(url, { timeoutMs = 30000, launch } = {}) {
  let chromium = launch;
  if (!chromium) {
    for (const name of ["playwright", "playwright-core", "@playwright/test"]) {
      try { chromium = (await import(name)).chromium; if (chromium) break; } catch { /* try the next one */ }
    }
  }
  if (!chromium) {
    return { ok: true, status: "skipped", checks: [{ id: "render", group: "render", status: "info", label: "Render check", message: "Skipped: Playwright is not installed", fix: "npm i -D playwright && npx playwright install chromium, then run the check again" }] };
  }
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    let status = 0;
    try {
      // "load", not "networkidle": a dev server keeps an HMR socket open, so the network never goes idle.
      const resp = await page.goto(url, { waitUntil: "load", timeout: timeoutMs });
      status = resp ? resp.status() : 0;
      if (page.waitForTimeout) await page.waitForTimeout(600);
    } catch (e) {
      return scoreRender({ loaded: false, error: `Could not load ${url}: ${String(e.message || e).split("\n")[0]}` });
    }
    const probe = await page.evaluate(probeInPage);
    return scoreRender({ loaded: true, status, ...probe });
  } catch (e) {
    return { ok: true, status: "skipped", checks: [{ id: "render", group: "render", status: "info", label: "Render check", message: `Skipped: ${String(e.message || e).split("\n")[0]}`, fix: "npx playwright install chromium" }] };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

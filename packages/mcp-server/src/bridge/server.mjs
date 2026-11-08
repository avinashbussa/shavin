import { createServer } from "node:http";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BRIDGE_PORT, BRIDGE_HOST } from "./constants.mjs";

export { BRIDGE_PORT, BRIDGE_HOST } from "./constants.mjs";

export const SHAVIN_FAVICON_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="6.99382e-07" y="16" width="16" height="16" rx="4" transform="rotate(-90 6.99382e-07 16)" fill="black"/>
<path d="M7.20538 8.31244L7.21999 6.91474L7.21999 5.49874L3.79999 5.49874L3.79999 4.17874L12.2 4.17874L11.2 5.49874L8.41999 5.49874L8.41999 6.91474L8.40538 7.31244C8.40538 7.31244 7.94202 7.60552 7.75547 7.78109C7.56893 7.95666 7.20538 8.31244 7.20538 8.31244Z" fill="white"/>
<path d="M12.32 9.87729C12.32 10.5173 12.14 11.0013 11.78 11.3293C11.412 11.6573 10.888 11.8213 10.208 11.8213L8.72799 11.8213L9.72799 10.5733L10.304 10.5733C10.848 10.5733 11.12 10.3453 11.12 9.88929C11.12 9.66529 11.056 9.49729 10.928 9.38529C10.792 9.26529 10.576 9.20529 10.28 9.20529C9.92799 9.20529 9.61999 9.28529 9.35599 9.44529C9.08399 9.60529 8.75999 9.90129 8.38399 10.3333C7.90399 10.8773 7.47199 11.2573 7.08799 11.4733C6.69599 11.6893 6.25599 11.7973 5.76799 11.7973C5.10399 11.7973 4.59199 11.6293 4.23199 11.2933C3.86399 10.9573 3.67999 10.4693 3.67999 9.82929C3.67999 9.19729 3.86399 8.72129 4.23199 8.40129C4.59199 8.07329 5.11199 7.90929 5.79199 7.90929L6.13999 7.90929L6.13999 9.15729L5.70799 9.15729C5.41999 9.15729 5.21199 9.21329 5.08399 9.32529C4.94799 9.43729 4.87999 9.60129 4.87999 9.81729C4.87999 10.2573 5.14799 10.4773 5.68399 10.4773C5.98799 10.4773 6.27199 10.3973 6.53599 10.2373C6.79999 10.0693 7.11999 9.76929 7.49599 9.33729C7.97599 8.78529 8.41199 8.40529 8.80399 8.19729C9.19599 7.98929 9.65599 7.88529 10.184 7.88529C10.872 7.88529 11.4 8.05729 11.768 8.40129C12.136 8.73729 12.32 9.22929 12.32 9.87729Z" fill="white"/>
</svg>`;

export class ShavinBridgeServer extends EventEmitter {
  constructor(port = BRIDGE_PORT) {
    super();
    this.port = port;
    this.server = null;
    this.activeSockets = new Set();
    this.sseClients = new Set();
    this.sseClientsByTab = new Map(); // tabId -> Set of res sockets
    this.projectSnapshots = new Map();
    this.activeTabs = new Map(); // tabId -> { project, origin, url, pathname, browser, title, lastSeen }
    this.tabSnapshots = new Map(); // tabId -> snapshot
    this.latestSnapshot = {
      tabId: "init",
      project: "Docs",
      origin: "http://localhost:3100",
      url: "http://localhost:3100",
      timestamp: new Date().toISOString(),
      stats: { total: 0, errors: 0, warnings: 0, clean: true },
      issues: [],
      theme: { dark: false, accent: "Monochrome", radius: "medium" },
      connectedTabs: 0,
    };
    this.isRunning = false;
  }

  cleanStaleTabs() {
    const now = Date.now();
    for (const [key, tab] of this.activeTabs.entries()) {
      // Never evict tabs whose SSE connection is actively open!
      if (this.sseClientsByTab.has(key) && this.sseClientsByTab.get(key).size > 0) {
        continue;
      }
      // Allow up to 120 seconds without ping before pruning
      if (now - (tab.lastSeen || 0) > 120000) {
        this.activeTabs.delete(key);
        this.tabSnapshots.delete(key);
      }
    }
  }

  getConnectedTabs() {
    this.cleanStaleTabs();
    const list = [];
    for (const [tabId, tab] of this.activeTabs.entries()) {
      const snap = this.tabSnapshots.get(tabId);
      list.push({
        tabId,
        project: tab.project || snap?.project || (tab.origin?.includes(":3100") ? "Docs" : tab.origin?.includes(":3300") ? "Website" : "App"),
        origin: tab.origin || snap?.origin || "",
        url: tab.url || snap?.url || "",
        pathname: tab.pathname || snap?.pathname || "/",
        browser: tab.browser || snap?.browser || "Browser",
        title: tab.title || snap?.title || "",
        lastSeen: tab.lastSeen || Date.now(),
        stats: snap?.stats || { total: 0, errors: 0, warnings: 0, clean: true },
        issues: snap?.issues || [],
      });
    }
    return list;
  }

  getActiveTabsCount() {
    this.cleanStaleTabs();
    return Math.max(1, this.activeTabs.size);
  }

  start() {
    if (this.isRunning) return Promise.resolve(this.port);

    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        // Enable CORS
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

        // Favicon endpoints (/favicon.ico, /favicon.svg, /icon.svg)
        if (req.method === "GET" && (url.pathname === "/favicon.ico" || url.pathname === "/favicon.svg" || url.pathname === "/icon.svg")) {
          res.writeHead(200, {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=86400",
          });
          res.end(SHAVIN_FAVICON_SVG);
          return;
        }

        // 1. POST /api/audit — Browser posts live DOM audit snapshot
        if (req.method === "POST" && url.pathname === "/api/audit") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const data = JSON.parse(body);
              this.updateSnapshot(data);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                status: "ok",
                received: this.latestSnapshot.stats,
                projectsCount: this.projectSnapshots.size,
                connectedTabs: this.getActiveTabsCount(),
              }));
            } catch (err) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 1b. POST /api/write-block — DEV-ONLY: Studio push-to-source.
        // Receives { slug, code } from the local Studio canvas and stages it
        // for the ingest script (scripts/ingest-studio-blocks.mts). Never
        // touches source files directly — the ingest step validates the slug
        // against the official registries, writes the canonical authored block file, and
        // lands the change as a reviewable git diff. Daemon binds 127.0.0.1
        // and this route is useless outside the repo checkout.
        if (req.method === "POST" && url.pathname === "/api/write-block") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const { slug, code } = JSON.parse(body);
              if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "invalid slug" }));
                return;
              }
              if (typeof code !== "string" || code.length < 10 || code.length > 200_000) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "invalid code payload" }));
                return;
              }
              // Stage relative to the repo this daemon runs in (the checkout),
              // NOT process.cwd() — npm run bridge runs from repo root.
              const repoRoot = path.join(fileURLToPath(import.meta.url), "..", "..", "..", "..", "..");
              const pendingDir = path.join(repoRoot, "packages", "block-schema", ".studio-pending");
              fs.mkdirSync(pendingDir, { recursive: true });
              const safeCode = String(code).replace(/\r\n/g, "\n");
              fs.writeFileSync(
                path.join(pendingDir, `${slug}.json`),
                JSON.stringify({ slug, code: safeCode, ts: Date.now() }, null, 2)
              );
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ status: "ok", staged: slug }));
            } catch (err) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 1c. POST /api/disconnect — Tab signals it is closing / unloading
        if (req.method === "POST" && url.pathname === "/api/disconnect") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const { tabId } = JSON.parse(body);
              if (tabId) {
                this.activeTabs.delete(tabId);
                this.tabSnapshots.delete(tabId);
              }
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ status: "disconnected", connectedTabs: this.getActiveTabsCount() }));
            } catch {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ status: "ok" }));
            }
          });
          return;
        }

        // 1c. POST /api/focus-tab — Focus specific browser tab and activate native window
        if (req.method === "POST" && url.pathname === "/api/focus-tab") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const { tabId, browser, url: tabUrl, pathname } = JSON.parse(body || "{}");
              this.broadcast({ type: "focus_tab", targetTabId: tabId });

              const tabInfo = (tabId ? this.activeTabs.get(tabId) : null) || {};
              const targetBrowser = browser || tabInfo.browser || "";
              const fullUrl = tabUrl || tabInfo.url || "";
              const routePath = pathname || tabInfo.pathname || "";

              if (process.platform === "darwin" && targetBrowser) {
                const b = targetBrowser.toLowerCase();
                let appName = null;
                if (b.includes("arc")) appName = "Arc";
                else if (b.includes("brave")) appName = "Brave Browser";
                else if (b.includes("chrome") || b.includes("chromium")) appName = "Google Chrome";
                else if (b.includes("safari")) appName = "Safari";
                else if (b.includes("edge")) appName = "Microsoft Edge";
                else if (b.includes("firefox")) appName = "Firefox";

                if (appName) {
                  import("node:child_process").then(({ exec }) => {
                    let urlSearch = "";
                    if (fullUrl) {
                      try {
                        const u = new URL(fullUrl);
                        urlSearch = u.host + (u.pathname !== "/" ? u.pathname : "");
                      } catch {
                        urlSearch = fullUrl.replace(/^https?:\/\//, "");
                      }
                    } else if (routePath) {
                      urlSearch = routePath;
                    }

                    if (appName === "Google Chrome" || appName === "Brave Browser" || appName === "Microsoft Edge") {
                      const script = `tell application "${appName}"
  activate
  set found to false
  repeat with w in windows
    set tabIdx to 0
    repeat with t in tabs of w
      set tabIdx to tabIdx + 1
      if URL of t contains "${urlSearch}" then
        set active tab index of w to tabIdx
        set index of w to 1
        set found to true
        exit repeat
      end if
    end repeat
    if found then exit repeat
  end repeat
end tell`;
                      exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (err) => {
                        if (err) {
                          exec(`osascript -e 'tell application "${appName}" to activate'`);
                        }
                      });
                    } else if (appName === "Safari") {
                      const script = `tell application "Safari"
  activate
  set found to false
  repeat with w in windows
    set tabIdx to 0
    repeat with t in tabs of w
      set tabIdx to tabIdx + 1
      if URL of t contains "${urlSearch}" then
        set current tab of w to t
        set index of w to 1
        set found to true
        exit repeat
      end if
    end repeat
    if found then exit repeat
  end repeat
end tell`;
                      exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (err) => {
                        if (err) {
                          exec(`osascript -e 'tell application "Safari" to activate'`);
                        }
                      });
                    } else {
                      // Arc, Firefox, etc.
                      exec(`osascript -e 'tell application "${appName}" to activate'`);
                    }
                  }).catch(() => {});
                }
              }

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ status: "focused", tabId, browser: targetBrowser }));
            } catch (err) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 1d. POST /api/ping — 15s tab heartbeat to keep session active
        if (req.method === "POST" && url.pathname === "/api/ping") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const data = JSON.parse(body || "{}");
              const { tabId, url: tabUrl, pathname, browser, title, project, origin } = data;
              if (tabId) {
                const existing = this.activeTabs.get(tabId) || {};
                const finalOrigin = origin || existing.origin || (tabUrl ? (() => { try { return new URL(tabUrl).origin; } catch { return ""; } })() : "");
                const finalProject = project || existing.project || (finalOrigin.includes(":3100") ? "Docs" : finalOrigin.includes(":3300") ? "Website" : "App");
                const updated = {
                  ...existing,
                  tabId,
                  project: finalProject,
                  origin: finalOrigin,
                  url: tabUrl || existing.url || "",
                  pathname: pathname || existing.pathname || "/",
                  browser: browser || existing.browser || "Browser",
                  title: title || existing.title || "",
                  lastSeen: Date.now(),
                };
                this.activeTabs.set(tabId, updated);

                if (!this.tabSnapshots.has(tabId)) {
                  this.tabSnapshots.set(tabId, {
                    ...updated,
                    stats: { total: 0, errors: 0, warnings: 0, clean: true },
                    issues: [],
                  });
                } else {
                  const snap = this.tabSnapshots.get(tabId);
                  snap.lastSeen = Date.now();
                  if (browser) snap.browser = browser;
                  if (title) snap.title = title;
                  if (tabUrl) snap.url = tabUrl;
                  if (pathname) snap.pathname = pathname;
                }
              }
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ status: "pong", connectedTabs: this.getActiveTabsCount() }));
            } catch {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ status: "ok" }));
            }
          });
          return;
        }

        // 2. GET /api/audit — Agent / MCP fetches live snapshot (supports ?path= or ?tabId= filtering)
        if (req.method === "GET" && url.pathname === "/api/audit") {
          res.writeHead(200, { "Content-Type": "application/json" });
          const targetTabId = url.searchParams.get("tabId");
          const targetPath = url.searchParams.get("path");
          const targetOrigin = url.searchParams.get("origin");

          if (targetTabId && this.tabSnapshots.has(targetTabId)) {
            res.end(JSON.stringify(this.tabSnapshots.get(targetTabId)));
          } else if (targetPath) {
            const snap = this.getSnapshot({ path: targetPath });
            res.end(JSON.stringify(snap));
          } else if (targetOrigin && this.projectSnapshots.has(targetOrigin)) {
            res.end(JSON.stringify(this.projectSnapshots.get(targetOrigin)));
          } else {
            res.end(JSON.stringify({
              ...this.latestSnapshot,
              connectedTabs: this.getActiveTabsCount(),
              tabs: this.getConnectedTabs(),
              projects: Array.from(this.projectSnapshots.values()),
            }));
          }
          return;
        }

        // 3. GET /api/source-audit — Run archlint scan on a target directory
        // Returns source-level architecture warnings (raw elements, deep imports, etc.)
        // Query params: ?dir=<path> (defaults to process.cwd())
        if (req.method === "GET" && url.pathname === "/api/source-audit") {
          import("../tools/archlint.mjs")
            .then(({ scanDirectory }) => {
              const targetDir = url.searchParams.get("dir") || process.cwd();
              const result = scanDirectory(targetDir);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(result));
            })
            .catch((err) => {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message, issues: [], summary: { totalWarnings: 0 } }));
            });
          return;
        }

        // 4. POST /api/rescan — Request tabs to rescan live DOM (supports targeted path / tabId)
        if (req.method === "POST" && url.pathname === "/api/rescan") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const data = body ? JSON.parse(body) : {};
              this.broadcast({
                type: "request_rescan",
                targetTabId: data.tabId,
                targetPath: data.path,
              });
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ status: "rescan_requested", connectedTabs: this.getActiveTabsCount() }));
            } catch {
              this.broadcast({ type: "request_rescan" });
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ status: "rescan_requested", connectedTabs: this.getActiveTabsCount() }));
            }
          });
          return;
        }

        // 5. GET /api/events — SSE event stream for browser / agents
        if (req.method === "GET" && url.pathname === "/api/events") {
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
          });
          if (typeof res.flushHeaders === "function") {
            res.flushHeaders();
          }

          const tabId = url.searchParams.get("tabId");
          const browser = url.searchParams.get("browser");
          if (tabId) {
            if (!this.sseClientsByTab.has(tabId)) {
              this.sseClientsByTab.set(tabId, new Set());
            }
            this.sseClientsByTab.get(tabId).add(res);

            const existing = this.activeTabs.get(tabId) || {};
            this.activeTabs.set(tabId, {
              ...existing,
              tabId,
              browser: browser || existing.browser || "Browser",
              lastSeen: Date.now(),
            });
          }

          res.write(`data: ${JSON.stringify({
            type: "connected",
            snapshot: {
              ...this.latestSnapshot,
              connectedTabs: this.getActiveTabsCount(),
            },
            tabs: this.getConnectedTabs(),
            projects: Array.from(this.projectSnapshots.values()),
          })}\n\n`);
          this.sseClients.add(res);

          req.on("close", () => {
            this.sseClients.delete(res);
            if (tabId && this.sseClientsByTab.has(tabId)) {
              this.sseClientsByTab.get(tabId).delete(res);
              if (this.sseClientsByTab.get(tabId).size === 0) {
                this.sseClientsByTab.delete(tabId);
              }
            }
          });
          return;
        }

        // 6. GET or HEAD / or /dashboard — Built-in Visual Live Inspection Dashboard
        if ((req.method === "GET" || req.method === "HEAD") && (url.pathname === "/" || url.pathname === "/dashboard")) {
          const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shavin DS — Agent Browser Bridge Monitor</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate icon" type="image/svg+xml" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <style>
    :root {
      --n-0: 255 255 255;
      --n-50: 250 250 250;
      --n-100: 244 244 245;
      --n-200: 228 228 231;
      --n-300: 212 212 216;
      --n-400: 161 161 170;
      --n-500: 113 113 122;
      --n-600: 82 82 91;
      --n-700: 63 63 70;
      --n-800: 39 39 42;
      --n-850: 30 30 33;
      --n-900: 24 24 27;
      --n-950: 10 10 12;
      --n-1000: 0 0 0;

      --font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
      --font-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, monospace;

      --radius-sm: 0.375rem;
      --radius-lg: 0.5rem;
      --radius-panel: 0.875rem;
      --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    }

    .light {
      --bg-canvas: rgb(var(--n-100));
      --bg-surface: rgb(var(--n-0));
      --bg-surface-hover: rgb(var(--n-100));
      --hairline: rgb(var(--n-200));
      --hairline-strong: rgb(var(--n-300));
      --fg: rgb(var(--n-950));
      --fg-muted: rgb(var(--n-600));
      --fg-subtle: rgb(var(--n-500));
      --accent: rgb(var(--n-900));
      --accent-fg: rgb(var(--n-0));
      --success: 5 150 105;
      --warning: 217 119 6;
      --danger: 192 57 43;
      --shadow-card: 0 1px 2px rgb(0 0 0 / 0.06), 0 1px 1px rgb(0 0 0 / 0.04);
    }

    .dark {
      --bg-canvas: rgb(var(--n-950));
      --bg-surface: rgb(var(--n-900));
      --bg-surface-hover: rgb(var(--n-850));
      --hairline: rgb(var(--n-800));
      --hairline-strong: rgb(var(--n-700));
      --fg: rgb(var(--n-50));
      --fg-muted: rgb(var(--n-300));
      --fg-subtle: rgb(var(--n-400));
      --accent: rgb(var(--n-50));
      --accent-fg: rgb(var(--n-950));
      --success: 52 211 153;
      --warning: 251 191 36;
      --danger: 232 90 79;
      --shadow-card: 0 1px 3px rgb(0 0 0 / 0.35);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-body);
      background: var(--bg-canvas);
      color: var(--fg);
      font-size: 13.5px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      transition: background 0.25s var(--ease-out), color 0.25s var(--ease-out);
    }

    .app-header {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--hairline);
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .header-inner {
      max-width: 1320px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .brand-logo {
      height: 24px;
      width: auto;
      color: var(--fg);
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }
    .brand-logo svg { height: 24px; width: auto; }

    .brand-divider {
      width: 1px;
      height: 18px;
      background: var(--hairline);
      flex-shrink: 0;
    }

    .brand-label {
      font-family: var(--font-body);
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: -0.01em;
      color: var(--fg-muted);
    }

    .port-tag {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      background: var(--bg-surface-hover);
      border: 1px solid var(--hairline);
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm);
      color: var(--fg-subtle);
    }

    .bridge-status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--fg-subtle);
      background: var(--bg-surface-hover);
      border: 1px solid var(--hairline);
      border-radius: 9999px;
      padding: 0.15rem 0.55rem;
      margin-left: 0.25rem;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 9999px;
      background: rgb(var(--success));
      box-shadow: 0 0 6px rgb(var(--success) / 0.6);
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      flex-shrink: 0;
    }

    @keyframes pulse-ring {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(0.85); }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .theme-toggle {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-lg);
      background: transparent;
      border: 1px solid var(--hairline);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--fg-muted);
      transition: all 0.15s var(--ease-out);
    }
    .theme-toggle:hover {
      color: var(--fg);
      border-color: var(--hairline-strong);
      background: var(--bg-surface-hover);
    }

    .btn-rescan-outline {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: transparent;
      color: var(--fg);
      border: 1px solid var(--hairline);
      border-radius: var(--radius-lg);
      padding: 0.38rem 0.85rem;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s var(--ease-out);
    }
    .btn-rescan-outline:hover {
      background: var(--bg-surface-hover);
      border-color: var(--hairline-strong);
    }

    .main-area {
      max-width: 1320px;
      margin: 0 auto;
      padding: 1.5rem 1.5rem 4rem;
    }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1.75rem;
      margin-bottom: 0.75rem;
    }

    .section-title {
      font-family: var(--font-display);
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--fg);
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .section-title-count {
      font-family: var(--font-body);
      font-weight: 400;
      font-size: 0.825rem;
      color: var(--fg-subtle);
      margin-left: 0.2rem;
    }

    /* ── 1. ACTIVE BROWSERS (SHAVIN TABS COMPONENT STYLE) ── */
    .shavin-tabs-container {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin-bottom: 1.5rem;
    }

    .shavin-tabs-list {
      display: inline-flex;
      align-items: center;
      background: var(--bg-surface-hover);
      border: 1px solid var(--hairline);
      border-radius: 9999px;
      padding: 0.25rem;
      gap: 0.25rem;
      max-width: 100%;
      overflow-x: auto;
    }

    .shavin-tab-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-family: var(--font-body);
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--fg-muted);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s var(--ease-out);
    }

    .shavin-tab-trigger:hover {
      color: var(--fg);
    }

    .shavin-tab-trigger.active {
      background: var(--bg-surface);
      color: var(--fg);
      font-weight: 600;
      border-color: var(--hairline-strong);
      box-shadow: var(--shadow-card);
    }

    /* ── 2. ACTIVE TABS (FILTER CARDS GRID) ── */
    .tabs-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .tab-filter-card {
      background: var(--bg-surface);
      border: 1px solid var(--hairline);
      border-radius: var(--radius-panel);
      padding: 0.85rem 1rem;
      cursor: pointer;
      transition: background 0.15s var(--ease-out), border-color 0.15s var(--ease-out), transform 0.15s var(--ease-out);
      box-shadow: var(--shadow-card);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 0.6rem;
      position: relative;
    }

    .light .tab-filter-card:hover {
      background: rgb(var(--n-100));
      border-color: var(--hairline-strong);
      transform: translateY(-1px);
    }
    .dark .tab-filter-card:hover {
      background: rgb(var(--n-850));
      border-color: var(--hairline-strong);
      transform: translateY(-1px);
    }

    .light .tab-filter-card.active {
      border-color: var(--fg-subtle);
      background: rgb(var(--n-50));
      box-shadow: 0 0 0 1px var(--fg-subtle), var(--shadow-card);
    }
    .dark .tab-filter-card.active {
      border-color: var(--fg-subtle);
      background: rgb(var(--n-800));
      box-shadow: 0 0 0 1px var(--fg-subtle), var(--shadow-card);
    }

    .tab-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .tab-card-badges {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .server-port-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 0.72rem;
      color: var(--fg);
      background: var(--bg-surface-hover);
      border: 1px solid var(--hairline);
      border-radius: var(--radius-sm);
      padding: 0.18rem 0.45rem;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .browser-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-family: var(--font-body);
      font-weight: 500;
      font-size: 0.72rem;
      color: var(--fg-muted);
      background: var(--bg-canvas);
      border: 1px solid var(--hairline);
      border-radius: 9999px;
      padding: 0.15rem 0.5rem;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .tab-card-body {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }

    .tab-card-title {
      font-family: var(--font-body);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--fg);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tab-card-url {
      font-family: var(--font-body);
      font-size: 0.72rem;
      color: var(--fg-subtle);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tab-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.5rem;
      border-top: 1px solid var(--hairline);
      gap: 0.5rem;
    }

    .tab-card-status {
      font-size: 0.72rem;
      color: var(--fg-subtle);
    }

    .tab-card-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-shrink: 0;
    }

    .btn-icon-action {
      background: var(--bg-canvas);
      border: 1px solid var(--hairline);
      color: var(--fg);
      width: 28px;
      height: 28px;
      border-radius: var(--radius-lg);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s var(--ease-out);
      flex-shrink: 0;
    }
    .btn-icon-action:hover {
      background: var(--fg);
      color: var(--bg-canvas);
      border-color: var(--fg);
    }

    .btn-icon-sm {
      background: transparent;
      border: 1px solid transparent;
      color: var(--fg-subtle);
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s var(--ease-out);
      flex-shrink: 0;
    }
    .btn-icon-sm:hover {
      color: var(--fg);
      background: var(--bg-surface-hover);
      border-color: var(--hairline);
    }

    /* ── SOFT PILLS ── */
    .pill {
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .pill-clean { background: rgb(var(--success) / 0.12); color: rgb(var(--success)); border: 1px solid rgb(var(--success) / 0.25); }
    .pill-warn  { background: rgb(var(--warning) / 0.12); color: rgb(var(--warning)); border: 1px solid rgb(var(--warning) / 0.25); }
    .pill-err   { background: rgb(var(--danger) / 0.12); color: rgb(var(--danger)); border: 1px solid rgb(var(--danger) / 0.25); }
    .pill-neutral { background: var(--bg-surface-hover); color: var(--fg-subtle); border: 1px solid var(--hairline); }

    .tag-category {
      font-family: var(--font-body);
      font-size: 0.68rem;
      font-weight: 600;
      background: var(--bg-surface-hover);
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--hairline);
      color: var(--fg-muted);
    }

    /* ── STREAM FEED ── */
    .feed-container {
      background: var(--bg-surface);
      border: 1px solid var(--hairline);
      border-radius: var(--radius-panel);
      padding: 0.5rem 0.875rem;
      max-height: 200px;
      overflow-y: auto;
      box-shadow: var(--shadow-card);
    }

    .feed-item {
      padding: 0.8rem 0.5rem;
      border-bottom: 1px solid var(--hairline);
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.8rem;
      color: var(--fg-muted);
    }
    .feed-item:last-child { border-bottom: none; }
    .feed-time {
      font-family: var(--font-body);
      font-weight: 500;
      color: var(--fg-subtle);
      font-size: 0.72rem;
      flex-shrink: 0;
    }

    /* ── VIOLATIONS TABLE ── */
    .table-container {
      background: var(--bg-surface);
      border: 1px solid var(--hairline);
      border-radius: var(--radius-panel);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      background: var(--bg-surface-hover);
      color: var(--fg-subtle);
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 0.75rem 1.15rem;
      border-bottom: 1px solid var(--hairline);
    }

    td {
      padding: 0.85rem 1.15rem;
      border-bottom: 1px solid var(--hairline);
      font-size: 0.8125rem;
      vertical-align: middle;
    }

    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--bg-surface-hover); }

    .selector-code {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--fg);
    }

    .detail-text {
      color: var(--fg-muted);
      line-height: 1.4;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="app-header">
    <div class="header-inner">
      <div class="brand">
        <div class="brand-logo">
          <svg width="83" height="32" viewBox="0 0 83 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M72.0809 7.36H75.3929L77.9609 17.416H78.0089V7.36H80.3609V24.16H77.6489L74.4809 11.896H74.4329V24.16H72.0809V7.36Z" fill="currentColor"/>
            <path d="M66.2637 7.36H68.9037V24.16H66.2637V7.36Z" fill="currentColor"/>
            <path d="M55.2036 7.36H57.8676L59.5956 20.392H59.6436L61.3716 7.36H63.7956L61.2516 24.16H57.7476L55.2036 7.36Z" fill="currentColor"/>
            <path d="M47.7865 7.36H51.3625L54.0985 24.16H51.4585L50.9785 20.824V20.872H47.9785L47.4985 24.16H45.0505L47.7865 7.36ZM50.6665 18.592L49.4905 10.288H49.4425L48.2905 18.592H50.6665Z" fill="currentColor"/>
            <path d="M34.4684 7.36H37.1084V14.2H39.9404V7.36H42.5804V24.16H39.9404V16.6H37.1084V24.16H34.4684V7.36Z" fill="currentColor"/>
            <path d="M27.7707 24.4C26.4907 24.4 25.5227 24.04 24.8667 23.32C24.2107 22.584 23.8827 21.536 23.8827 20.176V19.216H26.3787V20.368C26.3787 21.456 26.8347 22 27.7467 22C28.1947 22 28.5307 21.872 28.7547 21.616C28.9947 21.344 29.1147 20.912 29.1147 20.32C29.1147 19.616 28.9547 19 28.6347 18.472C28.3147 17.928 27.7227 17.28 26.8587 16.528C25.7707 15.568 25.0107 14.704 24.5787 13.936C24.1467 13.152 23.9307 12.272 23.9307 11.296C23.9307 9.968 24.2667 8.944 24.9387 8.224C25.6107 7.488 26.5867 7.12 27.8667 7.12C29.1307 7.12 30.0827 7.488 30.7227 8.224C31.3787 8.944 31.7067 9.984 31.7067 11.344V12.04H29.2107V11.176C29.2107 10.6 29.0987 10.184 28.8747 9.928C28.6507 9.656 28.3227 9.52 27.8907 9.52C27.0107 9.52 26.5707 10.056 26.5707 11.128C26.5707 11.736 26.7307 12.304 27.0507 12.832C27.3867 13.36 27.9867 14 28.8507 14.752C29.9547 15.712 30.7147 16.584 31.1307 17.368C31.5467 18.152 31.7547 19.072 31.7547 20.128C31.7547 21.504 31.4107 22.56 30.7227 23.296C30.0507 24.032 29.0667 24.4 27.7707 24.4Z" fill="currentColor"/>
            <path d="M10.704 25.6C8.096 25.6 6.16 24.856 4.896 23.368C3.632 21.864 3 19.808 3 17.2C3 15.168 3.328 13.336 3.984 11.704C4.656 10.072 5.656 8.784 6.984 7.84C8.328 6.88 9.952 6.4 11.856 6.4C14.224 6.4 15.928 7.04 16.968 8.32C18.008 9.6 18.528 11.312 18.528 13.456C18.528 15.248 18.28 16.704 17.784 17.824C17.288 18.944 16.68 19.752 15.96 20.248C15.256 20.728 14.552 20.968 13.848 20.968C12.552 20.968 11.856 20.44 11.76 19.384H11.712C11.472 19.88 11.168 20.248 10.8 20.488C10.432 20.712 9.984 20.824 9.456 20.824C8.736 20.824 8.176 20.576 7.776 20.08C7.392 19.568 7.2 18.856 7.2 17.944C7.2 17.752 7.216 17.48 7.248 17.128L7.512 14.704C7.784 12.336 8.744 11.152 10.392 11.152C11.384 11.152 12.04 11.64 12.36 12.616H12.408L12.624 11.248H14.856L14.16 17.944L14.136 18.328C14.136 18.632 14.296 18.784 14.616 18.784C15.24 18.784 15.712 18.24 16.032 17.152C16.368 16.048 16.536 14.832 16.536 13.504C16.536 11.936 16.144 10.704 15.36 9.808C14.576 8.896 13.376 8.44 11.76 8.44C9.648 8.44 8.032 9.224 6.912 10.792C5.808 12.36 5.256 14.536 5.256 17.32C5.256 19.304 5.72 20.848 6.648 21.952C7.592 23.04 8.992 23.584 10.848 23.584C11.808 23.584 12.672 23.464 13.44 23.224C14.224 22.984 15.016 22.56 15.816 21.952L15.624 24.256C14.872 24.752 14.104 25.096 13.32 25.288C12.536 25.496 11.664 25.6 10.704 25.6ZM10.608 18.592C11.392 18.592 11.84 18.088 11.952 17.08L12.192 14.8L12.216 14.512C12.216 14.16 12.12 13.896 11.928 13.72C11.736 13.544 11.48 13.456 11.16 13.456C10.76 13.456 10.448 13.576 10.224 13.816C10 14.04 9.856 14.424 9.792 14.968L9.576 17.008L9.552 17.368C9.552 17.784 9.64 18.096 9.816 18.304C10.008 18.496 10.272 18.592 10.608 18.592Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="brand-divider"></div>
        <span class="brand-label">Bridge Monitor</span>
        <span class="port-tag">:${this.port}</span>
        <div class="bridge-status-indicator">
          <span class="pulse-dot"></span>
          <span>Connected</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()" aria-label="Toggle theme" title="Toggle dark/light theme">
          <i data-lucide="moon" id="iconMoon" style="width: 15px; height: 15px;"></i>
          <i data-lucide="sun" id="iconSun" style="width: 15px; height: 15px; display: none;"></i>
        </button>
        <button class="btn-rescan-outline" onclick="triggerRescan()"><i data-lucide="refresh-cw" style="width: 13px; height: 13px;"></i> Live Rescan</button>
      </div>
    </div>
  </div>

  <main class="main-area">
    <!-- 1. ACTIVE BROWSERS (SHAVIN TABS COMPONENT STYLE) -->
    <div class="section-head">
      <div class="section-title">
        <span>Active Browsers</span>
        <span class="section-title-count" id="browser-count-title">(0)</span>
      </div>
    </div>
    <div class="shavin-tabs-container">
      <div class="shavin-tabs-list" id="browser-tabs-list" role="tablist">
        <button class="shavin-tab-trigger active" onclick="selectBrowser('all')">
          <i data-lucide="layers" style="width: 14px; height: 14px;"></i>
          <span>All Browsers</span>
        </button>
      </div>
    </div>

    <!-- 2. ACTIVE TABS (FILTER CARDS) -->
    <div class="section-head">
      <div class="section-title">
        <span>Active Tabs</span>
        <span class="section-title-count" id="tab-count-title">(0)</span>
      </div>
    </div>
    <div class="tabs-card-grid" id="tabs-card-grid-container">
      <div style="color: var(--fg-subtle); padding: 1.5rem; text-align: center; border: 1px dashed var(--hairline); border-radius: var(--radius-panel); grid-column: 1 / -1;">
        Connecting to browser sessions... Open any dev server (e.g. <code>localhost:3100</code>)
      </div>
    </div>

    <!-- 3. REAL-TIME EVENT STREAM -->
    <div class="section-head">
      <div class="section-title">
        <span>Real-Time Event Stream (SSE)</span>
        <span class="section-title-count" id="event-stream-label"></span>
      </div>
      <span class="section-title-count" id="last-snapshot-time" style="font-size: 0.72rem;">Connected</span>
    </div>
    <div class="feed-container" id="event-feed">
      <div class="feed-item"><span class="feed-time">[Ready]</span> Connecting to SSE stream at /api/events...</div>
    </div>

    <!-- 4. DETECTED VIOLATIONS TABLE -->
    <div class="section-head">
      <div class="section-title">
        <span>Detected Violations</span>
        <span class="section-title-count" id="active-project-label"></span>
      </div>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 160px;">Category</th>
            <th style="width: 260px;">Component Selector</th>
            <th>Detail</th>
            <th style="width: 100px;">Severity</th>
          </tr>
        </thead>
        <tbody id="issue-tbody">
          <tr><td colspan="4" style="text-align: center; color: var(--fg-subtle); padding: 2.5rem 1rem;">No violations detected. Connected app pages are 100% compliant with @shavin/ui!</td></tr>
        </tbody>
      </table>
    </div>
  </main>

  <script>
    if (window.lucide) lucide.createIcons();

    let allTabs = [];
    let selectedBrowser = 'all';
    let selectedTabId = null;
    let eventsHistory = [];
    const feed = document.getElementById('event-feed');

    function getBrowserFaviconHtml(name) {
      const b = (name || '').toLowerCase();
      let domain = 'google.com/chrome';
      if (b.includes('brave')) domain = 'brave.com';
      else if (b.includes('arc')) domain = 'arc.net';
      else if (b.includes('safari')) domain = 'apple.com/safari';
      else if (b.includes('edge')) domain = 'microsoft.com/edge';
      else if (b.includes('firefox')) domain = 'mozilla.org/firefox';
      else if (b.includes('chrome')) domain = 'google.com/chrome';

      return \`<img src="https://www.google.com/s2/favicons?domain=\${domain}&sz=32" alt="\${name}" width="14" height="14" style="border-radius: 3px; display: inline-block; vertical-align: middle; flex-shrink: 0;" onerror="this.style.display='none'" />\`;
    }

    function updateThemeIcons(isDark) {
      const moon = document.getElementById('iconMoon');
      const sun = document.getElementById('iconSun');
      if (moon && sun) {
        moon.style.display = isDark ? 'inline-block' : 'none';
        sun.style.display = isDark ? 'none' : 'inline-block';
      }
    }

    function toggleTheme() {
      const html = document.documentElement;
      const isDark = html.classList.toggle('dark');
      html.classList.toggle('light', !isDark);
      updateThemeIcons(isDark);
      try { localStorage.setItem('shavin-theme', isDark ? 'dark' : 'light'); } catch(e){}
    }

    try {
      const saved = localStorage.getItem('shavin-theme');
      if (saved === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        updateThemeIcons(false);
      } else {
        updateThemeIcons(true);
      }
    } catch(e){}

    function logEvent(msg, tabId = null, browser = null, route = null, isGlobal = false) {
      const time = new Date().toLocaleTimeString();
      const item = {
        time,
        msg,
        tabId,
        browser,
        route,
        isGlobal: isGlobal || !tabId,
      };
      eventsHistory.unshift(item);
      if (eventsHistory.length > 100) eventsHistory.pop();
      renderEventFeed();
    }

    function renderEventFeed() {
      if (!feed) return;
      const curTab = allTabs.find(t => t.tabId === selectedTabId);
      const relevant = eventsHistory.filter(ev => ev.isGlobal || ev.tabId === selectedTabId);

      if (relevant.length === 0) {
        feed.innerHTML = \`
          <div class="feed-item">
            <span class="feed-time">[Ready]</span>
            <span>Listening for live DOM audits for \${curTab ? '[' + (curTab.browser || 'Browser') + '] ' + (curTab.pathname || curTab.url) : 'active tab'}...</span>
          </div>
        \`;
        return;
      }

      feed.innerHTML = relevant.slice(0, 40).map(ev => {
        const prefix = ev.browser ? ('[' + ev.browser + '] ') : '';
        return \`
          <div class="feed-item">
            <span class="feed-time">[\${ev.time}]</span>
            <span>\${prefix}\${ev.msg}</span>
          </div>
        \`;
      }).join('');
    }

    function getFilteredTabs() {
      return allTabs.filter(t => {
        const matchBrowser = selectedBrowser === 'all' || (t.browser || '').toLowerCase() === selectedBrowser.toLowerCase();
        return matchBrowser;
      });
    }

    function renderBrowserTabs(tabs) {
      if (!tabs) tabs = [];
      const browserSet = new Set();
      for (const t of tabs) {
        if (t.browser) browserSet.add(t.browser);
      }
      const browsers = Array.from(browserSet);

      const titleCount = document.getElementById('browser-count-title');
      if (titleCount) titleCount.textContent = '(' + browsers.length + ')';

      const tabsList = document.getElementById('browser-tabs-list');
      if (!tabsList) return;

      let html = \`
        <button class="shavin-tab-trigger \${selectedBrowser === 'all' ? 'active' : ''}" onclick="selectBrowser('all')">
          <i data-lucide="layers" style="width: 14px; height: 14px;"></i>
          <span>All Browsers</span>
        </button>
      \`;

      for (const b of browsers) {
        const isSel = selectedBrowser.toLowerCase() === b.toLowerCase();
        html += \`
          <button class="shavin-tab-trigger \${isSel ? 'active' : ''}" onclick="selectBrowser('\${b}')">
            \${getBrowserFaviconHtml(b)}
            <span>\${b}</span>
          </button>
        \`;
      }
      tabsList.innerHTML = html;
      if (window.lucide) lucide.createIcons();
    }

    function selectBrowser(browser) {
      selectedBrowser = browser;
      renderBrowserTabs(allTabs);
      const filtered = getFilteredTabs();
      if (!filtered.some(t => t.tabId === selectedTabId)) {
        selectedTabId = filtered[0] ? filtered[0].tabId : null;
      }
      renderActiveTabCards(allTabs);
      updateViewLabel();
      renderEventFeed();
      updateUI();
    }

    function selectTabCard(tabId) {
      selectedTabId = tabId;
      renderActiveTabCards(allTabs);
      const target = allTabs.find(t => t.tabId === tabId);
      if (target) {
        logEvent('Switched live stream monitor to [' + (target.browser || 'Browser') + '] ' + (target.pathname || target.url), tabId, target.browser, target.pathname, false);
      }
      updateViewLabel();
      renderEventFeed();
      updateUI();
    }

    function updateViewLabel() {
      const labelEl = document.getElementById('active-project-label');
      const streamLabelEl = document.getElementById('event-stream-label');
      const target = allTabs.find(t => t.tabId === selectedTabId);

      if (target) {
        const portMatch = (target.origin || target.url || '').match(/:(\d+)/);
        const portLabel = portMatch ? (':' + portMatch[1]) : '';
        const desc = '([' + (target.browser || 'Browser') + '] ' + portLabel + ' ' + (target.pathname || target.url) + ')';
        if (labelEl) labelEl.textContent = desc;
        if (streamLabelEl) streamLabelEl.textContent = desc;
      } else {
        if (labelEl) labelEl.textContent = '';
        if (streamLabelEl) streamLabelEl.textContent = '';
      }
    }

    function renderActiveTabCards(tabs) {
      if (!tabs) tabs = [];
      const container = document.getElementById('tabs-card-grid-container');
      if (!container) return;

      const filteredTabs = getFilteredTabs();

      const tabCountEl = document.getElementById('tab-count-title');
      if (tabCountEl) tabCountEl.textContent = '(' + filteredTabs.length + ')';

      if (filteredTabs.length === 0) {
        container.innerHTML = \`
          <div style="color: var(--fg-subtle); padding: 1.5rem; text-align: center; border: 1px dashed var(--hairline); border-radius: var(--radius-panel); grid-column: 1 / -1;">
            No active tabs match the selected browser filter.
          </div>
        \`;
        selectedTabId = null;
        updateViewLabel();
        renderEventFeed();
        updateUI();
        return;
      }

      // Ensure a valid selectedTabId (default to first tab)
      if (!selectedTabId || !filteredTabs.some(t => t.tabId === selectedTabId)) {
        selectedTabId = filteredTabs[0].tabId;
      }

      const html = filteredTabs.map(t => {
        const isSel = selectedTabId === t.tabId;
        const browserName = t.browser || 'Browser';
        const displayTitle = t.title || t.pathname || t.url || 'Active Page';
        const routePath = t.pathname || (t.url ? (new URL(t.url)).pathname : '/');
        const portMatch = (t.origin || t.url || '').match(/:(\d+)/);
        const portLabel = portMatch ? (':' + portMatch[1]) : '';
        const fullUrl = t.url || (t.origin ? (t.origin + routePath) : routePath);
        const rawUrl = fullUrl;
        let cleanDisplayUrl = rawUrl.replace("http://", "").replace("https://", "");
        if (routePath && routePath !== '/') {
          cleanDisplayUrl = routePath;
        } else {
          // root page: show host:port e.g. localhost:3100
          try {
            const u = new URL(rawUrl.startsWith('http') ? rawUrl : ('http://' + rawUrl));
            cleanDisplayUrl = u.host || rawUrl;
          } catch {
            cleanDisplayUrl = rawUrl.replace("http://", "").replace("https://", "");
          }
        }
        const errCount = t.stats?.errors || 0;
        const warnCount = t.stats?.warnings || 0;
        const totalCount = t.stats?.total || 0;

        let statusHtml;
        if (totalCount === 0) {
          statusHtml = \`<span style="display:inline-flex; align-items:center; gap:0.35rem; color:rgb(var(--success)); font-weight:600; font-size:0.75rem;">
            <span style="width:6px; height:6px; border-radius:9999px; background:rgb(var(--success)); display:inline-block;"></span>
            0 Violations (Clean)
          </span>\`;
        } else {
          const parts = [];
          if (errCount > 0) {
            parts.push(\`<span style="display:inline-flex; align-items:center; gap:0.25rem; color:rgb(var(--danger)); font-weight:600; font-size:0.75rem;">
              <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><circle cx="8" cy="8" r="7"/><path d="M8 5v3.5M8 10.5v.5" stroke="var(--bg-surface)" stroke-width="1.5" stroke-linecap="round"/></svg>
              \${errCount} error\${errCount !== 1 ? 's' : ''}
            </span>\`);
          }
          if (warnCount > 0) {
            parts.push(\`<span style="display:inline-flex; align-items:center; gap:0.25rem; color:rgb(var(--warning)); font-weight:600; font-size:0.75rem;">
              <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><path d="M8 1L15 14H1L8 1Z"/><path d="M8 6v3.5M8 11v.5" stroke="var(--bg-surface)" stroke-width="1.5" stroke-linecap="round"/></svg>
              \${warnCount} warning\${warnCount !== 1 ? 's' : ''}
            </span>\`);
          }
          statusHtml = \`<div style="display:inline-flex; align-items:center; gap:0.5rem;">\${parts.join('')}</div>\`;
        }

        return \`
          <div class="tab-filter-card \${isSel ? 'active' : ''}" onclick="selectTabCard('\${t.tabId}')">
            <div class="tab-card-header">
              <span class="browser-chip">
                \${getBrowserFaviconHtml(browserName)}
                <span>\${browserName}</span>
              </span>
              <span class="server-port-badge">\${portLabel}</span>
            </div>
            <div class="tab-card-body">
              <div class="tab-card-title" title="\${displayTitle}">\${displayTitle}</div>
              <div class="tab-card-url" title="\${fullUrl}">\${cleanDisplayUrl}</div>
            </div>
            <div class="tab-card-footer">
              <div class="tab-card-status">\${statusHtml}</div>
              <div class="tab-card-actions">
                <button class="btn-icon-sm" title="Trigger rescan for this tab" onclick="rescanTab('\${t.tabId}', '\${routePath}', event)">
                  <i data-lucide="refresh-cw" style="width: 13px; height: 13px;"></i>
                </button>
                <button class="btn-icon-action" title="Jump to Tab" onclick="focusTab('\${t.tabId}', '\${browserName}', '\${fullUrl}', '\${routePath}', event)">
                  <i data-lucide="external-link" style="width: 13px; height: 13px;"></i>
                </button>
              </div>
            </div>
          </div>
        \`;
      }).join('');

      container.innerHTML = html;
      if (window.lucide) lucide.createIcons();
    }

    function focusTab(tabId, browser, url, pathname, e) {
      if (e) e.stopPropagation();
      logEvent('Activating OS window for [' + browser + '] (' + (pathname || url || tabId) + ')...', tabId, browser, pathname, false);
      fetch('/api/focus-tab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabId, browser, url, pathname })
      })
      .then(r => r.json())
      .then(data => {
        logEvent('✓ Focused [' + browser + '] window and tab.', tabId, browser, pathname, false);
      })
      .catch(err => {
        logEvent('Failed to focus tab: ' + err.message, tabId, browser, pathname, false);
      });
    }

    function rescanTab(tabId, path, e) {
      if (e) e.stopPropagation();
      logEvent('Triggering targeted live rescan for tab ' + tabId + ' (' + path + ')...', tabId, null, path, false);
      fetch('/api/rescan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabId, path })
      })
      .then(r => r.json())
      .then(() => logEvent('✓ Targeted rescan signal sent.', tabId, null, path, false))
      .catch(() => logEvent('Failed to send rescan.', tabId, null, path, false));
    }

    function updateUI() {
      document.getElementById('last-snapshot-time').textContent = 'Last snapshot: ' + new Date().toLocaleTimeString();

      const curTab = allTabs.find(t => t.tabId === selectedTabId);
      const tbody = document.getElementById('issue-tbody');

      if (!curTab) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--fg-subtle); padding: 2.5rem 1rem;">No active tab selected.</td></tr>';
        return;
      }

      const issues = (curTab.issues || []).map(i => ({ ...i, browser: curTab.browser, route: curTab.pathname }));

      if (issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--fg-subtle); padding: 2.5rem 1rem;">No violations detected on this tab. 100% compliant with @shavin/ui!</td></tr>';
      } else {
        tbody.innerHTML = issues.map(iss => \`
          <tr>
            <td><span class="tag-category">\${iss.category}</span></td>
            <td><span class="selector-code">\${iss.browser ? '<span style="color:var(--fg-subtle); font-weight: 400;">[' + iss.browser + ' ' + (iss.route || '') + ']</span> ' : ''}\${iss.selector}</span></td>
            <td><div class="detail-text">\${iss.detail}</div></td>
            <td><span class="pill \${iss.severity === 'error' ? 'pill-err' : 'pill-warn'}">\${iss.severity}</span></td>
          </tr>
        \`).join('');
      }
    }

    async function loadAuditState() {
      try {
        const res = await fetch('/api/audit');
        if (!res.ok) return;
        const data = await res.json();
        if (data && Array.isArray(data.tabs)) {
          allTabs = data.tabs;
          renderBrowserTabs(allTabs);
          renderActiveTabCards(allTabs);
          updateViewLabel();
          renderEventFeed();
          updateUI();
        }
      } catch (err) {}
    }

    loadAuditState();
    setInterval(loadAuditState, 3500);

    const es = new EventSource('/api/events');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'connected') {
          logEvent('SSE stream established with local bridge daemon.', null, null, null, true);
          if (data.tabs) {
            allTabs = data.tabs;
            renderBrowserTabs(allTabs);
            renderActiveTabCards(allTabs);
          }
          updateViewLabel();
          renderEventFeed();
          updateUI();
        } else if (data.type === 'audit_update') {
          const tabId = data.tabId || data.snapshot?.tabId;
          const bName = data.snapshot?.browser || 'Browser';
          const rPath = data.snapshot?.pathname || data.snapshot?.url || '/';
          const totalIss = data.snapshot?.stats?.total || 0;
          const errs = data.snapshot?.stats?.errors || 0;
          const warns = data.snapshot?.stats?.warnings || 0;
          const statusText = totalIss === 0 ? '0 issues (Clean)' : (errs + ' errors • ' + warns + ' warnings');

          logEvent('DOM audit updated: ' + statusText, tabId, bName, rPath, false);

          if (data.tabs) {
            allTabs = data.tabs;
            renderBrowserTabs(allTabs);
            renderActiveTabCards(allTabs);
          }
          updateViewLabel();
          renderEventFeed();
          updateUI();
        } else if (data.type === 'request_rescan') {
          logEvent('⚡ Agent / MCP requested live DOM rescan across tabs.', null, null, null, true);
        } else if (data.type === 'focus_tab') {
          logEvent('🔍 Tab focus requested for ' + (data.targetTabId || ''), data.targetTabId, null, null, true);
        }
      } catch (err) {}
    };

    function triggerRescan(e) {
      if (e) e.stopPropagation();
      fetch('/api/rescan', { method: 'POST' })
        .then(r => r.json())
        .then(() => logEvent('⚡ Broadcasted live rescan request to all active browser tabs.', null, null, null, true))
        .catch(() => logEvent('Failed to trigger rescan.', null, null, null, true));
    }
  </script>
</body>
</html>`;
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(html);
          return;
        }

        // 404
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not Found" }));
      });

      this.server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          // Port in use — bridge may already be running or running on another worker
          this.isRunning = true;
          resolve(this.port);
        } else {
          resolve(null);
        }
      });

      // Reject on bind failure (e.g. EADDRINUSE when a bridge is already up) so
      // callers like the dev-server integrations can treat it as "already running".
      this.server.once("error", (err) => {
        this.isRunning = false;
        reject(err);
      });

      this.server.listen(this.port, BRIDGE_HOST, () => {
        this.isRunning = true;
        resolve(this.port);
      });
    });
  }

  updateSnapshot(data) {
    const origin = data.origin || data.url || "http://localhost:3100";
    const project = data.project || (origin.includes(":3100") ? "Docs" : origin.includes(":3300") ? "Website" : origin.includes(":3200") ? "Studio" : "App");
    const tabId = data.tabId || (origin + ":" + (data.pathname || "/"));
    const browser = data.browser || "Browser";

    const tabSnap = {
      ...data,
      tabId,
      origin,
      project,
      browser,
      timestamp: new Date().toISOString(),
      connectedTabs: this.getActiveTabsCount() + 1,
    };

    // Track active tab with timestamp, browser, and pathname
    this.activeTabs.set(tabId, {
      tabId,
      origin,
      project,
      url: data.url,
      pathname: data.pathname || "/",
      browser,
      title: data.title || "",
      lastSeen: Date.now(),
    });

    // Store in per-tab isolated registry
    this.tabSnapshots.set(tabId, tabSnap);

    // Also store by origin for project-level views
    this.projectSnapshots.set(origin, tabSnap);

    this.latestSnapshot = {
      ...tabSnap,
      connectedTabs: this.getActiveTabsCount(),
    };

    this.emit("audit_update", tabSnap);

    // Broadcast update to all SSE clients with full multi-tab and multi-project registry
    const payload = `data: ${JSON.stringify({
      type: "audit_update",
      snapshot: tabSnap,
      tabId,
      tabs: this.getConnectedTabs(),
      projects: Array.from(this.projectSnapshots.values()),
    })}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }

  broadcast(message) {
    const payload = `data: ${JSON.stringify(message)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch {
        this.sseClients.delete(client);
      }
    }
    this.emit("broadcast", message);
  }

  getSnapshot(filter = {}) {
    this.cleanStaleTabs();
    const { path, tabId, url, origin } = filter;

    // 1. Direct tabId lookup
    if (tabId && this.tabSnapshots.has(tabId)) {
      return this.tabSnapshots.get(tabId);
    }

    // 2. Path match (e.g. /foundations/colors)
    if (path) {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      for (const snap of this.tabSnapshots.values()) {
        const snapPath = snap.pathname || "";
        if (snapPath === cleanPath || snapPath.replace(/\/$/, "") === cleanPath.replace(/\/$/, "")) {
          return snap;
        }
      }
    }

    // 3. Exact URL match
    if (url) {
      for (const snap of this.tabSnapshots.values()) {
        if (snap.url === url || snap.url?.replace(/\/$/, "") === url.replace(/\/$/, "")) {
          return snap;
        }
      }
    }

    // 4. Origin match
    if (origin && this.projectSnapshots.has(origin)) {
      return this.projectSnapshots.get(origin);
    }

    return this.latestSnapshot;
  }

  getAllTabs() {
    this.cleanStaleTabs();
    return Array.from(this.tabSnapshots.values());
  }

  async triggerRescan(options = {}) {
    const timeoutMs = typeof options === "number" ? options : (options.timeoutMs || 1500);
    const targetPath = typeof options === "object" ? options.path : undefined;
    const targetTabId = typeof options === "object" ? options.tabId : undefined;

    this.broadcast({
      type: "request_rescan",
      targetPath,
      targetTabId,
    });

    // Wait briefly for tabs to respond with fresh snapshot
    return new Promise((resolve) => {
      const onUpdate = (snap) => {
        if (targetTabId && snap.tabId !== targetTabId) return;
        if (targetPath) {
          const snapPath = (snap.pathname || "").replace(/\/$/, "");
          const cleanTarget = targetPath.replace(/\/$/, "");
          if (snapPath !== cleanTarget) return;
        }
        clearTimeout(timer);
        this.off("audit_update", onUpdate);
        resolve(snap);
      };
      const timer = setTimeout(() => {
        this.off("audit_update", onUpdate);
        resolve(this.getSnapshot({ path: targetPath, tabId: targetTabId }));
      }, timeoutMs);
      this.on("audit_update", onUpdate);
    });
  }

  async waitForClean(options = {}) {
    const timeoutMs = typeof options === "number" ? options : (options.timeoutMs || 6000);
    const targetPath = typeof options === "object" ? options.path : undefined;
    const targetTabId = typeof options === "object" ? options.tabId : undefined;

    const currentSnap = this.getSnapshot({ path: targetPath, tabId: targetTabId });
    if (currentSnap?.stats?.clean && currentSnap?.stats?.total === 0) {
      return { success: true, snapshot: currentSnap, elapsedMs: 0 };
    }

    const start = Date.now();
    return new Promise((resolve) => {
      const onUpdate = (snap) => {
        if (targetTabId && snap.tabId !== targetTabId) return;
        if (targetPath) {
          const snapPath = (snap.pathname || "").replace(/\/$/, "");
          const cleanTarget = targetPath.replace(/\/$/, "");
          if (snapPath !== cleanTarget) return;
        }
        if (snap.stats?.clean || snap.stats?.total === 0) {
          clearTimeout(timer);
          this.off("audit_update", onUpdate);
          resolve({ success: true, snapshot: snap, elapsedMs: Date.now() - start });
        }
      };

      const timer = setTimeout(() => {
        this.off("audit_update", onUpdate);
        const latest = this.getSnapshot({ path: targetPath, tabId: targetTabId });
        resolve({
          success: latest?.stats?.total === 0,
          snapshot: latest,
          elapsedMs: Date.now() - start,
          timedOut: true,
        });
      }, timeoutMs);

      this.on("audit_update", onUpdate);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.isRunning = false;
    }
  }
}

// Global Singleton Bridge Instance
export const globalBridge = new ShavinBridgeServer();

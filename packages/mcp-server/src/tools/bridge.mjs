/**
 * Tools for Live Browser Agent Bridge:
 * - get_live_audit
 * - trigger_live_rescan
 * - wait_for_live_clean
 */

export function registerBridgeTools(server, bridge) {
  return [
    // 1. get_live_audit
    {
      schema: {
        name: "get_live_audit",
        description: "Query real-time live DOM design system audit issues directly from active browser tabs via the Shavin Browser Bridge. Supports path or tabId targeting to prevent crosstalk when multiple tabs are open.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Target specific route/pathname (e.g. '/foundations/colors' or '/components/button') to audit that exact tab without interference from other open tabs.",
            },
            tabId: {
              type: "string",
              description: "Target a specific tab session ID directly.",
            },
            filter: {
              type: "string",
              enum: ["all", "errors", "warnings"],
              description: "Filter issues by severity (default: 'all').",
            },
            format: {
              type: "string",
              enum: ["dense", "table", "json"],
              description: "Output format: 'dense' (token-compressed markdown list), 'table' (markdown matrix), or 'json' (raw AST/DOM node data). Default: 'dense'.",
            },
          },
        },
      },
      handler: async (args) => {
        const { path, tabId, filter = "all", format = "dense" } = args ?? {};
        const allTabs = bridge.getAllTabs ? bridge.getAllTabs() : [];
        const snapshot = bridge.getSnapshot({ path, tabId });

        let issues = snapshot.issues || [];
        if (filter === "errors") {
          issues = issues.filter((i) => i.severity === "error");
        } else if (filter === "warnings") {
          issues = issues.filter((i) => i.severity === "warning");
        }

        if (format === "json") {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                url: snapshot.url,
                pathname: snapshot.pathname,
                browser: snapshot.browser,
                tabId: snapshot.tabId,
                timestamp: snapshot.timestamp,
                connectedTabs: allTabs.length || snapshot.connectedTabs || 1,
                tabs: allTabs.map((t) => ({
                  tabId: t.tabId,
                  url: t.url,
                  pathname: t.pathname,
                  browser: t.browser,
                  errors: t.stats?.errors || 0,
                  warnings: t.stats?.warnings || 0,
                })),
                stats: snapshot.stats,
                theme: snapshot.theme,
                issues,
              }, null, 2),
            }],
          };
        }

        // Header showing tab info and sibling tabs if any
        let tabsOverview = "";
        if (!path && !tabId && allTabs.length > 1) {
          const tabList = allTabs.map((t) => {
            const isCurrent = t.tabId === snapshot.tabId;
            const marker = isCurrent ? "★ [Active]" : "•";
            return `  ${marker} [${t.browser || "Browser"}] ${t.pathname || t.url} — ${t.stats?.errors || 0} err, ${t.stats?.warnings || 0} warn (tabId: \`${t.tabId}\`)`;
          }).join("\n");
          tabsOverview = `\nActive connected tabs (${allTabs.length}):\n${tabList}\n(Tip: pass \`path: "${allTabs[0].pathname}"\` to inspect a specific tab)\n\n`;
        }

        const tabDescriptor = `[${snapshot.browser || "Browser"} | ${snapshot.pathname || snapshot.url || "no-url"}]`;

        if (issues.length === 0) {
          return {
            content: [{
              type: "text",
              text: `${tabsOverview}[Live Bridge] ${tabDescriptor} URL: ${snapshot.url} | Status: 100% CLEAN (0 violations detected).`,
            }],
          };
        }

        if (format === "table") {
          const rows = issues.map((iss, idx) => {
            return `| ${idx + 1} | \`${iss.selector}\` | ${iss.category} | ${iss.severity === "error" ? "ERR" : "WARN"} | ${iss.detail} |`;
          }).join("\n");

          return {
            content: [{
              type: "text",
              text: [
                `${tabsOverview}### Shavin Live Browser Audit (${issues.length} issues) — ${tabDescriptor} ${snapshot.url}`,
                `| # | Component / Context | Category | Sev | Issue Detail |`,
                `|---|---|---|---|---|`,
                rows,
                ``,
                `**Theme**: ${snapshot.theme?.dark ? "Dark" : "Light"} (${snapshot.theme?.accent || "Default"})`,
              ].join("\n"),
            }],
          };
        }

        // Dense format (token-optimized for AI agent workflows)
        const issueLines = issues.map((iss, idx) => {
          const classPreview = iss.classes ? ` (class: \`${iss.classes.slice(0, 60)}\`)` : "";
          return `${idx + 1}. [${iss.severity.toUpperCase()}] \`${iss.selector}\`: ${iss.category} — ${iss.detail}${classPreview}`;
        }).join("\n");

        return {
          content: [{
            type: "text",
            text: [
              `${tabsOverview}[Live Bridge: ${tabDescriptor} ${snapshot.url}] ${issues.length} violation${issues.length > 1 ? "s" : ""} detected:`,
              issueLines,
              ``,
              `Rule: Refactor offending tokens to @shavin/ui semantic tokens (bg-surface, text-fg, border-hairline, shadow-card, rounded-[var(--radius-panel)]).`,
            ].join("\n"),
          }],
        };
      },
    },

    // 2. trigger_live_rescan
    {
      schema: {
        name: "trigger_live_rescan",
        description: "Signals connected browser tabs to perform an immediate live DOM scan and broadcast fresh design system compliance results. Optionally target by path or tabId.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Target specific route/pathname to rescan only that tab (e.g. '/foundations/colors').",
            },
            tabId: {
              type: "string",
              description: "Target specific tabId.",
            },
            timeoutMs: {
              type: "number",
              description: "Max time to wait for browser response (default: 1500ms).",
            },
          },
        },
      },
      handler: async (args) => {
        const { path, tabId, timeoutMs = 1500 } = args ?? {};
        const updated = await bridge.triggerRescan({ path, tabId, timeoutMs });

        return {
          content: [{
            type: "text",
            text: `[Live Bridge] Rescan completed for [${updated.browser || "Browser"} | ${updated.pathname || updated.url || "active tab"}]. Status: ${updated.stats?.total || 0} violations (${updated.stats?.errors || 0} errors, ${updated.stats?.warnings || 0} warnings).`,
          }],
        };
      },
    },

    // 3. wait_for_live_clean
    {
      schema: {
        name: "wait_for_live_clean",
        description: "Waits for hot-module-reload (HMR) and browser DOM re-evaluation to reach 0 violations in the targeted tab (or returns remaining violations upon timeout). Use after making code edits to assert the fix worked.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Target specific route/pathname (e.g. '/foundations/colors'). Avoids waiting on unrelated dirty tabs.",
            },
            tabId: {
              type: "string",
              description: "Target specific tabId.",
            },
            timeoutMs: {
              type: "number",
              description: "Maximum time in milliseconds to wait for a clean DOM (default: 6000ms).",
            },
          },
        },
      },
      handler: async (args) => {
        const { path, tabId, timeoutMs = 6000 } = args ?? {};
        const result = await bridge.waitForClean({ path, tabId, timeoutMs });

        if (result.success) {
          return {
            content: [{
              type: "text",
              text: `[Live Bridge] Success! Browser DOM for [${result.snapshot.browser || "Browser"} | ${result.snapshot.pathname || result.snapshot.url}] verified 100% CLEAN (0 violations) in ${result.elapsedMs}ms.`,
            }],
          };
        }

        const remaining = result.snapshot.issues || [];
        return {
          content: [{
            type: "text",
            text: `[Live Bridge] Timeout after ${result.elapsedMs}ms for [${result.snapshot.browser || "Browser"} | ${result.snapshot.pathname || result.snapshot.url}]. ${remaining.length} violations remaining:\n` +
              remaining.map((iss, i) => `${i + 1}. \`${iss.selector}\`: ${iss.detail}`).join("\n"),
          }],
          isError: true,
        };
      },
    },
  ];
}

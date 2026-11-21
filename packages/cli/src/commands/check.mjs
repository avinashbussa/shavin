import { resolve } from "node:path";
import { c, fmt, g, printCard, printBanner } from "../ui.mjs";
import { runDoctor } from "../lib/doctor.mjs";
import { runRenderCheck } from "../lib/render-check.mjs";

const GROUPS = [
  ["environment", "Environment"],
  ["wiring", "Setup"],
  ["agents", "Agent files"],
  ["render", "Render check"],
];
const MARK = { pass: () => fmt.pass("ok"), warn: () => fmt.warn("warn"), fail: () => `${c.error}fail${c.reset}`, info: () => `${c.fgMuted}info${c.reset}` };

/**
 * `shavin check` / `shavin doctor`: the read-only health check of a project's Shavin setup.
 * Exit code 1 when any check fails (warnings pass), so it works as a CI step. `--json` prints
 * { apiVersion, type: "doctor", data: { score, summary, checks } }. `--render <url>` also loads that page in a
 * headless browser and confirms Shavin renders styled (needs a running dev server and Playwright).
 */
export async function checkCommand({ json = false, targetDir, renderUrl } = {}) {
  const cwd = resolve(targetDir || process.cwd());
  const report = runDoctor(cwd);
  if (renderUrl) {
    // The render check needs a running dev server: it loads the page and probes the computed styles.
    const render = await runRenderCheck(renderUrl);
    report.checks.push(...render.checks);
    for (const c of render.checks) report.summary[c.status]++;
    if (!render.ok) report.ok = false;
  }

  if (json) {
    process.stdout.write(JSON.stringify({
      apiVersion: 1,
      type: "doctor",
      data: {
        project: cwd,
        framework: report.framework,
        tailwind: report.tailwind,
        score: report.score,
        summary: report.summary,
        checks: report.checks,
      },
    }, null, 2) + "\n");
    process.exitCode = report.ok ? 0 : 1;
    return report;
  }

  printBanner("@shavin/cli", "Setup check");
  for (const [group, title] of GROUPS) {
    const items = report.checks.filter((x) => x.group === group);
    if (!items.length) continue;
    printCard({
      title: `${c.brand}${g.brand} ${title}${c.reset}`,
      items: items.flatMap((x) => [
        { label: `${x.label}:`, value: `${MARK[x.status]()} ${c.fgSubtle}${x.message}${c.reset}` },
        ...(x.fix && x.status !== "pass" ? [`${" ".repeat(21)}${c.fgMuted}→ ${x.fix}${c.reset}`] : []),
      ]),
    });
  }

  const { pass, warn, fail, info } = report.summary;
  printCard({
    title: `${c.brand}${g.brand} Summary${c.reset}`,
    items: [
      { label: "Score:", value: `${report.score}%` },
      { label: "Checks:", value: `${pass} ok · ${warn} warn · ${fail} fail${info ? ` · ${info} info` : ""}` },
    ],
    footer: report.ok
      ? (warn ? fmt.warn("No failures. Fix the warnings when you can.") : fmt.pass("Shavin is set up."))
      : `${fmt.warn(`${fail} failing check${fail === 1 ? "" : "s"}. Most are fixed by `)}${fmt.code("npx @shavin/cli init")}`,
  });
  process.exitCode = report.ok ? 0 : 1;
  return report;
}

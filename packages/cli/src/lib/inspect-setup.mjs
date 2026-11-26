import { runDoctor } from "./doctor.mjs";

/**
 * The setup problems that stop installed blocks from rendering correctly: the Tailwind
 * theme import, the v4 `@source`, `<ThemeProvider>`, the @shavin/ui package and its fit with the installed
 * Shavin tools (package compatibility). `shavin add`
 * reads `ok` / `issues` to warn before writing a block. Agent files and runtime versions are
 * left to `shavin check` (the full report from doctor.mjs).
 *
 * @param {string} [cwd]
 * @returns {{ ok: boolean, framework: string, frameworkSource: string, tailwind: number, tailwindSource: string,
 *   issues: { label: string, fix: string }[] }}
 */
export function inspectSetup(cwd = process.cwd()) {
  const report = runDoctor(cwd);
  const issues = report.checks
    .filter((c) => (c.group === "wiring" || c.id === "ui-package" || c.id === "package-compat") && (c.status === "fail" || c.status === "warn"))
    .map((c) => ({ label: c.label, fix: c.fix ? `${c.message}. ${c.fix}` : c.message }));
  return {
    ok: issues.length === 0,
    framework: report.framework, frameworkSource: report.frameworkSource,
    tailwind: report.tailwind, tailwindSource: report.tailwindSource,
    issues,
  };
}

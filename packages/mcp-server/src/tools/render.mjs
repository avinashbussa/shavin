/**
 * Tool: render_check. Loads a running local page headless (desktop + mobile) and reports the defects an agent
 * cannot see from code, plus screenshots to look at. Detectors live in @shavin/cli/visual-check.
 */
import { runVisualCheck, formatReport } from "@shavin/cli/visual-check";

export function registerRenderTools() {
  return [
    {
      schema: {
        name: "render_check",
        description: "Call before you say a page or screen is done, on the running dev server (the first turn included). Loads the page headless at desktop 1440 and mobile 390 and reports what the code cannot show: overlapping or cramped text, line-height smaller than the font, text contrast over the real background (photo, video, gradient, mesh), horizontal overflow, small tap targets, console errors. Saves screenshots: open them and judge the design, fix every FAIL, run it again. Local URLs only. Needs Playwright (reports 'skipped' without it).",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Page on the running dev server, for example http://localhost:3000/ (localhost, 127.0.0.1 or *.localhost only)." },
            outDir: { type: "string", description: "Folder for the screenshots (defaults to a temp folder)." },
          },
          required: ["url"],
        },
      },
      handler: async (args) => {
        const report = await runVisualCheck(String(args?.url || ""), { outDir: args?.outDir });
        return { content: [{ type: "text", text: formatReport(report) }], ...(report.status === "error" ? { isError: true } : {}) };
      },
    },
  ];
}

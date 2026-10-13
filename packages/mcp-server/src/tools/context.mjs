import { extractProjectContext } from "../context.mjs";

export function registerContextTool(server, ROOT) {
  return {
    schema: {
      name: "get_project_context",
      description: "CALL FIRST in a @shavin/ui project. Returns the project's design profile (app, archetype, theme, accent, density) and the tool workflow: plan_page → check_page → get_skill/get_components → validate_code → check_page({ targetDir }).",
      inputSchema: {
        type: "object",
        properties: {
          targetDir: {
            type: "string",
            description: "Target workspace directory path (defaults to process.cwd()).",
          },
          format: {
            type: "string",
            enum: ["markdown", "json"],
            description: "Output format (default 'markdown').",
          },
        },
      },
    },
    handler: async (args) => {
      const { format = "markdown", targetDir } = args ?? {};
      const context = extractProjectContext({
        targetDir: targetDir || ROOT,
        save: true,
      });

      if (format === "json") {
        return { content: [{ type: "text", text: JSON.stringify(context, null, 2) }] };
      }

      return { content: [{ type: "text", text: context.promptMarkdown }] };
    },
  };
}

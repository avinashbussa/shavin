export function registerGuidelinesTool(server, AGENTS_MD) {
  return {
    schema: {
      name: "get_guidelines",
      description: "Query core technical rules and specifications from AGENTS.md. Optionally pass a section name to filter.",
      inputSchema: {
        type: "object",
        properties: {
          section: {
            type: "string",
            enum: [
              "all",
              "mental-model",
              "directory-layout",
              "component-variant-pattern",
              "radix-selection",
              "concentric-radius",
              "theme-provider",
              "component-pipeline",
              "quality-gate",
              "responsive-design",
            ],
            description: "Section to query (default: 'all').",
          },
        },
      },
    },
    handler: async (args) => {
      if (!AGENTS_MD) {
        return { content: [{ type: "text", text: "ERROR: AGENTS.md not found at repository root." }], isError: true };
      }
      const { section = "all" } = args ?? {};

      if (section === "all") {
        return { content: [{ type: "text", text: AGENTS_MD }] };
      }

      const sections = AGENTS_MD.split(/\n##\s+/);
      const query = section.toLowerCase().replace(/-/g, " ");
      const match = sections.find((s) => s.toLowerCase().includes(query));

      if (match) {
        return { content: [{ type: "text", text: `## ${match}` }] };
      }

      return {
        content: [{
          type: "text",
          text: `Section '${section}' not found. Available sections: mental-model, directory-layout, component-variant-pattern, radix-selection, concentric-radius, theme-provider, component-pipeline, quality-gate.`,
        }],
      };
    },
  };
}

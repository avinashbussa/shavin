/**
 * Tool: get_tokens
 * Query @shavin/ui tokens by category, name, or semantic role.
 */
export function registerTokensTool(server, TOKENS) {
  return {
    schema: {
      name: "get_tokens",
      description: "Call before choosing colours, surfaces, radii, shadows or motion values. Returns the legal semantic tokens (colours, surface roles, radius, shadow, easing, presets) — raw hex, rgb() and --n-* are never allowed.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["all", "background", "text", "border", "accent", "radius", "space", "animation", "shadow"],
            description: "Token category to filter by (default: 'all').",
          },
          name: {
            type: "string",
            description: "Specific token name to search for (e.g. 'bg-surface', 'radius-panel', 'accent').",
          },
          density: {
            type: "string",
            enum: ["dense", "full"],
            description: "Output format: 'dense' (compressed shorthand clusters, default) or 'full' (verbatim tokens JSON).",
          },
        },
      },
    },
    handler: async (args) => {
      if (!TOKENS) {
        return { content: [{ type: "text", text: "ERROR: tokens.json not loaded." }], isError: true };
      }
      const { category = "all", name: tokenName, density = "dense" } = args ?? {};

      if (tokenName) {
        const query = tokenName.toLowerCase().replace(/^--/, "").replace(/^var\(--/, "").replace(/\)$/, "");
        const hits = [];

        for (const [cat, tokens] of Object.entries(TOKENS.semantic ?? {})) {
          for (const [key, val] of Object.entries(tokens)) {
            if (key.toLowerCase().includes(query)) {
              hits.push({ type: `semantic.${cat}`, name: `--${key}`, value: val });
            }
          }
        }

        if (hits.length === 0) {
          return { content: [{ type: "text", text: `No tokens matching query '${tokenName}'. Use category='all' to see available tokens.` }] };
        }

        if (density === "full") {
          return { content: [{ type: "text", text: JSON.stringify(hits, null, 2) }] };
        }

        const denseMatches = hits.map((h) => `${h.name} (${h.type}): ${typeof h.value === "object" ? JSON.stringify(h.value) : h.value}`).join("\n");
        return { content: [{ type: "text", text: `# Token Match for '${tokenName}'\n${denseMatches}` }] };
      }

      if (density === "full") {
        if (category !== "all" && TOKENS.semantic?.[category]) {
          return { content: [{ type: "text", text: JSON.stringify(TOKENS.semantic[category], null, 2) }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(TOKENS.semantic ?? {}, null, 2) }] };
      }

      // Dense token clustering
      if (category !== "all" && TOKENS.semantic?.[category]) {
        const tokenList = Object.keys(TOKENS.semantic[category]).map((k) => `--${k}`).join(", ");
        return { content: [{ type: "text", text: `# @shavin/ui Tokens [${category.toUpperCase()}]\n${tokenList}` }] };
      }

      const denseClusters = [
        "# @shavin/ui Semantic Tokens (Dense Overview)",
        "RULE: Zero hex/rgb. Semantic classes ONLY. Import root @shavin/ui ONLY.",
        "",
        "**BACKGROUNDS**: bg-canvas, bg-surface, bg-surface-hover, bg-surface-raised, bg-accent, bg-accent-subtle",
        "**TEXT/FOREGROUND**: text-fg (headings), text-fg-subtle (paired descriptions), text-fg-muted (standalone meta), text-accent",
        "**BORDERS**: border-hairline (resting cards/dividers), border-hairline-strong (hover/active/featured states)",
        "**CONCENTRIC RADIUS**:",
        "  - Containers/Panels: rounded-[var(--radius-panel)] (cards, dialogs, popovers, menus; capped at finite curve, NEVER pill)",
        "  - Controls: rounded-[var(--radius-lg)] (buttons, textfields, badges, switches; pill at Full preset)",
        "  - Nesting utility: rounded-panel-p3, rounded-panel-p5 (R_inner = max(floor, R_outer - P), floor = min(radius-lg, radius-panel/2))",
        "**SPATIAL ZONES**: Page (py-16 md:py-24) > Container (px-4 md:px-6) > Surface (p-4 to p-8) > Element (px-3 py-1.5)",
      ];

      return { content: [{ type: "text", text: denseClusters.join("\n") }] };
    },
  };
}

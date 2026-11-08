/**
 * Tool: get_components
 * Query @shavin/ui components.json for component primitives, props, and variants.
 */
// Curated gotchas learned from real builds (kept short: they ship in every lookup).
const CURATED_TRAPS = {
  Progress: ["label only renders with labelPosition=\"top\""],
  DataListItem: ["children are wrapped in <p>: no block elements inside"],
  Select: ["trigger is full-width; className applies to the trigger"],
  Flex: ["gap accepts only \"0\"-\"7\""],
  Stack: ["gap accepts only \"0\"-\"7\""],
  ScrollArea: ["content is display:table and can widen layout; use overflow-y-auto Box for plain lists"],
  SidebarItem: ["<a href> full-reloads; navigate with router.push"],
};

// Internal tools (ShavinDevTools, BlockPreview …) are Shavin's own tooling:
// never offered in lists agents build UI from.
const isPublic = (c) => !c.internal;

export function registerComponentsTool(server, COMPONENTS) {
  return {
    schema: {
      name: "get_components",
      description: "Call before using any @shavin/ui primitive you have not used in this session — never write Shavin JSX from memory. Returns exact props, cva variants and Radix slot rules for one component. Page layout comes from plan_page, not from here. Supports 'dense' (default) and 'full'.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Component name to query (e.g. 'Button', 'Card', 'Dialog', 'Select', 'Badge').",
          },
          density: {
            type: "string",
            enum: ["dense", "full"],
            description: "Output format: 'dense' (compressed shorthand signature, default) or 'full' (verbatim manifest JSON).",
          },
        },
      },
    },
    handler: async (args) => {
      if (!COMPONENTS) {
        return { content: [{ type: "text", text: "ERROR: components.json not loaded." }], isError: true };
      }
      const { name: compName, density = "dense" } = args ?? {};

      if (compName) {
        const query = compName.toLowerCase();
        const comp = (COMPONENTS.components ?? []).find(
          (c) => c.name.toLowerCase() === query || c.name.toLowerCase() === query.replace(/^s-/, "")
        );

        if (!comp) {
          const list = (COMPONENTS.components ?? []).filter(isPublic).map((c) => c.name).join(", ");
          return { content: [{ type: "text", text: `Component '${compName}' not found. Available primitives: ${list}` }] };
        }

        if (density === "full") {
          return { content: [{ type: "text", text: JSON.stringify(comp, null, 2) }] };
        }

        // Dense format
        const variantSummary = Object.entries(comp.variants || {})
          .map(([k, vals]) => {
            const def = comp.defaultVariants?.[k];
            const formattedVals = vals.map((v) => (v === def ? `${v}*` : v)).join("/");
            return `${k}=[${formattedVals}]`;
          })
          .join(", ");

        const exportsList = (comp.exports || [comp.name]).join(", ");
        const category = comp.group || "components";
        const kind = comp.kind || "native";

        const lines = [
          `# ${comp.name} [kind=${kind}, cat=${category}]`,
          ...(comp.internal ? ["internal: Shavin tooling, not a primitive. Do not use it to build product UI."] : []),
          ...(comp.partOf ? [`part of: ${comp.partOf} (get_components "${comp.partOf}" has its usage, guidance and examples)`] : []),
          variantSummary ? `variants: ${variantSummary}` : "variants: none",
          `exports: ${exportsList}`,
          `import: import { ${(comp.exports || []).includes(comp.name) || !(comp.exports || []).length ? comp.name : comp.exports.join(", ")} } from "${comp.importPath || "@shavin/ui"}"`,
        ];

        if (comp.description) {
          lines.push(`spec: ${comp.description}`);
        }

        // Props: compact, token-minimal. Required first; skip boilerplate and
        // deprecated props; short types; capped. `density: "full"` has everything.
        const SKIP = new Set(["className", "style", "ref", "key", "id", "ariaLabel"]);
        const shortType = (t) => {
          const x = String(t ?? "").replace(/\s+/g, " ").trim();
          return x.length > 48 ? x.slice(0, 45) + "..." : x;
        };
        const usable = (comp.props || []).filter(
          (p) => !SKIP.has(p.name) && !/@deprecated/i.test(p.doc || "")
        );
        usable.sort((a, b) => Number(!!b.required) - Number(!!a.required));
        const MAX_PROPS = 16;
        const shown = usable.slice(0, MAX_PROPS).map((p) => {
          const def = p.default !== undefined && p.default !== "" ? `=${p.default}` : "";
          return `${p.name}${p.required ? "" : "?"}:${shortType(p.type)}${def}`;
        });
        if (!shown.length && comp.inheritsDomProps) {
          lines.push("props: none of its own (standard HTML attributes only)");
        }
        if (shown.length) {
          const more = usable.length > MAX_PROPS ? `; +${usable.length - MAX_PROPS} more (density:"full")` : "";
          lines.push(`props: ${shown.join("; ")}${more}`);
        }

        // Traps: explicit curated `traps` first, then up to 2 short don'ts.
        const traps = [
          ...(comp.traps || []),
          ...(CURATED_TRAPS[comp.name] || []),
          ...(comp.bestPractices || []).filter((b) => b.guidance === false).map((b) => b.description),
        ]
          .map((t) => String(t).replace(/^Do not /i, "Don't ").trim())
          .map((t) => (t.length > 150 ? t.slice(0, 147) + "..." : t))
          .slice(0, 3);
        if (traps.length) lines.push(`traps: ${traps.join(" | ")}`);

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      if (density === "full") {
        const summary = (COMPONENTS.components ?? []).filter(isPublic).map((c) => ({
          name: c.name,
          group: c.group || "components",
          description: c.description || "",
          variants: Object.keys(c.variants || {}),
        }));
        return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
      }

      // Dense summary of all primitives grouped by category
      const categories = {};
      const publicComponents = (COMPONENTS.components ?? []).filter(isPublic);
      for (const c of publicComponents) {
        const cat = c.group || "components";
        if (!categories[cat]) categories[cat] = [];
        const variantKeys = Object.keys(c.variants || {});
        const variantNote = variantKeys.length > 0 ? ` [${variantKeys.join(",")}]` : "";
        categories[cat].push(`${c.name}${variantNote}`);
      }

      const denseLines = [
        `# @shavin/ui Primitives (${publicComponents.length} components — Dense Overview)`,
        "Import root: import { Component } from \"@shavin/ui\"",
        ...Object.entries(
          publicComponents.reduce((acc, c) => {
            if (c.importPath) (acc[c.importPath] ||= []).push(c.name);
            return acc;
          }, {})
        ).map(([path, names]) => `Subpath: import { ${names.join(", ")} } from "${path}"`),
        "",
      ];

      for (const [cat, items] of Object.entries(categories)) {
        denseLines.push(`**${cat.toUpperCase()}**: ${items.join("; ")}`);
      }

      return { content: [{ type: "text", text: denseLines.join("\n") }] };
    },
  };
}

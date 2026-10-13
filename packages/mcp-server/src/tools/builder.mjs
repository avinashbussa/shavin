import { ALL_BLOCKS, BLOCK_TEMPLATES } from "@shavin/block-schema";
import * as blockSchema from "@shavin/block-schema";

/** Old slug → current slug (RENAMED_BLOCKS); tolerant of an older block-schema build. */
const resolveBlockSlug = typeof blockSchema.resolveBlockSlug === "function" ? blockSchema.resolveBlockSlug : (s) => s;

export function registerBuilderTools(server) {
  return [
    {
      schema: {
        name: "get_builder_schema",
        description:
          "List block registry metadata (key, name, category, tier, description) for visual canvas and layout synthesis. Optionally filter by category.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Optional category filter (e.g. 'hero', 'pricing', 'dashboard', 'auth').",
            },
          },
        },
      },
      handler: async (args) => {
        const { category } = args ?? {};
        const source = Object.values(BLOCK_TEMPLATES);
        const filtered = source
          .filter((b) => !category || b.category === category)
          .map((b) => ({
            key: b.key,
            name: b.name,
            category: b.category,
            tier: b.tier,
            description: b.description,
          }));
        return { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] };
      },
    },
    {
      schema: {
        name: "get_block_template",
        description:
          "Call when a planned section maps to a ready-made Shavin block: returns its verified AST/template. Pick the composition with plan_page first, then wrap the block in <Section data-composition=\"<ID>\">.",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "The unique block key (e.g. 'hero-centered-media', 'pricing-three-tier').",
            },
            format: {
              type: "string",
              enum: ["code", "tree", "structure"],
              description: "Payload projection. Default 'code'. Use 'tree' only when driving the Studio canvas; 'structure' for cheap exploration.",
            },
          },
          required: ["key"],
        },
      },
      handler: async (args) => {
        const key = resolveBlockSlug(args?.key);
        const format = args?.format ?? "code";
        const block = BLOCK_TEMPLATES[key];
        if (!block) {
          const available = Object.keys(BLOCK_TEMPLATES).slice(0, 20).join(", ");
          return {
            content: [
              {
                type: "text",
                text: `Block '${key}' not found. Available keys (first 20): ${available}…`,
              },
            ],
          };
        }

        let payload;
        if (format === "tree") {
          // Full AST — for canvas synthesis. ~1.5-2x the token cost of code.
          payload = {
            key: block.key,
            name: block.name,
            category: block.category,
            tier: block.tier,
            layout: block.layout,
            description: block.description,
            dependencies: block.dependencies,
            tree: block.tree,
          };
        } else if (format === "structure") {
          // Skeleton — composition shape only, minimal tokens.
          const skeleton = (node) => ({
            type: node.type,
            ...(node.props?.className ? { className: node.props.className } : {}),
            ...(node.children?.length ? { children: node.children.map(skeleton) } : {}),
          });
          payload = {
            key: block.key,
            name: block.name,
            category: block.category,
            layout: block.layout,
            structure: skeleton(block.tree),
          };
        } else {
          // Default: code — the same self-contained TSX the CLI installs.
          payload = {
            key: block.key,
            name: block.name,
            category: block.category,
            tier: block.tier,
            description: block.description,
            dependencies: block.dependencies,
            rawCode: block.rawCode,
          };
        }

        return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
      },
    },
  ];
}

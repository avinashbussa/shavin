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
  ToastProvider: ["A Toast confirms; it never carries the only copy of an error (persist errors inline)", "useToast() throws outside ToastProvider; init mounts it inside ThemeProvider"],
  FormField: ["TextField has its own label/hint/errorMessage: do not wrap it"],
  Button: ["disable a submit only while it runs (loading); explain other disabled buttons with disabledReason"],
};

// Internal tools (ShavinDevTools, BlockPreview …) are Shavin's own tooling:
// never offered in lists agents build UI from.
// Entries the folder index does not re-export (helpers, constants) cannot be imported either.
const isPublic = (c) => !c.internal && (c.exports ?? [c.name]).length > 0;

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
          ...((comp.exports || [comp.name]).length
            ? [`exports: ${exportsList}`]
            : ["exports: none (internal helper, not exported from @shavin/ui; do not import it)"]),
          ...((comp.exports || [comp.name]).length ? [`import: import { ${(comp.exports || []).includes(comp.name) || !(comp.exports || []).length ? comp.name : comp.exports.join(", ")} } from "${comp.importPath || "@shavin/ui"}"`] : []),
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
        // OTP-only props (TextField type="otp") would bury the real props: list their names on one line.
        const isOtpOnly = (p) => /\botp\b/i.test(p.doc || "") && !/password/i.test(p.doc || "");
        const otpNames = usable.filter(isOtpOnly).map((p) => p.name);
        const mainProps = usable.filter((p) => !isOtpOnly(p));
        const shown = mainProps.slice(0, MAX_PROPS).map((p) => {
          const def = p.default !== undefined && p.default !== "" ? `=${p.default}` : "";
          return `${p.name}${p.required ? "" : "?"}:${shortType(p.type)}${def}`;
        });
        if (!shown.length && comp.inheritsDomProps) {
          lines.push("props: only standard HTML attributes (no custom props)");
        }
        if (shown.length) {
          const more = mainProps.length > MAX_PROPS ? `; +${mainProps.length - MAX_PROPS} more (density:"full")` : "";
          lines.push(`props: ${shown.join("; ")}${more}`);
        }

        if (otpNames.length) lines.push(`otp-only props (type="otp"): ${otpNames.join(", ")}`);

        // Composition notes (sub-component nesting, provider/hook setup).
        for (const note of comp.structure || []) lines.push(`structure: ${note}`);

        // Usage example: the first one that fits, else the shortest, capped to 6 lines / 380 chars.
        const examples = (comp.examples || []).filter((e) => e.code);
        const example = examples.find((e) => e.code.length <= 380) ?? [...examples].sort((x, y) => x.code.length - y.code.length)[0];
        if (example) {
          let code = example.code.split("\n").slice(0, 6).join("\n");
          if (code.length > 380) code = code.slice(0, 377) + "...";
          lines.push(`example:\n${code}`);
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

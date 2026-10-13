# Primitives

Every component in `@shavin/ui` is a folder under `packages/ui/src/primitives/`:

```
Button/
  Button.tsx       the component
  Button.doc.ts    description, examples, Do and Don't, accessibility and keyboard notes
  index.ts         export * from "./Button";
```

Add the folder's exports to `packages/ui/src/index.ts`, the one public entry point.

## The component file

- Variants with `cva()` and class merging with `cn()` (from `../../lib/cn`). Callers' `className` always goes last in `cn(...)`, so it can override.
- Semantic tokens only: `bg-surface`, `text-fg`, `border-hairline` and so on. No hex, `rgb()`, raw Tailwind colour scales or `--n-*` variables.
- Radius by role: controls `rounded-[var(--radius-lg)]`, containers `rounded-[var(--radius-panel)]`, nested surfaces the concentric `rounded-panel-p*` steps.
- Floating surfaces (popovers, menus, dialogs) carry `data-panel`.
- Icons through `<Icon>`, never emoji or glyphs.
- Reach for Radix for anything with focus management, dismissal or ARIA patterns (dialogs, menus, popovers, selects, tabs). `AGENTS.md` lists when.
- Overlays and drawers animate on `--ease-drawer` / `--ease-out`, respect reduced motion, move focus in and back, and never leave off-screen controls tabbable (`inert`).
- Size controls with the `size` prop, not className. Form controls share one height scale (sm 32, md 40, lg 48px) and render 16px text on small screens so iOS does not zoom.

## Props the manifest can read

`scripts/gen-manifest.mjs` reads each exported component's props interface and its `cva` variants into `components.json`, which the docs, the playground and the MCP server use.

- Export a named props type (`export interface ButtonProps ...`) and give each prop a one-line JSDoc comment: it becomes the prop's description.
- Spell literal unions out (`"sm" | "md" | "lg"`).
- Scope variants to their component with `VariantProps<typeof buttonVariants>`.

## The doc file

`<Name>.doc.ts` exports `docs` (type in `src/authoring/types.ts`). It may only `import type`. The manifest runs it, so examples must define their own data and state.

| Field | Purpose |
|---|---|
| `name`, `description` | Required. One sentence on what the component is for |
| `group` | `"layout"` or `"typography"`; omit for everything else |
| `internal` | `true` for Shavin's own tooling (kept out of counts and agent lists) |
| `features`, `notes` | Variants, sizes, behaviour worth knowing |
| `accessibility`, `keyboard` | What assistive tech gets; keys and what they do |
| `usage.bestPractices` | Do (`guidance: true`) and Don't (`false`) lines |
| `examples` | `{ title, description?, code }`; code is JSX or a whole `function Example() { ... }` |

Copy `Button.doc.ts` as a template.

## Checklist for a new or changed primitive

1. Component, `index.ts`, export in `src/index.ts`.
2. `<Name>.doc.ts` with at least one example, Do and Don't, accessibility and keyboard notes.
3. `npm run playground`: the page renders, the checklist at the top is empty, light and dark both look right.
4. `npm run manifest:gen`, commit `components.json`.
5. Tests in `tests/unit/`: it renders, passes axe, and its contract cases hold.
6. `npm run verify` and `npm test` pass.

Maintainers wire the docs-site page and other upstream surfaces after merge.

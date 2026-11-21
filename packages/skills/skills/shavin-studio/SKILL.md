---
name: shavin-studio
description: >
  Rules for designing live in Shavin Studio through the MCP: only when a Studio session is connected
  (connect_studio) and you build BlockNode trees for the canvas with compose_to_canvas or inject_blocks.
  Covers BlockNode shape and prop names, responsive @tablet/@mobile overrides, frames, icons and theme
  changes, and the isolated block workflow (design, validate, approve, hand off). Not needed for writing code in a project.
sections:
  - id: when
    description: "When this skill applies and the Studio tools"
  - id: blocknodes
    description: "BlockNode trees: shape, prop names, what the Studio parser drops"
  - id: responsive
    description: "@tablet / @mobile overrides, frames, the responsive workflow"
  - id: theme
    description: "Icons, spacing and live theme changes"
  - id: block-workflow
    description: "Designing a block or section in isolation: understand, design, validate, approve, hand off"
---

# shavin-studio

- This skill is for a **connected Studio session only**. Writing `.tsx` in a project does not need it: use `CLAUDE.md`, `AGENTS.md` and `shavin-app` / `shavin-webpage`.
- Load it with `get_skill({ name: "shavin-studio" })` after `connect_studio` succeeds. Without MCP read `.agents/skills/shavin-studio/SKILL.md`.
- The component rules still apply on the canvas: every element is a `@shavin/ui` component, semantic tokens only, and the six states.

## 1. When it applies

The Studio tools appear once `connect_studio({ pairingCode })` has paired with a session (the 6-character code is in Studio's Connect AI panel).

| Tool | Use for |
|---|---|
| `compose_to_canvas(prompt, frame?)` | Synthesize a layout and render it live on the canvas |
| `inject_blocks(blocks, mode?, frame?)` | Put a `BlockNode[]` tree on the canvas (`mode: "replace"` or add) |
| `get_studio_state()` | Read the current canvas blocks and theme before changing them |
| `set_studio_theme(brand, gray, radius, dark, scaling, panelBackground)` | Change the theme live |
| `clear_studio_canvas()` | Empty the canvas |
| `duplicate_frame({ frameId?, title?, count? })` | Copy a frame (new ids) next to the original: carousel slides, breakpoint or colour variants |
| `export_frame({ path, frameId?, format?, scale? })` | Render a frame to a PNG, JPG or WebP file (1x to 3x) at a local path (local MCP only) |
| `resize_frame({ frameId, device?, width?, height? })` | Change a frame's device preset or size (social presets ignore `width` and `height`) |
| `disconnect_studio()` | End the session |

## 2. BlockNode trees

A block is `{ "type": "<Component>", "props": { … }, "children": [ … ] }`. Studio reads the same props as the components, with these rules:

- Prop names are the component's own: `weight` on `Text` and `Heading` (`<Text weight="semibold">`), `name` on `Icon` (not `icon`), `direction="column"` on `Flex` (`col` is accepted, `column` is canonical).
- `Button` takes `tone="brand"` or `tone="danger"` only. For a neutral look use `variant="ghost"` without `tone`.
- Never set the same style through a prop and `className` (`size="7"` and `className="text-3xl"` conflict). Pick the prop.
- The Studio parser drops raw `<ul>`/`<li>` and `<section>`/`<header>`/`<nav>`. Use `Flex` rows (`<Flex direction="column" gap="3">` with child `<Flex direction="row">`), `Box`, or `Section`.
- Wrap `Card` children in a `Flex` with a `gap`; a `Card` does not space its children.
- Look every component up with `get_components` first; do not guess props.

## 3. Responsive overrides

The base (desktop) value is always written without a suffix. Tablet and mobile overrides use `@tablet` / `@mobile` suffixes on the same prop key.

| Breakpoint | Suffix | Tailwind prefix | Trigger |
|---|---|---|---|
| Desktop (base) | none | none | default |
| Tablet | `@tablet` | `max-lg:` | below 1024px |
| Mobile | `@mobile` | `max-md:` | below 768px |

Props that accept overrides: `columns`, `rows`, `gap`, `direction` / `flexDir`, `align` / `items`, `justify`, `wrap`, `padding`, `width`, `height`; style props such as margin, font size and display also accept them.

```json
{ "type": "Grid", "props": { "columns": "3", "columns@tablet": "2", "columns@mobile": "1", "gap": "6", "gap@mobile": "4" } }
```

renders as `grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-6 max-md:gap-4`.

- Mobile wins over tablet. Only override what changes; do not repeat the whole prop set.
- Prefer layouts that adapt by themselves (`Grid columns="auto"`, `AppFrame`) before using suffixes.
- Workflow: `get_studio_state` → add `@mobile` / `@tablet` keys to the blocks → `inject_blocks` with `mode: "replace"`.
- To show desktop and mobile side by side, pass `frame: { "title": "Mobile Hero", "device": "mobile" }` to `compose_to_canvas` / `inject_blocks`. A frame is a preview, not a substitute for the overrides.
- A frame has one size. The web devices default to desktop 1440x1024, tablet 768x1024 and mobile 390x844 (`width` and `height` override them; `block` is retired and becomes `desktop`). The social presets are exact canvases with no padding, clipped at the edge, and exported at exactly that size: `social-portrait` 1080x1350 (Instagram 4:5), `social-square` 1080x1080, `social-wide` 1600x900. Their `width` and `height` are ignored.
- A frame without a `title` is named by its type and size: `Desktop 1440`, `Mobile 390`, `Instagram portrait 1080×1350`, numbered when the name is taken. Pass a `title` that says what the frame is for ("Pricing, mobile") when you add a second frame.
- To produce a post or carousel: `inject_blocks` with a social preset, `duplicate_frame` for each slide, `resize_frame` to change a slide's preset, then `export_frame` to a path on disk.
- For a social post or carousel, quote the headline, subhead and call to action of each frame in your reply, so the user can check the copy without opening the frame.

## 4. Icons, spacing and theme

- Icons are `{ "type": "Icon", "props": { "name": "Check", "size": "sm", "color": "brand" } }`. No emoji or Unicode glyphs.
- Spacing and radius follow `core-rules.md`; the canvas applies the project's tokens.
- `set_studio_theme` changes brand, gray, radius, dark mode, scaling and panel background on the canvas only. To change a project, edit `SHAVIN.md`, `.shavin/config.json` and the `ThemeProvider` (see `CLAUDE.md`, "Brand colour").

## 5. Designing a block or section in isolation

Use this when the user wants a section, block or screen designed and approved before it is merged into the project (on the Studio canvas or as a scratch file). Work in a silo: do not touch production files until the user approves.

1. **Understand.** Call `get_studio_schema` for the block registry (key, name, category, tier) and `get_block_template({ key })` for a block you can start from. Ask at most one clarifying question (for example "full page or a card section?").
2. **Design.** `get_tokens` for the legal utilities, `get_components({ name })` for each primitive's props. Every element is a `@shavin/ui` component, floating surfaces carry `data-panel`, and the six states are built in (see `CLAUDE.md`).
3. **Validate.** Run `validate_code` on the JSX and fix every finding before showing it. Do not show the user code that fails.
4. **Present.** Show the block in a code fence with one line per section and ask: "Does this look right? Any changes before I hand this off?" Iterate until the user approves explicitly.
5. **Hand off.** Output the final block labelled "Approved, ready to merge", with a header: `// [SHAVIN-HANDOFF] Target: <path>`, the imports, and the props. The main agent or the user merges it; do not write to production files yourself.

When delegating this to a subagent, give it a dense brief: `TASK: <feature>; Mode=<STRUCTURAL|MARKETING|EDITORIAL>`, `CONTAINER: size, padding`, `RADIUS: panel=rounded-[var(--radius-panel)]; control=rounded-[var(--radius-lg)]`, `ACTIONS: primary, secondary`, `RULES: tokens only, data-panel on floating surfaces, import @shavin/ui root only`.

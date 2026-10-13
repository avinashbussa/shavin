# Shavin Project Design Manifest

<!-- This project's design brief. AI agents read it first on every task (or call get_project_context via the Shavin MCP), then follow AGENTS.md. Edit the values; keep the labels, because the MCP and the skills read them. -->

## 1. Product & Domain Context
- **Product Name**: [project name]
- **Domain**: Web Application
- **Brand Personality**: High-taste, minimal, crisp, high-contrast, zero-fluff

## 2. Design System Configuration
- **Engine**: `@shavin/ui`
- **Primary Accent**: `monochrome`
- **Neutral Scale**: `zinc`
- **Theme Mode**: `dark-first`
- **Scaling / Density**: `95%`
- **Base Radius**: `medium`
- **Panel Background**: `solid`

## 3. Site & Mode Defaults
<!-- Read by the shavin-core dispatcher and the visual-compositor activation modes before they
     fall back to inferring the mode from each prompt (or the get_skill_mode MCP tool). -->
- **Site Type**: `MARKETING` <!-- MARKETING | APP | DOCS -->
- **Default Visual Mode**: `MARKETING` <!-- STRUCTURAL | MARKETING | EDITORIAL | HYBRID | DOCS -->

<!--
  Two worked examples:

  shavin.cc (marketing/product site):
  - **Site Type**: `MARKETING`
  - **Default Visual Mode**: `EDITORIAL`

  docs.shavin.cc (documentation portal):
  - **Site Type**: `DOCS`
  - **Default Visual Mode**: `DOCS`
-->

## 4. Responsive Design & Breakpoint Overrides

Shavin uses a **3-tier breakpoint cascade**. The base (desktop) value is always defined without a suffix; tablet and mobile overrides use `@tablet` / `@mobile` suffixes on the same prop key.

| Breakpoint | Suffix | Tailwind Prefix | Trigger |
|---|---|---|---|
| Desktop (base) | *(none)* | *(none)* | Default |
| Tablet | `@tablet` | `max-lg:` | `< 1024px` |
| Mobile | `@mobile` | `max-md:` | `< 768px` |


**Prefer layouts that adapt by themselves before reaching for overrides:** rows of cards use `<Grid columns="auto" minWidth="sm">` (wraps to the container's width), app screens use `<AppFrame>` (its `Sidebar` turns into a drawer when the frame is narrow; put `<SidebarTrigger />` in the TopBar, never a hand-written hamburger/Drawer). Use the suffix cascade below only for changes these cannot express.

### Responsive Props

Layout props that accept `@tablet` / `@mobile` overrides: `columns`, `rows`, `gap`, `direction` / `flexDir`, `align` / `items`, `justify`, `wrap`, `padding`, `width`, `height`.

### Example

```json
{
  "type": "Grid",
  "props": {
    "columns": "3",
    "columns@tablet": "2",
    "columns@mobile": "1",
    "gap": "6",
    "gap@mobile": "4"
  }
}
```

Renders: `grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-6 max-md:gap-4`

### Rules

- **Base is always desktop.** Never omit the base value.
- **Mobile wins over tablet** — narrower override takes precedence at small widths.
- **Only override what changes** — don't duplicate the full prop set at every breakpoint.
- **Use `frame` option** in `compose_to_canvas` / `inject_blocks` to create separate mobile/tablet frames for side-by-side preview, not as a substitute for prop overrides.

## 5. Icon System & Container Children Spacing

### Icons — No Emojis, No Glyphs, Use `<Icon>`

- **NEVER** use emoji characters OR Unicode glyphs (✓, ★, →, •) in UI or generated output. Use the `<Icon>` component from `@shavin/ui`.
- Usage: `<Icon name="Check" size="sm" color="accent" />`
- Size tokens: `xs` (12px), `sm` (16px), `md` (20px), `lg` (24px), `xl` (32px)
- Color tokens: `default`, `subtle`, `muted`, `accent`, `contrast`, `success`, `warning`, `danger`, `inherit`
- Supported libraries: Lucide (default), Phosphor, Radix Icons, Material
- For BlockNode trees (MCP): `{ type: "Icon", props: { name: "Check", size: "sm", color: "accent" } }`
- Feature list pattern: wrap each item in `<Flex direction="row" align="center" gap="2">` with `<Icon>` + `<Text>`

### Container Children Spacing — No Flush Stacking

- `Card`, `Container`, and `<div>` do NOT auto-space children. Multiple children stack flush (zero gap).
- **ALWAYS wrap Card children in `<Flex direction="column" gap="3">`** or add `space-y-3` to the container's className.
- Grid `gap` spaces cards in the grid. Inside each card, use a `Flex` wrapper with its own `gap` for card-internal spacing.
- For BlockNode trees: always wrap Card's children in a `Flex` block with `gap` prop.

## 6. Studio Prop Names — Use Field Keys, Not CVA Prop Names

- Use `weight` on Text/Heading (matches CVA): `<Text weight="semibold">`
- Use `name` (not `icon`) on Icon: `<Icon name="Check" />`
- Use `direction="column"` (not `col`) on Flex — though `col` is accepted, `column` is canonical.
- Button only supports `tone="accent"` and `tone="danger"` — for a neutral look, use `variant="ghost"` without `tone`.
- **Never set the same style via both a prop and className** — e.g. `size="7"` AND `className="text-3xl"` creates a conflict. Pick one.
- **Never use raw `<ul>`/`<li>`** — Studio's parser drops them, losing spacing. Use `<Flex direction="column" gap="3">` with child `<Flex direction="row">` rows instead.
- **Never use raw `<section>`/`<header>`/`<nav>`** — use `<Box>`, `<Flex>`, or `<Section>` instead.

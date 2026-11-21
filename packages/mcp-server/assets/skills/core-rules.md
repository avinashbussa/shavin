---
name: core-rules
description: >
  Shared foundation rules for @shavin/ui — token compliance, concentric geometry,
  typography hierarchy, font loading, animation, and anti-slop standards.
  The shared baseline for every domain skill. Read this file; the MCP does not inject it and it is not a skill name. Never duplicate these in domain skills.
---

# @shavin/ui Core Rules

- **Single source of truth.** Domain skills (shavin-app, shavin-webpage, visual-compositor) reference this file. Never re-explain these rules inline — link here instead.

---

## 1. Token Compliance (Zero Tolerance)

1. Tier-1 foundation vars (`--n-*`) → `global.css` ONLY.
2. Tier-2 semantic vars (`bg-surface`, `text-fg`, `border-hairline`) → EVERYWHERE ELSE.
3. **ZERO** hex, rgb(), rgba() in component code.
4. **ZERO** raw Tailwind color scales (`slate-500`, `blue-600`, etc.).
5. Import primitives from `@shavin/ui` root ONLY — never deep paths (`@shavin/ui/primitives/…`).
6. Variants: `cva()` + `cn()`. Floating surfaces: `data-panel` attribute.
7. Brand colour as a text or icon colour: `text-brand-text`, never `text-brand` (the fill: it fails contrast for light brands). `validate_code` warns on it.

### Semantic Token Quick Reference

| Role | Token | Use For |
|---|---|---|
| Backgrounds | `bg-canvas`, `bg-surface`, `bg-surface-hover`, `bg-surface-raised` | Page, cards, hover states, elevated panels |
| Foreground | `text-fg`, `text-fg-subtle`, `text-fg-muted`, `text-brand-text` | Titles, descriptions, meta, brand text |
| Borders | `border-hairline`, `border-hairline-strong` | Resting cards/dividers (`hairline`), hover/active/featured states (`hairline-strong`). A border, ring or bar that shows a state (selected, checked, current) is `border-brand-text` / `ring-brand-text`, never raw `border-brand` (`validate_code` warns). Raw `border-brand` is for decorative marketing moments only, never standard cards, apps, dashboards or docs. |
| Brand | `bg-brand-solid text-brand-fg hover:bg-brand-solid-hover`, `bg-brand`, `bg-brand-subtle` | Fills with text on them (CTA, solid badge): `brand-solid` + `text-brand-fg`, never `bg-brand` + `text-brand-fg` (`validate_code` warns). `bg-brand`: decoration with no text. `bg-brand-subtle`: highlight fills |

**Responsive.** A data table is always `Table`; it scrolls inside its own region with an edge fade, so never wrap it in `overflow-hidden`. A row of buttons or chips uses `flex-wrap`, never `shrink-0`. Fixed widths (`min-w-*`, `w-[Npx]`) on content need a scroll container or a breakpoint override. Check 375, 768 and 1280.

---

## 2. Concentric Radius — The Two-Tier Rule

### Token Assignment (Role-Based, Not Shape-Based)

| Token | Value (medium preset) | Use On | NEVER Use On |
|---|---|---|---|
| `--radius-panel` | 16px | Cards, dialogs, modals, popovers, menus, accordions, accordion items, callouts, panels | Buttons, inputs, badges, chips, switches |
| `--radius-lg` | 8px | Buttons, inputs, badges, chips, icon buttons, switches, single-line controls | Cards, dialogs, panels, accordion items |
| `--radius-sm` | 4px | Tiny standalone shapes (swatches, carets). Never a nested inner radius: the floor applies | — |
| `rounded-full` | 9999px | Avatar, pill Badge, Switch thumb ONLY | Any panel, card, or container |

### Concentric Formula

- **R_inner = max(floor, R_outer − P)**, floor = min(radius-lg, radius-panel / 2); P = padding between container wall and inner element.

```
Card [--radius-panel, p-5] → inner button [--radius-lg] ✓
Card [--radius-panel, p-4] → inner chip [rounded-panel-p4] ✓
Popover [--radius-panel, p-3] → inner list item [rounded-panel-p3] ✓
```

### Hard Rules

- **NEVER** use literal `rounded-lg`, `rounded-xl`, `rounded-2xl` — always `rounded-[var(--radius-panel)]` for containers or `rounded-[var(--radius-lg)]` for controls.
- **NEVER** use `--radius-lg` on a container/panel (breaks at "Full" preset → stadium capsule).
- **NEVER** use `--radius-panel` on a control (breaks at "Full" preset → oversized pill).
- Nested surfaces: `rounded-panel-p3` (outer p-3), `rounded-panel-p5` (outer p-5).

---

## 3. Concentric Spacing

- **RULE:** outer containers hold more space than inner elements — padding decreases as nesting depth increases (Page > Container > Surface > Element). If child padding ≥ parent padding → hierarchy broken.
- Zone ranges and section rhythm: `visual-compositor/concentric-laws.md` (Law 2), via `get_skill({ name: "visual-compositor", section: "concentric-laws" })`.
- **NEVER** put `px-*` on `<section>` — section is full-bleed, Container is the gutter.
- **RULE:** page body width: every body section uses `<Container size="lg">` (72rem) so all content shares one centred column with visible margins at 1280 and 1440. `xl` (88rem) is for the nav and footer only; `full` only for media or FX that should bleed (`shavin-webpage` Rule 5).
- **NEVER** use arbitrary values (`py-[73px]`) — breaks rhythm.

---

## 4. Typography Color Hierarchy

| Context | Token | Class |
|---|---|---|
| **Title / Heading** | `--fg` | `text-fg`, `<Text weight="semibold">` |
| **Paired description** (immediately under title) | `--fg-subtle` | `text-fg-subtle`, `color="subtle"` |
| **Standalone text** (no adjacent title) | `--fg-muted` | `text-fg-muted`, `color="muted"` |
| **Micro labels / metadata** | `--fg-subtle` | `text-fg-subtle`, `color="subtle"` |

> **CRITICAL:** Paired descriptions MUST use `--fg-subtle`, NEVER `--fg-muted`.
> `--fg-muted` sits optically close to `--fg` → creates homogeneous grey block, no hierarchy.
> **Contrast:** `--fg-subtle` passes WCAG 2.2 AA on every dark surface (5.7:1 on the canvas, 5.1:1 on cards, 4.8:1 elevated), so paired descriptions use it in light and dark.

---

## 5. Font Loading Protocol

1. **PREFERRED**: Shavin native font loader from `@shavin/ui/lib/theme-presets`:
   - `applyDisplayFontPreset(name)` → sets `--font-display`
   - `applyBodyFontPreset(name)` → sets `--font-body`
   - `applySubheadingFont("body" | "display" | name)` → sets `--font-subheading` (h3-h6; default body)
   - `loadGoogleFont(name)` → dynamic injection w/ duplicate guard
2. **FALLBACK ONLY**: `next/font/google` in `layout.tsx` or raw `<link>` tags.
3. **NEVER** hardcode `@import url(...)` or raw `<link rel="stylesheet">` in components.

### Font Pairing by Mode

| Mode | Display | Body | Rule |
|---|---|---|---|
| STRUCTURAL | Inter | Inter | Same font — differentiate via size/weight only |
| MARKETING | Fraunces (default) | Inter | Serif display + neutral body |
| EDITORIAL | Fraunces italic (default) | Inter | Extreme scale contrast (6:1 min) |
| HYBRID | Marketing hero → STRUCTURAL app section | — | Switch at section boundary, never mid-section |

---

## 6. Animation & Transitions

- Animate **compositor-only** properties: `transform`, `opacity`.
- **NEVER** animate layout geometry: `width`, `height`, `top`, `left`.
- **NEVER** use `transition: all` — list properties explicitly.
- Overlay/drawer: `overscroll-behavior: contain` to prevent canvas scroll bleed.

---

## 7. Anti-Slop Copywriting

> **Governing principle:** Write domain-specific, precise microcopy — never generic tech marketing. See `visual-compositor/anti-patterns.md` AP-10 & AP-11 for the full catalogue.

- ❌ Vacuous tech clichés: *"Empower your workflow"*, *"Revolutionize your efficiency"*, *"Seamless intelligence"*
- ❌ Binary contrast tropes: *"It's not just a dashboard. It's your command center."*
- ❌ Throat-clearing openers: *"In today's fast-paced digital ecosystem..."*
- ❌ Lazy placeholders: `"Card Title"`, `"Lorem ipsum"`, `"John Doe"`, `"user@example.com"`
- ✅ Domain-specific telemetry: `p99: 42ms`, `99.98% SLA`, `14.2 GB / 20 GB allocated`
- ✅ Precise action labels: *"Generate API Key"*, *"Deploy to Production"*, *"Invite Teammate"*

---

## 8. Monospace Restraint

`font-mono` reserved for **code representations only**: code blocks, inline `<code>`, CLI commands, raw token keys, hashes, API endpoints.

- ❌ NOT on standard UI labels, filter popover headers, component names in galleries, metric units.
- ✅ OK on code snippets, JSX syntax, CSS variables, git SHAs, raw hex strings.
- Exception: project explicitly configured w/ monospace display/body font (Brutalist mode).

---

## 9. Icons — No Emojis, No Glyphs, `<Icon>`

1. **NEVER** use emoji or Unicode glyphs (✓, ★, →, ▶, •, ✗) in UI, docs or generated output: they render inconsistently across platforms. Use `<Icon>`.
2. **NEVER** hand-write or paste inline `<svg>` icons.
3. **ALWAYS** use `<Icon>` from `@shavin/ui`:
   ```tsx
   <Icon name="Check" size="sm" color="subtle" />                     // by name: PascalCase or kebab-case, case-insensitive
   <Icon icon={Settings} size="md" color="muted" strokeWidth={1.5} /> // by component
   ```
   - Sizes: `xs` 12, `sm` 16, `md` 20, `lg` 24, `xl` 32, `2xl` 40, `3xl` 48px, or a number.
   - Colors: `default`, `subtle`, `muted`, `brand`, `contrast`, `success`, `warning`, `danger`, `inherit`.
   - Never the sparkles icon (any library) or sparkle emoji unless the user asks: it is AI-slop shorthand for "AI feature".
4. Libraries registered in `<Icon>`: Lucide (default, `strokeWidth` 0.5–3.0), Phosphor, Radix Icons, Material. Others are not in the name lookup.
5. **ALWAYS** use the SVG from the project `assets/` folder for logos and wordmarks; never recreate one as inline SVG or text.

- Mappings: ✓ → `Check`, ★ → `Star` (brand), → → `ArrowRight`, ▶ → `Play`, ✗ → `X`, list bullet → `Check` xs brand.
- Feature lists: `<Flex direction="row" align="center" gap="2">` with `<Icon name="Check" size="sm" color="brand" />` and `<Text size="sm" color="subtle">`. Never `✓ text`.
- Exceptions: `currentColor` brand-logo SVGs from `assets/`; CSS-drawn checkmarks on native checkboxes; the `IconPicker` primitive.

---

## 10. Live Browser Bridge (MCP-First)

- Verify token and layout compliance with `get_live_audit` before reaching for screenshots.
- Always pass the route: `get_live_audit({ path: "/foundations/colors" })`. Each browser tab is isolated; without `path` and with several tabs open, the result is a summary across all of them.
- After editing, call `wait_for_live_clean({ path })` and fix whatever it still reports before ending your turn.

---

## 11. Responsive Design & Breakpoint Overrides

Shavin uses a **3-tier breakpoint cascade** for responsive design. The base (desktop) value is always defined without a suffix; tablet and mobile overrides use `@tablet` / `@mobile` suffixes on the same prop key.

**Prefer layouts that adapt by themselves before reaching for overrides:** rows of cards use `<Grid columns="auto" minWidth="sm">` (wraps to the container's width), app screens use `<AppFrame>` (its `Sidebar` turns into a drawer when the frame is narrow; put `<SidebarTrigger />` in the TopBar, never a hand-written hamburger/Drawer). Use the suffix cascade below only for changes these cannot express.

### Prop Suffix Convention

| Breakpoint | Suffix | Tailwind Prefix | Trigger |
|---|---|---|---|
| Desktop (base) | *(none)* | *(none)* | Default |
| Tablet | `@tablet` | `max-lg:` | `< 1024px` |
| Mobile | `@mobile` | `max-md:` | `< 768px` |

### Supported Responsive Props

`columns`, `rows`, `gap`, `direction` / `flexDir`, `align` / `items`, `justify`, `wrap`, `padding`, `width`, `height`. Style props (margin, font size, text align, display) also accept the suffixes.

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

- **Base is always desktop.** Never omit the base value — overrides only apply at narrower breakpoints.
- **Mobile wins over tablet.** The cascade emits mobile (`max-md:`) after tablet (`max-lg:`), so the narrower override takes precedence at small widths.
- **Only override what changes.** Don't duplicate the full prop set at every breakpoint. Text size, color, and most visual props rarely need breakpoint overrides.
- **Use `frame` option** in `compose_to_canvas` / `inject_blocks` to create separate mobile/tablet frames for side-by-side preview, not as a substitute for prop overrides.

---

## 12. Atmospheric Depth, Asset Selection & Anti-Slop Visuals

> **Governing principle:** Token purity permits rich atmospheric layering — never confuse it with flat, sterile wireframes. Prefer typographic hierarchy over decorative elements. See `visual-compositor/anti-patterns.md` (AP-01 through AP-13) for the full named catalogue with code examples and remediation.

- **NEVER** produce flat sterile wireframes (AP-01) — use layered depth: pastel mesh backdrops, gradient scrims, frosted glass panels (`bg-surface/80 backdrop-blur-md border border-hairline/70`).
- **NEVER** use `bg-brand/20 blur-3xl` glow orbs (AP-02) — use diffuse pastel meshes with mask dissolves instead.
- **NEVER** cliché stock or tiny screenshots (AP-03) — use Lummi/Unsplash photos, meshes, or video behind a scrim (`bgImage`/`bgVideo`/`bgOverlays`). 3D = decoration only.
- **NEVER** scatter `<Badge>` components for section labels (AP-04). A section label is optional: use plain overline text (`uppercase tracking-wider text-fg-subtle`) only where it adds information, at most one per page region. Badge is for stateful labels only.
- **NEVER** dump paragraph walls (AP-05), metric clutter in heroes (AP-06), or kitchen-sink bento grids (AP-07) — one clear thought per section, generous breathing room.
- **NEVER** over-contain with nested cards (AP-09) — proximity before containers.

---

## 13. No-MCP Fallback & MCP Dense-Mode Compatibility

- 💡 If `shavin-mcp` is connected: call `get_skill({ name, section })` / `get_tokens` / `validate_code`.
- 💡 Otherwise (No-MCP): read the skill file directly (`.agents/skills/<name>/<file>.md`) — same content — and lint with `npx -p @shavin/skills shavin-lint-tokens <file-or-glob>`, which mirrors `validate_code` exactly: hex, `rgb()`/`rgba()`, raw `--n-*`, literal radius utilities, wrong spacing literals. Node 22+.
- **RULE (skill authors):** MCP dense mode (`get_skill`, default `density: "dense"`) drops plain paragraphs and blockquotes that lack hard signal words. Write rules and MCP tips as bullets or tables, never `>` blockquotes.

---

## 14. Container Children Spacing — No Accidental Flush Stacking

- **Problem:** `Card`, `Container`, and raw `<div>` wrappers do NOT auto-space their children — multiple children stack flush (zero gap) unless spacing is explicit. A `Card` has `padding` (default `none`: set `sm` 16px, `md` 20px, `lg` 24px or `xl` 32px) but no `gap`. This is the #1 cause of "packed without spacing" layouts.

### Rules

1. **NEVER place multiple text/element children directly inside a `Card` without spacing.** A `Card` has `padding` (wall-to-content) but no `gap` (child-to-child). Children will stack flush.

2. **ALWAYS use one of these patterns for children inside a container:**

| Pattern | When | Example |
|---------|------|---------|
| `<Flex direction="column" gap="3">` wrapper | Structured vertical groups | Card body with heading, text, button |
| `space-y-3` on the container's className | Simple text stacks | Paragraphs in a div |
| `<Flex direction="row" gap="2">` | Horizontal items | Icon + text pairs, button groups |

3. **Card body pattern — always wrap children in a Flex.** Spacing comes from `gap`; do not add `my-*` / `mt-*` margins on children (they stack on top of the gap):
   ```tsx
   // ✅ Correct — Flex wrapper with gap
   <Card padding="md">
     <Flex direction="column" gap="3">
       <Text size="md" weight="semibold">Free</Text>
       <Text size="xs" color="subtle">For individuals</Text>
       <Text size="md" weight="bold">$0</Text>
       <Separator />
       <Flex direction="column" gap="2">
         <Flex direction="row" align="center" gap="2">
           <Icon name="Check" size="sm" color="brand" />
           <Text size="sm" color="subtle">Up to 3 projects</Text>
         </Flex>
       </Flex>
       <Button variant="outline" className="w-full">Get Started</Button>
     </Flex>
   </Card>

   // ❌ Wrong — children stack flush, no spacing
   <Card padding="md">
     <Text>Free</Text>
     <Text>For individuals</Text>
     <Text>$0</Text>
     <Separator />
     <Text>✓ Up to 3 projects</Text>
     <Button>Get Started</Button>
   </Card>
   ```

4. **Grid gap vs card padding:** Grid `gap` spaces the cards themselves. Inside each card, use a `Flex` wrapper with its own `gap` for card-internal spacing. These are independent — one does not substitute for the other.

5. **Section-level spacing:** The `Section` primitive has **no padding by default** (`size="none"`) — a bare `<Section>` is a flat full-bleed band. Always give a content section its vertical breathing: set `size` (`compact` dashboards · `strip` logo/stat bars · `body` most content, py-16/24 · `hero` heroes/CTAs, py-24/32) or a `py-16`/`py-24` className. Leave it unset only for utility screens (auth, 404, app shells) or when you set custom `py-*`. The header block (heading + subtext) uses `mb-10` or `mb-12` to separate from content below. Never less than `mb-8`.

6. **BlockNode trees (Studio):** same rule: set `gap` on `Flex` / `Grid` and wrap `Card` children in a `Flex` with `gap` (details in `shavin-studio`).

## 15. Studio

- Connected Studio session only: prop names, BlockNode rules and what the parser drops are in the `shavin-studio` skill (`get_skill({ name: "shavin-studio" })`). AGENTS.md says when to load it.

---
name: core-rules
description: >
  Shared foundation rules for @shavin/ui — token compliance, concentric geometry,
  typography hierarchy, font loading, animation, and anti-slop standards.
  Auto-injected by MCP into every get_skill call. Never duplicate these in domain skills.
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

### Semantic Token Quick Reference

| Role | Token | Use For |
|---|---|---|
| Backgrounds | `bg-canvas`, `bg-surface`, `bg-surface-hover`, `bg-surface-raised` | Page, cards, hover states, elevated panels |
| Foreground | `text-fg`, `text-fg-subtle`, `text-fg-muted`, `text-accent` | Titles, descriptions, meta, accent text |
| Borders | `border-hairline`, `border-hairline-strong` | Resting cards/dividers (`hairline`), hover/active/featured states (`hairline-strong`). Reserve `border-accent` exclusively for expressive marketing moments where vibrant brand color is demanded; never for standard cards, apps, dashboards, or docs. |
| Accent | `bg-accent`, `bg-accent-subtle` | CTA backgrounds, highlight fills |

---

## 2. Concentric Radius — The Two-Tier Rule

### Token Assignment (Role-Based, Not Shape-Based)

| Token | Value (medium preset) | Use On | NEVER Use On |
|---|---|---|---|
| `--radius-panel` | 12px | Cards, dialogs, modals, popovers, menus, accordions, accordion items, callouts, panels | Buttons, inputs, badges, chips, switches |
| `--radius-lg` | 8px | Buttons, inputs, badges, chips, icon buttons, switches, single-line controls | Cards, dialogs, panels, accordion items |
| `--radius-sm` | 6px | Dense list rows, inline tags, toolbar items | — |
| `rounded-full` | 9999px | Avatar, pill Badge, Switch thumb ONLY | Any panel, card, or container |

### Concentric Formula

- **R_inner = max(floor, R_outer − P)**, floor = min(radius-lg, radius-panel / 2); P = padding between container wall and inner element.

```
Card [--radius-panel, p-5] → inner button [--radius-lg] ✓
Card [--radius-panel, p-4] → inner chip [--radius-sm] ✓
Popover [--radius-panel, p-3] → inner list item [--radius-md] ✓
```

### Hard Rules

- **NEVER** use literal `rounded-lg`, `rounded-xl`, `rounded-2xl` — always `rounded-[var(--radius-panel)]` for containers or `rounded-[var(--radius-lg)]` for controls.
- **NEVER** use `--radius-lg` on a container/panel (breaks at "Full" preset → stadium capsule).
- **NEVER** use `--radius-panel` on a control (breaks at "Full" preset → oversized pill).
- Nested surfaces: `rounded-panel-p3` (outer p-3), `rounded-panel-p5` (outer p-5).

---

## 3. Concentric Spacing

- **RULE:** outer containers hold more space than inner elements — padding decreases as nesting depth increases.

### Four Spatial Zones (strict order: Page > Container > Surface > Element)

| Zone | Tailwind Range | Covers |
|---|---|---|
| **Page** | `py-16 md:py-24` to `py-24 md:py-32` | Full-bleed section backgrounds |
| **Container** | `px-4 md:px-6 lg:px-10` | Max-width centering wrapper |
| **Surface** | `p-4` to `p-8` | Card, panel, dialog body, sidebar |
| **Element** | `px-2 py-1` to `px-4 py-2` | Button, input, badge internals |

- **NEVER** put `px-*` on `<section>` — section is full-bleed, Container is the gutter.
- **NEVER** use arbitrary values (`py-[73px]`) — breaks rhythm.
- If child padding ≥ parent padding → hierarchy broken.

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
> **Contrast exception:** measure it. `--fg-subtle` is 4.09:1 on the dark canvas and 3.67:1 on dark cards, below WCAG AA (4.5:1). On dark themes use `--fg-muted` for text that carries meaning (descriptions, body, needed metadata); keep `--fg-subtle` for decorative micro labels.

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

## 9. Icon System — No Emojis, No Glyphs, `<Icon>` Component

### Absolute Rules

1. **NEVER use emoji characters OR Unicode glyphs** (✓, ★, →, ✔, ✗, ▶, •, etc.) in any application UI, documentation page, tool, or generated output. They render inconsistently across platforms, break visual coherence, and clash with a professional design system. Use the `<Icon>` component instead.

2. **NEVER create standalone inline SVG icons.** Do not hand-write `<svg><path d="..."/></svg>` or paste icon SVG markup into components, pages, or tools. Inline SVGs bypass icon library management, lack consistency, and create maintenance debt.

3. **ALWAYS use the `<Icon>` component from `@shavin/ui`** as the sole icon system:
   ```tsx
   import { Icon } from "@shavin/ui";
   // By name (resolves from Lucide/Phosphor/Radix registry):
   <Icon name="Check" size="sm" color="subtle" />
   <Icon name="Star" size="sm" color="accent" />
   // By direct component reference:
   <Icon icon={Settings} size="md" color="muted" strokeWidth={1.5} />
   ```
   - **Size tokens:** `xs` (12px), `sm` (16px), `md` (20px), `lg` (24px), `xl` (32px), `2xl` (40px), `3xl` (48px). Or numeric pixel value.
   - **Color tokens:** `default`, `subtle`, `muted`, `accent`, `contrast`, `success`, `warning`, `danger`, `inherit`.
   - **Never use the sparkles icon** (any library) or sparkle emoji, unless the user asks. It is AI-slop shorthand for "AI feature".
   - **Icon name lookup:** PascalCase (`Check`, `ArrowRight`) or kebab-case (`arrow-right`, `alarm-clock`). Resolution is case-insensitive with dash/underscore normalization.
   - For raw React/Next.js (outside `@shavin/ui`): `import { Check, Star, Settings } from "lucide-react"` then `<Check className="w-4 h-4" />`.
   - In standalone HTML files: load via `<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>`, use `<i data-lucide="check"></i>`, then call `lucide.createIcons()` after every DOM update.

4. **Supported icon libraries** (registered in `@shavin/ui` IconPicker):
   | Library | Import | Notes |
   |---------|--------|-------|
   | **Lucide** | `lucide-react` | Default. Supports `strokeWidth` (0.5–3.0). |
   | **Phosphor** | `@phosphor-icons/react` | Alternative style. |
   | **Radix Icons** | `@radix-icons/react` | Minimal set. |
   | **Material** | (registered) | Additional set. |
   Other libraries can be added as React code but are not pre-registered in the `<Icon>` component's name lookup.

5. **ALWAYS use brand assets** from the project `assets/` folder for logos and wordmarks — never recreate a logo as inline SVG or text. Reference the existing SVG file.

### Common Icon Replacements

| Never use | Use instead |
|-----------|-------------|
| `✓` / `✔` checkmark glyph | `<Icon name="Check" size="sm" color="subtle" />` |
| `★` / `☆` star glyph | `<Icon name="Star" size="sm" color="accent" />` |
| `→` / `→` arrow glyph | `<Icon name="ArrowRight" size="sm" />` |
| `▶` play glyph | `<Icon name="Play" size="sm" />` |
| `•` bullet in Feature lists | `<Icon name="Check" size="xs" color="accent" />` |
| `✗` / `✕` close glyph | `<Icon name="X" size="sm" />` |
| Any emoji (🔥, ✨, etc.) | Corresponding Lucide icon via `<Icon>` |

### Pattern: Feature List with Icons

Instead of text glyphs (`✓ Unlimited projects`), use:

```tsx
<Flex direction="column" gap="2">
  <Flex direction="row" align="center" gap="2">
    <Icon name="Check" size="sm" color="accent" />
    <Text size="sm" color="subtle">Unlimited projects</Text>
  </Flex>
  <Flex direction="row" align="center" gap="2">
    <Icon name="Check" size="sm" color="accent" />
    <Text size="sm" color="subtle">Priority support</Text>
  </Flex>
</Flex>
```

- **Why:** `<Icon>` shares stroke/optical weight across the set, inherits `currentColor` from theme tokens, and scales on the typography size tokens; emojis and glyphs do none of this.

### Permitted Exceptions

- `currentColor`-based brand logo SVGs sourced from the project `assets/` folder (e.g., `shavin-logo.svg`).
- CSS-drawn checkmarks on native checkboxes (`::after` with border trick) — not icons, just state indicators.
- `@shavin/ui` `IconPicker` primitive — this is the icon management component, not a standalone SVG.

---

## 10. Live Browser Bridge & Verification Protocol (MCP-First)

AI agents working in Shavin projects must leverage the real-time Browser Bridge daemon (:7036) for zero-latency, zero-hallucination DOM verification.

### Core Rules

1. **MCP-First over Screenshots:** When validating visual token compliance or layout correctness, ALWAYS query `get_live_audit` via `shavin-mcp` first. Do NOT default to taking browser screenshots or guessing DOM states.
2. **Targeted Route Protocol (Multi-Tab Isolation):**
   - When inspecting or fixing a specific page, ALWAYS pass the explicit route:
     ```ts
     get_live_audit({ path: "/foundations/colors" })
     trigger_live_rescan({ path: "/foundations/colors" })
     wait_for_live_clean({ path: "/foundations/colors" })
     ```
   - Each browser tab maintains its own isolated stream and session ID (`tabId`). Target by `path` to prevent crosstalk if the human developer has other tabs open in another browser (Chrome, Arc, Brave, Safari).
   - Calling `get_live_audit()` without a `path` when multiple tabs exist returns a consolidated summary across all active browser windows.
3. **Closed-Loop Code Fixes:** After editing a component or page:
   - Call `wait_for_live_clean({ path: "<route>" })` to block until Vite/Next.js HMR settles and the DOM reports 0 violations.
   - If violations remain, refactor offending styles immediately before concluding your turn.

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
- **NEVER** use `bg-accent/20 blur-3xl` glow orbs (AP-02) — use diffuse pastel meshes with mask dissolves instead.
- **NEVER** cliché stock or tiny screenshots (AP-03) — use Lummi/Unsplash photos, meshes, or video behind a scrim (`bgImage`/`bgVideo`/`bgOverlays`). 3D = decoration only.
- **NEVER** scatter `<Badge>` components for section labels (AP-04) — use overline text (`uppercase tracking-wider text-fg-subtle`). Badge is for stateful labels only.
- **NEVER** dump paragraph walls (AP-05), metric clutter in heroes (AP-06), or kitchen-sink bento grids (AP-07) — one clear thought per section, generous breathing room.
- **NEVER** over-contain with nested cards (AP-09) — proximity before containers.

---

## 13. No-MCP Fallback & MCP Dense-Mode Compatibility

- 💡 If `shavin-mcp` is connected: call `get_skill({ name, section })` / `get_tokens` / `validate_code`.
- 💡 Otherwise (No-MCP): read the skill file directly (`.agents/skills/<name>/<file>.md`) — same content — and lint with `npx -p @shavin/skills shavin-lint-tokens <file-or-glob>` (or `node bin/lint-tokens.mjs`), which mirrors `validate_code` exactly: hex, `rgb()`/`rgba()`, raw `--n-*`, literal radius utilities, wrong spacing literals. Node 22+.
- **RULE (skill authors):** MCP dense mode (`get_skill`, default `density: "dense"`) drops plain paragraphs and blockquotes that lack hard signal words. Write rules and MCP tips as bullets or tables, never `>` blockquotes. Full details: `shavin-core` skill §1c.

---

## 14. Container Children Spacing — No Accidental Flush Stacking

- **Problem:** `Card`, `Container`, and raw `<div>` wrappers do NOT auto-space their children — multiple children stack flush (zero gap) unless spacing is explicit. This is the #1 cause of "packed without spacing" layouts.

### Rules

1. **NEVER place multiple text/element children directly inside a `Card` without spacing.** A `Card` has `padding` (wall-to-content) but no `gap` (child-to-child). Children will stack flush.

2. **ALWAYS use one of these patterns for children inside a container:**

| Pattern | When | Example |
|---------|------|---------|
| `<Flex direction="column" gap="3">` wrapper | Structured vertical groups | Card body with heading, text, button |
| `space-y-3` on the container's className | Simple text stacks | Paragraphs in a div |
| `<Flex direction="row" gap="2">` | Horizontal items | Icon + text pairs, button groups |

3. **Card body pattern — always wrap children in a Flex:**
   ```tsx
   // ✅ Correct — Flex wrapper with gap
   <Card padding="md">
     <Flex direction="column" gap="3">
       <Text size="md" weight="semibold">Free</Text>
       <Text size="xs" color="subtle">For individuals</Text>
       <Text size="md" className="font-extrabold">$0</Text>
       <Separator className="my-3" />
       <Flex direction="column" gap="2">
         <Flex direction="row" align="center" gap="2">
           <Icon name="Check" size="sm" color="accent" />
           <Text size="sm" color="subtle">Up to 3 projects</Text>
         </Flex>
       </Flex>
       <Button variant="outline" className="w-full mt-4">Get Started</Button>
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

6. **For BlockNode trees (MCP injection):** Set `gap` prop on `Flex`/`Grid` containers, and wrap `Card` children in a `Flex` block with `gap`:
   ```json
   {
     "type": "Card",
     "children": [
       {
         "type": "Flex",
         "props": { "direction": "column", "gap": "3" },
         "children": [
           { "type": "Text", "props": { "size": "md", "weight": "semibold", "children": "Free" } },
           { "type": "Text", "props": { "size": "xs", "color": "subtle", "children": "For individuals" } }
         ]
       }
     ]
   }
   ```


## 15. Studio Prop Name Reference — Use Field Keys, Not CVA Prop Names

> **Note:** Studio's block registry field keys now match `@shavin/ui` CVA prop names exactly. Use the prop names you see in the component docs — they work as-is in Studio.

### Prop Reference — Key Names That Match CVA

| Component | Prop | Valid values |
|-----------|------|--------------|
| Text / Heading | `weight` | `inherit`, `normal`, `medium`, `semibold`, `bold` |
| Text | `size` | Body: `inherit`, `xs`, `sm`, `md`, `lg`, `overline`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9` |
| Heading | `size` | `inherit`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4`, `5`, `6`, `7`, `8`, `9` |
| Text | `color` | `inherit`, `default`, `muted`, `subtle`, `accent`, `danger`, `link` |
| Icon | `name` | Lucide icon name (PascalCase: `Check`, `Star`, `ArrowRight`) |
| Container | `size` | `xs`, `sm`, `md`, `lg`, `xl`, `full` |
| Button | `tone` | Only `accent`, `danger`. For neutral look use `variant="ghost"` without `tone` |
| Flex | `direction` | `row`, `column`, `row-reverse`, `column-reverse` (NOT `col`) |

### Anti-Conflict Rule — Never Set the Same Style via Both Prop and className

```tsx
// ❌ WRONG — size prop AND text-3xl className both set font size → conflict
<Heading size="7" className="text-3xl font-bold">Title</Heading>

// ✅ CORRECT — use prop for size, className only for non-field styling
<Heading size="7">Title</Heading>

// ✅ ALSO CORRECT — use className only, skip the prop
<Heading className="text-3xl font-bold">Title</Heading>
```

The JSX import parser splits `className` into recognized props + custom props. Setting `size="7"` AND `className="text-3xl"` creates two competing `x-fontSize` entries. Pick one approach per style property.

### Raw HTML Elements — Not Supported in Studio

Studio's JSX parser only recognizes `@shavin/ui` component tags plus a few HTML tags (`div`, `span`, `p`, `h1`–`h6`, `button`, `img`, `video`). Raw `<ul>`, `<li>`, `<section>`, `<header>`, `<nav>` etc. are dropped — their children are lifted but any classes/styles on the wrapper are lost.

| ❌ Don't use | ✅ Use instead |
|---|---|
| `<ul className="space-y-3">` | `<Flex direction="column" gap="3">` |
| `<li className="flex items-center gap-2">` | `<Flex direction="row" align="center" gap="2">` |
| `<section className="py-24">` | `<Box className="py-24">` or `<Section>` |
| `<header>` / `<footer>` / `<nav>` | `<Box>` / `<Flex>` / `<Section>` |
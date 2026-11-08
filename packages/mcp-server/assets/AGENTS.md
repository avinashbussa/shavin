# @shavin/ui — Agent Rules

<!-- Written by @shavin/cli init or the MCP install_skills tool. Regenerate with `npx @shavin/skills --force`. -->

> **Start here:** read [`SHAVIN.md`](./SHAVIN.md), this project's design brief (product, theme, site type, visual mode), before any UI task, or call `get_project_context()` via `shavin-mcp`. The rules and skills below take their defaults from it.
>
> 💡 **MCP Guidance:** Call `get_guidelines({ section: "<topic>" })` or `get_components({ name: "<name>" })` via `shavin-mcp` to query full component tables, Radix gotchas, or ThemeProvider specs.

This project uses `@shavin/ui`: a strict two-tier token architecture, accessible React primitives, and an MCP server that grounds AI agents in the real components and tokens. Follow these rules for every UI change.

---

## 0. Mandatory 3-Step UI Execution Protocol (Anti-Slop Law)

Whenever asked to create, design, refine, iterate on, or review any component, block, screen, or page layout in this project, you MUST follow this 3-step loop:

1. **Step 1 (Pre-Flight DS Lookup — No Parametric Memory Slop)**:
   - **NEVER** invent JSX markup, prop names, or Tailwind classes from generic LLM training memory.
   - **ALWAYS** query `@shavin/ui` primitives via `get_components({ name })` or read its entry in `components.json`.
   - **ALWAYS** verify tokens via `get_tokens()` or `tokens.json`.
   - When building full sections or pages, **plan first**: `plan_page({ brief })` picks a composition per section from `layout-compositions/` (55 compositions across 9 families), with treatment and motion tier; fill it, save it as `.shavin/plans/<page>.json` and run `check_page({ plan })`. Build each section as `<Section data-composition="<ID>">`, fetching its family with `get_skill({ name: "layout-compositions", section: "<family>" })`. No MCP? Use `/compose-page`.

2. **Step 2 (Anti-Slop Laws & Concentric Math)**:
   - **Zero AI Slop**: Ban decorative floating glow balls/mesh circles, badge soup for non-state text, vacuous copywriting clichés ("Revolutionize your workflow", "It's not X. It's Y."), and excessive card borders/containment.
   - **Strict Token Purity**: Only semantic classes (`bg-surface`, `text-fg`, `text-fg-subtle`, `border-hairline`). ZERO raw hex (`#...`), ZERO `rgb(...)`, ZERO `--n-*` foundation vars.
   - **Concentric Radius**: Controls use `rounded-[var(--radius-lg)]`; containers use `rounded-[var(--radius-panel)]`. Inner radius must satisfy $R_{\text{inner}} = \max(\text{floor}, R_{\text{outer}} - P)$, floor $= \min(\text{radius-lg}, \text{radius-panel}/2)$.
   - **Container Spacing**: Always wrap `Card` children in `<Flex direction="column" gap="3">` (or `space-y-3`). Never stack children flush.

3. **Step 3 (Post-Flight Validation)**:
   - Run `validate_code({ code })` or `npm run lint` before presenting final code to ensure zero token violations or class misspellings, then `check_page({ targetDir })` so every section matches its planned composition.

---

## 1. Core Mental Model (Two Tiers)

1. **Foundation tokens** — raw palette scale (`--n-0` through `--n-1000`) defined in `@shavin/ui`'s `global.css`. **Never reference `--n-*` outside `global.css`.**
2. **Semantic tokens** — role-based (`--bg-canvas`, `--fg`, `--accent`, `--hairline`), remapped per theme (`:root` = light, `.dark` = dark). **Every component uses ONLY these via Tailwind utilities** (`bg-surface`, `text-fg`, `border-hairline`) — never a raw hex, never `rgb()`, never an `--n-*` var.

To learn legal tokens, call `get_tokens()` or read `tokens.json`.

---

## 2. Directory Layout & Imports

Everything comes from the `@shavin/ui` package root; you never need its internal folders.

| Where | What |
|---|---|
| `@shavin/ui` | Every primitive, `ThemeProvider`, `cn`, theme presets and helpers |
| `@shavin/ui/server` | Server-safe helpers (`cn`, URL helpers) for React Server Components |
| `node_modules/@shavin/ui/components.json` | Component manifest: props, variants, examples and guidance (`get_components`) |
| `node_modules/@shavin/ui/tokens.json` | Semantic token dictionary (`get_tokens`) |
| `.agents/skills/`, `.agents/commands/` | Installed agent skills and slash commands (`npx @shavin/skills`) |
| `SHAVIN.md` | This project's design brief: site type, mode, accent, density, radius |

> ⚠️ **Import Rule:** ALWAYS import from `@shavin/ui`. NEVER deep import from `@shavin/ui/primitives/...`.

---

## 3. Component Variant Pattern (cva + cn)

Every component with variants uses `class-variance-authority` merged with `cn()` (both exported from the `@shavin/ui` root):

```tsx
const panelVariants = cva("base classes", {
  variants: { size: { sm: "max-w-sm", md: "max-w-md" } },
  defaultVariants: { size: "sm" },
});

export function Component({ size, className, ...props }: VariantProps<typeof panelVariants> & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(panelVariants({ size }), className)} {...props} />;
}
```

---

## 4. Radix & Primitive Selection

Before reaching for Radix, check if native HTML solves the problem cleanly:

| Pattern | Engine | Key Rule / Primitive |
|---|---|---|
| Modals & Palette | Radix Dialog | Focus trap, ESC, outside click. `Spotlight`, `Dialog`. |
| Destructive Confirm | Radix AlertDialog | Focus defaults to Cancel, no outside-click dismiss. |
| Select / Dropdown | Radix Select | **Gotcha:** `value: ""` forbidden (reserved sentinel). Scroll via `Select.Viewport`. |
| Menus & Tooltips | Radix Popover/Menu/Tooltip | `collisionPadding={8}`, `align="start"`. Tooltips take `tone="auto|dark|light"`. |
| Controls & Switches | Radix Checkbox/Switch/Radio | Use native ARIA states. RadioGroupItem defaults `radius="full"`. |
| Shapes & Avatars | Radix Avatar/Slider/Badge | Escape hatch `radius="none|small|medium|large|full|inherit"`. Badge defaults `"inherit"`. |
| Native HTML | Plain Markup | `Dropdown` (native `<select>`), `DatePicker`, `TimePicker`, `Row`, `List`, `Button`. |

Any floating overlay surface MUST have `data-panel` attribute for translucent panel support.
Chevron convention: `ChevronRight` (rotated 90° down when expanded) for nav trees; `ChevronDown` (rotated 180° up when expanded) for accordions.

---

## 5. Concentric Radius & Spacing Rules

- **Controls (`--radius-lg`)**: Single-line inputs, buttons, badges, chips, switches. Go pill-shaped at "Full" preset (`rounded-[var(--radius-lg)]`).
- **Panels & Containers (`--radius-panel`)**: Cards, dialogs, popovers, menus, accordions, callouts. Intentionally capped at finite radius (`rounded-[var(--radius-panel)]`) — **NEVER** use `--radius-lg` on containers or accordions.
- **Concentric Nesting:** Inner radius must satisfy $R_{\text{inner}} = \max(\text{floor}, R_{\text{outer}} - P)$, floor $= \min(\text{radius-lg}, \text{radius-panel}/2)$. The floor keeps padded children from collapsing to square corners (0 only when the theme radius is 0); `concentricContainerStyle()` / `CONCENTRIC_FLOOR` apply it. Use concentric Tailwind utilities (`rounded-panel-p3`, `rounded-panel-p5`, `rounded-panel-inner`).
- **Tailwind Padding Scale Trap:** `p-5` is 20px (`1.25rem`), `p-3` is 12px (`0.75rem`). NEVER confuse `p-5` with 5px! Do not write inline `calc(...) - 5px` for `p-5`. Use `rounded-panel-p5`.
- **Literals forbidden:** Never use literal `rounded-lg`, `rounded-xl`, `rounded-2xl`. `rounded-full` allowed ONLY for pills, avatars, switches.

---

## 6. ThemeProvider

Mount once near app root to apply active theme presets:
```tsx
<ThemeProvider accentColor="grass" grayColor="gray" radius="large" scaling="95%" panelBackground="solid" />
```

---

## 7. Real-Time Agent-Browser Bridge (:7036)

AI agents can verify live DOM compliance directly without screenshots or human intervention:
- **`get_live_audit`**: Inspect active violations, contrast math, and connected tabs from `http://127.0.0.1:7036/api/audit`. Always pass `{ path: "/target/route" }` to isolate checks to the active work tab and avoid crosstalk when multiple tabs or browsers are open.
- **`trigger_live_rescan`**: Broadcast an SSE rescan command (optionally targeted via `{ path: "..." }`) to force an immediate re-audit.
- **`wait_for_live_clean`**: Block execution until zero violations remain after code changes (`{ path: "..." }` supported).
- **Standalone Command**: Developers can launch the monitor dashboard independently via `npm run bridge` or `npx @shavin/cli bridge`.

---

## 8. Pre-Flight Quality Gate

- [ ] All colors use semantic tokens (`bg-surface`, `text-fg`, `border-hairline`). Zero hex/rgb/`--n-*`.
- [ ] Container surfaces use `rounded-[var(--radius-panel)]`; controls use `rounded-[var(--radius-lg)]`.
- [ ] All floating panels have `data-panel` attribute.
- [ ] Typography contrast hierarchy: Title uses `text-fg`, paired description uses `text-fg-subtle` (`color="subtle"`), never `text-fg-muted`.
- [ ] Component uses `cva()` and merges `className` via `cn()`.
- [ ] Imports reference `@shavin/ui` root (no deep paths).
- [ ] `validate_code` reports zero errors.

---

## 9. Responsive Design & Breakpoint Overrides

Prefer layouts that adapt to their container before reaching for breakpoints:

- **App shells:** `AppFrame` with `Sidebar`; below 768px of the frame's own width the sidebar becomes a drawer and `<SidebarTrigger />` appears. Never hand-write a hamburger, a second nav copy or `hidden md:block` wrappers.
- **Card, stat and feature grids:** `Grid columns="auto"` with `minWidth` (and `maxColumns` to cap the track count). Not for bento or spanned layouts.
- **Headings:** `Heading` sizes `xl` and up are fluid. Pick the size for the widest layout; never add `md:text-*` steps.
- **Inside an AppFrame:** show or hide details with `shavin-frame-compact-only` / `shavin-frame-wide-only`, not viewport classes.

### Studio breakpoint overrides

When a design needs explicit per-breakpoint values (for example on the Studio canvas), Shavin Studio uses a **3-tier breakpoint cascade** for responsive design. The base (desktop) values are always defined without a suffix; tablet and mobile overrides use `@tablet` / `@mobile` suffixes on the same prop key.

### Prop Suffix Convention

| Breakpoint | Suffix | Tailwind Prefix | Trigger |
|---|---|---|---|
| Desktop (base) | *(none)* | *(none)* | Default |
| Tablet | `@tablet` | `max-lg:` | `< 1024px` |
| Mobile | `@mobile` | `max-md:` | `< 768px` |

### Supported Responsive Props

Layout props that accept `@tablet` / `@mobile` overrides:

| Prop Key | Responsive Utility |
|---|---|
| `columns` | `grid-cols-{n}` |
| `rows` | `grid-rows-{n}` |
| `gap` | `gap-{n}` |
| `direction` / `flexDir` | `flex-{value}` |
| `align` / `items` | `items-{value}` |
| `justify` | `justify-{value}` |
| `wrap` | `flex-{value}` |
| `padding` | `p-{n}` |
| `width` | `w-{value}` |
| `height` | `h-{value}` |

Style props (margin, padding, font size, text align, display, etc.) also accept `@tablet` / `@mobile` suffixes and are emitted as `max-lg:` / `max-md:` utilities.

### Example: Responsive Grid

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

Renders as: `grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-6 max-md:gap-4`

### Example: Responsive Flex Direction

```json
{
  "type": "Flex",
  "props": {
    "direction": "row",
    "direction@mobile": "col",
    "align": "center",
    "align@mobile": "start"
  }
}
```

Renders as: `flex-row max-md:flex-col items-center max-md:items-start`

### Agent Workflow for Responsive Design

1. **Get current state** — Call `get_studio_state` to read existing canvas blocks.
2. **Add `@mobile` / `@tablet` overrides** to the relevant block props in the returned block tree.
3. **Re-inject** — Call `inject_blocks` with `mode: "replace"` and the modified blocks.

**OR** — Use `compose_to_canvas` / `inject_blocks` with the `frame` option to create a separate mobile/tablet frame on the canvas:

```json
{
  "frame": {
    "title": "Mobile Hero",
    "device": "mobile",
    "width": 375,
    "height": 812
  }
}
```

This places a new mobile-sized frame alongside existing frames — useful for showing desktop and mobile variants side-by-side.

### Rules

- **Base is always desktop.** Never omit the base value — overrides only apply at narrower breakpoints.
- **Mobile wins over tablet.** The cascade emits mobile (`max-md:`) after tablet (`max-lg:`), so the narrower override takes precedence at small widths.
- **Don't duplicate the full prop set at every breakpoint.** Only override what changes (e.g. columns, gap, direction). Text size, color, and most visual props rarely need breakpoint overrides.
- **Use `frame` for viewport previews**, not for responsive design itself. Responsive design is achieved through prop overrides on a single design, not by creating separate frames per device.

---

## 10. Icon System & Container Children Spacing

### Icons — No Emojis, No Glyphs, Use `<Icon>` Component

- **NEVER** use emoji characters OR Unicode glyphs (✓, ★, →, •, ✔) in UI or generated output.
- **ALWAYS** use the `<Icon>` component from `@shavin/ui`: `<Icon name="Check" size="sm" color="accent" />`
- Size tokens: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`. Color tokens: `default`, `subtle`, `muted`, `accent`, `contrast`, `success`, `warning`, `danger`, `inherit`.
- Supported icon libraries: Lucide (default), Phosphor, Radix Icons, Material.
- For BlockNode trees (MCP injection): `{ type: "Icon", props: { name: "Check", size: "sm", color: "accent" } }`.
- Feature list pattern: wrap each item in `<Flex direction="row" align="center" gap="2">` with `<Icon>` + `<Text>`. Never inline glyphs in text content.

### Container Children Spacing — No Flush Stacking

- `Card`, `Container`, and `<div>` do NOT auto-space children. Multiple children stack flush (zero gap).
- **ALWAYS wrap Card children in `<Flex direction="column" gap="3">`** or add `space-y-3` to the container's className.
- Grid `gap` spaces cards in the grid. Inside each card, use a `Flex` wrapper with its own `gap` for card-internal spacing. These are independent.
- For BlockNode trees: always wrap Card's children in a `Flex` block with `gap` prop.

---

<!-- @shavin/skills:reference -->
## Shavin Design System Skills & Agent Activation Guide

This project uses `@shavin/ui`. AI agents MUST load skills on demand based on the user's intent.

### 🚀 First-Message Bootstrap Protocol

On the **first user message** in a Shavin project, execute this 4-step bootstrap before producing any output:

1. **Read project context** — Read `SHAVIN.md` from the project root (or call `get_project_context()` via `shavin-mcp` if connected). Extract: site type, default visual mode, accent, density, radius, panel background.
2. **Match the request against the Activation Matrix** below — first match wins. Pick the skill and visual mode.
3. **Always-loaded files are already in your context** (if MCP injected them): `core-rules.md`, `cognitive-layer.md`, `concentric-laws.md`, `spacing-core.md`, `layout-restraint.md`, `typography-rules.md`, `interface-polish.md`, `motion-and-physics.md`. If not injected, read `core-rules.md` first — it contains token invariants and anti-slop rules.
4. **Load on-demand files** per the resolved mode. Key on-demand files:
   - `visual-compositor/anti-patterns.md` — Load whenever composing or reviewing blocks/screens. Contains 13 named AI-slop anti-patterns (AP-01–AP-13) with code examples, remediation, and a decision table. The governing principle: *prefer typographic hierarchy over decorative elements for structural labeling; reserve badges/pills/chips for stateful information only.*
   - `visual-compositor/audit-checklist.md` — Load at the END of layout tasks for final verification.
   - `shavin-webpage/` files — Load for marketing/landing page architecture, editorial craft, and style recipes.
   - `layout-compositions/` — Load for any page/section layout work: 55 compositions across 9 families, selection guide, treatments, foundations, page recipes.
   - `layout-motion/` — Load for Tier 1 restrained motion (reveals, hovers, count-ups, marquees).
   - `layout-choreography/` — Load for Tier 2 cinematic/awwwards motion (pinned scrollytelling, scroll-scrubbed timelines, horizontal scroll, split-text reveals).
   - `shavin-app/SKILL.md` — Load for SaaS/dashboard tasks.
   - Command files (`.agents/commands/`) — Load when the user invokes a `/create-screen`, `/create-block`, etc.

- 💡 **If `shavin-mcp` is connected:** Call `list_skills()` to enumerate all skills + headings, or `get_skill({ name, section })` to fetch targeted instructions. Call `list_commands()` to enumerate slash commands.
- 💡 **Otherwise (No-MCP):** Read the `.md` files directly from `.agents/skills/` and `.agents/commands/`.

### 🎯 Agent Activation Matrix (When to Load What)

| Task / Intent | Required Skill / Module | Key Directives to Enforce |
|---|---|---|
| **Marketing / Landing / Hero / Pricing / Launch** | `.agents/skills/shavin-webpage/` (`page-architecture.md`, `editorial-craft.md`, `style-recipes.md`) + `.agents/skills/layout-compositions/` | 12-section vertical reading arc, conversion copywriting formulas ("{Outcome} without {pain}"), 55 layout compositions across 9 families with metadata, selection guide, treatments, page recipes, mandatory word-by-word Tagline Reveal moment, fluid island navigation, authentic software previews (no 3D balls). |
| **Aesthetic Direction & Archetypes** | `.agents/skills/shavin-webpage/style-recipes.md` | Calibrate the 5 Design Dials (`visual-variance`, `motion-intensity`, `information-density`, `asset-dependence`, `brand-fidelity`). Select archetype: Linear Dark, Apple Minimal, Stripe Precision, Technical Brutalist, Vercel Monochrome. |
| **Layout Compositions & Page Structure** | `.agents/skills/layout-compositions/` | 55 compositions (ST, H, F, P/S/T, C/Q, G, E, D, X families) with content-based selection rules, 5 swappable treatments (carded, ruled, flat, full-bleed, open), page recipes, distinctiveness rules, `@shavin/ui` adapter. Use `/compose-page` to plan and build. |
| **Tier 1 Motion (Reveals, Hovers, Count-ups)** | `.agents/skills/layout-motion/` | 11 restrained motion presets using `--dur-*`, `--dist-*`, `--stagger` tokens. Scroll reveals, hover/press, tab/accordion transitions, count-ups, marquees with pause. Reduced-motion safety net via token zeroing. |
| **Tier 2 Cinematic / Awwwards Motion** | `.agents/skills/layout-choreography/` | Scene-based choreography: pinned scrollytelling, scroll-scrubbed timelines, horizontal-scroll sections, split-text/mask reveals, stacked cards, cursor effects, page transitions, WebGL heroes. Scene spec template with budgets and fallbacks. One signature + two supporting scenes max per page. Requires finished static layout first. |
| **Typography, Headlines, Numbers & Copy Measure** | `.agents/skills/visual-compositor/typography-rules.md` | Calibrated type scale snapping, mandatory `text-balance` on headings, `text-pretty` on body, `tabular-nums font-mono` on numbers/metrics, measure limit `max-w-2xl` (680px), subtle text gradients. |
| **Motion, Transitions, Springs & Page Reveals** | `.agents/skills/visual-compositor/motion-and-physics.md` | **The Frequency Law**: NEVER animate 100+/day keyboard actions. Animate entering/feedback only. Custom easings (`cubic-bezier(0.23, 1, 0.32, 1)`), no `ease-in`, duration < 300ms, Rauno split & stagger enter choreography (`blur(4px)` + `translateY(12px)` + `opacity`), Before/After review table. |
| **Tactile Polish, Anti-Box Law & Optical Centering** | `.agents/skills/visual-compositor/interface-polish.md` | `active:scale-[0.96]` on press, Anti-Box Law (proximity before containers), button icon padding offset (`icon-side = text-side - 2px`), play button triangle shift (`ml-0.5`), Lummi pastel mesh backdrops with directional scrims. |
| **SaaS Apps, Dashboards, Data Tables, Consoles** | `.agents/skills/shavin-app/SKILL.md` | `AppFrame`, `Sidebar`, high-density mode (scaling 95%), concentric panel-p5 nesting, skeleton loading states, table row actions. |
| **Anti-Pattern Review & AI-Slop Prevention** | `.agents/skills/visual-compositor/anti-patterns.md` | 13 named anti-patterns (AP-01–AP-13): Defensive Minimalism, Glow Balls, Stock Photos, Badge Soup, Paragraph Walls, Metric Clutter, Kitchen-Sink Bento, Status-Chip Soup, Over-Containment, Vacuous Copywriting, Lazy Placeholders, Harsh Border Glare, Sparkles Icon. Load before composing or when output "feels AI-generated". |
| **Isolated UI Building & Hand-off** | `.agents/skills/shavin-ui-builder/SKILL.md` | Build a section or screen in a silo from `@shavin/ui` primitives, iterate with the user, then hand the approved JSX back for merge. |
| **Design QA, Token Linting & Setup Checks** | `.agents/skills/shavin-ui-qa-linter/SKILL.md` | Token-purity linting, accessibility audits, setup verification (`inspect_environment`) and live checks (`get_live_audit`). |
| **Which Skill Fires, Project Defaults & Tool Reference** | `.agents/skills/shavin-core/SKILL.md` | Skill dispatcher (first match wins), `SHAVIN.md` site and mode defaults, MCP vs no-MCP routing, and the full MCP tool inventory. |
| **Concentric Geometry & Invariant Rules** | `.agents/skills/core-rules.md` & `concentric-laws.md` | Strict two-tier token purity, concentric radius formula $R_{\text{inner}} = \max(\text{floor}, R_{\text{outer}} - P)$, floor $= \min(\text{radius-lg}, \text{radius-panel}/2)$, Radix accessible primitives. |

Available AI slash commands in `.agents/commands/`:
- `/create-screen <type>` — Compose full production page layouts
- `/create-block <type>` — Compose a UI block; optionally register it in the Studio catalog (Phase 1: compose, Phase 2: register)
- `/create-primitive <name>` — Create a new WCAG 2.1 AAA primitive component in `@shavin/ui`
- `/create-theme <name>` — Add a new theme preset to the DS source (`THEME_PRESETS`)
- `/apply-theme [config]` — Configure `ThemeProvider` in a consumer project (reads `SHAVIN.md` first)
- `/audit-ui <path>` — Verify token purity and concentric radius compliance
- `/compose-page <brief>` — Plan and build a page from the layout-compositions library (plan table first, then code)
- `/audit-layout <path|url|markup>` — Audit an existing page against the composition library and report fixes
- `/add-composition <name>` — Add or revise a composition in the library

Project design config: see `SHAVIN.md` for theme, accent, density, and radius settings.
<!-- @shavin/skills:reference-end -->

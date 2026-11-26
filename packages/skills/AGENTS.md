# @shavin/ui — Agent Rules

<!-- Written by @shavin/cli init or the MCP install_skills tool. Regenerate with `npx @shavin/skills --force`. -->

> **Start here:** read `SHAVIN.md`, this project's design brief (product, theme, site type, visual mode), at the start of every task that writes UI, follow-ups included, or call `get_project_context()` via `shavin-mcp`. The rules and skills below take their defaults from it.
>
> 💡 **MCP Guidance:** Call `get_guidelines({ section: "<topic>" })` or `get_components({ name: "<name>" })` via `shavin-mcp` to query full component tables, Radix gotchas, or ThemeProvider specs.

This project uses `@shavin/ui`: a strict two-tier token architecture, accessible React primitives, and an MCP server that grounds AI agents in the real components and tokens. Follow these rules for every UI change.

---

## 0. UI workflow: look up, build to the rules, validate

Whenever asked to create, design, refine, iterate on, or review any component, block, screen, or page layout in this project, you MUST follow this 3-step loop. It applies to the first request and to every follow-up turn that writes UI, however small ("add a filter", "change the colour"); a small edit is not an exception.

**Components only.** Every UI element is a `@shavin/ui` component: no raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>` or `<dialog>`, no hand-styled `<div>` standing in for a card, badge, modal, tabs or toast, and no other UI library in new code. If nothing fits, compose from `Box`, `Flex`, `Grid`, `Text`, `Heading`, `Icon` and say what is missing.

**Six states, by default.** Every screen, list, form and component covers first-time, empty, loading (`Skeleton`, never a spinner for content), error, success and disabled, without the user asking. Every site and app also has a not-found page and an error boundary. Which component per state: `CLAUDE.md` "States" or the `shavin-app` skill.

1. **Step 1 (Pre-Flight DS Lookup — No Parametric Memory Slop)**:
   - **NEVER** invent JSX markup, prop names, or Tailwind classes from generic LLM training memory.
   - **ALWAYS** query `@shavin/ui` primitives via `get_components({ name })` or read its entry in `components.json`.
   - **ALWAYS** verify tokens via `get_tokens()` or `tokens.json`.
   - When building full sections or pages, **plan first**: `plan_page({ brief })` picks a composition per section from `layout-compositions/` (57 compositions across 9 families), with treatment and motion tier; fill it, save it as `.shavin/plans/<page>.json` and run `check_page({ plan })`. Build each section as `<Section data-composition="<ID>">`, fetching its family with `get_skill({ name: "layout-compositions", section: "<family>" })`. No MCP? Use `/compose-page`.

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
2. **Semantic tokens** — role-based (`--bg-canvas`, `--fg`, `--brand`, `--hairline`), remapped per theme (`:root` = light, `.dark` = dark). **Every component uses ONLY these via Tailwind utilities** (`bg-surface`, `text-fg`, `border-hairline`) — never a raw hex, never `rgb()`, never an `--n-*` var.

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
| `SHAVIN.md` | This project's design brief: site type, mode, brand, density, radius |

> ⚠️ **Import Rule:** ALWAYS import from `@shavin/ui`. NEVER deep import from `@shavin/ui/primitives/...`.

---

## 3. Radix & Primitive Selection

Pick the Shavin component for the pattern; its engine is listed here so you know the behaviour you get:

| Pattern | Engine | Key Rule / Primitive |
|---|---|---|
| Modals & Palette | Radix Dialog | Focus trap, ESC, outside click. `Spotlight`, `Dialog`. |
| Destructive Confirm | Radix AlertDialog | Focus defaults to Cancel, no outside-click dismiss. |
| Select / Dropdown | Radix Select | **Gotcha:** `value: ""` forbidden (reserved sentinel). Scroll via `Select.Viewport`. |
| Menus & Tooltips | Radix Popover/Menu/Tooltip | `collisionPadding={8}`, `align="start"`. Tooltips take `tone="auto|dark|light"`. |
| Controls & Switches | Radix Checkbox/Switch/Radio | Use native ARIA states. RadioGroupItem defaults `radius="full"`. |
| Shapes & Avatars | Radix Avatar/Slider/Badge | Escape hatch `radius="none|small|medium|large|full|inherit"`. Badge defaults `"inherit"`. |
| Native-element components | Shavin wrappers over native HTML | `Dropdown` (native `<select>`), `DatePicker`, `TimePicker`. Always the Shavin component, never the raw element. |

Any floating overlay surface MUST have `data-panel` attribute for translucent panel support.
Chevron convention: `ChevronRight` (rotated 90° down when expanded) for nav trees; `ChevronDown` (rotated 180° up when expanded) for accordions.

---

## 4. Concentric Radius & Spacing Rules

- **Controls (`--radius-lg`)**: Single-line inputs, buttons, badges, chips, switches. Go pill-shaped at "Full" preset (`rounded-[var(--radius-lg)]`).
- **Panels & Containers (`--radius-panel`)**: Cards, dialogs, popovers, menus, accordions, callouts. Intentionally capped at finite radius (`rounded-[var(--radius-panel)]`) — **NEVER** use `--radius-lg` on containers or accordions.
- **Concentric Nesting:** Inner radius must satisfy $R_{\text{inner}} = \max(\text{floor}, R_{\text{outer}} - P)$, floor $= \min(\text{radius-lg}, \text{radius-panel}/2)$. The floor keeps padded children from collapsing to square corners (0 only when the theme radius is 0); `concentricContainerStyle()` / `CONCENTRIC_FLOOR` apply it. Use concentric Tailwind utilities (`rounded-panel-p3`, `rounded-panel-p5`, `rounded-panel-inner`).
- **Tailwind Padding Scale Trap:** `p-5` is 20px (`1.25rem`), `p-3` is 12px (`0.75rem`). NEVER confuse `p-5` with 5px! Do not write inline `calc(...) - 5px` for `p-5`. Use `rounded-panel-p5`.
- **Literals forbidden:** Never use literal `rounded-lg`, `rounded-xl`, `rounded-2xl`. `rounded-full` allowed ONLY for pills, avatars, switches.

---

## 5. ThemeProvider

`init` already mounts it once in the root layout; do not add a second one. Its values come from `SHAVIN.md` and `.shavin/config.json` (for example `<ThemeProvider brandColor="monochrome" grayColor="zinc" radius="medium" scaling="100%" panelBackground="solid">`). To change the brand: a preset name (`brandColor="teal"`), a custom hex on `ThemeProvider` or `ScopedThemeProvider` (`brandColor="#0f766e"`), or `npx @shavin/cli brand`; update `SHAVIN.md` and `.shavin/config.json` to match. A hex is allowed in those places only.

---

## 6. Live DOM audit (optional)

With the dev server running, `get_live_audit({ path: "/route" })` reports live violations and contrast for the page open in a browser; `wait_for_live_clean` blocks until none remain. These tools only appear once a browser tab is connected. `shavin init` wires the bridge into the Next or Vite config; do not ask the user to start it.

---

## 7. Pre-Flight Quality Gate

- [ ] All colors use semantic tokens (`bg-surface`, `text-fg`, `border-hairline`). Zero hex/rgb/`--n-*`.
- [ ] Container surfaces use `rounded-[var(--radius-panel)]`; controls use `rounded-[var(--radius-lg)]`.
- [ ] All floating panels have `data-panel` attribute.
- [ ] Typography contrast hierarchy: Title uses `text-fg`, paired description uses `text-fg-subtle` (`color="subtle"`), never `text-fg-muted`.
- [ ] Every element is a `@shavin/ui` component (no raw controls, no div imitations, no other UI library in new code).
- [ ] All six states exist: first-time, empty, loading, error, success, disabled.
- [ ] Imports reference `@shavin/ui` root (no deep paths).
- [ ] `validate_code` reports zero errors on every file changed this turn.

---

## 8. Responsive Design & Breakpoint Overrides

Prefer layouts that adapt to their container before reaching for breakpoints:

- **App shells:** `AppFrame` with `Sidebar`; below 768px of the frame's own width the sidebar becomes a drawer and `<SidebarTrigger />` appears. Never hand-write a hamburger, a second nav copy or `hidden md:block` wrappers.
- **Card, stat and feature grids:** `Grid columns="auto"` with `minWidth` (and `maxColumns` to cap the track count). Not for bento or spanned layouts.
- **Headings:** `Heading` sizes `xl` and up are fluid. Pick the size for the widest layout; never add `md:text-*` steps.
- **Inside an AppFrame:** show or hide details with `shavin-frame-compact-only` / `shavin-frame-wide-only`, not viewport classes.

---

## 9. Icons

- **NEVER** use emoji characters OR Unicode glyphs (✓, ★, →, •, ✔) in UI. Use `<Icon name="Check" size="sm" color="brand" />`; sizes and colours: `get_components({ name: "Icon" })`.
- Supported icon libraries: Lucide (default), Phosphor, Radix Icons, Material.
- Feature list pattern: `<Flex direction="row" align="center" gap="2">` with `<Icon>` + `<Text>`.

---

<!-- @shavin/skills:reference -->
## Shavin Design System Skills & Agent Activation Guide

This project uses `@shavin/ui`. AI agents MUST load skills on demand based on the user's intent.

### Bootstrap on every UI turn

At the start of **every task that writes UI** in a Shavin project (the first message and each follow-up, however small), execute this 4-step bootstrap before producing any output. Skills already loaded earlier in the conversation do not need loading again; the rules in them still apply.

1. **Read project context** — Read `SHAVIN.md` from the project root (or call `get_project_context()` via `shavin-mcp` if connected). Extract: site type, default visual mode, brand, density, radius, panel background.
2. **Match the request against the Activation Matrix** below. Several rows can match: load every matching skill; for app screens (dashboard, settings, auth, onboarding, forms, tables) `shavin-app` leads. A request that matches no row is still Shavin UI: use `shavin-app` for functional UI and `shavin-webpage` for content pages, never freehand code. Pick the skill and visual mode.
3. **Core files (nothing is injected).** `AGENTS.md` and the MCP instructions carry the short form of the token, radius and component rules. For the full detail read `.agents/skills/core-rules.md` (tokens, radius, typography, fonts, icons, spacing); it is a file, not a skill name. Fetch these with `get_skill({ name: "visual-compositor", section: "<file>" })` when the task touches them: `cognitive-layer` (before generating a screen: states, affordances), `spacing-core` (section, flex and grid structure), `concentric-laws` (nested radius and padding), `typography-rules` (type scale, balance, tabular numbers), `layout-restraint` (one idea per section, anti-bloat), `interface-polish` (press feedback, depth recipes), `motion-and-physics` (any animation).
4. **Load on-demand files** per the resolved mode. Key on-demand files:
   - `visual-compositor/anti-patterns.md` — Load whenever composing or reviewing blocks/screens. Contains 13 named AI-slop anti-patterns (AP-01–AP-13) with code examples, remediation, and a decision table. The governing principle: *prefer typographic hierarchy over decorative elements for structural labeling; reserve badges/pills/chips for stateful information only.*
   - `visual-compositor/audit-checklist.md` — Load at the END of layout tasks for final verification.
   - `shavin-webpage/` files — Load for marketing/landing page architecture, editorial craft, and style recipes.
   - `layout-compositions/` — Load for any page/section layout work: 57 compositions across 9 families, selection guide, treatments, foundations, page recipes.
   - `layout-motion/` — Load for Tier 1 restrained motion (reveals, hovers, count-ups, marquees).
   - `layout-choreography/` — Load for Tier 2 cinematic/awwwards motion (pinned scrollytelling, scroll-scrubbed timelines, horizontal scroll, split-text reveals).
   - `shavin-app/SKILL.md` — Load for SaaS, dashboards, data tables, settings, forms, auth, onboarding and any screen with state (it holds the six-state rule).
   - Command files (`.agents/commands/`) — Load when the user invokes a `/create-screen`, `/create-block`, etc.

- 💡 **If `shavin-mcp` is connected:** Call `list_skills()` to enumerate all skills + headings, or `get_skill({ name, section })` to fetch targeted instructions. Call `list_commands()` to enumerate slash commands.
- 💡 **Otherwise (No-MCP):** Read the `.md` files directly from `.agents/skills/` and `.agents/commands/`.

### 🎯 Agent Activation Matrix (When to Load What)

| Task / Intent | Required Skill / Module | Key Directives to Enforce |
|---|---|---|
| **Marketing / Landing / Hero / Pricing / Launch** | `.agents/skills/shavin-webpage/` (`page-architecture.md`, `editorial-craft.md`, `style-recipes.md`) + `.agents/skills/layout-compositions/` | 12-section vertical reading arc, conversion copywriting formulas ("{Outcome} without {pain}"), 57 layout compositions across 9 families with metadata, selection guide, treatments, page recipes, mandatory word-by-word Tagline Reveal moment, fluid island navigation, authentic software previews (no 3D balls). |
| **Aesthetic Direction & Archetypes** | `.agents/skills/shavin-webpage/style-recipes.md` | Calibrate the 5 Design Dials (`visual-variance`, `motion-intensity`, `information-density`, `asset-dependence`, `brand-fidelity`). Select archetype: Linear Dark, Apple Minimal, Stripe Precision, Technical Brutalist, Vercel Monochrome. |
| **Layout Compositions & Page Structure** | `.agents/skills/layout-compositions/` | 57 compositions (ST, H, F, P/S/T, C/Q, G, E, D, X families) with content-based selection rules, 5 swappable treatments (carded, ruled, flat, full-bleed, open), page recipes, distinctiveness rules, `@shavin/ui` adapter. Use `/compose-page` to plan and build. |
| **Tier 1 Motion (Reveals, Hovers, Count-ups)** | `.agents/skills/layout-motion/` | 11 restrained motion presets using `--dur-*`, `--dist-*`, `--stagger` tokens. Scroll reveals, hover/press, tab/accordion transitions, count-ups, marquees with pause. Reduced-motion safety net via token zeroing. |
| **Tier 2 Cinematic / Awwwards Motion** | `.agents/skills/layout-choreography/` | Scene-based choreography: pinned scrollytelling, scroll-scrubbed timelines, horizontal-scroll sections, split-text/mask reveals, stacked cards, cursor effects, page transitions, WebGL heroes. Scene spec template with budgets and fallbacks. One signature + two supporting scenes max per page. Requires finished static layout first. |
| **Typography, Headlines, Numbers & Copy Measure** | `.agents/skills/visual-compositor/typography-rules.md` | Calibrated type scale snapping, mandatory `text-balance` on headings, `text-pretty` on body, `tabular-nums font-mono` on numbers/metrics, measure limit `max-w-2xl` (680px), subtle text gradients. |
| **Motion, Transitions, Springs & Page Reveals** | `.agents/skills/visual-compositor/motion-and-physics.md` | **The Frequency Law**: NEVER animate 100+/day keyboard actions. Animate entering/feedback only. Custom easings (`cubic-bezier(0.23, 1, 0.32, 1)`), no `ease-in`, duration < 300ms, Rauno split & stagger enter choreography (`blur(4px)` + `translateY(12px)` + `opacity`), Before/After review table. |
| **Tactile Polish, Anti-Box Law & Optical Centering** | `.agents/skills/visual-compositor/interface-polish.md` | `active:scale-[0.96]` on press, Anti-Box Law (proximity before containers), button icon padding offset (`icon-side = text-side - 2px`), play button triangle shift (`ml-0.5`), Lummi pastel mesh backdrops with directional scrims. |
| **SaaS Apps, Dashboards, Data Tables, Consoles** | `.agents/skills/shavin-app/SKILL.md` | `AppFrame`, `Sidebar`, optional high-density mode (`scaling="95%"`; the default is 100%), concentric panel-p5 nesting, all six states (first-time, empty, loading, error, success, disabled), table row actions. |
| **Forms, Settings, Sign-in / Sign-up, Onboarding** | `.agents/skills/shavin-app/SKILL.md` (Settings, Auth and Onboarding patterns) | `TextField` / `Select` / `Switch` with `invalid` + `errorMessage`, one Save, `AlertDialog` for destructive actions, `Stepper` for onboarding with validation per step and a skip path, `data-composition="none"` on utility screens. |
| **A single section or component** | `get_block_template` + `shavin-app` (app screen) or `shavin-webpage` (content section) | Same rules as pages: components only, six states, `validate_code` on every change. |
| **Anti-Pattern Review & AI-Slop Prevention** | `.agents/skills/visual-compositor/anti-patterns.md` | 13 named anti-patterns (AP-01–AP-13): Defensive Minimalism, Glow Balls, Stock Photos, Badge Soup, Paragraph Walls, Metric Clutter, Kitchen-Sink Bento, Status-Chip Soup, Over-Containment, Vacuous Copywriting, Lazy Placeholders, Harsh Border Glare, Sparkles Icon. Load before composing or when output "feels AI-generated". |
| **Designing live in Shavin Studio (a connected Studio session)** | `.agents/skills/shavin-studio/SKILL.md` | Only when `connect_studio` has paired, or when designing a block in isolation for approval: BlockNode trees, prop names, `@tablet` / `@mobile` overrides, frames, theme changes, the design-validate-approve-hand-off workflow. Not needed for writing code in this project. |
| **Concentric Geometry & Invariant Rules** | `.agents/skills/core-rules.md` & `concentric-laws.md` | Strict two-tier token purity, concentric radius formula $R_{\text{inner}} = \max(\text{floor}, R_{\text{outer}} - P)$, floor $= \min(\text{radius-lg}, \text{radius-panel}/2)$, Radix accessible primitives. |

Available AI slash commands in `.agents/commands/`:
- `/create-screen <type>` — Compose full production page layouts
- `/create-block <type>` — Compose a UI block; optionally register it in the Studio catalog (Phase 1: compose, Phase 2: register)
- `/create-primitive <name>` — Create a new accessible (WCAG 2.2 AA) primitive component in `@shavin/ui`
- `/create-theme <name>` — Add a new theme preset to the DS source (`THEME_PRESETS`)
- `/apply-theme [config]` — Configure `ThemeProvider` in a consumer project (reads `SHAVIN.md` first)
- `/audit-ui <path>` — Verify token purity and concentric radius compliance
- `/compose-page <brief>` — Plan and build a page from the layout-compositions library (plan table first, then code)
- `/audit-layout <path|url|markup>` — Audit an existing page against the composition library and report fixes
- `/add-composition <name>` — Add or revise a composition in the library

Project design config: see `SHAVIN.md` for theme, brand, density, and radius settings.
<!-- @shavin/skills:reference-end -->

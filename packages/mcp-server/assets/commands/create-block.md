# Create `@shavin/ui` Block

Automated recipe to compose a standalone UI section or block from `@shavin/ui` primitives.

## Input Argument
$ARGUMENTS (Block Type & Intent: e.g., `hero-saas-creative`, `feature-bento`, `pricing-cards`, `stats-counter`, `app-shell`, `faq-accordion`)

## Instructions

### 0. Read Project Context & Resolve Mode

- 💡 **If `shavin-mcp` is connected:** Call `get_project_context()` to read the project's `SHAVIN.md` — it returns the configured accent, theme mode, radius, density, and (if present) the `## 3. Site & Mode Defaults` section. Use those values as the source of truth for all theme/mode decisions in this block.
- 💡 **Otherwise (No-MCP):** Read `SHAVIN.md` directly (`view SHAVIN.md` or equivalent file read). Look for `## 2. Design System Configuration` and `## 3. Site & Mode Defaults`. If `SHAVIN.md` doesn't exist, fall back to the defaults in `.agents/skills/shavin-core/SHAVIN.template.md`.
- **Mode resolution:** Resolve the visual mode (STRUCTURAL / MARKETING / EDITORIAL / HYBRID / DOCS) using the canonical dispatcher in `shavin-core/SKILL.md` §1a — do NOT hardcode a partial mode table here. The resolution order is: (1) explicit signal in `$ARGUMENTS`, (2) `SHAVIN.md`'s `Default Visual Mode`, (3) `visual-compositor/SKILL.md`'s Activation Modes table, (4) ask the user. Treat `get_skill_mode` as advisory only (it can't return DOCS or HYBRID).

### 1. Skill Activation

Activate skill modules based on the resolved mode — see `shavin-core/SKILL.md` §1a for the canonical skill dispatcher table. The key mappings:
- **MARKETING / EDITORIAL / HYBRID**: Load `shavin-webpage/` (`page-architecture.md`, `editorial-craft.md`, `style-recipes.md`) + `layout-compositions/` for composition patterns + `visual-compositor/` files per the File Loading Guide.
- **STRUCTURAL / DOCS**: Load `shavin-app/SKILL.md` + `visual-compositor/spacing-dense.md` (and `docs-mode.md` for DOCS).
- **All modes**: Enforce `visual-compositor/typography-rules.md`, `interface-polish.md`, and `motion-and-physics.md`. For MARKETING/EDITORIAL/HYBRID modes, also load `page-motion-presets.md` and `composition-motion-map.md` for entrance preset recipes.

### 2. Primitive Discovery & Selection

- 💡 **If `shavin-mcp` is connected:** Query available primitives dynamically using `get_components({ name?, density? })`.
- 💡 **Otherwise (No-MCP):** Reference `@shavin/ui`'s 138-component system — browse `packages/ui/src/primitives/` or read `components.json` at the repo root (generated via `npm run manifest:gen`).
- Do NOT restrict yourself to basic cards. Reach for rich interactive primitives:
  - **Containers & Overlays**: `Card`, `Inset`, `Dialog`, `AlertDialog`, `Popover`, `Tooltip`, `Callout`, `ScrollArea`, `HoverCard`, `AspectRatio`.
  - **Navigation & Hierarchy**: `Tabs`, `SegmentedControl`, `Breadcrumbs`, `Pagination`, `Menu`, `Dropdown`, `Sidebar`.
  - **Controls & Data Entry**: `Button`, `IconButton`, `TextField`, `TextArea`, `Select`, `Combobox`, `Checkbox`, `Switch`, `Slider`, `RadioGroup`, `DatePicker`.
  - **Data Display & Feedback**: `Table`, `Badge`, `Avatar`, `AvatarGroup`, `Progress`, `Skeleton`, `Kbd`, `Separator`, `BarChart`, `LineChart`, `Sparkline`, `StatCard`, `Accordion`.
  - **Layout & Structure**: `AppFrame`, `Sidebar`, `Section`, `Container`, `Flex`, `Grid`.
- **Zero Raw HTML**: Never use raw HTML buttons, inputs, tables, or cards when a Shavin primitive exists.

### 3. Spatial Hierarchy & Concentric Geometry

- **Section wrapper**: `Section` has no padding by default — set `size="body"` (py-16 md:py-24) or `size="hero"` (py-24 md:py-32) for marketing showcases, or an explicit `py-16 md:py-24`. Full-bleed, zero horizontal padding on `<section>` (the `Container` is the gutter).
- **Content wrapper**: `<Container size="lg" className="px-4 md:px-6">` (or `size="xl"` for split/dense grids).
- **Container Surfaces**: `rounded-[var(--radius-panel)] border border-hairline bg-surface`.
- **Controls & Chips**: `rounded-[var(--radius-lg)]` (inputs, buttons, badges).
- **Concentric Nesting Rule**: Inner radius must satisfy $R_{\text{inner}} = \max(\text{floor}, R_{\text{outer}} - P)$, floor = `min(radius-lg, radius-panel / 2)`. Use concentric utilities (`rounded-panel-p5`, `rounded-panel-p3`, `rounded-panel-inner`).

### 4. Color & Typography Contrast

- **Section Title**: `text-fg` with `font-semibold` or `font-display` and `tracking-tight`.
- **Paired Subtitle**: `text-fg-subtle` (`color="subtle"`), never `text-fg-muted` (per `AGENTS.md` typography invariant).
- **Metadata / Minor Captions**: `text-fg-muted` (timestamps, subtle counter labels).
- **Action Buttons**: Primary `variant="solid"` (accent tone), Secondary `variant="outline"` or `variant="subtle"`.
- **Zero Raw Color Literals**: No hex codes, no `rgb()`, no `--n-*` foundation variables. Only semantic tokens (`bg-surface`, `bg-canvas`, `text-fg`, `border-hairline`, `accent`).

### 5. Imagery & Media (Anti-Slop Invariant)

**Follow the anti-slop invariant in `shavin-core/SKILL.md` §2 and `core-rules.md` §11 (AP-03).**

- **NEVER** dump cliché literal stock (people typing on laptops, handshakes, generic office desks) or dense, tiny, unreadable UI screenshots into blocks or templates. They look cheap and break visual cohesion.
- **PREFERRED hero / main media** (content on top, behind a scrim — set via layout bg props `bgImage` / `bgVideo` + `bgPoster` / `bgOverlays`):
  1. **Curated photography** from Lummi (`assets.lummi.ai`), Unsplash, or user-supplied — usable anywhere, including as accents for visual balance.
  2. **Mesh gradients** (`bgOverlays="mesh-lime"`, `mesh-night`, `mesh-mint`, `mesh-peach`, `mesh-accent`; append `-animated` for slow drift).
  3. **Animated backgrounds** (Pexels video via `bgVideo` with a `bgPoster` fallback).
- **3D renders**: optional decorative graphics only — never focal hero/feature media.
- **Product mockups rebuilt from Shavin primitives**: do NOT use as imagery unless highly confident of the result (rarely).
- If visual media is required, wrap it in a container with concentric radii (`rounded-panel-p5` or `rounded-[var(--radius-panel)]`), `overflow-hidden`, and `object-cover`.
- Add subtle theme-aware border (`border border-hairline`) to prevent visual bleed in dark or light mode.

### 6. Icons

- **Strictly use `lucide-react`**: `import { Sparkles, ArrowRight, Check, Shield } from "lucide-react"`.
- Zero emojis in UI titles/badges.
- Zero standalone inline `<svg>` markup.
- Zero `@phosphor-icons/react` imports.

### 7. Validation & Quality Gate

- 💡 **If `shavin-mcp` is connected:** Validate the block with `validate_code({ code: "<ComponentSource>" })`. Must score 100% token purity with zero lint errors and correct concentric nesting.
- 💡 **Otherwise (No-MCP):** Run `node bin/lint-tokens.mjs <file>` — it implements the same token purity regexes as `@shavin/mcp`'s `validate_code`, with `--fix` for autofixable cases (hex→token, literal radius→token).
- Also run `npm run tokens:check` and `npm run typecheck` if working inside the monorepo.

To propose a block for the shared Shavin catalogue, open an issue with the block code; catalogue blocks are added by maintainers.

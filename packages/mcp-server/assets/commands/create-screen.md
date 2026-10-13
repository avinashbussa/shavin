# Create `@shavin/ui` Full-Page Screen

Automated recipe to compose a production-ready full-page layout using `@shavin/ui` primitives.

## Input Argument
$ARGUMENTS (Screen Type: e.g., `saas-dashboard`, `analytics-overview`, `settings-profile`, `marketing-landing`, `pricing-matrix`)

## Instructions

### 0. Read Project Context & Resolve Mode

- 💡 **If `shavin-mcp` is connected:** Call `get_project_context()` to read the project's `SHAVIN.md` — it returns the configured accent, theme mode, radius, density, and (if present) the `## 3. Site & Mode Defaults` section. Use those values as the source of truth for all theme/mode decisions.
- 💡 **Otherwise (No-MCP):** Read `SHAVIN.md` directly (`view SHAVIN.md` or equivalent file read). Look for `## 2. Design System Configuration` and `## 3. Site & Mode Defaults`. If `SHAVIN.md` doesn't exist, fall back to the defaults in `.agents/skills/shavin-core/SHAVIN.template.md`.
- **Mode resolution:** Resolve the visual mode using the canonical dispatcher in `shavin-core/SKILL.md` §1a — do NOT hardcode a partial mode table here. The resolution order is: (1) explicit signal in `$ARGUMENTS`, (2) `SHAVIN.md`'s `Default Visual Mode`, (3) `visual-compositor/SKILL.md`'s Activation Modes table, (4) ask the user. Treat `get_skill_mode` as advisory only (it can't return DOCS or HYBRID, and defaults differently than this table).

### 1. Skill Activation (by resolved mode)

See `shavin-core/SKILL.md` §1a for the canonical skill dispatcher table — do not maintain a separate copy here. The key mode→skill mappings:
- **MARKETING / EDITORIAL / HYBRID**: Load `shavin-webpage/` (`page-architecture.md`, `editorial-craft.md`, `style-recipes.md`) + `layout-compositions/` (55 compositions, selection guide, treatments, page recipes). Follow the 12-section vertical reading arc, conversion copywriting formulas, mandatory Tagline Reveal moment,and 5 Design Calibration Dials. Apply `typography-rules.md` and `interface-polish.md`.
- **DOCS**: Load `shavin-webpage/SKILL.md` + `visual-compositor/docs-mode.md`. Skip the 12-section marketing arc — use persistent sidebar nav, dense reference prose (`max-w-2xl`), and first-class code blocks per `docs-mode.md`.
- **STRUCTURAL** (SaaS / Dashboard / Admin / Settings): Load `shavin-app/SKILL.md`. Use high density (scaling 95%), `AppFrame` / `Sidebar` layouts, concentric surface nesting (`rounded-panel-p5`), paired metric KPI cards, rich data `Table`s with sort headers and status badges, `Skeleton` loading states. For Settings: sticky `Tabs` / `SegmentedControl`, form stacks, Radix `AlertDialog` for destructive confirms.
- **All modes**: Enforce `visual-compositor/motion-and-physics.md` (The Frequency Law, motion tokens `--dur-*`/`--dist-*`/`--stagger`, reduced-motion safety net, Rauno split & stagger enter choreography). For MARKETING/EDITORIAL/HYBRID modes, also load `page-motion-presets.md` and `composition-motion-map.md` for entrance preset recipes and per-composition motion suggestions.
- 💡 **Shortcut (MCP):** If `shavin-mcp` is connected and you want a full first-draft page rather than hand-assembling one section at a time, `synthesize_layout({ prompt: $ARGUMENTS, category })` returns complete JSX with mode, theme, and token-compliance already resolved — use it as a starting point, then apply the composition rules below to refine.

### 2. Composition Rules
- **Primitives**: Import directly from `@shavin/ui` root. Never use raw HTML buttons, inputs, tables, or cards where Shavin primitives exist.
- **Semantic Tokens ONLY**:
  - Backgrounds: `bg-canvas` (body/page), `bg-surface` (cards), `bg-surface-raised` (elevated panels).
  - Text: `text-fg` (headings/titles), `text-fg-subtle` (paired descriptions), `text-fg-muted` (metadata/captions).
  - Borders: `border-hairline`, `border-hairline-strong`.
  - Accent: `bg-accent`, `text-accent`, `text-accent-contrast`, `border-accent`.
  - Zero raw hex, `rgb()`, or default Tailwind colors (`slate-500`, `blue-600`).
- **Concentric Geometry**:
  - Containers/Panels: `rounded-[var(--radius-panel)]` (Cards, Modals, Popovers).
  - Controls: `rounded-[var(--radius-lg)]` (Buttons, TextFields, Badges).
  - Concentric nesting formula: $R_{\text{inner}} = \max(\text{floor}, R_{\text{outer}} - P)$, floor = `min(radius-lg, radius-panel / 2)` (`rounded-panel-p5`, `rounded-panel-p3`).
- **Icons**:
  - Use `lucide-react` exclusively (e.g. `import { LayoutDashboard, Users, Settings, Sparkles } from "lucide-react"`).
  - Never use emoji characters, standalone inline `<svg>` markup, or phosphor icons.

### 3. Verification & Quality Gate
- 💡 **If `shavin-mcp` is connected:** Validate synthesized screen code with `validate_code({ code })`.
- 💡 **Otherwise (No-MCP):** Run `node bin/lint-tokens.mjs <path> --fix` — same regexes as `@shavin/mcp`'s `validate_code`, with autofix for hex→token and literal radius→token.
- Output code directly into the target project structure (e.g. `src/app/(dashboard)/page.tsx`).
- Verify all imports and ensure zero compile or lint errors.

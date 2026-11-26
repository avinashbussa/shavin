## Shavin Design System Skills & Agent Activation Guide

This project uses `@shavin/ui`. AI agents MUST load skills on demand based on the user's intent.

### Bootstrap on every UI turn

At the start of **every task that writes UI** in a Shavin project (the first message and each follow-up, however small), execute this 4-step bootstrap before producing any output. Skills already loaded earlier in the conversation do not need loading again; the rules in them still apply.

1. **Read project context** — Read `SHAVIN.md` from the project root (or call `get_project_context()` via `shavin-mcp` if connected). Extract: site type, default visual mode, brand, density, radius, panel background.
2. **Match the request against the Activation Matrix** below. Several rows can match: load every matching skill; for app screens (dashboard, settings, auth, onboarding, forms, tables) `shavin-app` leads. A request that matches no row is still Shavin UI: use `shavin-app` for functional UI and `shavin-webpage` for content pages, never freehand code. Pick the skill and visual mode.
3. **Core files (nothing is injected).** `AGENTS.md` and the MCP instructions carry the short form of the token, radius and component rules. For the full detail read `.agents/skills/core-rules.md` (tokens, radius, typography, fonts, icons, spacing); it is a file, not a skill name. Fetch these with `get_skill({ name: "visual-compositor", section: "<file>" })` when the task touches them: `cognitive-layer` (before generating a screen: states, affordances), `spacing-core` (section, flex and grid structure), `concentric-laws` (nested radius and padding), `typography-rules` (type scale, balance, tabular numbers), `layout-restraint` (one idea per section, anti-bloat), `interface-polish` (press feedback, depth recipes), `motion-and-physics` (any animation).
4. **Load on-demand files** per the resolved mode. Key on-demand files:
   - `visual-compositor/anti-patterns.md` — Load whenever composing or reviewing blocks/screens. Contains {{antiPatterns}} named AI-slop anti-patterns (AP-01–{{apLast}}) with code examples, remediation, and a decision table. The governing principle: *prefer typographic hierarchy over decorative elements for structural labeling; reserve badges/pills/chips for stateful information only.*
   - `visual-compositor/audit-checklist.md` — Load at the END of layout tasks for final verification.
   - `shavin-webpage/` files — Load for marketing/landing page architecture, editorial craft, and style recipes.
   - `layout-compositions/` — Load for any page/section layout work: {{compositions}} compositions across {{families}} families, selection guide, treatments, foundations, page recipes.
   - `layout-motion/` — Load for Tier 1 restrained motion (reveals, hovers, count-ups, marquees).
   - `layout-choreography/` — Load for Tier 2 cinematic/awwwards motion (pinned scrollytelling, scroll-scrubbed timelines, horizontal scroll, split-text reveals).
   - `shavin-app/SKILL.md` — Load for SaaS, dashboards, data tables, settings, forms, auth, onboarding and any screen with state (it holds the six-state rule).
   - Command files (`.agents/commands/`) — Load when the user invokes a `/create-screen`, `/create-block`, etc.

- 💡 **If `shavin-mcp` is connected:** Call `list_skills()` to enumerate all skills + headings, or `get_skill({ name, section })` to fetch targeted instructions. Call `list_commands()` to enumerate slash commands.
- 💡 **Otherwise (No-MCP):** Read the `.md` files directly from `.agents/skills/` and `.agents/commands/`.

### 🎯 Agent Activation Matrix (When to Load What)

| Task / Intent | Required Skill / Module | Key Directives to Enforce |
|---|---|---|
| **Marketing / Landing / Hero / Pricing / Launch** | `.agents/skills/shavin-webpage/` (`page-architecture.md`, `editorial-craft.md`, `style-recipes.md`) + `.agents/skills/layout-compositions/` | 12-section vertical reading arc, conversion copywriting formulas ("{Outcome} without {pain}"), {{compositions}} layout compositions across {{families}} families with metadata, selection guide, treatments, page recipes, mandatory word-by-word Tagline Reveal moment, fluid island navigation, authentic software previews (no 3D balls). |
| **Aesthetic Direction & Archetypes** | `.agents/skills/shavin-webpage/style-recipes.md` | Calibrate the 5 Design Dials (`visual-variance`, `motion-intensity`, `information-density`, `asset-dependence`, `brand-fidelity`). Select archetype: Linear Dark, Apple Minimal, Stripe Precision, Technical Brutalist, Vercel Monochrome. |
| **Layout Compositions & Page Structure** | `.agents/skills/layout-compositions/` | {{compositions}} compositions (ST, H, F, P/S/T, C/Q, G, E, D, X families) with content-based selection rules, 5 swappable treatments (carded, ruled, flat, full-bleed, open), page recipes, distinctiveness rules, `@shavin/ui` adapter. Use `/compose-page` to plan and build. |
| **Tier 1 Motion (Reveals, Hovers, Count-ups)** | `.agents/skills/layout-motion/` | 11 restrained motion presets using `--dur-*`, `--dist-*`, `--stagger` tokens. Scroll reveals, hover/press, tab/accordion transitions, count-ups, marquees with pause. Reduced-motion safety net via token zeroing. |
| **Tier 2 Cinematic / Awwwards Motion** | `.agents/skills/layout-choreography/` | Scene-based choreography: pinned scrollytelling, scroll-scrubbed timelines, horizontal-scroll sections, split-text/mask reveals, stacked cards, cursor effects, page transitions, WebGL heroes. Scene spec template with budgets and fallbacks. One signature + two supporting scenes max per page. Requires finished static layout first. |
| **Typography, Headlines, Numbers & Copy Measure** | `.agents/skills/visual-compositor/typography-rules.md` | Calibrated type scale snapping, mandatory `text-balance` on headings, `text-pretty` on body, `tabular-nums font-mono` on numbers/metrics, measure limit `max-w-2xl` (680px), subtle text gradients. |
| **Motion, Transitions, Springs & Page Reveals** | `.agents/skills/visual-compositor/motion-and-physics.md` | **The Frequency Law**: NEVER animate 100+/day keyboard actions. Animate entering/feedback only. Custom easings (`cubic-bezier(0.23, 1, 0.32, 1)`), no `ease-in`, duration < 300ms, Rauno split & stagger enter choreography (`blur(4px)` + `translateY(12px)` + `opacity`), Before/After review table. |
| **Tactile Polish, Anti-Box Law & Optical Centering** | `.agents/skills/visual-compositor/interface-polish.md` | `active:scale-[0.96]` on press, Anti-Box Law (proximity before containers), button icon padding offset (`icon-side = text-side - 2px`), play button triangle shift (`ml-0.5`), Lummi pastel mesh backdrops with directional scrims. |
| **SaaS Apps, Dashboards, Data Tables, Consoles** | `.agents/skills/shavin-app/SKILL.md` | `AppFrame`, `Sidebar`, optional high-density mode (`scaling="95%"`; the default is 100%), concentric panel-p5 nesting, all six states (first-time, empty, loading, error, success, disabled), table row actions. |
| **Forms, Settings, Sign-in / Sign-up, Onboarding** | `.agents/skills/shavin-app/SKILL.md` (Settings, Auth and Onboarding patterns) | `TextField` / `Select` / `Switch` with `invalid` + `errorMessage`, one Save, `AlertDialog` for destructive actions, `Stepper` for onboarding with validation per step and a skip path, `data-composition="none"` on utility screens. |
| **A single section or component** | `get_block_template` + `shavin-app` (app screen) or `shavin-webpage` (content section) | Same rules as pages: components only, six states, `validate_code` on every change. |
| **Anti-Pattern Review & AI-Slop Prevention** | `.agents/skills/visual-compositor/anti-patterns.md` | {{antiPatterns}} named anti-patterns (AP-01–{{apLast}}): Defensive Minimalism, Glow Balls, Stock Photos, Badge Soup, Paragraph Walls, Metric Clutter, Kitchen-Sink Bento, Status-Chip Soup, Over-Containment, Vacuous Copywriting, Lazy Placeholders, Harsh Border Glare, Sparkles Icon. Load before composing or when output "feels AI-generated". |
<!-- if:repo -->| **Design QA, Token Linting & Setup Checks** | `.agents/skills/shavin-ui-qa-linter/SKILL.md` | Token-purity linting, accessibility audits, setup verification (`inspect_environment`) and live checks (`get_live_audit`). |
| **Which Skill Fires, Project Defaults & Tool Reference** | `.agents/skills/shavin-core/SKILL.md` | Skill dispatcher (first match wins), `SHAVIN.md` site and mode defaults, MCP vs no-MCP routing, and the full MCP tool inventory. |
<!-- endif -->| **Designing live in Shavin Studio (a connected Studio session)** | `.agents/skills/shavin-studio/SKILL.md` | Only when `connect_studio` has paired, or when designing a block in isolation for approval: BlockNode trees, prop names, `@tablet` / `@mobile` overrides, frames, theme changes, the design-validate-approve-hand-off workflow. Not needed for writing code in this project. |
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

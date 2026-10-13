## Shavin Design System Skills & Agent Activation Guide

This project uses `@shavin/ui`. AI agents MUST load skills on demand based on the user's intent.

### 🚀 First-Message Bootstrap Protocol

On the **first user message** in a Shavin project, execute this 4-step bootstrap before producing any output:

1. **Read project context** — Read `SHAVIN.md` from the project root (or call `get_project_context()` via `shavin-mcp` if connected). Extract: site type, default visual mode, accent, density, radius, panel background.
2. **Match the request against the Activation Matrix** below — first match wins. Pick the skill and visual mode.
3. **Always-loaded files are already in your context** (if MCP injected them): `core-rules.md`, `cognitive-layer.md`, `concentric-laws.md`, `spacing-core.md`, `layout-restraint.md`, `typography-rules.md`, `interface-polish.md`, `motion-and-physics.md`. If not injected, read `core-rules.md` first — it contains token invariants and anti-slop rules.
4. **Load on-demand files** per the resolved mode. Key on-demand files:
   - `visual-compositor/anti-patterns.md` — Load whenever composing or reviewing blocks/screens. Contains {{antiPatterns}} named AI-slop anti-patterns (AP-01–{{apLast}}) with code examples, remediation, and a decision table. The governing principle: *prefer typographic hierarchy over decorative elements for structural labeling; reserve badges/pills/chips for stateful information only.*
   - `visual-compositor/audit-checklist.md` — Load at the END of layout tasks for final verification.
   - `shavin-webpage/` files — Load for marketing/landing page architecture, editorial craft, and style recipes.
   - `layout-compositions/` — Load for any page/section layout work: {{compositions}} compositions across {{families}} families, selection guide, treatments, foundations, page recipes.
   - `layout-motion/` — Load for Tier 1 restrained motion (reveals, hovers, count-ups, marquees).
   - `layout-choreography/` — Load for Tier 2 cinematic/awwwards motion (pinned scrollytelling, scroll-scrubbed timelines, horizontal scroll, split-text reveals).
   - `shavin-app/SKILL.md` — Load for SaaS/dashboard tasks.
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
| **SaaS Apps, Dashboards, Data Tables, Consoles** | `.agents/skills/shavin-app/SKILL.md` | `AppFrame`, `Sidebar`, high-density mode (scaling 95%), concentric panel-p5 nesting, skeleton loading states, table row actions. |
| **Anti-Pattern Review & AI-Slop Prevention** | `.agents/skills/visual-compositor/anti-patterns.md` | {{antiPatterns}} named anti-patterns (AP-01–{{apLast}}): Defensive Minimalism, Glow Balls, Stock Photos, Badge Soup, Paragraph Walls, Metric Clutter, Kitchen-Sink Bento, Status-Chip Soup, Over-Containment, Vacuous Copywriting, Lazy Placeholders, Harsh Border Glare, Sparkles Icon. Load before composing or when output "feels AI-generated". |
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

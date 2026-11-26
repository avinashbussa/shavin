---
name: visual-compositor
description: >
  Precise structural and spatial composition rules for web pages and web apps.
  Covers concentric spacing, concentric radius, layout rhythm, section architecture,
  flex/grid spacing, container nesting depth, and token-mapped values for @shavin/ui.
  Activate whenever composing or reviewing a page layout, section structure, card nesting,
  flex arrangement, or any spatial decision in HTML/JSX. Works alongside shavin-webpage
  (marketing/content pages) and shavin-app (app screens).
sections:
  - id: activation-modes
    description: "Mode identification (STRUCTURAL/MARKETING/EDITORIAL/HYBRID/DOCS) — in this file's body. This table is the canonical source of truth for mode selection; see 'Precedence' subsection for how it relates to SHAVIN.md defaults and the get_skill_mode MCP tool."
  - id: cognitive-layer
    file: cognitive-layer.md
    description: "Pre-generation checklist, state coverage, affordances, action hierarchy — CORE: load before generating a screen (~2.3K tokens)"
  - id: concentric-laws
    file: concentric-laws.md
    description: "Concentric radius and spacing laws — CORE: load for any nested radius or padding (~1.8K tokens)"
  - id: spacing-core
    file: spacing-core.md
    description: "Section architecture, flex/grid, alignment, containment, nesting, responsive — CORE: load for any section, flex or grid structure (~4.4K tokens)"
  - id: spacing-marketing
    file: spacing-marketing.md
    description: "Hierarchy stack, visual weight, negative space, first-3-seconds, gradient blending — MARKETING/EDITORIAL (~2.5K tokens)"
  - id: spacing-dense
    file: spacing-dense.md
    description: "Density framework, monospace restraint — STRUCTURAL/dashboards (~1K tokens)"
  - id: graphics-and-assets
    file: graphics-and-assets.md
    description: "Atmospheric depth, soft pastel meshes, 3D abstract assets, scrims (~2.5K tokens)"
  - id: layout-restraint
    file: layout-restraint.md
    description: "Anti-bloat, single clear thought, breathing room, visual elegance (~2.5K tokens)"
  - id: typography-rules
    file: typography-rules.md
    description: "Type scale snapping, text-balance, tabular-nums, optical contrast (~2.5K tokens)"
  - id: interface-polish
    file: interface-polish.md
    description: "Tactile scale on press, anti-box law, Lummi-mesh recipes, optical alignment (~2.5K tokens)"
  - id: motion-and-physics
    file: motion-and-physics.md
    description: "Emil Kowalski animation framework, custom easings, duration/distance/stagger tokens, reduced-motion safety net, Rauno stagger choreography — CORE: load for any animation or transition (~3.4K tokens)"
  - id: page-motion-presets
    file: page-motion-presets.md
    description: "Tier-1 entrance presets (fade-rise, blur-rise, split-stagger, word-reveal, scale-in, slide-in) using motion tokens — loaded for MARKETING/EDITORIAL/HYBRID page composition (~2K tokens)"
  - id: composition-motion-map
    file: composition-motion-map.md
    description: "Which motion preset to apply per layout composition. Includes new compositions (ST, H5, F6, C4, E, D, X). 'None' is a valid answer — loaded alongside page-motion-presets (~2K tokens)"
  - id: font-pairings
    file: font-pairings.md
    description: "Font pairings by mode — loaded when making font decisions (~2.5K tokens)"
  - id: editorial-mode
    file: editorial-mode.md
    description: "Editorial & expressive mode — loaded ONLY for EDITORIAL/HYBRID (~0.5K + ~1.5K reference)"
  - id: docs-mode
    file: docs-mode.md
    description: "Documentation-portal mode (persistent sidebar nav, dense reference prose, code blocks) — loaded ONLY for DOCS (~0.5K tokens)"
  - id: audit-checklist
    file: audit-checklist.md
    description: "Master anti-pattern table + audit checklist — loaded at end of tasks (~2.5K tokens)"
  - id: anti-patterns
    file: anti-patterns.md
    description: "Consolidated named anti-pattern catalogue (AP-01–AP-13) with code examples, remediation, and decision table — loaded when composing/reviewing blocks or when output 'feels AI-generated' (~2K tokens)"
---

# Visual Compositor — Spatial Composition Engine

## Do this first

- **Components only.** Every UI element is a `@shavin/ui` component. No raw `button`/`input`/`table`/`dialog`, no hand-styled div imitations, no other UI library in new code. Tokens only (no hex, `rgb()`, `--n-*`).
- **Six states.** Every surface covers first-time, empty, loading, error, success and disabled: see `shavin-app` section `state`.
- **Every UI turn.** These rules apply on every UI-writing turn, including small follow-ups. Run `validate_code` / `check_page` (no MCP: `npx shavin-lint-tokens <path>`).
- **Theme.** New site or page with colours and fonts still `UNSET` in `SHAVIN.md`: pick them from the brief, apply with `npx @shavin/cli brand`, then tell the user what you chose after the first page: section `font-pairings`, "Theme for a new site or page".
- **Mode.** Resolve it with the Mode Precedence below: explicit user request > `SHAVIN.md` > `get_skill_mode` (advisory) > default (`STRUCTURAL` for app screens, `MARKETING` otherwise). Declare it before writing markup (see Mode Declaration).
- **Load files.** CORE files load when the task touches their area (see the table); nothing is injected. Mode files load by mode.

- **File usage:** This skill is split into 17 files:

| File | When to load | Tokens |
|------|-------------|--------|
| `cognitive-layer.md` | **CORE** — before generating a screen: states, affordances, action hierarchy | ~2.3K |
| `concentric-laws.md` | **CORE** — any nested radius or padding | ~1.8K |
| `spacing-core.md` | **CORE** — section, flex and grid structure, alignment, responsive | ~4.4K |
| `layout-restraint.md` | **CORE** — content density of sections: one idea, anti-bloat, breathing room | ~1.1K |
| `typography-rules.md` | **CORE** — any text hierarchy: type scale, balance, tabular-nums, line length | ~1.5K |
| `interface-polish.md` | **CORE** — buttons, interaction feel, anti-box law, depth recipes | ~1.8K |
| `motion-and-physics.md` | **CORE** — any animation or transition: easings, motion tokens, reduced motion | ~3.4K |
| `page-motion-presets.md` | **MARKETING / EDITORIAL / HYBRID** — entrance preset recipes using motion tokens | ~2K |
| `composition-motion-map.md` | **MARKETING / EDITORIAL / HYBRID** — which preset per composition + new compositions | ~2K |
| `graphics-and-assets.md` | **MARKETING / EDITORIAL / HYBRID** — atmospheric depth, pastel meshes, 3D abstract assets | ~2.5K |
| `spacing-marketing.md` | **MARKETING / EDITORIAL** — hierarchy stack, visual weight, negative space, first-3-seconds, gradient blending | ~2.5K |
| `spacing-dense.md` | **STRUCTURAL / DOCS** — density framework, monospace restraint | ~1K |
| `font-pairings.md` | When choosing fonts for a project | ~2.5K |
| `editorial-mode.md` | **ONLY** for EDITORIAL mode or HYBRID hero sections | ~0.5K + ~1K reference |
| `docs-mode.md` | **ONLY** for DOCS mode | ~0.5K |
| `audit-checklist.md` | At the END of layout tasks for final verification | ~2.5K |
| `anti-patterns.md` | When composing/reviewing blocks, or when output "feels AI-generated" | ~2K |

- **Core rules (token compliance, radius basics, typography hierarchy, font loading, anti-slop):** in `.agents/skills/core-rules.md`; not injected. Read it when you need the full detail.

- This skill governs **how space and shape are structured** in a layout: how to say it geometrically, not what to say. Domain skills: `shavin-webpage` (marketing, editorial, docs pages), `shavin-app` (app screens).

---

## Activation Modes

**The first thing you do** on any layout task is identify the mode. Different modes activate different rule sets. Getting this wrong applies constraints that don't fit the intent — or worse, misses constraints that do.

### Mode Identification

Read the user's request for these signal words:

| Mode         | Trigger phrases / signals                                                                                                           | Common aliases / colloquial intent                                                                                                                                                                                                                                                                                                            | Representative examples                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `STRUCTURAL` | "dashboard", "admin", "app", "SaaS product", "data", "analytics", "console", "tool", "settings", "table", "form"                    | "like Linear", "like Figma", "like Notion", "make it dense", "data-heavy", "productivity app", "enterprise UI", "control panel"                                                                                                                                                                                                               | Figma, Linear, Notion, analytics dashboards, admin panels          |
| `MARKETING`  | "landing page", "marketing site", "homepage", "pricing", "product page", "website"                                                  | "like Stripe", "like Vercel", "like Linear's site", "SaaS site", "startup page", "conversion page", "clean and modern", "professional"                                                                                                                                                                                                        | SaaS homepages, product marketing sites                            |
| `EDITORIAL`  | "awwwards", "agency", "portfolio", "creative", "immersive", "brand experience", "artsy", "luxury", "cinematic", "scroll experience" | **"awwwards style"**, **"fancy"**, **"expressive"**, **"more animations"**, **"wow factor"**, **"make it pop"**, "editorial", "high-end", "premium feel", "bold", "loud", "magazine", "art direction", "motion-heavy", "parallax", "boutique", "curator", "bespoke", "storytelling", "experiential", "like apple.com", "like bruno-simon.com" | Agency sites, creative studios, brand launches, portfolios         |
| `HYBRID`     | Mixed signals — a product that also needs to market itself; one page containing both a marketing hero and an interactive product UI | "product launch", "show the app inside the page", "interactive demo on homepage", "half marketing half product"                                                                                                                                                                                                                               | SaaS product launch pages, interactive demos embedded in marketing |
| `DOCS`       | "documentation", "docs portal", "docs site", "API reference", "changelog", "guide pages"                                            | "like Stripe docs", "like Tailwind docs", "reference site", "knowledge base"                                                                                                                                                                                                                                                                   | docs.shavin.cc, API reference portals, changelog sites             |

- 💡 **Colloquial phrase matching is first-class input.** Users rarely say "EDITORIAL"; they say "make it fancy", "awwwards style", or "add more animations". These aliases are equal weight signals to the formal trigger words — don't require the user to use the exact terminology. If a request for a **new page or page type** includes an alias phrase (e.g. "expressive", "wow factor", "luxury"), trigger `EDITORIAL`. Aliases ("make it pop", "bold", "professional", "clean and modern") on a **follow-up edit to an existing page or screen** never flip the mode: the mode stays fixed by `SHAVIN.md` (or the mode already in use) unless the user asks for a new page type.

**Mode Precedence (canonical):** explicit user request (trigger or alias for a new page/page type) > `SHAVIN.md` `Default Visual Mode` (`## 3. Site & Mode Defaults`) > `get_skill_mode` (advisory only; never returns `HYBRID` or `DOCS`) > default: `STRUCTURAL` when the task is an app screen, else `MARKETING`.

**Floor in every mode (relaxed modes never drop these):** components-only (`@shavin/ui`), semantic tokens only, and the six states (`shavin-app` section `state`). Relaxed rules below apply to spatial and decorative choices only.

### Mode Rule Map

This table shows which files/sections apply to each mode and whether rules are strict, relaxed, or suspended:

| File / Section              | STRUCTURAL |  MARKETING   |        EDITORIAL        |      HYBRID      |       DOCS       |
| --------------------------- | :--------: | :----------: | :---------------------: | :--------------: | :---------------: |
| `cognitive-layer.md`        |     ✅     |      ✅      |          ✅             |        ✅        |        ✅         |
| `concentric-laws.md`        | ✅ Strict  |  ✅ Strict   |      ⚠️ Relaxed\*       |    ✅ Strict     |    ✅ Strict      |
| `spacing-core.md`           | ✅ Strict  |  ✅ Strict   |      ✅ Strict          |    ✅ Strict     |    ✅ Strict      |
| `layout-restraint.md`       | ✅ Strict  |  ✅ Strict   |      ✅ Strict          |    ✅ Strict     |    ✅ Strict      |
| `typography-rules.md`       | ✅ Strict  |  ✅ Strict   |      ✅ Strict          |    ✅ Strict     | ✅ Strict (prose) |
| `interface-polish.md`       | ✅ Strict  |  ✅ Strict   |      ✅ Strict          |    ✅ Strict     |    ✅ Strict      |
| `motion-and-physics.md`      | ✅ Strict  |  ✅ Strict   |      ✅ Strict          |    ✅ Strict     |    ✅ Strict      |
| `page-motion-presets.md`     |  ⛔ Skip   |     ✅       |          ✅             | ✅ Hero sections |     ⛔ Skip       |
| `composition-motion-map.md`  |  ⛔ Skip   |     ✅       |          ✅             | ✅ Hero sections |     ⛔ Skip       |
| `graphics-and-assets.md`    | ⚠️ Subtle  |     ✅       |          ✅             |        ✅        |     🚫 Skip       |
| `spacing-marketing.md`      |  🚫 Skip   |     ✅       |          ✅             | ✅ Hero sections |     🚫 Skip       |
| `spacing-dense.md`          |     ✅     |  🚫 Skip     |        🚫 Skip          |    ⚠️ If dense    |        ✅         |
| `font-pairings.md`          |     ✅     |      ✅      |          ✅             |        ✅        |        ✅         |
| `editorial-mode.md`         |  🚫 Skip   | ⚠️ Hero only |     ✅ Full chapter     | ✅ Hero sections |     🚫 Skip       |
| `docs-mode.md`               |  🚫 Skip   |    🚫 Skip   |         🚫 Skip         |     🚫 Skip      |  ✅ Full chapter  |
| `audit-checklist.md`        |     ✅     |      ✅      |          ✅             |        ✅        |        ✅         |
| `anti-patterns.md`          |     ✅     |      ✅      |          ✅             |        ✅        |        ✅         |

\*Relaxed = the rule holds as a baseline but editorial intentionality overrides specific constraints. You must still be able to justify every deviation.

### Mode Declaration

At the start of any layout task, declare the mode explicitly before writing markup:

```
// MODE: EDITORIAL
// Trigger: "award-winning agency portfolio, scroll experience"
// Files loaded: cognitive-layer, concentric-laws, spacing-core, layout-restraint, typography-rules, interface-polish, motion-and-physics, page-motion-presets, composition-motion-map, graphics-and-assets, spacing-marketing, font-pairings, editorial-mode
// Relaxed constraints: Concentric spacing in hero, content width budget, density floor
// Floor kept: components-only, tokens-only, six states
```

---

## File Loading Guide

### Always Load (ALL MODES)

1. **`cognitive-layer.md`** — Pre-generation checklist, state coverage, affordances, action hierarchy, navigation/orientation, progressive disclosure. Reason about purpose before writing components.
2. **`concentric-laws.md`** — The two concentric laws (radius + spacing) that govern every spatial decision
3. **`spacing-core.md`** — Section architecture, flex/grid rules, typography spacing, alignment, containment, nesting, responsive, repeating units, spatial scale reference
4. **`layout-restraint.md`** — Anti-bloat, single clear thought, breathing room, avoiding content dumping
5. **`typography-rules.md`** — Type scale snapping, text-balance, tabular-nums, reading length bounds, optical text gradients
6. **`interface-polish.md`** — Tactile scale on press, anti-box law, Lummi-mesh recipes, motion polish
7. **`motion-and-physics.md`** — Animation framework, motion tokens (dur/dist/stagger), reduced-motion safety net

### Load by Mode

8. **`page-motion-presets.md`** — Load for **MARKETING / EDITORIAL / HYBRID** modes. Tier-1 entrance presets (fade-rise, blur-rise, split-stagger, word-reveal, scale-in, slide-in) using motion tokens.
9. **`composition-motion-map.md`** — Load alongside `page-motion-presets.md`. Maps each layout composition to its suggested motion preset. Includes new compositions (ST, H5, F6, C4, E, D, X).
10. **`graphics-and-assets.md`** — Load for **MARKETING / EDITORIAL / HYBRID** modes. Atmospheric depth, soft pastel meshes, 3D abstract assets, directional scrims.
11. **`spacing-marketing.md`** — Load for **MARKETING / EDITORIAL** modes. Hierarchy stack, visual weight balance, negative space budget, first-3-seconds rule, gradient blending.
12. **`spacing-dense.md`** — Load for **STRUCTURAL / DOCS** mode (dashboards, admin panels, data tables, documentation). Density framework, monospace restraint.
13. **`font-pairings.md`** — Load when choosing fonts. Contains mode-specific curated pairings.
14. **`editorial-mode.md`** — Load **ONLY** for EDITORIAL mode or HYBRID hero sections. Contains motion architecture, 3D transforms, glassmorphism, theatrical space.
15. **`docs-mode.md`** — Load **ONLY** for DOCS mode. Documentation-specific layout patterns, reading ergonomics, code-block density, and navigation hierarchy for reference/learning content.

### Load at End

16. **`audit-checklist.md`** — Load after completing a layout for final verification. Contains the master anti-pattern table (single source of truth).

---

## Cross-References

- **Core rules (token compliance, radius basics, typography hierarchy, font loading):** in `.agents/skills/core-rules.md`; not injected. Read it when you need the full detail
- **Domain-specific patterns:** See `shavin-app` (dashboards) or `shavin-webpage` (marketing pages)
- **Full editorial reference:** See `references/EDITORIAL_EXPRESSIVE.md` for complete code blocks

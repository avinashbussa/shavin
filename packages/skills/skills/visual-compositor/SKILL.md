---
name: visual-compositor
description: >
  Precise structural and spatial composition rules for web pages and web apps.
  Covers concentric spacing, concentric radius, layout rhythm, section architecture,
  flex/grid spacing, container nesting depth, and token-mapped values for @shavin/ui.
  Activate whenever composing or reviewing a page layout, section structure, card nesting,
  flex arrangement, or any spatial decision in HTML/JSX. Works alongside visual-language-skills
  (cognitive layer) and shavin-pages / shavin-app (domain layer).
sections:
  - id: activation-modes
    description: "Mode identification (STRUCTURAL/MARKETING/EDITORIAL/HYBRID/DOCS) — ALWAYS loaded. This table is the canonical source of truth for mode selection; see 'Precedence' subsection for how it relates to SHAVIN.md defaults and the get_skill_mode MCP tool."
  - id: cognitive-layer
    file: cognitive-layer.md
    description: "Pre-generation checklist, state coverage, affordances, action hierarchy — ALWAYS loaded (~2K tokens)"
  - id: concentric-laws
    file: concentric-laws.md
    description: "Concentric radius and spacing laws — ALWAYS loaded (~1.8K tokens)"
  - id: spacing-core
    file: spacing-core.md
    description: "Section architecture, flex/grid, alignment, containment, nesting, responsive — ALWAYS loaded (~4K tokens)"
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
    description: "Emil Kowalski animation framework, custom easings, duration/distance/stagger tokens, reduced-motion safety net, Rauno stagger choreography — ALWAYS loaded (~3K tokens)"
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

- **Token-efficient usage:** This skill is split into 15 files. Load only what you need:

| File | When to load | Tokens |
|------|-------------|--------|
| `cognitive-layer.md` | **ALWAYS** — pre-generation reasoning, states, affordances | ~2K |
| `concentric-laws.md` | **ALWAYS** — governs every spatial decision | ~2K |
| `spacing-core.md` | **ALWAYS** — section architecture, flex/grid, alignment, containment, responsive | ~4K |
| `layout-restraint.md` | **ALWAYS** — anti-bloat, single clear thought, spatial breathing room | ~2.5K |
| `typography-rules.md` | **ALWAYS** — type scale snapping, text-balance, tabular-nums, reading length | ~2.5K |
| `interface-polish.md` | **ALWAYS** — tactile feedback, anti-box law, Lummi-mesh atmospheric recipes | ~2.5K |
| `motion-and-physics.md` | **ALWAYS** — animation framework, motion tokens (dur/dist/stagger), reduced-motion safety net, Rauno stagger | ~3K |
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

- **Core rules (token compliance, radius basics, typography hierarchy, font loading, anti-slop):** Auto-injected by MCP `get_skill` or see `core-rules.md` directly (No-MCP path).

> This skill governs **how space and shape are structured** in a layout — not what to say, but how to say it geometrically. It is the implementation-level companion to `visual-language-skills`, which governs cognitive intent.

Read `visual-language-skills` first for the _why_. Read this for the _how_.

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

- 💡 **Colloquial phrase matching is first-class input.** Users rarely say "EDITORIAL"; they say "make it fancy", "awwwards style", or "add more animations". These aliases are equal weight signals to the formal trigger words — don't require the user to use the exact terminology. If the request includes even one alias phrase (e.g. "expressive", "wow factor", "luxury"), trigger `EDITORIAL` mode immediately.

**Precedence over per-project defaults and MCP:**
1. If the current task's request contains an explicit trigger/alias from the table above, that wins.
2. Otherwise, read the project's `SHAVIN.md` (`## 3. Site & Mode Defaults` → `Default Visual Mode`) if present — see `skills/shavin-core/SKILL.md`. This is the per-repo static default (e.g. `shavin.cc` → `MARKETING`/`EDITORIAL`, `docs.shavin.cc` → `DOCS`).
3. Only if neither applies, and `shavin-mcp` is connected, `get_skill_mode` may be called as a last-resort heuristic hint — **but treat its result as advisory only.** As shipped, `get_skill_mode` recognizes just three modes (`STRUCTURAL` default, `MARKETING`, `EDITORIAL`) and never returns `HYBRID` or `DOCS`; it disagrees with this table's default. This table is the source of truth — if `get_skill_mode` and this table conflict, this table wins.
4. If none of the above resolve it: default to `MARKETING`. (Note this differs deliberately from `get_skill_mode`'s own default of `STRUCTURAL` — that tool's default was written for its keyword-scoring use case in `synthesize_layout` and should not be read as this skill's guidance.)

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
// Files loaded: concentric-laws, spacing-core, layout-restraint, typography-rules, interface-polish, graphics-and-assets, font-pairings, editorial-mode
// Relaxed constraints: Concentric spacing in hero, content width budget, density floor
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

### Load by Mode

7. **`page-motion-presets.md`** — Load for **MARKETING / EDITORIAL / HYBRID** modes. Tier-1 entrance presets (fade-rise, blur-rise, split-stagger, word-reveal, scale-in, slide-in) using motion tokens.
8. **`composition-motion-map.md`** — Load alongside `page-motion-presets.md`. Maps each layout composition to its suggested motion preset. Includes new compositions (ST, H5, F6, C4, E, D, X).
9. **`graphics-and-assets.md`** — Load for **MARKETING / EDITORIAL / HYBRID** modes. Atmospheric depth, soft pastel meshes, 3D abstract assets, directional scrims.
10. **`spacing-marketing.md`** — Load for **MARKETING / EDITORIAL** modes. Hierarchy stack, visual weight balance, negative space budget, first-3-seconds rule, gradient blending.
11. **`spacing-dense.md`** — Load for **STRUCTURAL / DOCS** mode (dashboards, admin panels, data tables, documentation). Density framework, monospace restraint.
12. **`font-pairings.md`** — Load when choosing fonts. Contains mode-specific curated pairings.
13. **`editorial-mode.md`** — Load **ONLY** for EDITORIAL mode or HYBRID hero sections. Contains motion architecture, 3D transforms, glassmorphism, theatrical space.
14. **`docs-mode.md`** — Load **ONLY** for DOCS mode. Documentation-specific layout patterns, reading ergonomics, code-block density, and navigation hierarchy for reference/learning content.

### Load at End

15. **`audit-checklist.md`** — Load after completing a layout for final verification. Contains the master anti-pattern table (single source of truth).

---

## Cross-References

- **Core rules (token compliance, radius basics, typography hierarchy, font loading):** See `core-rules.md` (auto-injected by MCP)
- **Cognitive design principles:** See `visual-language-skills` for the _why_ behind these rules
- **Domain-specific patterns:** See `shavin-app` (dashboards) or `shavin-webpage` (marketing pages)
- **Full editorial reference:** See `references/EDITORIAL_EXPRESSIVE.md` for complete code blocks

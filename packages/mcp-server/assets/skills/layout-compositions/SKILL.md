---
name: layout-compositions
description: >
  A library of 55 website section and page layout compositions (structural, hero, features,
  proof, conversion, gallery, editorial, documentation, expressive) with content-based selection
  rules, five swappable treatments (carded, ruled, flat, full-bleed, open), a component-language
  guide for typography voice, overline/badge choice, button-vs-tabs and colour application, page
  recipes, and @shavin/ui adapters. Use this whenever the user is designing, building, restyling,
  reviewing or auditing a web page or any section of one — landing page, marketing site, docs site,
  blog or magazine layout, portfolio, dashboard shell, hero, feature grid, bento, pricing, FAQ,
  testimonials, stats, CTA, footer, navigation, gallery, article page, changelog — even if they
  never say "layout" or "composition". Also use for "which layout should I use", section ordering,
  page structure, and "make this page feel less generic or repetitive". For simple reveals, hovers,
  count-ups and marquees, follow up with layout-motion; for pinned, scroll-scrubbed or
  timeline-driven awwwards-style motion, follow up with layout-choreography.
sections:
  - id: selection-guide
    file: references/selection-guide.md
    description: "Decision tables — which composition for which job, by content signals (~3K tokens)"
  - id: treatments
    file: references/treatments.md
    description: "5 swappable treatments (carded, ruled, flat, full-bleed, open) with @shavin/ui recipes (~1K tokens)"
  - id: distinctiveness
    file: references/distinctiveness.md
    description: "Sameness test, variation knobs, bold moment rules (~1K tokens)"
  - id: component-language
    file: references/component-language.md
    description: "Overline form, button-vs-tabs, typographic voice, colour application patterns (~2K tokens)"
  - id: foundations
    file: references/foundations.md
    description: "Measure, concentric radii, spacing rhythm, accessibility baseline, stress tests (~2K tokens)"
  - id: page-recipes
    file: references/page-recipes.md
    description: "Pre-composed multi-section page blueprints (~1.5K tokens)"
  - id: metadata-schema
    file: references/metadata-schema.md
    description: "Yaml frontmatter spec for composition entries (~1K tokens)"
  - id: compositions-structural
    file: references/compositions/structural.md
    description: "ST1–ST6: nav bar, announcement, footer, page shell, app shell (~3K tokens)"
  - id: compositions-hero
    file: references/compositions/hero.md
    description: "H1–H5: centered, split, asymmetric, full-bleed, type-led (~3K tokens)"
  - id: compositions-features
    file: references/compositions/features.md
    description: "F1–F9: grid, bento, alternating, card rail, tabs, sticky scroll, timeline, comparison split, ecosystem diagram (~5K tokens)"
  - id: compositions-proof
    file: references/compositions/proof.md
    description: "P1–P4, S1–S3, T1–T4: pricing, stats, testimonials, logos (~3K tokens)"
  - id: compositions-conversion
    file: references/compositions/conversion.md
    description: "C1–C5, Q1–Q2: CTA banners, contact, newsletter, FAQ (~4K tokens)"
  - id: compositions-gallery
    file: references/compositions/gallery.md
    description: "G1–G5: masonry, filterable, marquee rows, case study, people (~2.5K tokens)"
  - id: compositions-editorial
    file: references/compositions/editorial.md
    description: "E1–E4: article, longform, magazine, archive (~2.5K tokens)"
  - id: compositions-documentation
    file: references/compositions/documentation.md
    description: "D1–D4: docs shell, API ref, changelog, landing (~2.5K tokens)"
  - id: compositions-expressive
    file: references/compositions/expressive.md
    description: "X1–X5: broken-grid, type wall, sticky split, horizontal track, hover preview (~3K tokens)"
  - id: adapter-shavin-ui
    file: references/adapters/shavin-ui.md
    description: "@shavin/ui adapter — Grid, Flex, Section, Card, Container, tokens, concentric radius, component language (~2K tokens)"
  - id: adapter-tailwind-html
    file: references/adapters/tailwind-html.md
    description: "Semantic HTML + Tailwind adapter for non-@shavin/ui projects (~1.5K tokens)"
---

- **Token-efficient usage:** This skill is modular. For specific rules, call:
> - `get_skill({ name: "layout-compositions", section: "selection-guide" })` — decision tables for choosing compositions
> - `get_skill({ name: "layout-compositions", section: "page-recipes" })` — pre-composed page blueprints
> - `get_skill({ name: "layout-compositions", section: "compositions-hero" })` — hero family detail (H1–H5)
> - `get_skill({ name: "layout-compositions", section: "compositions-features" })` — feature family detail (F1–F9)
> - `get_skill({ name: "layout-compositions", section: "treatments" })` — treatment recipes
> - `get_skill({ name: "layout-compositions", section: "component-language" })` — overline form, control choice, type voice, colour patterns
> - `get_skill({ name: "layout-compositions", section: "foundations" })` — measure, radii, accessibility
> - `get_skill({ name: "layout-compositions", section: "adapter-shavin-ui" })` — @shavin/ui code patterns
>
> Load a family file only when you use one of its IDs. Loading the whole library wastes context.
>
> **Core rules (token compliance, radius, typography):** Auto-injected by MCP or see `core-rules.md`.

# Layout Compositions

A composition is a **spatial arrangement** of a section: columns, spans, order, what goes where. It is deliberately separate from two other layers:

| Layer | Question it answers | Where it lives |
|---|---|---|
| **Skeleton** (composition) | How is the section arranged? | `references/compositions/` |
| **Treatment** | What container language dresses it? (cards, rules, flat blocks, edge-to-edge, open space) | `references/treatments.md` |
| **Motion** | What happens over time? (Tier 0 none · Tier 1 light presets · Tier 2 choreography) | `layout-motion`, `layout-choreography` skills |

Keeping these apart is what lets one library serve marketing, editorial, documentation and expressive work without copies of everything.

## Workflow

Follow these steps in order. Output a short plan (step 2–4) before writing code so the choices are visible and correctable.

**With the Shavin MCP connected:** call `plan_page({ brief })` — it picks the recipe, lists composition candidates per section with their contracts, sets the default treatment and motion tier, and returns a plan template for steps 2–4. Fill it, save it as `.shavin/plans/<page>.json`, and run `check_page({ plan })` before code. Build every section as `<Section data-composition="<ID>">`; finish with `check_page({ targetDir })`, which checks the code against the plan.

1. **Frame the brief.** Identify the subject, audience, style (structural · marketing · editorial · hybrid · documentation · expressive), the page's job, and the *real* content available: item counts, copy length, real visuals, numbers, quotes, code. If key content is missing, say so and use clearly marked placeholders. Compositions have content contracts, and fake proof (invented numbers, quotes, logos) undermines the page.
2. **Pick the section sequence.** Start from the closest recipe in `references/page-recipes.md`, then adjust to the real content.
3. **Choose a composition per section** using `references/selection-guide.md`. It works from content signals and has tie-breakers. Then read only those entries in `references/compositions/<family>.md`: honour each entry's `Contract`, `Grid`, `Watch` and `Avoid when`.
4. **Choose the treatment** (`references/treatments.md`): one dominant treatment for the page, at most one accent. Then **vary**: apply at least two knobs from `references/distinctiveness.md`, and separately name the overline form, interactive-control choice, typographic voice and colour application pattern from `references/component-language.md` — these component-level choices are where output goes generic even when the composition and treatment are varied. Name one bold moment.
5. **Read the adapter** for the target stack: `references/adapters/shavin-ui.md` for `@shavin/ui` projects. Never invent component props: check the project's real components.
6. **Apply the foundations** in `references/foundations.md`: measure, concentric radii, spacing rhythm, responsive behaviour, accessibility, performance, stress tests.
7. **Decide the motion tier.** Default Tier 0 for utility and documentation pages. Add Tier 1 (`layout-motion`) where it helps comprehension or delight. When the brief asks for a premium, award-level, expressive or brand-led page, plan one signature Tier 2 scene (`layout-choreography`, on a composition marked `choreography-ok`, such as F6) plus at most two supporting scenes; a page like that with no signature moment reads as generic. Build Tier 2 only after the static layout is complete. Expose `data-slot` attributes (from each composition's `slots`) so motion can attach without changing the structure.
8. **Verify** with the checklist below, then do the **visual review** (`references/visual-review.md`): screenshot the rendered page at 375, 768 and 1280, score it against the rubric, measure contrast, fix and re-check. Passing `check_page` is not a visual review.

## Reference map

| When you need… | Read |
|---|---|
| To choose compositions | `references/selection-guide.md` |
| A starting sequence for a page type | `references/page-recipes.md` |
| The detail of a specific composition | `references/compositions/<family>.md` (families: structural, hero, features, proof, conversion, gallery, editorial, documentation, expressive) |
| To change how it looks without changing the structure | `references/treatments.md` |
| To avoid a generic result at the layout level | `references/distinctiveness.md` |
| To avoid a generic result in typography, labels, controls and colour | `references/component-language.md` |
| Rules that apply to every section | `references/foundations.md` |
| To review the rendered page before finishing | `references/visual-review.md` |
| Code for `@shavin/ui` | `references/adapters/shavin-ui.md` |
| Code for plain HTML + Tailwind | `references/adapters/tailwind-html.md` |
| To add or change a composition | `references/metadata-schema.md` and `/add-composition` |

Load a family file only when you use one of its IDs. Loading the whole library wastes context.

## Ground rules

- **Content contract first.** If the real content doesn't fit a composition's contract (item counts, lengths, required media), change the composition, not the content, and never squeeze it in.
- **One job per section, one primary action per section.**
- **Rhythm.** No three consecutive sections with the same grid. Adjacent sections differ in at least one of background, alignment, density, or column count.
- **Reading order is DOM order.** Reorder visually with CSS only where the composition says so.
- **Nothing depends on motion or JS.** Content is present and complete with animation off.
- **Don't fabricate** proof: numbers, testimonials, logos and case-study results come from the user or are labelled placeholders.
- **Skeletons, not templates.** Adapt copy, proportions and emphasis to the subject; the compositions are starting structures.
- **Token purity.** All colours use `@shavin/ui` semantic tokens (`bg-surface`, `text-fg`, `text-fg-subtle`, `border-hairline`). Zero hex/rgb/`--n-*`. Container surfaces use `rounded-[var(--radius-panel)]`; controls use `rounded-[var(--radius-lg)]`. Concentric nesting via `rounded-panel-inner` or `rounded-panel-p5`.

## Verification checklist

Before handing work back, confirm:

1. Every section maps to a composition ID (or is a documented deviation) and carries `data-composition="<ID>"` (`"none"` only for utility screens such as auth or 404). `check_page({ targetDir })` verifies this.
2. Each composition's `Contract` is met by the actual content.
3. Mobile order equals reading order; nothing scrolls sideways except dedicated scrollers.
4. One `<h1>`, sequential headings, labelled landmarks, visible focus.
5. Contrast passes, including text over media.
6. Anything that moves for more than 5 seconds can be paused; reduced motion is respected.
7. The hero media is loaded eagerly with dimensions set; the rest is lazy; nothing shifts.
8. The rhythm rule holds across the page.
9. At least two variation knobs were changed from the recipe and one bold moment is named.
10. Overline form, interactive-control choice, typographic voice and colour application pattern are each named — not left as whatever the framework's defaults happened to produce.
11. Long-headline, missing-image and item-count stress tests pass (`foundations.md` §7).

## Maintaining the library

Run `python scripts/validate_library.py` after any edit to `references/`. It checks metadata, wireframe alignment, selection-guide coverage and recipe references. Write new wireframes with the DSL and run `python scripts/render_wireframes.py <file>` to align them.

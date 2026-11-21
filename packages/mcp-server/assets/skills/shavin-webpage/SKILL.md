---
name: shavin-webpage
description: >
  Guides the architecture, visual composition, layout design, and implementation of
  marketing pages, landing pages, documentation portals, editorial showcases, and content-driven
  web experiences using @shavin/ui as the base design system engine, powered by cognitive design principles, Vercel Web Interface Guidelines, Meng To editorial craft, and
  high-conversion landing page doctrines. Not for app screens, dashboards, settings, auth or
  onboarding: those go to shavin-app.
sections:
  - id: page-architecture
    file: page-architecture.md
    description: "12-section architecture, intake, layout selection, copywriting, tagline reveal, fluid nav (~3.5K tokens)"
  - id: editorial-craft
    file: editorial-craft.md
    description: "Meng To editorial craft, atmospheric recipes, container lines, progressive blur, UI previews (~3K tokens)"
  - id: style-recipes
    file: style-recipes.md
    description: "Garden Skills calibration dials, 5 flagship style archetypes (Linear, Apple, Stripe, Editorial, Vercel) (~2.5K tokens)"
  - id: blueprint
    description: "Pre-generation design blueprint"
  - id: primitives
    description: "@shavin/ui primitive hierarchy"
  - id: composition
    description: "Web page composition rules"
  - id: checklist
    description: "Pre-flight verification checklist"
---

- Targeted sections: `get_skill({ name: "shavin-webpage", section: "page-architecture" | "editorial-craft" | "style-recipes" })`.
- Layout catalogue: `get_skill({ name: "layout-compositions" })` (57 compositions); motion: `layout-motion` (Tier 1), `layout-choreography` (Tier 2).
- Core rules (tokens, radius, typography, fg vs fg-subtle vs fg-muted, font loading) are in `.agents/skills/core-rules.md` and are not injected. Read it when you need the full detail.
- Mode: `get_skill_mode` is advisory only. Precedence: explicit user request > `SHAVIN.md` > `get_skill_mode` > default (see `visual-compositor` section Mode Precedence). For DOCS sites also load `visual-compositor/docs-mode.md`.
- Without MCP: read `page-architecture.md`, `editorial-craft.md`, `style-recipes.md` directly; take mode from `SHAVIN.md`.
- App screens, dashboards, settings, auth, onboarding and data tables are not webpages: use `shavin-app`.
- Every UI element is a `@shavin/ui` component (no raw HTML controls, no hand-styled div imitations, no other UI library). These rules apply on every UI-writing turn, including small follow-ups.

# shavin-webpage Skill

You are a **Web Experience Architect & Designer** using the **Shavin Design System (`@shavin/ui`)**. Your purpose is to architect, visually compose, and implement stunning, high-converting, accessible, and editorial web experiences — landing pages, marketing sites, documentation portals, and brand showcases.

This skill synthesizes **`@shavin/ui` primitives and design tokens** with cognitive design laws, the engineering craft of **Meng To and Rauno Freiberg**, the motion physics of **Emil Kowalski**, and **Vercel Web Interface Guidelines** to prevent AI UI slop and produce web experiences that are visually breathtaking, cognitively clear, and perfectly structured.

---

## 1. Core Philosophy: Webpages as Visual Stories

> **Law 1:** Perception precedes comprehension. Users form an impression before they read a single line of copy. Shape it intentionally.
> **Law 4:** Attention is finite. Every screen has a budget. If everything is bold and loud, nothing is important.

Webpages are reading paths and visual stories. Unlike web applications (which focus on task execution), webpages focus on **orientation, messaging hierarchy, visual engagement, and narrative flow**.

---

- **Start every page with `plan_page({ brief })`** (Shavin MCP). It turns the brief into a section-by-section composition plan; `check_page` verifies the plan and that every `<Section data-composition="<ID>">` matches it. Without MCP: write the plan yourself (section, composition ID from `layout-compositions`, treatment, motion tier, reason) to `.shavin/plans/<page>.json` before coding.
- **Every section is `<Section data-composition="<ID>">`**, or `"none"` for utility screens (auth, 404).

## 2. Pre-Generation Design Blueprint

Before writing any JSX component code, define the **Web Page Blueprint**:

### 1. The 3-Second Cognitive Goal
What single takeaway must a user understand within 3 seconds of landing here?
_Example: "@shavin/ui is a zero-slop, token-driven React design system built for speed."_

### 2. Narrative Arc & Visual Hierarchy
Define the vertical visual rhythm:
1. **Hero Banner** — Immediate value proposition + primary conversion CTA + preview artifact.
2. **Social Proof / Metrics** — Trust indicators (`<StatCard label value sub>` or logo grids).
3. **Core Feature Grid** — 3–4 key capabilities (`Grid columns="auto"` of `Card`s).
4. **Deep Dive / Interactive Demo** — Live preview or code block showcase (`<CodeBlock>`).
5. **Secondary Information / FAQ** — Accordion disclosures or technical specs.
6. **Closing Conversion Banner** — Final high-contrast CTA section.

### 3. Reading Path & Scanning Pattern
- Use **F-pattern** for documentation and text-heavy pages (`<Container size="md">`, `<Heading>`, `<Text>`, `<List>`).
- Use **Z-pattern** for marketing and feature landing pages (`<Grid columns="2">` alternating image/text blocks).

---

## 3. Base Engine: `@shavin/ui` Primitive Hierarchy & Font Protocol

Always compose using native `@shavin/ui` primitives. Never use raw HTML elements (`<p>`, `<code>`, `<h1-h6>`) when a Shavin primitive exists.

| Category | `@shavin/ui` primitives to use |
|---|---|
| **Page layout** | `Container` (size `xs` 28rem, `sm` 42rem, `md` 56rem, `lg` 72rem, `xl` 88rem, `full`), `Section`, `Grid`, `Flex`, `Box`, `AspectRatio`, `Inset`, `TopBar`, `Breadcrumbs` |
| **Typography** | `Heading`, `Text`, `Strong`, `Em`, `Quote`, `Blockquote`, `Code`, `Link`, `Kbd` |
| **Surfaces & content** | `Card`, `CardList`, `CardListItem`, `Callout`, `Badge`, `Avatar`, `Separator`, `Image`, `List`, `ListItem`, `StatCard`, `CodeBlock` |
| **Interactive** | `Button`, `IconButton`, `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Pagination`, `Carousel` |
| **Page chrome** | No `Header` or `Footer` primitive: build navigation and footers as `Section`/`Container` + `Flex`/`Grid` with `Link` and `Button` (compositions ST1–ST4) |

Font loading protocol: see `core-rules.md` (not injected; read the file).

---

## 4. Web Page Composition & Ergonomic Rules

### Rule 1: Decouple HTML Semantics from Visual Size
- Always set **`as`** for SEO/screen readers (`as="h1"`, `as="h2"`, `as="h3"`).
- Always set **`size`** for visual hierarchy (`size="3xl"`, `size="2xl"`, `size="xl"`, `size="lg"`, `size="sm"`).

```tsx
// Correct: h1 semantic tag, 48px visual display header
<Heading as="h1" size="3xl" className="tracking-tight text-fg font-bold">
  Build Faster with Shavin UI
</Heading>
```

### Rule 2: Token-Only Styling & Concentric Radius
See `core-rules.md` (not injected; read the file) for token compliance and concentric radius rules.

### Rule 3: Typography Color Hierarchy
See `core-rules.md` (not injected; read the file) for fg vs fg-subtle vs fg-muted rules.

### Rule 4: Ergonomics, Performance & Animation (Vercel Guidelines)
- **Zero CLS & Aspect Ratio**: Always reserve space for hero images or graphic mockups via `<AspectRatio ratio="16/9">` or `<Image ratio="4/3">` to prevent layout shift.
- **Mobile Input Safety**: `TextField`, `TextArea`, `Select` and `Combobox` already render 16px below `md`, so iOS never zooms. Do not override font size with `className`. Controls in the same row (search + filter + button) share one `size` so heights match (sm 32px, md 40px, lg 48px).
- **Stack gaps**: `Flex` defaults to `gap="3"` even in a column. A title over a subtitle needs `gap="0"` or `gap="1"`, set explicitly.
- **Compositor-Only Animations**: hand-written animation uses `transform` and `opacity` only; never `transition: all`. Components that own a height animation (`Accordion`, `Skeleton`) are fine to use as shipped.
- **Hit Targets**: Controls reach 44px on touch automatically (24px AA floor). Stand-alone links use `<Link standalone>`; custom controls `hit-area-touch`.

### Rule 5: Page Width via `Container`

Use `<Container size>` for every width. Never hand-write `mx-auto max-w-*` wrappers.

| `size` | Max width | Use |
|---|---|---|
| `xs` | 28rem | Auth card, narrow forms |
| `sm` | 42rem | Measure-limited prose, hero sub-headlines |
| `md` (default) | 56rem | Articles, docs content |
| `lg` | 72rem | Body sections |
| `xl` | 88rem | Nav and footer only |
| `full` | none | Full-bleed media |

```tsx
<Section data-composition="F1">
  <Container size="lg">
    <Grid columns="auto" minWidth="md" gap="4">{/* cards */}</Grid>
  </Container>
</Section>
```

Cap body copy at `size="sm"` measure (about 42rem).

Use one `Container` size for all body sections of a page. Mixing `xl` and `lg` makes the left and right edges jump from section to section, and `xl` never caps at a 1280px viewport, so the content ends up about 24px from the screen edges.

### Rule 6: Anti-Copy Slop & Authentic Messaging Standards
Marketing and product pages quickly look fake and low-effort when filled with generic AI copywriting tropes:
- ❌ **Forbidden Clichés:** *"Empower your growth"*, *"Unleash next-generation innovation"*, *"It's not just a tool. It's a game-changer."*, *"In today's fast-paced world..."*.
- ❌ **Meaningless Feature Titles:** *"Smart Automation"*, *"Effortless Integration"*, *"Maximum Performance"*, *"Seamless Synergy"*.
- ✅ **Specific Value Propositions:** *"Deploy globally across 35 edge regions in <300ms"*, *"Zero-runtime CSS with token-checked Tailwind preset"*, *"Accessible primitives with focus traps, tested against WCAG 2.2 AA"*.
- ✅ **Concrete Numbers & Proof:** Use actual benchmark numbers, concrete customer team sizes, and real technical capabilities.

---

## 5. Layout Compositions — Creative Direction Catalogue

When architecting a page, consult the **layout compositions catalogue** for proven structural patterns. It is a standalone skill with 57 compositions in 9 families:

- 💡 **MCP:** `get_skill({ name: "layout-compositions", section: "selection-guide" })` for decision tables, `section: "compositions-hero"` for a family.
- 💡 **No-MCP:** read `.agents/skills/layout-compositions/references/` directly.

Families:

| Family | IDs | Example Use |
|---|---|---|
| **Structural** | ST1–ST6 | Nav, announcement bar, footer, page shell, app shell |
| **Hero** | H1–H5 | Centered, split, asymmetric, full-bleed, type-led |
| **Features** | F1–F9 | Grid, bento, Z-pattern, card rail, tabs, sticky scroll, timeline, comparison split, ecosystem |
| **Proof** | S1–S3, T1–T4 | Stats, testimonials, logos |
| **Conversion** | C1–C5, P1–P3, Q1–Q2 | CTA, contact, newsletter, pricing, FAQ |
| **Gallery** | G1–G5 | Masonry, filterable, marquee rows, case study, people |
| **Editorial** | E1–E4 | Article, longform, magazine, archive |
| **Documentation** | D1–D4 | Docs shell, API ref, changelog, landing |
| **Expressive** | X1–X5 | Broken-grid, type wall, sticky split, horizontal track, hover preview |

Each composition includes **metadata** (id, family, job, density, styles, treatments, media, slots, motion), **ASCII wireframe**, **Best for / Avoid when / Contract / Grid / Watch** lines, and **page recipes** for multi-section blueprints. Use `/compose-page` to plan and build from the catalogue.

### Motion Tiers

- **Tier 0** (default): No motion. Static is better than gratuitous.
- **Tier 1** (`layout-motion` skill): Restrained presets — reveals, hovers, count-ups, marquees. 11 presets using `--dur-*`, `--dist-*`, `--stagger` tokens.
- **Tier 2** (`layout-choreography` skill): Cinematic/awwwards scenes — pinned scrollytelling, scroll-scrubbed timelines, horizontal scroll, split-text reveals. One signature + two supporting scenes max per page. Requires finished static layout first.

### Composition Selection Principles
1. **Content contract first** — if the real content doesn't fit a composition's contract, change the composition, not the content.
2. **Rhythm** — no three consecutive sections with the same grid. Adjacent sections differ in background, alignment, density, or column count.
3. **One hero, one closing CTA** — every page should open strong and close with intent.
4. **Distinctiveness** — apply at least two variation knobs and name one bold moment (see `layout-compositions/references/distinctiveness.md`).
5. **Preview artifacts > decorative graphics** — always prefer real screenshots, code blocks, or live previews over abstract illustrations.

---

## 6. Pre-Flight Verification Checklist

Before publishing or outputting any webpage code, verify:

- [ ] **3-Second Goal:** Is the primary message instantly clear?
- [ ] **Content Realism:** Is the page copy free of AI marketing clichés (*"Empower"*, *"Revolutionary"*, *"It's not X, it's Y"* tropes)?
- [ ] **Single Focal Point:** Is there exactly one dominant primary CTA in the hero section?
- [ ] **Concentric Radius:** Do embedded card images use `rounded-panel-inner` to align concentric curves?
- [ ] **Zero CLS:** Are all hero images and media previews wrapped in aspect ratio containers?
- [ ] **Compositor Animation:** Are transitions scoped explicitly to `transform` / `opacity` without `transition: all`?
- [ ] **Typography Hierarchy:** Are headings using `<Heading as="h1..h6" size="...">` with proper semantic levels?
- [ ] **Token Compliance:** Are all colors, radii, and spacing using semantic Shavin tokens?
- [ ] **Responsive Grid:** Card grids use `Grid columns="auto" minWidth="..."`; checked at 375, 768 and 1280 wide?
- [ ] **Composition IDs:** Every section is `<Section data-composition="<ID>">` (`"none"` for utility screens) and matches the plan?
- [ ] **States:** Forms, newsletter, search and pricing toggles have empty, loading, error, success and disabled states (six-state rule: `shavin-app` section `state`)?
- [ ] **Validation:** `validate_code` and `check_page` run on every UI turn (no MCP: `npx shavin-lint-tokens <path>`)?
- [ ] **Zero Slop:** Are raw `<p>`, `<code>`, `<b>`, `<ul>/<li>` replaced with native Shavin primitives (`<Text>`, `<Code>`, `<Strong>`, `<List>`, `<ListItem>`)?

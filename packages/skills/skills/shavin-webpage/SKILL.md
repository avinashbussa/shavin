---
name: shavin-webpage
description: >
  Guides the architecture, visual composition, layout design, and implementation of
  marketing pages, landing pages, documentation portals, editorial showcases, and content-driven
  web experiences using @shavin/ui as the base design system engine, powered by visual-language-skills
  cognitive design principles, Vercel Web Interface Guidelines, Meng To editorial craft, and
  high-conversion landing page doctrines.
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

- **Token-efficient usage:** This skill is modular. For specific rules, call:
> - `get_skill({ name: "shavin-webpage", section: "page-architecture" })` — 12-section page structure, copywriting, tagline reveal
> - `get_skill({ name: "shavin-webpage", section: "editorial-craft" })` — atmospheric depth, container lines, progressive blur
> - `get_skill({ name: "shavin-webpage", section: "style-recipes" })` — calibration dials and flagship style archetypes
>
> **Layout compositions:** Now a standalone skill — use `get_skill({ name: "layout-compositions" })` for the 52-composition catalogue, `get_skill({ name: "layout-motion" })` for Tier 1 motion presets, and `get_skill({ name: "layout-choreography" })` for cinematic Tier 2 scenes.
>
> **Core rules (token compliance, radius, typography):** Auto-injected by MCP or see `core-rules.md`.

# shavin-webpage Skill

- 💡 **MCP Routing:** Call `get_skill({ name: "shavin-webpage", section: "<topic>" })` to fetch targeted rules on demand (e.g. `section: "page-architecture"`, `section: "editorial-craft"`, `section: "style-recipes"`). Call `get_skill_mode` to classify the project before writing code — but treat its result as advisory only (see `shavin-core/SKILL.md` §1b); prefer `SHAVIN.md`'s `Default Visual Mode` and `visual-compositor/SKILL.md`'s own Activation Modes table when they conflict with it. For DOCS-mode sites, also load `visual-compositor/docs-mode.md`.
- 💡 **No-MCP fallback:** Read `page-architecture.md`, `editorial-craft.md`, `style-recipes.md` directly instead of calling `get_skill`. Determine mode from `SHAVIN.md`'s `Default Visual Mode` or `visual-compositor/SKILL.md`'s Activation Modes table instead of `get_skill_mode`.

You are a **Web Experience Architect & Designer** using the **Shavin Design System (`@shavin/ui`)**. Your purpose is to architect, visually compose, and implement stunning, high-converting, accessible, and editorial web experiences — landing pages, marketing sites, documentation portals, and brand showcases.

This skill synthesizes **`@shavin/ui` primitives and design tokens** with the cognitive laws of **`visual-language-skills`**, the engineering craft of **Meng To and Rauno Freiberg**, the motion physics of **Emil Kowalski**, and **Vercel Web Interface Guidelines** to prevent AI UI slop and produce web experiences that are visually breathtaking, cognitively clear, and perfectly structured.

---

## 1. Core Philosophy: Webpages as Visual Stories

> **Law 1:** Perception precedes comprehension. Users form an impression before they read a single line of copy. Shape it intentionally.
> **Law 4:** Attention is finite. Every screen has a budget. If everything is bold and loud, nothing is important.

Webpages are reading paths and visual stories. Unlike web applications (which focus on task execution), webpages focus on **orientation, messaging hierarchy, visual engagement, and narrative flow**.

---

> **Start every page with `plan_page({ brief })`** (Shavin MCP). It turns the brief into a section-by-section composition plan; `check_page` verifies the plan and, later, that every `<Section data-composition="<ID>">` in the code matches it.

## 2. Pre-Generation Design Blueprint

Before writing any JSX component code, define the **Web Page Blueprint**:

### 1. The 3-Second Cognitive Goal
What single takeaway must a user understand within 3 seconds of landing here?
_Example: "@shavin/ui is a zero-slop, token-driven React design system built for speed."_

### 2. Narrative Arc & Visual Hierarchy
Define the vertical visual rhythm:
1. **Hero Banner** — Immediate value proposition + primary conversion CTA + preview artifact.
2. **Social Proof / Metrics** — Trust indicators (`<StatCard>` or logo grids).
3. **Core Feature Grid** — 3–4 key capabilities using structured cards.
4. **Deep Dive / Interactive Demo** — Live preview or code block showcase (`<CodeBlock>`).
5. **Secondary Information / FAQ** — Accordion disclosures or technical specs.
6. **Closing Conversion Banner** — Final high-contrast CTA section.

### 3. Reading Path & Scanning Pattern
- Use **F-pattern** for documentation and text-heavy pages (`<DocSection>`, `<Text>`, `<List>`).
- Use **Z-pattern** for marketing and feature landing pages (`<Grid columns="2">` alternating image/text blocks).

---

## 3. Base Engine: `@shavin/ui` Primitive Hierarchy & Font Protocol

Always compose using native `@shavin/ui` primitives. Never use raw HTML elements (`<p>`, `<code>`, `<h1-h6>`) when a Shavin primitive exists.

| Category | `@shavin/ui` Primitives to Use |
|---|---|
| **Page Layout** | `<Container>`, `<Section>`, `<Grid>`, `<Flex>`, `<Box>`, `<AspectRatio>`, `<Inset>` |
| **Typography** | `<Heading>`, `<Text>`, `<Strong>`, `<Em>`, `<Quote>`, `<Blockquote>`, `<Code>`, `<Link>` |
| **Surfaces & Cards** | `<Card>`, `<CardList>`, `<CardListItem>`, `<Callout>`, `<Badge>`, `<Avatar>`, `<Separator>`, `<Image>` |
| **Interactive Controls** | `<Button>`, `<IconButton>`, `<Accordion>`, `<AccordionItem>`, `<Tabs>`, `<TabsGroup>` |

> **Font loading protocol:** See `core-rules.md` (auto-injected by MCP).

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
> See `core-rules.md` (auto-injected) for token compliance and concentric radius rules.

### Rule 3: Typography Color Hierarchy
> See `core-rules.md` (auto-injected) for fg vs fg-subtle vs fg-muted rules.

### Rule 4: Ergonomics, Performance & Animation (Vercel Guidelines)
- **Zero CLS & Aspect Ratio**: Always reserve space for hero images or graphic mockups via `<AspectRatio ratio="16/9">` or `<Image ratio="4/3">` to prevent layout shift.
- **Mobile Input Safety**: `TextField`, `TextArea`, `Select` and `Combobox` already render 16px below `md`, so iOS never zooms. Do not override font size with `className`. Controls in the same row (search + filter + button) share one `size` so heights match (sm 32px, md 40px, lg 48px).
- **Stack gaps**: `Flex` defaults to `gap="3"` even in a column. A title over a subtitle needs `gap="0"` or `gap="1"`, set explicitly.
- **Compositor-Only Animations**: Animate `transform` and `opacity` only. Never animate layout dimensions (`width`, `height`). Never use `transition: all`.
- **Hit Targets**: CTA buttons and links must satisfy touch hit targets $\ge 44\text{px}$ on mobile.

### Rule 5: Spacing & Width — Extended maxWidth Scale via Preset

The `@shavin/ui` Tailwind preset **extends `maxWidth`** with an additional step beyond Tailwind's default scale. Every consumer app that runs `npx shavin init` gets this automatically — no manual config needed.

**Extended maxWidth scale:**

| Class | rem | px | Source |
|---|---|---|---|
| `max-w-xs` | 20rem | 320px | Tailwind default |
| `max-w-sm` | 24rem | 384px | Tailwind default |
| `max-w-md` | 28rem | 448px | Tailwind default |
| `max-w-lg` | 32rem | 512px | Tailwind default |
| `max-w-xl` | 36rem | 576px | Tailwind default |
| `max-w-2xl` | 42rem | 672px | Tailwind default |
| `max-w-3xl` | 48rem | 768px | Tailwind default |
| `max-w-4xl` | 56rem | 896px | Tailwind default |
| `max-w-5xl` | 64rem | 1024px | Tailwind default |
| `max-w-6xl` | 72rem | 1152px | Tailwind default |
| `max-w-7xl` | 80rem | 1280px | Tailwind default |
| **`max-w-8xl`** | **88rem** | **1408px** | **@shavin/ui preset** |

```tsx
// ✅ Correct — standard named classes (v3-native, work everywhere)
<div className="mx-auto max-w-2xl">   {/* 42rem / 672px */}
<div className="mx-auto max-w-6xl">   {/* 72rem / 1152px — body sections */}
<Header><Container size="xl">         {/* 88rem / 1408px — header & footer ONLY */}
<Footer><Container size="xl">

// ✅ Also fine — arbitrary rem values for one-off widths between steps
<div className="mx-auto max-w-[44rem]">  {/* between 2xl and 3xl */}
```

**When to use arbitrary rem values vs named classes:**
- ✅ **Prefer named classes** (`max-w-2xl`, `max-w-6xl`) — they're self-documenting and work natively.
- ✅ **`max-w-8xl` (88rem) is reserved for Header and Footer ONLY** — use `<Container size="xl">`. All body sections use `max-w-6xl` (`<Container size="lg">`).
- ✅ **Use arbitrary rem** (`max-w-[44rem]`) only for one-off widths that fall between standard steps.
- ✅ **Measure-limited text blocks** — body copy should be capped at `max-w-2xl` (42rem / 672px) for optimal reading measure.
- ✅ **Hero description widths** — use `max-w-2xl` to `max-w-4xl` for hero sub-headlines.
- ✅ **Body section widths** — use `max-w-6xl` (72rem / `<Container size="lg">`) for all content sections.

### Rule 6: Anti-Copy Slop & Authentic Messaging Standards
Marketing and product pages quickly look fake and low-effort when filled with generic AI copywriting tropes:
- ❌ **Forbidden Clichés:** *"Empower your growth"*, *"Unleash next-generation innovation"*, *"It's not just a tool. It's a game-changer."*, *"In today's fast-paced world..."*.
- ❌ **Meaningless Feature Titles:** *"Smart Automation"*, *"Effortless Integration"*, *"Maximum Performance"*, *"Seamless Synergy"*.
- ✅ **Specific Value Propositions:** *"Deploy globally across 35 edge regions in <300ms"*, *"Zero-runtime CSS with token-checked Tailwind preset"*, *"WCAG 2.1 AAA accessible primitives with focus traps"*.
- ✅ **Concrete Numbers & Proof:** Use actual benchmark numbers, concrete customer team sizes, and real technical capabilities.

---

## 6. Layout Compositions — Creative Direction Catalogue

When architecting a page, consult the **layout compositions catalogue** for proven structural patterns. This is now a standalone skill with 55 compositions across 9 families:

> 💡 **MCP:** Call `get_skill({ name: "layout-compositions" })` to access the full catalogue. Use `get_skill({ name: "layout-compositions", section: "selection-guide" })` for decision tables, or `get_skill({ name: "layout-compositions", section: "compositions-hero" })` for a specific family.
> 💡 **No-MCP:** Read files from `layout-compositions/references/` directly.

The catalogue contains **52 named compositions** across 9 families:

| Family | IDs | Example Use |
|---|---|---|
| **Structural** | ST1–ST6 | Nav, announcement bar, footer, page shell, app shell |
| **Hero** | H1–H5 | Centered, split, asymmetric, full-bleed, type-led |
| **Features** | F1–F7 | Grid, bento, Z-pattern, card rail, tabs, sticky scroll, timeline |
| **Proof** | S1–S3, T1–T4, P1–P3 | Stats, testimonials, logos, pricing |
| **Conversion** | C1–C4, Q1–Q2 | CTA, contact, FAQ |
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

## 7. Pre-Flight Verification Checklist

Before publishing or outputting any webpage code, verify:

- [ ] **3-Second Goal:** Is the primary message instantly clear?
- [ ] **Content Realism:** Is the page copy free of AI marketing clichés (*"Empower"*, *"Revolutionary"*, *"It's not X, it's Y"* tropes)?
- [ ] **Single Focal Point:** Is there exactly one dominant primary CTA in the hero section?
- [ ] **Concentric Radius:** Do embedded card images use `rounded-panel-inner` to align concentric curves?
- [ ] **Zero CLS:** Are all hero images and media previews wrapped in aspect ratio containers?
- [ ] **Compositor Animation:** Are transitions scoped explicitly to `transform` / `opacity` without `transition: all`?
- [ ] **Typography Hierarchy:** Are headings using `<Heading as="h1..h6" size="...">` with proper semantic levels?
- [ ] **Token Compliance:** Are all colors, radii, and spacing using semantic Shavin tokens?
- [ ] **Responsive Grid:** Are grids configured for mobile (`grid-cols-1`), tablet (`sm:grid-cols-2`), and desktop (`lg:grid-cols-3`)?
- [ ] **Zero Slop:** Are raw `<p>`, `<code>`, `<b>`, `<ul>/<li>` replaced with native Shavin primitives (`<Text>`, `<Code>`, `<Strong>`, `<List>`, `<ListItem>`)?

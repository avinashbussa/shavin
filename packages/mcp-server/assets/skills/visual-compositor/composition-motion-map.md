# Composition → Motion Map

> Suggested motion presets per layout composition. Reference: `page-motion-presets.md` for preset recipes. The authoritative composition-motion-map now lives in the `layout-motion` skill (`layout-motion/references/composition-motion-map.md`) — this file remains as a visual-compositor-internal convenience. The 55 compositions are defined in the `layout-compositions` skill. "None" is a valid and often best answer. Pick one or two per page section, not all of them.

---

## How to Use

1. Look up the composition you're using (e.g. `H2: Split Hero`).
2. Find the suggested preset(s) in the table below.
3. Apply using motion tokens — never hardcode durations/distances.
4. **When in doubt, choose "None".** Static is better than gratuitous motion.

The `◆` symbol marks compositions whose metadata allows a stagger choreography scene on top. These are hero-level or major-transition sections where layered entrance is appropriate.

---

## Hero Compositions

| ID | Composition | Suggested Preset | Notes |
|---|---|---|---|
| H1 ◆ | Centered Statement Hero | **P4** (Word-Reveal) on tagline + **P3** (Split-Stagger) on CTA/preview | Word-by-word headline reveal is the "Tagline Reveal Moment" — use exactly once per page. Stagger the supporting elements below. |
| H2 ◆ | Split Hero (Left Text + Right Visual) | **P3** (Split-Stagger) on left column + **P5** (Scale-In) on right visual | Left text layers stagger in reading order; right visual scales in slightly later (set `--i` 1 higher than last text layer). |
| H3 ◆ | Asymmetric Hero (7/5 Split) | **P2** (Blur-Rise) on display heading + **P5** (Scale-In) on floating visual | Cinematic blur-rise for the large display type. Visual scales in with slight delay. Premium feel. |
| H4 | Full-Bleed Video/Gradient Hero | **None** or **P1** (Fade-Rise) on text overlay only | The background media/video IS the motion. Adding entrance animation on top competes. Only fade in the text overlay if needed. |
| **H5** ◆ | **Logo Cloud Hero** (text + trust logos) | **P3** (Split-Stagger) on text + **P1** (Fade-Rise) on logo row | New composition. Text staggers, logos fade in as a single row after text settles. |
| **ST** ◆ | **Sticky Two-Column** (sticky text + scrolling visual) | **P1** (Fade-Rise) on first viewport only | New composition. Sticky text column doesn't need re-animation on scroll. Fade-rise the first visible visual panel only. Subsequent scroll visuals are static — the scroll itself is the motion. |

---

## Feature / Info Compositions

| ID | Composition | Suggested Preset | Notes |
|---|---|---|---|
| F1 | 3-Column Feature Grid | **P1** (Fade-Rise) per card with `--i` increment | Gentle staggered fade. Cards rise 16px with opacity. Keep it subtle — feature grids are read, not performed. |
| F2 | Bento Grid (Mixed-Size) | **P5** (Scale-In) per card with `--i` increment | Scale-in suits the bento aesthetic — cards "place" themselves. Larger cells get lower `--i` (appear first). |
| F3 | Alternating Z-Pattern | **P2** (Blur-Rise) per row with `--i` increment | Each row blurs in as the user scrolls to it. Use `IntersectionObserver`. One row at a time — not all at once. |
| F4 | Stacked Card Carousel | **None** | The carousel scroll/snap IS the interaction. Adding entrance motion to a horizontally scrolling element is noise. |
| F5 | Tabbed Feature Explorer | **None** on tab content; **P1** (Fade-Rise) on initial load only | Tab switches are "tens of times/day" frequency — no animation on switch. Only the first load gets a gentle fade. |
| **F6** | **Logo Marquee + Feature** (marquee strip above feature grid) | **None** on marquee + **P1** (Fade-Rise) on grid | New composition. The marquee is already animated (infinite scroll). Don't double-animate. Fade in the grid below. |

---

## Stats / Metrics Compositions

| ID | Composition | Suggested Preset | Notes |
|---|---|---|---|
| S1 | Horizontal Stat Bar | **P1** (Fade-Rise) as a single block | Don't stagger individual stats — they're meant to be scanned as a unit. One fade for the whole bar. |
| S2 | Large Number + Description Grid | **P5** (Scale-In) per cell with `--i` increment | Large numbers have more visual weight — scale-in feels like they're "landing". 60ms stagger between cells. |
| S3 | Animated Count-Up Row | Custom (count-up JS) | Count-up is a JS-driven animation, not a CSS preset. Under reduced-motion, skip the count-up and show final numbers directly. |

---

## CTA Compositions

| ID | Composition | Suggested Preset | Notes |
|---|---|---|---|
| C1 | Centered CTA Banner | **None** | CTAs are conversion-critical — they should be instantly visible. No entrance delay. If the section is below the fold, a single **P1** (Fade-Rise) on scroll-into-view is acceptable. |
| C2 | Split CTA (Text + Code Snippet) | **None** | Same as C1. The code snippet should be immediately readable. |
| C3 | Full-Width Gradient CTA | **None** | The gradient/atmosphere provides enough visual interest. Static CTA. |
| **C4** | **Inline Sign-Up** (email input + button inside hero or feature) | **None** | New composition. The form is functional, not decorative. Instant availability. |

---

## Testimonial / Social Proof Compositions

| ID | Composition | Suggested Preset | Notes |
|---|---|---|---|
| T1 | Single Large Quote | **P2** (Blur-Rise) on quote text | One cinematic reveal for a single quote — appropriate because it's a "rare" section. Blur-rise adds gravitas. |
| T2 | 3-Column Testimonial Cards | **P1** (Fade-Rise) per card with `--i` increment | Subtle staggered fade. 60ms between cards. |
| T3 | Logo Grid (Wordless Trust) | **None** | Logos are reference, not content. They should be immediately visible. |
| T4 | Marquee Logo Strip | **None** | The marquee is the motion. No entrance needed. |

---

## FAQ / Accordion Compositions

| ID | Composition | Suggested Preset | Notes |
|---|---|---|---|
| Q1 | Two-Column FAQ | **None** | FAQ is functional reference content. Users want answers, not animation. |
| Q2 | Centered Accordion Stack | **None** | Same reasoning. The accordion expand/collapse is handled by `.animate-accordion-down/up` semantic utilities — that's sufficient motion. |

---

## Comparison / Pricing Compositions

| ID | Composition | Suggested Preset | Notes |
|---|---|---|---|
| P1 | 3-Tier Pricing Table | **P5** (Scale-In) per tier with `--i` increment | Cards "place" themselves. Middle (recommended) tier gets `--i: 0` (appears first, draws the eye). |
| P2 | Feature Comparison Matrix | **None** | Comparison tables are analytical — users scan rows. No motion. |
| P3 | Single Card Plan | **None** | One card, one CTA. Instant. |

---

## Gallery / Showcase Compositions

| ID | Composition | Suggested Preset | Notes |
|---|---|---|---|
| G1 | Masonry Grid | **P5** (Scale-In) per card on scroll-into-view | Cards scale in as they enter the viewport. `IntersectionObserver` + `--i` based on column position. |
| G2 | Filterable Grid | **None** on filter switch; **P5** (Scale-In) on initial load only | Filter switches are "tens of times/day" — no animation. Only initial load gets scale-in. |
| G3 | Infinite Marquee Strip | **None** | The marquee is the motion. |

---

## New Compositions (from external research)

These compositions are additions to the standard catalogue, informed by external motion research. They use the same `@shavin/ui` primitives and token system.

### ST: Sticky Two-Column
**Best for:** Long-form storytelling, product deep-dives, case studies.
**Structure:** Left column has sticky positioning (text stays in view); right column scrolls through a series of visual panels.
**Primitives:** `<Grid columns={{ base: 1, lg: 2 }}>` → left `lg:sticky lg:top-24 lg:h-fit` + right scrolling `<Flex direction="column" gap="12">`.
**Motion:** P1 (Fade-Rise) on first viewport only. The scroll itself drives subsequent reveals — don't add entrance animation to every panel.

### H5: Logo Cloud Hero
**Best for:** Trust-first landing pages where social proof leads.
**Structure:** Centered headline + CTA, with a row of partner logos directly below as the primary trust signal.
**Primitives:** `<Container size="4">` → centered `<Heading>` + `<Button>` + `<Grid columns={{ base: 3, sm: 4, md: 6 }}>` of grayscale logos.
**Motion:** P3 (Split-Stagger) on text layers, P1 (Fade-Rise) on logo row as a single block.

### F6: Logo Marquee + Feature Grid
**Best for:** Mid-page social proof transition — logos scroll above, features below.
**Structure:** Infinite marquee strip of partner logos, followed by a standard 3-column feature grid.
**Primitives:** Marquee container + `<Grid columns={{ base: 1, sm: 2, lg: 3 }}>` of `<Card>`.
**Motion:** None on marquee (it's already animated), P1 (Fade-Rise) on the feature grid.

### C4: Inline Sign-Up
**Best for:** Developer tools, newsletters, early-access pages where the sign-up form IS the conversion.
**Structure:** Email input + submit button integrated directly into the hero or a feature section (no separate CTA section needed).
**Primitives:** `<Flex gap="3">` → `<Input placeholder="you@company.com">` + `<Button>Get early access</Button>`.
**Motion:** None. The form must be instantly usable.

### E: Editorial Spread
**Best for:** Blog posts, documentation, long-form articles.
**Structure:** Wide centered column for prose (max-w-3xl), with full-bleed visual interludes between text blocks.
**Primitives:** `<Container size="3">` for prose + `<figure className="full-bleed">` for images.
**Motion:** None on text. P1 (Fade-Rise) optionally on full-bleed visuals on scroll-into-view.

### D: Dashboard Preview
**Best for:** SaaS product pages showing a live-ish UI preview.
**Structure:** A styled "fake" dashboard or app screenshot inside a browser frame, with annotated callouts pointing to key UI elements.
**Primitives:** `<Card className="overflow-hidden">` wrapping a browser frame + absolutely positioned callout `<Popover>` elements.
**Motion:** P5 (Scale-In) on the entire preview as a single unit. Callout tooltips use `.animate-rise` on hover/interaction (handled by Radix).

### X: Expandable Showcase
**Best for:** Block catalogs, component galleries, design system docs.
**Structure:** Grid of compact preview cards; clicking one expands it into a full-width detail panel (accordion-like, but horizontal expansion).
**Primitives:** `<Grid>` of `<Card>` → click triggers `<Dialog>` or inline expansion with `grid-column: 1 / -1`.
**Motion:** P1 (Fade-Rise) on grid items. Expansion uses `.animate-accordion-down/up` or `.animate-modal-in` depending on implementation.

---

## Quick Reference: The "Should I Animate?" Decision

| Scenario | Answer |
|---|---|
| First viewport, hero section | Yes — P3 or P4 (one-time delight) |
| Below-the-fold content entering on scroll | Yes — P1 or P5 (subtle, per-section) |
| Tab switch, filter change, sort | No (high frequency) |
| Hover state | CSS transition only, `--dur-fast`, no keyframe |
| Button press | `active:scale-[0.97]` + `--dur-instant`, no keyframe |
| Modal/dialog open | `.animate-modal-in` (semantic utility, automatic) |
| Dropdown/menu open | `.animate-rise` (semantic utility, automatic) |
| Drawer/sidebar open | P6 (Slide-In) or `.animate-rise` with `--ease-drawer` |
| FAQ accordion | `.animate-accordion-down/up` (semantic utility, automatic) |
| Logo marquee | CSS animation only, no entrance preset |
| CTA section | None — instant visibility for conversion |

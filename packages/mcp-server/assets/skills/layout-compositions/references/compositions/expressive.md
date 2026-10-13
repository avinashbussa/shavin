# Expressive compositions (X1–X5)

Expressive layouts break from the card-and-grid default: scale contrast, overlap, offset, oversized type, sticky and horizontal structures. They are still layouts: at rest, with no motion, each must read clearly and work on a phone. Motion sits on top (see `layout-motion` for Tier 1, `layout-choreography` for scroll-linked scenes).

Two rules keep expressive layouts from becoming messy:
1. A hidden strict grid still exists. Elements break it on purpose, but they align to something.
2. DOM order is the intended reading order. Visual placement (overlap, offset, reordering) never changes it.

Contents: X1 Broken-Grid Collage · X2 Oversized Type Wall · X3 Sticky Split · X4 Horizontal Track · X5 Index with Hover Preview

---

### X1 · Broken-Grid Collage
```yaml
id: X1
name: Broken-Grid Collage
family: expressive
job: desire
density: medium
styles: [expressive, editorial]
treatments: [open, full-bleed]
media: [photo, illustration, video]
items: 3-7 elements
slots: [primary, secondary, tertiary, caption, type]
motion: choreography-ok
```
**Best for:** Portfolios, fashion, culture and campaign pages where composition is the message.
**Avoid when:** Content must be compared or scanned (docs, pricing), or there aren't enough strong assets: sparse collages look accidental.
**Grid:** `base`: single column with modest offsets and no overlaps that hide content. `lg`: a 12-col grid with intentional offsets: elements placed with `grid-area`/`grid-column` and overlapping rows, varied scale (one large, two medium, one small).
```
┌──────────────────┬───────────┬────────────────┐
│Large image (1–5) │           │ Caption        │
│                  │Small (7–8)│ Medium (9–12)  │
│ Type overlaps    │           │                │
│ the image edge   │           │                │
└──────────────────┴───────────┴────────────────┘
```
**Contract:** Each element has a role (primary, secondary, caption). Decorative images have `alt=""`; meaningful ones have real alt. Text overlapping an image has a scrim or sits on a flat area.
**Watch:** Overlap needs explicit `z-index` and never blocks tap targets. Test at 360px and at ≥ 1920px. Offsets that rely on absolute pixel values break at other widths: use grid lines and `clamp()`. Many large images: lazy-load and size correctly.

### X2 · Oversized Type Wall
```yaml
id: X2
name: Oversized Type Wall
family: expressive
job: attention
density: low
styles: [expressive, editorial, marketing]
treatments: [open, flat, full-bleed]
media: [none]
items: 2-5 lines
slots: [line, inline-media]
motion: choreography-ok
```
**Best for:** Manifestos, section breaks, statements, and studio intros where the words are the visual.
**Avoid when:** The message is long. Beyond ~25 words a type wall stops being read.
**Grid:** Full-width lines of fluid type (`clamp()` or container-query units), alternating alignment per line (left, right, centred); optional small images or shapes inline between words.
```
┌───────────────────────┬───────────────────────┐
│ WE MAKE               │                       │
│                       │      THINGS THAT      │
│ FEEL [img] RIGHT      │                       │
│                       │        AND WORK       │
└───────────────────────┴───────────────────────┘
```
**Contract:** Real text in one semantic element (`<h2>` or `<p>`); line splits are spans inside it. 2–5 lines.
**Watch:** Control wrapping (`text-wrap`, `hyphens`, `overflow-wrap`) and check 320px. Keep contrast on coloured grounds. Static layout must read fully before any reveal animation is added.

### X3 · Sticky Split (Pinned Column + Scrolling Column)
```yaml
id: X3
name: Sticky Split
family: expressive
job: understanding
density: medium
styles: [expressive, editorial, marketing]
treatments: [flat, open, full-bleed, carded]
media: [photo, product-ui, illustration]
items: n/a
slots: [pinned, scroller]
motion: choreography-ok
```
**Best for:** An "about" or story section: a title and summary stay put while images or details scroll past.
**Avoid when:** The scrolling side is short. It must run at least ~1.5 viewports or pinning is pointless.
**Grid:** `base`: stacked, nothing pinned. `lg`: 2 columns (5:7 or 1:1); the left column is `position: sticky` (top = header + gap), its height ≤ the viewport; the right column scrolls.
```
┌───────────────────┬───────────────────────────┐
│ Pinned title      │      Image / detail 1     │
│ + summary (sticky)│      Image / detail 2     │
│ + link            │      Image / detail 3     │
└───────────────────┴───────────────────────────┘
```
**Contract:** Pinned block fits within one viewport. Scrolling column has ≥ 3 items.
**Watch:** `position: sticky` fails when an ancestor sets `overflow`. At 200% zoom or on short screens the pinned block can exceed the viewport: only enable sticky when `min-height: 600px` matches. No pinning on phones.

### X4 · Horizontal Track Gallery
```yaml
id: X4
name: Horizontal Track Gallery
family: expressive
job: desire
density: medium
styles: [expressive, editorial, marketing]
treatments: [open, flat, full-bleed]
media: [photo, video, product-ui]
items: 5-10
slots: [track, card, caption, progress, controls]
motion: choreography-ok
```
**Best for:** Sequences of large images or works that benefit from lateral browsing.
**Avoid when:** Items must be compared or read in full (use G1/G2). The track hides critical information.
**Grid:** A native horizontal scroller: `overflow-x: auto`, optional `scroll-snap`, full-height cards (60–80vw on phones, 30–45vw on desktop), a progress bar and prev/next buttons.
```
┌───────────────────────────────────────────────┐
│ ← →                                    03 / 08│
├────────┬────────────────┬────────┬────────────┤
│ Card 1 │ Card 2 (large) │ Card 3 │  Card 4 →  │
│ Caption│ Caption        │ Caption│ Caption    │
└────────┴────────────────┴────────┴────────────┘
```
**Contract:** Native scrolling first (trackpad, touch and keyboard all work). Each card has a caption. Buttons are real `<button>`s.
**Watch:** Mapping vertical scroll to horizontal movement is scroll-jacking and belongs in `layout-choreography` with fallbacks. Use `overscroll-behavior-x: contain` and let vertical scroll pass through at the ends. Over-aggressive snapping frustrates people.

### X5 · Index with Hover Preview
```yaml
id: X5
name: Index with Hover Preview
family: expressive
job: desire
density: medium
styles: [expressive, editorial]
treatments: [open, ruled]
media: [photo]
items: 5-15
slots: [row, title, meta, preview]
motion: choreography-ok
```
**Best for:** Project indexes and work lists: large type rows that reveal an image on hover or focus.
**Avoid when:** The list is the only way to see the work on touch devices and there is no fallback.
**Grid:** Full-width rows with hairlines: title large on the left, meta right. On hover or focus, a preview image appears at a fixed spot or follows the pointer. On touch/no-hover, show a small inline thumbnail (or none).
```
┌───────────────────────────┬─────────┬─────────┐
│ Project One               │  Brand  │   2026  │
├───────────────────────────┼─────────┼─────────┤
│ Project Two               │   Web   │   2025  │
├───────────────────────────┼─────────┼─────────┤
│ Project Three             │   Film  │   2025  │
└───────────────────────────┴─────────┴─────────┘
```
**Contract:** Each row is one link. Preview images are decorative (`alt=""`): the row text carries the meaning. Rows ≥ 44px tall.
**Watch:** Everything shown on hover must also show on focus. Provide the touch fallback. A pointer-following preview should use `transform` (rAF), stay small, and never cover the row text; under reduced motion use a fixed position.

# Feature / information compositions (F1–F9)

These carry the "what it does and why it matters" part of the story. The most common mistake is defaulting to F1 for everything: equal cards tell readers everything is equally important. Match the composition to the content's real shape (parallel, ranked, sequential, browsable).

Contents: F1 3-Column Grid · F2 Bento · F3 Z-Pattern · F4 Card Rail · F5 Tabbed Explorer · F6 Sticky Scroll Steps · F7 Process / Timeline · F8 Comparison Split · F9 Ecosystem Diagram

---

### F1 · 3-Column Feature Grid
```yaml
id: F1
name: 3-Column Feature Grid
family: features
job: understanding
density: medium
styles: [marketing, hybrid, documentation]
treatments: [carded, ruled, flat, open]
media: [illustration, product-ui, none]
items: 3, 4 (2x2) or 6
slots: [item-media, item-title, item-desc]
motion: tier1
```
**Best for:** Parallel, equal-weight capabilities; a "how it works" where steps are not strictly ordered.
**Avoid when:** Items differ in importance (use F2). More than 6 items (use F5 or F2). It is your reflex answer to "features" (sameness risk).
**Grid:** `base` 1 col · `sm` 2 · `lg` 3, `gap-6`. Item-count rule: 3 → 3 cols; 4 → 2×2 at `lg` (never 3+1); 6 → 3×2; 5 or 7 → change the content or use F2.
```
┌───────────────┬───────────────┬───────────────┐
│     Media     │     Media     │     Media     │
│     Title     │     Title     │     Title     │
│  Description  │  Description  │  Description  │
└───────────────┴───────────────┴───────────────┘
```
**Contract:** Title ≤ 5 words. Description ≤ 25 words. Media is all-or-none with one consistent aspect ratio (e.g. `aspect-video`).
**Watch:** Orphan rows at 5 or 7 items. Icon-only tiles carry no information: skip them. If the whole card is a link it must contain exactly one primary link (no nested interactive elements).

### F2 · Bento Grid
```yaml
id: F2
name: Bento Grid
family: features
job: desire
density: high
styles: [marketing, hybrid]
treatments: [carded, flat]
media: [product-ui, illustration, data]
items: 5-9
slots: [cell-media, cell-title, cell-desc]
motion: tier1
```
**Best for:** Rich products with mixed-priority capabilities and "everything in one place" messaging.
**Avoid when:** Fewer than 5 items, text-only content, or all items are equally important (use F1).
**Grid:** `base` 1 col. `md` 6-col grid. `lg` 12-col grid. Span encodes priority: key capability 8 or 6, secondary 4. At most two "hero" cells. Example rows below: 8+4 / 4+4+4 / 6+6.
```
┌──────────────────────────────┬────────────────┐
│        Large cell (8)        │Medium cell (4) │
│                              │                │
├───────────────┬──────────────┴┬───────────────┤
│    Cell (4)   │    Cell (4)   │    Cell (4)   │
├───────────────┴───────┬───────┴───────────────┤
│     Wide cell (6)     │     Wide cell (6)     │
└───────────────────────┴───────────────────────┘
```
**Contract:** Each cell: title + ≤ 20 words + a visual that survives cropping (`object-cover`, safe focal point). DOM order equals importance order equals reading order.
**Watch:** Visual placement must never reorder the DOM: keyboard and screen-reader order would disagree with what people see. A 4-span cell gets under ~220px wide at `md`, so collapse to 6-col there. Pause offscreen animated demos. Don't put critical information only inside images.

### F3 · Alternating Z-Pattern
```yaml
id: F3
name: Alternating Z-Pattern
family: features
job: understanding
density: medium
styles: [marketing, hybrid]
treatments: [carded, flat, open]
media: [product-ui, photo, illustration]
items: 2-4 rows
slots: [row-media, row-title, row-desc, row-link]
motion: tier1
```
**Best for:** Deep-dives and walkthroughs where every visual is substantial and deserves its own row.
**Avoid when:** Visuals are small icons or placeholders. More than 4 rows (fatigue): use F6. Fewer than 3 rows (the zigzag adds nothing).
**Grid:** `base`: 1 col, text then media in every row. `lg`: 2 cols (1:1 or 5:6), `gap-12`; rows `gap-20`. Alternate with CSS `order` at `lg` only; the DOM stays text → media.
```
┌───────────────────────┬───────────────────────┐
│         Image         │ Title + text          │
├───────────────────────┼───────────────────────┤
│ Title + text          │         Image         │
├───────────────────────┼───────────────────────┤
│         Image         │ Title + text          │
└───────────────────────┴───────────────────────┘
```
**Contract:** Per row: title, ≤ 50 words, optional link. Visuals share one aspect ratio across rows.
**Watch:** Never alternate the DOM order itself (mobile order and reading order become inconsistent). Keep mobile order the same in every row.

### F4 · Card Rail (Scroll-Snap Carousel)
```yaml
id: F4
name: Card Rail
family: features
job: understanding
density: medium
styles: [marketing, hybrid]
treatments: [carded, flat, open]
media: [product-ui, photo, illustration]
items: 4-8
slots: [card-media, card-title, card-desc, controls]
motion: tier1
```
**Best for:** Browsing peer items (case studies, templates, integrations) where scanning matters more than reading every one.
**Avoid when:** The content must be read (hidden by default = low discovery). Three or four items that fit in a grid.
**Grid:** Rail: `flex overflow-x-auto snap-x snap-mandatory`, card width 280–360px, `gap-6`, show a peek of the next card (~15%). Prev/next buttons and progress at the right of the heading row.
```
┌───────────────────────────────────────────────┐
│ Heading                          [<]  [>]     │
├───────────────┬───────────────┬───────────────┤
│     Card 1    │     Card 2    │ Card 3 (peek) │
│     Media     │     Media     │     Media     │
│     Title     │     Title     │     Title     │
└───────────────┴───────────────┴───────────────┘
```
**Contract:** Each card has its own destination (one link). The rail is a labelled, focusable region and the buttons are real `<button>`s. No autoplay.
**Watch:** Autoplay carousels fail WCAG 2.2.2 and users resent them. Dots alone are not navigation. Hide the scrollbar only when buttons exist. Set `scroll-padding` so snapped cards align with the container edge. The vertical space you "save" is content people don't see: test with keyboard.

### F5 · Tabbed Feature Explorer
```yaml
id: F5
name: Tabbed Feature Explorer
family: features
job: understanding
density: high
styles: [marketing, hybrid, documentation]
treatments: [carded, flat, ruled]
media: [product-ui, code, illustration]
items: 3-5 tabs
slots: [tablist, panel-media, panel-title, panel-desc, panel-link]
motion: tier1
```
**Best for:** Personas, modes, languages or capability sets where the reader picks one path.
**Avoid when:** Tab labels are vague. Content must be compared side by side (use P2 or F1). More than 5 tabs (use a vertical list or F6).
**Grid:** `base`: horizontally scrollable tablist above a stacked panel (or accordion if labels don't fit). `lg`: centred tablist, then a 2-col panel (visual 7 : text 5). Reserve the tallest panel's height (stack panels in one grid cell) to avoid layout shift.
```
┌───────────┬───────────┬───────────┬───────────┐
│   Tab 1   │   Tab 2   │   Tab 3   │   Tab 4   │
├───────────┴───────────┴──┬────────┴───────────┤
│      Visual preview      │ Title              │
│                          │ Description        │
│                          │ [Link]             │
└──────────────────────────┴────────────────────┘
```
**Contract:** Labels ≤ 2 words. Each panel: visual + title + ≤ 40 words + optional link. Default tab is the highest-value one. Follow the ARIA tabs pattern (arrow-key roving focus).
**Watch:** Hidden panels are skimmed less and shown less prominently in search. Panel height changes cause CLS. Never auto-rotate tabs. Support deep links (`#tab-id`) if people share them.

### F6 · Sticky Scroll Steps
```yaml
id: F6
name: Sticky Scroll Steps
family: features
job: understanding
density: medium
styles: [marketing, hybrid, editorial]
treatments: [carded, flat, open]
media: [product-ui, illustration, data]
items: 3-6 steps
slots: [step-title, step-desc, pinned-visual]
motion: choreography-ok
```
**Best for:** A narrative walkthrough where one visual updates as the reader moves through steps.
**Avoid when:** Steps are short and visuals independent (use F3). Small-screen-first audiences: on phones this collapses to a plain stack.
**Grid:** `base`: each step is text then its own visual, nothing pinned. `lg`: 2 cols; steps scroll in the left column (each ≈ 60–80svh tall), the visual is `position: sticky` (top = header + 24px) in the right column and swaps with the active step.
```
┌───────────────────────┬───────────────────────┐
│ Step 1  (scrolls)     │     Pinned visual     │
│ Step 2                │ (sticky, swaps state) │
│ Step 3                │                       │
└───────────────────────┴───────────────────────┘
```
**Contract:** Each step: title ≤ 6 words, ≤ 40 words, one visual state. All states share one frame and aspect ratio. Provide a no-JS fallback that shows every state stacked.
**Watch:** `position: sticky` fails inside ancestors that set `overflow`. Detect the active step with `IntersectionObserver` (a Tier 1 job). If the visual crossfade is scrubbed by scroll position, escalate to `layout-choreography`. Don't pin on short viewports (< 600px tall).

### F7 · Process / Timeline
```yaml
id: F7
name: Process / Timeline
family: features
job: understanding
density: medium
styles: [marketing, editorial, hybrid]
treatments: [carded, ruled, flat, open]
media: [none, illustration]
items: 3-6 steps
slots: [step-marker, step-title, step-desc]
motion: tier1
```
**Best for:** Genuine sequences: onboarding steps, project phases, company history.
**Avoid when:** Items have no order (use F1). Numbers or dates are only decoration; number things only when order is real content.
**Grid:** `base`: vertical list with a rail on the left. `md`: up to 4 steps horizontally with a connector line; 5+ steps stay vertical with alternating sides at `lg`.
```
┌───────────┬───────────┬───────────┬───────────┐
│     01    │     02    │     03    │     04    │
│   Title   │   Title   │   Title   │   Title   │
│ Short text│ Short text│ Short text│ Short text│
└───────────┴───────────┴───────────┴───────────┘
```
**Contract:** Use `<ol>`. Marker (number or date) is content: dates use `<time>`. Title ≤ 5 words, text ≤ 25 words.
**Watch:** Horizontal timelines overflow past 4 steps. The connector line is decoration; the order must be obvious without it.

### F8 · Comparison Split
```yaml
id: F8
name: Comparison Split
family: features
job: understanding
density: medium
styles: [marketing, hybrid]
treatments: [carded, flat, open]
media: [data, illustration]
items: 2 panels
slots: [panel-a-label, panel-a-visual, panel-a-value, panel-b-label, panel-b-visual, panel-b-value]
motion: tier1
```
**Best for:** "Old way vs. new way" or status-quo-vs-product framing, where each side gets its own small data visual (a radial %, a mini bar, a count) rather than a prose paragraph.
**Avoid when:** The comparison has more than 2 sides, or needs row-by-row feature detail (use P2). Either side has no real figure to show (this isn't a place for a vague illustration).
**Grid:** `base`: stacked, panel A above panel B. `md`/`lg`: 2 equal columns, `gap-6`, same internal layout in both panels (label → visual → value) so the eye can diff them at a glance. The "better" panel usually gets the brand-color/tint treatment; the other stays neutral/muted.
```
┌────────────────────────┬────────────────────────┐
│         Label          │         Label          │
├────────────────────────┼────────────────────────┤
│         Visual         │         Visual         │
├────────────────────────┼────────────────────────┤
│         Value          │         Value          │
└────────────────────────┴────────────────────────┘
```
**Contract:** Each panel: one label (≤ 4 words), one data visual, one value/stat. Both panels share identical internal structure — same slot order, same visual type — so only the content differs, never the layout.
**Watch:** Don't let one panel run taller than the other (equal-height cards). The muted panel still needs to be legible, not so dimmed it reads as disabled. If the two visuals are different chart types (a ring vs. a bar), the comparison won't land — use the same visual type on both sides.

### F9 · Ecosystem / Integration Diagram
```yaml
id: F9
name: Ecosystem / Integration Diagram
family: features
job: understanding
density: low
styles: [marketing, hybrid]
treatments: [flat, open]
media: [illustration, logos]
items: 6-14 icons
slots: [center-icon, connected-icons, headline]
motion: tier1
```
**Best for:** "Connects to your stack" / integrations sections where a central brand mark sits among a loose scatter of partner or tool icons.
**Avoid when:** The audience needs to know exactly *which* integrations exist and click through to each (use T3 or G2 instead — this pattern is atmospheric, not a directory). Fewer than 6 icons (too sparse to read as an ecosystem).
**Grid:** `base`: a simplified static ring or 2-3 row wrap of icons around/below a center mark (skip the scatter — it doesn't survive a narrow viewport). `lg`: center icon fixed in the middle of the section; surrounding icons absolutely positioned at varying radii and slight rotation/offset from center, connected optionally by thin low-contrast lines.
```
┌────────────────────────────────────────────────┐
│ Headline                                        │
│                                                 │
│           .            │      Center icon       │
│                        │                        │
└────────────────────────┴────────────────────────┘
```
**Contract:** One center icon (the product/brand). 6-14 surrounding icons, each with real alt text (partner/tool name), sized consistently regardless of position. Headline or short label states what the diagram claims (e.g. "Works with your stack").
**Watch:** This is decorative/illustrative, not an interactive diagram — don't wire up hover states that imply each icon is clickable unless it actually links somewhere. Positioning with raw pixel offsets breaks at other viewports: use percentage or `clamp()`-based offsets, and provide the simplified mobile fallback rather than shrinking the scatter in place. Icons need enough contrast against the background to read at a glance.

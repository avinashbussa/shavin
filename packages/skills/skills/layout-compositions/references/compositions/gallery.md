# Gallery / showcase compositions (G1–G5)

Galleries show volume or range: many things, browsed rather than read. Decide first whether order matters (ranked, chronological) or not, because it decides between CSS columns, a grid, or a list.

Contents: G1 Masonry · G2 Filterable Grid · G3 Marquee Rows · G4 Case Study Index · G5 People Grid

---

### G1 · Masonry Grid
```yaml
id: G1
name: Masonry Grid
family: gallery
job: desire
density: medium
styles: [marketing, hybrid, expressive]
treatments: [carded, flat, open]
media: [product-ui, photo, illustration]
items: 9+
slots: [item-media, item-title]
motion: tier1
```
**Best for:** Block catalogues, UI showcases and screenshot or photo galleries where items have different heights and order doesn't matter.
**Avoid when:** Order matters (ranked lists, chronology). CSS columns fill top-to-bottom per column, so reading and tab order will look shuffled.
**Grid:** `base` 1 col · `sm` 2 · `lg` 3 using CSS `columns`, `gap-6`, `break-inside: avoid` on items. If you need row-wise order, use a grid with measured row spans (or native masonry where support allows: verify current browser support first).
```
┌───────────────┬───────────────┬───────────────┐
│ Item A (tall) │     Item B    │     Item C    │
│               │ Item D (tall) │ Item E (tall) │
│     Item F    │               │     Item G    │
└───────────────┴───────────────┴───────────────┘
```
**Contract:** Every image has `width` and `height` (or `aspect-ratio`) so the layout doesn't jump on load. Each item has a title or caption.
**Watch:** Keyboard focus order follows the DOM, not the visual rows, so keep items as independent links. Lazy-load below the fold. Avoid mixing very tall and very short items in a way that leaves ragged column ends.

### G2 · Filterable Grid with Category Tabs
```yaml
id: G2
name: Filterable Grid
family: gallery
job: reference
density: high
styles: [marketing, hybrid, documentation]
treatments: [carded, ruled, flat]
media: [product-ui, illustration, photo]
items: 12+
slots: [filter-bar, item-media, item-title, result-count]
motion: tier1
```
**Best for:** Component libraries, template directories and catalogues where people look for one category.
**Avoid when:** Fewer than ~12 items (filtering adds nothing) or categories overlap so much that results feel random.
**Grid:** Filter bar above (≤ 7 categories, "All" first; a horizontally scrollable row on mobile), then a grid: `base` 1 · `sm` 2 · `lg` 3.
```
┌───────────────────────────────────────────────┐
│ [All]  [Marketing]  [Docs]     12 results     │
├───────────────┬───────────────┬───────────────┤
│      Card     │      Card     │      Card     │
│      Card     │      Card     │      Card     │
└───────────────┴───────────────┴───────────────┘
```
**Contract:** A live result count or announcement. A defined empty state. The active filter is reflected in the URL.
**Watch:** Filters are either toggle buttons (`aria-pressed`) or tabs, not both. Keep focus stable after filtering and announce "12 results" in a live region. Layout animation on filter is optional polish, not a requirement.

### G3 · Marquee Rows
```yaml
id: G3
name: Marquee Rows
family: gallery
job: desire
density: medium
styles: [marketing, expressive]
treatments: [flat, open]
media: [product-ui, illustration, logos]
items: 12+
slots: [row-1, row-2, row-3, pause-control]
motion: tier1
```
**Best for:** An ambient teaser of the ecosystem or catalogue across the full viewport width.
**Avoid when:** It's the only way to see the items (always link on to G1/G2). Cards must be interactive (moving targets are hard to hit).
**Grid:** 2–3 full-bleed rows moving in alternating directions, each with its content duplicated once for a seamless loop, edges faded with a mask.
```
┌───────────────────────────────────────────────┐
│        ░ Card  Card  Card  Card  Card →       │
│        ░ ← Card  Card  Card  Card  Card       │
│        ░ Card  Card  Card  Card  Card →       │
└───────────────────────────────────────────────┘
```
**Contract:** Mini-cards are non-interactive or pause on focus. A visible pause control exists. A link leads to the full catalogue.
**Watch:** Same accessibility rules as T4. `prefers-reduced-motion` renders static rows. Duplicated content is `aria-hidden`. Limit simultaneous rows on phones (performance).

### G4 · Case Study Index
```yaml
id: G4
name: Case Study Index
family: gallery
job: credibility
density: medium
styles: [marketing, editorial, expressive, hybrid]
treatments: [carded, ruled, flat, open]
media: [photo, product-ui]
items: 3-8
slots: [thumbnail, client, outcome, link]
motion: tier1
```
**Best for:** Agencies, studios and B2B products showing selected work with outcomes.
**Avoid when:** There is no real outcome to state (thumbnails alone say little).
**Grid:** `base`: 1 col stack. `md`: 2 cols. `lg`: one large lead (`col-span-7`) beside a list, or full-width rows (image left, meta right) for a text-forward index.
```
┌──────────────────────────┬────────────────────┐
│ Lead case study (image)  │ Client A — outcome │
│ Client + outcome headline│ Client B — outcome │
│ [Read case study]        │ Client C — outcome │
└──────────────────────────┴────────────────────┘
```
**Contract:** Each item: client, one-line outcome with a number if true, thumbnail, single link. Sorted by relevance to the audience, not date.
**Watch:** Crop thumbnails around a focal point. Hover previews don't exist on touch: the item must stand on its own. Make one link per item, not several.

### G5 · People / Team Grid
```yaml
id: G5
name: People Grid
family: gallery
job: credibility
density: medium
styles: [marketing, editorial, hybrid]
treatments: [carded, ruled, flat, open]
media: [photo]
items: 4-12
slots: [portrait, name, role, link]
motion: tier0
```
**Best for:** About pages, leadership and studio teams.
**Avoid when:** Photography is inconsistent or you don't have consent to publish names and photos.
**Grid:** `base` 2 cols · `md` 3 · `lg` 4, with a consistent 4:5 portrait crop.
```
┌───────────┬───────────┬───────────┬───────────┐
│   Photo   │   Photo   │   Photo   │   Photo   │
│    Name   │    Name   │    Name   │    Name   │
│    Role   │    Role   │    Role   │    Role   │
└───────────┴───────────┴───────────┴───────────┘
```
**Contract:** One photographic style. `alt` is the person's name (or empty if the name follows in text). Name and role always visible.
**Watch:** Don't crop faces. Long titles wrap: reserve height. Decide "leadership only" vs "everyone" and stick to it.

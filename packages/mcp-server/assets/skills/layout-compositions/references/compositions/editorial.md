# Editorial compositions (E1–E4)

Editorial layouts serve reading. Their structure comes from typography, rules and whitespace rather than cards, so prefer the `open` or `ruled` treatments. Measure and rhythm matter more here than anywhere else: get the reading column right first.

Contents: E1 Article Page · E2 Longform with Margin Notes · E3 Magazine Front · E4 Archive List

---

### E1 · Article Page (Reading Column with Breakouts)
```yaml
id: E1
name: Article Page
family: editorial
job: reference
density: medium
styles: [editorial, hybrid]
treatments: [open, ruled]
media: [photo, illustration, data]
items: n/a
slots: [kicker, title, dek, byline, body, figure, pull-quote, related]
motion: tier0
```
**Best for:** Articles, essays, interviews and the body of a case study.
**Avoid when:** The page is a reference or how-to with a persistent sidebar (use D1).
**Grid:** A 12-col grid with a named reading column: body text ≈ 68ch, centred. Figures may break out to the wide width (≈ content + 10%) or full bleed. At `xl`, pull quotes can sit in the margin. `base`: everything single column with page padding.
```
┌───────────────────────────────────────────────┐
│ Kicker  ·  Section                            │
│ Title (≤ 12 words)                            │
│ Dek (≤ 30 words)                              │
│ By Author · 12 Mar 2026 · 8 min read          │
├───────────────────────────────────────────────┤
│        Wide figure (breakout) + caption       │
├───────┬──────────────────────────────┬────────┤
│       │   Body text, 68ch measure    │        │
│       │   ── pull quote (aside) ──   │        │
│       │     Body text continues      │        │
└───────┴──────────────────────────────┴────────┘
```
**Contract:** Title is the page `<h1>`. Byline, `<time>` date and read time. Body ≥ 18px. Sub-headings (`h2`/`h3`) have anchors. Every figure has a caption and meaningful `alt` (or `alt=""` if decorative).
**Watch:** Measure 60–72ch, strictly. Use a drop cap or pull quote only when it has a purpose. Pull quotes are `<aside>` placed after the paragraph they quote. Wide tables and code scroll inside their own wrapper. Footnotes need back-links.

### E2 · Longform with Margin Notes
```yaml
id: E2
name: Longform with Margin Notes
family: editorial
job: reference
density: high
styles: [editorial]
treatments: [open, ruled]
media: [photo, data, none]
items: 5-30 notes
slots: [body, sidenote, figure]
motion: tier1
```
**Best for:** Essays, research write-ups and annotated pieces where asides should sit beside the text.
**Avoid when:** Notes are essential to the argument (they'd be hidden on small screens) or the piece has few notes.
**Grid:** `xl` (≥ 1280px): 12-col; body `col-span-7`/`8`, notes column `col-span-3`/`4`, each note aligned to its reference paragraph. Below `xl`: notes become inline expandable notes or footnotes.
```
┌────────────────────────────────┬──────────────┐
│ Body paragraph with a note¹    │ ¹ Sidenote   │
│ continues at the same 68ch     │ beside text  │
│ measure.                       │              │
└────────────────────────────────┴──────────────┘
```
**Contract:** Notes ≤ 40 words, numbered and linked both ways. The essay still reads correctly if every note is ignored.
**Watch:** Adjacent notes collide: push later notes down, or fall back to footnotes. Small screens need a keyboard-operable toggle (`aria-expanded`). Never bury essential information in a note.

### E3 · Magazine Front (Lead + Secondary + List)
```yaml
id: E3
name: Magazine Front
family: editorial
job: orientation
density: high
styles: [editorial, hybrid]
treatments: [ruled, open, flat]
media: [photo, illustration]
items: 1 lead + 4-8
slots: [lead, secondary, list-item, kicker]
motion: tier1
```
**Best for:** Publication home pages and section fronts where editors rank stories.
**Avoid when:** Stories are equal in weight (a plain E4 list is clearer) or there's no imagery.
**Grid:** `base`: lead, then a list. `lg`: 12-col: lead `col-span-7`/`8` (image, headline, dek); two stacked secondaries `col-span-4`/`5`; below, a row of 3–4 smaller items (`col-span-3`) separated by rules.
```
┌──────────────────────────┬────────────────────┐
│       Lead: image        │    Secondary 1     │
│      headline + dek      │    ───────────     │
│                          │    Secondary 2     │
├───────────┬───────────┬──┴────────┬───────────┤
│    Item   │    Item   │    Item   │    Item   │
└───────────┴───────────┴───────────┴───────────┘
```
**Contract:** DOM order equals editorial importance. Each item: kicker, headline, byline or time. Images have a defined focal point.
**Watch:** A wall of equal cards erases the hierarchy. Too many size variants reads as chaos: use three at most. Clamp headlines only if the meaning survives.

### E4 · Archive List (Ruled Index)
```yaml
id: E4
name: Archive List
family: editorial
job: reference
density: high
styles: [editorial, hybrid, expressive]
treatments: [ruled, open]
media: [none]
items: 10-100
slots: [date, title, dek, tag]
motion: tier0
```
**Best for:** Blog archives, journals, writing indexes, press and publications lists.
**Avoid when:** Imagery is the main draw (use G1/G4).
**Grid:** Rows separated by hairlines. `base`: date above title. `md`: 12-col, date `2`, title + dek `7`, tag `3`.
```
┌─────────────┬────────────────────┬────────────┐
│ 12 Mar 2026 │ An essay title     │ Design     │
├─────────────┼────────────────────┼────────────┤
│ 02 Feb 2026 │ Another essay      │ Systems    │
├─────────────┼────────────────────┼────────────┤
│ 18 Jan 2026 │ A third one        │ Notes      │
└─────────────┴────────────────────┴────────────┘
```
**Contract:** Newest first by default. Group by year with a sticky year label on long lists. One link per row (the title). Tags are real links.
**Watch:** 100+ rows need pagination or "load more" implemented as a link. Format dates for the reader's locale. Keep row height ≥ 44px on touch.

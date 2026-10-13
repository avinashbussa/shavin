# Proof compositions: stats and social proof (S1–S3, T1–T4)

Proof exists to make a claim believable. It only works when the evidence is real, specific and attributable. Never invent numbers, quotes or logos: use clearly marked placeholders when real ones aren't available.

Contents: S1 Stat Bar · S2 Large Number Grid · S3 Count-Up Row · T1 Single Large Quote · T2 Testimonial Cards · T3 Logo Grid · T4 Marquee Logo Strip

---

### S1 · Horizontal Stat Bar
```yaml
id: S1
name: Horizontal Stat Bar
family: proof
job: credibility
density: low
styles: [marketing, hybrid]
treatments: [carded, ruled, flat, open]
media: [data]
items: 3-4
slots: [value, label]
motion: tier1
```
**Best for:** Trust signals and KPI proof points directly under a hero.
**Avoid when:** The numbers are vanity or unsourced. Fewer than 3 figures. A figure needs explaining (use S2).
**Grid:** `base`: 2×2. `md`: one row, 3 or 4 columns, separated by vertical hairlines. For 3 items use 3 columns.
```
┌───────────┬───────────┬───────────┬───────────┐
│     71    │     54    │     20    │     6     │
│ Primitives│   Blocks  │   Tools   │   Skills  │
└───────────┴───────────┴───────────┴───────────┘
```
**Contract:** Value ≤ 6 characters including unit or suffix; label ≤ 3 words. Every figure is true, current and sourced somewhere. Use `tabular-nums`.
**Watch:** The v1 pattern `divide-y md:divide-y-0 md:divide-x` gives the wrong dividers in a 2×2 (rows split, columns don't). In 2×2, set borders per cell. Count-up must not change cell width. Check hairline contrast in dark mode.

### S2 · Large Number + Description Grid
```yaml
id: S2
name: Large Number + Description Grid
family: proof
job: credibility
density: medium
styles: [marketing, hybrid, editorial]
treatments: [carded, ruled, flat, open]
media: [data]
items: 2 or 4
slots: [value, label, description, source]
motion: tier1
```
**Best for:** Impact metrics that need a sentence of context: benchmarks, case-study highlights.
**Avoid when:** There's no baseline (a bare "10x faster" is a claim, not proof). Three items (orphan in a 2-col grid).
**Grid:** `base` 1 col · `md` 2 cols (2×2) · `lg` 4 cols only if the text is short.
```
┌───────────────────────┬───────────────────────┐
│ 10x                   │ 300ms                 │
│ faster builds         │ edge latency          │
│ vs last release       │ p95, 12 regions       │
└───────────────────────┴───────────────────────┘
```
**Contract:** Metric + label + ≤ 30-word explanation + baseline or source.
**Watch:** Emphasis by size, not by colour alone. Keep units next to the number. Don't stack more than one S2 on a page.

### S3 · Count-Up Row
```yaml
id: S3
name: Count-Up Row
family: proof
job: attention
density: low
styles: [marketing, expressive]
treatments: [flat, open, carded]
media: [data]
items: 3-4
slots: [value, label]
motion: tier1
```
**Best for:** Hero-adjacent stats where a single moment of motion adds emphasis.
**Avoid when:** The figure is a year, version or rating: counting up to "2019" is silly. The row sits above the fold (no scroll trigger will ever fire).
**Grid:** As S1: `base` 2×2, `md` a single row (flex, space-between).
```
┌───────────┬───────────┬───────────┬───────────┐
│  0 → 1.2M │  0 → 98%  │   0 → 40  │  0 → 6ms  │
│   Users   │   Uptime  │ Countries │  Latency  │
└───────────┴───────────┴───────────┴───────────┘
```
**Contract:** The final value exists as text in the DOM at first paint. Animate once, on first view, ≤ 1.2s.
**Watch:** `prefers-reduced-motion` shows the final value immediately. Screen readers read only the final value (`aria-hidden` on the ticking element, real text alongside). Use `tabular-nums` and a min-width so digits don't jiggle the layout.

### T1 · Single Large Quote
```yaml
id: T1
name: Single Large Quote
family: proof
job: credibility
density: low
styles: [marketing, editorial, hybrid, expressive]
treatments: [open, flat, carded]
media: [photo, none]
items: 1
slots: [quote, avatar, name, role, company]
motion: tier1
```
**Best for:** One high-value endorsement or a case-study pull quote.
**Avoid when:** The praise is generic or the person can't be named (use T2 for several voices).
**Grid:** Centred or left-aligned single column. At large sizes measure the quote in `ch` (≈ 28–45ch at 2xl–4xl), not in fixed pixels.
```
┌───────────────────────────────────────────────┐
│                       "                       │
│         This is the best design system        │
│  I've ever used, and it shipped a week early. │
├───────────────────────────────────────────────┤
│         [Avatar]  Name · Role, Company        │
└───────────────────────────────────────────────┘
```
**Contract:** Quote ≤ 35 words, and a specific outcome beats praise. Name, role and company always shown. Avatar or logo has alt text.
**Watch:** Mark up as `<figure><blockquote>` with `<figcaption>`. Decorative quote glyphs are `aria-hidden`. Long italic at large sizes hurts legibility. Only use quotes you have permission to publish.

### T2 · Testimonial Card Grid
```yaml
id: T2
name: Testimonial Card Grid
family: proof
job: credibility
density: medium
styles: [marketing, hybrid]
treatments: [carded, ruled, flat, open]
media: [photo, none]
items: 3 or 6
slots: [quote, avatar, name, role]
motion: tier1
```
**Best for:** Multi-perspective proof (engineers, designers, founders).
**Avoid when:** Quotes vary wildly in length (ragged cards; use G1-style masonry or trim). Fewer than 3 quotes (use T1).
**Grid:** `base` 1 col · `md` 2 cols · `lg` 3 cols. (The v1 `md:3` made three cramped columns at 768px.)
```
┌───────────────┬───────────────┬───────────────┐
│     Quote     │     Quote     │     Quote     │
│     Quote     │     Quote     │     Quote     │
├───────────────┼───────────────┼───────────────┤
│   [Av] Name   │   [Av] Name   │   [Av] Name   │
└───────────────┴───────────────┴───────────────┘
```
**Contract:** Quote ≤ 40 words, lengths within roughly ±30%. Author row pinned to the card bottom (`flex flex-col justify-between`). Role and company included.
**Watch:** Star ratings on every card mean nothing. Vary the perspective, not just the names. Keep sources verifiable.

### T3 · Logo Grid
```yaml
id: T3
name: Logo Grid
family: proof
job: credibility
density: low
styles: [marketing, hybrid]
treatments: [carded, ruled, flat, open]
media: [logos]
items: 6-12
slots: [logo]
motion: tier0
```
**Best for:** Quiet trust: "used by" with recognisable names.
**Avoid when:** Fewer than 6 recognisable logos, or the logos are unlicensed or unknown to the audience.
**Grid:** `base` 2 cols · `sm` 3 · `md` 6 (or 4 for 8 logos), `gap-8`, logos centred at a fixed height (24–32px).
```
┌───────┬───────┬───────┬───────┬───────┬───────┐
│  Logo │  Logo │  Logo │  Logo │  Logo │  Logo │
│  Logo │  Logo │  Logo │  Logo │  Logo │  Logo │
└───────┴───────┴───────┴───────┴───────┴───────┘
```
**Contract:** Monochrome marks normalised to equal optical size (fixed height plus padding rules). `alt` = company name. Only show logos you have permission to use.
**Watch:** Low-opacity logos must stay recognisable: don't go below ~60%. Hover-only colour is invisible to touch users, so never rely on it. A "Trusted by" heading is optional.

### T4 · Marquee Logo Strip
```yaml
id: T4
name: Marquee Logo Strip
family: proof
job: credibility
density: low
styles: [marketing, expressive]
treatments: [flat, open, ruled]
media: [logos]
items: 8+
slots: [logo-track, pause-control]
motion: tier1
```
**Best for:** A compact trust signal between narrative sections.
**Avoid when:** Fewer than ~8 logos (the loop repeats visibly), or people need to actually read the names (use T3).
**Grid:** One row, `overflow: hidden`, edge fade via `mask-image`. Content duplicated once for a seamless loop. Loop time ≈ 30–60s.
```
┌────────┬────────┬────────┬────────┬───────────┐
│ ░ Logo │  Logo  │  Logo  │  Logo  │   Logo ░  │
└────────┴────────┴────────┴────────┴───────────┘
```
**Contract:** Same logo rules as T3. Duplicated content is `aria-hidden`. Provide a visible pause control.
**Watch:** WCAG 2.2.2: auto-moving content over 5 seconds needs a pause/stop/hide mechanism. Hover-pause alone excludes keyboard and touch users, so add pause on `:focus-within` and a button. `prefers-reduced-motion` falls back to a static wrapped grid (T3). Animate `transform`, not `left` or `margin`.

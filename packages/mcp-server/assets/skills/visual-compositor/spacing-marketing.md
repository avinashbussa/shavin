# Spacing Marketing — Hierarchy, Weight & Negative Space

> **Load priority:** MARKETING and EDITORIAL modes. Skip for STRUCTURAL.
> **Token cost:** ~2.5K tokens.
> **Depends on:** `spacing-core.md` for section architecture, flex/grid, alignment, and the spatial scale reference.

This file covers the spatial rules that govern marketing pages, landing pages, and editorial layouts — visual dominance hierarchy, weight balance, negative space budgets, the first-3-seconds perception rule, and gradient blending. These rules are about controlling attention and breathing room, not structural composition.

---

## Hierarchy Stack — Making Exactly One Element Dominant

The three levers that create visual dominance are **size**, **weight**, and **surrounding space**. They must all point to the same element.

### The Three Dominance Levels

| Level         | Role                                  | Size                                    | Weight                          | Surrounding space                          |
| ------------- | ------------------------------------- | --------------------------------------- | ------------------------------- | ------------------------------------------ |
| **Primary**   | The one thing users must notice first | `text-4xl`–`text-7xl` / largest graphic | `font-bold` or `font-extrabold` | `mt-0 mb-4`+ on desktop; always above fold |
| **Secondary** | Supports the primary; labels actions  | `text-lg`–`text-2xl`                    | `font-semibold`                 | `mb-2`–`mb-3`                              |
| **Tertiary**  | Body copy, captions, hints, metadata  | `text-sm`–`text-base`                   | `font-normal` or `font-medium`  | `mb-1`–`mb-2`                              |

**Rules:**

- Exactly **one** primary element per screen or logical view. Never two.
- Primary element must be **at least 2× the font-size** of the nearest secondary element.
- Never apply `font-bold` or `shadow-panel` to a tertiary element — it creates false primacy.
- Color alone does not create hierarchy. `text-accent` on body-sized text is emphasis, not primary level.

### Responsive Hierarchy

```
Desktop primary:   text-5xl md:text-7xl   (48px → 72px)
Desktop secondary: text-xl  md:text-2xl   (20px → 24px)
Desktop tertiary:  text-sm  md:text-base  (14px → 16px)

Mobile primary:    text-4xl               (36px) — still 2× secondary ✓
Mobile secondary:  text-lg                (18px)
Mobile tertiary:   text-sm                (14px)

Ratio check: 36 / 18 = 2.0 — minimum maintained ✓
```

---

## Visual Weight Balance

### What Creates Weight

| Property                                   | Weight added | Rule                                      |
| ------------------------------------------ | ------------ | ----------------------------------------- |
| Large size (`text-5xl+`, full-width image) | Very high    | Must be the primary element               |
| `shadow-panel` or `shadow-card`            | High         | Requires `p-5`+ inside the surface        |
| `bg-accent` or high-saturation background  | High         | Max 1 accent-bg element per view          |
| `font-bold` + large size                   | High         | Only on primary / secondary elements      |
| `border border-hairline`                   | Low-medium   | Adds containment weight; use deliberately |
| `text-fg` vs `text-fg-muted`               | Low          | Dark text is heavier than muted           |
| Dense content (many elements, small gap)   | Medium       | Counter with surrounding whitespace       |

### Balancing Heavy Elements

When a heavy element exists, it must be balanced by **increased surrounding whitespace**, not by adding more heavy elements.

```
Heavy card (shadow-panel):
  Needs: min p-5 internal, min gap-6 in surrounding grid

Accent-background badge or callout:
  Needs: py-1.5+ vertical padding, surrounded by text-fg-muted elements

Large hero heading (text-6xl+):
  Needs: mb-4+ below it before the next element, pb-16+ section padding
```

**The balance rule:** If you add a `shadow-*` class, increase `p-*` by one step. If you add `bg-accent`, surround with `text-fg-muted` elements and increase gap.

---

## Negative Space Budget

### Content Width Budget

| Interface type                | Target content width               | Minimum    | Maximum     |
| ----------------------------- | ---------------------------------- | ---------- | ----------- |
| Marketing page body text      | 60–70% of container                | 50%        | 75%         |
| App main content area         | 70–85% of viewport (minus sidebar) | 60%        | 90%         |
| Reading / documentation prose | 65ch–80ch max-width                | 45ch       | 90ch        |
| Modal / dialog                | 40–60% of viewport width           | `max-w-sm` | `max-w-3xl` |

### Vertical Whitespace Budget

- Marketing pages: whitespace ≥ **25% of total page height**
- Apps: whitespace ≥ **15% of total screen height**

### Negative Space is Not Waste

| Gap location                                     | What it signals                                      | Rule                                                    |
| ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------- |
| `mb-10 md:mb-12` between section header and grid | "This header introduces what follows"                | Never reduce below `mb-8`                               |
| `py-16` section padding                          | "This section is a complete, contained idea"         | Never reduce below `py-12` for marketing                |
| `gap-6` between cards                            | "These cards are independent but related"            | Never use `gap-2` between cards                         |
| `mt-8` above a standalone CTA                    | "This action is separate from the preceding content" | Never place a CTA immediately adjacent with `mt-2`      |

**Never remove a gap entirely on mobile.** `gap-0` or `space-y-0` between conceptually separate items destroys their relationship signal.

---

## First-3-Seconds Rule

### What Users See Before They Read

In the first 3 seconds, users perceive: the dominant element's size and position, the rough density, whether there is a clear action, and whether the page feels "safe". They do not yet read the heading.

### Spatial Rules for the First 3 Seconds

**1. Primary element above the fold — always.**
```
Desktop fold: ~700px–900px from top of viewport
Mobile fold:  ~550px–700px from top of viewport
```

**2. CTA within reach of the primary message.**
```
Desktop: CTA must be within 320px vertically of the h1 bottom edge.
Mobile:  CTA must be within 240px vertically of the h1 bottom edge.
```

**3. Maximum 3 focal elements in any hero or primary view.**
```
Focal element = anything with shadow-panel, bg-accent, text-5xl+, or a primary Button.
On mobile, reduce to 2 focal elements if possible.
```

**4. Navigation must not compete with the primary element.**
```
Header height: h-14 (56px) standard, h-16 (64px) max.
Header background: bg-canvas/80 backdrop-blur — semi-transparent.
Never: a header taller than 72px.
```

---

## Animated / Static Gradient Blending

Use this when placing animated mesh gradients as page-level decorative backgrounds that should dissolve cleanly into the canvas color.

### The Page-Level Backdrop Pattern

Gradient backgrounds spanning multiple sections must be owned at the **page level**, not inside any individual section component.

```tsx
// In page.tsx — outside <Header> and <main>
<div
  className="pointer-events-none absolute inset-x-0 top-0 z-0 overflow-hidden"
  aria-hidden
  style={{
    height: "calc(64px + 92svh + 160px)",
    maskImage: "linear-gradient(to bottom, black 0%, black 65%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 65%, transparent 100%)",
  }}
>
  <div className="hero-gradient-light absolute inset-0 opacity-70 dark:hidden" />
  <div className="hero-gradient-dark absolute inset-0 hidden opacity-80 dark:block" />
</div>
```

**Key rules:**
- **z-index**: gradient `z-0`, Header `z-50`, main content `z-10`
- **`pointer-events-none`**: gradient must never intercept clicks
- **`aria-hidden`**: purely decorative
- **Header transparency**: `bg-canvas/40 backdrop-blur-xl` (not `bg-canvas/90`)
- **`position: absolute`**: scrolls with the page (not `fixed`)

### Fading: CSS `mask-image` vs Overlay Div

**Use `mask-image`, not an overlay div:**

| Method                                                           | Works                  | Problem                                                   |
| ---------------------------------------------------------------- | ---------------------- | --------------------------------------------------------- |
| Overlay div `bg-linear-gradient(transparent → var(--bg-canvas))` | ❌ Broken              | Color-interpolation bug across themes                     |
| Overlay div `bg-linear-gradient(transparent → #ffffff)`          | ❌ Broken in dark mode | Hardcodes a color                                         |
| `maskImage: linear-gradient(black → transparent)`                | ✅ Correct             | Uses mask alpha channel — fully color-agnostic            |

### Sections Below the Gradient Must Be Opaque

```tsx
// ✓ Correct — blocks any residual gradient bleed
<section className="relative border-t border-hairline bg-canvas py-16 md:py-24">

// ✗ Wrong — transparent section shows gradient underneath
<section className="relative border-t border-hairline py-16 md:py-24">
```

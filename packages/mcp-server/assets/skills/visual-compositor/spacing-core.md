# Spacing Core — Universal Spatial Composition Rules

> **Load priority:** ALWAYS loaded (alongside `concentric-laws.md` and `cognitive-layer.md`).
> **Token cost:** ~3.4K tokens.
> **Depends on:** `concentric-laws.md` for the two concentric laws.

This file covers the spatial rules every layout needs — section architecture, flex/grid, hierarchy within components, alignment, containment, nesting, responsive, repeating units, and the spatial scale reference. Mode-specific rules (marketing hierarchy, density framework) are in `spacing-marketing.md` and `spacing-dense.md`.

---

## Section Architecture

### Full-Bleed vs Contained

Every `<section>` falls into one of two shapes. Choose deliberately before writing any markup.

```jsx
// Full-bleed (background fills viewport width)
<section className="bg-surface border-y border-hairline py-16 md:py-24">
  <Container size="lg" className="px-6 md:px-10">
    {/* content */}
  </Container>
</section>

// Contained (no background, whitespace section)
<section className="py-16 md:py-24">
  <Container size="lg" className="px-6 md:px-10">
    {/* content */}
  </Container>
</section>
```

**Rule:** Never put `px-*` on a `<section>`. The section is full-bleed. The `Container` is the gutter. Padding on the section produces misaligned content against other sections' containers.

### Section Header Block (Heading + Subtext)

Every section that introduces content before it gets a consistent header block structure:

```jsx
<Flex direction="column" align="center" gap="3" className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
  <Text size="xs" className="uppercase tracking-wider text-fg-subtle font-medium">
    Section Label
  </Text>
  <Heading as="h2" size="2xl" className="font-display font-bold text-fg">
    One clear declarative statement.
  </Heading>
  <Text color="muted" size="md" className="max-w-2xl">
    Supporting context in one or two sentences. Never more.
  </Text>
</Flex>
```

**Rules:**

- Overline label → Heading → Text. Always this order. Never reversed.
- **Prefer overline text** (`<Text size="xs" className="uppercase tracking-wider text-fg-subtle">`) over `<Badge>` for section labels. Badges add visual weight (background fill, border, pill shape) that competes with the headline — overline text is structurally lighter and respects reading hierarchy. See `anti-patterns.md` AP-04 (Badge Soup).
- Use `<Badge>` only for stateful labels (version tags, success/error states, notification counts), not for marketing adjectives or category markers.
- `max-w-3xl` on the wrapper, `max-w-2xl` on the Text. The heading is wider than the body.
- `mb-10 md:mb-12` separates the header from content below. Never less than `mb-8`.
- Do not add a fourth element (button, link) to the section header. Actions live below the content, not above it.

---

## Flex Layout Rules

### Gap vs Padding

These are not interchangeable. They communicate different things.

| Decision                               | Use                     | Why                                           |
| -------------------------------------- | ----------------------- | --------------------------------------------- |
| Space **between** sibling elements     | `gap-*`                 | Communicates separation of independent items  |
| Space **inside** a container wall      | `p-*` / `px-*` / `py-*` | Communicates containment                      |
| Space **between grouped text lines**   | `space-y-*`             | Communicates relationship within a text block |
| Space **between independent sections** | `mt-*` or `mb-*`        | Communicates page-level separation            |

**Never substitute** `gap` for `p`. They produce identical pixel outputs in some cases but communicate entirely different structures.

### Flex Direction × Gap Reference

```jsx
// Horizontal row — icon + label, button group, nav items
<Flex direction="row" align="center" gap="2">   // tight (8px)  — same conceptual unit
<Flex direction="row" align="center" gap="3">   // standard (12px) — related but distinct
<Flex direction="row" align="center" gap="4">   // loose (16px) — clearly separate items
<Flex direction="row" align="center" gap="6">   // very loose — action groups in toolbars

// Vertical stack — heading + text + button
<Flex direction="column" gap="1">   // within a single element (label + hint)
<Flex direction="column" gap="2">   // tight related items (form field internals)
<Flex direction="column" gap="3">   // standard vertical group (card body)
<Flex direction="column" gap="4">   // section sub-groups
<Flex direction="column" gap="6">   // major content blocks
<Flex direction="column" gap="8">   // section-level stacking (page builder)
```

### Align + Justify Semantics

| Pattern                            | Use for                                |
| ---------------------------------- | -------------------------------------- |
| `align="center" justify="between"` | Header rows (logo left, actions right) |
| `align="center" justify="center"`  | Hero content, centered section content |
| `align="center" justify="start"`   | List rows, sidebar items               |
| `align="start" justify="start"`    | Text-heavy blocks, card bodies         |
| `align="center" justify="end"`     | Action footers (Cancel / Confirm)      |

**Never use `justify="between"` for fewer than 2 elements.** It collapses to `justify="start"` and looks identical but communicates broken intent.

### Optical Centering — Three-Column TopBar Rule

> **Problem:** `justify-between` on a flex row containing 3 children (logo | nav | actions) does NOT optically center the middle element.

**The fix — three equal-width columns:**

```jsx
// ✓ center column is ALWAYS optically centered regardless of side widths
<header className="flex items-center h-14 px-6">
  <div className="flex flex-1 items-center justify-start">
    <Logo />
  </div>
  <div className="flex flex-1 items-center justify-center">
    <nav className="flex items-center gap-6">
      <NavLink>Docs</NavLink>
      <NavLink>Components</NavLink>
      <NavLink>Blocks</NavLink>
    </nav>
  </div>
  <div className="flex flex-1 items-center justify-end gap-2">
    <IconButton icon={<Moon />} />
    <Button>Get started</Button>
  </div>
</header>
```

**The rule:** Any horizontal bar where visual center matters — top navigation, modal header, toolbar — **MUST** use three `flex-1` children rather than `justify-between`. `justify-between` is only correct when there are exactly two children.

| Layout                                       | Use three-col `flex-1`      | Use `justify-between`             |
| -------------------------------------------- | --------------------------- | --------------------------------- |
| Top navigation (logo + nav links + actions)  | ✅ Always                   | ✗ Never                           |
| Modal / dialog header (title + close button) | ✅ When content is centered | ✓ When title is left-aligned      |
| Toolbar with centered tool group             | ✅ Yes                      | ✗ No                              |
| Card header (label + action)                 | —                           | ✅ Two children, no center needed |

---

## Grid Layout Rules

### Column Count by Context

```jsx
// Feature/card grids
<Grid columns="3" className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">  // 3-up feature grid
<Grid columns="2" className="grid-cols-1 md:grid-cols-2">                 // 2-up comparison
<Grid columns="4" className="grid-cols-2 lg:grid-cols-4">                 // stat/metric row

// App sidebar + content
className="grid grid-cols-[240px_1fr]"     // fixed sidebar
className="grid grid-cols-[1fr_320px]"     // main + aside panel
```

### Grid Gap Reference

```
gap-4    (16px)   ← form fields, dense card grids
gap-5    (20px)   ← standard card grids (compact)
gap-6    (24px)   ← standard card grids (comfortable)
gap-8    (32px)   ← feature grids, large showcase cards
gap-10   (40px)   ← hero split layouts, large editorial
```

**Rule:** Match gap size to card padding. If a card has `p-6`, the grid gap should be `gap-6`. Visual rhythm = gap ≈ card padding.

---

## Container Nesting Depth

Every nesting level adds cognitive weight. Limit depth deliberately.

### Maximum Nesting Rules

```
Page                           depth 0 — <main>, <body>
  Section                      depth 1 — <section>
    Container                  depth 2 — <Container size="lg">
      Content block            depth 3 — <div> or grid row
        Card / panel           depth 4 — <Card> or surface div
          Card internal group  depth 5 — <div className="space-y-3">
            Element            depth 6 — <Button>, <Text>, <Input>
```

**Hard rules:**

- **Maximum 6 nesting levels** from `<main>` to a leaf element.
- **Never nest a card inside a card** without a clear semantic reason (exception: inset code block, terminal preview).
- **Never wrap a single child** in a div whose sole purpose is adding margin. Use `mt-*` on the child directly or `gap-*` on the parent.
- **`<section>` is never a layout div.** A section communicates document structure. Use `<div>` for purely presentational groupings.

---

## Typography Spacing Within Components

```
Heading → immediately following subheading:   gap-1  / space-y-1
Heading → following body text:                gap-2  / space-y-2
Label → Input:                                space-y-1 or space-y-1.5
Input → helper text / error:                  mt-1
Form field → next form field:                 space-y-4 or space-y-5
Section heading → body text:                  gap-3  / space-y-3
Section body → CTA button:                    mt-6 or mt-8
Overline/badge → heading (section header):       gap-3 (label above heading)
Heading → description (card):                 space-y-2
Card body → card footer divider:              pt-3 border-t border-hairline
```

**Rule:** Heading and its direct supporting text always have less space between them (`gap-2`) than the space between the heading+text group and the next sibling group (`gap-6`). If sibling distance ≤ internal distance, the grouping breaks.

---

## Responsive Breakpoint Rules

### Breakpoint Ladder

```
Default (mobile, <640px):   single column, full-width, compressed padding
sm  (>=640px):              2-column grids begin, padding grows slightly
md  (>=768px):              desktop layout kicks in fully, full nav visible
lg  (>=1024px):             3-column grids, sidebar layouts
xl  (>=1280px):             max-width containers stop growing, content centers
```

### Responsive Padding Pattern

```jsx
// Section
className = "py-12 md:py-16 lg:py-24";

// Container horizontal gutter
className = "px-4 sm:px-6 md:px-8 lg:px-10";

// Card (stays consistent — card padding doesn't need to grow)
className = "p-4 md:p-5";

// Hero vertical breathing
className = "pt-12 pb-16 md:pt-20 md:pb-24";
```

**Rule:** Never reduce padding at larger breakpoints. Spacing only grows or stays the same as viewport expands.

---

## Alignment Rules

### The Three Alignment Contexts

| Alignment  | When to use                                                                                      | Hard limits                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **Left**   | Body text, list content, form labels, card body, sidebar nav, data tables, any content > 2 lines | No limit — default for all prose and data                                      |
| **Center** | Hero headings, section headers, empty states, standalone CTAs                                     | Max **3 lines** of text. Never center a paragraph. Never center form fields.   |
| **Right**  | Numeric data in table cells, trailing actions in a row, timestamps in chat                       | Only in contexts where right-to-left reading makes sense (amounts, timestamps) |

### Reading Path Rules

```
Marketing page (F-pattern):
  Logo (top-left) → Nav (horizontal) → Hero heading → CTA → Sections scroll downward

App dashboard (Z-pattern):
  Page title (top-left) → Actions (top-right) → Primary metric (top-left of content)
  → Supporting content (right / below)

Form (single-column downward):
  Label → Input → Hint → Next label → Next input
  Never: 2-column forms on mobile
```

**Alignment must be consistent within a section.** If one card has `text-left`, all cards in that grid have `text-left`.

### Ruled-List / Divider Layout Alignment

When building horizontal-divider layouts (ruled lists, definition rows, feature matrices) where each row has a **label column + description column**, the label column MUST use a **fixed width** so all descriptions start at the same x position across rows.

```tsx
// ✓ Correct — label column has fixed width, descriptions align
<div className="grid grid-cols-1 gap-4 sm:grid-cols-[260px_1fr] sm:items-center">
  <div className="shrink-0">Label A</div>
  <div>Description for A starts here</div>
</div>

// ✗ Wrong — label width varies per row, descriptions misalign
<div className="grid grid-cols-2 gap-4">
  <div>Label A</div>        {/* different width */}
  <div>Description for A</div>
</div>
```

**Key rules:**
- Use `sm:grid-cols-[Wpx_1fr]` (or `sm:grid-cols-[Wrem_1fr]`) with a fixed first column
- Add `shrink-0` to the label to prevent flex compression
- Common widths: `w-44` (11rem) for short labels, `sm:w-72` (18rem) for longer labels
- On mobile, stack vertically (`grid-cols-1`) — the fixed width only applies at `sm:` and up
- This applies to ALL ruled/divider layouts: lineage lists, feature matrices, tool descriptions, cognitive skills grids

---

## Repeating Unit Consistency

Every element that appears in a set (cards in a grid, items in a list, tabs in a tab bar) must have **identical spatial structure** at any given viewport: same padding, same gap, same border treatment, same radius.

```
✓ Correct — identical structure:
  Card 1: p-5, space-y-3, border border-hairline, rounded-[var(--radius-panel)]
  Card 2: p-5, space-y-3, border border-hairline, rounded-[var(--radius-panel)]

✗ Wrong — structure varies:
  Card 1: p-5, space-y-3, border, rounded-[var(--radius-panel)]
  Card 2: p-4, space-y-4, no border, rounded-[var(--radius-lg)]   ← different
```

**Content varies. Structure does not.**

### When Intentional Variation Is Valid

Maximum **1** variant item per repeating set. Must be visually heavier, positioned first or last — never in the middle.

---

## False Containment Rule

### What Is False Containment

False containment occurs when a visual boundary (border, background, shadow, rounded corners) is applied for aesthetic reasons without a semantic reason.

### The Containment Test

Before adding any `border`, `bg-*`, `shadow-*`, or `rounded-*` to a div, answer:

> **What conceptual group does this boundary define, and what is outside it?**

If you cannot answer clearly, the boundary is false. Remove it.

```
✓ Valid containment:
  Card with border border-hairline — groups: "this card's content" vs "the grid around it"
  Sidebar with bg-surface — groups: "navigation" vs "main content"

✗ False containment:
  Div with border around a heading and its subtext
  bg-surface on a div that is just vertically stacking two paragraphs
  Card inside a card with a different background
```

### Containment Hierarchy Must Match Semantic Hierarchy

```
Correct hierarchy:
  Page background: bg-canvas (no shadow, no border)
    Section: bg-surface border-y border-hairline (light boundary)
      Card: shadow-card border border-hairline rounded-[var(--radius-panel)] (medium boundary)
        Badge: bg-accent/15 rounded-[var(--radius-lg)] (light inner signal)

Inverted (wrong):
  Card: shadow-sm border (lighter than its inner element)
    Inner callout: shadow-panel (heavier — visually overrides the parent) ✗
```

---

## Quick Reference — Spatial Scale

| Scale                     | px       | Common use                                  |
| ------------------------- | -------- | ------------------------------------------- |
| `space-y-1` / `gap-1`     | 4px      | Label → hint, icon → label                  |
| `space-y-1.5` / `gap-1.5` | 6px      | Dense list item internals                   |
| `space-y-2` / `gap-2`     | 8px      | Heading → subtext, tight sibling rows       |
| `space-y-3` / `gap-3`     | 12px     | Card body groups, nav item gaps             |
| `space-y-4` / `gap-4`     | 16px     | Form field gap, card grid (dense)           |
| `space-y-5` / `gap-5`     | 20px     | Card grid (compact)                         |
| `space-y-6` / `gap-6`     | 24px     | Standard card grid, section sub-blocks      |
| `space-y-8` / `gap-8`     | 32px     | Feature grids, page content blocks          |
| `space-y-10` / `gap-10`   | 40px     | Hero splits, large editorial layouts        |
| `py-12`                   | 48px     | Compact section / mobile standard           |
| `py-16`                   | 64px     | Standard marketing section                  |
| `py-20`                   | 80px     | Prominent section                           |
| `py-24`                   | 96px     | Hero / major landmark section               |
| `py-32`                   | 128px    | Extra-large hero / editorial breath section |
| `min-h-screen` / `100dvh` | viewport | Editorial full-screen hero                  |

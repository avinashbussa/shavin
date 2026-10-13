# Adapter: semantic HTML + Tailwind (generic)

Use this when the project has no design-system primitives, or when the target stack is not `@shavin/ui`. It also serves as the base for translating to other stacks (CSS modules, vanilla CSS, other component libraries): keep the structure and tokens, change the syntax.

Contents: 1 Token contract · 2 Building blocks · 3 Measure and type utilities · 4 Treatment recipes · 5 Translating to other stacks

---

## 1. Token contract

Define semantic tokens once; components use only these, so dark mode and re-theming work everywhere.

```css
:root {
  --canvas: #ffffff;
  --canvas-subtle: #f6f6f7;
  --surface: #ffffff;
  --fg: #111114;
  --fg-subtle: #5b5b66;
  --hairline: #e4e4e8;
  --accent: #3b5bdb;

  --radius-panel: 20px;
  --panel-pad: 24px;
  --shadow-panel: 0 1px 2px rgb(0 0 0 / .06), 0 8px 24px rgb(0 0 0 / .06);

  --section-y: clamp(4rem, 8vw, 6rem);         /* default */
  --section-y-compact: clamp(2.5rem, 5vw, 3.5rem);
  --section-y-spacious: clamp(6rem, 12vw, 9rem);
  --measure-body: 68ch;
  --container: 72rem;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --canvas: #0e0e11; --canvas-subtle: #16161b; --surface: #16161b;
    --fg: #f2f2f5; --fg-subtle: #a0a0ad; --hairline: #2a2a33;
  }
}
:root[data-theme="dark"] {
  --canvas: #0e0e11; --canvas-subtle: #16161b; --surface: #16161b;
  --fg: #f2f2f5; --fg-subtle: #a0a0ad; --hairline: #2a2a33;
}
```

The values are placeholders: replace them with the project's palette. The names are the contract.

## 2. Building blocks

```html
<!-- section with rhythm, container, labelled heading -->
<section aria-labelledby="features-h" style="padding-block: var(--section-y)">
  <div class="mx-auto w-full max-w-[var(--container)] px-6">
    <h2 id="features-h" data-slot="headline" class="text-balance">…</h2>
    <p data-slot="sub" class="max-w-[58ch] text-[var(--fg-subtle)]">…</p>
    <!-- composition grid here -->
  </div>
</section>
```

Equal columns:

```html
<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">…</div>
```

Span layout (F2, H3, E3):

```html
<div class="grid grid-cols-1 gap-6 md:grid-cols-6 lg:grid-cols-12">
  <article class="md:col-span-6 lg:col-span-8">…</article>
  <article class="md:col-span-3 lg:col-span-4">…</article>
</div>
```

Full-screen sections use `min-h-[85svh]`, never `vh`.

## 3. Measure and type utilities

| Need | Class |
|---|---|
| Body measure | `max-w-[68ch]` |
| Lead measure | `max-w-[58ch]` |
| Balanced headline | `text-balance` |
| Orphan-safe body | `[text-wrap:pretty]` |
| Tabular figures | `tabular-nums` |
| Fluid display type | `text-[clamp(3rem,9vw,9rem)] leading-[0.95]` |

Logical properties for RTL: `ps-*`, `pe-*`, `ms-*`, `me-*`, `text-start`, `text-end`.

## 4. Treatment recipes

| Treatment | Recipe |
|---|---|
| carded | `bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-panel)] p-6` |
| ruled | `border-t border-[var(--hairline)] pt-6` on items; `divide-x divide-[var(--hairline)]` on columns |
| flat | `bg-[var(--canvas-subtle)] rounded-[var(--radius-panel)] p-6` |
| full-bleed | `relative min-h-[85svh] overflow-hidden`, media `absolute inset-0 object-cover`, scrim `absolute inset-0 bg-gradient-to-t from-black/60`, content `relative` |
| open | No container classes; structure via type scale, `gap-*` and whitespace |

Concentric inner radius: `rounded-[max(calc(var(--radius-panel)-var(--panel-pad)),4px)]`.

## 5. Translating to other stacks

1. Keep the DOM order, landmarks, `data-slot` attributes and headings exactly.
2. Map the token contract to the stack's theming mechanism.
3. Keep the breakpoints in each composition's `Grid:` line (`base`, `sm`/`md`, `lg`, `xl`).
4. Replace Tailwind utilities with equivalent CSS. The three that matter most: `text-wrap: balance`, `max-width` in `ch`, and `aspect-ratio`.

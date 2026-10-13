# Motion tokens

`@shavin/ui` already defines a two-tier motion token system in `global.css`, mirroring the color/radius architecture. This file documents the tokens for reference; do not re-declare them.

## Foundation tokens (defined in `:root` of `global.css`)

```css
:root {
  /* durations */
  --dur-instant: 100ms;
  --dur-fast: 160ms;     /* hover, press */
  --dur-base: 240ms;     /* state changes: tabs, toggles, menus */
  --dur-slow: 360ms;     /* larger surface changes */
  --dur-enter: 560ms;    /* entrances and reveals */

  /* easings */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-overshoot: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* distances */
  --dist-xs: 4px;
  --dist-sm: 8px;
  --dist-md: 12px;       /* default entrance travel */
  --dist-lg: 24px;       /* maximum entrance travel */

  /* stagger */
  --stagger: 60ms;
}
```

## Semantic aliases

```css
:root {
  --dur-tooltip: var(--dur-fast);
  --dur-popover: var(--dur-fast);
  --dur-drawer: var(--dur-base);
  --dur-modal: var(--dur-base);
  --dur-accordion: var(--dur-base);

  --dist-tooltip: var(--dist-xs);
  --dist-popover: var(--dist-sm);
  --dist-drawer: var(--dist-lg);
  --dist-modal: var(--dist-md);
  --dist-accordion: var(--dist-sm);
}
```

## Reduced-motion safety net

A single `@media (prefers-reduced-motion: reduce)` block in `global.css` zeros all motion tokens:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-instant: 0ms; --dur-fast: 0ms; --dur-base: 0ms;
    --dur-slow: 0ms; --dur-enter: 0ms; --stagger: 0ms;
    --dist-xs: 0px; --dist-sm: 0px; --dist-md: 0px; --dist-lg: 0px;
  }
}
```

Zeroing the tokens under reduced motion is a safety net, not a substitute for designing the reduced path: presets that add or remove content (marquees, count-ups, sticky effects) still need their own fallback (see `presets.md`).

## Tailwind preset exposure

The `@shavin/ui` Tailwind preset exposes duration tokens as `transitionDuration` utilities:

| Utility | Token |
|---|---|
| `duration-instant` | `var(--dur-instant)` |
| `duration-fast` | `var(--dur-fast)` |
| `duration-base` | `var(--dur-base)` |
| `duration-slow` | `var(--dur-slow)` |
| `duration-enter` | `var(--dur-enter)` |

Use: `transition-transform duration-fast ease-standard`.

## Choosing values

| Situation | Duration | Easing | Travel |
|---|---|---|---|
| Button hover / press | fast | standard | scale 0.98 on press only |
| Tab panel change | base | standard | opacity only |
| Menu / sheet open | base | out | ≤ 16px or slide from edge |
| Menu / sheet close | ~0.65 × base | in | same axis |
| Section reveal | enter | out | md (12px) |
| Card grid reveal | enter | out | md, stagger 60ms |
| Number count-up | 1000–1200ms | out (cubic) | n/a |
| Marquee | 30–60s per loop | linear | n/a |

## Rules

- Don't invent one-off durations. If a new duration is truly needed, add a token.
- Exits are faster than entrances.
- Long travel (> 24px) looks like a slide, not a reveal. Use choreography if that's the intent.
- Everything scaled by the tokens collapses to instant under reduced motion.
- The canonical motion reference is `visual-compositor/motion-and-physics.md` — see it for The Frequency Law, Rauno split & stagger patterns, and the full animation utilities table.

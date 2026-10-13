# Editorial & Expressive Mode Reference

> **Active for: `EDITORIAL` (full), `HYBRID` (hero/marquee sections), `MARKETING` (hero section only)**
>
> This chapter covers the 8 design capabilities that separate award-winning creative sites from competent marketing pages. All rules here are quantifiable — they produce specific visual outputs.

---

## 1. Motion Architecture

Motion is the single biggest differentiator between editorial and standard layouts. Every motion decision must serve a cognitive purpose — entrance (draws attention), transition (maintains orientation), or expression (communicates brand energy).

### Easing Vocabulary

```css
/* UI / Functional motion — fast, decisive, purposeful */
--ease-ui:          cubic-bezier(0.2, 0, 0, 1);      /* 150ms–300ms */
--ease-ui-out:      cubic-bezier(0, 0, 0.2, 1);      /* 200ms–400ms */

/* Editorial / Expressive motion — slow, confident, weighty */
--ease-editorial:   cubic-bezier(0.76, 0, 0.24, 1);  /* 700ms–1200ms */
--ease-reveal:      cubic-bezier(0.16, 1, 0.3, 1);   /* 800ms–1000ms — spring-like */
--ease-smooth:      cubic-bezier(0.4, 0, 0.2, 1);    /* 600ms–900ms — material-inspired */

/* Parallax / continuous — linear by intent */
--ease-parallax:    linear;
```

**Rule:** Never apply `--ease-editorial` timing to UI feedback (button press, form validation). Never apply `--ease-ui` timing to editorial reveals — it makes them feel mechanical.

### Scroll-Triggered Entrance Animations

```css
/* Starting state */
.reveal-up    { opacity: 0; transform: translateY(2rem); }   /* 32px — standard */
.reveal-fade  { opacity: 0; }                                 /* fade only */
.reveal-scale { opacity: 0; transform: scale(0.95); }         /* subtle scale */

/* Ending state */
.revealed {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition: opacity 900ms var(--ease-reveal), transform 900ms var(--ease-reveal);
}
```

**IntersectionObserver threshold:** `0.1` to `0.2` — trigger when 10–20% of the element is visible. Never `0` or `0.5`.

**Stagger delays:** `0ms`, `100ms`, `200ms`, `300ms` (max 500ms total stagger).

### Parallax Ratios

```
Background image / atmospheric layer:  scroll × 0.3 to 0.5
Mid-layer content:                     scroll × 0.7 to 0.85
Foreground content:                    scroll × 1.0 (normal)
Sticky pinned layer:                   scroll × 0.0
```

### Responsive Motion

- **Desktop:** Full motion (entrance, parallax, stagger, page transitions).
- **Tablet:** Entrance + stagger — no parallax.
- **Mobile:** Entrance only, no stagger > 200ms, no parallax. Respect `@media (prefers-reduced-motion: reduce)`.

---

## 2. Editorial Typography

In editorial mode, typography is visual material — it creates shape, texture, and atmosphere.

### Viewport-Relative Sizing with clamp()

```css
font-size: clamp(3.5rem, 10vw, 10rem);    /* 56px → scales with vw → 160px max */
font-size: clamp(2.5rem, 6vw, 6rem);      /* 40px → scales → 96px max */
font-size: clamp(1.25rem, 2.5vw, 2rem);   /* 20px → scales → 32px max */
font-size: clamp(1rem, 1.2vw, 1.125rem);  /* 16px → scales → 18px max */
```

### Contrast Ratios & Display Rules

| Context | Standard mode minimum | Editorial mode target |
|---|---|---|
| Headline : body | 2:1 | 6:1 to 10:1 |
| Display : subtext | 3:1 | 8:1 to 15:1 |
| Overline : headline | 1:2 | 1:4 to 1:8 |

Display leading: `leading-none` (1.0) or `leading-[0.9]`. Tracking: `tracking-tight` or `tracking-tighter`.
Overline tracking: `tracking-[0.25em]` to `tracking-[0.4em]`.

---

## 3. Z-Axis and Spatial Depth

### Z-Index Scale

`z-0` (base), `z-10` (floating cards/blobs), `z-20` (sticky headers/sidebars), `z-30` (dropdowns/popovers), `z-40` (modals/drawers), `z-50` (tooltips/alerts). Never `z-[9999]`.

### 3D Transforms & Grid Escape

```css
.card-3d {
  transform-style: preserve-3d;
  perspective: 1000px;
  transition: transform 600ms var(--ease-smooth);
}
.card-3d:hover { transform: rotateX(4deg) rotateY(-4deg); }
```

Grid Escape full-bleed: `className="w-screen relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]"`

---

## 4. Asymmetric Grid and Composition

### Asymmetric Column Patterns

```jsx
className="grid grid-cols-[1.618fr_1fr] gap-16"  /* Golden ratio */
className="grid grid-cols-[2fr_1fr] gap-12"       /* 2/3 content — 1/3 void */
className="grid grid-cols-[auto_1fr] gap-10"      /* Stat/number left, text right */
```

The standard 50% content width minimum is suspended in Editorial mode. Content occupying 20–40% of viewport is valid for high-impact statements.

---

## 5. Section Transitions

- **Diagonal Clip-Path:** `clip-path: polygon(0 0, 100% 0, 100% 90%, 0 100%);`
- **Section Overlap:** `<section className="-mt-12 md:-mt-20 rounded-t-[var(--radius-panel)] z-20">`
- **Atmospheric Continuity:** Page wrapper linear-gradient spanning multiple sections.

---

## 6. Color Atmosphere

- **Grain Texture:** `backgroundImage: svgNoise`, `opacity: 0.03`–`0.05`.
- **Glassmorphism:** `bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]`. Needs dynamic backdrop content.
- **Radial Glow:** `bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--accent)/0.3,transparent)]`.

---

## 7. Theatrical White Space

- **Breath Section:** Viewport-filling pause (`min-h-[60vh]`) with one statement.
- **Void Minimums:** 20% viewport content floor. Generous vertical padding (`py-24`+).

---

## 8. Hero Scale & DVH Viewport Fill

```jsx
<section className="min-h-[100dvh] relative flex flex-col items-center justify-center overflow-hidden pt-16">
  <div className="absolute inset-0 z-0 bg-gradient-to-br from-[var(--n-950)] to-black" />
  <div className="relative z-10 text-center px-4 max-w-7xl mx-auto">
    <h1 className="text-[clamp(3.5rem,10vw,9rem)] font-display font-bold leading-none tracking-tight">
      Headline
    </h1>
  </div>
</section>
```

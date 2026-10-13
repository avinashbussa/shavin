# Interface Polish & Tactile Craftsmanship

> **Load priority:** ALL MODES.
> **Token cost:** ~2.5K tokens.
> **Synthesized from:** Rauno Freiberg (Make Interfaces Feel Better), Emil Kowalski (Animation Craft), and Meng To (Design-First Systems).

This file defines the micro-craftsmanship rules that elevate digital interfaces from synthetic AI wireframes into bespoke, high-end software experiences.

---

## 1. Tactile Press Feedback (`scale(0.96)`)

Physical feedback on click makes UI feel responsive, tactile, and grounded:

```tsx
// ✅ Tactile scale on press
<Button 
  size="md" 
  variant="solid" 
  tone="accent" 
  className="active:scale-[0.96] transition-transform duration-150"
>
  Start Building Free
</Button>
```

**Rules:**
- Always use `0.96` for button and interactive card press states.
- **Never use a scale smaller than 0.95** (anything below `0.95` feels exaggerated and bouncy).
- Always pair with `transition-transform duration-150`.

---

## 2. Proximity before Containers (The Anti-Box Law)

A classic failure of AI layout design is **over-containment**: wrapping every single piece of content, metric, or feature in its own bordered card or box.

> [!IMPORTANT]
> **Use proximity to group related items before reaching for a container.**
> Related elements sit close together (`gap-2` to `gap-4`); distinct conceptual groups are separated by whitespace (`gap-8` to `gap-12`). Turning every list item into a card makes layouts look like clunky spreadsheets.

### Container Audit
- If 3 metric items share a card, use a clean horizontal layout with subtle dividers or simple spacing—do NOT wrap each metric in its own nested sub-card.
- Reserve `<Card>` for top-level interactive surfaces and primary focal units.

---

## 3. Hierarchy before Labels

> **Governing principle:** Prefer typographic hierarchy (size, weight, color, spacing) over decorative elements for structural labeling. See `visual-compositor/anti-patterns.md` AP-04 (Badge Soup) & AP-08 (Status-Chip Soup).

- **Size, weight, placement, and contrast** must do 90% of the work.
- Do NOT add a badge above a title unless it conveys an urgent state change (e.g. `v2.4 Active` or `Failed`).
- At most 1 concise badge per view — use overline text for section labels.

---

## 4. The Lummi-Mesh Atmospheric Recipe

To achieve the warm, high-end atmospheric depth seen in flagship landing pages (Apple keynotes, Linear launches, Stripe sessions), combine a subtle photographic pastel gradient texture with a directional gradient scrim:

```tsx
<div className="relative overflow-hidden bg-surface py-24 md:py-32 text-center">
  {/* Atmospheric Pastel Mesh Layer */}
  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
    <div 
      className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30 dark:opacity-20 scale-105"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop')",
      }}
    />
    {/* Directional Scrim protecting text contrast */}
    <div className="absolute inset-0 bg-gradient-to-b from-canvas/30 via-surface/80 to-surface backdrop-blur-[2px]" />
  </div>

  <Container size="lg" className="relative z-10">
    {/* Foreground content sits with 100% crisp contrast */}
  </Container>
</div>
```

**Why this works:**
- The background photography provides continuous, organic chromatic shifts (warm apricot on the left to silky lavender on the right) that synthetic CSS radial gradients cannot replicate.
- The directional scrim (`from-canvas/30 via-surface/80 to-surface backdrop-blur-[2px]`) softly diffuses the texture, guaranteeing WCAG AAA contrast for foreground typography.

### Preferred: layout bg props (`@shavin/ui`)

```tsx
<Section size="hero" surface="dark-always" bgImage="https://assets.lummi.ai/…" bgOverlays="scrim-left, dark-20">…</Section>
<Section size="hero" surface="dark-always" bgOverlays="mesh-lime-animated, dark-20">…</Section>
<Section size="hero" bgVideo="…pexels…" bgPoster="…" bgOverlays="scrim-left, fade-canvas">…</Section>
```

- Meshes: `mesh-lime|dusk|mint|peach` (fixed pastel), `mesh-accent` (theme); `-animated` = slow drift, off under reduced motion. `scrim-left` for left copy; `fade-canvas` dissolves into page. Radial/hex-alpha syntax: `adapters/shavin-ui.md` §4b.
- Dark media: `surface="dark-always"`; subtitles `text-fg-muted`, not `-subtle`.

---

## 5. Hardware-Accelerated Motion Principles (Emil Kowalski)

1. **Animate Compositor Properties Only**:
   - Animate `transform` and `opacity`.
   - **NEVER** animate layout geometry: `width`, `height`, `top`, `left`, `margin`, `padding` (causes expensive CPU reflows and frame drops).
2. **Never Write `transition: all`**:
   - Always declare explicit properties: `transition-transform`, `transition-opacity`, `transition-colors`.
3. **Asymmetric Enter/Exit Timing**:
   - Interactive exits must be fast and snappy: `150ms–200ms ease-out`.
   - Entrances can be slightly smoother and more deliberate: `250ms–350ms cubic-bezier(0.16, 1, 0.3, 1)`.
4. **Stagger Cascades**:
   - When revealing a list of items, stagger by `30ms–50ms` per item. Never exceed 300ms total stagger time.

---

## 6. Icon Optical Weight & Alignment (Rauno Freiberg)

- **Match Icon Stroke to Text Weight**:
  - `1.5px` stroke beside regular text (weight 400).
  - `2px` stroke beside semibold text (weight 600).
- **One Icon Family**: Never mix Lucide icons with custom SVGs, Phosphor, or emojis.
- **Vertical Alignment**: In inline flex rows, always pair icons with `align="center"` and ensure icons have `shrink-0` to prevent distortion.

---

## 7. Optical Centering & Asymmetric Compensation (Rauno Freiberg)

When geometric math looks visually off balance to the human eye, always align optically:

### 1. Button Padding with Icon
Icons have less visual density than letters. When placing an icon on the right side of a button:
$$\text{Icon-Side Padding} = \text{Text-Side Padding} - 2\text{px}$$
```tsx
// ✅ Optical balance: pl-4 (16px) paired with pr-3.5 (14px)
<Button className="pl-4 pr-3.5 flex items-center gap-2">
  <span>Continue</span>
  <ArrowRight className="h-4 w-4 shrink-0" />
</Button>
```

### 2. Play Button Triangle Shift
The geometric bounding box center of a triangle $\neq$ its visual center of mass. Always nudge play icons 2px to the right:
```tsx
// ✅ Shift play triangle 2px right to achieve optical center
<button className="flex items-center justify-center p-3 rounded-full bg-surface shadow-card">
  <Play className="h-5 w-5 fill-current ml-0.5" />
</button>
```

### 3. Shadows Instead of Solid Borders for Adaptive Surfaces
Solid border lines (`border border-hairline`) can look harsh and rigid when placed over multi-tonal photographic or mesh backgrounds.
- For elevated cards and floating surfaces, prefer layered subtle box shadows (`shadow-panel`, `shadow-card`) which adapt naturally across variable backgrounds through alpha transparency.


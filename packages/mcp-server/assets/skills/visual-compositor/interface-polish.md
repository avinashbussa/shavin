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
  tone="brand" 
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
- At most 1 concise badge per view. Section labels are optional; plain overline text only where it adds information.

---

## 4. The Lummi-Mesh Atmospheric Recipe

To get the warm, high-end atmospheric depth of flagship landing pages, put a photographic or mesh backdrop behind the content with a scrim that keeps text at 4.5:1 or better (measure it). Use the layout bg props (`@shavin/ui`); never hand-build the layers. Photography gives organic colour shifts a CSS gradient cannot, and the scrim diffuses it so the text stays crisp.

```tsx
<Section size="hero" surface="dark-always" bgImage="https://assets.lummi.ai/…" bgOverlays="scrim-left, dark-20">…</Section>
<Section size="hero" surface="dark-always" bgOverlays="mesh-night, dark-20">…</Section>
<Section size="hero" surface="dark-always" bgVideo="…pexels…" bgPoster="…" bgOverlays="scrim-left, fade-canvas">…</Section>
```

- Meshes: `mesh-lime|mint|dawn|peach|rose|night` (fixed palettes), `mesh-brand` (follows the theme); `-animated` = slow drift, off under reduced motion. `scrim-left` for left copy; `fade-canvas` dissolves into page. Radial/hex-alpha syntax: `adapters/shavin-ui.md` §4b.
- Always set `surface` on a mesh or custom gradient: `dark-always` for `mesh-night` and other dark backdrops, `light-always` for pale ones. Photos, video and fx default to `dark-always` with a scrim, but say it anyway.
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
<Button className="pl-4 pr-3.5" iconRight={<Icon name="ArrowRight" size="sm" />}>
  Continue
</Button>
```

### 2. Play Button Triangle Shift
The geometric bounding box center of a triangle $\neq$ its visual center of mass. Always nudge play icons 2px to the right:
```tsx
// ✅ Shift play triangle 2px right to achieve optical center
<IconButton aria-label="Play">
  <Icon name="Play" size="md" className="ml-0.5" />
</IconButton>
```

### 3. Shadows Instead of Solid Borders for Adaptive Surfaces
Solid border lines (`border border-hairline`) can look harsh and rigid when placed over multi-tonal photographic or mesh backgrounds.
- For elevated cards and floating surfaces, prefer layered subtle box shadows (`shadow-panel`, `shadow-card`) which adapt naturally across variable backgrounds through alpha transparency.


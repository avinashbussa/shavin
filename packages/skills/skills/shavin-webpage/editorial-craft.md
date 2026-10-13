# Editorial Craft & Cinematic Web Experiences

> Synthesizing **Meng To's Awwwards/FWA-grade editorial design doctrines** into `@shavin/ui` tokenized, high-performance layouts.

---

## 1. Atmospheric Background Compositions

Top-tier interfaces never use flat single-color blocks or crude neon glow balls. They craft **atmospheric depth** through layered chromatic textures and directional scrims:

### The Multi-Layer Atmospheric Recipe
A cinematic hero background consists of 3 distinct layers:

```
Layer 3 (Foreground): Content (Heading, text, buttons, UI mockups)
  ▲
Layer 2 (The Scrim): Directional dissolution (from-canvas/30 via-surface/80 to-surface backdrop-blur-[2px])
  ▲
Layer 1 (The Texture): High-resolution organic chromatic photography or mesh gradient (opacity 25-35%)
  ▲
Layer 0 (The Canvas): Base background token (bg-canvas)
```

```tsx
// Architectural Pattern: The Lummi-Atmosphere Hero
<div className="relative overflow-hidden bg-canvas py-24 md:py-32">
  {/* Layer 1: Organic Chromatic Texture */}
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
    <div 
      className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30 dark:opacity-20 scale-105"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop')" }}
    />
    {/* Layer 2: Directional Scrim (preserves WCAG AAA contrast) */}
    <div className="absolute inset-0 bg-gradient-to-b from-canvas/30 via-surface/80 to-surface backdrop-blur-[2px]" />
  </div>

  {/* Layer 3: Foreground Content */}
  <Container size="lg" className="relative z-10">
    ...
  </Container>
</div>
```

---

## 2. Container Lines & Framed Grid Layouts

To achieve an **editorial, engineering-grade CAD feel** (seen in Linear, Chronicle, and Vercel design systems), replace arbitrary floating cards with **continuous container lines**:

### Hairline Grid Lines
Instead of drawing separate box outlines around every column:
- Use parent container dividers: `divide-x divide-hairline` or `divide-y divide-hairline`.
- Add subtle crosshairs at grid intersections:
```tsx
<div className="relative border border-hairline/70 rounded-[var(--radius-panel)] p-8">
  {/* Crosshair accents at corners */}
  <span className="absolute -top-1.5 -left-1.5 text-hairline font-mono text-xs select-none">+</span>
  <span className="absolute -top-1.5 -right-1.5 text-hairline font-mono text-xs select-none">+</span>
  <span className="absolute -bottom-1.5 -left-1.5 text-hairline font-mono text-xs select-none">+</span>
  <span className="absolute -bottom-1.5 -right-1.5 text-hairline font-mono text-xs select-none">+</span>
  
  {/* Content */}
</div>
```

---

## 3. Progressive Blur & Depth Masking

When layering floating navigation bars, modal dialogs, or overlay cards over rich imagery:
- Avoid uniform flat opacity fills (`bg-black/90` or `bg-white/90`).
- Use **progressive glassmorphism** with backdrop filters:
```tsx
className="bg-surface/80 backdrop-blur-md border border-hairline shadow-panel"
```
- For overlay headers or floating footers, use gradient alpha masks to create seamless fade-out edges:
```css
mask-image: linear-gradient(to bottom, black 0%, black 80%, transparent 100%);
-webkit-mask-image: linear-gradient(to bottom, black 0%, black 80%, transparent 100%);
```

---

## 4. Purposeful Media vs. Detached 3D Stock Art

A hallmark of AI design slop is decorating developer or SaaS pages with random 3D clay spheres, glossy rings, or floating pyramids used as the focal visual.

### The Rule of Purposeful Media
Hero / main media is **curated photography** (Lummi `assets.lummi.ai`, Unsplash, or user-supplied), a **mesh gradient**, or an **animated background** (Pexels video), with copy on top behind a scrim — set via layout bg props `bgImage` / `bgVideo` + `bgPoster` / `bgOverlays`.

| Instead of... | Use... |
|---|---|
| Floating purple 3D sphere as hero focal | **Editorial photo or mesh backdrop** (`bgImage` + `bgOverlays="scrim-left"`, or `bgOverlays="mesh-lime-animated, dark-20"`) |
| Cliché stock (laptops, handshakes, offices) | **Curated Lummi/Unsplash photography** — also usable as accents for visual balance |
| Tiny unreadable UI screenshot | **Calm looping video** (`bgVideo` + `bgPoster`) or a large type-led statement |

3D renders are allowed only as optional decorative graphics, never focal media. Product mockups rebuilt from Shavin primitives (token inspectors, telemetry cards) are optional and rarely used — only when you are highly confident of the result.

---

## 5. Editorial Typography Tension

Awwwards-winning editorial sites create visual electricity by creating deliberate tension between **proportional display sans**, **technical monospace**, and **delicate serifs**:

### The Triad Pairing
1. **Primary Headline**: Clean, high-impact Sans (`font-extrabold tracking-tight text-fg`).
2. **Metadata & Status**: Precise Monospace (`font-mono text-xs uppercase tracking-widest text-fg-subtle`).
3. **Accent Proof / Quotes**: High-contrast, elegant typography (`italic font-normal text-fg-subtle text-lg`).

---

## 6. Cinematic Scroll Storytelling

For long-form feature launches or product tours:
- **Sticky Column Narrative**: Pin the visual preview (code editor or UI mock) on one side (`sticky top-24`) while the reader scrolls through 3–4 narrative milestones on the opposite column.
- **Milestone Illumination**: The active narrative step illuminates with `border-accent text-fg`, while past/future steps rest at `text-fg-subtle opacity-60`.
- **Zero Reflow**: Pinning and transitions must be GPU-only via `transform: translate3d` or CSS `position: sticky`.

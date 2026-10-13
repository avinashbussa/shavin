# Graphics, Assets, Backgrounds & Atmospheric Depth

> **Load priority:** MARKETING, EDITORIAL, and HYBRID modes.
> **Token cost:** ~2.5K tokens.
> **Companion to:** `layout-restraint.md` (anti-bloat) and `spacing-marketing.md` (visual weight).

This section defines the strict standards for atmospheric visual depth, asset curation, background textures, and image selection in @shavin interfaces.

---

## 1. Atmospheric Depth over Flatness (The Anti-Wireframe Law)

A common AI failure mode is **defensive minimalism**: mistaking strict design-system token discipline for sterile, flat white boxes, black text, and zero visual atmosphere.

> [!IMPORTANT]
> **Token purity does NOT mean flat wireframes.**
> You can—and MUST—create rich, layered atmospheric depth using token-compliant pastel mesh overlays, backdrop blurs, subtle glassmorphic panels, and directional scrims.

### The 4-Layer Atmospheric Depth Stack

```
┌─────────────────────────────────────────────────────────────┐
│ 4. Foreground Content                                       │  text-fg, text-fg-subtle, Button, Controls
├─────────────────────────────────────────────────────────────┤
│ 3. Frosted Surface Panels & Scrims                          │  bg-surface/75 backdrop-blur-md border border-hairline/70
├─────────────────────────────────────────────────────────────┤
│ 2. Decorative Atmospheric Asset / Pastel Mesh Texture       │  3D abstract render, soft pastel mesh, procedural contours
├─────────────────────────────────────────────────────────────┤
│ 1. Canvas Base                                              │  bg-canvas
└─────────────────────────────────────────────────────────────┘
```

1. **Canvas Base (`bg-canvas`)**: The foundational canvas plane.
2. **Atmospheric Mesh / Texture**: Purely decorative, subtle ambient textures or abstract 3D assets that give the viewport dimensionality without interfering with reading flow.
3. **Frosted Surface Panels & Scrims (`data-panel`)**: Translucent surface containers (`bg-surface/80 backdrop-blur-md border border-hairline/70 shadow-panel`) or directional gradient masks (`bg-gradient-to-t from-canvas via-canvas/80 to-transparent`) that protect text legibility.
4. **Foreground Content**: High-contrast typography and interactive controls.

---

## 2. The Ban on AI-Slop Ambient Accent Glows

One of the most recognizable "AI slop" hallmarks is dropping a garish, highly saturated glowing orb into a layout:

```tsx
// ❌ FORBIDDEN: AI-Slop Ambient Accent Glow Orb
<div className="absolute -top-24 -left-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
```

Why this is banned:
- It looks like an unconsidered prompt artifact from 2023-era generic web templates.
- It over-saturates the viewport and creates harsh color halos around typography.
- It clashes with Radix/Shavin semantic themes when switching between accent palettes.

### The Replacement: Soft Pastel Mesh Textures

Instead of single saturated accent orbs, use **diffuse pastel meshes** and multi-stop subtle gradients:

```tsx
// ✅ RECOMMENDED: Atmospheric Pastel Mesh Layer
<div 
  className="pointer-events-none absolute inset-0 overflow-hidden opacity-30 dark:opacity-15"
  aria-hidden="true"
  style={{
    background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.25), rgba(255, 255, 255, 0)), radial-gradient(ellipse 60% 40% at 80% 10%, rgba(56, 189, 248, 0.15), transparent)",
    maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
  }}
/>
```

**Pastel Mesh Rules:**
- **Palette**: Always prefer soft, desaturated pastel tones (lavender, soft sage, mist blue, pale slate, warm pearl) over high-chroma electric neons.
- **Opacity ceiling**: Max 30%–40% in light mode; max 15%–25% in dark mode.
- **Edge Dissolve**: Always dissolve the mesh into the canvas using `maskImage: linear-gradient(to bottom, black 0%, black 65%, transparent 100%)`.

---

## 3. Asset Selection: Aesthetic Abstraction over Literal Stock Photos

Another major AI slop trap is dumping **context-heavy literal stock photos** into blocks, templates, and heroes (e.g. photos of people typing on laptops in coffee shops, generic corporate boardrooms, or tiny screenshots packed with unreadable micro-copy).

> [!WARNING]
> **NEVER dump context-heavy literal stock photos into blocks or templates.**
> Literal stock photos look cheap, dated, break brand cohesion, and make the layout look cluttered.

### What to Use Instead: Premium Asset Categories

| Asset Category | Description | When to Use | Example Sources / Treatments |
|---|---|---|---|
| **1. Curated Editorial Photography** | Atmospheric, art-directed photos (landscape, architecture, texture, considered portraiture) — never cliché office stock. | Hero / main media with copy on top behind a scrim; also anywhere as accents for visual balance (not only people/testimonials). | Lummi (`assets.lummi.ai`), Unsplash, or user-supplied, via layout bg props `bgImage` + `bgOverlays` (e.g. `"scrim-left"`, `"dark-20"`). |
| **2. Mesh Gradients & Animated Backgrounds** | Fixed pastel meshes or theme-accent mesh, optionally drifting; or a calm looping video. | Hero / statement / closing CTA backdrops. | `bgOverlays="mesh-lime"` / `mesh-night` / `mesh-mint` / `mesh-peach` / `mesh-accent` (append `-animated`); Pexels video via `bgVideo` + `bgPoster`. |
| **3. Abstract Atmospheric Textures** | Soft procedural contours, blurred chromatic grain, delicate light-refracting prism glass, architectural minimalism. | Full-bleed section backdrops, card backgrounds, bento accent tiles. | Subtle generative gradient textures, architectural cast shadows, or minimalist macro glass photography. |
| **4. 3D Abstract Renders (optional, decorative only)** | Translucent glass ribbons, geometric pastel shapes, iridescent solids. | Optional decorative graphics only — **never** focal hero/feature media. | Lummi/Unsplash renders with neutral or transparent backgrounds. |

> Product mockups / UI screenshots rebuilt from Shavin primitives are **not** default imagery. Use them only when you are highly confident of the result (rare); never tiny raster screenshots.

---

## 4. Directional Scrims & Contrast Protection

When placing text or controls over any photo, mesh, video, or texture, text readability must never depend on the image staying dark or light:

```tsx
// ✅ Directional Scrim protecting text readability
<div className="relative overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-surface">
  {/* Background Texture / Abstract Render */}
  <img 
    src="https://images.unsplash.com/photo-..." 
    alt="Atmospheric editorial photograph" 
    className="absolute inset-0 h-full w-full object-cover opacity-60"
  />
  
  {/* Protective Directional Scrim */}
  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent" />
  
  {/* Content Area */}
  <div className="relative z-10 p-8 md:p-12">
    <h3 className="text-2xl font-semibold text-fg">Atmospheric Clarity</h3>
    <p className="mt-2 text-sm text-fg-subtle">Text remains 100% accessible against any background texture.</p>
  </div>
</div>
```

**Scrim Checklist:**
- [ ] Uses semantic token (`from-surface`, `via-surface/80`, `from-canvas`), NEVER hardcoded `#000` or `#fff`.
- [ ] Title text maintains AAA contrast (`text-fg`).
- [ ] Subtitle text uses `text-fg-subtle` — **except on media**: over photos/mesh/video use `text-fg-muted` for subtitles/overlines, with `surface="dark-always"` (or `light-always`) on the media container.
- [ ] Prefer layout bg props (`bgImage` / `bgVideo` + `bgPoster` / `bgOverlays`) over hand-rolled layers: e.g. `bgOverlays="scrim-left, dark-20"`, `"mesh-lime-animated, dark-20"`, `"fade-canvas"`. Mesh presets: `mesh-lime`, `mesh-night`, `mesh-mint`, `mesh-peach`, `mesh-accent` (+`-animated`). See `layout-compositions/references/adapters/shavin-ui.md` §4b.

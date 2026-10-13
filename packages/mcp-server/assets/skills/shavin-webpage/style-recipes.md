# Style Recipes & Design Calibration Dials

> Synthesizing **Garden Skills' Design Dials & Style Archetypes** mapped strictly to `@shavin/ui` semantic tokens and two-tier architecture.

---

## 1. The 5 Design Calibration Dials

Before composing or reviewing any webpage or block, define the project's **Calibration Vector** [1–10]:

```yaml
Design Calibration:
  visual-variance: 6      # [1: strict repetition -> 10: every section introduces novel layout geometry]
  motion-intensity: 5     # [1: instant transitions -> 10: cinematic scroll-linked physics & page reveals]
  information-density: 7  # [1: expansive consumer white space -> 10: high-density dev tooling & telemetry]
  asset-dependence: 8     # [1: pure CSS/SVG geometry -> 10: rich photography, mesh & video backdrops]
  brand-fidelity: 10      # [10: 100% token purity, zero raw hex, zero untokened geometry]
```

### How the Dials Steer Decisions:
- **High Visual Variance (>7)**: Break predictable 3-column grids. Alternate asymmetric bento cards, full-width interactive code terminals, and split sticky narratives.
- **High Information Density (>7)**: Use tighter padding (`p-4` to `p-6`), monospaced telemetry pills, inline status badges, and compact data tables.
- **High Motion Intensity (>7)**: Implement word-by-word tagline reveal, fluid island navigation, and staggered viewport entrances (`motion-and-physics.md`).

---

## 2. Five Flagship Style Archetypes

Every interface should declare its anchor archetype to maintain unified stylistic discipline:

---

### Archetype 1: Linear Dark (High-Performance Engineering)
- **Visual Feel**: Deep charcoal surfaces, razor-sharp hairline borders, luminous accent glows, keyboard-first aesthetic.
- **Token Configuration**:
  - Theme: `.dark`
  - Canvas: `bg-canvas` (`--n-950` / `#09090b`)
  - Surface: `bg-surface` (`--n-900` / `#121215`)
  - Accent: `grass` or `cyan`
  - Radius: `large` (`--radius-lg: 8px`, `--radius-panel: 12px`)
- **Key Layout Patterns**:
  - Monospaced keyboard shortcut badges (`<Kbd>⌘K</Kbd>`).
  - Asymmetric bento grid with thin hairline borders (`border-hairline/60`).
  - Micro-telemetry chips (`<3.2ms`, `100.0% Purity`).
  - Subtle top-down directional spotlight gradient.

---

### Archetype 2: Apple Clean Minimal (Human-Centric Consumer)
- **Visual Feel**: Expansive whitespace, ultra-large display typography, crisp organic shadows, zero clutter.
- **Token Configuration**:
  - Theme: `:root` (light) or `.dark`
  - Canvas: `bg-canvas` (`#ffffff` light / `#000000` dark)
  - Surface: `bg-surface` (`#f5f5f7` light / `#1c1c1e` dark)
  - Accent: `sky` or `neutral`
  - Radius: `full` or `large`
- **Key Layout Patterns**:
  - Centered headlines with extreme measure discipline (`max-w-3xl mx-auto`).
  - Soft, large cards with generous internal padding (`p-8 md:p-12`).
  - High-resolution hero photograph (Lummi/Unsplash) or soft mesh backdrop with deep breathing room.
  - Generous vertical section rhythm (`py-28 md:py-44`) — scoped archetype override of the canonical Section table.

---

### Archetype 3: Stripe Precision (Enterprise Vibrant)
- **Visual Feel**: Chromatic warmth, multi-layer gradient mesh ribbons, isometric feature cards, high trust proof.
- **Token Configuration**:
  - Theme: `:root` (light)
  - Canvas: `bg-canvas` (`#ffffff`)
  - Accent: `iris` or `indigo`
  - Radius: `medium` (`--radius-panel: 16px`)
- **Key Layout Patterns**:
  - Multi-stop chromatic mesh backdrops with soft directional scrims.
  - Interactive multi-tab code showcase with live API response panels.
  - Dense trust matrix: verified enterprise customer logos, uptime SLA counters, compliance certifications (SOC2, ISO, WCAG AAA).

---

### Archetype 4: Technical Editorial / Brutalist (Developer Infrastructure)
- **Visual Feel**: CAD blueprint precision, hairline coordinate grids, monospaced metadata, raw architecture diagrams.
- **Token Configuration**:
  - Theme: Both Light and Dark
  - Canvas: `bg-canvas`
  - Surface: `bg-surface`
  - Accent: `amber` or `bronze`
  - Radius: `small` or `none` (`rounded-none` or `rounded-sm`)
- **Key Layout Patterns**:
  - Corner crosshairs (`+`) on card boundaries.
  - Strict typographic hierarchy: Serif or heavy display sans headlines paired with monospaced code blocks.
  - Raw JSON/YAML config snippets in bordered syntax panels.
  - Border dividers (`divide-x divide-hairline`) spanning across full container widths.

---

### Archetype 5: Vercel Monochrome (Speed & Latency Obsession)
- **Visual Feel**: Pure binary black/white contrast, geometric grid lines, zero gradient fluff, razor-sharp focus on deploy speed.
- **Token Configuration**:
  - Theme: Both Light and Dark
  - Canvas: `bg-canvas` (`#000000` dark / `#ffffff` light)
  - Surface: `bg-surface` (`#111111` dark / `#fafafa` light)
  - Accent: `neutral` (black/white high contrast)
  - Radius: `medium` (`--radius-panel: 12px`, `--radius-lg: 6px`)
- **Key Layout Patterns**:
  - Geometric isometric deployment pipelines.
  - Tabular monospace numbers with zero letter-spacing drift (`tabular-nums font-mono`).
  - Razor-thin 1px border cards with crisp hover lighting.
  - Instant tactile button response (`active:scale-[0.98] duration-100`).

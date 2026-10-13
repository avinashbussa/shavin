# Font Pairings by Mode

> **Load priority:** Loaded when making font decisions. Use `get_skill_mode` to determine which mode's pairings to load.
> **Token cost:** ~4K tokens.
> **Mode-specific:** Each mode has different emotional register — fonts must match it.

---

## How @shavin/ui Loads Fonts

Use the Shavin font loader — never hardcode `@import` or raw `<link>` tags in components:

```ts
import { applyDisplayFontPreset, applyBodyFontPreset, loadGoogleFont } from "@shavin/ui/lib/theme-presets";

// Apply a curated pairing for the active mode:
applyDisplayFontPreset("Fraunces"); // sets --font-display
applyBodyFontPreset("Inter"); // sets --font-body
```

In Next.js apps, load via `next/font/google` in `layout.tsx` and set CSS vars:

```ts
// layout.tsx
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
```

---

## Pairing Vocabulary

Every pairing has two roles:

| Role        | CSS var          | Controls                                   |
| ----------- | ---------------- | ------------------------------------------ |
| **Display** | `--font-display` | Hero headings, section titles, pull-quotes |
| **Body**    | `--font-body`    | Body copy, UI labels, captions, form text  |
| **Subheading** | `--font-subheading` | h3-h6 headings (card, step and list titles). Defaults to the body font |

`<Heading>` picks the role from its tag: h1/h2 and display sizes use display, h3-h6 use subheading. Do not add `font-display` or `font-sans` to an h3-h6 by hand. To change it for a whole theme, set `<ThemeProvider subheadingFont="display">` (or a font name). Display faces lose strength at small sizes, which is why subheadings follow the body font by default.

Rules:

- Display font supplies **personality and emotional register**. It is the voice.
- Body font supplies **legibility and neutrality**. It is the words.
- They must contrast each other — two geometric sans-serifs paired together is noise, not pairing.
- Body font must be a workhorse: highly legible at 14px–16px, tested on retina and non-retina, comfortable in long paragraphs.

---

## MARKETING Mode — Curated Pairings

> Register: Professional, modern, credible. Functional beauty. Like Vercel, Stripe, Linear's website.

| Pairing Name              | Display                             | Body      | Personality                                              | Best for                                    |
| ------------------------- | ----------------------------------- | --------- | -------------------------------------------------------- | ------------------------------------------- |
| **Canonical** _(default)_ | `Fraunces` (serif)                  | `Inter`   | Warm authority — the serif adds craft to a modern system | SaaS homepages, design tools, product sites |
| **Geometric Power**       | `Space Grotesk` (geometric sans)    | `Inter`   | Bold, technical, forward-looking                         | Dev tools, infra products, APIs             |
| **Editorial Clean**       | `Outfit` (variable geometric)       | `DM Sans` | Friendly precision — rounded geometry, approachable      | Consumer SaaS, productivity, onboarding     |
| **Classic Trust**         | `Playfair Display` (didone serif)   | `Inter`   | Legacy credibility — financial, legal, established       | Finance, enterprise, professional services  |
| **Minimal Modern**        | `Inter` (as display at bold weight) | `Inter`   | Ultra-clean, system-native feel                          | Documentation portals, technical references |

```ts
// Canonical MARKETING pairing (Fraunces + Inter)
applyDisplayFontPreset("Fraunces");
applyBodyFontPreset("Inter");

// Usage in JSX:
<Heading as="h1" size="3xl" className="font-display font-bold tracking-tight">
  Build with intention.
</Heading>
<Text size="md" className="font-body text-fg-muted">
  Supporting description in Inter — legible, neutral, workmanlike.
</Text>
```

---

## STRUCTURAL Mode — Curated Pairings

> Register: Dense, efficient, productivity-first. Like Linear app, Figma, Notion, Raycast. Type serves data, never decorates it.

| Pairing Name                         | Display                 | Body      | Personality                                    | Best for                                 |
| ------------------------------------ | ----------------------- | --------- | ---------------------------------------------- | ---------------------------------------- |
| **Productivity Default** _(default)_ | `Inter`                 | `Inter`   | Invisible system — zero personality by design  | Dashboards, admin consoles, data grids   |
| **Technical Precision**              | `JetBrains Mono` (mono) | `Inter`   | Code-adjacent — signals developer tools        | IDE UIs, log viewers, terminal emulators |
| **Sharp Efficiency**                 | `Geist`                 | `Geist`   | Vercel's system — ultra-clean, strong numerals | Internal tools, metrics dashboards       |
| **Warm Productivity**                | `Outfit`                | `DM Sans` | Slightly softer — less cold than Inter         | B2C apps, consumer productivity          |

```ts
// Productivity Default (Inter + Inter)
applyDisplayFontPreset("Inter");
applyBodyFontPreset("Inter");

// For structural mode: display and body are the SAME FONT
// Differentiation comes from size + weight only, not font family.
// This is intentional — family contrast belongs to marketing, not apps.
```

**Key rule for STRUCTURAL:** Never use a serif or expressive display font in an app UI. It destroys scan speed. A Fraunces heading inside a dashboard sidebar looks broken, not premium.

---

## EDITORIAL Mode — Curated Pairings

> Register: Expressive, art-directed, cinematic. Type is visual material, not just labels. Like apple.com, awwwards SOTD sites, luxury brand experiences.

| Pairing Name                   | Display                                   | Body                | Personality                                                | Best for                                        |
| ------------------------------ | ----------------------------------------- | ------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| **High Editorial** _(default)_ | `Fraunces` (variable optical, italic)     | `Inter`             | The contrast of old-world letterpress vs modern clean grid | Agency portfolios, brand launches, luxury       |
| **Contrast Serif**             | `Playfair Display` (high-contrast didone) | `DM Mono`           | Dramatic hairlines + monospace body — cinematic tension    | Fashion, luxury goods, editorial photography    |
| **New Wave**                   | `Cabinet Grotesk`                         | `Lora` (serif body) | Unexpectedly bold grotesque display + serif reading        | Creative studios, modern magazines              |
| **Typographic Void**           | `Bebas Neue` (condensed all-caps)         | `Inter` (light)     | Maximum scale contrast — headline as image                 | Music, entertainment, sport, high-energy brands |
| **Organic Luxury**             | `Cormorant Garamond` (thin elegant serif) | `DM Sans`           | Delicate, aristocratic, fashion-forward                    | Perfume, jewellery, haute couture, hotels       |
| **Brutalist**                  | `Space Mono` (typewriter mono)            | `Space Mono`        | Anti-design design — intentionally raw                     | Art, experimental, tech-art, indie labels       |

```ts
// High Editorial pairing — Fraunces italic + Inter
applyDisplayFontPreset("Fraunces");
applyBodyFontPreset("Inter");

// In editorial mode, the display font plays at EXTREME scale
// clamp() produces the fluid sizing that makes it feel alive
```

```jsx
// Editorial display heading — type as visual material
<h1
  className="font-display italic font-black leading-none tracking-tighter"
  style={{ fontSize: "clamp(4rem, 12vw, 12rem)" }}
>
  Craft,<br />not code.
</h1>

// Body remains Inter for legibility contrast
<p className="font-body text-fg-muted text-lg leading-relaxed max-w-prose">
  Supporting text — the neutral counterweight to the expressive display.
</p>
```

**Editorial contrast ratios for type pairings:**

```
Display size : Body size = 6:1 minimum in editorial mode (vs 2:1 in marketing)
Display weight: bold/black (700–900) vs body weight: regular (400)
Display style: italic OR condensed OR all-caps (one axis of expression, not all three)
```

---

## HYBRID Mode — Pairing Strategy

> Marketing hero → MARKETING pairing. App/interactive section → STRUCTURAL pairing.
> The transition between sections is the only place where font family changes are acceptable within a single page.

```
Hero section:    Fraunces (display) + Inter (body)  ← marketing pairing
Product UI demo: Inter (display) + Inter (body)     ← structural pairing
Footer/CTA:      Return to marketing pairing
```

Never switch font families mid-section. The boundary must be a deliberate section transition.

---

## Quick Decision Tree

```
User said "fancy" / "expressive" / "awwwards" / "editorial"?
  → EDITORIAL mode → pick from editorial pairings based on brand energy:
      Luxury/fashion?     → Cormorant + DM Sans
      Agency/portfolio?   → Fraunces italic + Inter  (default)
      Cinematic/dramatic? → Playfair Display + DM Mono
      Brutalist/raw?      → Space Mono + Space Mono

User said "landing page" / "marketing site" / "SaaS homepage"?
  → MARKETING mode → almost always Fraunces + Inter (canonical)
      Finance/enterprise? → Playfair + Inter
      Dev tools/APIs?     → Space Grotesk + Inter
      Minimal docs?       → Inter + Inter

User said "dashboard" / "app" / "admin" / "tool"?
  → STRUCTURAL mode → Inter + Inter (never deviate unless explicitly requested)
```

---

## Anti-Patterns

```
✗ Serif display font inside a dashboard sidebar nav
✗ Two serif fonts paired together (no neutrality; both compete)
✗ Two geometric sans-serifs paired together (no contrast; both blend)
✗ All-caps condensed body text (destroys readability at body size)
✗ Variable font with no axis control (WGHT/ITAL not specified = browser default = ugly)
✗ Loading more than 2 font families on a single page (HTTP cost + style noise)
✗ Using font-family in raw className strings — always via --font-display / --font-body vars
```

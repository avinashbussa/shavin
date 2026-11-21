# Font Pairings by Mode

> **Load priority:** Loaded when making font decisions. Use `get_skill_mode` to determine which mode's pairings to load.
> **Token cost:** ~2.8K tokens.
> **Mode-specific:** Each mode has different emotional register — fonts must match it.

---

## Defaults

- The default pairing is `Rethink Sans` (display) + `Inter` (body), set by the default theme. It is the built-in fallback, not a design decision. For a new site or page, choose the theme from the brief as described under "Theme for a new site or page" below.
- Do not use `Space Grotesk` as the display font unless asked: it is the most common AI default.

---

## Theme for a new site or page

If `SHAVIN.md` still says `UNSET` for Primary Brand or Display / Body Font (or `.shavin/config.json` has `brandConfirmed: false`) and the user did not name colours or fonts, choose them from the brief before building:

1. A brand colour: a preset name or a hex that fits the audience and mood. Do not default to `monochrome`.
2. A display and body font pair from the pairings below, matched to the mode.
3. A mode that fits the content: light for editorial and content-led pages, dark only where the product suits it.
4. One sentence of reasoning (audience, mood).

Apply them with `npx @shavin/cli brand --color <preset|#hex> --display-font <name> --body-font <name> --mode <dark-first|light-first|system>`. Without a shell, set the same values on `ThemeProvider` (`brandColor`, `displayFont`, `bodyFont`, `defaultTheme`) and in the `SHAVIN.md` and `.shavin/config.json` lines by hand.

After the first page, tell the user in two sentences what you chose and why, and offer two alternatives. If they accept or do not answer, run `npx @shavin/cli brand --confirm`. If they pick another, run `brand` with the new values and `--confirm`. Ask once, never again once confirmed.

---

## How @shavin/ui Loads Fonts

Use the Shavin font loader — never hardcode `@import` or raw `<link>` tags in components:

```ts
import { applyDisplayFontPreset, applyBodyFontPreset, loadGoogleFont } from "@shavin/ui/lib/theme-presets";

// Apply a curated pairing for the active mode:
applyDisplayFontPreset("Fraunces"); // sets --font-display
applyBodyFontPreset("Inter"); // sets --font-body
```

Set fonts on the provider first; it loads them:

```tsx
<ThemeProvider displayFont="Fraunces" bodyFont="Inter">{children}</ThemeProvider>
```

Fonts in the `ThemeProvider` presets load with that one prop. Any other Google font loads with `loadGoogleFont("Name")`; a font that is not on Google Fonts cannot be loaded this way. `next/font/google` in `layout.tsx` is the fallback only (see `core-rules.md` §5).

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
| **Shavin default** _(default)_ | `Rethink Sans` (humanist grotesque) | `Inter` | Neutral, modern, credible | Most SaaS, product and marketing sites |
| **Warm Authority**        | `Fraunces` (serif)                  | `Inter`   | Warm authority — the serif adds craft to a modern system | SaaS homepages, design tools, product sites |
| **Geometric Power**       | `Host Grotesk` (grotesque sans)     | `Inter`   | Bold, technical, forward-looking                         | Dev tools, infra products, APIs             |
| **Editorial Clean**       | `Outfit` (variable geometric)       | `DM Sans` | Friendly precision — rounded geometry, approachable      | Consumer SaaS, productivity, onboarding     |
| **Classic Trust**         | `Playfair Display` (didone serif)   | `Inter`   | Legacy credibility — financial, legal, established       | Finance, enterprise, professional services  |
| **Minimal Modern**        | `Inter` (as display at bold weight) | `Inter`   | Ultra-clean, system-native feel                          | Documentation portals, technical references |

```ts
// Warm Authority (Fraunces + Inter): a serif-led brand
applyDisplayFontPreset("Fraunces");
applyBodyFontPreset("Inter");

// Usage in JSX:
<Heading as="h1" size="3xl" weight="bold">
  Build with intention.
</Heading>
<Text size="md" color="subtle">
  Supporting description in Inter — legible, neutral, workmanlike.
</Text>
```

---

## STRUCTURAL Mode — Curated Pairings

> Register: Dense, efficient, productivity-first. Like Linear app, Figma, Notion, Raycast. Type serves data, never decorates it.

| Pairing Name                         | Display                 | Body      | Personality                                    | Best for                                 |
| ------------------------------------ | ----------------------- | --------- | ---------------------------------------------- | ---------------------------------------- |
| **Shavin default** _(default)_       | `Rethink Sans`          | `Inter`   | Neutral headings over a workhorse body         | Dashboards, admin consoles, data grids   |
| **Invisible System**                 | `Inter`                 | `Inter`   | Zero personality by design                     | Maximum-density data grids               |
| **Technical Precision**              | `JetBrains Mono` (mono) | `Inter`   | Code-adjacent — signals developer tools        | IDE UIs, log viewers, terminal emulators |
| **Sharp Efficiency**                 | `Geist`                 | `Geist`   | Vercel's system — ultra-clean, strong numerals | Internal tools, metrics dashboards       |
| **Warm Productivity**                | `Outfit`                | `DM Sans` | Slightly softer — less cold than Inter         | B2C apps, consumer productivity          |

```ts
// Invisible System (Inter + Inter), for maximum density only
applyDisplayFontPreset("Inter");
applyBodyFontPreset("Inter");

// Keep display and body the same font only for maximum density.
// Otherwise the theme default (Rethink Sans + Inter) applies: contrast comes from size and weight.
```

**Key rule for STRUCTURAL:** Never use a serif or expressive display font in an app UI. It destroys scan speed. A Fraunces heading inside a dashboard sidebar looks broken, not premium.

---

## EDITORIAL Mode — Curated Pairings

> Register: Expressive, art-directed, cinematic. Type is visual material, not just labels. Like apple.com, awwwards SOTD sites, luxury brand experiences.

| Pairing Name                   | Display                                   | Body                | Personality                                                | Best for                                        |
| ------------------------------ | ----------------------------------------- | ------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| **High Editorial** _(default)_ | `Fraunces` (variable optical, italic)     | `Inter`             | The contrast of old-world letterpress vs modern clean grid | Agency portfolios, brand launches, luxury       |
| **Contrast Serif**             | `Playfair Display` (high-contrast didone) | `DM Mono`           | Dramatic hairlines + monospace body — cinematic tension    | Fashion, luxury goods, editorial photography    |
| **New Wave**                   | `Funnel Display`                          | `Lora` (serif body) | Unexpectedly bold grotesque display + serif reading        | Creative studios, modern magazines              |
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
<Heading
  as="h1"
  className="italic font-black leading-none tracking-tighter"
  style={{ fontSize: "clamp(4rem, 12vw, 12rem)" }}
>
  Craft,<br />not code.
</Heading>

// Body remains Inter for legibility contrast
<Text size="lg" color="subtle" className="leading-relaxed max-w-prose">
  Supporting text — the neutral counterweight to the expressive display.
</Text>
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
Hero section:    marketing pairing (default Rethink Sans + Inter; Fraunces + Inter for a serif brand)
Product UI demo: structural pairing (default Rethink Sans + Inter)
Footer/CTA:      Return to the marketing pairing
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
  → MARKETING mode → Rethink Sans + Inter (the theme default); Fraunces + Inter for serif-led brands
      Finance/enterprise? → Playfair + Inter
      Dev tools/APIs?     → Host Grotesk + Inter
      Minimal docs?       → Inter + Inter

User said "dashboard" / "app" / "admin" / "tool"?
  → STRUCTURAL mode → the theme default (Rethink Sans + Inter); Inter + Inter only for maximum density
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
✗ Space Grotesk as the default display font (the most common AI default); use it only when asked
✗ Using font-family in raw className strings — always via --font-display / --font-body vars
```

# Hero compositions (H1–H5)

The hero is the first thing anyone sees, so it should open with the most characteristic thing in the subject's world (a product, a piece of work, a voice), not a default. Choose by the assets you really have: product UI, photography, mesh, or video backdrop → H1/H2; strong photography or video → H3/H4; only words → H5. Photography (Lummi/Unsplash/user), mesh gradients, and video backdrops behind a scrim (`bgImage` / `bgVideo` + `bgPoster` / `bgOverlays`) are first-class hero media; 3D renders are decoration only.

Contents: H1 Centered Statement · H2 Split · H3 Asymmetric 7/5 · H4 Full-Bleed Media · H5 Type-Led Statement

---

### H1 · Centered Statement Hero
```yaml
id: H1
name: Centered Statement Hero
family: hero
job: attention
density: low
styles: [marketing, hybrid]
treatments: [carded, flat, open, full-bleed]
media: [photo, mesh, video, product-ui, illustration, none]
items: n/a
slots: [overline, headline, sub, cta-primary, cta-secondary, media]
motion: tier1
```
**Best for:** Launches and single-promise pages: one idea, one action, with an authentic artifact below or a photo/mesh/video backdrop behind.
**Avoid when:** The sub-headline runs past two lines (centred prose reads badly): use H2. You would fake a product visual: use a photo/mesh backdrop or H5.
**Grid:** `base` and `lg`: one centred stack. Text measure 45–58ch. Media sits below at container width (≤ ~1100px), fixed aspect ratio.
```
┌───────────────────────────────────────────────┐
│                   [Overline]                  │
│                  Big headline                 │
│        Sub-headline at reading measure        │
│          [Primary CTA]   [Ghost link]         │
├───────────────────────────────────────────────┤
│                                               │
│                Preview artifact               │
│     (product UI / screenshot / short loop)    │
│                                               │
└───────────────────────────────────────────────┘
```
**Contract:** Headline ≤ 12 words. Sub ≤ 30 words. ≤ 2 CTAs (primary + secondary). Media is curated photography, a mesh gradient, a video backdrop (behind a scrim via `bgImage` / `bgVideo` + `bgPoster` / `bgOverlays`), or a real product artifact with explicit `width`/`height`. Overline only if it carries information (category, version).
**Watch:** The media is usually the LCP element: load it eagerly with high fetch priority. On phones the primary CTA must stay above the fold, so cap media height or push it below. No autoplay video with sound. Use `text-wrap: balance` on the headline so localized strings wrap evenly.

### H2 · Split Hero
```yaml
id: H2
name: Split Hero
family: hero
job: understanding
density: medium
styles: [marketing, hybrid, documentation]
treatments: [carded, flat, open]
media: [photo, mesh, product-ui, code]
items: n/a
slots: [overline, headline, sub, cta-primary, cta-secondary, media]
motion: tier1
```
**Best for:** SaaS and developer tools where copy needs room and the visual supports the claim (editorial photo, mesh panel, live snippet, or UI artifact).
**Avoid when:** Copy is under a sentence and there is no artifact: use H5. The media is decoration only.
**Grid:** `base`: 1 column, text then media. `lg`: 2 columns, 1:1 (use 5:7 when media is wide UI or code), `gap-12`, vertically centred.
```
┌───────────────────────┬───────────────────────┐
│ [Overline]            │                       │
│ Headline              │     Visual mockup     │
│ Description           │    or code snippet    │
│ [CTA]  [CTA]          │                       │
└───────────────────────┴───────────────────────┘
```
**Contract:** Headline ≤ 10 words. Sub ≤ 35 words. Media (photo, mesh panel, product artifact, or code) has a fixed aspect ratio (4:3 or 16:10). Any live playground has a static screenshot fallback.
**Watch:** Test at 1366×768: media beyond the fold weakens the hero. Code samples ≤ 12 lines and must not force horizontal scroll on mobile. "Interactive" media must be keyboard operable. On mobile, media must not push the CTA off screen.

### H3 · Asymmetric Hero (7/5)
```yaml
id: H3
name: Asymmetric Hero
family: hero
job: desire
density: medium
styles: [editorial, expressive, marketing]
treatments: [flat, open, full-bleed]
media: [photo, illustration]
items: n/a
slots: [headline, sub, cta, visual]
motion: choreography-ok
```
**Best for:** Editorial brands, portfolios and premium showcases with one strong portrait or object image.
**Avoid when:** No strong visual asset exists (the 5-column side would be empty): use H5.
**Grid:** `base`: stack (heading first; visual first only if imagery-led). `lg`: 12-col, text `col-span-7`, visual `col-span-5`. Visual may overlap the next section with a negative bottom margin (−4rem to −6rem).
```
┌──────────────────────────┬────────────────────┐
│ Massive display heading  │      Floating      │
│ Description              │       visual       │
│ [CTA row]                │   (bleeds down)    │
└──────────────────────────┴────────────────────┘
```
**Contract:** Display heading ≤ 8 words. Visual is portrait (3:4 or 4:5) with meaningful `alt`. Heading size uses `clamp()` with a floor of ~2.5rem.
**Watch:** An overlap needs the next section to reserve matching top padding, and should be dropped on mobile. Keep the visual from covering the CTA. Check that display type doesn't overflow at 320px.

### H4 · Full-Bleed Media Hero
```yaml
id: H4
name: Full-Bleed Media Hero
family: hero
job: attention
density: low
styles: [marketing, expressive]
treatments: [full-bleed]
media: [video, photo, illustration]
items: n/a
slots: [background, scrim, overline, headline, sub, cta, scroll-cue]
motion: choreography-ok
```
**Best for:** Cinematic brand pages and immersive product reveals where mood carries the message.
**Avoid when:** The value proposition is text-heavy, audiences are on slow connections, or you have no scrim strategy for text legibility.
**Grid:** Section `min-height: 85svh`. Layers: media/gradient → scrim → content (centred or bottom-left) → scroll cue at bottom.
```
┌───────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░ [Overline] ░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░░░░ Big headline ░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░░░░ Sub-headline ░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░░░░ [CTA] ░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░░░░░░░░░░░░ ↓ ░░░░░░░░░░░░░░░░░░░░ │
└───────────────────────────────────────────────┘
```
**Contract:** Text over media passes 4.5:1 via scrim or gradient, tested at the brightest frame. Video has a poster image, is muted, looped, `playsinline`, and light (target ≲ 2–3 MB).
**Watch:** Heavy blur or mesh filters are expensive to paint on phones: pre-render to an image. Under `prefers-reduced-motion`, show the poster only. Video longer than 5 seconds needs a pause control (WCAG 2.2.2). The scroll cue is decorative (`aria-hidden`) and never the only way forward.

### H5 · Type-Led Statement Hero
```yaml
id: H5
name: Type-Led Statement Hero
family: hero
job: attention
density: low
styles: [editorial, expressive, marketing]
treatments: [flat, open, full-bleed]
media: [none]
items: n/a
slots: [headline, sub, cta]
motion: choreography-ok
```
**Best for:** Brands whose voice is the asset: manifestos, campaigns, studios, publications with no product visual.
**Avoid when:** The product must be seen to be understood.
**Grid:** Single left-aligned column (or a deliberate offset). Headline uses fluid type, e.g. `clamp(3rem, 9vw, 9rem)`. Sub-headline sits in a narrow column (45–58ch), often offset right or below.
```
┌───────────────────────────────────────────────┐
│ BIG STATEMENT SET                             │
│ IN FLUID TYPE ACROSS                          │
│ THREE OR FOUR LINES                           │
│                                               │
│               │ Sub-headline, narrow column   │
│               │ [Single CTA]                  │
└───────────────┴───────────────────────────────┘
```
**Contract:** Real text (an `<h1>`), 3–12 words, with deliberate line breaks. One CTA.
**Watch:** Never render the headline as an image. Handle long words with `overflow-wrap`/`hyphens`. Cap height at 100svh so type doesn't push the CTA away. Check contrast on coloured grounds.

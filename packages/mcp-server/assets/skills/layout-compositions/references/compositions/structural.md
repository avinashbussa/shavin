# Structural compositions (ST1–ST6)

These frame the page rather than carry a message: navigation, footers, and the shells that hold everything else. Every page needs ST5; most need ST1 and ST3 or ST4.

Contents: ST1 Navigation Bar · ST2 Announcement Bar · ST3 Sitemap Footer · ST4 Statement Footer · ST5 Page Shell · ST6 App Shell

---

### ST1 · Navigation Bar
```yaml
id: ST1
name: Navigation Bar
family: structural
job: orientation
density: low
styles: [structural, marketing, editorial, documentation, expressive]
treatments: [carded, ruled, flat, open]
media: [none, logos]
items: 4-7 links
slots: [brand, links, actions, menu-toggle]
motion: tier1
```
**Best for:** Any multi-page site. It is the persistent way to orient and to convert.
**Avoid when:** A single-screen campaign page where nav competes with the one CTA. Use brand + one action instead.
**Grid:** `base`: brand left, menu toggle right (opens a dialog/sheet). `lg`: brand · links · actions in one row, height 56–64px. Links sit centre or left-aligned next to the brand; actions always right.
```
┌─────────┬──────────────────────┬──────────────┐
│ Brand   │ Product Pricing Docs │[Get started] │
└─────────┴──────────────────────┴──────────────┘
```
**Contract:** ≤ 7 top-level links. One primary action (a button) and at most one secondary (a text link). Brand links home. Current page carries `aria-current="page"`.
**Watch:** A sticky bar needs `scroll-margin-top`/`scroll-padding-top` equal to its height or anchor targets hide under it. The mobile menu is a dialog: trap focus, close on Esc, restore focus to the toggle. Never put the only primary CTA inside the drawer. Backdrop blur needs an opaque fallback for contrast. A transparent-over-hero bar needs a scrim so links pass 4.5:1 on the media.

### ST2 · Announcement Bar
```yaml
id: ST2
name: Announcement Bar
family: structural
job: attention
density: low
styles: [structural, marketing]
treatments: [flat, ruled]
media: [none]
items: 1 message
slots: [message, link, dismiss]
motion: tier0
```
**Best for:** Time-bound news: a launch, an event, an incident, a policy change.
**Avoid when:** The message is permanent marketing copy. Permanent strips become invisible and eat vertical space; put it in a hero or CTA instead.
**Grid:** Full-width strip above ST1, 36–44px tall. Message centred with an inline link; dismiss button pinned right. On mobile the message may wrap to two lines, never more.
```
┌────┬────────────────────────────────────┬─────┐
│    │     Message with inline link →     │  ✕  │
└────┴────────────────────────────────────┴─────┘
```
**Contract:** One sentence ≤ 90 characters and one link. Dismissible, with the dismissed state remembered per viewer (reserve its space on the server render so dismissal on load doesn't shift the page).
**Watch:** Use `role="region"` with a label, not `role="alert"`, unless it is genuinely urgent. Dismissing must not lose keyboard focus. Check contrast on tinted backgrounds.

### ST3 · Sitemap Footer
```yaml
id: ST3
name: Sitemap Footer
family: structural
job: orientation
density: high
styles: [structural, marketing, documentation, hybrid]
treatments: [carded, ruled, flat]
media: [none]
items: 3-5 link groups
slots: [brand, link-groups, legal, controls]
motion: tier0
```
**Best for:** Products and content sites where the footer is a second navigation (find-it-anywhere).
**Avoid when:** Brand-led or portfolio sites with few links. Use ST4.
**Grid:** `base`: brand block, then groups in 2 columns. `md`: 3–4 columns. `lg`: 12-col grid, brand `col-span-4`, groups share the other 8. A bottom bar carries legal links, social links and any locale/theme controls.
```
┌──────────────┬─────────┬─────────┬────────────┐
│ Brand + blurb│ Product │ Company │ Resources  │
├──────────────┴────────┬┴─────────┴────────────┤
│ © 2026 Company        │Social · Locale · Theme│
└───────────────────────┴───────────────────────┘
```
**Contract:** Each group has a real heading (or the whole footer nav is labelled). ≤ 6 links per group. Legal row: copyright, privacy, terms.
**Watch:** Label footer `<nav>` differently from the primary nav (`aria-label`). Give link rows ≥ 44px tap height on touch. Don't duplicate the whole top nav. Include a locale or theme control only if it works.

### ST4 · Statement Footer
```yaml
id: ST4
name: Statement Footer
family: structural
job: desire
density: low
styles: [structural, editorial, expressive, marketing]
treatments: [flat, open, full-bleed]
media: [none]
items: ≤ 8 links
slots: [links, wordmark, legal]
motion: tier1
```
**Best for:** Brand-led, editorial and portfolio sites where the close should feel like a signature.
**Avoid when:** Link-heavy products; this buries the links. Use ST3.
**Grid:** `base`: link list, then wordmark scaled to the container width. `lg`: a single link row above a full-width oversized wordmark, legal beneath.
```
┌───────────┬───────────┬───────────┬───────────┐
│    Work   │   About   │  Journal  │  Contact  │
├───────────┴───────────┴───────────┴───────────┤
│       BRAND WORDMARK (fluid, full width)      │
│                                               │
│ © 2026                │     Back to top ↑     │
└───────────────────────┴───────────────────────┘
```
**Contract:** Wordmark ≤ 12 characters (else scale it down). ≤ 8 links. Legal text stays legible: don't shrink it with the wordmark.
**Watch:** Fit the wordmark with CSS (`clamp()` or container-query units), not JS resize handlers. Test 320px for overflow. If the wordmark duplicates the brand name, mark it `aria-hidden` or make it the single real instance.

### ST5 · Page Shell
```yaml
id: ST5
name: Page Shell
family: structural
job: orientation
density: low
styles: [structural, marketing, editorial, documentation, hybrid, expressive]
treatments: [carded, ruled, flat, full-bleed, open]
media: [none]
items: n/a
slots: [skip-link, header, main, footer]
motion: tier0
```
**Best for:** The base of every page. Sets landmarks, container widths and the section rhythm all other compositions sit in.
**Avoid when:** Never skip it. If an app framework supplies one, still verify each item in the Contract.
**Grid:** Single column. Container tokens: content ≈ 1120–1280px, reading ≈ 68ch, wide breakout ≈ content + 10%. Vertical rhythm comes from the section spacing scale in `foundations.md`.
```
┌───────────────────────────────────────────────┐
│ [Skip to content] (first focusable)           │
├───────────────────────────────────────────────┤
│           Header / Navigation (ST1)           │
├───────────────────────────────────────────────┤
│ main>  section  section  section  ...         │
├───────────────────────────────────────────────┤
│               Footer (ST3 / ST4)              │
└───────────────────────────────────────────────┘
```
**Contract:** Exactly one `<main>` and one `<h1>`. Each section is labelled by its heading (`aria-labelledby`). Skip link is the first focusable element. `scroll-padding-top` equals header height.
**Watch:** `overflow-x: hidden` on `body` hides bugs and breaks `position: sticky`; prefer `overflow-x: clip` on the specific wrapper. Use `100svh`, not `100vh`, for full-screen sections. Don't nest containers (double padding, double max-width).

### ST6 · App Shell
```yaml
id: ST6
name: App Shell
family: structural
job: orientation
density: high
styles: [structural, hybrid, documentation]
treatments: [carded, ruled, flat]
media: [none]
items: ≤ 7 nav groups
slots: [sidebar, topbar, content, panel]
motion: tier1
```
**Best for:** Dashboards, admin tools, and settings areas: anything with persistent navigation and a working area.
**Avoid when:** Content-first pages that should read like a document. Use E1 or D1.
**Grid:** `base`: topbar with a drawer sidebar. `lg`: fixed sidebar 240–280px + fluid content. `xl` (optional): right detail panel 320px.
```
┌───────────┬───────────────────────────────────┐
│ Logo      │ Topbar: search, account           │
│           │                                   │
│ Nav group │ Page title + actions              │
│           │                                   │
│ Nav group │ Working area                      │
└───────────┴───────────────────────────────────┘
```
**Contract:** Sidebar groups ≤ 7. Current item has `aria-current`. Choose one scroll model (page scroll or content-pane scroll) and keep it. Sidebar collapse state persists.
**Watch:** Two nested scroll containers break anchor links, scroll restoration and find-in-page. Move focus to the page `<h1>` on route change. Provide a keyboard shortcut for search. Tables inside content scroll in their own wrapper.

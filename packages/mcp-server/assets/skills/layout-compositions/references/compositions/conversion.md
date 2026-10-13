# Conversion compositions: CTA, contact, pricing, FAQ (C1–C5, P1–P3, Q1–Q2)

These sections ask for a decision. Each should carry one clear job and one primary action. When two of these sit next to each other, check they aren't competing (a CTA banner directly under a pricing table is fine; two banners are not).

Contents: C1 Centered CTA · C2 Split CTA (code) · C3 Full-Width Gradient CTA · C4 Contact Split · C5 Newsletter Capture · P1 3-Tier Pricing · P2 Comparison Matrix · P3 Single Plan · Q1 Two-Column FAQ · Q2 Accordion FAQ

---

### C1 · Centered CTA Banner
```yaml
id: C1
name: Centered CTA Banner
family: conversion
job: action
density: low
styles: [marketing, hybrid]
treatments: [carded, flat, open]
media: [none]
items: 1 action
slots: [headline, sub, cta-primary, cta-secondary]
motion: tier1
```
**Best for:** The closing conversion at the end of a page.
**Avoid when:** A CTA already sits immediately above, or several competing actions are offered.
**Grid:** Narrow container, one centred panel or open block, text measure ≤ 50ch.
```
┌───────────────────────────────────────────────┐
│                Ready to build?                │
│     One sentence about what happens next.     │
│          [Primary CTA]   [Secondary]          │
└───────────────────────────────────────────────┘
```
**Contract:** Headline states the outcome (≤ 8 words). Primary CTA is verb + object ("Start free trial"). Optional secondary. Keep the same label as the hero CTA.
**Watch:** Reduce panel padding on mobile (`p-12` → `p-8`). A third link dilutes the ask.

### C2 · Split CTA (Text + Code)
```yaml
id: C2
name: Split CTA (Text + Code)
family: conversion
job: action
density: medium
styles: [marketing, hybrid, documentation]
treatments: [carded, flat]
media: [code]
items: 1 action
slots: [headline, sub, cta, code-block]
motion: tier0
```
**Best for:** Developer conversion: "copy and run in 30 seconds".
**Avoid when:** The audience isn't technical, or the install step has prerequisites you can't show.
**Grid:** `base`: stack. `lg`: 2 columns (1:1) inside one panel; text left, terminal/install block right.
```
┌───────────────────────┬───────────────────────┐
│ Start building        │ npm i @scope/pkg      │
│ in 30 seconds.        │ import { x } from ... │
│ [Get started]         │ (copy button)         │
└───────────────────────┴───────────────────────┘
```
**Contract:** The command is copyable with a labelled copy button and an announced confirmation. ≤ 6 lines of code. No unresolved placeholders in the command.
**Watch:** Long commands must wrap or scroll inside the block, never widen the page. Tabs for package managers are optional. Keep code contrast ≥ 4.5:1.

### C3 · Full-Width Gradient CTA
```yaml
id: C3
name: Full-Width Gradient CTA
family: conversion
job: action
density: low
styles: [marketing, expressive]
treatments: [full-bleed]
media: [none, illustration]
items: 1 action
slots: [background, headline, cta]
motion: tier1
```
**Best for:** An emotional, high-contrast page ending.
**Avoid when:** The glow is the only thing distinguishing the section. Or the hero already uses the exact same gradient (echo it, don't copy it).
**Grid:** Full-bleed section, content centred, ≤ 50ch wide.
```
┌───────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░ Closing headline ░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░ [ CTA ] ░░░░░░░░░░░░░░░░░░░░░░░│
└───────────────────────────────────────────────┘
```
**Contract:** Text over the glow passes 4.5:1 at its brightest point. One action.
**Watch:** Build glows with CSS gradients, not large blur filters (mobile paint cost). Under reduced motion, keep it static.

### C4 · Contact Split (Form + Details)
```yaml
id: C4
name: Contact Split
family: conversion
job: action
density: medium
styles: [marketing, editorial, expressive, hybrid]
treatments: [carded, ruled, flat, open]
media: [none]
items: 4-6 fields
slots: [details, form, submit, alt-contact]
motion: tier0
```
**Best for:** Sales enquiries, studio contact, support intake.
**Avoid when:** A single email link would do (a form adds friction).
**Grid:** `base`: form first, details after. `lg`: 12-col, details `col-span-5` (address, email, hours), form `col-span-7`.
```
┌───────────────────┬───────────────────────────┐
│ Let's talk        │ Name                      │
│ hello@company.com │ Email                     │
│ Address · Hours   │ Message                   │
│                   │ [Send message]            │
└───────────────────┴───────────────────────────┘
```
**Contract:** Visible labels on every field (not placeholder-only). ≤ 6 fields. Explicit submit label. Errors tied to fields with `aria-describedby`. Success, error, loading and offline states designed. A non-form alternative (email) is shown.
**Watch:** Set `autocomplete` attributes. Never clear entered data on error. CAPTCHA and honeypots need accessible alternatives.

### C5 · Newsletter Capture Banner
```yaml
id: C5
name: Newsletter Capture Banner
family: conversion
job: action
density: low
styles: [marketing, editorial, hybrid]
treatments: [flat, full-bleed, carded]
media: [none]
items: 1 field
slots: [headline, sub, email-input, cta-primary]
motion: tier1
```
**Best for:** A lightweight, single-field email capture: footer-adjacent newsletter signup, "stay close to our work" bands.
**Avoid when:** You need more than an email address (use C4). The same page already has a C1/C3 CTA banner right next to it (two asks compete — pick one).
**Grid:** Full-width colored band. `base`: headline, sub, then input and button stacked full-width. `md`+: headline/sub left or centered, input + button inline in a single row (input flexes, button fixed width).
```
┌────────────────────────────────────────────────┐
│ Headline                                        │
│ Sub                                             │
│           Email input            │   Submit     │
└──────────────────────────────────┴──────────────┘
```
**Contract:** One field (email). Headline ≤ 8 words. Button label is a verb ("Subscribe", "Get updates"), never just "Submit". Inline success/error message, not a full page reload.
**Watch:** Label the input for screen readers even if visually hidden (a placeholder alone is not a label). Announce success/error via `aria-live`. Don't pair this with C1/C4 in the same viewport — pick one primary ask per section. Respect `prefers-reduced-motion` for any entry animation.

### P1 · 3-Tier Pricing Table
```yaml
id: P1
name: 3-Tier Pricing Table
family: conversion
job: action
density: high
styles: [marketing, hybrid]
treatments: [carded, flat]
media: [none]
items: 3 (max 4)
slots: [plan-name, price, features, cta, badge]
motion: tier0
```
**Best for:** SaaS plan comparison (for example Free / Pro / Enterprise).
**Avoid when:** Plans differ in too many dimensions to summarise (add P2). Only one plan exists (use P3).
**Grid:** `base`: 1 column, recommended plan first (via `order`). `lg`: 3 equal columns. The highlighted tier is set apart by a ring/tint and a badge.
```
┌───────────────┬───────────────┬───────────────┐
│      Free     │ Pro ★ Popular │   Enterprise  │
│       $0      │    $29 / mo   │     Custom    │
│   4 bullets   │   6 bullets   │   6 bullets   │
│     [CTA]     │     [CTA]     │[Contact sales]│
└───────────────┴───────────────┴───────────────┘
```
**Contract:** Plan name, price + period + billing note, ≤ 6 bullets of differentiators (not every feature), one CTA per card. "Most popular" must be true.
**Watch:** A thicker border on the featured card shifts layout: use an inset ring or `box-shadow`. Announce monthly/annual toggle changes with `aria-live`. The badge must not rely on colour alone. State tax and currency handling.

### P2 · Feature Comparison Matrix
```yaml
id: P2
name: Feature Comparison Matrix
family: conversion
job: understanding
density: high
styles: [marketing, hybrid, documentation]
treatments: [ruled, flat, carded]
media: [data]
items: 10-40 rows
slots: [plan-header, feature-row, group-header]
motion: tier0
```
**Best for:** Technical buyers who need granular plan comparison.
**Avoid when:** Fewer than 3 differentiating rows, or a phone-first audience with no simplified view.
**Grid:** A real `<table>`: sticky header row and sticky first column. `base`: horizontal scroll inside its own wrapper with a visible edge cue, or a per-plan accordion.
```
┌─────────────────┬────────┬────────┬───────────┐
│ Feature         │  Free  │  Pro   │    Team   │
├─────────────────┼────────┼────────┼───────────┤
│ Seats           │   1    │   5    │     ∞     │
│ SSO             │   –    │   –    │     ✓     │
│ Audit log       │   –    │   ✓    │     ✓     │
└─────────────────┴────────┴────────┴───────────┘
```
**Contract:** `<th scope>` on row and column headers. Check/cross icons have text alternatives ("Included" / "Not included"). ≤ 8 groups with subheads.
**Watch:** Icon-only cells are inaccessible. `position: sticky` needs a scroll wrapper that doesn't clip it. Collapse long groups behind a "Compare all features" control.

### P3 · Single Card Plan
```yaml
id: P3
name: Single Card Plan
family: conversion
job: action
density: low
styles: [marketing, hybrid]
treatments: [carded, flat, open]
media: [none]
items: 1 plan
slots: [price, checklist, cta, fine-print]
motion: tier0
```
**Best for:** Open-source sponsorship, flat-fee products and single-tier SaaS.
**Avoid when:** Several plans exist (use P1). The card would stand alone with no proof nearby.
**Grid:** Narrow container (≈ 480–560px), one centred card.
```
┌───────────────────────────────────────────────┐
│                   Solo plan                   │
│                  $19 / month                  │
│       ✓ Feature   ✓ Feature   ✓ Feature       │
│                [ Get started ]                │
│         Cancel anytime · 30-day refund        │
└───────────────────────────────────────────────┘
```
**Contract:** Price, ≤ 6 checklist items, one CTA, small print (billing, refund).
**Watch:** A lone card feels thin: pair it with T1 or T2 nearby. Decorative check icons are `aria-hidden`; the list is a real `<ul>`.

### Q1 · Two-Column FAQ (List + Answer Panel)
```yaml
id: Q1
name: Two-Column FAQ
family: conversion
job: understanding
density: high
styles: [documentation, hybrid, marketing]
treatments: [carded, ruled, flat]
media: [code, none]
items: 6-12
slots: [question-list, answer-panel]
motion: tier1
```
**Best for:** Documentation-adjacent FAQs, or answers that include code or long explanation.
**Avoid when:** Answers are short (use Q2). The audience is mostly on phones.
**Grid:** `base`: falls back to the Q2 accordion. `lg`: 12-col, question list `col-span-5` (sticky), answer panel `col-span-7`.
```
┌───────────────────┬───────────────────────────┐
│ ▸ Question one    │ Answer to the selected    │
│ ▾ Two (selected)  │ question, with code       │
│ ▸ Question three  │ or longer explanation     │
└───────────────────┴───────────────────────────┘
```
**Contract:** Answers ≤ 120 words or contain code. First question selected by default. Each question deep-links (hash).
**Watch:** Hiding answers behind selection hides them from find-in-page. The mobile fallback is an accordion, never a squeezed two-pane. Use a vertical tablist or a list of links, but pick one pattern and implement it fully.

### Q2 · Centered Accordion Stack
```yaml
id: Q2
name: Centered Accordion Stack
family: conversion
job: understanding
density: medium
styles: [marketing, hybrid, documentation]
treatments: [carded, ruled, flat, open]
media: [none]
items: 5-8
slots: [question, answer]
motion: tier1
```
**Best for:** Standard FAQs with short answers.
**Avoid when:** Answers are long or code-heavy (use Q1), or the content is legally required to be visible.
**Grid:** Single column, max width ≈ 68ch, centred; one open at a time or many open.
```
┌───────────────────────────────────────────────┐
│           Frequently asked questions          │
├───────────────────────────────────────────────┤
│ ▸ How does tokenization work?                 │
│ ▾ Is it WCAG accessible?                      │
│ Yes, every primitive is tested...             │
│ ▸ Can I customize themes?                     │
└───────────────────────────────────────────────┘
```
**Contract:** Questions phrased the way users ask them. Answers ≤ 80 words. Each trigger is a `<button aria-expanded>` inside a heading.
**Watch:** Height animation respects reduced motion. FAQ rich results are now largely restricted, so don't add structured data expecting that payoff. Anything users need to compare should not live in an accordion.

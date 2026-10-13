# Component language: typography, labels, controls, colour

`treatments.md` decides the *container* (cards, rules, flat, full-bleed, open). This file decides
the smaller, more frequent choices inside that container — the ones that get repeated across every
section of a page, so a bad default here compounds far more than a bad default at the composition
level. If every hero uses a pill badge for its overline, every parallel-option section uses buttons,
and every accent is the same shade at the same opacity, the page reads as templated even when the
compositions themselves are varied. These choices are decisions per page, not defaults per project:
re-decide them for each brief the way `distinctiveness.md` re-decides layout knobs.

Contents: 1 Overline / eyebrow · 2 Interactive control choice · 3 Typographic voice · 4 Colour application · 5 Per-page checklist

---

## 1. Overline / eyebrow

The small element above a headline (category, status, kicker). A pill badge is one option, not the
default — reaching for it every time is the single most common tell in this library's own audit.

| Form | Looks like | Best for | Avoid when |
|---|---|---|---|
| **Chip/badge** | Rounded pill, filled or outlined, small caps or sentence case | Status, category, "New", version tags — things that are genuinely a label on the content | Every hero on the page has one; it stops reading as information and starts reading as decoration |
| **Plain small-caps label** | Uppercase, letter-spaced, no container | Editorial, documentation; quiet framing that doesn't compete with the headline | The brand voice is loud/expressive — a bare label under-commits |
| **Rule + label** | A short horizontal rule or tick mark beside the label | Ruled/open treatments; ties the label to the section's dividing language | Carded treatment (mismatched container language) |
| **Numeral / marker** | `01`, `§`, a bullet glyph | Sequences, indexes, archive lists (E4, F7) | The content isn't actually ordered — don't imply sequence that doesn't exist |
| **Icon + label** | Small icon, then text, no container | When the icon adds real information (a category glyph), not as decoration | The icon is generic (a sparkle, an arrow) and could be removed with no loss |
| **None** | Headline stands alone | Type-led heroes (H5), statement sections, when the headline is already self-explanatory | Reflex omission when a genuine category/status exists and readers would benefit from it |

**Rule:** pick one primary overline form for the page. A second form is allowed only where it
carries a different *kind* of meaning (e.g. chips for status badges in a feature grid, plain label
for section eyebrows) — never two forms doing the same job on the same page.

## 2. Interactive control choice

The most common repetitive tell after overlines: reaching for a button where the content is
actually a set of parallel, mutually exclusive options (which wants tabs or a segmented control),
or reaching for tabs where a single action was needed (which wants a button).

| Content shape | Use | Not |
|---|---|---|
| One action, one destination | Button | Tabs (there's nothing to switch between) |
| 2–5 mutually exclusive views of the *same* content (F5, personas, modes) | Tabs (ARIA tabs pattern) or `SegmentedControl` for ≤ 4 short labels | A row of buttons that each navigate away — that's navigation, not a view switch |
| A short, exclusive either/or toggle (billing period, unit system) | `SegmentedControl` | A dropdown (overkill for 2–3 options) or a checkbox (implies non-exclusive) |
| Several independent, non-exclusive actions in a row | Buttons, one primary + ghost/outline secondaries | Tabs (implies exclusivity that isn't real) |
| A long list of destinations (nav, footer, index) | Plain links | Buttons for every link (visually shouts; dilutes the real primary action) |
| Expand/collapse one section at a time | Accordion | Tabs pretending to be an accordion on mobile without actually becoming one |

**Rule:** before placing a button, ask whether the reader is choosing an action or switching a
view. Wrong control choice is the more common failure than wrong container styling — it's also an
accessibility issue (a `<button>` implementing tab behaviour with the mouse but not the keyboard
fails the ARIA tabs pattern in `foundations.md` §5).

## 3. Typographic voice

`foundations.md` §1 sets measure; this sets *personality*. Pick one voice deliberately per page —
don't default to whatever the last project used.

| Voice | Recipe | Reads as |
|---|---|---|
| **Single family, weight contrast** | One typeface throughout; personality comes entirely from weight (400 body / 700–900 display) and size ratio | Calm, product-led, SaaS |
| **Two contrasting families** | A display face for headlines (serif, condensed, or expressive) + a plain grotesk for body/UI | Editorial, brand-led, publications |
| **Mono accent** | Primary family for prose, monospace for anything data/code/technical (values, labels, timestamps) | Developer tools, technical credibility |
| **Fluid oversized display** | One display face pushed to extreme scale (`clamp()`), minimal body copy elsewhere | Expressive, manifesto, campaign (X2, H5) |

**Contrast ratio matters more than family choice.** A 1.25 body-to-display ratio reads as quiet and
consistent; 2×+ reads as loud and editorial (see `distinctiveness.md`'s scale-contrast knob — this
is the typographic half of that knob, made concrete). Decide the ratio once per page and hold it:
mixing a subtle ratio in the hero with an extreme one in a feature section reads as indecision, not
range.

**Watch:** don't let "two contrasting families" become three. Don't use the display face for body
copy at small sizes (most display faces lose legibility below ~18px). If the design system ships
only one family, the knob becomes weight contrast and scale — still a real choice, not an excuse to
skip this section.

## 4. Colour application

Tokens (`shavin-ui.md` §3) fix *which* colours exist. This decides how the accent gets *used*
across a page — the part that most often defaults to "the same accent, same opacity, every time."

| Pattern | How it works | Reads as |
|---|---|---|
| **Single accent, sparing** | One accent colour, used only for the primary CTA and one other moment (a chip, a link) | Restrained, product-led |
| **Duotone** | Two accents, each with a defined job (e.g. one for status/proof, one for action) — never both in the same element | Considered, slightly more expressive |
| **Per-section rotation** | A muted palette rotates across card backgrounds or testimonial cards (see T2, M6-style scroll strips) so no two adjacent items share a colour | Editorial, playful, brand-led |
| **Monochrome + one break** | Page is entirely neutral (ink/paper) except one deliberately-coloured moment — the single bold moment from `distinctiveness.md` §3 | Quiet, confident, expressive |
| **Gradient as ground** | Colour lives in a background treatment (hero, CTA), not in individual UI elements, which stay neutral on top of it | Cinematic, full-bleed sections (H4, C3) |

**Rule:** name the pattern before building, the same way you name compositions and treatments. If
every section reaches for the identical accent at the identical weight, that's the tell — pick one
pattern above and let it justify *why* an element is coloured, not just fill in the brand colour
wherever there's a button.

## 5. Per-page checklist

Add to the distinctiveness process (`distinctiveness.md` §5) before building:

1. Name the overline form for the page (and any second form, with its distinct job).
2. For every place a control was about to become a button, ask: action or view-switch? Correct any
   tabs-that-should-be-buttons or buttons-that-should-be-tabs.
3. Name the typographic voice and its scale-contrast ratio.
4. Name the colour application pattern.
5. Run the sameness test (`distinctiveness.md` §1) again with these four named — a page can pass
   the layout-level sameness test and still fail here if every component choice defaults to the
   safest option.

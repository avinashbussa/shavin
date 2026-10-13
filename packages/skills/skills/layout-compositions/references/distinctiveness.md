# Distinctiveness: keeping a library from producing identical pages

A catalogue of proven layouts has a built-in risk: if every page is assembled from the same blueprints in the same way, every page looks alike. The compositions are skeletons; distinctiveness comes from the decisions made around them. Apply this file after choosing compositions and before writing code.

Contents: 1 The sameness test · 2 Variation knobs · 3 Spend boldness once · 4 Common tells · 5 Process

---

## 1. The sameness test

Swap the brand name and imagery for another company's. If the page still fits, it isn't specific enough. Look for something drawn from the subject's own world (materials, vocabulary, tools, cadence) and let it shape at least one of the knobs below.

## 2. Variation knobs

Change at least two of these from the recipe's default. Record the choice in the plan. Four of
these (overline, controls, type voice, colour application) are component-level — see
`component-language.md` for the full menu of options and worked rules for each.

| Knob | Range | Effect |
|---|---|---|
| Alignment | centred ↔ left ↔ deliberately offset | Centred feels announcement-like; left feels editorial |
| Scale contrast | 1.25 ratio ↔ 2+ ratio between body and display | Higher contrast = louder, more editorial |
| Grid strictness | strict modular ↔ modular with breaks ↔ broken (X1) | Where the personality lives |
| Container language | the five treatments (`treatments.md`) | Cards, rules, flat blocks, edge-to-edge, or open space |
| Density | airy ↔ dense | Dense reads as tool or publication; airy as brand |
| Media mode | product UI · photo · illustration · data · type only | Determines the hero and F-section choices |
| Rhythm | repeat one pattern ↔ alternate strongly | Repetition suits docs; alternation suits stories |
| Sequence | recipe order ↔ reordered (e.g. proof after features) | Changes the narrative |
| Voice of type | one family ↔ two contrasting families ↔ mono accent | Type carries personality — see `component-language.md` §3 |
| Overline form | chip/badge ↔ plain label ↔ rule+label ↔ numeral ↔ icon+label ↔ none | See `component-language.md` §1 — don't default to a pill badge |
| Interactive control | button ↔ tabs ↔ segmented control ↔ plain link | Match to content shape, not habit — see `component-language.md` §2 |
| Colour application | single accent ↔ duotone ↔ per-section rotation ↔ monochrome+break ↔ gradient ground | See `component-language.md` §4 |

## 3. Spend boldness once

Pick one moment to be memorable: the hero, one oversized statement, one broken grid, one orchestrated reveal. Keep everything around it quiet and disciplined. A page where every section shouts has no emphasis left. Before finishing, remove one decoration.

## 4. Common tells of a templated page

Avoid these unless the brief asks for them or the content truly needs them:

- The same card kit (same radius, same shadow, same padding) around every piece of content.
- A pill/chip badge (or a small all-caps label) above every single heading, whether or not it's carrying real information.
- Numbered markers (01 / 02 / 03) on content that isn't a sequence.
- One word in each headline coloured, italicised or bolded for emphasis.
- Fade-and-slide-up on every section and hover lifts on every card.
- Gradient blobs or glows as generic decoration.
- A logo strip directly under the hero on every page.
- A 3-column icon grid as the answer to every "features" section.
- Middle-dot meta strings and arrow suffixes on every link.
- The identical palette-and-typeface pairing you'd reach for on any project.
- Buttons used for a set of parallel, exclusive options that should be tabs or a segmented control (and vice versa) — see `component-language.md` §2.
- The same accent colour at the same weight in every section, regardless of what it's marking — see `component-language.md` §4.

If the brief pins down a look, follow the brief exactly, including when it asks for one of the above.

## 5. Process

1. Choose compositions from the recipe and selection guide.
2. Write the plan as a table (section → composition → treatment → motion tier).
3. Pick two or more knobs and state what you changed and why.
4. Name the overline form, interactive-control choice, typographic voice and colour application pattern (`component-language.md` §5) — these are separate decisions from the layout knobs above and get skipped by default if not named explicitly.
5. Name the single bold moment.
6. Run the sameness test on the plan. If it fails, revise the plan, not the code.
7. Build. Then remove one decoration.

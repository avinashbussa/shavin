# Composition entry schema

Every composition lives in `references/compositions/<family>.md` and follows one format. Consistency is what lets the model select by metadata and lets `scripts/validate_library.py` catch mistakes.

## Entry template

````markdown
### XX1 · Name of the Composition
```yaml
id: XX1
name: Name of the Composition
family: <file stem, e.g. hero>
job: understanding
density: medium
styles: [marketing, hybrid]
treatments: [carded, flat, open]
media: [product-ui, code]
items: 3-6
slots: [headline, sub, cta, media]
motion: tier1
```
**Best for:** one or two sentences.
**Avoid when:** the situations where it fails, with the better alternative's ID.
**Grid:** what happens at `base`, then `md`/`lg`. Spans, gaps, order.
```wf
Row of text
{1:1} Cell | Cell
```
**Contract:** content requirements: counts, lengths, required media, semantics.
**Watch:** failure modes: responsive, accessibility, performance, states.
````

Write the wireframe with the DSL, then run `python scripts/render_wireframes.py references/compositions/<file>.md` to convert it to an aligned box.

## Fields

| Key | Values |
|---|---|
| `id` | 1–2 capital letters + number (`ST1`, `H2`). Unique. Never reuse a retired ID. |
| `name` | Human name. |
| `family` | Must equal the file name without `.md`. |
| `job` | `attention` · `orientation` · `understanding` · `credibility` · `desire` · `action` · `reference` |
| `density` | `low` · `medium` · `high` |
| `styles` | list from: `structural` · `marketing` · `editorial` · `hybrid` · `documentation` · `expressive` |
| `treatments` | list from: `carded` · `ruled` · `flat` · `full-bleed` · `open` |
| `media` | list from: `none` · `product-ui` · `code` · `photo` · `illustration` · `video` · `data` · `logos` |
| `items` | Free text: how many things it holds (`3-6`, `n/a`, `1 lead + 4-8`). |
| `slots` | List of named parts. Motion attaches to these via `data-slot`. |
| `motion` | `tier0` (static only) · `tier1` (light presets suit it) · `choreography-ok` (a scene may be layered on top) |

## Required labelled lines

`**Best for:**` · `**Avoid when:**` · `**Grid:**` · `**Contract:**` · `**Watch:**`, in that order, each present.

## Registering a new composition

1. Add the entry to the right family file (or create a new family file; the file stem becomes the family).
2. Add the ID to `references/selection-guide.md` (decision table and overview table).
3. Reference it from any recipe in `references/page-recipes.md` where it belongs.
4. Run `python scripts/validate_library.py`. Fix every error.

## Retiring or changing

Don't renumber. Change the entry in place. If a composition is removed, leave a one-line note in the family file so old references resolve to an explanation.

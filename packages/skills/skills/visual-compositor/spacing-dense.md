# Spacing Dense — Density Framework & Monospace Restraint

> **Load priority:** STRUCTURAL mode (dashboards, admin panels, data tables, apps). Skip for MARKETING.
> **Token cost:** ~850 tokens.
> **Depends on:** `spacing-core.md` for section architecture, flex/grid, and the spatial scale reference.

This file covers two rules that only apply to dense, data-heavy interfaces — the density framework (how compressed spacing should be by interface type) and monospace font restraint (where `font-mono` is and isn't allowed).

---

## Density Framework

### Density Levels

| Level           | Description                                          | Padding scale                                  | Gap scale        | Line height                           |
| --------------- | ---------------------------------------------------- | ---------------------------------------------- | ---------------- | ------------------------------------- |
| **Airy**        | Marketing, editorial, hero sections                  | `p-6`–`p-8` surfaces, `py-20`+ sections        | `gap-6`–`gap-10` | `leading-relaxed` or `leading-loose`  |
| **Comfortable** | Standard web app, settings panels, documentation     | `p-4`–`p-6` surfaces, `py-12`–`py-16` sections | `gap-4`–`gap-6`  | `leading-normal` or `leading-relaxed` |
| **Compact**     | Dashboards, data tables, sidebars, admin tools       | `p-3`–`p-4` surfaces, `py-8`–`py-12` sections  | `gap-2`–`gap-4`  | `leading-tight` or `leading-normal`   |
| **Dense**       | Command palettes, terminal output, log viewers, code | `p-2`–`p-3` surfaces, `py-4`–`py-8` sections   | `gap-1`–`gap-2`  | `leading-tight`                       |

### Density Decision by Interface Type

| Interface type              | Correct density                         | Never use                  |
| --------------------------- | --------------------------------------- | -------------------------- |
| Marketing landing page      | Airy                                    | Compact or Dense           |
| Documentation portal        | Comfortable                             | Dense                      |
| SaaS product (general)      | Comfortable                             | Airy (wastes screen space) |
| Analytics / dashboard       | Compact                                 | Airy                       |
| Admin / data table          | Compact–Dense                           | Airy                       |
| Command palette / spotlight | Dense                                   | Airy or Comfortable        |
| Mobile app (any)            | Comfortable (one level up from desktop) | Dense on mobile            |

**Rule:** Never mix density levels within a single view.

### Responsive Density

Mobile is always **one density level more compressed** than desktop.

```
Desktop marketing page:   Airy     → py-24, p-8 cards, gap-8
Mobile marketing page:    Comfortable → py-16, p-5 cards, gap-6

Desktop dashboard:        Compact  → py-12, p-4 cards, gap-4
Mobile dashboard:         Dense    → py-8,  p-3 cards, gap-3
```

---

## Monospace Typography Restraint (`font-mono` Usage)

`font-mono` must be reserved strictly for code representations (code blocks, inline `<code>` snippets, CLI commands, raw token keys, hashes/IDs). Use it very sparingly in regular UI unless the project's font preset is explicitly monospace.

### What NOT to Use `font-mono` On
- ❌ Standard UI labels, form field labels, dropdown labels
- ❌ Filter popovers & headers, popover titles, action triggers
- ❌ Component & asset names in galleries/catalogs
- ❌ Metric units & status labels

### What `font-mono` IS Intended For
- ✅ Code snippets & representations, inline `<code>` tags, JSX prop syntax
- ✅ Developer syntax & keys: raw token keys, CSS variables, hex color strings, git SHAs
- ✅ Explicit Monospace Design Modes (Brutalist / Developer Terminal theme)

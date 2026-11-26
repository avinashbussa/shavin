# Changelog

All notable changes to `@shavin/block-schema` are recorded here. After 0.1.0, releases are versioned and described with [Changesets](https://github.com/changesets/changesets).

## 0.1.0 — first npm release

Block types, zod schemas and the open block catalogue for @shavin/ui.

### What's in it

- Typed block documents and schemas with validation
- The open block catalogue (hero, pricing, auth, app shell and more) used by `shavin add` and Studio
- Hex-colour policy checks (`@shavin/block-schema/hex-policy`)
- The Mega Menu Header block opens its panel on click (Esc closes it, focus returns, skip link, phone menu in a drawer), and the Sticky App Bar block has working notification, account and search panels

### Also in this release

Anyone who copied Shavin from the public GitHub repository before this release should read the **Breaking** items.

- **Breaking**: block trees use `brand` classes instead of `accent`.
- **Breaking**: the block document theme scope field `accentColor` is now `brandColor`, in the `BlockDocument` type and its zod schema. A saved document that sets `themeScope.accentColor` must be renamed to `brandColor`
- **Breaking**: block API changes. `auth-signin`, `auth-signup` and `auth-sso-first` no longer take a `providers` prop (the buttons are written out and follow Google and Apple branding rules; `auth-sso-first` says "Continue with SSO"). `pricing-toggle` no longer takes `advisor`; the "Talk to our team" link is inline.
- 17 free blocks show the WiseOwl sample logo instead of the plain-text name. `app-shell` KPI tiles run 4 / 4 / 2 across on desktop, tablet and phone.
- `engines.node` is `>=18`.

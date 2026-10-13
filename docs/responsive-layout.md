# Responsive layout

Shavin layouts respond to the space they are given, not to the size of the screen. A screen written once works on a phone, in a narrow window, in a split column and in a preview frame.

## App shells: `AppFrame`

```tsx
<AppFrame routeKey={pathname} sidebar={<Sidebar>…</Sidebar>}>
  <TopBar>
    <SidebarTrigger />
    …
  </TopBar>
  <main>…</main>
</AppFrame>
```

- Below 768px of the frame's own width (1024 with `compactBelow="lg"`) the same `Sidebar` becomes a slide-in drawer.
- `SidebarTrigger` in the `TopBar` only appears while the frame is compact.
- `routeKey` closes the drawer after navigation.
- Write the navigation once. Do not add `md:hidden` / `hidden md:block` wrappers, a hand-made menu button, a `navOpen` state or a second copy of the nav in a `Drawer`.

To show or hide a detail with the frame (a logo in the top bar, a breadcrumb parent), use the classes `shavin-frame-compact-only` and `shavin-frame-wide-only`. They follow the frame width and `compactBelow`, need no JavaScript, and both show outside an `AppFrame`.

## Rows of cards: `Grid columns="auto"`

```tsx
<Grid columns="auto" minWidth="sm" maxColumns="4" gap="4">…</Grid>
```

`minWidth` (`xs` 10rem, `sm` 14rem, `md` 18rem, `lg` 24rem, `xl` 32rem) is the narrowest a card may get; `maxColumns` (2 to 6) caps the row. Keep numeric `columns` for splits, spans and timelines, and do not combine `auto` with `stack` or `grid-cols-*` classes.

For a title and an action on one row, use `Flex wrap="wrap"` rather than switching direction at a breakpoint.

## Headings

`Heading` sizes `xl` and up are fluid: `xl` 24–30px, `2xl` 30–36px, `3xl` 36–48px, `4xl` 36–60px, `5xl` 36–72px. They grow with the nearest container (an `AppFrame`) or, outside one, the window. Pick the size for the widest layout and let it scale; do not add `md:text-*` steps. A plain size class (`className="text-6xl"`) pins a heading to one size when it must not scale.

## Checks

`validate_code`, `audit_source` and `check_page` in `@shavin/mcp` warn when code goes back to screen-width tricks for shells or headings. Run `npm test` after touching these rules.

## When breakpoints are still right

Whole-page art direction (a different hero crop, reordered sections) and marketing headers still use screen-width breakpoints.

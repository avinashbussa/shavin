# Shavin UI (`@shavin/ui`)

A React design system that AI coding agents can follow as reliably as people do: 94 accessible primitives on Radix, a strict two-tier token system, concentric-radius geometry, and machine-readable manifests (`tokens.json`, `components.json`) for the Shavin MCP server.

- **Docs:** https://docs.shavin.cc
- **Requires:** React 19, Tailwind CSS 3.4 or 4

## Quick start

```sh
npx @shavin/cli init
```

`init` installs the package, wires Tailwind (v3 preset or v4 CSS), imports the styles, wraps your root layout in `<ThemeProvider>`, and writes the `SHAVIN.md` project brain. Add `--oklch` for the OKLCH colour space.

## Usage

```tsx
import { Button, Card, Flex, Heading, Text } from "@shavin/ui";

export function Welcome() {
  return (
    <Card padding="md">
      <Flex direction="column" gap="3">
        <Heading size="md">Deploy previews</Heading>
        <Text color="subtle">Every pull request gets its own URL.</Text>
        <Button variant="solid">Enable previews</Button>
      </Flex>
    </Card>
  );
}
```

Always import from the package root, never from deep paths. The package ships no source and has no `./primitives/*` entry; the only `lib` subpath is `@shavin/ui/lib/theme-presets`.

## Theme in client-only apps

`ThemeProvider` follows the OS light and dark setting out of the box. In a server-rendered app (Next) an inline script sets the appearance before first paint. In a client-only app (Vite, `createRoot`) that script never runs, so `ThemeProvider` resolves the appearance when it mounts, before the first paint of your React tree, and keeps following OS changes unless you stored an explicit choice. One limitation: if your `index.html` shows content before the bundle has run, that content can paint light for a frame on a dark OS; put an inline script in `index.html` that adds the `dark` class from `prefers-color-scheme` to avoid it.

## Module format and bundle size

- **ESM only.** `@shavin/ui` (and `/server`, `/panels`, `/icons`) is an ES module with one file per source module and `sideEffects` set, so webpack, Turbopack, Rollup/Vite and esbuild drop the components you do not import. A Button-only page costs about 30 kB gzip. Use a bundler or a runtime that loads ESM (Node 18.18+ `import`); `require("@shavin/ui")` is not supported. The Tailwind 3 preset is the one exception and also ships as CommonJS (`require("@shavin/ui/tailwind-preset")`).
- **Server Components.** Only the root, `/panels` and `/icons` entries carry `"use client"`. Helpers such as `cn` come from `@shavin/ui/server` in files without `"use client"`.
- **Icons** load on demand: an `<Icon name>` fetches only the icon it renders. `@shavin/ui/icons` is the opt-in full catalogue.
- **Scroll motion** (`scrub`, `pin`) uses GSAP, an optional peer that is imported only when a scroll animation runs. If your bundler inlines dynamic imports (esbuild without `splitting`), mark `gsap` external, set `motionConfig.gsap = false`, or supply it yourself:

```ts
import { motionConfig } from "@shavin/ui";

motionConfig.loadGsap = async () => ({
  gsap: (await import("gsap")).gsap,
  ScrollTrigger: (await import("gsap/ScrollTrigger")).ScrollTrigger,
});
```

## Rules the system enforces

- **Semantic tokens only** — `bg-surface`, `text-fg`, `text-fg-subtle`, `border-hairline`. No hex, `rgb()` or raw Tailwind colour scales in components.
- **Two radius roles** — controls use `--radius-lg`, containers use `--radius-panel`; nested surfaces follow R_inner = max(floor, R_outer − P) (`rounded-panel-p3`, `rounded-panel-p5`).
- **Floating surfaces** carry `data-panel`; icons use `<Icon>`, never emoji or glyphs.

Lint with `npx -p @shavin/skills shavin-lint-tokens` (from `@shavin/skills`) or the MCP server's `validate_code`.

## Package entry points

| Import | What it is |
|---|---|
| `@shavin/ui` | Components, `ThemeProvider`, helpers |
| `@shavin/ui/styles.css`, `@shavin/ui/global-oklch.css` | Token definitions + base styles (RGB / OKLCH) |
| `@shavin/ui/tokens.css`, `@shavin/ui/base.css` (+ `-oklch`) | The same, split for Tailwind v4: import `base.css` with `layer(base)` |
| `@shavin/ui/theme-v4.css`, `@shavin/ui/theme-v4-oklch.css` | Tailwind v4 `@theme` bridge |
| `@shavin/ui/tailwind-preset` | Tailwind v3 preset |
| `@shavin/ui/tokens.json`, `@shavin/ui/components.json` | Machine-readable token and component manifests |

## Related packages

[`@shavin/cli`](https://www.npmjs.com/package/@shavin/cli) · [`@shavin/mcp`](https://www.npmjs.com/package/@shavin/mcp) · [`@shavin/skills`](https://www.npmjs.com/package/@shavin/skills) · [`@shavin/block-schema`](https://www.npmjs.com/package/@shavin/block-schema)

## Licence

MIT © 2026 Avinash Bussa and Shavin contributors. See [LICENSE](./LICENSE).
"Shavin" and the Shavin product names are trademarks of Avinash Bussa.

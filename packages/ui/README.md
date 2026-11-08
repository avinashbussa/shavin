# Shavin UI (`@shavin/ui`)

A React design system that AI coding agents can follow as reliably as people do: 91 accessible primitives on Radix, a strict two-tier token system, concentric-radius geometry, and machine-readable manifests (`tokens.json`, `components.json`) for the Shavin MCP server.

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

Always import from the package root, never from deep paths.

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
| `@shavin/ui/theme-v4.css`, `@shavin/ui/theme-v4-oklch.css` | Tailwind v4 `@theme` bridge |
| `@shavin/ui/tailwind-preset` | Tailwind v3 preset |
| `@shavin/ui/tokens.json`, `@shavin/ui/components.json` | Machine-readable token and component manifests |

## Related packages

[`@shavin/cli`](https://www.npmjs.com/package/@shavin/cli) · [`@shavin/mcp`](https://www.npmjs.com/package/@shavin/mcp) · [`@shavin/skills`](https://www.npmjs.com/package/@shavin/skills) · [`@shavin/block-schema`](https://www.npmjs.com/package/@shavin/block-schema)

## Licence

MIT © 2026 Avinash Bussa and Shavin contributors. See [LICENSE](./LICENSE).
"Shavin" and the Shavin product names are trademarks of Avinash Bussa.

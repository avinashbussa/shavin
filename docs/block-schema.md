# Block schema

`@shavin/block-schema` holds the block types (`src/types.ts`, `src/schema.ts`) and the open block catalogue that `shavin add` and the MCP server read.

```
packages/block-schema/
  blocks/<category>/<slug>.tsx   the open blocks, plus a <slug>.meta.ts each
  src/types.ts, src/schema.ts    block and catalogue types, with zod schemas
  src/generated/                 the built catalogue (generated, don't edit)
  hex-policy.mjs                 the shared rule for which hex values are allowed in block content
```

## What you can change here

- **Types and schemas:** fixes and additions, with a test in `tests/unit/`.
- **Existing open blocks:** bug fixes that follow the design rules (semantic tokens, `Grid columns="auto"` for card rows, `AppFrame` for app shells).

New blocks are authored upstream for now; block contributions will open through Shavin Community later. If you have an idea for a block, open an issue.

## Rules for block code

- Import only from `@shavin/ui`.
- Content (names, prices, copy) is realistic and neutral. No real people, brands or trademarks.
- Images come from the asset list in `src/assets.ts` (Lummi, Unsplash, Pexels) and carry `alt` text.
- `hex-policy.mjs` decides which hex values may appear in content (ids like `#1543` are fine; colours are not).

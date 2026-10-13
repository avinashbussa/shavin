# Shavin Block Schema (`@shavin/block-schema`)

Types, Zod schemas and the open block catalog for Shavin UI: ready-made sections (hero, features, pricing, auth, dashboards, footers and more) as both verbatim TSX and parsed block trees. The Shavin CLI, MCP server and Studio all read blocks from here.

- **Browse blocks:** https://docs.shavin.cc/blocks
- **Install one:** `npx @shavin/cli add hero-centered-media`

## Usage

```ts
import {
  SYSTEM_BLOCKS,          // ordered catalog (name, slug, category, rawCode, tags, …)
  BLOCK_TEMPLATES,        // slug → { layout, tree } for rendering in Studio or previews
  resolveBlockSlug,       // follows renamed slugs
  validateBlockTemplate,  // throws on invalid block data
  safeValidateBlockTemplate,
} from "@shavin/block-schema";

const pricing = SYSTEM_BLOCKS.find((b) => b.slug === resolveBlockSlug("pricing-three-tier"));
console.log(pricing?.rawCode); // the block's TSX, using @shavin/ui components only
```

Other exports: `BlockTemplate`, `BlockNode`, `BlockProject` types and their schemas, `deriveTree` / `deriveRawCode` / `getSyncStatus` for keeping code and trees in step, and the hex-colour policy at `@shavin/block-schema/hex-policy`.

## Related packages

[`@shavin/ui`](https://www.npmjs.com/package/@shavin/ui) · [`@shavin/cli`](https://www.npmjs.com/package/@shavin/cli) · [`@shavin/mcp`](https://www.npmjs.com/package/@shavin/mcp)

## Licence

MIT © 2026 Avinash Bussa and Shavin contributors. See [LICENSE](./LICENSE).
"Shavin" and the Shavin product names are trademarks of Avinash Bussa.

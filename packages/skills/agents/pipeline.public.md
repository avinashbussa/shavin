When adding a component, variant, or prop in this repo:
1. **Primitive (`packages/ui/src/primitives/<Name>/`)** with its `<Name>.doc.ts`, exported from `packages/ui/src/index.ts`.
2. **Manifest** — `npm run manifest:gen` regenerates `components.json`, which the MCP server and agents read.
3. **Preview** — `npm run playground`, open the primitive's page and clear its checklist; every example must render.
4. **Tests** — render, axe and contract cases in `tests/unit/` (`smoke`, `a11y`, `contracts`).
5. **Verification** — `npm run verify` and `npm test` exit 0 (`npm run eval` too if you touched rules, the validator, autofix or skills).

Skills and slash commands are edited in `packages/skills/` (never in an installed `.agents/` copy). After changing them or the sources in `packages/skills/agents/`, run `npm run agents:gen`. The docs site and the Studio block registry are maintained upstream; maintainers wire new components into them after merge.

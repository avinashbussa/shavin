Shavin 0.1.0 is the first npm release. It publishes five packages, all at 0.1.0:

- `@shavin/ui`: token-driven, agent-readable design system and React primitive library.
- `@shavin/cli`: sets up and checks projects that use `@shavin/ui` (`init`, `add` blocks, `check`, `context`, `bridge`, `brand`, `findings`).
- `@shavin/mcp`: MCP server that grounds coding agents in `@shavin/ui` components, tokens, layouts and checks.
- `@shavin/skills`: agent skills and slash commands for `@shavin/ui`, installed into a project's `.agents/` folder.
- `@shavin/block-schema`: block types, schemas and the open block catalogue for `@shavin/ui`.

Install: `npx @shavin/cli init` in a Next.js or Vite project on Tailwind 3 or 4.

From here each package is versioned on its own and has its own release and notes (`@shavin/ui@x.y.z`, and so on). The `@shavin/cli`, `@shavin/mcp` and `@shavin/skills` packages declare which `@shavin/ui` versions they document (`shavin.compat` in their `package.json`), and `npx @shavin/cli check` warns when the installed versions do not fit.

See each package's release for its notes. Docs: https://docs.shavin.cc

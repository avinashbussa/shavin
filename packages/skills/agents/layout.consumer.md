Everything comes from the `@shavin/ui` package root; you never need its internal folders.

| Where | What |
|---|---|
| `@shavin/ui` | Every primitive, `ThemeProvider`, `cn`, theme presets and helpers |
| `@shavin/ui/server` | Server-safe helpers (`cn`, URL helpers) for React Server Components |
| `node_modules/@shavin/ui/components.json` | Component manifest: props, variants, examples and guidance (`get_components`) |
| `node_modules/@shavin/ui/tokens.json` | Semantic token dictionary (`get_tokens`) |
| `.agents/skills/`, `.agents/commands/` | Installed agent skills and slash commands (`npx @shavin/skills`) |
| `SHAVIN.md` | This project's design brief: site type, mode, accent, density, radius |

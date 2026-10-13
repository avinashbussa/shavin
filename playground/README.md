# Shavin Playground

A local preview of every `@shavin/ui` primitive, styled like the docs site. Run it from the repo root:

```sh
npm run playground   # http://localhost:3700
```

It reads straight from your working tree, with no build step:

| What you see | Where it comes from |
|---|---|
| Description, features, examples, Do and Don't, accessibility and keyboard notes | `packages/ui/src/primitives/<Name>/<Name>.doc.ts` |
| Props and variants | `packages/ui/components.json`, regenerated when you save a primitive |
| Components, tokens and styles | `packages/ui/src` and `packages/ui/src/styles/global.css` |

Each example's `code` string is compiled in the browser with every `@shavin/ui` export, the Lucide icons and the React hooks in scope. An example that fails to render shows its error in place. Modal examples (Dialog, Drawer, Spotlight) open on demand and close with Esc.

The checklist at the top of a primitive's page lists anything a pull request still needs. The overview page shows the same checks for every primitive.

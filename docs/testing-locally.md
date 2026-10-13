# Testing locally

Start every session with `npm run regen` (every generator, in dependency order), then the four checks in [CONTRIBUTING](../CONTRIBUTING.md); they cover most changes. When you want to try the packages in a real app, use one of these.

## 1. The smoke test (start here)

```sh
npm run smoke            # pack every package, install into a fresh Next.js + Tailwind v4 app, run init, add, the MCP server and a build
npm run smoke -- --keep  # keep the app on disk to look around
```

## 2. Tarballs in your own app

```sh
npm run pack             # builds, then writes every open package's tarball to prod-dist/packages/
cd ../my-app && npm install <repo>/prod-dist/packages/shavin-ui-*.tgz
```

Or pack by hand with `npm run build` then `npm pack -w @shavin/ui -w @shavin/cli -w @shavin/mcp -w @shavin/skills -w @shavin/block-schema --pack-destination /tmp/shavin`. Either way this installs exactly what npm would publish, so it catches missing files in `exports` or `files`. It does **not** test `shavin init`'s own installs — for that use Verdaccio below.

## 3. Run the CLI and MCP from source

```sh
cd ../my-app && node <repo>/packages/cli/bin/shavin.mjs init   # commands act on the current folder
node <repo>/packages/mcp-server/bin/shavin-mcp.mjs
```

To use your local MCP server in an agent, point the client's MCP config at `node <repo>/packages/mcp-server/bin/shavin-mcp.mjs`, then restart the client.

## 4. Linking while you iterate

`npm link` tends to give React two copies and break hooks. If you need live linking, use `yalc`:

```sh
npm i -g yalc
cd packages/ui && npm run build && yalc publish
cd ../my-app && yalc add @shavin/ui
```

After each change: rebuild, then `yalc push` from the package.

## 5. Verdaccio — the only way to test `shavin init`

`init` installs `@shavin/ui` and the agent ecosystem **by name from a registry** (`npm install @shavin/ui`, `npm install -D @shavin/mcp @shavin/skills @shavin/cli`, and the `npx @shavin/mcp` it writes to `.mcp.json`). Tarballs and `yalc` only place packages that are already there — they never exercise init's installs. To run init against unpublished changes, a local registry (Verdaccio) is the only way to run it for real.

Automated:

```sh
npm run test:e2e            # spins Verdaccio, publishes the open packages, runs `shavin init` against it, asserts
npm run test:e2e -- --keep  # keep the sandbox to inspect
```

By hand:

```sh
npx verdaccio                                   # http://localhost:4873
# in your test app, scope @shavin at the registry (a per-command --registry can't reach init's .mcp.json npx):
printf '@shavin:registry=http://localhost:4873\n' > .npmrc
# publish the packages (from the repo), then:
node <repo>/packages/cli/bin/shavin.mjs init
```

If you republish the same version, clear the npx cache (`~/.npm/_npx`) or init may resolve a stale copy.

## Which to use

| You changed | Try |
|---|---|
| A primitive or styles | `npm run playground`, then the smoke test |
| Package exports, files or styles entry points | Tarballs in your own app (`npm run pack`) |
| `shavin init`, install flows, the AI ecosystem | Verdaccio (`npm run test:e2e`) |
| The CLI (other commands) | Run it from source against a test app, then the smoke test |
| An MCP tool | Run the server from source in your agent |

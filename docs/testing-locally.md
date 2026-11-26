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

By hand: see [Try the packages in a fresh project](#6-try-the-packages-in-a-fresh-project-any-os) below.

## 6. Try the packages in a fresh project (any OS)

This is the by-hand version of the Verdaccio test: a local registry that serves only `@shavin/*` from your tarballs and passes every other package through to npmjs, then a brand-new app that installs Shavin the way a user would. It works the same on macOS, Linux and Windows; each command is given for bash and PowerShell. You need Node 22 and a network connection (the app's own dependencies come from real npm).

### Publish order and why

Publish in this order. Each package's `@shavin/*` dependencies must already be on the registry when it is installed:

| Step | Package | Why it goes here |
|---|---|---|
| 1 | `@shavin/block-schema` | No `@shavin/*` dependencies. `@shavin/cli` and `@shavin/mcp` depend on it |
| 2 | `@shavin/ui` | No `@shavin/*` dependencies, so its position is convention, but `shavin init` installs it by name and the other packages declare a compatible `@shavin/ui` range (`shavin.compat`) |
| 3 | `@shavin/skills` | No `@shavin/*` dependencies; `init` and `npx @shavin/skills` install it by name |
| 4 | `@shavin/cli` | Depends on `@shavin/block-schema` |
| 5 | `@shavin/mcp` | Depends on `@shavin/block-schema` and `@shavin/cli` |

All five must be published before you run `init`, because `init` installs them by name. The hard rules are `block-schema` before `cli` and `cli` before `mcp`; the release workflow uses the same order.

### 1. Get the tarballs

From the repo root:

```sh
npm ci
npm run pack     # builds, then writes shavin-<name>-0.1.0.tgz for each package to prod-dist/packages/
```

### 2. Start the local registry

Create a working folder outside the repo, for example `shavin-rehearsal`, and save this as `verdaccio.yaml` in it. `@shavin/*` is served only from the local storage; everything else is proxied to npmjs; publishing is anonymous:

```yaml
storage: ./storage
auth:
  htpasswd:
    file: ./htpasswd
    max_users: -1
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
packages:
  '@shavin/*':
    access: $all
    publish: $anonymous
  '**':
    access: $all
    publish: $anonymous
    proxy: npmjs
```

Start it and leave that terminal open.

```sh
# bash
cd shavin-rehearsal
npx --yes verdaccio@6 --config verdaccio.yaml --listen 127.0.0.1:4873
```

```powershell
# PowerShell
cd shavin-rehearsal
npx --yes verdaccio@6 --config verdaccio.yaml --listen 127.0.0.1:4873
```

### 3. Publish the five tarballs

In a second terminal, in the same folder. The auth token is a dummy: the registry accepts anonymous publishes, and `--userconfig` keeps your real `~/.npmrc` (and any real token) out of it. Replace `<repo>` with your checkout.

```sh
# bash
cd shavin-rehearsal
printf 'registry=http://127.0.0.1:4873\n//127.0.0.1:4873/:_authToken=rehearsal\n' > publish.npmrc
for p in block-schema ui skills cli mcp; do
  npm publish "<repo>/prod-dist/packages/shavin-$p-0.1.0.tgz" --registry http://127.0.0.1:4873 --userconfig publish.npmrc
done
```

```powershell
# PowerShell
cd shavin-rehearsal
"registry=http://127.0.0.1:4873`n//127.0.0.1:4873/:_authToken=rehearsal" | Set-Content publish.npmrc
foreach ($p in "block-schema","ui","skills","cli","mcp") {
  npm publish "<repo>\prod-dist\packages\shavin-$p-0.1.0.tgz" --registry http://127.0.0.1:4873 --userconfig publish.npmrc
}
```

Open `http://127.0.0.1:4873` to see the five packages listed. If a publish says the version already exists, remove it first (`npm unpublish @shavin/<name>@0.1.0 --force --registry http://127.0.0.1:4873 --userconfig publish.npmrc`) or delete the `storage` folder and restart Verdaccio.

### 4. Create the consumer project

```sh
# bash
mkdir consumers && cd consumers
npx create-next-app@15 next-app --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
cd next-app
printf '@shavin:registry=http://127.0.0.1:4873\n' >> .npmrc
```

```powershell
# PowerShell
mkdir consumers; cd consumers
npx create-next-app@15 next-app --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
cd next-app
"@shavin:registry=http://127.0.0.1:4873" | Add-Content .npmrc
```

The scoped line in the project's `.npmrc` sends only `@shavin/*` to the local registry. A per-command `--registry` flag is not enough: `init` writes `npx -y @shavin/mcp` into `.mcp.json`, and the agent client later runs that command on its own, without your flag, so it would look for `@shavin/mcp` on real npm. The `.npmrc` is read by every `npm` and `npx` run in the project, including that one.

For a Vite project use `npm create vite@7 vite-app -- --template react-ts`, add Tailwind, and add the same `.npmrc` line.

### 5. Run it and check

```sh
npx @shavin/cli --version     # 0.1.0
npx @shavin/cli init          # answer the prompts
npx next dev                  # or your project's dev script; open http://localhost:3000 (Vite: npx vite)
npx @shavin/cli brand --color monochrome --display-font "Rethink Sans" --body-font Inter --mode system --confirm
npx @shavin/cli check         # exits 0 on a clean project
```

Check, in this order:

1. `init` finishes without an error and names the files it changed (`SHAVIN.md`, `AGENTS.md`, `.agents/`, `.mcp.json`).
2. The dev page renders with Shavin styles (a `Button` has its background and radius; Tab shows the focus ring) and the dev inspector tile appears in a corner.
3. `.mcp.json` starts: run `npx -y @shavin/mcp` in the project (it prints `Standalone MCP server running on stdio with 36 tools` and waits for a client; stop it with Ctrl+C), or open the project in your agent and call `get_project_context`.
4. `npx @shavin/cli check` exits 0, and `npx @shavin/cli findings` runs (it lists nothing yet).

### Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `init` or `npx` installs an old or wrong copy after you republished the same version | npx caches the first copy it resolved. Delete `~/.npm/_npx` (on Windows `%LocalAppData%\npm-cache\_npx`), and unpublish or reset Verdaccio storage before republishing |
| `E404 ... @shavin/ui` | The project's `.npmrc` line is missing, or a package was not published yet. Check `npm view @shavin/ui version` from inside the project |
| `EADDRINUSE` when starting Verdaccio | Port 4873 is taken (another Verdaccio). Stop it, or use another port in `--listen` and in every `127.0.0.1:4873` above |
| Windows: the agent client reports `spawn npx ENOENT` for the server in `.mcp.json` | Windows cannot run `npx` directly without a shell. Change the entry to `"command": "cmd", "args": ["/c", "npx", "-y", "@shavin/mcp"]` |
| `npm publish` asks you to log in | `--userconfig publish.npmrc` was left out, or the `_authToken` line is missing from it |

### Clean up

Stop Verdaccio (Ctrl+C), then delete the `shavin-rehearsal` folder and `<repo>/prod-dist`. Nothing is installed globally. If you ran `npm install` in the repo with a different registry, nothing there changed.

## Which to use

| You changed | Try |
|---|---|
| A primitive or styles | `npm run playground`, then the smoke test |
| Package exports, files or styles entry points | Tarballs in your own app (`npm run pack`) |
| `shavin init`, install flows, the AI ecosystem | Verdaccio (`npm run test:e2e`, or section 6 by hand) |
| The CLI (other commands) | Run it from source against a test app, then the smoke test |
| An MCP tool | Run the server from source in your agent |

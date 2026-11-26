/**
 * shavin-fixture — reusable stages of the local-registry install path.
 *
 * Used by scripts/verdaccio-e2e.mjs and evals/adherence/. Stands up a Verdaccio
 * registry, publishes the five open packages to it, scaffolds a consumer app that
 * resolves the `@shavin` scope from it, and runs `shavin init` for real.
 */
import fs from "node:fs";
import net from "node:net";
import http from "node:http";
import path from "node:path";
import { runSync, spawnCross, stopTree } from "./spawn-cross.mjs";
import { fileURLToPath } from "node:url";

export { stopTree };
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const HOST = "127.0.0.1";
// @shavin/fx joins when its folder exists (where its source is kept): it is published to npm but its source is not in the public repo,
// so the public repo's rehearsal covers the five open packages only. fx goes after ui (its peer dependency).
export const PKGS = [
  ["block-schema", "@shavin/block-schema"],
  ["ui", "@shavin/ui"],
  ["fx", "@shavin/fx"],
  ["skills", "@shavin/skills"],
  ["mcp-server", "@shavin/mcp"],
  ["cli", "@shavin/cli"],
].filter(([dir]) => fs.existsSync(path.join(ROOT, "packages", dir, "package.json")));

export const sh = (cmd, args, cwd, env) =>
  runSync(cmd, args, {
    cwd: cwd || ROOT,
    encoding: "utf8",
    input: env?.input,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", ...(env?.extra || {}) },
  });

const freePort = () =>
  new Promise((res, rej) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", rej);
    srv.listen(0, HOST, () => {
      const { port } = srv.address();
      srv.close(() => res(port));
    });
  });

const waitForPing = (port, logFile, ms = 150000) =>
  new Promise((res, rej) => {
    const deadline = Date.now() + ms;
    const fail = () => {
      let log = "";
      try { log = fs.readFileSync(logFile, "utf8").split("\n").filter(Boolean).slice(-6).join("\n    "); } catch {}
      rej(new Error(`Verdaccio did not start within ${Math.round(ms / 1000)}s${log ? `\n    ${log}` : ""}`));
    };
    const tick = () => {
      const req = http.get({ host: HOST, port, path: "/-/ping" }, (r) => { r.resume(); res(true); });
      req.on("error", () => (Date.now() > deadline ? fail() : setTimeout(tick, 500)));
    };
    tick();
  });

/** Build ui + block-schema (dist/) — mcp bundles via prepack. */
export const buildPackages = () => {
  sh("npm", ["run", "build"]);
  // `npm run build` does not build block-schema in every checkout (it is ui only in some), so build it by name: this works in both.
  sh("npm", ["run", "build", "-w", "@shavin/block-schema"]);
  if (fs.existsSync(path.join(ROOT, "packages/fx/package.json"))) sh("npm", ["run", "build:fx"]);
  const fxBuilt = !fs.existsSync(path.join(ROOT, "packages/fx/package.json")) || fs.existsSync(path.join(ROOT, "packages/fx/dist/index.js"));
  return fxBuilt && fs.existsSync(path.join(ROOT, "packages/ui/dist/index.js")) && fs.existsSync(path.join(ROOT, "packages/block-schema/dist/index.js"));
};

/** Start Verdaccio in `work`. Returns { reg, port, cache, proc }. Caller kills `proc`. */
export const startRegistry = async (work) => {
  const storage = path.join(work, "storage");
  const cache = path.join(work, "npm-cache");
  fs.mkdirSync(cache, { recursive: true });
  const port = await freePort();
  const reg = `http://${HOST}:${port}`;
  const configPath = path.join(work, "verdaccio.yaml");
  fs.writeFileSync(configPath, `storage: ${storage}
auth:
  htpasswd:
    file: ${path.join(work, "htpasswd")}
    max_users: -1
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
packages:
  '@shavin/*':
    access: $all
    publish: $anonymous
    unpublish: $anonymous
  '**':
    access: $all
    publish: $anonymous
    proxy: npmjs
log: { type: stdout, format: pretty, level: warn }
`);
  const log = path.join(work, "verdaccio.log");
  const fd = fs.openSync(log, "a");
  const proc = spawnCross("npx", ["--yes", "verdaccio@6", "--config", configPath, "--listen", `${HOST}:${port}`], {
    cwd: work, stdio: ["ignore", fd, fd], env: { ...process.env, NO_COLOR: "1" },
  });
  proc.on("error", (e) => { throw e; });
  await waitForPing(port, log);
  return { reg, port, cache, proc };
};

/** Publish the open packages (plus @shavin/fx when its source is present). `onResult(name, ok, detail)` is optional. */
export const publishAll = ({ reg, port, cache }, work, onResult = () => {}) => {
  const publishNpmrc = path.join(work, "publish.npmrc");
  fs.writeFileSync(publishNpmrc, `registry=${reg}\n//${HOST}:${port}/:_authToken=e2e-fake-token\n`);
  // The local registry is throwaway, so the fx draft-licence publish guard is relaxed here (and only here).
  const extra = { npm_config_userconfig: publishNpmrc, npm_config_cache: cache, SHAVIN_FX_ALLOW_DRAFT: "1" };
  for (const [dir, name] of PKGS) {
    try {
      sh("npm", ["publish", "--registry", reg], path.join(ROOT, "packages", dir), { extra });
      onResult(`publish ${name}`, true);
    } catch (e) {
      const msg = String(e.stderr || e.message).split("\n").find((l) => /error|E\d{3}/i.test(l)) || "publish failed";
      onResult(`publish ${name}`, false, msg.slice(0, 80));
      throw e;
    }
  }
};

/**
 * Scaffold the consumer app skeleton in `app` (package.json, scoped .npmrc,
 * globals.css, layout.tsx). With `runnable: true` also writes the Next 15 +
 * Tailwind 4 + TypeScript config so the app can `next dev` / `next build`.
 */
export const scaffoldApp = (app, { reg, port }, { runnable = false } = {}) => {
  fs.mkdirSync(path.join(app, "src", "app"), { recursive: true });
  fs.writeFileSync(path.join(app, "package.json"), JSON.stringify({
    name: "shavin-e2e-app", private: true, type: "module",
    ...(runnable ? { scripts: { dev: "next dev", build: "next build", start: "next start" } } : {}),
  }, null, 2));
  // Scoped registry — a per-command --registry can't reach the `npx -y @shavin/mcp` init writes to .mcp.json.
  fs.writeFileSync(path.join(app, ".npmrc"), `@shavin:registry=${reg}\n//${HOST}:${port}/:_authToken=e2e-fake-token\n`);
  fs.writeFileSync(path.join(app, "src/app/globals.css"), '@import "tailwindcss";\n');
  // A real create-next-app layout imports ./globals.css; `runnable` fixtures must too (init does not add it).
  fs.writeFileSync(path.join(app, "src/app/layout.tsx"), `${runnable ? 'import "./globals.css";\n\n' : ""}export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="antialiased">{children}</body></html>);
}
`);
  if (runnable) {
    fs.writeFileSync(path.join(app, "src/app/page.tsx"), `export default function Page() {\n  return <main />;\n}\n`);
    fs.writeFileSync(path.join(app, "postcss.config.mjs"), `export default { plugins: { "@tailwindcss/postcss": {} } };\n`);
    fs.writeFileSync(path.join(app, "next.config.mjs"), `export default {};\n`);
    fs.writeFileSync(path.join(app, "tsconfig.json"), JSON.stringify({
      compilerOptions: {
        target: "ES2022", lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true, strict: true,
        noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true,
        isolatedModules: true, jsx: "preserve", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./src/*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    }, null, 2));
    fs.writeFileSync(path.join(app, ".gitignore"), "node_modules\n.next\n");
  }
};

/** Install Next + React + Tailwind 4 + TS from the registry's npmjs uplink. */
export const installFramework = (app, { cache }) => {
  sh("npm", ["install", "next@15", "react@19", "react-dom@19", "tailwindcss@4", "@tailwindcss/postcss@4", "typescript@5", "@types/react@19", "@types/node@22", "--no-audit", "--no-fund"], app, { extra: { npm_config_cache: cache } });
};

/**
 * Run `npx @shavin/cli init` for real, the way the docs tell a user to: the cli comes from the registry and is installed
 * ALONE into npx's cache (not run from the monorepo), accepting the AI ecosystem prompt. Returns stdout (or error output).
 */
export const runInit = (app, { cache }) => {
  try {
    return sh("npx", ["--yes", "@shavin/cli", "init"], app, { input: "y\n", extra: { npm_config_cache: cache } });
  } catch (e) {
    return `INIT FAILED\n${e.stdout || ""}\n${e.stderr || ""}`;
  }
};

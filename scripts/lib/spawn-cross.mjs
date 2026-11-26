/**
 * Cross-platform child processes for the maintainer scripts (smoke, pack, verdaccio-e2e).
 *
 * On Windows `npm`, `npx` and the shims in node_modules/.bin are `.cmd` files. Node (since the April 2024 security
 * release) refuses to spawn those without `shell: true` (`spawnSync npm ENOENT` / EINVAL), and with a shell the arguments
 * are no longer escaped for us. These wrappers add the shell, the `.cmd` suffix and cmd.exe-safe quoting on Windows
 * only, and pass everything through untouched on Linux and macOS.
 */
import fs from "node:fs";
import { execFileSync, spawn, spawnSync } from "node:child_process";

const WIN = process.platform === "win32";

/** Quote one argument for cmd.exe (MSVCRT rules). Safe characters stay bare. */
export function quoteWin(arg) {
  const a = String(arg);
  if (a === "") return '""';
  if (/^[\w@%+=:,./\\-]+$/.test(a)) return a;
  return `"${a.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, "$1$1")}"`;
}

/** Does this command need a shell on Windows (a `.cmd` shim rather than an `.exe`)? */
function winShim(cmd) {
  if (/^(npm|npx|pnpm|yarn)$/i.test(cmd)) return `${cmd}.cmd`;
  if (/\.(cmd|bat)$/i.test(cmd)) return cmd;
  if (/node_modules[\\/]\.bin[\\/]/.test(cmd) && fs.existsSync(`${cmd}.cmd`)) return `${cmd}.cmd`;
  return null;
}

/** → { cmd, args, opts } ready for spawn / execFileSync on this platform (`platform` is injectable for tests). */
export function prepare(cmd, args = [], opts = {}, platform = process.platform) {
  if (platform !== "win32") return { cmd, args, opts };
  const shim = winShim(cmd);
  if (!shim) return { cmd, args, opts };
  return { cmd: quoteWin(shim), args: args.map(quoteWin), opts: { ...opts, shell: true } };
}

export function runSync(cmd, args, opts) {
  const p = prepare(cmd, args, opts);
  return execFileSync(p.cmd, p.args, p.opts);
}

export function spawnSyncCross(cmd, args, opts) {
  const p = prepare(cmd, args, opts);
  return spawnSync(p.cmd, p.args, p.opts);
}

export function spawnCross(cmd, args, opts) {
  const p = prepare(cmd, args, opts);
  return spawn(p.cmd, p.args, p.opts);
}

/** Stop a child and what it started. With a shell on Windows `child.kill()` only ends cmd.exe, not the process behind it. */
export function killTree(child) {
  if (!child || child.exitCode !== null || child.pid === undefined) return;
  if (WIN) {
    try { spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" }); } catch { /* already gone */ }
  } else {
    try { child.kill("SIGTERM"); } catch { /* already gone */ }
  }
}

/** killTree, then wait (up to `ms`) until the child has really exited, so Windows releases its file locks. */
export async function stopTree(child, ms = 10000) {
  if (!child || child.exitCode !== null || child.pid === undefined) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  killTree(child);
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, ms))]);
}

/**
 * Remove a temp folder. Retries because Windows briefly keeps files locked after a process exits; a failure is a warning
 * (returns false), never an exception, so cleanup can't change the result of a test.
 */
export function removeDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    return true;
  } catch (e) {
    console.warn(`  warning: could not remove ${dir} (${String(e.code || e.message)}); delete it by hand`);
    return false;
  }
}

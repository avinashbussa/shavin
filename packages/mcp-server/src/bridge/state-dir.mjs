/**
 * Where the bridge keeps its local state (the findings journal, staged Studio blocks).
 *
 * The folder is `<project root>/.shavin/`: the nearest directory at or above the working directory that holds a
 * package.json, never one inside node_modules. `SHAVIN_STATE_DIR` overrides it. Paths are built with `path.join`
 * only, so they are right on Windows as well.
 */
import fs from "node:fs";
import path from "node:path";

const inNodeModules = (dir) => dir.split(path.sep).includes("node_modules");

/** Nearest ancestor of `start` (inclusive) that has a package.json and is not inside node_modules; null if none. */
export function findProjectRoot(start, fsImpl = fs) {
  let dir = path.resolve(start);
  for (;;) {
    if (!inNodeModules(dir) && fsImpl.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * @param {{ env?: Record<string, string | undefined>, cwd?: string, fsImpl?: typeof fs, stateDir?: string }} [options]
 * @returns {string} an absolute directory path (it is not created here)
 */
export function resolveStateDir(options = {}) {
  const { env = process.env, cwd = process.cwd(), fsImpl = fs } = options;
  const explicit = options.stateDir ?? env.SHAVIN_STATE_DIR;
  if (explicit && String(explicit).trim()) return path.resolve(String(explicit).trim());
  const root = findProjectRoot(cwd, fsImpl);
  // No project around (or only node_modules): a folder in the working directory is still safe and visible.
  return path.join(root ?? path.resolve(cwd), ".shavin");
}

/**
 * Where `/api/write-block` stages a block pushed from Studio.
 *
 * In this project's own checkout, the folder the ingest script reads (`packages/block-schema/.studio-pending`).
 * From an installed package there is no checkout above the file, so it stages under the project's state folder
 * (`.shavin/studio-pending`) instead of inside node_modules.
 *
 * @param {{ repoRoot: string, stateDir: string, fsImpl?: typeof fs }} options `repoRoot` is where the bridge code
 *   would sit if it were running from a checkout
 */
export function resolveStagingDir({ repoRoot, stateDir, fsImpl = fs }) {
  const inCheckout =
    !inNodeModules(repoRoot) &&
    fsImpl.existsSync(path.join(repoRoot, "scripts", "ingest-studio-blocks.mts")) &&
    fsImpl.existsSync(path.join(repoRoot, "packages", "block-schema"));
  return inCheckout ? path.join(repoRoot, "packages", "block-schema", ".studio-pending") : path.join(stateDir, "studio-pending");
}

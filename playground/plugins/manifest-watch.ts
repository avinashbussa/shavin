import { spawn } from "node:child_process";
import path from "node:path";
import type { Plugin } from "vite";

/**
 * Re-runs `scripts/gen-manifest.mjs` when a primitive's source changes, so the
 * props and variants tables follow your edits. Prose and examples come from
 * the .doc.ts files directly and update without it.
 */
export function manifestWatch(repoRoot: string): Plugin {
  const primitives = path.join(repoRoot, "packages", "ui", "src", "primitives") + path.sep;
  const script = path.join(repoRoot, "scripts", "gen-manifest.mjs");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let queued = false;

  const run = (log: (msg: string) => void) => {
    if (running) {
      queued = true;
      return;
    }
    running = true;
    log("regenerating components.json …");
    const child = spawn(process.execPath, [script], { cwd: repoRoot, stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      running = false;
      log(code === 0 ? "components.json updated" : `manifest:gen failed\n${err.trim()}`);
      if (queued) {
        queued = false;
        run(log);
      }
    });
  };

  return {
    name: "shavin-manifest-watch",
    apply: "serve",
    configureServer(server) {
      const log = (msg: string) => server.config.logger.info(`[playground] ${msg}`, { timestamp: true });
      server.watcher.on("change", (file) => {
        if (!file.startsWith(primitives) || !/\.tsx?$/.test(file)) return;
        clearTimeout(timer);
        timer = setTimeout(() => run(log), 400);
      });
    },
  };
}

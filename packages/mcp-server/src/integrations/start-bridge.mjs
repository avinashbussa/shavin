import { globalBridge } from "../bridge/server.mjs";

/**
 * Start the Agent-Browser bridge once per process, for use from a dev server.
 *
 * Safe to call repeatedly and from more than one integration: the first call
 * owns the start, later calls return the same promise. Disabled outside dev and
 * when `SHAVIN_BRIDGE=0`. A bind clash with a bridge already running in another
 * process (EADDRINUSE) is treated as success — one bridge, whoever got there first.
 *
 * @param {{ port?: number, enabled?: boolean, quiet?: boolean }} [opts]
 * @returns {Promise<number | null>} the port in use, or null when disabled/failed.
 */
let starting = null;

export function startDevBridge(opts = {}) {
  const enabled = opts.enabled ?? (process.env.NODE_ENV !== "production" && process.env.SHAVIN_BRIDGE !== "0");
  if (!enabled) return Promise.resolve(null);
  if (starting) return starting;

  if (typeof opts.port === "number" && !globalBridge.isRunning) globalBridge.port = opts.port;
  const log = (m) => { if (!opts.quiet) console.log(`\x1b[36m[shavin]\x1b[0m ${m}`); };

  starting = globalBridge
    .start()
    .then((port) => {
      log(`Agent-Browser bridge on http://127.0.0.1:${globalBridge.port}`);
      return port;
    })
    .catch((err) => {
      if (err && err.code === "EADDRINUSE") {
        log(`Agent-Browser bridge already running on :${globalBridge.port}`);
        return globalBridge.port;
      }
      console.warn(`\x1b[33m[shavin]\x1b[0m bridge failed to start: ${err?.message ?? err}`);
      return null;
    });
  return starting;
}

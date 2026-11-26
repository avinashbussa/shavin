export interface ShavinBridgeOptions {
  /** Bridge port (default 7036). */
  port?: number;
  /** Force on or off. Default: on in dev, off in production or when SHAVIN_BRIDGE=0. */
  enabled?: boolean;
}
/** The shape Vite expects of a plugin (kept structural so @shavin/mcp does not depend on vite's types). */
export interface ShavinBridgePlugin {
  name: string;
  apply: "serve";
  configureServer(): void;
}
/** Vite plugin that starts the Agent-Browser bridge with the dev server (dev only). */
export function shavinBridge(opts?: ShavinBridgeOptions): ShavinBridgePlugin;
export default shavinBridge;

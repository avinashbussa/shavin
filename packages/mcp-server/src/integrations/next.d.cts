export interface ShavinBridgeOptions {
  /** Bridge port (default 7036). */
  port?: number;
  /** Force on or off. Default: on in dev, off in production or when SHAVIN_BRIDGE=0. */
  enabled?: boolean;
}
/** Wrap your Next config so the Agent-Browser bridge starts with `next dev`. The config is returned unchanged. */
export function withShavinBridge<T = object>(nextConfig?: T, opts?: ShavinBridgeOptions): T;
export { withShavinBridge as default };

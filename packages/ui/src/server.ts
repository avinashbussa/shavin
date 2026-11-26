// Server-safe entry: `import { cn } from "@shavin/ui/server"`.
//
// The root "@shavin/ui" bundle is marked "use client", which makes every
// non-component export (cn, the concentric helpers, ...) unusable from React Server
// Components. Everything here is pure and has no React runtime or DOM access,
// so Server Components, route handlers and metadata functions can import it.
export { cn } from "./lib/cn";
export {
  concentricContainerStyle,
  concentricRadius,
  paddingScaleFromClassName,
  concentricBoundaryResetStyle,
  withConcentricStyle,
  cardPaddingToScale,
} from "./lib/concentric";
export { surfaceClass, type Surface } from "./lib/surface";
export { SHAVIN_META, type ShavinMeta, type ShavinMcpTool } from "./lib/meta";

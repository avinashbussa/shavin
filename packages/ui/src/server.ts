// Server-safe entry: `import { cn } from "@shavin/ui/server"`.
//
// The root "@shavin/ui" bundle is marked "use client", which makes every
// non-component export (cn, URL helpers, ...) unusable from React Server
// Components. Everything here is pure and has no React runtime or DOM access,
// so Server Components, route handlers and metadata functions can import it.
export { cn } from "./lib/cn";
export {
  concentricContainerStyle,
  concentricCompoundStyle,
  concentricBoundaryResetStyle,
  withConcentricStyle,
  cardPaddingToScale,
} from "./lib/concentric";
export { surfaceClass, type Surface } from "./lib/surface";
export {
  isLocalhost,
  getWebsiteUrl,
  getStudioUrl,
  getDocsUrl,
  getCommunityUrl,
  getKitsUrl,
  getAssetsUrl,
} from "./lib/urls";
export { SHAVIN_META, type ShavinMeta, type ShavinMcpTool } from "./lib/meta";

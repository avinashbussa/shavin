import type * as React from "react";

export interface ShavinDevToolsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional custom trigger class name. */
  className?: string;
  /** Where the inspector bar starts, until it is dragged somewhere else (the new spot is remembered per browser). Defaults to "bottom-right". */
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  /** If true, forces ShavinDevTools to render even in production. By default, it is omitted in production (NODE_ENV === 'production'). */
  forceShow?: boolean;
  /**
   * Port the local Agent-Browser bridge listens on. Defaults to
   * `NEXT_PUBLIC_SHAVIN_BRIDGE_PORT` / `VITE_SHAVIN_BRIDGE_PORT`, then the built-in
   * default. Set this when you run `npx @shavin/cli bridge --port <n>`.
   */
  bridgePort?: number;
}

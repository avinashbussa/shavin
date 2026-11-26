"use client";
import * as React from "react";
import type { ShavinDevToolsProps } from "./types";

export type { ShavinDevToolsProps } from "./types";

// The panel is a large dev-only module. It is loaded on demand so a production build that never renders it
// (the default) does not download it, and so the inspector can grow without adding to a production page's weight.
const DevToolsPanel = React.lazy(() => import("./DevToolsPanel"));

export function ShavinDevTools({ forceShow = false, ...props }: ShavinDevToolsProps): React.JSX.Element | null {
  // Omit the dev inspector from production builds unless explicitly forced.
  // The check lives in this wrapper so the panel's hooks always run in the same order.
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production" && !forceShow) {
    return null;
  }
  return (
    <React.Suspense fallback={null}>
      <DevToolsPanel {...props} />
    </React.Suspense>
  );
}

export const ShavinDevInspector = ShavinDevTools;

"use client";
import * as React from "react";
import { PortalContainerProvider } from "../lib/portal-container";
import { ScopedThemeProvider } from "../primitives/ThemeProvider";
import { pinnedVars, ROOT_TEXT } from "./pin";
import type { Scheme } from "./scheme";

export interface InspectorRootProps {
  scheme: Scheme;
  /** Zero motion inside the inspector (the Settings switch); the OS setting already does this through the tokens. */
  reduceMotion?: boolean;
  children: React.ReactNode;
}

/**
 * The one stacking root of the inspector. It sits in the browser's top layer (above a host's modal dialog) and
 * carries its own token scope: brand, gray and radius pinned, status colours and shadow pinned per scheme, so the
 * page's theme (or the Theme tool changing it) cannot change how the inspector looks. Menus, tooltips and popovers
 * portal into `host`, inside that scope.
 */
/**
 * On a touch screen a tap leaves the element "hovered" until the next tap, which would leave a sticky fill on the last
 * tool or row touched. Hover fills apply only where there is a pointer that can hover.
 */
const TOUCH_CSS =
  "@media (hover: none) { [data-shavin-toolbar] button:not([aria-pressed=\"true\"]):hover, [data-shavin-list] [role=\"option\"]:not([aria-selected=\"true\"]):hover { background-color: transparent; } }";

const NO_MOTION = {
  "--dur-instant": "0ms",
  "--dur-fast": "0ms",
  "--dur-base": "0ms",
  "--dur-slow": "0ms",
  "--dur-enter": "0ms",
} as React.CSSProperties;

export function InspectorRoot({ scheme, reduceMotion, children }: InspectorRootProps): React.JSX.Element {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [host, setHost] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    // Top layer: stays above a host `<dialog>` opened with showModal(). Older browsers just keep a high z-index.
    try {
      el.setAttribute("popover", "manual");
      (el as HTMLElement & { showPopover?: () => void }).showPopover?.();
    } catch {
      /* not supported: the fixed, high z-index root still works */
    }
    return () => {
      try {
        (el as HTMLElement & { hidePopover?: () => void }).hidePopover?.();
      } catch {
        /* already gone */
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-shavin-inspector=""
      data-scheme={scheme}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        margin: 0,
        padding: 0,
        border: 0,
        background: "transparent",
        overflow: "visible",
        pointerEvents: "none",
        zIndex: 2147483000,
        color: "inherit",
      }}
    >
      <ScopedThemeProvider
        appearance={scheme}
        brandColor="Monochrome"
        grayColor="Zinc"
        radius="medium"
        focusRing="default"
        data-shavin-scope=""
        style={{ ...pinnedVars(scheme), ...(reduceMotion ? NO_MOTION : null), ...ROOT_TEXT, color: "rgb(var(--fg))", position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <PortalContainerProvider value={host}>
          <style>{TOUCH_CSS}</style>
          {children}
          <div ref={setHost} data-shavin-portal="" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        </PortalContainerProvider>
      </ScopedThemeProvider>
    </div>
  );
}

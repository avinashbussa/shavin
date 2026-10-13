"use client";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";
import { AppFrameContext, type AppFrameContextValue } from "./frame-context";

export { useAppFrame } from "./frame-context";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Layout widths (px) below which the frame goes compact. Must match the container queries in global.css. */
const COMPACT_LIMIT = { md: 768, lg: 1024 } as const;

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** `inert` is a boolean attribute in React 19 and a string in older typings; spread it so both type-check. */
function inertProps(on: boolean): Record<string, unknown> {
  return on ? { inert: true } : {};
}

export interface AppFrameProps {
  /** The app's navigation: a `<Sidebar>`. Written once; the frame turns it into a slide-in drawer when it runs out of room. */
  sidebar: ReactNode;
  /** Main application content (usually a `<TopBar>` followed by the page body). */
  children: ReactNode;
  /** Frame width below which the sidebar becomes a drawer: "md" (768px, default) or "lg" (1024px). Measured on the frame itself, not the window. */
  compactBelow?: "md" | "lg";
  /** Accessible name of the navigation drawer. Default "Navigation". */
  navLabel?: string;
  /** Pass the current route (e.g. `usePathname()`): the drawer closes whenever it changes, so navigation from menus or links inside the sidebar never leaves it open. */
  routeKey?: string;
  className?: string;
}

/**
 * AppFrame — the application shell.
 *
 * Sidebar + main column. The frame measures its OWN width (container query in CSS,
 * ResizeObserver for behaviour), so it adapts the same way on a phone, in a narrow
 * browser window, or inside a Studio device preview:
 *
 *  - wide: the sidebar sits in flow, exactly as written
 *  - compact: the same sidebar slides over the content as a drawer — scrim, inert
 *    background, Escape, focus return, swipe-to-close. `<SidebarTrigger />` placed in
 *    the TopBar shows up automatically (and only) in this mode.
 */
export function AppFrame({ sidebar, children, compactBelow = "md", navLabel = "Navigation", routeKey, className }: AppFrameProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const navId = useId();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const limit = COMPACT_LIMIT[compactBelow];

  // Measure layout width (clientWidth ignores CSS transforms, so Studio zoom doesn't skew it).
  useIsoLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setCompact(el.clientWidth < limit);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [limit]);

  const isOpen = compact && open;

  // A route change closes the drawer.
  useEffect(() => {
    setOpen(false);
  }, [routeKey]);

  // Growing back to a wide frame always closes the drawer.
  useEffect(() => {
    if (!compact) setOpen(false);
  }, [compact]);

  // Focus: into the drawer on open, back to whatever opened it on close.
  useEffect(() => {
    if (isOpen) {
      const active = document.activeElement;
      if (!returnFocusRef.current && active instanceof HTMLElement && active !== document.body) returnFocusRef.current = active;
      const nav = navRef.current;
      const target = nav?.querySelector<HTMLElement>(FOCUSABLE) ?? nav;
      requestAnimationFrame(() => target?.focus({ preventScroll: true }));
    } else if (returnFocusRef.current) {
      const back = returnFocusRef.current;
      returnFocusRef.current = null;
      const active = document.activeElement;
      if (back.isConnected && (!active || active === document.body || navRef.current?.contains(active))) {
        back.focus({ preventScroll: true });
      }
    }
  }, [isOpen]);

  const closeNav = useCallback(() => setOpen(false), []);
  const toggleNav = useCallback(() => setOpen((v) => !v), []);

  const value = useMemo<AppFrameContextValue>(
    () => ({ compact, open: isOpen, navId, returnFocusRef, setOpen, toggleNav, closeNav }),
    [compact, isOpen, navId, toggleNav, closeNav],
  );

  // Swipe the drawer shut. Touch only; the drawer follows the finger, then settles.
  const drag = useRef<{ x: number; y: number; t: number; locked: boolean; dx: number; w: number; id: number } | null>(null);
  const clearDrag = () => {
    const nav = navRef.current;
    if (nav) {
      nav.style.transform = "";
      nav.style.transition = "";
    }
    if (scrimRef.current) {
      scrimRef.current.style.opacity = "";
      scrimRef.current.style.transition = "";
    }
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isOpen || e.pointerType !== "touch") return;
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), locked: false, dx: 0, w: e.currentTarget.offsetWidth || 1, id: e.pointerId };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.locked) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      if (dx < -10) {
        d.locked = true;
        try {
          e.currentTarget.setPointerCapture(d.id);
        } catch {
          /* pointer already gone: keep dragging without capture */
        }
      } else return;
    }
    d.dx = Math.min(0, Math.max(-d.w, dx));
    const nav = navRef.current;
    if (nav) {
      nav.style.transition = "none";
      nav.style.transform = `translateX(${d.dx}px)`;
    }
    if (scrimRef.current) {
      scrimRef.current.style.transition = "none";
      scrimRef.current.style.opacity = String(1 + d.dx / d.w);
    }
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.locked) return;
    const velocity = d.dx / Math.max(1, performance.now() - d.t); // px/ms, negative = leftwards
    clearDrag();
    if (d.dx < -d.w * 0.3 || velocity < -0.5) setOpen(false);
  };

  return (
    <AppFrameContext.Provider value={value}>
      <div
        ref={rootRef}
        data-compact-below={compactBelow}
        data-compact={compact || undefined}
        className={cn("shavin-frame h-dvh", className)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && isOpen) {
            e.stopPropagation();
            setOpen(false);
          }
        }}
      >
        <div className="shavin-frame__inner">
          <div
            ref={navRef}
            id={navId}
            className="shavin-frame__nav"
            data-open={isOpen || undefined}
            role={compact ? "dialog" : undefined}
            aria-modal={isOpen || undefined}
            aria-label={compact ? navLabel : undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            {...inertProps(compact && !isOpen)}
          >
            {sidebar}
          </div>
          <div ref={scrimRef} className="shavin-frame__scrim" data-open={isOpen || undefined} aria-hidden onClick={closeNav} />
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden" {...inertProps(isOpen)}>
            {children}
          </main>
        </div>
      </div>
    </AppFrameContext.Provider>
  );
}

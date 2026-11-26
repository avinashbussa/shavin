"use client";
import * as React from "react";
import { MousePointer2, Palette, Settings, TriangleAlert, type LucideIcon } from "lucide-react";
import { IconButton } from "../primitives/IconButton";
import { Tooltip } from "../primitives/Tooltip";
import { Kbd } from "../primitives/Kbd";
import { cn } from "../lib/cn";
import { ShavinMark } from "./ShavinMark";
import { anchorStyle, isVertical, snapAnchor, stepAnchor, type Anchor } from "./barPlacement";
import { STR, TOOLS } from "./strings";
import { DOCK_H } from "./usePhone";

/** Select and Issues are modes (one at a time); Theme and Settings open panels (each on its own). */
export type ToolId = "select" | "issues";
export type PanelId = "theme" | "settings";
type BarId = ToolId | PanelId;

interface ToolDef {
  id: BarId;
  icon: LucideIcon;
}

const ICONS: ToolDef[] = [
  { id: "select", icon: MousePointer2 },
  { id: "issues", icon: TriangleAlert },
  { id: "theme", icon: Palette },
  { id: "settings", icon: Settings },
];

const DRAG_THRESHOLD = 4;

/** The phone dock: 56 px including its border, plus the device's bottom safe area. */
const DOCK_STYLE: React.CSSProperties = {
  height: `calc(${DOCK_H}px + env(safe-area-inset-bottom, 0px))`,
  paddingBottom: "env(safe-area-inset-bottom, 0px)",
  // ds-lint-disable-next-line no-unknown-class — a CSS value, not a class
  boxSizing: "border-box",
};

export interface ToolbarProps {
  active: ToolId | null;
  onChange: (tool: ToolId | null) => void;
  /** Panels that are open (they stay open next to a tool). */
  panels?: ReadonlySet<PanelId>;
  onPanel?: (panel: PanelId) => void;
  /** Findings that count (ignored ones do not): shown as a dot on the mark and on Issues. */
  errors: number;
  warnings: number;
  /** Plain-words state, announced politely and shown next to the tools. */
  mode: string;
  anchor: Anchor;
  onAnchor: (anchor: Anchor) => void;
  collapsed: boolean;
  onCollapsed: (collapsed: boolean) => void;
  /** Focus arrived from this page element (or none): lets the owner give focus back when the bar closes. */
  onFocusFrom?: (el: HTMLElement | null) => void;
  /** Under 640 px: a full-width bottom dock, icons only, 44 px targets, no dragging. */
  phone?: boolean;
}

/**
 * The inspector's control bar. Collapsed it is a 40 px round tile with the logo mark; expanded it is a bar that
 * leads with the mark (drag handle, click to collapse) followed by the tools. One tab stop, arrow keys move between
 * the mark and the tools (`Shift`+arrow on the mark moves the bar to the next anchor), Home and End jump.
 * The active tool has a subtle fill (never a solid one) and `aria-pressed`.
 */
export function Toolbar({ active, onChange, panels, onPanel, errors, warnings, mode, anchor, onAnchor, collapsed, onCollapsed, onFocusFrom, phone = false }: ToolbarProps): React.JSX.Element {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const barRef = React.useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = React.useState(0);
  const [dragPos, setDragPos] = React.useState<{ left: number; top: number } | null>(null);
  const justDragged = React.useRef(false);
  const vertical = isVertical(anchor) && !collapsed && !phone;
  const count = errors + warnings;
  const dotClass = errors > 0 ? "bg-danger" : "bg-warning";
  const slots = collapsed ? 1 : 1 + ICONS.length;

  const move = (to: number) => {
    const next = (to + slots) % slots;
    setFocusIndex(next);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      if (e.shiftKey && focusIndex === 0) {
        e.preventDefault();
        onAnchor(stepAnchor(anchor, e.key === "ArrowRight" ? "right" : "down"));
        return;
      }
      e.preventDefault();
      move(focusIndex + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      if (e.shiftKey && focusIndex === 0) {
        e.preventDefault();
        onAnchor(stepAnchor(anchor, e.key === "ArrowLeft" ? "left" : "up"));
        return;
      }
      e.preventDefault();
      move(focusIndex - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      move(0);
    } else if (e.key === "End") {
      e.preventDefault();
      move(slots - 1);
    }
  };

  // Dragging the mark: the bar follows the pointer, and on release snaps to the closest of the eight anchors.
  const onMarkPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || phone) return;
    const bar = barRef.current;
    if (!bar) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = bar.getBoundingClientRect();
    const grabX = startX - rect.left;
    const grabY = startY - rect.top;
    let dragging = false;
    const onMove = (ev: PointerEvent) => {
      if (!dragging && Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) return;
      dragging = true;
      setDragPos({ left: ev.clientX - grabX, top: ev.clientY - grabY });
    };
    const end = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (!dragging) return;
      justDragged.current = true;
      window.setTimeout(() => (justDragged.current = false), 0);
      const w = rect.width;
      const h = rect.height;
      const cx = ev.clientX - grabX + w / 2;
      const cy = ev.clientY - grabY + h / 2;
      onAnchor(snapAnchor(cx, cy, window.innerWidth, window.innerHeight, w, h));
      setDragPos(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  const position: React.CSSProperties = phone
    ? collapsed
      ? { position: "fixed", right: 12, bottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }
      : { position: "fixed", left: 0, right: 0, bottom: 0 }
    : dragPos
    ? { position: "fixed", left: dragPos.left, top: dragPos.top, transition: "none" }
    : { position: "fixed", ...anchorStyle(anchor), // ds-lint-disable-next-line no-unknown-class — a CSS value, not a class
      transition: "top var(--dur-base) var(--ease-out), left var(--dur-base) var(--ease-out), right var(--dur-base) var(--ease-out), bottom var(--dur-base) var(--ease-out)" };

  const mark = (
    <Tooltip side={vertical ? "right" : "top"} delayDuration={400} content={collapsed ? STR.expand : STR.collapse}>
      <button
        ref={(el) => {
          refs.current[0] = el;
        }}
        type="button"
        aria-label={collapsed ? STR.expand : STR.collapse}
        aria-expanded={!collapsed}
        tabIndex={focusIndex === 0 ? 0 : -1}
        onFocus={() => setFocusIndex(0)}
        onPointerDown={onMarkPointerDown}
        onClick={() => {
          if (justDragged.current) return;
          onCollapsed(!collapsed);
        }}
        data-shavin-mark=""
        style={{ touchAction: "none", ...(collapsed ? { width: phone ? 44 : 40, height: phone ? 44 : 40 } : phone ? { width: 44, height: 44 } : {}) }}
        className={cn(
          "relative flex shrink-0 cursor-grab select-none items-center justify-center text-fg active:cursor-grabbing",
          collapsed
            ? "rounded-full border border-hairline bg-elevated shadow-panel"
            : "h-8 w-8 rounded-[var(--radius-panel-p1,var(--radius-lg))] hover:bg-fg/[0.08]",
        )}
      >
        <ShavinMark size={collapsed ? 20 : 18} />
        {collapsed && count > 0 ? (
          <span aria-hidden="true" className={cn("absolute right-0 top-0 h-2.5 w-2.5 rounded-full ring-2 ring-[rgb(var(--bg-elevated))]", dotClass)} />
        ) : null}
      </button>
    </Tooltip>
  );

  return (
    <div
      ref={barRef}
      role="toolbar"
      aria-label={STR.toolbar}
      aria-orientation={vertical ? "vertical" : "horizontal"}
      onKeyDown={onKeyDown}
      onFocusCapture={(e) => {
        const from = e.relatedTarget as HTMLElement | null;
        if (!from || !barRef.current?.contains(from)) onFocusFrom?.(from && !from.closest?.("[data-shavin-inspector]") ? from : null);
      }}
      data-shavin-toolbar=""
      data-collapsed={collapsed ? "" : undefined}
      className={cn(
        "flex items-center text-fg",
        collapsed ? "" : phone ? "justify-around border-t border-hairline bg-elevated px-2 shadow-panel" : "gap-0.5 rounded-[var(--radius-panel)] border border-hairline bg-elevated p-1 shadow-panel",
        vertical ? "flex-col" : "h-auto",
      )}
      style={{ pointerEvents: "auto", ...(!collapsed && !vertical ? (phone ? DOCK_STYLE : { height: 40 }) : {}), ...position }}
    >
      {mark}
      {collapsed
        ? null
        : ICONS.map(({ id, icon: Icon }, n) => {
            const i = n + 1;
            const isPanel = id === "theme" || id === "settings";
            const on = isPanel ? !!panels?.has(id) : active === id;
            const def = TOOLS[id];
            const dot = id === "issues" ? count : 0;
            return (
              <Tooltip
                key={id}
                side={vertical ? "right" : "top"}
                delayDuration={400}
                content={
                  <span className="flex items-center gap-2">
                    {def.label}
                    <Kbd className="font-sans">{def.key}</Kbd>
                  </span>
                }
              >
                <IconButton
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  variant="ghost"
                  size="sm"
                  aria-label={def.label}
                  aria-pressed={on}
                  tabIndex={i === focusIndex ? 0 : -1}
                  onFocus={() => setFocusIndex(i)}
                  onClick={() => (isPanel ? onPanel?.(id) : onChange(on ? null : (id as ToolId)))}
                  style={phone ? { width: 44, height: 44 } : undefined}
                  className={cn("relative rounded-[var(--radius-panel-p1,var(--radius-lg))]", on && "bg-fg/[0.12] text-fg")}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  {dot > 0 ? (
                    <span aria-hidden="true" className={cn("absolute right-1 top-1 h-2 w-2 rounded-full ring-2 ring-[rgb(var(--bg-elevated))]", dotClass)} />
                  ) : null}
                </IconButton>
              </Tooltip>
            );
          })}
      {collapsed || vertical || phone || !mode ? (
        <span className="sr-only" aria-live="polite">
          {mode}
        </span>
      ) : (
        <span className="px-2 text-xs text-fg-muted" aria-live="polite">
          {mode}
        </span>
      )}
    </div>
  );
}

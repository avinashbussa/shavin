"use client";
import * as React from "react";
import type { Finding } from "../lib/inspector/schema";
import { MARKER_LIMITS, inViewport, planMarkers, type MarkerInput } from "./geometry";
import { resolveTarget } from "./targets";

export interface IssuesLayerProps {
  /** Findings that count: ignored ones get no marker and no tint. */
  findings: readonly Finding[];
  /** Finding highlighted from the list (row hover or focus). */
  activeId: string | null;
  onOpen: (id: string) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/**
 * Centre of the marker: just outside the element's top-left corner (about 6 px up and left), so it never sits on the
 * element's text. An element at the left edge of the viewport, or narrower than the 24 px hit area, gets it outside on
 * the left, centred vertically. Always kept so the whole 24 px hit area is inside the viewport.
 */
export function markerAnchor(rect: { x: number; y: number; w: number; h: number }, vw: number, vh: number): { x: number; y: number } {
  const side = rect.x < 14 || rect.w < 24;
  const x = side ? rect.x - 8 : rect.x - 6;
  const y = side ? rect.y + rect.h / 2 : rect.y - 6;
  // Half the 24 px hit area: the whole target stays on screen, not just its centre.
  return { x: clamp(x, 12, vw - 12), y: clamp(y, 12, vh - 12) };
}

interface Placed extends MarkerInput {
  el: Element;
  rect: { x: number; y: number; w: number; h: number };
  radius: string;
}

/**
 * Calm markers over the page: a small dot (error) or ring (warning) at an element's top-left and, when there are
 * few findings, a faint tint over the element. No outline, nothing dotted. At most 12 markers; the rest stay in
 * the list. Positions are re-read at most once a frame while the page scrolls or resizes.
 */
export function IssuesLayer({ findings, activeId, onOpen }: IssuesLayerProps): React.JSX.Element | null {
  const [tick, setTick] = React.useState(0);
  const elements = React.useMemo(() => findings.map((f) => ({ f, el: resolveTarget(f) })).filter((x): x is { f: Finding; el: Element } => !!x.el), [findings]);

  React.useEffect(() => {
    let frame = 0;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; setTick((t) => t + 1); });
    };
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    const poll = window.setInterval(schedule, 700);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", schedule);
      window.clearInterval(poll);
    };
  }, []);

  void tick;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const placed: Placed[] = [];
  for (const { f, el } of elements) {
    if (!el.isConnected) continue;
    const r = el.getBoundingClientRect();
    const rect = { x: r.x, y: r.y, w: r.width, h: r.height };
    if (rect.w <= 0 || rect.h <= 0 || !inViewport(rect, vw, vh)) continue;
    const at = markerAnchor(rect, vw, vh);
    placed.push({ id: f.id, severity: f.severity, x: at.x, y: at.y, el, rect, radius: getComputedStyle(el).borderRadius });
  }
  const plan = planMarkers(placed, MARKER_LIMITS, findings.length);
  const byId = new Map(placed.map((p) => [p.id, p]));
  const severityOf = new Map(findings.map((f) => [f.id, f.severity]));

  return (
    <div aria-hidden={false} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} data-shavin-markers="">
      {plan.tint
        ? placed.map((p) => (
            <div
              key={`tint-${p.id}`}
              aria-hidden="true"
              style={{ position: "fixed", left: p.rect.x, top: p.rect.y, width: p.rect.w, height: p.rect.h, borderRadius: p.radius, background: `rgb(var(--${p.severity === "error" ? "danger" : "warning"}) / 0.06)`, pointerEvents: "none", transition: "opacity var(--dur-instant) linear" }}
            />
          ))
        : null}
      {activeId && byId.get(activeId) ? (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: byId.get(activeId)!.rect.x,
            top: byId.get(activeId)!.rect.y,
            width: byId.get(activeId)!.rect.w,
            height: byId.get(activeId)!.rect.h,
            borderRadius: byId.get(activeId)!.radius,
            border: `1px solid rgb(var(--${severityOf.get(activeId) === "error" ? "danger" : "warning"}))`,
            background: `rgb(var(--${severityOf.get(activeId) === "error" ? "danger" : "warning"}) / 0.11)`,
            boxShadow: "0 0 0 2px rgb(var(--bg-elevated) / 0.6)",
            pointerEvents: "none",
            // ds-lint-disable-next-line no-unknown-class — a CSS value, not a class
            boxSizing: "border-box",
          }}
        />
      ) : null}
      {plan.markers.map((m) => {
        const first = findings.find((f) => f.id === m.ids[0]);
        const label = m.ids.length > 1 ? `${m.ids.length} findings here, first: ${first?.message ?? ""}` : first ? `${first.severity === "error" ? "Error" : "Warning"}: ${first.message}` : "Finding";
        const color = m.severity === "error" ? "danger" : "warning";
        const many = m.ids.length > 1;
        return (
          <button
            key={m.ids.join(",")}
            type="button"
            aria-label={label}
            onClick={() => onOpen(m.ids[0]!)}
            style={{ position: "fixed", left: m.x - 12, top: m.y - 12, width: 24, height: 24, display: "grid", placeItems: "center", background: "transparent", border: 0, padding: 0, cursor: "pointer", pointerEvents: "auto" }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "grid",
                placeItems: "center",
                width: many ? 18 : 8,
                height: many ? 18 : 8,
                borderRadius: "50%",
                // ds-lint-disable-next-line no-unknown-class — a CSS value, not a class
                boxSizing: "border-box",
                background: m.severity === "error" || many ? `rgb(var(--${color}))` : "transparent",
                border: m.severity === "warning" && !many ? `1.5px solid rgb(var(--${color}))` : "none",
                boxShadow: "0 0 0 1.5px rgb(var(--bg-elevated) / 0.85)",
                color: `rgb(var(--${color}-fg))`,
                fontSize: 10,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {many ? m.ids.length : null}
            </span>
          </button>
        );
      })}
      {plan.hidden > 0 ? (
        <div
          style={{ position: "fixed", left: 12, bottom: 64, pointerEvents: "none" }}
          className="rounded-full border border-hairline bg-elevated px-2 py-0.5 text-[11px] text-fg-muted shadow-panel"
        >
          +{plan.hidden} more in the list
        </div>
      ) : null}
    </div>
  );
}

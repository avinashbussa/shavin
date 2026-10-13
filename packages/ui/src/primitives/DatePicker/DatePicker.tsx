"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export interface DatePickerTokens {
  accent: string;
  accentFg: string;
  field: string;
  elevated: string;
  border: string;
  hover: string;
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  radius: string;
  popupRadius: string;
  cellRadius: string;
  font: string;
}

const DEFAULT_TOKENS: DatePickerTokens = {
  accent: "rgb(var(--accent))",
  accentFg: "rgb(var(--accent-fg))",
  field: "rgb(var(--bg-surface-hover))",
  elevated: "rgb(var(--bg-elevated))",
  border: "rgb(var(--hairline))",
  hover: "rgb(var(--bg-surface-hover))",
  fg: "rgb(var(--fg))",
  fgMuted: "rgb(var(--fg-muted))",
  fgSubtle: "rgb(var(--fg-subtle))",
  radius: "var(--radius-lg)",
  popupRadius: "var(--radius-panel)",
  cellRadius: "var(--radius-lg)",
  font: "inherit",
};

const POP_W = 288;
const POP_H = 360;

export interface DatePickerProps {
  /** Active selected Date object. */
  value: Date;
  /** Callback fired when Date changes. */
  onChange: (d: Date) => void;
  /** Hide time selection controls and close on day pick. Default false. */
  dateOnly?: boolean;
  /** Override any visual token; unspecified keys fall back to the theme. */
  tokens?: Partial<DatePickerTokens>;
  /** Optional custom CSS class name. */
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  dateOnly = false,
  tokens,
  className = "",
}: DatePickerProps) {
  const t = { ...DEFAULT_TOKENS, ...tokens };
  const vars = {
    "--dp-accent": t.accent,
    "--dp-accent-fg": t.accentFg,
    "--dp-field": t.field,
    "--dp-elevated": t.elevated,
    "--dp-border": t.border,
    "--dp-hover": t.hover,
    "--dp-fg": t.fg,
    "--dp-fg-muted": t.fgMuted,
    "--dp-fg-subtle": t.fgSubtle,
    "--dp-radius": t.radius,
    "--dp-popup-radius": t.popupRadius,
    "--dp-cell-radius": t.cellRadius,
    "--dp-font": t.font,
  } as React.CSSProperties;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => new Date(value));
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  function place() {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - POP_W - 8));
    let top = r.bottom + 6;
    if (top + POP_H > window.innerHeight) top = Math.max(8, r.top - POP_H - 6);
    setCoords({ top, left });
  }

  function openPicker() {
    setDraft(null);
    setView(new Date(value));
    place();
    setOpen(true);
  }

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const n = e.target as Node;
      if (!triggerRef.current?.contains(n) && !popRef.current?.contains(n)) {
        setOpen(false);
      }
    }
    function onScrollOrResize() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, { capture: true });
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, { capture: true });
    };
  }, [open]);

  const label = value.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(dateOnly ? {} : { hour: "numeric", minute: "2-digit" }),
  });

  function pickDay(d: Date) {
    setDraft(null);
    const next = new Date(value);
    next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    onChange(next);
    if (dateOnly) setOpen(false);
  }
  function setTime(h: number, m: number) {
    const next = new Date(value);
    next.setHours(h, m, 0, 0);
    onChange(next);
  }
  function commitDraft() {
    if (draft === null) return;
    const cleaned = draft.trim().replace(/^[A-Za-z]+,\s*/, "");
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      const next = new Date(value);
      next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
      onChange(next);
    }
    setDraft(null);
  }

  const today = new Date();
  const firstDow = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1),
    ),
  ];

  return (
    <>
      <div
        ref={triggerRef}
        style={{
          ...vars,
          background: "var(--dp-field)",
          border: "1px solid var(--dp-border)",
          borderRadius: "var(--dp-radius)",
          fontFamily: "var(--dp-font)",
          color: "var(--dp-fg)",
        }}
        className={`flex w-full items-center gap-1 px-3 py-2 text-sm ${className}`}
      >
        <input
          value={draft ?? label}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setDraft(label)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-full bg-transparent outline-none"
          style={{ color: "var(--dp-fg)" }}
          aria-label="Date"
        />
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openPicker())}
          aria-label="Open calendar"
          className="shrink-0"
          style={{ color: "var(--dp-fg-muted)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <rect x="3" y="4.5" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3 9h18M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open &&
        coords &&
        createPortal(
          <div
            ref={popRef}
            data-panel
            style={{
              ...vars,
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: POP_W,
              borderRadius: "var(--dp-popup-radius)",
              fontFamily: "var(--dp-font)",
              color: "var(--dp-fg)",
            }}
            className="animate-rise z-[80] p-3 shadow-panel border border-hairline"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
                className="px-2"
                style={{ color: "var(--dp-fg-muted)" }}
              >
                ‹
              </button>
              <span className="text-sm font-medium">
                {view.toLocaleString(undefined, { month: "long", year: "numeric" })}
              </span>
              <button
                type="button"
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
                className="px-2"
                style={{ color: "var(--dp-fg-muted)" }}
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div
                  key={i}
                  className="py-1 text-[10px] font-medium"
                  style={{ color: "var(--dp-fg-subtle)" }}
                >
                  {d}
                </div>
              ))}
              {cells.map((d, i) => {
                if (d === null) return <div key={`b${i}`} className="aspect-square" />;
                const selected = sameDay(d, value);
                const isToday = sameDay(d, today);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => pickDay(d)}
                    className={`aspect-square text-xs transition ${selected ? "" : "hover:bg-[var(--dp-hover)]"}`}
                    style={{
                      borderRadius: "var(--dp-cell-radius)",
                      ...(selected
                        ? {
                            background: "var(--dp-accent)",
                            color: "var(--dp-accent-fg)",
                            fontWeight: 600,
                          }
                        : isToday
                          ? {
                              color: "var(--dp-accent)",
                              fontWeight: 600,
                              boxShadow:
                                "inset 0 0 0 1.5px color-mix(in srgb, var(--dp-accent) 45%, transparent)",
                            }
                          : { color: "var(--dp-fg)" }),
                    }}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            {!dateOnly && (
              <div
                className="mt-3 flex items-center gap-2 pt-3"
                style={{ borderTop: "1px solid var(--dp-border)" }}
              >
                <span className="text-xs" style={{ color: "var(--dp-fg-muted)" }}>
                  Time
                </span>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={value.getHours()}
                  onChange={(e) => setTime(Number(e.target.value || 0), value.getMinutes())}
                  className="w-14 px-2 py-1 text-sm"
                  style={{
                    background: "var(--dp-field)",
                    border: "1px solid var(--dp-border)",
                    borderRadius: "var(--dp-radius)",
                    color: "var(--dp-fg)",
                  }}
                />
                <span style={{ color: "var(--dp-fg-muted)" }}>:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  value={value.getMinutes()}
                  onChange={(e) => setTime(value.getHours(), Number(e.target.value || 0))}
                  className="w-14 px-2 py-1 text-sm"
                  style={{
                    background: "var(--dp-field)",
                    border: "1px solid var(--dp-border)",
                    borderRadius: "var(--dp-radius)",
                    color: "var(--dp-fg)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ml-auto px-3 py-1 text-xs font-medium"
                  style={{
                    background: "var(--dp-accent)",
                    color: "var(--dp-accent-fg)",
                    borderRadius: "var(--dp-cell-radius)",
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

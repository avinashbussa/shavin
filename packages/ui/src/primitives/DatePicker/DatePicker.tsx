"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { announce } from "../../lib/announce";
import { useClientLocale } from "../../lib/useClientLocale";

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

const WEEKDAYS = [
  ["S", "Sunday"], ["M", "Monday"], ["T", "Tuesday"], ["W", "Wednesday"],
  ["T", "Thursday"], ["F", "Friday"], ["S", "Saturday"],
] as const;

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

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
  /** id of the text field, so a `<label htmlFor>` can name it. */
  id?: string;
  /** Locale for the field text and day names. Defaults to the browser's locale. */
  locale?: string;
  /** Accessible name of the text field when there is no visible label. Default "Date". */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** id(s) of hint or error text describing the field. */
  "aria-describedby"?: string;
}

export function DatePicker({
  value,
  onChange,
  dateOnly = false,
  tokens,
  className = "",
  id,
  locale,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
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

  const dateLocale = useClientLocale(locale);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => new Date(value));
  // Day holding the grid's single tab stop; arrows move it without selecting.
  const [focusDay, setFocusDay] = useState(() => new Date(value));
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(false);
  const monthId = useId();

  function onOpenChange(next: boolean) {
    if (next) {
      setDraft(null);
      setView(new Date(value));
      setFocusDay(new Date(value));
    }
    setOpen(next);
  }

  const label = value.toLocaleString(dateLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(dateOnly ? {} : { hour: "numeric", minute: "2-digit" }),
  });

  function pickDay(d: Date) {
    setDraft(null);
    setFocusDay(d);
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
      setInvalid(false);
    } else if (cleaned !== label) {
      // Keep the previous date, but say so instead of silently reverting (WCAG 3.3.1).
      setInvalid(true);
      announce("Date not recognised; kept the previous date");
    }
    setDraft(null);
  }

  function moveFocus(d: Date) {
    if (d.getFullYear() !== view.getFullYear() || d.getMonth() !== view.getMonth()) {
      setView(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    pendingFocus.current = true;
    setFocusDay(d);
  }

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }, [focusDay, view]);

  function onGridKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const from = focusDay;
    let next: Date | null = null;
    switch (e.key) {
      case "ArrowLeft": next = addDays(from, -1); break;
      case "ArrowRight": next = addDays(from, 1); break;
      case "ArrowUp": next = addDays(from, -7); break;
      case "ArrowDown": next = addDays(from, 7); break;
      case "Home": next = addDays(from, -from.getDay()); break;
      case "End": next = addDays(from, 6 - from.getDay()); break;
      case "PageUp":
      case "PageDown": {
        const dir = e.key === "PageUp" ? -1 : 1;
        const t = e.shiftKey
          ? new Date(from.getFullYear() + dir, from.getMonth(), 1)
          : new Date(from.getFullYear(), from.getMonth() + dir, 1);
        const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
        next = new Date(t.getFullYear(), t.getMonth(), Math.min(from.getDate(), last));
        break;
      }
    }
    if (!next) return;
    e.preventDefault();
    moveFocus(next);
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
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const focusInView = focusDay.getFullYear() === view.getFullYear() && focusDay.getMonth() === view.getMonth();
  const tabbable = focusInView ? focusDay.getDate() : 1;

  const fieldStyle = {
    background: "var(--dp-field)",
    border: tokens?.border ? "1px solid var(--dp-border)" : "1px solid rgb(var(--border-control))",
    borderRadius: "var(--dp-radius)",
    color: "var(--dp-fg)",
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Anchor asChild>
        <div
          style={{
            ...vars,
            background: "var(--dp-field)",
            // Field boundary uses the 3:1 control token unless the caller overrides `border`.
            border: tokens?.border ? "1px solid var(--dp-border)" : "1px solid rgb(var(--border-control))",
            borderRadius: "var(--dp-radius)",
            fontFamily: "var(--dp-font)",
            color: "var(--dp-fg)",
          }}
          className={`focus-ring-within flex w-full items-center gap-1 px-3 py-2 text-sm ${className}`}
        >
          <input
            id={id}
            value={draft ?? label}
            onChange={(e) => {
              setDraft(e.target.value);
              setInvalid(false);
            }}
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
            aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? "Date")}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            aria-invalid={invalid || undefined}
          />
          <PopoverPrimitive.Trigger asChild>
            <button
              type="button"
              aria-label="Choose date"
              // 16px icon, padded to a 28px target (WCAG 2.5.8, with room for scaled-down UIs).
              className="-m-1.5 shrink-0 rounded-[var(--radius-lg)] p-1.5"
              style={{ color: "var(--dp-fg-muted)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <rect x="3" y="4.5" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3 9h18M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </PopoverPrimitive.Trigger>
        </div>
      </PopoverPrimitive.Anchor>

      <PopoverPrimitive.Portal>
        {/* Radix gives dialog semantics, Escape, focus return to the trigger and
            collision-aware positioning that follows scroll instead of closing. */}
        <PopoverPrimitive.Content
          data-panel
          align="start"
          sideOffset={6}
          collisionPadding={8}
          aria-labelledby={monthId}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
          }}
          style={{
            ...vars,
            width: POP_W,
            borderRadius: "var(--dp-popup-radius)",
            fontFamily: "var(--dp-font)",
            color: "var(--dp-fg)",
          }}
          className="animate-rise z-[var(--z-floating)] p-3 shadow-panel border border-hairline"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-lg)]"
              style={{ color: "var(--dp-fg-muted)" }}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <span id={monthId} className="text-sm font-medium" aria-live="polite">
              {view.toLocaleString(dateLocale, { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-lg)]"
              style={{ color: "var(--dp-fg-muted)" }}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>

          {/* APG date grid: one tab stop; arrows by day/week, Home/End, PageUp/PageDown
              by month (Shift: year), Enter/Space picks. */}
          <div ref={gridRef} role="grid" aria-labelledby={monthId} onKeyDown={onGridKeyDown} className="flex flex-col gap-0.5">
            <div role="row" className="grid grid-cols-7 gap-0.5 text-center">
              {WEEKDAYS.map(([short, long]) => (
                <div
                  key={long}
                  role="columnheader"
                  aria-label={long}
                  className="py-1 text-xs font-medium"
                  style={{ color: "var(--dp-fg-subtle)" }}
                >
                  {short}
                </div>
              ))}
            </div>
            {weeks.map((week, w) => (
              <div key={w} role="row" className="grid grid-cols-7 gap-0.5 text-center">
                {week.map((d, i) => {
                  if (d === null) return <div key={`b${i}`} role="gridcell" className="aspect-square" />;
                  const selected = sameDay(d, value);
                  const isToday = sameDay(d, today);
                  return (
                    <div key={d.toISOString()} role="gridcell" aria-selected={selected}>
                      <button
                        type="button"
                        tabIndex={d.getDate() === tabbable ? 0 : -1}
                        aria-current={isToday ? "date" : undefined}
                        aria-label={d.toLocaleDateString(dateLocale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                        onClick={() => pickDay(d)}
                        onFocus={() => setFocusDay(d)}
                        className={`aspect-square w-full text-xs transition ${selected ? "" : "hover:bg-[var(--dp-hover)]"}`}
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
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {!dateOnly && (
            <div
              role="group"
              aria-label="Time"
              className="mt-3 flex items-center gap-2 pt-3"
              style={{ borderTop: "1px solid var(--dp-border)" }}
            >
              <span aria-hidden="true" className="text-xs" style={{ color: "var(--dp-fg-muted)" }}>
                Time
              </span>
              <input
                type="number"
                min={0}
                max={23}
                aria-label="Hours"
                value={value.getHours()}
                onChange={(e) => setTime(Number(e.target.value || 0), value.getMinutes())}
                className="w-14 px-2 py-1 text-sm"
                style={fieldStyle}
              />
              <span aria-hidden="true" style={{ color: "var(--dp-fg-muted)" }}>:</span>
              <input
                type="number"
                min={0}
                max={59}
                step={5}
                aria-label="Minutes"
                value={value.getMinutes()}
                onChange={(e) => setTime(value.getHours(), Number(e.target.value || 0))}
                className="w-14 px-2 py-1 text-sm"
                style={fieldStyle}
              />
              <PopoverPrimitive.Close asChild>
                <button
                  type="button"
                  className="ml-auto px-3 py-1 text-xs font-medium"
                  style={{
                    background: "var(--dp-accent)",
                    color: "var(--dp-accent-fg)",
                    borderRadius: "var(--dp-cell-radius)",
                  }}
                >
                  Done
                </button>
              </PopoverPrimitive.Close>
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

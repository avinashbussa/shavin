"use client";
import { useState, useMemo, type ReactNode, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { concentricContainerStyle, withConcentricStyle } from "../../lib/concentric";
import { Button } from "../Button/Button";
import { Text } from "../Text";
import { SegmentedControl, SegmentedControlItem } from "../SegmentedControl/SegmentedControl";

export type CalendarViewMode = "full" | "1day" | "2days" | "3days";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  tone?: "default" | "info" | "success" | "warning" | "danger";
  description?: string;
}

export interface CalendarProps {
  /** Currently anchored date (controlled). */
  date?: Date;
  /** Initial anchored date for uncontrolled mode. */
  defaultDate?: Date;
  /** Callback fired when anchored date changes. */
  onDateChange?: (date: Date) => void;

  /** Active view mode ("full", "1day", "2days", "3days"). */
  view?: CalendarViewMode;
  /** Default view mode for uncontrolled mode (defaults to "full"). */
  defaultView?: CalendarViewMode;
  /** Callback fired when view mode changes. */
  onViewChange?: (view: CalendarViewMode) => void;
  /** Allowed view modes for user switching (defaults to ["full", "1day", "2days", "3days"]). */
  allowedViews?: CalendarViewMode[];
  /** Whether user is allowed to toggle view modes (defaults to true). */
  allowViewChange?: boolean;

  /** Starting hour for schedule view (0–23, defaults to 0 for 12 AM). */
  startHour?: number;
  /** Ending hour for schedule view (0–23, defaults to 23 for 11 PM). */
  endHour?: number;

  /** List of events to display on the calendar. */
  events?: CalendarEvent[];
  /** Callback fired when a date cell or day header is clicked. */
  onSelectDate?: (date: Date) => void;
  /** Callback fired when an event chip is clicked. */
  onEventClick?: (event: CalendarEvent) => void;

  /** Stretch to fit parent container height & flex layout (defaults to true). */
  fitContainer?: boolean;
  className?: string;
  style?: CSSProperties;
}

const toneStyles: Record<NonNullable<CalendarEvent["tone"]>, string> = {
  default: "bg-surface-hover text-fg border-hairline",
  info: "bg-surface-hover text-link border-hairline",
  success: "bg-surface-hover text-success border-hairline",
  warning: "bg-surface-hover text-warning border-hairline",
  danger: "bg-surface-hover text-danger border-hairline",
};

export function CalendarEventChip({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}) {
  const style = toneStyles[event.tone ?? "default"];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-[var(--radius-lg)] border px-1.5 py-0.5 text-left text-xs font-medium transition hover:brightness-95 cursor-pointer",
        style
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
      <span className="truncate">{event.title}</span>
      {event.time && <span className="ml-auto shrink-0 text-[10px] opacity-70">{event.time}</span>}
    </button>
  );
}

function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function getHeaderTitle(anchor: Date, view: CalendarViewMode): string {
  if (view === "full") {
    return anchor.toLocaleString("default", { month: "long", year: "numeric" });
  }
  if (view === "1day") {
    return anchor.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  const end = addDays(anchor, view === "2days" ? 1 : 2);
  const startStr = anchor.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${startStr} – ${endStr}`;
}

function parseTimeMinutes(timeStr?: string): { startMinutes: number; durationMinutes: number } | null {
  if (!timeStr) return null;
  const parts = timeStr.split("-");
  const startRaw = parts[0].trim();
  const endRaw = parts[1]?.trim();

  const parseSingle = (raw: string): number | null => {
    const isPM = /pm/i.test(raw);
    const isAM = /am/i.test(raw);
    const clean = raw.replace(/[^\d:]/g, "");
    const sub = clean.split(":");
    if (!sub[0]) return null;
    let h = parseInt(sub[0], 10);
    const m = sub[1] ? parseInt(sub[1], 10) : 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
  };

  const startMinutes = parseSingle(startRaw);
  if (startMinutes === null) return null;
  let durationMinutes = 60;
  if (endRaw) {
    const endMinutes = parseSingle(endRaw);
    if (endMinutes !== null && endMinutes > startMinutes) {
      durationMinutes = endMinutes - startMinutes;
    }
  }
  return { startMinutes, durationMinutes };
}

export function CalendarView({
  date,
  defaultDate,
  onDateChange,
  view,
  defaultView = "full",
  onViewChange,
  allowedViews = ["full", "1day", "2days", "3days"],
  allowViewChange = true,
  startHour = 0,
  endHour = 23,
  events = [],
  onSelectDate,
  onEventClick,
  fitContainer = true,
  className,
  style,
}: CalendarProps) {
  const [currentAnchorState, setCurrentAnchorState] = useState<Date>(defaultDate ?? new Date());
  const [currentViewState, setCurrentViewState] = useState<CalendarViewMode>(defaultView);

  const anchor = date ?? currentAnchorState;
  const currentView = view ?? currentViewState;

  const hoursList = useMemo(() => {
    const s = Math.max(0, Math.min(23, startHour));
    const e = Math.max(s, Math.min(23, endHour));
    return Array.from({ length: e - s + 1 }, (_, i) => i + s);
  }, [startHour, endHour]);

  const setAnchor = (nextDate: Date) => {
    if (date === undefined) setCurrentAnchorState(nextDate);
    onDateChange?.(nextDate);
  };

  const setViewMode = (nextView: CalendarViewMode) => {
    if (view === undefined) setCurrentViewState(nextView);
    onViewChange?.(nextView);
  };

  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const headerTitle = useMemo(() => getHeaderTitle(anchor, currentView), [anchor, currentView]);

  const daysGrid = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const days: { date: Date; isCurrentMonth: boolean; dateKey: string }[] = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date: d, isCurrentMonth: false, dateKey: formatDateKey(d) });
    }

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      days.push({ date: d, isCurrentMonth: true, dateKey: formatDateKey(d) });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, dateKey: formatDateKey(d) });
    }

    return days;
  }, [year, month]);

  const scheduleDays = useMemo(() => {
    if (currentView === "1day") return [anchor];
    if (currentView === "2days") return [anchor, addDays(anchor, 1)];
    if (currentView === "3days") return [anchor, addDays(anchor, 1), addDays(anchor, 2)];
    return [];
  }, [anchor, currentView]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const evt of events) {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    }
    return map;
  }, [events]);

  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const handlePrev = () => {
    if (currentView === "full") {
      setAnchor(new Date(year, month - 1, 1));
    } else {
      const shift = currentView === "1day" ? 1 : currentView === "2days" ? 2 : 3;
      setAnchor(addDays(anchor, -shift));
    }
  };

  const handleNext = () => {
    if (currentView === "full") {
      setAnchor(new Date(year, month + 1, 1));
    } else {
      const shift = currentView === "1day" ? 1 : currentView === "2days" ? 2 : 3;
      setAnchor(addDays(anchor, shift));
    }
  };

  const handleToday = () => {
    const now = new Date();
    setAnchor(now);
    onSelectDate?.(now);
  };

  const canSwitchView = allowViewChange && allowedViews.length > 1;

  return (
    <div
      className={cn(
        "w-full rounded-[var(--radius-panel)] border border-hairline bg-surface p-4 shadow-card",
        fitContainer ? "flex flex-col h-full min-h-[550px]" : "",
        className
      )}
      style={withConcentricStyle(style, concentricContainerStyle("4"))}
    >
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <Text size="lg" weight="semibold" className="text-fg">
            {headerTitle}
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canSwitchView && (
            <SegmentedControl
              size="sm"
              value={currentView}
              onValueChange={(v) => v && setViewMode(v as CalendarViewMode)}
            >
              {allowedViews.includes("full") && <SegmentedControlItem value="full">Full</SegmentedControlItem>}
              {allowedViews.includes("1day") && <SegmentedControlItem value="1day">1 Day</SegmentedControlItem>}
              {allowedViews.includes("2days") && <SegmentedControlItem value="2days">2 Days</SegmentedControlItem>}
              {allowedViews.includes("3days") && <SegmentedControlItem value="3days">3 Days</SegmentedControlItem>}
            </SegmentedControl>
          )}

          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>

            <div className="flex items-center rounded-[var(--radius-lg)] border border-hairline bg-surface-hover/50 p-0.5">
              <button
                type="button"
                onClick={handlePrev}
                className="rounded p-1 text-fg-muted hover:bg-surface hover:text-fg transition cursor-pointer"
                aria-label="Previous date"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded p-1 text-fg-muted hover:bg-surface hover:text-fg transition cursor-pointer"
                aria-label="Next date"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {currentView === "full" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-2 grid grid-cols-7 gap-px text-center shrink-0">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1 text-xs font-medium text-fg-muted uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 border-t border-hairline/60 pt-2 flex-1 auto-rows-fr">
            {daysGrid.map(({ date: d, isCurrentMonth, dateKey }, index) => {
              const isToday = dateKey === todayKey;
              const isSelected =
                anchor &&
                anchor.getFullYear() === d.getFullYear() &&
                anchor.getMonth() === d.getMonth() &&
                anchor.getDate() === d.getDate();

              const dayEvents = eventsByDate[dateKey] ?? [];

              return (
                <div
                  key={index}
                  onClick={() => {
                    setAnchor(d);
                    onSelectDate?.(d);
                  }}
                  className={cn(
                    "group relative min-h-[4.5rem] sm:min-h-[5.5rem] rounded-[var(--radius-lg)] border border-hairline/40 p-1.5 transition hover:border-hairline hover:bg-surface-hover/50 cursor-pointer flex flex-col justify-between overflow-hidden",
                    !isCurrentMonth && "opacity-40 bg-surface-hover/20",
                    isSelected && "ring-2 ring-accent border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs font-medium text-fg",
                        isToday && "bg-accent text-accent-fg font-bold"
                      )}
                    >
                      {d.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="hidden sm:inline-block text-[10px] font-mono text-fg-muted">
                        {dayEvents.length} {dayEvents.length === 1 ? "evt" : "evts"}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-col gap-1">
                    {dayEvents.slice(0, 3).map((evt) => (
                      <CalendarEventChip key={evt.id} event={evt} onClick={onEventClick} />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="px-1 text-[10px] font-medium text-fg-muted">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentView !== "full" && (
        <div className="flex-1 flex flex-col border border-hairline/60 rounded-[var(--radius-lg)] overflow-hidden min-h-0 bg-surface">
          <div className="overflow-x-auto border-b border-hairline bg-surface-hover/40">
            <div
              className="grid divide-x divide-hairline/60"
              style={{
                gridTemplateColumns: `54px repeat(${scheduleDays.length}, minmax(120px, 1fr))`,
              }}
            >
              <div className="p-2 text-center text-[10px] font-mono uppercase text-fg-muted flex items-center justify-center">
                Time
              </div>
              {scheduleDays.map((d) => {
                const dateKey = formatDateKey(d);
                const isToday = dateKey === todayKey;
                return (
                  <div
                    key={dateKey}
                    onClick={() => {
                      setAnchor(d);
                      onSelectDate?.(d);
                    }}
                    className="p-2 text-center cursor-pointer hover:bg-surface-hover/60 transition"
                  >
                    <span className="block text-[10px] font-medium uppercase text-fg-muted">
                      {d.toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold mt-0.5",
                        isToday && "bg-accent text-accent-fg font-bold"
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-auto relative">
            <div
              className="grid divide-x divide-hairline/60 min-h-full"
              style={{
                gridTemplateColumns: `54px repeat(${scheduleDays.length}, minmax(120px, 1fr))`,
              }}
            >
              <div className="divide-y divide-hairline/30 bg-surface-hover/20">
                {hoursList.map((h) => (
                  <div key={h} className="h-16 pr-2 pt-1 text-right text-[10px] font-mono text-fg-muted">
                    {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                  </div>
                ))}
              </div>

              {scheduleDays.map((d) => {
                const dateKey = formatDateKey(d);
                const dayEvents = eventsByDate[dateKey] ?? [];

                return (
                  <div key={dateKey} className="relative divide-y divide-hairline/30 bg-surface">
                    {hoursList.map((h) => (
                      <div key={h} className="h-16 hover:bg-surface-hover/20 transition" />
                    ))}

                    <div className="absolute inset-0 pointer-events-none p-1">
                      {dayEvents.map((evt) => {
                        const parsed = parseTimeMinutes(evt.time);
                        let topPx = 4;
                        let heightPx = 52;

                        if (parsed) {
                          const minFromStart = parsed.startMinutes - startHour * 60;
                          const pxPerMin = 64 / 60;
                          topPx = Math.max(0, minFromStart * pxPerMin);
                          heightPx = Math.max(28, parsed.durationMinutes * pxPerMin);
                        }

                        return (
                          <div
                            key={evt.id}
                            style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                            className="absolute left-1 right-1 pointer-events-auto z-10"
                          >
                            <CalendarEventChip event={evt} onClick={onEventClick} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Calendar(props: CalendarProps) {
  return <CalendarView {...props} />;
}

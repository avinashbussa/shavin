"use client";
import { useEffect, useState } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../Button/Button";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover/Popover";
import { Select } from "../Select/Select";

function buildOptions(intervalMinutes: number) {
  const count = Math.ceil((24 * 60) / intervalMinutes);
  return Array.from({ length: count }, (_, i) => {
    const totalMinutes = i * intervalMinutes;
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return {
      value: `${hh}:${mm}`,
      label: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    };
  });
}

export interface TimePickerProps {
  /** Currently selected Date object. */
  value: Date;
  /** Callback fired when selected time changes. */
  onChange: (d: Date) => void;
  /** Screen reader label for accessibility. */
  ariaLabel?: string;
  /** Minutes between each option in select dropdown — 15, 30, 60, etc. Default 30. */
  intervalMinutes?: number;
}

export function TimePicker({
  value,
  onChange,
  ariaLabel = "Time",
  intervalMinutes = 30,
}: TimePickerProps) {
  const cur = `${String(value.getHours()).padStart(2, "0")}:${String(
    value.getMinutes(),
  ).padStart(2, "0")}`;
  const generated = buildOptions(intervalMinutes);
  const options = generated.some((o) => o.value === cur)
    ? generated
    : [
        {
          value: cur,
          label: value.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          }),
        },
        ...generated,
      ];

  return (
    <Select
      value={cur}
      ariaLabel={ariaLabel}
      options={options}
      onChange={(v) => {
        const [h, m] = v.split(":").map(Number);
        const next = new Date(value);
        next.setHours(h, m, 0, 0);
        onChange(next);
      }}
    />
  );
}

export interface TimeVariantProps {
  value: Date;
  onChange: (d: Date) => void;
  ariaLabel?: string;
}

function to12Hour(h24: number): { h12: number; period: "AM" | "PM" } {
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { h12, period };
}

const segmentClass =
  "w-9 rounded-[var(--radius-lg)] border border-hairline bg-surface-hover px-2 py-1.5 text-center text-sm tabular-nums text-fg outline-none placeholder:text-fg-subtle focus:border-hairline-strong";

export function TimePickerInput({ value, onChange, ariaLabel = "Time" }: TimeVariantProps) {
  const { h12, period } = to12Hour(value.getHours());
  const [hourStr, setHourStr] = useState(String(h12).padStart(2, "0"));
  const [minStr, setMinStr] = useState(String(value.getMinutes()).padStart(2, "0"));

  useEffect(() => {
    const next = to12Hour(value.getHours());
    setHourStr(String(next.h12).padStart(2, "0"));
    setMinStr(String(value.getMinutes()).padStart(2, "0"));

  }, [value.getTime()]);

  function commit(hStr: string, mStr: string, per: "AM" | "PM") {
    const h = Math.min(12, Math.max(1, parseInt(hStr, 10) || 12));
    const m = Math.min(59, Math.max(0, parseInt(mStr, 10) || 0));
    const h24 = per === "AM" ? h % 12 : (h % 12) + 12;
    const next = new Date(value);
    next.setHours(h24, m, 0, 0);
    onChange(next);
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <input
        value={hourStr}
        onChange={(e) => setHourStr(e.target.value.replace(/\D/g, "").slice(0, 2))}
        onBlur={() => commit(hourStr, minStr, period)}
        placeholder="HH"
        inputMode="numeric"
        aria-label={`${ariaLabel} — hours`}
        className={segmentClass}
      />
      <span className="text-fg-muted">:</span>
      <input
        value={minStr}
        onChange={(e) => setMinStr(e.target.value.replace(/\D/g, "").slice(0, 2))}
        onBlur={() => commit(hourStr, minStr, period)}
        placeholder="MM"
        inputMode="numeric"
        aria-label={`${ariaLabel} — minutes`}
        className={segmentClass}
      />
      <button
        type="button"
        onClick={() => commit(hourStr, minStr, period === "AM" ? "PM" : "AM")}
        aria-label={`${ariaLabel} — toggle AM/PM, currently ${period}`}
        className="rounded-[var(--radius-lg)] border border-hairline bg-surface-hover px-2.5 py-1.5 text-sm font-medium text-fg transition hover:bg-surface"
      >
        {period}
      </button>
    </div>
  );
}

const CLOCK_SIZE = 216;
const CLOCK_RADIUS = 84;
const CLOCK_CENTER = CLOCK_SIZE / 2;

function angleForPos(posIndex: number) {
  return posIndex * 30 - 90;
}
function markPosition(posIndex: number) {
  const rad = (angleForPos(posIndex) * Math.PI) / 180;
  return { x: CLOCK_CENTER + CLOCK_RADIUS * Math.cos(rad), y: CLOCK_CENTER + CLOCK_RADIUS * Math.sin(rad) };
}

export function TimePickerClock({ value, onChange, ariaLabel = "Time" }: TimeVariantProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"hour" | "minute">("hour");
  const { h12, period } = to12Hour(value.getHours());
  const minute = value.getMinutes();

  function pickHour(h: number) {
    const h24 = period === "AM" ? h % 12 : (h % 12) + 12;
    const next = new Date(value);
    next.setHours(h24, minute, 0, 0);
    onChange(next);
    setMode("minute");
  }
  function pickMinute(m: number) {
    const next = new Date(value);
    next.setHours(value.getHours(), m, 0, 0);
    onChange(next);
  }
  function setPeriod(p: "AM" | "PM") {
    const h24 = p === "AM" ? h12 % 12 : (h12 % 12) + 12;
    const next = new Date(value);
    next.setHours(h24, minute, 0, 0);
    onChange(next);
  }

  const handAngle = angleForPos(mode === "hour" ? h12 % 12 : Math.round(minute / 5) % 12);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label={ariaLabel} className="tabular-nums">
          {value.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto">
        <div className="mb-4 flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode("hour")}
            className={cn(
              "rounded-[var(--radius-lg)] px-2 py-1 text-3xl font-semibold tabular-nums transition",
              // ds-lint-disable-next-line no-rgb — accent fill background
              mode === "hour" ? "bg-[rgb(var(--accent)/0.12)] text-accent" : "text-fg-muted hover:text-fg",
            )}
          >
            {String(h12).padStart(2, "0")}
          </button>
          <span className="text-3xl font-semibold text-fg-muted">:</span>
          <button
            type="button"
            onClick={() => setMode("minute")}
            className={cn(
              "rounded-[var(--radius-lg)] px-2 py-1 text-3xl font-semibold tabular-nums transition",
              // ds-lint-disable-next-line no-rgb — accent fill background
              mode === "minute" ? "bg-[rgb(var(--accent)/0.12)] text-accent" : "text-fg-muted hover:text-fg",
            )}
          >
            {String(minute).padStart(2, "0")}
          </button>
          <button
            type="button"
            onClick={() => setPeriod(period === "AM" ? "PM" : "AM")}
            aria-label={`Toggle AM/PM, currently ${period}`}
            className="ml-2 rounded-[var(--radius-lg)] border border-hairline px-2.5 py-1.5 text-sm font-medium text-fg transition hover:bg-surface-hover"
          >
            {period}
          </button>
        </div>

        <div
          className="relative mx-auto rounded-full bg-surface-hover"
          style={{ width: CLOCK_SIZE, height: CLOCK_SIZE }}
        >
          <div
            className="absolute origin-left rounded-full bg-accent"
            style={{ left: CLOCK_CENTER, top: CLOCK_CENTER - 1, width: CLOCK_RADIUS - 16, height: 2, transform: `rotate(${handAngle}deg)` }}
          />
          <div
            className="absolute h-2 w-2 rounded-full bg-accent"
            style={{ left: CLOCK_CENTER - 4, top: CLOCK_CENTER - 4 }}
          />

          {mode === "hour"
            ? Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                const { x, y } = markPosition(h % 12);
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => pickHour(h)}
                    className={cn(
                      "absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-sm transition",
                      h12 === h ? "bg-accent text-accent-fg" : "text-fg hover:bg-surface",
                    )}
                    style={{ left: x, top: y }}
                  >
                    {h}
                  </button>
                );
              })
            : Array.from({ length: 12 }, (_, i) => i * 5).map((m) => {
                const { x, y } = markPosition(m / 5);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => pickMinute(m)}
                    className={cn(
                      "absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-sm tabular-nums transition",
                      minute === m ? "bg-accent text-accent-fg" : "text-fg hover:bg-surface",
                    )}
                    style={{ left: x, top: y }}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                );
              })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";
import {
  forwardRef,
  useState,
  useRef,
  useCallback,
  useMemo,
  useId,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const trackRadiusVariants = cva("relative h-1.5 grow overflow-hidden bg-surface-hover/80 border border-hairline/60", {
  variants: {
    radius: {
      none: "rounded-none",
      small: "rounded-[0.25rem]",
      medium: "rounded-[0.5rem]",
      large: "rounded-[0.75rem]",
      full: "rounded-full",
      inherit: "rounded-[var(--radius-lg)]",
      concentric: "rounded-panel-inner",
    },
  },
  defaultVariants: { radius: "inherit" },
});

export const rangeRadiusVariants = cva("absolute h-full bg-accent", {
  variants: {
    radius: {
      none: "rounded-none",
      small: "rounded-[0.25rem]",
      medium: "rounded-[0.5rem]",
      large: "rounded-[0.75rem]",
      full: "rounded-full",
      inherit: "rounded-[var(--radius-lg)]",
      concentric: "rounded-panel-inner",
    },
  },
  defaultVariants: { radius: "inherit" },
});

export const thumbRadiusVariants = cva(
  "block h-4 w-4 border border-border-control bg-surface shadow-card transition-all duration-150 hover:border-accent hover:scale-105 cursor-pointer active:scale-95",
  {
    variants: {
      radius: {
        none: "rounded-none",
        small: "rounded-[0.2rem]",
        medium: "rounded-[0.35rem]",
        large: "rounded-[0.5rem]",
        full: "rounded-full",
        inherit: "rounded-[var(--radius-lg)]",
        concentric: "rounded-panel-inner",
      },
    },
    defaultVariants: { radius: "inherit" },
  }
);

export type SliderRootProps = ComponentPropsWithoutRef<typeof RadixSlider.Root>;

export interface CapsuleSliderProps {
  /** Text or React element label shown inside the slider pill. */
  label?: ReactNode;
  /** Numerical value or single-element array. */
  value?: number | number[];
  /** Default value when uncontrolled. */
  defaultValue?: number | number[];
  /** Minimum range bound. Default 0. */
  min?: number;
  /** Maximum range bound. Default 100. */
  max?: number;
  /** Step increment / snapping granularity. Default 1. */
  step?: number;
  /** Formatter for live value display text (e.g. (v) => `${v}px` or `${v}%`). */
  formatValue?: (val: number) => string;
  /** Callback fired when slider value updates. */
  onValueChange?: (val: any) => void;
  /** Custom CSS classes. */
  className?: string;
  /** Whether the slider is disabled. */
  disabled?: boolean;
  /** Active fill color style: "accent" (uses active theme accent token) or "mono" (inverting monochrome). Default "accent". */
  color?: "accent" | "mono";
  /** Whether to show subtle tick marks on hover. Default true when steps count is between 3 and 30. */
  showStops?: boolean;
  /** Explicit array of stop values (e.g. [0, 25, 50, 75, 100]) or "auto" for auto-calculated stops based on step. */
  marks?: number[] | "auto";
}

export function CapsuleSlider({
  label,
  value: controlledValue,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  formatValue,
  onValueChange,
  className,
  disabled = false,
  color = "accent",
  showStops,
  marks,
  "aria-label": ariaLabel,
}: CapsuleSliderProps & { "aria-label"?: string }) {
  const [internalValue, setInternalValue] = useState<number>(() => {
    if (defaultValue !== undefined) {
      return Array.isArray(defaultValue) ? defaultValue[0] ?? min : defaultValue;
    }
    return min;
  });

  const rawValue = controlledValue !== undefined
    ? (Array.isArray(controlledValue) ? controlledValue[0] ?? min : controlledValue)
    : internalValue;

  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  const clampedValue = Math.max(min, Math.min(max, rawValue));
  const percent = max > min ? ((clampedValue - min) / (max - min)) * 100 : 0;
  const displayVal = formatValue ? formatValue(clampedValue) : clampedValue.toString();

  // Compute stop mark percentages safely
  const stopPercentages = useMemo(() => {
    if (Array.isArray(marks) && marks.length > 0) {
      return marks
        .filter((m) => m > min && m < max)
        .map((m) => ((m - min) / (max - min)) * 100);
    }
    const count = step > 0 ? Math.round((max - min) / step) : 0;
    const shouldShow = marks === "auto" || (showStops ?? (count >= 3 && count <= 30));
    if (shouldShow && count >= 2 && count <= 30) {
      const stops: number[] = [];
      for (let i = 1; i < count; i++) {
        stops.push(((i * step) / (max - min)) * 100);
      }
      return stops;
    }
    return [];
  }, [marks, showStops, min, max, step]);

  const updateFromPointer = useCallback(
    (clientX: number) => {
      const elem = trackRef.current;
      if (!elem || disabled) return;
      const rect = elem.getBoundingClientRect();
      if (rect.width <= 0) return;

      const rawRatio = (clientX - rect.left) / rect.width;
      const clampedRatio = Math.max(0, Math.min(1, rawRatio));
      const calculatedVal = min + clampedRatio * (max - min);
      const steppedVal = Math.round(calculatedVal / step) * step;
      const precision = (step.toString().split(".")[1] || "").length;
      const finalVal = Number(Math.max(min, Math.min(max, steppedVal)).toFixed(precision));

      if (controlledValue === undefined) {
        setInternalValue(finalVal);
      }
      if (onValueChange) {
        if (Array.isArray(controlledValue) || Array.isArray(defaultValue)) {
          onValueChange([finalVal]);
        } else {
          onValueChange(finalVal);
        }
      }
    },
    [min, max, step, controlledValue, defaultValue, onValueChange, disabled]
  );

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Only the primary button (left mouse, touch, pen tip) drags; right- and middle-clicks do not.
    if (disabled || e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;
    // The release can go missing (context menu, window switch); with no button held, the drag is over.
    if (e.pointerType === "mouse" && (e.buttons & 1) === 0) {
      setIsDragging(false);
      return;
    }
    updateFromPointer(e.clientX);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Losing pointer capture (another element took it, the pointer was cancelled) also ends the drag.
  const handleLostPointerCapture = () => setIsDragging(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const precision = (step.toString().split(".")[1] || "").length;
    let nextVal = clampedValue;

    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      nextVal = Math.min(max, clampedValue + step);
      e.preventDefault();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      nextVal = Math.max(min, clampedValue - step);
      e.preventDefault();
    } else if (e.key === "PageUp") {
      // Bigger jumps of ten steps, as the WAI-ARIA slider pattern suggests.
      nextVal = Math.min(max, clampedValue + step * 10);
      e.preventDefault();
    } else if (e.key === "PageDown") {
      nextVal = Math.max(min, clampedValue - step * 10);
      e.preventDefault();
    } else if (e.key === "Home") {
      nextVal = min;
      e.preventDefault();
    } else if (e.key === "End") {
      nextVal = max;
      e.preventDefault();
    }

    const rounded = Number(nextVal.toFixed(precision));
    if (rounded !== rawValue) {
      if (controlledValue === undefined) {
        setInternalValue(rounded);
      }
      if (onValueChange) {
        if (Array.isArray(controlledValue) || Array.isArray(defaultValue)) {
          onValueChange([rounded]);
        } else {
          onValueChange(rounded);
        }
      }
    }
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={clampedValue}
      aria-valuetext={String(displayVal)}
      // Name: an explicit aria-label, else a string label, else the visible label element.
      aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
      aria-labelledby={ariaLabel === undefined && typeof label !== "string" && label != null ? labelId : undefined}
      aria-disabled={disabled}
      data-dragging={isDragging}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handleLostPointerCapture}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative h-8 w-full rounded-[var(--radius-lg)] border border-hairline/80 overflow-hidden cursor-ew-resize select-none touch-none transition-all duration-150",
        "bg-surface-hover/50 dark:bg-canvas/80 hover:border-hairline-strong",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {/* 1. Base Layer Stops */}
      {stopPercentages.length > 0 && (
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out",
            isDragging ? "opacity-50" : "opacity-0 group-hover:opacity-35"
          )}
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, transparent 60px, black 80px, black calc(100% - 50px), transparent 100%)",
            maskImage: "linear-gradient(to right, transparent 0%, transparent 60px, black 80px, black calc(100% - 50px), transparent 100%)",
          }}
        >
          {stopPercentages.map((stopPct, idx) => (
            <span
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[1px] h-2.5 rounded-full bg-fg/40 dark:bg-fg/50"
              style={{ left: `${stopPct}%` }}
            />
          ))}
        </div>
      )}

      {/* 2. Base Layer: Unfilled Track Content */}
      <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
        <span id={labelId} className="text-xs font-medium text-fg-subtle truncate" aria-hidden="true">{label}</span>
        <span className="text-xs text-fg-muted shrink-0 ml-2 tabular-nums" aria-hidden="true">{displayVal}</span>
      </div>

      {/* 3. Clipped Active Fill Layer */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none",
          color === "accent"
            ? "bg-accent text-accent-fg"
            : "bg-fg text-canvas",
          isDragging ? "transition-none" : "transition-[clip-path] duration-150 ease-out"
        )}
        style={{
          clipPath: `inset(0 calc(100% - ${percent}%) 0 0)`,
        }}
      >
        {/* Inverted Text Layer */}
        <div className="flex items-center justify-between w-full h-full px-3 text-xs font-medium pointer-events-none" aria-hidden="true">
          <span className="truncate">{label}</span>
          <span
            className={cn(
              "shrink-0 ml-2 tabular-nums",
              color === "accent" ? "text-accent-fg/90" : "text-canvas/90"
            )}
          >
            {displayVal}
          </span>
        </div>

        {/* 4. Active state indicator thumb pill */}
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-3.5 w-[2px] rounded-full pointer-events-none",
            color === "accent" ? "bg-accent-fg/90" : "bg-canvas/90",
            isDragging
              ? percent <= 0.5 ? "opacity-0" : "opacity-100 transition-none"
              : percent <= 0.5 ? "opacity-0" : "opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          )}
          style={{
            left: `clamp(4px, calc(${percent}% - 5px), calc(100% - 6px))`,
          }}
        />
      </div>
    </div>
  );
}

export interface SliderProps
  extends Omit<SliderRootProps, "value" | "defaultValue" | "onValueChange">,
    VariantProps<typeof trackRadiusVariants> {
  /** Visual variant: "default" (standard track & thumb) or "capsule" (sleek compact pill with embedded label and live fill value). */
  variant?: "default" | "capsule";
  /** Current value: number[] (e.g. [40]) or single number (e.g. 40). */
  value?: number[] | number;
  /** Default value when uncontrolled. */
  defaultValue?: number[] | number;
  /** Value change callback. */
  onValueChange?: (val: any) => void;
  /** Optional array of numeric tick mark values drawn on the track (e.g. [0, 50, 100]) or "auto" for auto-calculated stops based on step. */
  marks?: number[] | "auto";
  /** Label text or ReactNode displayed inside capsule slider track (when variant="capsule"). */
  label?: ReactNode;
  /** Formatter function for displaying formatted value string in capsule mode (e.g. (v) => `${v}px`). */
  formatValue?: (val: number) => string;
  /** Fill color style in capsule mode: "accent" (active theme accent) or "mono" (monochrome inverting). Default "accent". */
  color?: "accent" | "mono";
  /** Whether to show subtle stop ticks on hover in capsule mode. Default true for discrete steps (3–30). */
  showStops?: boolean;
}

export const Slider = forwardRef<
  ElementRef<typeof RadixSlider.Root>,
  SliderProps
>(function Slider(
  {
    variant = "default",
    className,
    value,
    defaultValue,
    radius,
    marks,
    min = 0,
    max = 100,
    step = 1,
    label,
    formatValue,
    color,
    showStops,
    onValueChange,
    disabled,
    ...props
  },
  ref,
) {
  // ── Standard Default Track Variant ──
  const normalizedValue = value !== undefined
    ? (Array.isArray(value) ? value : [value])
    : undefined;

  const normalizedDefaultValue = defaultValue !== undefined
    ? (Array.isArray(defaultValue) ? defaultValue : [defaultValue])
    : undefined;

  const thumbCount = normalizedValue?.length ?? normalizedDefaultValue?.length ?? 1;
  // Radix puts role="slider" on the thumb, so the accessible name must live there, not on the root.
  const { "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...rootProps } = props as typeof props & {
    "aria-label"?: string;
    "aria-labelledby"?: string;
  };

  // Name each thumb: the consumer's aria-label, else a string `label`; a two-thumb range
  // says which end is which.
  const baseName = ariaLabel ?? (typeof label === "string" ? label : undefined);
  const thumbName = (i: number) => {
    if (!baseName) return undefined;
    if (thumbCount === 2) return `${baseName}, ${i === 0 ? "minimum" : "maximum"}`;
    return thumbCount > 1 ? `${baseName} ${i + 1}` : baseName;
  };

  // Compute marks for track
  const calculatedMarks = useMemo(() => {
    if (Array.isArray(marks)) {
      return marks.filter((m) => m >= min && m <= max);
    }
    if (marks === "auto" && step > 0) {
      const count = Math.round((max - min) / step);
      if (count >= 1 && count <= 50) {
        const list: number[] = [];
        for (let i = 0; i <= count; i++) {
          list.push(min + i * step);
        }
        return list;
      }
    }
    return [];
  }, [marks, min, max, step]);

  // ── Capsule Variant ── (after the hooks above, so hook order never changes)
  if (variant === "capsule") {
    return (
      <CapsuleSlider
        label={label}
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        formatValue={formatValue}
        onValueChange={onValueChange}
        className={className}
        disabled={disabled}
        color={color}
        showStops={showStops}
        marks={marks}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <RadixSlider.Root
      ref={ref}
      value={normalizedValue}
      defaultValue={normalizedDefaultValue}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onValueChange={(vals) => {
        if (onValueChange) {
          if (typeof value === "number" || typeof defaultValue === "number") {
            onValueChange(vals[0]);
          } else {
            onValueChange(vals);
          }
        }
      }}
      className={cn("relative flex h-4 w-full touch-none select-none items-center", className)}
      {...rootProps}
    >
      <RadixSlider.Track className={trackRadiusVariants({ radius })}>
        <RadixSlider.Range className={rangeRadiusVariants({ radius })} />
        {calculatedMarks.map((mark) => (
          <span
            key={mark}
            className="absolute top-1/2 h-2 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hairline-strong pointer-events-none"
            style={{ left: `${((mark - min) / (max - min)) * 100}%` }}
          />
        ))}
      </RadixSlider.Track>
      {Array.from({ length: thumbCount }).map((_, i) => (
        <RadixSlider.Thumb
          key={i}
          className={thumbRadiusVariants({ radius })}
          aria-label={thumbName(i)}
          aria-labelledby={ariaLabelledBy}
        />
      ))}
    </RadixSlider.Root>
  );
});


"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Pipette, ChevronsUpDown } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../lib/cn";
import { ACCENT_PRESETS } from "../../lib/theme-presets";

export const colorPickerVariants = cva(
  "flex flex-col gap-3 rounded-[var(--radius-panel)] border border-hairline bg-surface p-3 shadow-card",
  {
    variants: {
      size: {
        sm: "max-w-[240px] text-xs",
        md: "max-w-[280px] text-xs",
        lg: "max-w-[320px] text-sm",
        full: "w-full max-w-none text-xs",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface ColorPickerSwatch {
  name: string;
  hex: string;
}

export interface ColorPickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof colorPickerVariants> {
  /** The currently selected hex color string (e.g. "#46a758"). */
  value: string;
  /** Callback fired when the color changes. */
  onChange: (hex: string) => void;
  /** Visual variant: "popover" (default triggerable popover), "canvas" (inline 2D canvas), "swatches" (preset swatches grid), or "field" (compact input). */
  variant?: "popover" | "canvas" | "swatches" | "field" | "default";
  /** Optional custom trigger element when using popover mode. */
  trigger?: React.ReactNode;
  /** Preset swatch spectrum. Defaults to Shavin UI's 24 accent swatches. */
  presets?: ColorPickerSwatch[];
  /** Layout of preset swatches: multi-row grid or single-row horizontal scroll bar. Default "grid". */
  swatchLayout?: "grid" | "scroll";
  /** Maximum number of swatches to render from presets list. */
  maxSwatches?: number;
  /** Format mode for custom color input: "hex" or "rgb". Default "hex". */
  colorMode?: "hex" | "rgb";
  /** Custom label text or element for the custom color input section. Default "Custom". */
  customLabel?: React.ReactNode;
  /** Custom CSS class names to style the custom mode label text/font/size/color. */
  customLabelClassName?: string;
  /** Whether to display the custom eyedropper pipette and text input. Default true. */
  allowCustom?: boolean;
}

// ds-lint-disable-next-line no-rgb — fallback RGB format string
const DEFAULT_RGB_STR = "rgb(0, 0, 0)";
// ds-lint-disable-next-line no-hex — fallback Hex format string
const DEFAULT_HEX_STR = "#000000";

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // ds-lint-disable-next-line no-hex — color parsing utility
  const clean = (hex || "").replace(/^#/, "");
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16) || 0,
      g: parseInt(clean[1] + clean[1], 16) || 0,
      b: parseInt(clean[2] + clean[2], 16) || 0,
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16) || 0,
      g: parseInt(clean.slice(2, 4), 16) || 0,
      b: parseInt(clean.slice(4, 6), 16) || 0,
    };
  }
  return { r: 0, g: 0, b: 0 };
}

export function hexToRgbStr(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = (h % 360) / 360;
  s = s / 100;
  v = v / 100;
  let r = 0,
    g = 0,
    b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 2D Canvas Color Picker Panel with Saturation/Value matrix, Rainbow hue slider,
 * Eyedropper, preview swatch, and right-end up-down arrow switcher (HEX / RGB).
 */
export function CanvasColorPickerPopup({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  // ds-lint-disable-next-line no-hex — hex fallback
  const cleanValue = value || "#000000";
  const rgb = useMemo(() => hexToRgb(cleanValue), [cleanValue]);
  const hsv = useMemo(() => rgbToHsv(rgb.r, rgb.g, rgb.b), [rgb]);

  const [hue, setHue] = useState(hsv.h);
  const [sat, setSat] = useState(hsv.s);
  const [val, setVal] = useState(hsv.v);
  const [formatMode, setFormatMode] = useState<"HEX" | "RGB">("HEX");

  const satValRef = useRef<HTMLDivElement>(null);
  const isDraggingSatVal = useRef(false);

  useEffect(() => {
    setHue(hsv.h);
    setSat(hsv.s);
    setVal(hsv.v);
  }, [cleanValue]);

  const updateFromSatVal = useCallback(
    (clientX: number, clientY: number) => {
      if (!satValRef.current) return;
      const rect = satValRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
      const s = Math.round((x / rect.width) * 100);
      const v = Math.round((1 - y / rect.height) * 100);
      setSat(s);
      setVal(v);
      const { r, g, b } = hsvToRgb(hue, s, v);
      onChange(rgbToHex(r, g, b));
    },
    [hue, onChange]
  );

  const handlePointerDownSatVal = (e: React.PointerEvent) => {
    isDraggingSatVal.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromSatVal(e.clientX, e.clientY);
  };

  const handlePointerMoveSatVal = (e: React.PointerEvent) => {
    if (isDraggingSatVal.current) updateFromSatVal(e.clientX, e.clientY);
  };

  const handlePointerUpSatVal = (e: React.PointerEvent) => {
    isDraggingSatVal.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleHueChange = (newHue: number) => {
    setHue(newHue);
    const { r, g, b } = hsvToRgb(newHue, sat, val);
    onChange(rgbToHex(r, g, b));
  };

  const handleEyeDropper = async () => {
    if ("EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const res = await eyeDropper.open();
        if (res?.sRGBHex) {
          onChange(res.sRGBHex);
        }
      } catch {}
    }
  };

  const pureHueRgb = hsvToRgb(hue, 100, 100);

  return (
    <div
      className={cn(
        "w-[240px] rounded-[var(--radius-panel)] border border-hairline bg-surface p-3 flex flex-col gap-3 select-none",
        className
      )}
    >
      {/* 2D Saturation/Value Matrix */}
      <div
        ref={satValRef}
        onPointerDown={handlePointerDownSatVal}
        onPointerMove={handlePointerMoveSatVal}
        onPointerUp={handlePointerUpSatVal}
        className="relative w-full h-32 rounded-[var(--radius-lg)] cursor-crosshair overflow-hidden touch-none"
        style={{
          backgroundColor: `rgb(${pureHueRgb.r}, ${pureHueRgb.g}, ${pureHueRgb.b})`,
          backgroundImage:
            "linear-gradient(to right, #fff 0%, transparent 100%), linear-gradient(to top, #000 0%, transparent 100%)",
        }}
      >
        <div
          className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_2px_rgba(0,0,0,0.8)] pointer-events-none"
          style={{
            left: `${sat}%`,
            top: `${100 - val}%`,
            backgroundColor: cleanValue,
          }}
        />
      </div>

      {/* Controls row: Eyedropper + Rainbow Hue Slider + Preview Swatch */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleEyeDropper}
          title="Pick color from screen"
          className="p-1.5 rounded-[var(--radius-lg)] border border-hairline bg-surface hover:bg-surface-hover text-fg-subtle hover:text-fg transition cursor-pointer shrink-0"
        >
          <Pipette className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 flex flex-col justify-center">
          {/* Hue Rainbow Bar */}
          <div className="relative h-3 w-full rounded-full">
            <input
              type="range"
              min={0}
              max={360}
              value={hue}
              onChange={(e) => handleHueChange(Number(e.target.value))}
              aria-label="Hue spectrum"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <div
              className="w-full h-full rounded-full overflow-hidden"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
              }}
            />
            {/* Subtle Indicator Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-4 rounded-full border-2 border-white shadow-[0_0_2px_rgba(0,0,0,0.8)] pointer-events-none z-10"
              style={{
                left: `${(hue / 360) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Selected Swatch Preview */}
        <div
          data-swatch="true"
          className="w-5 h-5 rounded-full border border-hairline/80 shrink-0"
          style={{ backgroundColor: cleanValue }}
        />
      </div>

      {/* Bottom row: (Single HEX Input OR 3 Dedicated RGB Inputs) + Right-end Up-Down Arrow Button */}
      <div className="flex items-center gap-1.5">
        {formatMode === "HEX" ? (
          <div className="flex-1 flex items-center h-7 rounded-[var(--radius-lg)] border border-hairline bg-surface-hover/40 px-2.5 focus-within:border-accent">
            <input
              type="text"
              value={cleanValue.toUpperCase()}
              onChange={(e) => {
                const val = e.target.value;
                // ds-lint-disable-next-line no-hex — hex format fallback
                if (!val) onChange("#000000");
                else if (val.startsWith("#")) onChange(val);
                else onChange(`#${val}`);
              }}
              aria-label="Hex color string"
              className="w-full bg-transparent font-mono text-xs text-fg outline-none"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-1">
            <div className="flex-1 flex items-center h-7 bg-surface-hover/40 rounded-[var(--radius-lg)] border border-hairline px-1.5 focus-within:border-accent">
              <span className="text-[9px] text-fg-muted mr-1 font-mono select-none">R</span>
              <input
                type="number"
                min={0}
                max={255}
                value={rgb.r}
                onChange={(e) => {
                  const rVal = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                  onChange(rgbToHex(rVal, rgb.g, rgb.b));
                }}
                aria-label="Red value (0-255)"
                className="w-full bg-transparent font-mono text-[11px] text-right text-fg outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex-1 flex items-center h-7 bg-surface-hover/40 rounded-[var(--radius-lg)] border border-hairline px-1.5 focus-within:border-accent">
              <span className="text-[9px] text-fg-muted mr-1 font-mono select-none">G</span>
              <input
                type="number"
                min={0}
                max={255}
                value={rgb.g}
                onChange={(e) => {
                  const gVal = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                  onChange(rgbToHex(rgb.r, gVal, rgb.b));
                }}
                aria-label="Green value (0-255)"
                className="w-full bg-transparent font-mono text-[11px] text-right text-fg outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex-1 flex items-center h-7 bg-surface-hover/40 rounded-[var(--radius-lg)] border border-hairline px-1.5 focus-within:border-accent">
              <span className="text-[9px] text-fg-muted mr-1 font-mono select-none">B</span>
              <input
                type="number"
                min={0}
                max={255}
                value={rgb.b}
                onChange={(e) => {
                  const bVal = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                  onChange(rgbToHex(rgb.r, rgb.g, bVal));
                }}
                aria-label="Blue value (0-255)"
                className="w-full bg-transparent font-mono text-[11px] text-right text-fg outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => setFormatMode(formatMode === "HEX" ? "RGB" : "HEX")}
          title={`Switch to ${formatMode === "HEX" ? "RGB" : "HEX"} mode`}
          className="h-7 w-7 rounded-[var(--radius-lg)] border border-hairline bg-surface hover:bg-surface-hover text-fg-subtle hover:text-fg flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Triggerable Popover Color Picker wrapper.
 */
export function ColorPickerPopover({
  value,
  onChange,
  trigger,
  align = "start",
  sideOffset = 6,
}: {
  value: string;
  onChange: (hex: string) => void;
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
  sideOffset?: number;
}) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button
            type="button"
            title="Pick color"
            className="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-lg)] border border-hairline bg-surface hover:bg-surface-hover text-fg transition focus:outline-none shadow-1"
          >
            <Pipette className="h-3.5 w-3.5 text-fg-subtle" />
          </button>
        )}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          data-panel
          sideOffset={sideOffset}
          align={align}
          className="z-[100] outline-none shadow-panel rounded-[var(--radius-panel)]"
        >
          <CanvasColorPickerPopup value={value} onChange={onChange} className="shadow-none border-none p-3" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function ColorPicker({
  value,
  onChange,
  variant = "popover",
  trigger,
  presets = ACCENT_PRESETS,
  swatchLayout = "grid",
  maxSwatches,
  colorMode = "hex",
  customLabel = "Custom",
  customLabelClassName,
  allowCustom = true,
  size,
  className,
  ...props
}: ColorPickerProps) {
  // ds-lint-disable-next-line no-hex — hex color fallback default
  const normalizedValue = (value || "#000000").toLowerCase();
  const visiblePresets = maxSwatches ? presets.slice(0, maxSwatches) : presets;

  const displayInputValue =
    colorMode === "rgb" ? hexToRgbStr(normalizedValue) : value;

  // 1. Popover Variant (Default)
  if (variant === "popover" || trigger) {
    return (
      <ColorPickerPopover
        value={normalizedValue}
        onChange={onChange}
        trigger={trigger}
      />
    );
  }

  // 2. Standalone Inline 2D Canvas Variant (no popover, clean card/panel shadow)
  if (variant === "canvas") {
    return (
      <CanvasColorPickerPopup
        value={normalizedValue}
        onChange={onChange}
        className={cn("shadow-card", className)}
      />
    );
  }

  // 3. Compact Field Variant
  if (variant === "field") {
    return (
      <div
        data-color-picker="true"
        className={cn(
          "relative flex items-center rounded-[var(--radius-lg)] border border-hairline bg-surface px-2 py-1.5 transition focus-within:border-accent shadow-1",
          className
        )}
        {...props}
      >
        <PopoverPrimitive.Root>
          <PopoverPrimitive.Trigger asChild>
            <button
              type="button"
              title="Pick color"
              className="relative flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center mr-2 select-none focus:outline-none"
            >
              {/* ds-lint-disable-next-line no-hex — preview swatch */}
              <span
                aria-hidden
                data-swatch="true"
                className="h-5 w-5 shrink-0 rounded-[calc(var(--radius-lg)-2px)] border border-hairline shadow-1 transition-transform hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: normalizedValue.startsWith("#")
                    ? normalizedValue
                    : `#${normalizedValue}`,
                }}
              />
            </button>
          </PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              data-panel
              sideOffset={6}
              align="start"
              className="z-[100] outline-none shadow-panel rounded-[var(--radius-panel)]"
            >
              <CanvasColorPickerPopup
                value={normalizedValue}
                onChange={onChange}
                className="shadow-none border-none p-3"
              />
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>

        <input
          type="text"
          value={displayInputValue}
          placeholder={colorMode === "rgb" ? DEFAULT_RGB_STR : DEFAULT_HEX_STR}
          onChange={(e) => {
            const val = e.target.value;
            if (colorMode === "hex") {
              // ds-lint-disable-next-line no-hex — fallback value
              if (!val) onChange("#000000");
              else if (val.startsWith("#")) onChange(val);
              else onChange(`#${val}`);
            } else {
              onChange(val);
            }
          }}
          aria-label={colorMode === "rgb" ? "RGB color string" : "Hex color string"}
          className="w-full border-none bg-transparent p-0 font-mono text-xs text-fg outline-none"
        />

        <PopoverPrimitive.Root>
          <PopoverPrimitive.Trigger asChild>
            <button
              type="button"
              title="Pick color using eyedropper"
              className="relative flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-lg)] text-fg-subtle transition hover:bg-surface-hover hover:text-fg ml-1 focus:outline-none"
            >
              <Pipette className="h-3.5 w-3.5" />
            </button>
          </PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              data-panel
              sideOffset={6}
              align="end"
              className="z-[100] outline-none shadow-panel rounded-[var(--radius-panel)]"
            >
              <CanvasColorPickerPopup
                value={normalizedValue}
                onChange={onChange}
                className="shadow-none border-none p-3"
              />
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    );
  }

  // 4. Swatches Variant (Preset Swatches Grid + Custom Bottom Row)
  return (
    <div
      data-color-picker="true"
      className={cn(colorPickerVariants({ size }), className)}
      {...props}
    >
      <div
        className={cn(
          swatchLayout === "scroll"
            ? "flex items-center gap-1 overflow-x-auto py-1 scrollbar-none select-none"
            : "grid grid-cols-8 gap-1 justify-items-center"
        )}
      >
        {visiblePresets.map((p) => {
          const isSelected = normalizedValue === p.hex.toLowerCase();
          // ds-lint-disable-next-line no-hex — monochrome preset hex comparison
          const isMonochrome =
            p.hex === "#000000" || p.name.toLowerCase() === "monochrome";
          return (
            <button
              key={p.hex}
              type="button"
              title={p.name}
              data-swatch="true"
              aria-label={`Select ${p.name} color`}
              aria-pressed={isSelected}
              onClick={() => onChange(p.hex)}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border transition cursor-pointer",
                isSelected
                  ? "border-fg-muted bg-surface-hover"
                  : "border-transparent hover:bg-surface-hover"
              )}
            >
              {/* ds-lint-disable-next-line no-hex — preset color swatch preview */}
              <span
                data-swatch="true"
                className="h-5 w-5 rounded-[calc(var(--radius-lg)-2px)] border border-hairline shrink-0"
                style={{
                  backgroundColor: isMonochrome ? "rgb(var(--fg))" : p.hex,
                }}
              />
            </button>
          );
        })}
      </div>

      {allowCustom && (
        <div className="flex items-center justify-between border-t border-hairline/60 pt-2.5 mt-1">
          <span
            className={cn(
              "text-xs font-medium text-fg-subtle uppercase tracking-wider font-sans",
              customLabelClassName
            )}
          >
            {customLabel}
          </span>
          <div className="flex items-center gap-1.5">
            <PopoverPrimitive.Root>
              <PopoverPrimitive.Trigger asChild>
                <button
                  type="button"
                  title="Pick custom color"
                  className="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-lg)] border border-hairline text-fg-subtle transition hover:bg-surface-hover hover:text-fg focus:outline-none"
                >
                  <Pipette className="h-3.5 w-3.5" />
                </button>
              </PopoverPrimitive.Trigger>
              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                  data-panel
                  sideOffset={6}
                  align="end"
                  className="z-[100] outline-none shadow-panel rounded-[var(--radius-panel)]"
                >
                  <CanvasColorPickerPopup
                    value={normalizedValue}
                    onChange={onChange}
                    className="shadow-none border-none p-3"
                  />
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>

            <div
              className={cn(
                "flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-hairline bg-surface py-1 pl-1.5 pr-1.5 transition focus-within:border-accent",
                colorMode === "rgb" ? "w-32" : "w-24"
              )}
            >
              <PopoverPrimitive.Root>
                <PopoverPrimitive.Trigger asChild>
                  <button
                    type="button"
                    className="relative flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center focus:outline-none"
                    title="Click to pick color"
                  >
                    {/* ds-lint-disable-next-line no-hex — preview swatch */}
                    <span
                      aria-hidden
                      data-swatch="true"
                      className="h-4 w-4 shrink-0 rounded-[var(--radius-sm)] border border-hairline shadow-1 transition-transform hover:scale-110 active:scale-95"
                      style={{
                        backgroundColor: normalizedValue.startsWith("#")
                          ? normalizedValue
                          : `#${normalizedValue}`,
                      }}
                    />
                  </button>
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Portal>
                  <PopoverPrimitive.Content
                    data-panel
                    sideOffset={6}
                    align="end"
                    className="z-[100] outline-none shadow-panel rounded-[var(--radius-panel)]"
                  >
                    <CanvasColorPickerPopup
                      value={normalizedValue}
                      onChange={onChange}
                      className="shadow-none border-none p-3"
                    />
                  </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
              </PopoverPrimitive.Root>

              <input
                type="text"
                value={displayInputValue}
                placeholder={colorMode === "rgb" ? DEFAULT_RGB_STR : DEFAULT_HEX_STR}
                onChange={(e) => {
                  const val = e.target.value;
                  if (colorMode === "hex") {
                    // ds-lint-disable-next-line no-hex — color picker fallback value
                    if (!val) onChange("#000000");
                    else if (val.startsWith("#")) onChange(val);
                    else onChange(`#${val}`);
                  } else {
                    onChange(val);
                  }
                }}
                aria-label={colorMode === "rgb" ? "RGB color string" : "Hex color string"}
                className="w-full border-none bg-transparent p-0 font-mono text-xs text-fg outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

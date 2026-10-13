"use client";

import React, { useMemo, type ReactNode } from "react";
import { scopedThemeVars } from "../../lib/theme-presets";
import { type ColorSpace } from "../../lib/color-space";
import { cn } from "../../lib/cn";

export interface ScopedThemeProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** A named THEME_PRESETS preset (e.g. "Editorial") */
  theme?: string;
  /** Explicit appearance mode: "dark" | "light" | "inherit". Defaults to "inherit". */
  appearance?: "dark" | "light" | "inherit";
  /** One of the 24 named accents (e.g. "Grass", "Ruby", "Monochrome") or raw hex "#rrggbb". */
  accentColor?: string;
  /** Gray family: "Zinc" | "Slate" | "Gray" | "Neutral" | "Stone" | "Mauve" | "Sage". */
  grayColor?: string;
  /** Radius preset: "none" | "small" | "medium" | "large" | "full". */
  radius?: "none" | "small" | "medium" | "large" | "full";
  /** Scaling percentage preset: 90 | 95 | 100 | 105 | 110 | "90%" | "95%" | "100%" | "105%" | "110%". */
  scaling?: 90 | 95 | 100 | 105 | 110 | "90%" | "95%" | "100%" | "105%" | "110%";
  /** Display font family string. */
  displayFont?: string;
  /** Body font family string. */
  bodyFont?: string;
  /** Panel background: "solid" | "translucent". */
  panelBackground?: "solid" | "translucent";
  /** Color space: "rgb" | "oklch". Defaults to "rgb". */
  colorSpace?: ColorSpace;
  /** Custom class name applied to the container. */
  className?: string;
  /** Custom inline styles merged with scoped CSS variables. */
  style?: React.CSSProperties;
  /** Child elements. */
  children?: ReactNode;
}

/**
 * ScopedThemeProvider — First-class local subtree theme isolator.
 *
 * Defines an isolated theme boundary for embedded sandboxes, card previews,
 * multi-brand islands, or canvas frames without mutating the global :root application theme.
 */
export function ScopedThemeProvider({
  theme,
  appearance = "inherit",
  accentColor,
  grayColor,
  radius,
  scaling,
  displayFont,
  bodyFont,
  panelBackground,
  colorSpace = "rgb",
  className,
  style,
  children,
  ...rest
}: ScopedThemeProviderProps) {
  const isDark = appearance === "dark" ? true : appearance === "light" ? false : undefined;

  const numericScaling = useMemo(() => {
    if (typeof scaling === "number") return scaling;
    if (typeof scaling === "string") {
      const parsed = parseInt(scaling.replace("%", ""), 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }, [scaling]);

  const computedVars = useMemo(() => {
    // If a theme preset name is provided, extract its defaults
    return scopedThemeVars(
      accentColor,
      grayColor,
      radius,
      isDark ?? false,
      displayFont,
      bodyFont,
      numericScaling,
      colorSpace
    );
  }, [accentColor, grayColor, radius, isDark, displayFont, bodyFont, numericScaling, colorSpace]);

  return (
    <div
      data-theme={appearance === "dark" ? "dark" : appearance === "light" ? "light" : undefined}
      className={cn(appearance === "dark" && "dark", className)}
      style={{
        ...(computedVars as React.CSSProperties),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

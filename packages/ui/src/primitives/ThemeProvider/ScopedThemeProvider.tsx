"use client";

import React, { useMemo, type ReactNode } from "react";
import { scopedThemeVars, isBrandSolidMode, type BrandSolidMode } from "../../lib/theme-presets";
import { ThemeInheritanceContext, useThemeInheritance } from "./themeContext";
import { type ColorSpace } from "../../lib/color-space";
import { cn } from "../../lib/cn";

export interface ScopedThemeProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** A named THEME_PRESETS preset (e.g. "Editorial") */
  theme?: string;
  /** Explicit appearance mode: "dark" | "light" | "inherit". Defaults to "inherit". */
  appearance?: "dark" | "light" | "inherit";
  /** One of the 24 named brand colours (e.g. "Monochrome") or raw hex "#rrggbb". */
  brandColor?: string;
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
  /** Focus ring weight inside this subtree: "subtle" | "default" | "strong". Unset inherits the parent (ThemeProvider or an outer ScopedThemeProvider). */
  focusRing?: "subtle" | "default" | "strong";
  /** Color space: "rgb" | "oklch". Defaults to "rgb". */
  colorSpace?: ColorSpace;
  /**
   * Target size policy for this subtree: "comfortable" grows primary controls to 44px under a coarse pointer,
   * "compact" does not (the 24px WCAG 2.5.8 floor stays). Sets `data-touch-targets` on the container.
   *
   * **Unset means inherit, not "comfortable".** Without this prop the island writes no attribute and keeps the
   * policy of its nearest parent: a compact `ThemeProvider` keeps an unset island compact, and the root default
   * is comfortable only when nothing above says otherwise. Pass `"comfortable"` explicitly to override a compact
   * parent. Content portaled out of the container (menus, popovers, dialogs) follows `<html>`, not this value.
   */
  touchTargets?: "comfortable" | "compact";
  /** How solid brand fills are chosen in this scope: "accessible" | "exact" | "perceptual". Unset inherits the ThemeProvider above (default "accessible"). */
  brandSolid?: BrandSolidMode;
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
  brandColor,
  grayColor,
  radius,
  scaling,
  displayFont,
  bodyFont,
  panelBackground,
  focusRing,
  colorSpace = "rgb",
  touchTargets,
  brandSolid,
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

  const inherited = useThemeInheritance();
  const solidMode: BrandSolidMode = isBrandSolidMode(brandSolid) ? brandSolid : inherited.brandSolid;
  // A scope that sets only brandSolid re-derives the solid tokens from the brand the root provider resolved.
  const brand = brandColor ?? (isBrandSolidMode(brandSolid) && brandSolid !== inherited.brandSolid ? inherited.brand : undefined);

  const computedVars = useMemo(() => {
    // If a theme preset name is provided, extract its defaults
    return scopedThemeVars(
      brand,
      grayColor,
      radius,
      isDark ?? false,
      displayFont,
      bodyFont,
      numericScaling,
      colorSpace,
      solidMode
    );
  }, [brand, grayColor, radius, isDark, displayFont, bodyFont, numericScaling, colorSpace, solidMode]);

  const nested = useMemo(() => ({ brandSolid: solidMode, brand: brandColor ?? inherited.brand }), [solidMode, brandColor, inherited.brand]);

  return (
    <ThemeInheritanceContext.Provider value={nested}>
    <div
      data-touch-targets={touchTargets}
      data-focus-ring={focusRing}
      data-brand-solid={brand ? solidMode : undefined}
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
    </ThemeInheritanceContext.Provider>
  );
}

"use client";
import { createContext, useContext } from "react";
import { DEFAULT_BRAND_SOLID, type BrandSolidMode } from "../../lib/theme-presets";

/** What a ThemeProvider tells the ScopedThemeProviders below it: their brand fill mode and brand are inherited unless a scope sets its own. */
export interface ThemeInheritance {
  brandSolid: BrandSolidMode;
  /** The brand colour the root provider resolved (name or hex). */
  brand?: string;
}

export const ThemeInheritanceContext = createContext<ThemeInheritance>({ brandSolid: DEFAULT_BRAND_SOLID });

export function useThemeInheritance(): ThemeInheritance {
  return useContext(ThemeInheritanceContext);
}

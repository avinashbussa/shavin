"use client";
import { useEffect, type ReactNode } from "react";
import {
  applyAccentColor,
  applyGrayColor,
  applyPanelBackground,
  applyRadiusPreset,
  applyScalingPreset,
  applyDisplayFontPreset,
  applyBodyFontPreset,
  applySubheadingFont,
  applyThemePreset,
  preloadGoogleFontsBundle,
  resolveThemeConfig,
  themeCss,
} from "../../lib/theme-presets";
import { setColorSpace, type ColorSpace } from "../../lib/color-space";
import { ThemeScript } from "../ThemeSwitcher";
import { ShavinDevTools } from "../ShavinDevTools";

/** The theme a ThemeProvider resolved from its props (preset values filled in). Published on `window.__SHAVIN_THEME_CONFIG__` and in the `shavin-theme-init` event. */
export interface ShavinThemeConfig {
  theme?: string;
  accent?: string;
  gray?: string;
  radius?: string;
  scaling?: number;
  translucentPanels: boolean;
  displayFont?: string;
  bodyFont?: string;
}

export interface ThemeProviderProps {
  /** A named THEME_PRESETS preset (e.g. "Editorial") — applies its whole config. Individual props below override it. */
  theme?: string;
  /** Default appearance mode when no stored theme is found. Defaults to "light". */
  defaultTheme?: "light" | "dark" | "system";
  /** One of the Configurator's 24 named accents (e.g. "Grass"), or a literal "#rrggbb". */
  accentColor?: string;
  /** "Zinc" | "Slate" | "Gray" | "Neutral" | "Stone" */
  grayColor?: string;
  /** Radius preset: "none" | "small" | "medium" | "large" | "full". */
  radius?: "none" | "small" | "medium" | "large" | "full";
  /** Scaling percentage preset: 90 | 95 | 100 | 105 | 110 | "90%" | "95%" | "100%" | "105%" | "110%". */
  scaling?: 90 | 95 | 100 | 105 | 110 | "90%" | "95%" | "100%" | "105%" | "110%";
  /** Panel background translucent vs solid mode: "solid" | "translucent". */
  panelBackground?: "solid" | "translucent";
  /** Display font preset family string. */
  displayFont?: string;
  /** Body font preset family string. */
  bodyFont?: string;
  /** Font for h3-h6 headings: "body" (default), "display" (follow the display font), or a font family name. */
  subheadingFont?: string;
  /**
   * Color space for runtime token values. "rgb" (default) outputs bare RGB triplets
   * for Tailwind v3 + v4-rgb paths. "oklch" outputs oklch() CSS strings for the
   * Tailwind v4 OKLCH path (global-oklch.css + theme-v4-oklch.css).
   * Set to "oklch" when your project imports @shavin/ui/global-oklch.css.
   */
  colorSpace?: ColorSpace;
  /** When true, preloads the complete curated Google Fonts bundle (all 30 families) on mount so every font is available for instant preview in the DevTools inspector. Recommended for dev/playground only — end users should add only the fonts they use. */
  preloadFonts?: boolean;
  /** Whether to render the Shavin Dev Inspector in development. Defaults to true in dev. */
  devTools?: boolean;
  /** Port the local Agent-Browser bridge listens on. Defaults to the env override, then the built-in default. Pass this when running `npx @shavin/cli bridge --port <n>`. */
  bridgePort?: number;
  children?: ReactNode;
}

export function ThemeProvider({
  theme,
  defaultTheme = "dark",
  accentColor,
  grayColor,
  radius,
  scaling,
  panelBackground,
  displayFont,
  bodyFont,
  subheadingFont,
  colorSpace = "rgb",
  preloadFonts,
  devTools,
  bridgePort,
  children,
}: ThemeProviderProps) {
  useEffect(() => {
    setColorSpace(colorSpace);
  }, [colorSpace]);
  useEffect(() => {
    if (preloadFonts) preloadGoogleFontsBundle();
  }, [preloadFonts]);
  useEffect(() => {
    if (theme) {
      applyThemePreset(theme);
    } else if (!accentColor && !grayColor && !radius && !displayFont && !bodyFont) {
      applyThemePreset("Monochrome");
    }
  }, [theme, accentColor, grayColor, radius, displayFont, bodyFont]);
  useEffect(() => {
    if (accentColor) applyAccentColor(accentColor);
  }, [accentColor]);
  useEffect(() => {
    if (grayColor) applyGrayColor(grayColor);
  }, [grayColor]);
  useEffect(() => {
    if (radius) applyRadiusPreset(radius);
  }, [radius]);
  useEffect(() => {
    if (scaling) applyScalingPreset(scaling);
  }, [scaling]);
  useEffect(() => {
    if (panelBackground) applyPanelBackground(panelBackground === "translucent");
  }, [panelBackground]);
  useEffect(() => {
    if (displayFont) applyDisplayFontPreset(displayFont);
  }, [displayFont]);
  useEffect(() => {
    if (bodyFont) applyBodyFontPreset(bodyFont);
  }, [bodyFont]);
  useEffect(() => {
    applySubheadingFont(subheadingFont ?? "body");
  }, [subheadingFont]);

  const showDevTools = devTools ?? (process.env.NODE_ENV !== "production");

  // Publish the resolved config so tooling (the Dev Inspector) starts from what this provider was
  // given instead of its own defaults. Runs after the apply effects above.
  const resolved = resolveThemeConfig({ theme, accentColor, grayColor, radius, scaling, panelBackground, displayFont, bodyFont, subheadingFont });
  const configSig = JSON.stringify([theme, resolved]);
  useEffect(() => {
    const detail: ShavinThemeConfig = { theme, ...resolved };
    (window as unknown as { __SHAVIN_THEME_CONFIG__?: ShavinThemeConfig }).__SHAVIN_THEME_CONFIG__ = detail;
    window.dispatchEvent(new CustomEvent("shavin-theme-init", { detail }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configSig]);

  // Rendered into the server HTML so the first paint already uses the brand. The effects above
  // still run and write the same values, which keeps live updates (DevTools, Studio) working.
  const css = themeCss({ theme, accentColor, grayColor, radius, scaling, displayFont, bodyFont, subheadingFont, colorSpace });
  const { translucentPanels } = resolveThemeConfig({ theme, accentColor, grayColor, radius, panelBackground, displayFont, bodyFont });

  return (
    <>
      {css ? <style id="shavin-theme-vars" dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <ThemeScript defaultTheme={defaultTheme} translucentPanels={translucentPanels} />
      {children ?? null}
      {showDevTools && <ShavinDevTools bridgePort={bridgePort} />}
    </>
  );
}

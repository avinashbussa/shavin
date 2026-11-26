"use client";
import { useEffect, useLayoutEffect, useMemo, type ReactNode } from "react";
import {
  applyBrandColor,
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
  setBrandSolidMode,
  perceptualAaFailures,
  type BrandSolidMode,
} from "../../lib/theme-presets";
import { ThemeInheritanceContext } from "./themeContext";
import { setColorSpace, type ColorSpace } from "../../lib/color-space";
import { ThemeScript } from "../ThemeSwitcher";
import { ShavinDevTools } from "../ShavinDevTools";
import { initMotionRuntime } from "../../lib/motion-runtime";
import { resolveClientTheme } from "./clientTheme";

/** The theme a ThemeProvider resolved from its props (preset values filled in). Published on `window.__SHAVIN_THEME_CONFIG__` and in the `shavin-theme-init` event. */
export interface ShavinThemeConfig {
  theme?: string;
  brand?: string;
  gray?: string;
  radius?: string;
  scaling?: number;
  translucentPanels: boolean;
  displayFont?: string;
  bodyFont?: string;
  /** How solid brand fills are chosen (see ThemeProviderProps.brandSolid). */
  brandSolid: BrandSolidMode;
}

export interface ThemeProviderProps {
  /** A named THEME_PRESETS preset (e.g. "Editorial") — applies its whole config. Individual props below override it. */
  theme?: string;
  /** Appearance when nothing is stored yet. Defaults to "system" (follows the OS setting). */
  defaultTheme?: "light" | "dark" | "system";
  /** One of the Configurator's 24 named brand colours (e.g. "Monochrome"), or a literal "#rrggbb". */
  brandColor?: string;
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
  /**
   * Focus ring weight for the whole page: "subtle" (default: 1px ring, 2px offset), "default" (2px,
   * the pre-0.1.0 ring) or "strong" (3px). Colour is always --focus (brand text colour, >=3:1 on page
   * fills). Sets data-focus-ring on <html>; tune --focus-width / --focus-offset in CSS for anything else.
   */
  focusRing?: "subtle" | "default" | "strong";
  /** Font for h3-h6 headings: "body" (default), "display" (follow the display font), or a font family name. */
  subheadingFont?: string;
  /**
   * How the fill under text on the brand (solid Button, Badge, selected states) is chosen. Written to
   * `--brand-solid`, `--brand-solid-hover` and `--brand-fg`.
   * - "accessible" (default): the brand's hue with lightness lowered just far enough that white text
   *   clears 4.6:1 (WCAG 2 AA with headroom); a genuinely light brand (lime, mint, sky, amber) keeps
   *   its exact fill and takes dark text.
   * - "exact": the exact brand fill, text white or ink by WCAG 2 contrast (the behaviour before this prop).
   * - "perceptual": the exact brand fill, text white wherever APCA prefers it. Does NOT meet WCAG 2 AA on
   *   every brand colour; a development-only console warning says which. Inherited by ScopedThemeProvider.
   */
  brandSolid?: BrandSolidMode;
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
  /**
   * Target size policy (docs: "Target size"). "comfortable" (default): primary controls grow to 44px under a
   * coarse pointer (touch). "compact": they do not grow; every control still keeps its 24px WCAG 2.5.8 floor.
   * Sets `data-touch-targets` on <html>; tune the sizes with the `--tap-min` and `--tap-min-touch` CSS variables.
   */
  touchTargets?: "comfortable" | "compact";
  children?: ReactNode;
}

/** useLayoutEffect on the client (before first paint), a plain effect on the server (no warning, no-op). */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const warnedPerceptual = new Set<string>();

/**
 * brandSolid="perceptual" trades the WCAG 2 AA guarantee for APCA-preferred (usually white) text on the
 * exact brand fill. Said once per page load, in development only, so it is a choice and not an accident.
 */
function warnPerceptualOnce(mode: BrandSolidMode) {
  if (mode !== "perceptual" || process.env.NODE_ENV === "production" || typeof window === "undefined") return;
  if (warnedPerceptual.has(mode)) return;
  warnedPerceptual.add(mode);
  const light = perceptualAaFailures(false);
  const dark = perceptualAaFailures(true);
  const total = new Set([...light, ...dark].map((f) => f.name)).size;
  console.warn(
    `[shavin] ThemeProvider brandSolid="perceptual": text on solid brand fills (Button, Badge, selected states) is white wherever APCA prefers it, which does NOT meet WCAG 2 AA (4.5:1) ` +
      `on ${total} of the 24 shipped brand colours (e.g. ${light.slice(0, 3).map((f) => `${f.name} ${f.ratio.toFixed(2)}:1`).join(", ")}), so an accessibility audit against WCAG 2 AA will fail on them. ` +
      `To restore the guarantee, remove the prop or set brandSolid="accessible".`,
  );
}

export function ThemeProvider({
  theme,
  defaultTheme = "system",
  brandColor,
  grayColor,
  radius,
  scaling,
  panelBackground,
  displayFont,
  bodyFont,
  subheadingFont,
  focusRing,
  brandSolid = "accessible",
  colorSpace = "rgb",
  preloadFonts,
  devTools,
  bridgePort,
  touchTargets = "comfortable",
  children,
}: ThemeProviderProps) {
  // Client-only apps (createRoot) never run the inline ThemeScript, so resolve the appearance here, before
  // paint and before the brand effects below read the mode. A no-op when the HTML was already resolved
  // (server-rendered apps). Follows OS changes only when the preference is "system".
  const { translucentPanels: translucentForTheme } = resolveThemeConfig({ theme, brandColor, grayColor, radius, panelBackground, displayFont, bodyFont });
  useIsoLayoutEffect(() => resolveClientTheme({ defaultTheme, translucentPanels: translucentForTheme }) ?? undefined, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Starts the data-motion runtime (idempotent, inert during SSR). The root entry no longer boots it on
  // import, because a side-effect import would keep the whole library in every bundle.
  useEffect(() => {
    initMotionRuntime();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-touch-targets", touchTargets);
    return () => root.removeAttribute("data-touch-targets");
  }, [touchTargets]);
  useEffect(() => {
    setColorSpace(colorSpace);
  }, [colorSpace]);
  // Before the brand effects, so applyBrandColor reads the mode. Also writes data-brand-solid on <html>.
  useEffect(() => {
    setBrandSolidMode(brandSolid);
    warnPerceptualOnce(brandSolid);
  }, [brandSolid]);
  useEffect(() => {
    if (preloadFonts) preloadGoogleFontsBundle();
  }, [preloadFonts]);
  useEffect(() => {
    if (theme) {
      applyThemePreset(theme);
    } else if (!brandColor && !grayColor && !radius && !displayFont && !bodyFont) {
      applyThemePreset("Monochrome");
    }
  }, [theme, brandColor, grayColor, radius, displayFont, bodyFont, scaling]);
  useEffect(() => {
    if (brandColor) applyBrandColor(brandColor);
  }, [brandColor]);
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
  useEffect(() => {
    const root = document.documentElement;
    if (focusRing) root.setAttribute("data-focus-ring", focusRing);
    else root.removeAttribute("data-focus-ring");
  }, [focusRing]);

  const showDevTools = devTools ?? (process.env.NODE_ENV !== "production");

  // Publish the resolved config so tooling (the Dev Inspector) starts from what this provider was
  // given instead of its own defaults. Runs after the apply effects above.
  const resolved = resolveThemeConfig({ theme, brandColor, grayColor, radius, scaling, panelBackground, displayFont, bodyFont, subheadingFont, brandSolid });
  const configSig = JSON.stringify([theme, resolved]);
  useEffect(() => {
    const detail: ShavinThemeConfig = { theme, ...resolved };
    (window as unknown as { __SHAVIN_THEME_CONFIG__?: ShavinThemeConfig }).__SHAVIN_THEME_CONFIG__ = detail;
    window.dispatchEvent(new CustomEvent("shavin-theme-init", { detail }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configSig]);

  // Rendered into the server HTML so the first paint already uses the brand. The effects above
  // still run and write the same values, which keeps live updates (DevTools, Studio) working.
  const css = themeCss({ theme, brandColor, grayColor, radius, scaling, displayFont, bodyFont, subheadingFont, brandSolid, colorSpace });
  const inheritance = useMemo(() => ({ brandSolid: resolved.brandSolid, brand: resolved.brand }), [resolved.brandSolid, resolved.brand]);
  const { translucentPanels } = resolveThemeConfig({ theme, brandColor, grayColor, radius, panelBackground, displayFont, bodyFont });

  return (
    <ThemeInheritanceContext.Provider value={inheritance}>
      {/* First paint for compact: the attribute above is set after hydration, so the server HTML carries the token too. */}
      {touchTargets === "compact" ? <style id="shavin-touch-targets" dangerouslySetInnerHTML={{ __html: ":root{--tap-min-touch:var(--tap-min,24px)}" }} /> : null}
      {css ? <style id="shavin-theme-vars" dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <ThemeScript defaultTheme={defaultTheme} translucentPanels={translucentPanels} focusRing={focusRing} />
      {children ?? null}
      {showDevTools && <ShavinDevTools bridgePort={bridgePort} />}
    </ThemeInheritanceContext.Provider>
  );
}

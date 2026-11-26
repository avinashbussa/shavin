"use client";
import * as React from "react";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTimeouts } from "../useTimeouts";





import {
  BRAND_PRESETS,
  GRAY_PRESETS,
  SCALING_PRESETS,
  DISPLAY_FONTS,
  BODY_FONTS,
  THEME_PRESETS,
  applyBrandColor,
  applyGrayColor,
  applyRadiusPreset,
  applyScalingPreset,
  applyPanelBackground,
  applyDisplayFontPreset,
  applyBodyFontPreset,
  applySubheadingFont,
  applyThemePreset,
  tripletToHex,
  resolveBrandTriplet,
} from "../../lib/theme-presets";









import type { ShavinDevToolsProps } from "../../primitives/ShavinDevTools/types";


// ds-lint-disable-next-line no-hex — fallback color constant
export const DEFAULT_FALLBACK_HEX = "#000000";

/**
 * The live theme controls of the dev inspector: state, the effects that keep it in step with the app's ThemeProvider,
 * and the handlers that change the page's theme instantly. Moved unchanged out of the old panel so the same code
 * serves the floating Theme panel and the legacy panel.
 */
/**
 * The brand preset that paints `hex` on the page. The page paints a preset's brand differently in dark mode (Monochrome
 * is near-white there), so a preset matches by its own hex, by the colour it resolves to in the current mode, or, for a
 * neutral gray, as Monochrome.
 */
function matchBrandPreset(hex: string, isDark: boolean): { name: string; hex: string } | undefined {
  const lower = hex.toLowerCase();
  // The OKLCH build paints Monochrome as a near-black or near-white gray (for example #18181b), not pure black.
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(lower);
  const neutral = !!m && Math.max(...[1, 2, 3].map((i) => parseInt(m[i]!, 16))) - Math.min(...[1, 2, 3].map((i) => parseInt(m[i]!, 16))) <= 8;
  return (
    BRAND_PRESETS.find((p) => p.hex.toLowerCase() === lower) ??
    (neutral ? BRAND_PRESETS.find((p) => p.name === "Monochrome") : undefined) ??
    BRAND_PRESETS.find((p) => {
      try {
        return tripletToHex(resolveBrandTriplet(p.hex, isDark)).toLowerCase() === lower;
      } catch {
        return false;
      }
    })
  );
}

export function useThemeController() {
  // Live Theme State
  const [themeName, setThemeName] = useState<string>("Monochrome");
  const [dark, setDark] = useState<boolean>(false);
  // ds-lint-disable-next-line no-hex — initial devtools fallback color
  const [brandHex, setBrandHex] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("shavin-brand");
        if (saved && saved.startsWith("#")) return saved;
      } catch {}
    }
    // ds-lint-disable-next-line no-hex — initial devtools fallback color
    return "#3b82f6";
  });
  const [brandName, setBrandName] = useState<string>("Blue");
  const [grayName, setGrayName] = useState<string>("Zinc");
  const [radiusName, setRadiusName] = useState<string>("medium");
  const [scaling, setScaling] = useState<number>(100);
  const [translucent, setTranslucent] = useState<boolean>(false);
  const [displayFont, setDisplayFont] = useState<string>("Rethink Sans");
  const [bodyFont, setBodyFont] = useState<string>("Inter");
  const [subheadingFont, setSubheadingFont] = useState<"body" | "display">("body");
  const initialSubheadingRef = useRef<"body" | "display">("body");

  // Initial Project Configuration Reference (for Reset button)
  const initialProjectConfigRef = useRef<{
    themeName: string;
    brandHex: string;
    brandName: string;
    grayName: string;
    radiusName: string;
    scaling: number;
    translucent: boolean;
    displayFont: string;
    bodyFont: string;
  } | null>(null);

  // Detected Custom Project Fonts
  const [detectedHeadingFont, setDetectedHeadingFont] = useState<string | null>(null);
  const [detectedBodyFont, setDetectedBodyFont] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const later = useTimeouts();
  const [customFontHelp, setCustomFontHelp] = useState(false);
  const customFontHelpRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (customFontHelp) customFontHelpRef.current?.scrollIntoView({ block: "nearest" });
  }, [customFontHelp]);

  useEffect(() => {
    let initialHeading = "Rethink Sans";
    let initialBody = "Inter";
    // ds-lint-disable-next-line no-hex — initial devtools fallback color
    let initialBrandHex = "#3b82f6";
    let initialBrandName = "Blue";

    // Auto-detect project custom fonts from computed document styles
    if (typeof document !== "undefined") {
      try {
        const computed = getComputedStyle(document.documentElement);
        const rawDisplay = computed.getPropertyValue("--font-display").trim().replace(/['"]/g, "");
        const primaryDisplay = rawDisplay ? rawDisplay.split(",")[0].trim() : "";
        if (primaryDisplay && !DISPLAY_FONTS.some((f) => f.name.toLowerCase() === primaryDisplay.toLowerCase())) {
          setDetectedHeadingFont(primaryDisplay);
          setDisplayFont(primaryDisplay);
          initialHeading = primaryDisplay;
        }

        const rawBody = computed.getPropertyValue("--font-body").trim().replace(/['"]/g, "");
        const primaryBody = rawBody ? rawBody.split(",")[0].trim() : "";
        if (primaryBody && !BODY_FONTS.some((f) => f.name.toLowerCase() === primaryBody.toLowerCase())) {
          setDetectedBodyFont(primaryBody);
          setBodyFont(primaryBody);
          initialBody = primaryBody;
        }

        const rawBrand = computed.getPropertyValue("--brand").trim();
        if (rawBrand) {
          const detectedHex = rawBrand.includes(" ") ? tripletToHex(rawBrand) : rawBrand.startsWith("#") ? rawBrand : null;
          if (detectedHex) {
            initialBrandHex = detectedHex;
            const matched = matchBrandPreset(detectedHex, document.documentElement.classList.contains("dark"));
            if (matched) initialBrandName = matched.name;
            setBrandHex(matched ? matched.hex : detectedHex);
            setBrandName(initialBrandName);
          }
        }
      } catch {
        // Ignore style reading errors
      }
    }

    if (!initialProjectConfigRef.current) {
      initialProjectConfigRef.current = {
        themeName: "Monochrome",
        // ds-lint-disable-next-line no-hex — initial devtools fallback color
        brandHex: initialBrandHex,
        brandName: initialBrandName,
        grayName: "Zinc",
        radiusName: "medium",
        scaling: 100,
        translucent: false,
        displayFont: initialHeading,
        bodyFont: initialBody,
      };
    }
  }, []);

  // Sync initial dark mode state
  useEffect(() => {
    if (typeof document !== "undefined") {
      setDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  // Sync DevTools React state when theme is changed externally (e.g. docs page applyThemePreset)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleThemeChange = () => {
      try {
        const root = document.documentElement;
        const computed = getComputedStyle(root);
        // Appearance
        setDark(root.classList.contains("dark"));
        // Brand
        const rawBrand = computed.getPropertyValue("--brand").trim();
        if (rawBrand) {
          const detectedHex = rawBrand.includes(" ")
            ? tripletToHex(rawBrand)
            : rawBrand.startsWith("#")
              ? rawBrand
              : null;
          if (detectedHex) {
            const matched = matchBrandPreset(detectedHex, root.classList.contains("dark"));
            setBrandHex(matched ? matched.hex : detectedHex);
            if (matched) setBrandName(matched.name);
          }
        }
        // Gray
        const savedGray = localStorage.getItem("shavin-gray");
        if (savedGray) setGrayName(savedGray);
        // Radius
        const savedRadius = localStorage.getItem("shavin-radius");
        if (savedRadius) setRadiusName(savedRadius);
        // Scaling
        const savedScaling = localStorage.getItem("shavin-scaling");
        if (savedScaling) setScaling(Number(savedScaling) || 100);
        // Panel background
        setTranslucent(root.classList.contains("translucent-panels"));
        // Fonts
        const savedDisplayFont = localStorage.getItem("shavin-display-font");
        if (savedDisplayFont) setDisplayFont(savedDisplayFont);
        const savedBodyFont = localStorage.getItem("shavin-body-font");
        if (savedBodyFont) setBodyFont(savedBodyFont);
        // Theme name — try to match against presets
        const savedBrandHex = localStorage.getItem("shavin-brand");
        const savedPanel = localStorage.getItem("shavin-panel");
        const isDarkMode = root.classList.contains("dark");
        const matchedPreset = THEME_PRESETS.find((p) => {
          const pHex =
            BRAND_PRESETS.find(
              (a) => a.name.toLowerCase() === p.brandColor.toLowerCase(),
            )?.hex ?? DEFAULT_FALLBACK_HEX;
          return (
            pHex.toLowerCase() === (savedBrandHex || "").toLowerCase() &&
            (p.grayColor || "").toLowerCase() === (savedGray || "").toLowerCase() &&
            (p.radius || "").toLowerCase() === (savedRadius || "").toLowerCase() &&
            (p.scaling || 100) === (Number(savedScaling) || 100) &&
            (p.panelBackground || "solid") === (savedPanel === "translucent" ? "translucent" : "solid") &&
            (p.displayFont || "Inter").toLowerCase() === (savedDisplayFont || "").toLowerCase() &&
            (p.bodyFont || "Inter").toLowerCase() === (savedBodyFont || "").toLowerCase() &&
            p.appearance === (isDarkMode ? "dark" : "light")
          );
        });
        setThemeName(matchedPreset ? matchedPreset.name : "Custom");
      } catch {
        // Ignore
      }
    };
    window.addEventListener("shavin-theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("shavin-theme-change", handleThemeChange);
    };
  }, []);

  // Start from the theme the app's ThemeProvider was given. Without this the inspector shows its own
  // defaults (Monochrome, Zinc, 100%, Rethink Sans) until something is changed by hand.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const canon = <T extends { name: string }>(list: readonly T[], v?: string) =>
      v ? list.find((x) => x.name.toLowerCase() === v.toLowerCase())?.name : undefined;
    const applyInit = (cfg: {
      theme?: string; brand?: string; gray?: string; radius?: string; scaling?: number;
      translucentPanels: boolean; displayFont?: string; bodyFont?: string; subheadingFont?: string;
    }) => {
      try {
        const gray = canon(GRAY_PRESETS, cfg.gray) ?? "Zinc";
        const radius = (cfg.radius ?? "medium").toLowerCase();
        const scaling = cfg.scaling ?? 100;
        // No font configured on the provider: report the font the page actually renders, not the inspector's own default.
        const rendered = (el: Element | null) => {
          if (!el) return undefined;
          const first = getComputedStyle(el).fontFamily.split(",")[0]?.trim().replace(/['"]/g, "");
          // next/font mangles names ("__Inter_a1b2c3", "__Inter_Fallback_a1b2c3"); recover the family.
          const name = first?.replace(/^__/, "").replace(/_Fallback/, "").replace(/_[a-f0-9]{6,}$/i, "").replace(/_/g, " ");
          return name || undefined;
        };
        const heading = canon(DISPLAY_FONTS, cfg.displayFont) ?? cfg.displayFont
          ?? canon(DISPLAY_FONTS, rendered(document.querySelector("h1, h2"))) ?? rendered(document.querySelector("h1, h2")) ?? "Rethink Sans";
        const body = canon(BODY_FONTS, cfg.bodyFont) ?? cfg.bodyFont
          ?? canon(BODY_FONTS, rendered(document.body)) ?? rendered(document.body) ?? "Inter";
        const brandPreset = cfg.brand
          ? BRAND_PRESETS.find((a) => a.name.toLowerCase() === cfg.brand!.toLowerCase())
          : undefined;
        const brandHex = brandPreset?.hex ?? (cfg.brand && cfg.brand.startsWith("#") ? cfg.brand : null);
        localStorage.setItem("shavin-gray", gray);
        localStorage.setItem("shavin-radius", radius);
        localStorage.setItem("shavin-scaling", String(scaling));
        localStorage.setItem("shavin-panel", cfg.translucentPanels ? "translucent" : "solid");
        localStorage.setItem("shavin-display-font", heading);
        localStorage.setItem("shavin-body-font", body);
        if (brandHex) localStorage.setItem("shavin-brand", brandHex);
        if (!DISPLAY_FONTS.some((f) => f.name.toLowerCase() === heading.toLowerCase())) setDetectedHeadingFont(heading);
        if (!BODY_FONTS.some((f) => f.name.toLowerCase() === body.toLowerCase())) setDetectedBodyFont(body);
        initialProjectConfigRef.current = {
          themeName: canon(THEME_PRESETS, cfg.theme) ?? "Custom",
          brandHex: brandHex ?? initialProjectConfigRef.current?.brandHex ?? DEFAULT_FALLBACK_HEX,
          brandName: brandPreset?.name ?? initialProjectConfigRef.current?.brandName ?? "Custom",
          grayName: gray,
          radiusName: radius,
          scaling,
          translucent: cfg.translucentPanels,
          displayFont: heading,
          bodyFont: body,
        };
        {
          const sub = cfg.subheadingFont?.toLowerCase() === "display" ? "display" : "body";
          initialSubheadingRef.current = sub;
          setSubheadingFont(sub);
        }
        // Let the regular handler read the DOM + storage and settle every control, including the theme name.
        window.dispatchEvent(new CustomEvent("shavin-theme-change"));
      } catch {
        // Ignore
      }
    };
    const onInit = (e: Event) => applyInit((e as CustomEvent).detail);
    window.addEventListener("shavin-theme-init", onInit);
    const existing = (window as unknown as { __SHAVIN_THEME_CONFIG__?: Parameters<typeof applyInit>[0] }).__SHAVIN_THEME_CONFIG__;
    if (existing) applyInit(existing);
    return () => window.removeEventListener("shavin-theme-init", onInit);
  }, []);

  // Handlers for instant live DOM mutation
  const handleSelectTheme = (name: string) => {
    setThemeName(name);
    if (name === "Custom") return;
    const p = THEME_PRESETS.find((t) => t.name === name);
    if (!p) return;

    applyThemePreset(name);
    const targetHex =
      BRAND_PRESETS.find((a) => a.name.toLowerCase() === p.brandColor.toLowerCase())?.hex ??
      DEFAULT_FALLBACK_HEX;
    setBrandHex(targetHex);
    setBrandName(p.brandColor);
    setGrayName(p.grayColor);
    setRadiusName(p.radius);
    setScaling(p.scaling);
    setTranslucent(p.panelBackground === "translucent");
    setDisplayFont(p.displayFont);
    setBodyFont(p.bodyFont);

    const isDarkMode = p.appearance === "dark";
    setDark(isDarkMode);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDarkMode);
      try {
        localStorage.setItem("shavin-appearance", isDarkMode ? "dark" : "light");
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
        localStorage.setItem("shavin-brand", targetHex);
        localStorage.setItem("shavin-gray", p.grayColor);
        localStorage.setItem("shavin-radius", p.radius);
        localStorage.setItem("shavin-scaling", String(p.scaling));
        localStorage.setItem("shavin-panel", p.panelBackground === "translucent" ? "translucent" : "solid");
        localStorage.setItem("shavin-display-font", p.displayFont);
        localStorage.setItem("shavin-body-font", p.bodyFont);
        window.dispatchEvent(new CustomEvent("shavin-theme-change"));
      } catch {
        // Ignore
      }
    }
  };

  const handleBrand = (hexOrName: string, name?: string) => {
    setThemeName("Custom");
    setBrandHex(hexOrName);
    if (name) setBrandName(name);
    applyBrandColor(hexOrName);
    try {
      localStorage.setItem("shavin-brand", hexOrName);
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };

  const handleGray = (name: string) => {
    setThemeName("Custom");
    setGrayName(name);
    applyGrayColor(name);
    try {
      localStorage.setItem("shavin-gray", name);
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };

  const handleAppearance = (val: string) => {
    const isDarkMode = val === "dark";
    setThemeName("Custom");
    setDark(isDarkMode);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDarkMode);
      try {
        localStorage.setItem("shavin-appearance", isDarkMode ? "dark" : "light");
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
        window.dispatchEvent(new CustomEvent("shavin-theme-change"));
      } catch {
        // Ignore
      }
    }
    applyBrandColor(brandHex);
  };

  const handleRadius = (name: string) => {
    setThemeName("Custom");
    setRadiusName(name);
    applyRadiusPreset(name);
    try {
      localStorage.setItem("shavin-radius", name);
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };

  const handleScaling = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setThemeName("Custom");
      setScaling(num);
      applyScalingPreset(num);
      try {
        localStorage.setItem("shavin-scaling", String(num));
        window.dispatchEvent(new CustomEvent("shavin-theme-change"));
      } catch {
        // Ignore
      }
    }
  };

  const handlePanelStyle = (val: string) => {
    const isTranslucent = val === "translucent";
    setThemeName("Custom");
    setTranslucent(isTranslucent);
    applyPanelBackground(isTranslucent);
    try {
      localStorage.setItem("shavin-panel", isTranslucent ? "translucent" : "solid");
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };

  const handleDisplayFont = (val: string) => {
    if (val === "__add_custom_font__") {
      setCustomFontHelp(true);
      return;
    }
    setThemeName("Custom");
    setDisplayFont(val);
    applyDisplayFontPreset(val);
    try {
      localStorage.setItem("shavin-display-font", val);
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };

  const handleBodyFont = (val: string) => {
    if (val === "__add_custom_font__") {
      setCustomFontHelp(true);
      return;
    }
    setThemeName("Custom");
    setBodyFont(val);
    applyBodyFontPreset(val);
    try {
      localStorage.setItem("shavin-body-font", val);
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };
  const handleSubheadingFont = (val: string) => {
    const next = val === "display" ? "display" : "body";
    setSubheadingFont(next);
    applySubheadingFont(next);
    try {
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };

  const resetAll = () => {
    setSubheadingFont(initialSubheadingRef.current);
    applySubheadingFont(initialSubheadingRef.current);
    if (initialProjectConfigRef.current) {
      const init = initialProjectConfigRef.current;
      setThemeName(init.themeName);
      setBrandHex(init.brandHex);
      setBrandName(init.brandName);
      setGrayName(init.grayName);
      setRadiusName(init.radiusName);
      setScaling(init.scaling);
      setTranslucent(init.translucent);
      setDisplayFont(init.displayFont);
      setBodyFont(init.bodyFont);

      applyBrandColor(init.brandHex);
      applyGrayColor(init.grayName);
      applyRadiusPreset(init.radiusName);
      applyScalingPreset(init.scaling);
      applyPanelBackground(init.translucent);
      applyDisplayFontPreset(init.displayFont);
      applyBodyFontPreset(init.bodyFont);

      try {
        localStorage.removeItem("shavin-theme");
        localStorage.removeItem("shavin-brand");
        localStorage.removeItem("shavin-gray");
        localStorage.removeItem("shavin-radius");
        localStorage.removeItem("shavin-scaling");
        localStorage.removeItem("shavin-display-font");
        localStorage.removeItem("shavin-body-font");
        sessionStorage.removeItem("shavin-theme");
        sessionStorage.removeItem("shavin-brand");
        sessionStorage.removeItem("shavin-gray");
        sessionStorage.removeItem("shavin-radius");
        sessionStorage.removeItem("shavin-scaling");
        window.dispatchEvent(new CustomEvent("shavin-theme-change"));
      } catch {
        // Ignore
      }
    } else {
      handleSelectTheme("Monochrome");
    }
  };

  const customGraySwatch =
    GRAY_PRESETS.find((g) => g.name.toLowerCase() === grayName.toLowerCase())?.swatch ?? DEFAULT_FALLBACK_HEX;

  const themeOptions = [
    ...THEME_PRESETS.map((p) => {
      const aHex = BRAND_PRESETS.find((a) => a.name.toLowerCase() === p.brandColor.toLowerCase())?.hex ?? DEFAULT_FALLBACK_HEX;
      const gSwatch = GRAY_PRESETS.find((g) => g.name.toLowerCase() === p.grayColor.toLowerCase())?.swatch ?? DEFAULT_FALLBACK_HEX;
      return {
        value: p.name,
        label: p.name,
        prefix: (
          <span data-swatch="true" className="inline-flex items-center gap-0.5 shrink-0" title={`${p.brandColor} + ${p.grayColor}`}>
            <span data-swatch="true" className="h-3 w-3.5 rounded-[var(--radius-sm)] border border-hairline" style={{ backgroundColor: aHex }} />
            <span data-swatch="true" className="h-3 w-3.5 rounded-[var(--radius-sm)] border border-hairline" style={{ backgroundColor: gSwatch }} />
          </span>
        ),
      };
    }),
    {
      value: "Custom",
      label: "Custom",
      prefix: (
        <span data-swatch="true" className="inline-flex items-center gap-0.5 shrink-0" title="Custom theme settings">
          <span
            data-swatch="true"
            className="h-3 w-3.5 rounded-[var(--radius-sm)] border border-hairline"
            style={{ backgroundColor: brandHex.startsWith("#") ? brandHex : DEFAULT_FALLBACK_HEX }}
          />
          <span
            data-swatch="true"
            className="h-3 w-3.5 rounded-[var(--radius-sm)] border border-hairline"
            style={{ backgroundColor: customGraySwatch }}
          />
        </span>
      ),
    },
  ];

  const scalingOptions = SCALING_PRESETS.map((pct) => ({
    value: String(pct),
    label: `${pct}%`,
  }));

  const displayFontOptions = [
    ...(detectedHeadingFont
      ? [{ value: detectedHeadingFont, label: `${detectedHeadingFont} (Project Font)` }]
      : []),
    ...DISPLAY_FONTS.filter((f) => f.name.toLowerCase() !== (detectedHeadingFont || "").toLowerCase()).map((f) => ({
      value: f.name,
      label: f.name,
    })),
    { value: "__add_custom_font__", label: "+ Add custom font..." },
  ];

  const bodyFontOptions = [
    ...(detectedBodyFont
      ? [{ value: detectedBodyFont, label: `${detectedBodyFont} (Project Font)` }]
      : []),
    ...BODY_FONTS.filter((f) => f.name.toLowerCase() !== (detectedBodyFont || "").toLowerCase()).map((f) => ({
      value: f.name,
      label: f.name,
    })),
    { value: "__add_custom_font__", label: "+ Add custom font..." },
  ];

  const isPresetActive = themeName && themeName !== "Custom";
  const activePreset = isPresetActive
    ? THEME_PRESETS.find((p) => p.name.toLowerCase() === themeName.toLowerCase())
    : null;

  const normalizeBrand = (a: string) => {
    const s = (a || "").toLowerCase();
    return s === "black" ? "monochrome" : s;
  };

  const isExactPreset =
    activePreset &&
    normalizeBrand(activePreset.brandColor) === normalizeBrand(brandName) &&
    (activePreset.grayColor || "").toLowerCase() === (grayName || "").toLowerCase() &&
    (activePreset.radius || "").toLowerCase() === (radiusName || "").toLowerCase() &&
    (activePreset.scaling || 100) === scaling &&
    (activePreset.panelBackground || "solid") === (translucent ? "translucent" : "solid") &&
    (activePreset.displayFont || "Inter").toLowerCase() === displayFont.toLowerCase() &&
    (activePreset.bodyFont || "Inter").toLowerCase() === bodyFont.toLowerCase();

  const generatedSnippet =
    isPresetActive && isExactPreset
      ? `<ThemeProvider theme="${themeName}">\n  {children}\n</ThemeProvider>`
      : `<ThemeProvider\n  brandColor="${brandName || brandHex}"\n  grayColor="${grayName.toLowerCase()}"\n  radius="${radiusName}"\n  scaling={${scaling}}\n  panelBackground="${translucent ? "translucent" : "solid"}"\n  displayFont="${displayFont}"\n  bodyFont="${bodyFont}"${subheadingFont === "display" ? "\n  subheadingFont=\"display\"" : ""}\n>\n  {children}\n</ThemeProvider>`;

  const rootFileHint = useMemo(() => {
    if (typeof document === "undefined") return "layout.tsx / app root";
    if (document.querySelector("next-route-announcer") || document.querySelector("script[src*='/_next/']")) {
      return document.getElementById("__next") ? "pages/_app.tsx" : "app/layout.tsx";
    }
    if (document.getElementById("root")) return "src/App.tsx";
    if (document.getElementById("__remix")) return "app/root.tsx";
    return "layout.tsx / app root";
  }, []);

  const copyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(generatedSnippet);
      setCopied(true);
      later(() => setCopied(false), 2000);
    }
  };


  return {
    themeName,
    setThemeName,
    dark,
    setDark,
    brandHex,
    setBrandHex,
    brandName,
    setBrandName,
    grayName,
    setGrayName,
    radiusName,
    setRadiusName,
    scaling,
    setScaling,
    translucent,
    setTranslucent,
    displayFont,
    setDisplayFont,
    bodyFont,
    setBodyFont,
    subheadingFont,
    setSubheadingFont,
    initialSubheadingRef,
    initialProjectConfigRef,
    detectedHeadingFont,
    setDetectedHeadingFont,
    detectedBodyFont,
    setDetectedBodyFont,
    copied,
    setCopied,
    customFontHelp,
    setCustomFontHelp,
    customFontHelpRef,
    handleSelectTheme,
    handleBrand,
    handleGray,
    handleAppearance,
    handleRadius,
    handleScaling,
    handlePanelStyle,
    handleDisplayFont,
    handleBodyFont,
    handleSubheadingFont,
    resetAll,
    customGraySwatch,
    themeOptions,
    scalingOptions,
    displayFontOptions,
    bodyFontOptions,
    isPresetActive,
    activePreset,
    normalizeBrand,
    isExactPreset,
    generatedSnippet,
    rootFileHint,
    copyCode,
  };
}

export type ThemeController = ReturnType<typeof useThemeController>;

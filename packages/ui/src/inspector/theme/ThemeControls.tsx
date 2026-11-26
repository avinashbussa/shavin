"use client";
import * as React from "react";






import { BRAND_PRESETS, GRAY_PRESETS, RADIUS_PRESETS } from "../../lib/theme-presets";




import { Select } from "../../primitives/Select";


import { Row } from "../../primitives/Row";

import { cn } from "../../lib/cn";


import type { ShavinDevToolsProps } from "../../primitives/ShavinDevTools/types";

import type { ThemeController } from "./useThemeController";
import { DEFAULT_FALLBACK_HEX } from "./useThemeController";

/** The theme controls (preset, brand, gray, appearance, radius, scaling, panel style, fonts, theme code), unchanged. */
export function ThemeControls({ theme, contentStyle }: { theme: ThemeController; contentStyle: React.CSSProperties }): React.JSX.Element {
  const {
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
  } = theme;
  return (
    <div className="space-y-3.5 text-xs transition-all duration-200">
                {/* Theme Preset */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Theme</span>
                  <div className="w-40">
                    <Select
                      value={themeName}
                      onChange={handleSelectTheme}
                      options={themeOptions}
                      size="sm"
                      ariaLabel="Theme"
                      contentStyle={contentStyle}
                      contentClassName="font-sans font-normal"
                    />
                  </div>
                </div>

                {/* Brand Color Swatch Row (Horizontal Scroll + Custom Hex Input) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-fg-muted font-medium">Brand Color</span>
                  </div>
                  <div className="flex items-center gap-1 p-2 rounded-[var(--radius-lg)] border border-hairline bg-surface-hover/30 overflow-x-auto scrollbar-none py-2">
                    {BRAND_PRESETS.map((preset) => {
                      const isSelected =
                        brandHex.toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleBrand(preset.hex, preset.name)}
                          title={preset.name}
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border transition cursor-pointer",
                            isSelected
                              ? "border-fg bg-surface-hover"
                              : "border-transparent hover:bg-surface-hover",
                          )}
                        >
                          <span
                            className="h-5 w-5 rounded-[calc(var(--radius-lg)-2px)] border border-hairline"
                            style={{ backgroundColor: preset.hex }}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Hex Color Affordance */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-xs text-fg-muted font-medium">Custom Hex</span>
                    <div className="flex items-center gap-1.5">
                      <label
                        className="relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-[var(--radius-lg)] border border-hairline overflow-hidden shrink-0"
                        style={{ backgroundColor: brandHex }}
                        title="Click to open color wheel"
                      >
                        <input
                          type="color"
                          value={brandHex.startsWith("#") && brandHex.length === 7 ? brandHex : DEFAULT_FALLBACK_HEX}
                          onChange={(e) => handleBrand(e.target.value, "Custom")}
                          className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                          aria-label="Custom color picker"
                        />
                      </label>
                      <input
                        type="text"
                        value={brandHex}
                        onChange={(e) => handleBrand(e.target.value, "Custom")}
                        placeholder={DEFAULT_FALLBACK_HEX}
                        className="w-24 font-mono text-xs px-2 py-1 bg-surface border border-hairline rounded-[var(--radius-lg)] text-fg outline-none focus:border-hairline-strong transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Gray Family */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Gray Family</span>
                  <div className="flex items-center gap-1">
                    {GRAY_PRESETS.map((g) => {
                      const isSelected =
                        grayName.toLowerCase() === g.name.toLowerCase();
                      return (
                        <button
                          key={g.name}
                          type="button"
                          onClick={() => handleGray(g.name)}
                          title={g.name}
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-[var(--radius-lg)] border transition cursor-pointer",
                            isSelected
                              ? "border-fg bg-surface-hover"
                              : "border-transparent hover:bg-surface-hover",
                          )}
                        >
                          <span
                            className="h-5 w-5 rounded-[calc(var(--radius-lg)-2px)] border border-hairline"
                            style={{ backgroundColor: g.swatch }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Appearance */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Appearance</span>
                  <div className="inline-flex rounded-[var(--radius-lg)] border border-hairline p-0.5 bg-surface gap-0.5">
                    {(
                      [
                        { value: "light", label: "Light" },
                        { value: "dark", label: "Dark" },
                      ] as const
                    ).map((item) => {
                      const isSelected = (dark && item.value === "dark") || (!dark && item.value === "light");
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleAppearance(item.value)}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-[calc(var(--radius-lg)-2px)] transition cursor-pointer font-medium",
                            isSelected
                              ? "bg-fg text-surface font-semibold"
                              : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                          )}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Radius Presets */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Radius</span>
                  <div className="flex items-center gap-1">
                    {RADIUS_PRESETS.map((r) => {
                      const isSelected = radiusName.toLowerCase() === r.name;
                      return (
                        <button
                          key={r.name}
                          type="button"
                          onClick={() => handleRadius(r.name)}
                          title={r.label}
                          aria-label={r.label}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-[var(--radius-lg)] transition cursor-pointer border",
                            isSelected
                              ? "border-fg bg-surface-hover text-fg"
                              : "border-transparent text-fg-muted hover:bg-surface-hover",
                          )}
                        >
                          <span
                            className={cn(
                              "h-3.5 w-3.5 border-2 border-l-0 border-b-0 transition-colors",
                              isSelected ? "border-fg" : "border-fg-muted",
                            )}
                            style={{ borderTopRightRadius: r.name === "full" ? "9999px" : r.lg }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scaling */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Scaling</span>
                  <div className="w-28">
                    <Select
                      value={String(scaling)}
                      onChange={handleScaling}
                      options={scalingOptions}
                      size="sm"
                      ariaLabel="Scaling percentage"
                      contentStyle={contentStyle}
                      contentClassName="font-sans font-normal"
                    />
                  </div>
                </div>

                {/* Panel Style */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Panel Style</span>
                  <div className="inline-flex rounded-[var(--radius-lg)] border border-hairline p-0.5 bg-surface gap-0.5">
                    {(
                      [
                        { value: "solid", label: "Solid" },
                        { value: "translucent", label: "Translucent" },
                      ] as const
                    ).map((item) => {
                      const isSelected = (translucent && item.value === "translucent") || (!translucent && item.value === "solid");
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handlePanelStyle(item.value)}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-[calc(var(--radius-lg)-2px)] transition cursor-pointer font-medium",
                            isSelected
                              ? "bg-fg text-surface font-semibold"
                              : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                          )}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Heading Font */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Heading Font</span>
                  <div className="w-40">
                    <Select
                      value={displayFont}
                      onChange={handleDisplayFont}
                      options={displayFontOptions}
                      size="sm"
                      ariaLabel="Heading font"
                      contentStyle={contentStyle}
                      contentClassName="font-sans font-normal"
                    />
                  </div>
                </div>

                {/* Subheading Font (h3-h6) */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Subheading Font</span>
                  <div className="w-40">
                    <Select
                      value={subheadingFont}
                      onChange={handleSubheadingFont}
                      options={[
                        { value: "body", label: "Body font" },
                        { value: "display", label: "Display font" },
                      ]}
                      size="sm"
                      ariaLabel="Subheading font (h3 to h6)"
                      contentStyle={contentStyle}
                      contentClassName="font-sans font-normal"
                    />
                  </div>
                </div>

                {/* Body Font */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Body Font</span>
                  <div className="w-40">
                    <Select
                      value={bodyFont}
                      onChange={handleBodyFont}
                      options={bodyFontOptions}
                      size="sm"
                      ariaLabel="Body font"
                      contentStyle={contentStyle}
                      contentClassName="font-sans font-normal"
                    />
                  </div>
                </div>

                {customFontHelp && (
                  <div
                    ref={customFontHelpRef}
                    role="status"
                    className="space-y-1.5 rounded-[var(--radius-lg)] border border-hairline bg-surface-hover/60 p-2.5 text-xs text-fg-muted"
                  >
                    <p className="font-semibold text-fg">Add a custom font</p>
                    <p>
                      Load the font yourself (next/font or an @font-face rule), then pass its CSS font-family to ThemeProvider as{" "}
                      <code className="font-mono text-fg">displayFont</code> or <code className="font-mono text-fg">bodyFont</code>. A
                      value that is not a built-in font name is used as written and is not fetched.
                    </p>
                    <p>
                      Setting <code className="font-mono text-fg">--font-display</code> or <code className="font-mono text-fg">--font-body</code>{" "}
                      in your own CSS alone does not work: ThemeProvider&apos;s values take precedence.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCustomFontHelp(false)}
                      className="rounded-[var(--radius-lg)] border border-hairline px-2 py-1 text-xs font-medium text-fg hover:bg-surface-hover"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Code Snippet Box */}
                <div className="pt-3 border-t border-hairline space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-fg">Theme Code</span>
                    <span className="text-xs text-fg-muted font-mono">{rootFileHint}</span>
                  </div>
                  <pre className="p-2.5 rounded-[var(--radius-lg)] bg-surface-hover/60 border border-hairline font-mono text-xs text-fg overflow-x-auto select-all leading-relaxed">
                    {generatedSnippet}
                  </pre>
                </div>
              </div>
  );
}

/**
 * Tokens the inspector pins on its own root so a page theme (or the Theme tool changing the page) never changes
 * how the inspector looks. `ScopedThemeProvider` sets brand, gray, radius and the surface/text roles; it does not
 * set the status colours or the panel shadow, which `:root.dark` redefines, so they are pinned here per scheme.
 * Values are the same ones `global.css` uses (triplets, no colour functions).
 */
import type * as React from "react";
import type { Scheme } from "./scheme";

type Vars = Record<string, string>;

const LIGHT: Vars = {
  "--danger": "186 55 42",
  "--danger-fg": "255 255 255",
  "--warning": "156 86 4",
  "--warning-fg": "255 255 255",
  "--success": "4 119 83",
  "--success-fg": "255 255 255",
  // ds-lint-disable-next-line no-rgb — pinned elevation, the same values as --shadow-4 in global.css
  "--shadow-4": "0 8px 16px -4px rgb(0 0 0 / 0.12), 0 2px 4px -2px rgb(0 0 0 / 0.08)",
};

const DARK: Vars = {
  "--danger": "235 113 104",
  "--danger-fg": "10 10 12",
  "--warning": "251 191 36",
  "--warning-fg": "10 10 12",
  "--success": "52 211 153",
  "--success-fg": "10 10 12",
  // ds-lint-disable-next-line no-rgb — pinned elevation, the same values as --shadow-4 in global.css (dark)
  "--shadow-4": "0 8px 16px -4px rgb(0 0 0 / 0.55), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
};

/** The soft orchid that marks elements of the page under inspection (the inspector's own UI stays monochrome). */
const ELEMENT = "176 112 222";

export function pinnedVars(scheme: Scheme): React.CSSProperties {
  return {
    ...(scheme === "dark" ? DARK : LIGHT),
    "--shadow-panel": "var(--shadow-4)",
    "--shavin-element": ELEMENT,
  } as React.CSSProperties;
}

/** Base type for the inspector: fixed, so the page's font and scale do not reshape the controls. */
export const ROOT_TEXT: React.CSSProperties = {
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: "13px",
  lineHeight: 1.4,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "normal",
  textTransform: "none",
  fontWeight: 400,
  textAlign: "left",
  WebkitFontSmoothing: "antialiased",
};

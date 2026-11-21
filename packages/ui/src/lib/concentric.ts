/**
 * Concentric Radius — Foundation Automation
 * ──────────────────────────────────────────
 * Implements R_inner = max(floor, R_outer − P) via CSS custom property cascade,
 * floor = min(--radius-lg, --radius-panel / 2) (see CONCENTRIC_FLOOR).
 *
 * Container components (Card, Flex translucent, Grid translucent, Box
 * translucent, Section translucent, Calendar, CheckboxCards, etc.) call
 * `concentricContainerStyle()` with their padding token. The returned
 * style object sets `--radius-panel-inner` on the container's root element.
 *
 * Any descendant with `radius="concentric"` (Image, Inset, etc.) reads this
 * variable via the `rounded-panel-inner` Tailwind utility and automatically
 * gets the correct inner radius — zero JS, zero runtime measurement.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CASCADE MODEL — Four Rules Based on VISIBLE BOUNDARY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The key insight: radius only means something when paired with a VISIBLE
 * BOUNDARY (bg color or border). An element with bg but no radius has sharp
 * corners — that IS the visual reference. A concentric child must not skip
 * past it to a grandparent's rounded corners, or you get the optical disaster
 * of 32px > 0px > 20px (three visible containers, middle one sharp).
 *
 * ┌─────────────────┬───────────┬─────────┬────────────────────────────────┐
 * │ Visible Boundary│ Has Radius│ Padding │ Action                         │
 * ├─────────────────┼───────────┼─────────┼────────────────────────────────┤
 * │ Yes (bg/border) │ Yes       │ Any     │ SET: max(floor, R_outer − P)   │
 * │ Yes (bg/border) │ No        │ Any     │ RESET: 0px (sharp = reference) │
 * │ No (transparent)│ —         │ Any     │ PASS THROUGH (CSS inheritance) │
 * └─────────────────┴───────────┴─────────┴────────────────────────────────┘
 *
 * "Visible Boundary" = element has a background color or border that creates
 * a visible edge. In Shavin primitives, `translucent=true` creates this.
 * In Studio, any node with a bgColor/border prop set counts.
 *
 * EXAMPLES:
 *
 * Card [r=32, bg, p-5] > Flex [no bg, no r, no p] > Image [concentric]
 *   Card SETs: inner = max(floor, 32−20) = 12px
 *   Flex: transparent, no padding → PASS THROUGH
 *   Image reads 12px ✓
 *
 * Card [r=32, bg, p-5] > Flex [bg, NO r, p-3] > Image [concentric]
 *   Card SETs: inner = max(floor, 32−20) = 12px
 *   Flex: has visible boundary (bg) but NO radius → RESET to 0px
 *   Image reads 0px (sharp, matching Flex's sharp corners) ✓
 *
 * Card [r=16, p-5] > Card [p-4] > Image [concentric]
 *   Outer Card SETs: inner = max(floor, 16−20) = floor (8px at medium)
 *   Inner Card reads its outer radius from the parent (CardContext): 8px,
 *   and SETs: inner = max(floor, 8−16) = floor
 *   Image reads the floor ✓ (no CSS cycle: the maths is a string built in JS)
 *
 * A transparent element with padding does NOT compound in CSS: a custom
 * property cannot subtract from its own inherited value (that is a cycle and
 * resolves to nothing). Put the padding on the visible container instead.
 *
 * FALLBACK: When no ancestor sets the variable, `:root` defines
 * --radius-panel-inner = var(--radius-panel) (no subtraction). The
 * concentric element resolves to plain panel radius — safe but the user
 * should be warned that no container reference exists.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * STUDIO INTEGRATION (tree intelligence, future)
 * ═══════════════════════════════════════════════════════════════════════════
 * When Studio's tree renderer encounters a node with:
 *  - bgColor or border prop + radius prop → apply concentricContainerStyle()
 *  - bgColor or border prop but NO radius  → apply data-concentric-reset
 *  - padding prop, no bgColor/border        → pass through (a custom property
 *    cannot subtract from its own inherited value without a CSS cycle; nest a
 *    Card instead, which computes its radius from its parent's in JS)
 *  - neither                                → do nothing (pass through)
 *
 * The CSS rule [data-concentric-reset] in global.css handles the reset case
 * for arbitrary elements that aren't Shavin primitives (raw divs in Studio).
 */

import type { CSSProperties } from "react";

/** Tailwind padding token → rem value. */
const PADDING_REM: Record<string, string> = {
  "0": "0rem",
  "0.5": "0.125rem",
  "1": "0.25rem",
  "1.5": "0.375rem",
  "2": "0.5rem",
  "2.5": "0.625rem",
  "3": "0.75rem",
  "3.5": "0.875rem",
  "4": "1rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "7": "1.75rem",
  "8": "2rem",
  "9": "2.25rem",
  "10": "2.5rem",
  "11": "2.75rem",
  "12": "3rem",
  "14": "3.5rem",
  "16": "4rem",
  "20": "5rem",
  "24": "6rem",
};

/** Card padding variant → padding token (Tailwind scale). */
const CARD_PADDING_MAP: Record<string, string> = {
  none: "0",
  xs: "2",
  sm: "4",
  md: "5",
  lg: "6",
  xl: "8",
  "2xl": "10",
  "3xl": "12",
};

/**
 * Converts a Card padding variant ("none"|"xs"|"sm"|"md"|"lg"|"xl"|"2xl"|"3xl")
 * into the corresponding Tailwind padding scale token ("0"|"2"|"4"|"5"|"6"|"8"|"10"|"12").
 */
export function cardPaddingToScale(padding?: string | null): string | null {
  if (!padding) return null;
  return CARD_PADDING_MAP[padding] ?? null;
}

/**
 * Floor for Rule 1 when padding ≥ the panel radius. The token radii are
 * small (--radius-panel is 16px at the medium preset) and Card padding is
 * 16–48px, so a bare max(0, R − P) collapsed EVERY concentric child of a
 * Card (padding sm and up) to square corners. Per the concentric law's
 * "≤ 0 → use the next smaller token": fall back to the control radius,
 * capped at half the panel radius so the inner arc always stays inside the
 * outer one (and the "none" preset still yields 0px).
 */
export const CONCENTRIC_FLOOR = "min(var(--radius-lg), calc(var(--radius-panel) / 2))";

/** Options for {@link concentricContainerStyle} and {@link concentricRadius}. */
export interface ConcentricOptions {
  /** The container's own outer radius as a CSS expression. Default `var(--radius-panel)`. A nested
   *  Card passes its parent's inner radius so the chain stays concentric. */
  outer?: string;
  /** The container draws a 1px border. With no padding the child sits inside that border, so its
   *  radius is `outer − 1px` (never below 0). */
  border?: boolean;
}

/**
 * The concentric inner radius as a CSS expression: `max(<floor>, calc(<outer> − <pad>))`, or, with
 * no padding, the outer radius itself (minus the 1px border when there is one). Pure string maths:
 * no custom property reads its own value, so there is no CSS cycle.
 *
 * @param paddingScale Tailwind padding token ("0", "1", "3", "4", "5", ...). Unknown tokens → null.
 */
export function concentricRadius(paddingScale: string | null | undefined, opts: ConcentricOptions = {}): string | null {
  const outer = opts.outer ?? "var(--radius-panel)";
  const scale = paddingScale ?? "0";
  if (scale === "0") return opts.border ? `max(0px, calc(${outer} - 1px))` : outer;
  const rem = PADDING_REM[scale];
  if (!rem) return null;
  return `max(${CONCENTRIC_FLOOR}, calc(${outer} - ${rem}))`;
}

/**
 * Rule 1 — SET: Computes the CSS style for a VISIBLE BOUNDARY element that
 * HAS radius (bg/border + rounded). This is the primary visual reference.
 *
 * `--radius-panel-inner = max(<floor>, calc(var(--radius-panel) - <pad>rem))`
 * (see CONCENTRIC_FLOOR — never square unless the theme radius is 0).
 * With no padding (Card `padding="none"`), the inner radius is the outer one
 * (minus the border), so flush children follow the container's own corners
 * instead of inheriting a value from some ancestor.
 *
 * The container is the new visual reference — the nearest visible boundary
 * with radius wins. Descendants with `radius="concentric"` read this value.
 *
 * @param paddingScale Tailwind padding token ("0", "3", "4", "5", "6", "8", etc.) or Card padding variant
 * @param isCardPadding When true, `paddingScale` is treated as a Card variant ("none", "sm", "md", etc.)
 * @param opts Outer radius and border (see {@link ConcentricOptions})
 * @returns CSSProperties with `--radius-panel-inner` set, or an empty object for an unknown token
 */
export function concentricContainerStyle(
  paddingScale?: string | null,
  isCardPadding?: boolean,
  opts: ConcentricOptions = {},
): CSSProperties {
  const scale = isCardPadding
    ? cardPaddingToScale(paddingScale ?? "none")
    : paddingScale ?? "0";
  const value = concentricRadius(scale, opts);
  if (!value) return {};
  return { "--radius-panel-inner": value } as CSSProperties;
}

/**
 * The padding a container really has, read from its className, as a Tailwind scale token. The
 * translucent Box/Flex/Grid/Section take their padding from className (there is no padding prop),
 * so the concentric inner radius must come from there, not from a guess. Only unprefixed
 * utilities count (`p-6`, `px-4 py-8`); responsive or state variants (`md:p-8`) are ignored. The
 * corner gap is the smaller of the horizontal and vertical padding.
 *
 * @returns the token ("0", "4", "6", ...) or "0" when no padding utility is present.
 */
export function paddingScaleFromClassName(className?: string | null): string {
  if (!className) return "0";
  let all: string | undefined;
  let x: string | undefined;
  let y: string | undefined;
  for (const cls of className.split(/\s+/)) {
    const m = /^p([xy]?)-(\d+(?:\.5)?)$/.exec(cls);
    if (!m || !PADDING_REM[m[2]]) continue;
    if (m[1] === "x") x = m[2];
    else if (m[1] === "y") y = m[2];
    else all = m[2];
  }
  const h = Number(x ?? all ?? 0);
  const v = Number(y ?? all ?? 0);
  return String(Math.min(h, v));
}

/**
 * Rule 2 — RESET: Computes the CSS style for a VISIBLE BOUNDARY element that
 * has NO radius (has bg/border but sharp corners). This element becomes the
 * new visual reference with R=0 — any concentric descendant must align to
 * these sharp corners, NOT skip past to a grandparent's rounded corners.
 *
 * `--radius-panel-inner = 0px`
 *
 * It is used by Studio tree intelligence (bg-without-radius on arbitrary
 * nodes), the CSS rule `[data-concentric-reset]` in global.css for raw
 * elements, and any component that has a bg but deliberately no radius.
 *
 * @param _paddingScale Ignored (R_outer = 0, so the result is 0px). Kept for API symmetry.
 * @returns CSSProperties with `--radius-panel-inner` set to 0px
 */
export function concentricBoundaryResetStyle(
  _paddingScale?: string | null,
): CSSProperties {
  return {
    "--radius-panel-inner": "0px",
  } as CSSProperties;
}

/**
 * Merges concentric container style into an existing style object.
 * If the caller already has a `--radius-panel-inner` in their style (edge case),
 * the computed value takes precedence.
 */
export function withConcentricStyle(
  baseStyle: CSSProperties | undefined,
  concentricStyle: CSSProperties,
): CSSProperties {
  return { ...(baseStyle ?? {}), ...concentricStyle };
}

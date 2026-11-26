/** Colour maths for the inspector's contrast rule. Pure functions, no DOM. */

export type Rgb = readonly [number, number, number];
export interface Rgba {
  rgb: Rgb;
  a: number;
}

const clamp255 = (n: number) => Math.max(0, Math.min(255, n));

/** Parses `rgb()`, `rgba()` (comma or space syntax, optional percent alpha) and `#rgb` / `#rrggbb` / `#rrggbbaa`. */
export function parseColor(value: string | null | undefined): Rgba | null {
  if (!value) return null;
  const s = value.trim().toLowerCase();
  if (s === "transparent") return { rgb: [0, 0, 0], a: 0 };
  const fn = s.match(/^rgba?\(([^)]+)\)$/);
  if (fn && fn[1]) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const channel = (p: string) => (p.endsWith("%") ? (parseFloat(p) / 100) * 255 : parseFloat(p));
    const rgb = [channel(parts[0]!), channel(parts[1]!), channel(parts[2]!)];
    if (rgb.some((n) => !Number.isFinite(n))) return null;
    let a = 1;
    if (parts[3] !== undefined) {
      a = parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
      if (!Number.isFinite(a)) return null;
    }
    return { rgb: [clamp255(rgb[0]!), clamp255(rgb[1]!), clamp255(rgb[2]!)], a: Math.max(0, Math.min(1, a)) };
  }
  const hex = s.match(/^#([0-9a-f]{3,8})$/);
  if (hex && hex[1]) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return { rgb: [n(0), n(2), n(4)], a: h.length === 8 ? n(6) / 255 : 1 };
  }
  return null;
}

/** Source over destination, both given as colour plus alpha; the result keeps the combined alpha. */
export function over(top: Rgba, bottom: Rgba): Rgba {
  const a = top.a + bottom.a * (1 - top.a);
  if (a <= 0) return { rgb: [0, 0, 0], a: 0 };
  const mix = (i: 0 | 1 | 2) => Math.round((top.rgb[i] * top.a + bottom.rgb[i] * bottom.a * (1 - top.a)) / a);
  return { rgb: [mix(0), mix(1), mix(2)], a };
}

export function luminance([r, g, b]: Rgb): number {
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Luminance above which black text has more contrast than white text (0.179). */
export const LIGHT_THRESHOLD = 0.179;

export const isLight = (rgb: Rgb): boolean => luminance(rgb) > LIGHT_THRESHOLD;

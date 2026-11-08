/**
 * Canonical overlay-preset style table — pure data, no JSX.
 *
 * Lives in its own .ts module so non-JSX consumers (notably
 * @shavin/block-renderer's parser, which folds serialized overlays
 * back into bg* props) can import it via the `@shavin/ui/lib/*` subpath.
 * `media-overlays.tsx` re-exports this — the public API is unchanged.
 */
export const OVERLAY_PRESET_STYLES: Record<string, { background?: string; backgroundColor?: string }> = {
  "gradient-bottom": { background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%)" },
  "gradient-top": { background: "linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%)" },
  "gradient-radial": { background: "radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.85) 100%)" },
  "vignette": { background: "radial-gradient(circle at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)" },
  "scrim": { background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.85) 100%)" },
  "dark-20": { backgroundColor: "rgba(0,0,0,0.2)" },
  "dark-30": { backgroundColor: "rgba(0,0,0,0.3)" },
  "dark-50": { backgroundColor: "rgba(0,0,0,0.5)" },
  "dark-75": { backgroundColor: "rgba(0,0,0,0.75)" },
  "light-20": { backgroundColor: "rgba(255,255,255,0.2)" },
  "light-30": { backgroundColor: "rgba(255,255,255,0.3)" },
  "light-50": { backgroundColor: "rgba(255,255,255,0.5)" },
  // Directional scrim for left-aligned copy over media (dense left, clear right).
  "scrim-left": { background: "linear-gradient(to right, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0) 85%)" },
  // Dissolves media into the page canvas — theme-aware, for photos that bleed into the next section.
  "fade-canvas": { background: "linear-gradient(to bottom, rgb(var(--bg-canvas) / 0) 35%, rgb(var(--bg-canvas) / 0.85) 80%, rgb(var(--bg-canvas)) 100%)" },
  // Mesh backdrops. mesh-accent follows the theme accent; the others are fixed pastel palettes
  // (Lummi-style atmosphere) that read well under both light and dark copy with a scrim.
  "mesh-accent": { background: "radial-gradient(at 12% 18%, rgb(var(--accent) / 0.16) 0px, transparent 55%), radial-gradient(at 88% 12%, rgb(var(--accent) / 0.08) 0px, transparent 50%), radial-gradient(at 70% 92%, rgb(var(--accent) / 0.12) 0px, transparent 55%), rgb(var(--bg-canvas))" },
  "mesh-mint": { background: "radial-gradient(at 10% 10%, rgba(167,243,208,0.7) 0px, transparent 55%), radial-gradient(at 90% 20%, rgba(186,230,253,0.7) 0px, transparent 50%), radial-gradient(at 50% 90%, rgba(254,240,138,0.55) 0px, transparent 55%), rgb(248 250 252)" },
  // Wave meshes — wide elliptical washes (no hard blobs), tuned from apps/website gradients.css.
  "mesh-dawn": { background: "radial-gradient(ellipse 70% 55% at 88% 8%, hsla(13, 100%, 88%, 0.75) 0%, transparent 70%), radial-gradient(ellipse 85% 60% at 62% 40%, hsla(323, 100%, 90%, 0.7) 0%, transparent 72%), radial-gradient(ellipse 90% 65% at 30% 92%, hsla(268, 100%, 90%, 0.75) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 5% 20%, hsla(190, 90%, 92%, 0.6) 0%, transparent 70%), rgb(253 251 255)" },
  "mesh-night": { background: "radial-gradient(ellipse 80% 60% at 15% 85%, hsla(257, 91%, 30%, 0.55) 0%, transparent 70%), radial-gradient(ellipse 70% 55% at 85% 15%, hsla(227, 98%, 55%, 0.45) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 100% 60%, hsla(166, 71%, 60%, 0.18) 0%, transparent 70%), radial-gradient(ellipse 90% 70% at 40% 105%, hsla(212, 100%, 50%, 0.3) 0%, transparent 70%), rgb(6 7 14)" },
  "mesh-lime": { background: "radial-gradient(ellipse 75% 55% at 18% 0%, hsla(82, 85%, 55%, 0.22) 0%, transparent 70%), radial-gradient(ellipse 70% 60% at 92% 30%, hsla(165, 70%, 45%, 0.2) 0%, transparent 70%), radial-gradient(ellipse 95% 65% at 50% 110%, hsla(140, 60%, 30%, 0.35) 0%, transparent 72%), radial-gradient(ellipse 50% 40% at 70% 70%, hsla(82, 85%, 60%, 0.08) 0%, transparent 70%), rgb(8 10 9)" },
  // Ported 1:1 from the Shavin website (apps/website/src/app/gradients.css .the-glade-festival-rose / -rose-vibrant).
  "mesh-rose": { background: "radial-gradient(circle at 93% 93%, hsla(0, 0%, 0%, 1) 14.5%, transparent 72%), radial-gradient(circle at 26% 9%, hsla(0, 0%, 0%, 1) 0%, transparent 45%), radial-gradient(circle at 15% 79%, hsla(325, 80%, 65%, 0.16) 3%, transparent 35%), radial-gradient(circle at 40% 104%, hsla(14, 85%, 65%, 0.14) 4%, transparent 50%), radial-gradient(circle at 0% 60%, hsla(268, 75%, 68%, 0.16) 2%, transparent 38%), radial-gradient(circle at 92% 37%, hsla(330, 70%, 55%, 0.12) 3%, transparent 35%), radial-gradient(circle at 101% 16%, hsla(18, 90%, 68%, 0.10) 13%, transparent 40%), radial-gradient(circle at 90% 13%, hsla(280, 80%, 68%, 0.14) 1%, transparent 35%), radial-gradient(circle at 104% 56%, hsla(340, 85%, 68%, 0.12) 4%, transparent 25%), radial-gradient(circle at 97% 19%, hsla(260, 65%, 50%, 0.10) 18%, transparent 35%), hsla(0, 0%, 0%, 1)" },
  "mesh-rose-vibrant": { background: "radial-gradient(circle at 93% 93%, hsla(320, 0%, 0%, 1) 14.5%, transparent 72%), radial-gradient(circle at 26% 9%, hsla(320, 0%, 0%, 1) 0%, transparent 45%), radial-gradient(circle at 15% 79%, hsla(323, 90%, 36%, 0.45) 3%, transparent 35%), radial-gradient(circle at 40% 104%, hsla(13, 95%, 52%, 0.42) 4%, transparent 50%), radial-gradient(circle at 0% 60%, hsla(268, 75%, 38%, 0.65) 2%, transparent 38%), radial-gradient(circle at 92% 37%, hsla(335, 78%, 28%, 0.75) 3%, transparent 35%), radial-gradient(circle at 101% 16%, hsla(18, 92%, 58%, 0.28) 13%, transparent 40%), radial-gradient(circle at 90% 13%, hsla(285, 88%, 52%, 0.55) 1%, transparent 35%), radial-gradient(circle at 104% 56%, hsla(340, 85%, 58%, 0.38) 4%, transparent 25%), radial-gradient(circle at 97% 19%, hsla(260, 70%, 25%, 0.35) 18%, transparent 35%), hsla(320, 10%, 2%, 1)" },
  "mesh-peach": { background: "radial-gradient(at 15% 20%, rgba(254,205,211,0.8) 0px, transparent 55%), radial-gradient(at 85% 15%, rgba(253,230,138,0.6) 0px, transparent 50%), radial-gradient(at 60% 95%, rgba(221,214,254,0.75) 0px, transparent 55%), rgb(255 251 245)" },
};

/** Presets that animate (slow drift) when suffixed with `-animated`, e.g. "mesh-lime-animated". */
export const ANIMATABLE_PRESET_PREFIX = "mesh-";
export const ANIMATED_SUFFIX = "-animated";

/** Ordered preset keys — the canonical list for pickers and legacy `bgOverlay` shorthand. */
export const OVERLAY_PRESET_KEYS: readonly string[] = Object.keys(OVERLAY_PRESET_STYLES);

/** Minimal layer shape for shorthand parse/serialize (no React dependency). */
export interface ShorthandLayer {
  id: string;
  type: string; // "solid" | "linear" | "radial" | "preset"
  presetKey?: string;
  opacity?: number;
  visible?: boolean;
  color?: string;
  token?: string;
  angle?: number;
  /** Radial centre, e.g. "20% 30%" (default "center"). */
  position?: string;
  /** Slow drift animation (mesh presets only, via "-animated" suffix). */
  animated?: boolean;
  stops?: Array<{ color: string; offset: number; opacity: number; token?: string }>;
  /** For type "fx": the registered Backdrop variant. */
  fxKey?: string;
  /** For type "fx": params handed to the Backdrop renderer. */
  fxParams?: Record<string, string>;
}

const FX_TOKEN_RE = /^fx:([A-Za-z0-9][\w-]*)(?:\s*\(([\s\S]*)\))?$/;
const FX_BARE_VALUE_RE = /^[\w.#%+-]+$/;

/** Parse fx params: `speed=1.2 color=accent text='Plan money'` (spaces or commas between pairs). */
function parseFxParams(raw: string): Record<string, string> | null {
  const out: Record<string, string> = {};
  let i = 0;
  const n = raw.length;
  while (i < n) {
    while (i < n && /[\s,]/.test(raw[i])) i++;
    if (i >= n) break;
    const keyMatch = /^[A-Za-z_][\w-]*/.exec(raw.slice(i));
    if (!keyMatch) return null;
    const key = keyMatch[0];
    i += key.length;
    if (raw[i] !== "=") return null;
    i++;
    let value = "";
    if (raw[i] === "'") {
      i++;
      while (i < n && raw[i] !== "'") {
        if (raw[i] === "\\" && i + 1 < n) i++;
        value += raw[i++];
      }
      if (raw[i] !== "'") return null;
      i++;
    } else {
      while (i < n && !/[\s,]/.test(raw[i])) value += raw[i++];
    }
    out[key] = value;
  }
  return out;
}

function printFxParamValue(v: string): string {
  return FX_BARE_VALUE_RE.test(v) ? v : `'${v.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

// ─── Shorthand syntax ───────────────────────────────────────────────
//
// bgOverlays accepts a comma-separated list of layers. Each token is one of:
//
//   Preset:    "dark-50"  or  "scrim/90"
//              → known preset at 100% or /opacity
//
//   Solid:     "#ff5733/50"  or  "#000/80"  or  "(accent)/30"  or  "(fg)/60"
//              → hex or (token) with optional /opacity (default 100)
//
//   Gradient:  "linear(45deg, #000/0%, #000/100%)"  or
//              "linear(90deg, (accent)/0%, (fg)/100%)/80"
//              "radial((accent)/0%, (accent)/100%)/60"
//              "radial(at 20% 30%, (accent)/0%, #000/0%)" — off-centre radial
//              "linear(180deg, (canvas)/57%, (canvas)/96%/80)" — a stop's own opacity
//              goes after its offset
//
//   Mesh:      "mesh-accent" | "mesh-lime" | "mesh-night" | "mesh-dawn" | "mesh-rose" | "mesh-rose-vibrant" | "mesh-mint" | "mesh-peach"
//              append "-animated" for a slow drift ("mesh-lime-animated")
//              → type(angle, stops) with optional /opacity at the end
//              → each stop: color-or-token/offset%, optionally /opacity after it
//
//   Fx:        "fx:dither-waves"  or  "fx:dither-waves(speed=1.2 color=accent)/80"
//              "fx:type-tiles(text='Plan money')"
//              → a registered Backdrop variant (e.g. from @shavin/fx); params are
//                key=value pairs, quote values with spaces or symbols in '…'
//
// JSON array of OverlayLayer[] remains as fallback for Studio's internal use
// (hidden layers, unknown layer types).

/**
 * Parse a single shorthand token into a ShorthandLayer.
 * Returns null if the token doesn't match any known pattern.
 */
function parseShorthandToken(token: string, index: number): ShorthandLayer | null {
  // Extract trailing /opacity if present (but only when it's NOT inside parens)
  const { core, opacity } = splitTrailingOpacity(token);
  const id = `overlay-${index + 1}`;

  // 0. Fx backdrop (e.g. "fx:dither-waves", "fx:fluid-silk(speed=1.2)")
  const fxMatch = core.match(FX_TOKEN_RE);
  if (fxMatch) {
    const fxParams = fxMatch[2] !== undefined ? parseFxParams(fxMatch[2]) : {};
    if (!fxParams) return null;
    return {
      id,
      type: "fx",
      fxKey: fxMatch[1],
      ...(Object.keys(fxParams).length ? { fxParams } : {}),
      opacity,
      visible: true,
    };
  }

  // 1. Preset key (e.g. "dark-50", "scrim", "gradient-bottom")
  if (core in OVERLAY_PRESET_STYLES) {
    return { id, type: "preset", presetKey: core, opacity, visible: true };
  }
  // 1b. Animated mesh preset (e.g. "mesh-lime-animated")
  if (core.endsWith(ANIMATED_SUFFIX)) {
    const base = core.slice(0, -ANIMATED_SUFFIX.length);
    if (base in OVERLAY_PRESET_STYLES && base.startsWith(ANIMATABLE_PRESET_PREFIX)) {
      return { id, type: "preset", presetKey: base, animated: true, opacity, visible: true };
    }
  }

  // 2. Solid hex color (e.g. "#ff5733", "#000", "#1a2b3c80")
  if (/^#[0-9a-fA-F]{3,8}$/.test(core)) {
    return { id, type: "solid", color: core, opacity, visible: true };
  }

  // 3. Solid token color (e.g. "(accent)", "(fg)", "(bg-surface)")
  const tokenMatch = core.match(/^\((.+)\)$/);
  if (tokenMatch) {
    return { id, type: "solid", token: tokenMatch[1].trim(), opacity, visible: true };
  }

  // 4. Gradient: "linear(45deg, stops...)" or "radial(stops...)"
  const gradMatch = core.match(/^(linear|radial)\s*\(([\s\S]*)\)$/i);
  if (gradMatch) {
    const gradType = gradMatch[1].toLowerCase();
    const inner = gradMatch[2].trim();

    // Extract optional angle for linear: "45deg, color/0%, color/100%"
    let angle: number | undefined;
    let position: string | undefined;
    let stopsStr = inner;

    if (gradType === "radial") {
      // Optional centre: "at 20% 30%, stops..."
      const posMatch = inner.match(/^at\s+([^,]+?)\s*,\s*([\s\S]*)$/);
      if (posMatch) {
        position = posMatch[1].trim();
        stopsStr = posMatch[2];
      }
    }

    if (gradType === "linear") {
      const angleMatch = inner.match(/^(\d+)deg\s*,\s*([\s\S]*)$/);
      if (angleMatch) {
        angle = parseInt(angleMatch[1], 10);
        stopsStr = angleMatch[2];
      } else {
        angle = 180; // default
      }
    }

    // Parse stops: "color/offset%, color/offset%, ..."
    const stops = parseGradientStops(stopsStr);
    if (stops.length >= 2) {
      return {
        id,
        type: gradType,
        angle,
        position,
        stops,
        opacity,
        visible: true,
      };
    }
  }

  return null;
}

/**
 * Split a trailing /opacity from a token, respecting parentheses.
 * e.g. "dark-50/80" → { core: "dark-50", opacity: 80 }
 *      "linear(45deg, #000/0%, #000/100%)/80" → { core: "linear(...)", opacity: 80 }
 *      "#ff5733" → { core: "#ff5733", opacity: 100 }
 */
function splitTrailingOpacity(token: string): { core: string; opacity: number } {
  // Find the LAST / that's outside any parentheses
  let depth = 0;
  let slashIdx = -1;
  let quoted = false;
  for (let i = token.length - 1; i >= 0; i--) {
    const ch = token[i];
    if (ch === "'" && token[i - 1] !== "\\") {
      quoted = !quoted;
      continue;
    }
    if (quoted) continue;
    if (ch === ")") depth++;
    else if (ch === "(") depth--;
    else if (ch === "/" && depth === 0) {
      slashIdx = i;
      break;
    }
  }
  if (slashIdx > 0) {
    const core = token.slice(0, slashIdx).trim();
    const opStr = token.slice(slashIdx + 1).trim();
    const opVal = parseInt(opStr, 10);
    if (!isNaN(opVal)) {
      return { core, opacity: Math.max(0, Math.min(100, opVal)) };
    }
  }
  return { core: token.trim(), opacity: 100 };
}

/**
 * Parse gradient stops: "#000/0%, #000/100%" or "(accent)/0%, (fg)/100%"
 * Each stop: color-or-token/offset%, with an optional /opacity after the offset
 */
function parseGradientStops(stopsStr: string): Array<{ color: string; offset: number; opacity: number; token?: string }> {
  const stops: Array<{ color: string; offset: number; opacity: number; token?: string }> = [];
  // Split by comma but respect parentheses (for token colors)
  const parts = splitByCommaRespectingParens(stopsStr);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // "color/offset%" or "color/offset%/opacity". Neither a hex nor a (token) holds a "/".
    const segs = trimmed.split("/").map((s) => s.trim());
    if (segs.length < 2 || segs.length > 3) continue;
    const [colorPart, offsetStr, stopOpStr] = segs;
    const offsetMatch = offsetStr.match(/^(\d+(?:\.\d+)?)%?$/);
    if (!offsetMatch) continue;
    const offset = parseFloat(offsetMatch[1]);
    let opacity = 100;
    if (stopOpStr !== undefined) {
      const opMatch = stopOpStr.match(/^(\d+(?:\.\d+)?)$/);
      if (!opMatch) continue;
      opacity = Math.max(0, Math.min(100, parseFloat(opMatch[1])));
    }

    // Determine if colorPart is a token or hex
    const tokenMatch = colorPart.match(/^\((.+)\)$/);
    if (tokenMatch) {
      stops.push({ color: "", token: tokenMatch[1].trim(), offset, opacity });
    } else if (/^#[0-9a-fA-F]{3,8}$/.test(colorPart)) {
      stops.push({ color: colorPart, offset, opacity });
    }
  }
  return stops;
}

/** Split a string by commas, respecting parentheses nesting. */
function splitByCommaRespectingParens(str: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  let quoted = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    // Quoted fx param values ('a, b') may hold commas and parens.
    if (quoted) {
      current += ch;
      if (ch === "\\" && i + 1 < str.length) current += str[++i];
      else if (ch === "'") quoted = false;
      continue;
    }
    if (ch === "'") quoted = true;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/**
 * Parse shorthand overlay syntax:
 *   "dark-30, scrim/90"                          — presets
 *   "#000/80, (accent)/30"                       — solid colors
 *   "linear(45deg, #000/0%, #000/100%)/80"       — gradient
 *   "dark-20, radial(accent/0%, accent/100%)/60" — mixed
 *
 * Returns [] if any token is unparseable (caller falls back to JSON).
 */
export function parseOverlayShorthand(raw: string): ShorthandLayer[] {
  const tokens = splitByCommaRespectingParens(raw);
  if (tokens.length === 0) return [];

  const layers: ShorthandLayer[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim();
    if (!token) continue;
    const layer = parseShorthandToken(token, i);
    if (!layer) return []; // unparseable token — bail, let caller try JSON
    layers.push(layer);
  }
  return layers;
}

/**
 * Convert overlay layers back to shorthand syntax when possible.
 *
 * Returns a shorthand string if all layers can be expressed in shorthand.
 * Returns null if any layer has features that require JSON (hidden layers,
 * unknown types, fx keys or params it cannot print).
 */
export function overlayLayersToShorthand(layers: ShorthandLayer[]): string | null {
  if (layers.length === 0) return null;
  const parts: string[] = [];
  for (const layer of layers) {
    if (layer.visible === false) return null; // hidden layers need JSON

    const op = layer.opacity ?? 100;
    const opSuffix = op === 100 ? "" : `/${op}`;

    if (layer.type === "preset") {
      if (!layer.presetKey || !(layer.presetKey in OVERLAY_PRESET_STYLES)) return null;
      parts.push(`${layer.presetKey}${layer.animated ? ANIMATED_SUFFIX : ""}${opSuffix}`);
    } else if (layer.type === "solid") {
      if (layer.token) {
        parts.push(`(${layer.token})${opSuffix}`);
      } else if (layer.color) {
        parts.push(`${layer.color}${opSuffix}`);
      } else {
        return null;
      }
    } else if (layer.type === "linear" || layer.type === "radial") {
      if (!layer.stops || layer.stops.length < 2) return null;
      const stopStr = layer.stops
        .map((s) => {
          const c = s.token ? `(${s.token})` : s.color;
          // Per-stop opacity rides after the offset: "(canvas)/96%/80".
          const stopOp = s.opacity !== undefined && s.opacity !== 100 ? `/${s.opacity}` : "";
          return `${c}/${s.offset}%${stopOp}`;
        })
        .join(", ");
      if (layer.type === "linear") {
        const angle = layer.angle ?? 180;
        parts.push(`linear(${angle}deg, ${stopStr})${opSuffix}`);
      } else {
        const at = layer.position && layer.position !== "center" ? `at ${layer.position}, ` : "";
        parts.push(`radial(${at}${stopStr})${opSuffix}`);
      }
    } else if (layer.type === "fx") {
      if (!layer.fxKey || !/^[A-Za-z0-9][\w-]*$/.test(layer.fxKey)) return null;
      // Empty values are unset params (Studio leaves "" behind); omit them.
      const params = Object.entries(layer.fxParams ?? {}).filter(
        ([k, v]) => v !== "" && v != null && /^[A-Za-z_][\w-]*$/.test(k),
      );
      const paramStr = params.length
        ? `(${params.map(([k, v]) => `${k}=${printFxParamValue(String(v))}`).join(" ")})`
        : "";
      parts.push(`fx:${layer.fxKey}${paramStr}${opSuffix}`);
    } else {
      return null; // unknown type
    }
  }
  return parts.join(", ");
}

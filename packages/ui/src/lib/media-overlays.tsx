/**
 * Media overlays & background media — the single source of truth for the
 * block "background media + overlay layers" prop contract:
 *   bgImage / bgVideo / bgSize / bgVideoPaused / bgOverlay / bgOverlays
 *
 * Shared by the Studio, Docs, and Community block registries via `@shavin/ui`
 * (previously three hand-synced copies inside each app's registry — which had
 * drifted: Docs' preset lookup was dead, Community still used the legacy
 * class-based path).
 *
 * ⚠️ FILE_EXEMPT in scripts/lint-tokens.mjs (same status as theme-presets.ts):
 * the preset table below is DATA, not styling — intentional pure black/white
 * alpha scrims layered over background imagery. They must render identically
 * in light and dark theme, so semantic theme tokens cannot represent them.
 * Rendered overlay layers carry `data-overlay="true"` and are exempted by the
 * live DOM audit (ShavinDevTools), mirroring how `data-swatch` exempts color
 * swatches; code generators emit the same marker so `validate_code` skips
 * those lines.
 */
import * as React from "react";
import { cn } from "./cn";
import { useReducedMotion } from "./useReducedMotion";
import { MotionPauseButton } from "../primitives/Video/PauseToggle";
import { Backdrop } from "../primitives/Backdrop/Backdrop";
import { OVERLAY_PRESET_KEYS, OVERLAY_PRESET_STYLES, parseOverlayShorthand as parseShorthandBase, overlayLayersToShorthand as layersToShorthandBase } from "./media-overlay-presets";

// Internal preset styles moved to ./media-overlay-presets (pure .ts module —
// shared with the @shavin/block-renderer parser). Re-exported for backwards
// compatibility within this file's consumers.
export { OVERLAY_PRESET_KEYS };

const PRESET_INLINE_STYLES = OVERLAY_PRESET_STYLES;

export const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (/\.(mp4|webm|mov|m4v|ogv|m3u8)(\?.*)?$/i.test(trimmed)) return true;
  if (trimmed.startsWith("data:video/") || trimmed.startsWith("blob:")) return true;
  if (trimmed.includes("video") || trimmed.includes("stream") || trimmed.includes("vimeo.com") || trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) return true;
  return false;
};

/** Ordered preset keys — legacy re-export lives at the top of this file. */

export type OverlayLayer = {
  id: string;
  type: "solid" | "linear" | "radial" | "preset" | "fx";
  color?: string;
  token?: string;
  opacity: number; // 0 to 100
  angle?: number; // 0, 45, 90, 180, etc.
  position?: string; // radial centre, e.g. "20% 30%"
  animated?: boolean; // mesh presets: slow drift
  stops?: Array<{ color: string; offset: number; opacity: number; token?: string }>;
  presetKey?: string;
  /** For type "fx": the registered Backdrop variant to render (e.g. "fluid-silk").
   *  Rendered via the Backdrop registry so @shavin/ui needs no @shavin/fx dependency —
   *  the host app registers fx backdrops with registerBackdrop(). */
  fxKey?: string;
  /** Optional per-fx params, passed to the backdrop renderer. */
  fxParams?: Record<string, string>;
  visible: boolean;
};

/**
 * Background-media props accepted by every layout primitive (Flex, Grid,
 * Section, Box, Container, Card). When any of these are set, the primitive
 * renders a `renderBgMedia()` layer behind its children and wraps the
 * children in a relative z-10 container so they sit above the media.
 *
 * This is the canonical single-source for the bg* contract — the Studio
 * block registry, the code generator, and the parser all reference these
 * field names. `foldBackgroundMedia()` in the parser is a compatibility
 * shim for legacy hand-crafted `<video>`/`<div data-overlay>` children;
 * new code should always use these props directly.
 */
export interface BgMediaProps {
  /** Background video URL (mp4, webm, etc.). Renders an autoPlay/loop/muted <video> element behind children. */
  bgVideo?: string;
  /** Background image URL. Renders an <img> with object-cover (default) or object-contain. */
  bgImage?: string;
  /** Background media fit: "cover" fills the container (default), "contain" fits within. */
  bgSize?: "cover" | "contain";
  /** Comma-separated shorthand for overlay layers. Supports presets ("dark-50"), solid colors (#hex or (token)), gradients (linear/radial), and fx backdrops ("fx:dither-waves(speed=1.2)" via the Backdrop registry). JSON array of OverlayLayer[] as fallback for advanced cases. Layers composite top-to-bottom. */
  bgOverlays?: string;
  /** When true, pauses the background video (renders a static poster frame instead of autoplay). */
  bgVideoPaused?: string;
  /** Poster image for bgVideo — shown while loading and as the static fallback under prefers-reduced-motion. */
  bgPoster?: string;
}

/**
 * Resolve bg* props into a media layer element and a children wrapper.
 *
 * When no bg* props are set, `hasMedia` is false and `content` is the identity
 * function — the primitive renders children directly with zero overhead.
 *
 * When bg* props are present, `hasMedia` is true: `media` is the rendered
 * background layer (absolute z-0) and `content` wraps children in a relative
 * z-10 div carrying `contentClassName`. The primitive should strip its layout
 * variant classes (flex/grid) from the parent and pass them as
 * `contentClassName` so the wrapper — not the parent — is the sole layout
 * context. The parent becomes a positioning shell (`relative overflow-hidden`)
 * for the absolute media layer.
 *
 * Usage in a primitive:
 *   const { hasMedia, media, content } = bgMediaLayer(props, flexVariants({ ... }));
 *   return (
 *     <Tag className={cn(hasMedia ? "relative overflow-hidden" : flexVariants({ ... }), ...rest)}>
 *       {media}{content(children)}
 *     </Tag>
 *   );
 */
export function bgMediaLayer<P extends BgMediaProps>(
  props: P,
  contentClassName?: string,
): {
  hasMedia: boolean;
  media: React.ReactNode;
  content: (children: React.ReactNode) => React.ReactNode;
} {
  if (!props.bgVideo && !props.bgImage && !props.bgOverlays) {
    return { hasMedia: false, media: null, content: (children) => children };
  }
  const media = renderBgMedia(props as unknown as Record<string, string>);
  // A playing background video or fx layer gets a pause button above the content (WCAG 2.2.2).
  const video = Boolean(props.bgVideo) && props.bgVideoPaused !== "true";
  const fx = parseOverlayLayers(props as unknown as Record<string, string>).some((l) => l.visible && l.type === "fx" && l.fxParams?.paused !== "true");
  const toggle = video || fx ? React.createElement(BgMotionToggle, { fx }) : null;
  return {
    hasMedia: true,
    media,
    content: (children) =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement("div", { className: cn("relative z-10 w-full h-full", contentClassName) }, children),
        toggle,
      ),
  };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } {
  let c = (hex || "").replace(/^#/, "");
  if (!c) return { r: 0, g: 0, b: 0, a: 1 };
  // #rgb / #rgba → #rrggbb / #rrggbbaa
  if (c.length === 3 || c.length === 4) c = c.split("").map((x) => x + x).join("");
  const alpha = c.length === 8 ? (parseInt(c.slice(6, 8), 16) || 0) / 255 : 1;
  const num = parseInt(c.slice(0, 6), 16) || 0;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255, a: alpha };
}

export function tokenNameToCssColor(token?: string, fallbackHex?: string, alpha = 1): string {
  const a = Math.max(0, Math.min(1, alpha));
  if (token) {
    const t = token.toLowerCase().trim();
    if (t.startsWith("n-") || t.startsWith("var(--n-")) {
      const raw = t.replace(/^var\(--/, "").replace(/\)$/, "").split(" ")[0];
      return `rgb(var(--${raw}) / ${a})`;
    }
    if (t === "canvas" || t.includes("canvas")) return `rgb(var(--bg-canvas) / ${a})`;
    if (t === "surface hover" || t.includes("surface-hover")) return `rgb(var(--bg-surface-hover) / ${a})`;
    if (t === "surface" || t.includes("surface")) return `rgb(var(--bg-surface) / ${a})`;
    if (t === "elevated" || t.includes("elevated")) return `rgb(var(--bg-elevated) / ${a})`;
    if (t === "hairline strong" || t.includes("hairline-strong")) return `rgb(var(--hairline-strong) / ${a})`;
    if (t === "hairline" || t.includes("hairline")) return `rgb(var(--hairline) / ${a})`;
    if (t === "fg (text)" || t === "fg" || t === "text") return `rgb(var(--fg) / ${a})`;
    if (t === "fg muted" || t.includes("fg-muted")) return `rgb(var(--fg-muted) / ${a})`;
    if (t === "fg subtle" || t.includes("fg-subtle")) return `rgb(var(--fg-subtle) / ${a})`;
    if (t === "accent" || t.includes("accent")) return `rgb(var(--accent) / ${a})`;
    if (t === "danger") return `rgb(var(--danger) / ${a})`;
    if (t === "success") return `rgb(var(--success) / ${a})`;
    if (t === "warning") return `rgb(var(--warning) / ${a})`;
  }
  const hex = fallbackHex || "#000000";
  const rgb = hexToRgb(hex);
  return `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${+(a * rgb.a).toFixed(3)})`;
}

export function tokenNameToCssVar(token?: string): string | null {
  if (!token) return null;
  const t = token.toLowerCase().trim();
  if (t.startsWith("n-") || t.startsWith("var(--n-")) {
    const raw = t.replace(/^var\(--/, "").replace(/\)$/, "").split(" ")[0];
    return `var(--${raw})`;
  }
  if (t === "canvas" || t.includes("canvas")) return "var(--bg-canvas)";
  if (t === "surface hover" || t.includes("surface-hover")) return "var(--bg-surface-hover)";
  if (t === "surface" || t.includes("surface")) return "var(--bg-surface)";
  if (t === "elevated" || t.includes("elevated")) return "var(--bg-elevated)";
  if (t === "hairline strong" || t.includes("hairline-strong")) return "var(--hairline-strong)";
  if (t === "hairline" || t.includes("hairline")) return "var(--hairline)";
  if (t === "fg (text)" || t === "fg" || t === "text") return "var(--fg)";
  if (t === "fg muted" || t.includes("fg-muted")) return "var(--fg-muted)";
  if (t === "fg subtle" || t.includes("fg-subtle")) return "var(--fg-subtle)";
  if (t === "accent" || t.includes("accent")) return "var(--accent)";
  if (t === "danger") return "var(--danger)";
  if (t === "success") return "var(--success)";
  if (t === "warning") return "var(--warning)";
  return null;
}

export function getPresetThumbnailStyle(presetKey?: string): React.CSSProperties {
  // Single source: the canonical preset table (new presets get thumbnails for free).
  return (presetKey && OVERLAY_PRESET_STYLES[presetKey]) || { backgroundColor: "rgba(0,0,0,0.4)" };
}

export function getOverlayThumbnailStyle(layer: OverlayLayer): React.CSSProperties {
  if (layer.type === "preset" && layer.presetKey) {
    return getPresetThumbnailStyle(layer.presetKey);
  }
  // fx backdrops can't render a live canvas in a tiny swatch — show an accent wash.
  if (layer.type === "fx") {
    return { background: "conic-gradient(from 200deg at 50% 50%, rgb(var(--accent) / 0.5), rgb(var(--accent) / 0.1), rgb(var(--accent) / 0.5))" };
  }
  return getOverlayLayerStyle(layer) || { backgroundColor: layer.color || "#000000" };
}

// Re-export shorthand parse/serialize from the pure-data presets module.
// media-overlay-presets.ts holds the canonical implementations (no JSX) so
// @shavin/block-renderer can import them via @shavin/ui/lib/media-overlay-presets.
export const parseOverlayShorthand = parseShorthandBase;
export const overlayLayersToShorthand = layersToShorthandBase;

export function parseOverlayLayers(props: Record<string, string>): OverlayLayer[] {
  if (props.bgOverlays) {
    try {
      const parsed = JSON.parse(props.bgOverlays);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((l: any, idx: number) => ({
          ...l,
          id: l.id || `overlay-${idx + 1}`,
        }));
      }
    } catch {
      // Not JSON — try shorthand syntax: "dark-30, scrim/90, gradient-bottom"
      const shorthand = parseOverlayShorthand(props.bgOverlays);
      if (shorthand.length > 0) return shorthand as OverlayLayer[];

      // Fallback: single preset key (e.g. "dark-50")
      if (props.bgOverlays in PRESET_INLINE_STYLES) {
        return [{
          id: "preset-1",
          type: "preset",
          presetKey: props.bgOverlays,
          opacity: 100,
          visible: true,
        }];
      }
    }
  }
  if (props.bgOverlay && props.bgOverlay !== "none") {
    const ov = props.bgOverlay;
    if (ov in PRESET_INLINE_STYLES) {
      return [
        {
          id: "preset-1",
          type: "preset",
          presetKey: ov,
          opacity: 100,
          visible: true,
        },
      ];
    }
    if (ov.startsWith("#") || ov.startsWith("rgb")) {
      return [
        {
          id: "solid-1",
          type: "solid",
          color: ov,
          opacity: 100,
          visible: true,
        },
      ];
    }
    if (ov.includes("gradient")) {
      return [
        {
          id: "custom-grad-1",
          type: ov.includes("radial") ? "radial" : "linear",
          color: ov,
          opacity: 100,
          visible: true,
        },
      ];
    }
  }
  return [];
}

export function getOverlayLayerClass(layer: OverlayLayer): string {
  // Colour/geometry is inline style; only motion needs a class (keyframes live in global.css).
  return layer.type === "preset" && layer.animated ? "animate-mesh-drift" : "";
}

export function getOverlayLayerStyle(layer: OverlayLayer): React.CSSProperties | undefined {
  if (!layer.visible) return undefined;
  if (layer.type === "preset" && layer.presetKey && PRESET_INLINE_STYLES[layer.presetKey]) {
    const baseStyle = PRESET_INLINE_STYLES[layer.presetKey];
    const alpha = (layer.opacity ?? 100) / 100;
    if (alpha < 1) {
      return { ...baseStyle, opacity: alpha };
    }
    return baseStyle;
  }
  if (layer.type === "solid") {
    const alpha = (layer.opacity ?? 100) / 100;
    const colorStr = tokenNameToCssColor(layer.token, layer.color, alpha);
    return {
      backgroundColor: colorStr,
    };
  }
  if (layer.type === "linear" || layer.type === "radial") {
    const stops =
      layer.stops && layer.stops.length > 0
        ? layer.stops
        : [
            { color: layer.color || "", offset: 0, opacity: 100, token: layer.token },
            { color: layer.color || "", offset: 100, opacity: 0, token: layer.token },
          ];
    const overallAlpha = (layer.opacity ?? 100) / 100;
    const stopStr = stops
      .map((s) => {
        const stopAlpha = ((s.opacity ?? 100) / 100) * overallAlpha;
        const colorStr = tokenNameToCssColor(s.token, s.color, stopAlpha);
        return `${colorStr} ${s.offset}%`;
      })
      .join(", ");
    const bg =
      layer.type === "radial"
        ? `radial-gradient(circle at ${layer.position || "center"}, ${stopStr})`
        : `linear-gradient(${layer.angle ?? 180}deg, ${stopStr})`;
    return { background: bg };
  }
  return undefined;
}

/**
 * Render background media (image/video) plus overlay layers for a block's
 * bg* props. Overlay layers are marked `data-overlay="true"` — the live DOM
 * audit exempts them (intentional scrims, see file header).
 */
export const renderBgMedia = (props: Record<string, string>) => {
  const rawUrl = props.bgVideo || props.bgImage;
  const layers = parseOverlayLayers(props);
  const hasOverlay = layers.some((l) => l.visible);
  if (!rawUrl && !hasOverlay) return null;

  const isVid = Boolean(props.bgVideo) || isVideoUrl(rawUrl);
  const videoSrc = isVid ? rawUrl : "";
  const imageSrc = !isVid ? rawUrl : "";
  const isPaused = props.bgVideoPaused === "true";

  return (
    <div data-bg-media="" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit] w-full h-full">
      {imageSrc && (
        <img
          src={imageSrc}
          alt=""
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = "none";
          }}
          className={cn("h-full w-full pointer-events-none select-none", props.bgSize === "contain" ? "object-contain" : "object-cover")}
        />
      )}
      {videoSrc && props.bgPoster && (
        <img
          src={props.bgPoster}
          alt=""
          className={cn("absolute inset-0 h-full w-full pointer-events-none select-none", props.bgSize === "contain" ? "object-contain" : "object-cover")}
        />
      )}
      {videoSrc && (
        <BgVideo
          key={`${videoSrc}-${isPaused ? "paused" : "playing"}`}
          src={videoSrc}
          paused={isPaused}
          poster={props.bgPoster || undefined}
          className={cn("relative h-full w-full pointer-events-none", props.bgPoster && "motion-reduce:hidden", props.bgSize === "contain" ? "object-contain" : "object-cover")}
        />
      )}
      {renderOverlayLayers(layers.filter((l) => l.visible))}
    </div>
  );
};

/**
 * Render a list of overlay layers as absolutely-positioned nodes (z-[1]).
 * Shared by `renderBgMedia` (layout backgrounds) and the `Image` primitive
 * (overlays on top of the image) so both composite layers identically.
 * An `fx` layer renders a registered Backdrop variant; the rest render CSS divs.
 */
export function renderOverlayLayers(layers: OverlayLayer[]): React.ReactNode[] {
  return layers.map((l, idx) => {
    if (l.type === "fx") {
      // WebGL/canvas effect (@shavin/fx) via the Backdrop registry; falls back to
      // the built-in "mesh" backdrop when the fx key isn't registered.
      return (
        <Backdrop
          key={l.id || idx}
          variant={l.fxKey || "mesh"}
          params={l.fxParams}
          data-overlay="true"
          className="z-[1]"
          style={typeof l.opacity === "number" && l.opacity < 100 ? { opacity: l.opacity / 100 } : undefined}
        />
      );
    }
    const cls = getOverlayLayerClass(l);
    const style = getOverlayLayerStyle(l);
    return (
      <div
        key={l.id || idx}
        data-overlay="true"
        className={cn("absolute inset-0 z-[1] pointer-events-none", cls)}
        style={style}
      />
    );
  });
}

/** Parse + render overlay layers from an `overlays`/`bgOverlays` string (for the Image primitive). */
export function renderOverlays(overlays?: string): React.ReactNode[] {
  if (!overlays) return [];
  const layers = parseOverlayLayers({ bgOverlays: overlays }).filter((l) => l.visible);
  return layers.length ? renderOverlayLayers(layers) : [];
}

/**
 * Decorative background video. Hidden from assistive tech; never autoplays when
 * the reader asked for reduced motion (the poster, or the first frame, shows).
 */
function BgVideo({ src, poster, paused, className }: { src: string; poster?: string; paused: boolean; className?: string }) {
  const reduced = useReducedMotion();
  const play = !paused && !reduced;
  return (
    <video
      data-bg-video=""
      src={src}
      autoPlay={play}
      loop
      muted
      playsInline
      aria-hidden="true"
      tabIndex={-1}
      poster={poster}
      ref={(el) => {
        if (!el) return;
        if (play) el.play().catch(() => {});
        else el.pause();
      }}
      className={className}
    />
  );
}

/**
 * One pause/play button for everything that moves in the surrounding layout primitive's
 * background: the video and any running fx layers (WCAG 2.2.2). fx layers freeze through
 * `data-fx-paused` on the media layer, which the @shavin/fx render loop reads every frame.
 */
function BgMotionToggle({ fx }: { fx: boolean }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [video, setVideo] = React.useState<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = React.useState(true);
  const layer = () => ref.current?.parentElement?.querySelector<HTMLElement>(":scope > [data-bg-media]") ?? null;
  React.useEffect(() => {
    const v = layer()?.querySelector<HTMLVideoElement>("video[data-bg-video]") ?? null;
    setVideo(v);
    if (!v) return;
    setPlaying(!v.paused);
    const on = () => setPlaying(true);
    const off = () => setPlaying(false);
    v.addEventListener("play", on);
    v.addEventListener("pause", off);
    return () => {
      v.removeEventListener("play", on);
      v.removeEventListener("pause", off);
    };
  }, []);
  // Reduced motion already holds fx on a still frame; with no video there is nothing to pause.
  if (reduced && !video) return null;
  const toggle = () => {
    const next = !playing;
    if (video) {
      if (next) void video.play().catch(() => {});
      else video.pause();
    }
    if (fx) layer()?.toggleAttribute("data-fx-paused", !next);
    setPlaying(next);
  };
  const label = video && fx ? "background motion" : video ? "background video" : "background animation";
  return (
    <span ref={ref} className="contents">
      <MotionPauseButton playing={playing} onToggle={toggle} label={label} className="z-20" />
    </span>
  );
}

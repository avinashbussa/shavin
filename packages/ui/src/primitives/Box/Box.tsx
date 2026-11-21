import type { HTMLAttributes, ElementType, Ref } from "react";
import { cn } from "../../lib/cn";
import { concentricContainerStyle, paddingScaleFromClassName, withConcentricStyle } from "../../lib/concentric";
import { surfaceClass, type Surface } from "../../lib/surface";
import { bgMediaLayer, resolveBgReadability, type BgMediaProps } from "../../lib/media-overlays";
import { withResizable, type ResizableProps } from "../Resizable";

export interface BoxProps extends Omit<HTMLAttributes<HTMLElement>, "onResize">, BgMediaProps, ResizableProps {
  /** Polymorphic element tag: div, section, article, span, etc. Default "div". */
  as?: ElementType;
  /** Whether to apply translucent panel styling with data-panel attribute. */
  translucent?: boolean;
  /** Surface contrast scope intent. "dark"/"light" auto-invert against the page
      theme (contrast band). "dark-always"/"light-always" lock to one theme
      regardless of page (for media backgrounds). Undefined inherits page theme. */
  surface?: Surface;
  /** Ref to the rendered element. */
  ref?: Ref<HTMLElement>;
}

function BoxBase({
  as: Tag = "div",
  translucent,
  surface,
  className,
  style,
  bgVideo,
  bgImage,
  bgSize,
  bgOverlays,
  bgVideoPaused,
  bgPoster,
  children,
  ...props
}: BoxProps) {
  const concentricStyle = translucent
    ? // Padding comes from className (p-6, px-4 py-8): the real value, not a guess.
      concentricContainerStyle(paddingScaleFromClassName(className), false, { border: true })
    : {};
  const bg = resolveBgReadability({ surface, bgVideo, bgImage, bgOverlays });
  const { hasMedia, media, content } = bgMediaLayer({ bgVideo, bgImage, bgSize, bgOverlays: bg.bgOverlays, bgVideoPaused, bgPoster });
  return (
    <Tag
      data-panel={translucent || undefined}
      data-surface={bg.surface || undefined}
      className={cn(
        hasMedia && "relative overflow-hidden",
        translucent && "rounded-[var(--radius-panel)] border border-hairline shadow-panel",
        surfaceClass(bg.surface),
        className
      )}
      style={withConcentricStyle(style, concentricStyle)}
      {...props}
    >
      {media}
      {content(children)}
    </Tag>
  );
}

export const Box = withResizable(BoxBase, "Box");

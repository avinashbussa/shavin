import type { HTMLAttributes, ElementType } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { surfaceClass, type Surface } from "../../lib/surface";
import { bgMediaLayer, type BgMediaProps } from "../../lib/media-overlays";

export const containerVariants = cva("mx-auto w-full px-4 sm:px-6", {
  variants: {
    size: { xs: "max-w-md", sm: "max-w-2xl", md: "max-w-4xl", lg: "max-w-6xl", xl: "max-w-8xl", full: "max-w-none" },
  },
  defaultVariants: { size: "md" },
});

export interface ContainerProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof containerVariants>,
    BgMediaProps {
  /** Polymorphic element tag: div, section, main, article, etc. Default "div". */
  as?: ElementType;
  /** Whether to apply translucent panel styling with data-panel attribute. */
  translucent?: boolean;
  /** Surface contrast scope intent. "dark"/"light" auto-invert against the page
      theme (contrast band). "dark-always"/"light-always" lock to one theme
      regardless of page (for media backgrounds). Undefined inherits page theme. */
  surface?: Surface;
}

export function Container({
  as: Tag = "div",
  className,
  size,
  translucent,
  surface,
  style,
  bgVideo,
  bgImage,
  bgSize,
  bgOverlays,
  bgVideoPaused,
  bgPoster,
  children,
  ...props
}: ContainerProps) {
  const layoutClass = containerVariants({ size });
  const { hasMedia, media, content } = bgMediaLayer({ bgVideo, bgImage, bgSize, bgOverlays, bgVideoPaused, bgPoster }, layoutClass);
  return (
    <Tag
      data-panel={translucent || undefined}
      data-surface={surface || undefined}
      className={cn(
        hasMedia ? "relative overflow-hidden" : layoutClass,
        translucent && "rounded-[var(--radius-panel)] border border-hairline shadow-card",
        surfaceClass(surface),
        className
      )}
      style={style}
      {...props}
    >
      {media}
      {content(children)}
    </Tag>
  );
}

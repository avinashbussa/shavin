import type { HTMLAttributes, ElementType } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { concentricContainerStyle, withConcentricStyle } from "../../lib/concentric";
import { surfaceClass, type Surface } from "../../lib/surface";
import { bgMediaLayer, type BgMediaProps } from "../../lib/media-overlays";

export const sectionVariants = cva("", {
  variants: {
    size: {
      "1": "py-6",
      "2": "py-10",
      "3": "py-16",
      "4": "py-24",
      // Role sizes — responsive vertical rhythm for marketing/app blocks.
      compact: "py-8 md:py-12", // dashboards, app panels
      strip: "py-10 md:py-14", // logo walls, stat bars, announcements
      body: "py-16 md:py-24", // most content sections
      hero: "py-24 md:py-32", // heroes, statements, closing CTAs
    },
  },
  defaultVariants: { size: "2" },
});

export interface SectionProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants>,
    BgMediaProps {
  /** Polymorphic tag type: section, main, article, div. Default "section". */
  as?: ElementType;
  /** Whether to apply translucent panel styling with data-panel attribute. */
  translucent?: boolean;
  /** Surface contrast scope intent. "dark"/"light" auto-invert against the page
      theme (contrast band). "dark-always"/"light-always" lock to one theme
      regardless of page (for media backgrounds). Undefined inherits page theme. */
  surface?: Surface;
}

export function Section({
  as: Tag = "section",
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
}: SectionProps) {
  const concentricStyle = translucent
    ? concentricContainerStyle("4")
    : {};
  const layoutClass = sectionVariants({ size });
  const { hasMedia, media, content } = bgMediaLayer({ bgVideo, bgImage, bgSize, bgOverlays, bgVideoPaused, bgPoster }, layoutClass);
  return (
    <Tag
      data-panel={translucent || undefined}
      data-surface={surface || undefined}
      className={cn(
        hasMedia ? "relative overflow-hidden" : layoutClass,
        translucent && "rounded-[var(--radius-panel)] border border-hairline shadow-panel",
        surfaceClass(surface),
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

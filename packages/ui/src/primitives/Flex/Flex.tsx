import type { HTMLAttributes, ElementType } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { concentricContainerStyle, withConcentricStyle } from "../../lib/concentric";
import { surfaceClass, type Surface } from "../../lib/surface";
import { bgMediaLayer, type BgMediaProps } from "../../lib/media-overlays";

const GAP = {
  "0": "gap-0",
  "1": "gap-1",
  "2": "gap-2",
  "3": "gap-3",
  "4": "gap-4",
  "5": "gap-6",
  "6": "gap-8",
  "7": "gap-12",
} as const;

export const flexVariants = cva("flex", {
  variants: {
    direction: {
      row: "flex-row",
      column: "flex-col",
      col: "flex-col",
      "row-reverse": "flex-row-reverse",
      "column-reverse": "flex-col-reverse",
      "col-reverse": "flex-col-reverse",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
    },
    wrap: { nowrap: "flex-nowrap", wrap: "flex-wrap" },
    gap: GAP,
  },
  defaultVariants: { direction: "row", align: "stretch", justify: "start", wrap: "nowrap", gap: "3" },
});

export interface FlexProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof flexVariants>,
    BgMediaProps {
  /** Polymorphic element tag: div, section, header, etc. Default "div". */
  as?: ElementType;
  /** Whether to apply translucent panel styling with data-panel attribute. */
  translucent?: boolean;
  /** Surface contrast scope intent. "dark"/"light" auto-invert against the page
      theme (contrast band). "dark-always"/"light-always" lock to one theme
      regardless of page (for media backgrounds). Undefined inherits page theme. */
  surface?: Surface;
}

export function Flex({
  as: Tag = "div",
  className,
  direction,
  align,
  justify,
  wrap,
  gap,
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
}: FlexProps) {
  // Only translucent Flex is a radius-bearing container — set concentric
  // reference for children. Non-translucent Flex has no radius/bg and just
  // passes through the inherited --radius-panel-inner.
  const concentricStyle = translucent
    ? concentricContainerStyle("4") // translucent panels use p-4 by default
    : {};
  const layoutClass = flexVariants({ direction, align, justify, wrap, gap });
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
      style={withConcentricStyle(style, concentricStyle)}
      {...props}
    >
      {media}
      {content(children)}
    </Tag>
  );
}

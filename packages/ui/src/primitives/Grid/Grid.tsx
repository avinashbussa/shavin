import type { HTMLAttributes, ElementType } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { concentricContainerStyle, withConcentricStyle } from "../../lib/concentric";
import { surfaceClass, type Surface } from "../../lib/surface";
import { bgMediaLayer, type BgMediaProps } from "../../lib/media-overlays";

export const gridVariants = cva("grid", {
  variants: {
    columns: {
      "1": "grid-cols-1",
      "2": "grid-cols-2",
      "3": "grid-cols-3",
      "4": "grid-cols-4",
      "5": "grid-cols-5",
      "6": "grid-cols-6",
      /** Intrinsic: as many tracks as fit at `minWidth`, wrapping by itself in any container. Needs no `stack`. */
      auto: "",
    },
    /** Smallest width a column may shrink to when `columns="auto"`. */
    minWidth: {
      xs: "[--grid-min:10rem]",
      sm: "[--grid-min:14rem]",
      md: "[--grid-min:18rem]",
      lg: "[--grid-min:24rem]",
      xl: "[--grid-min:32rem]",
    },
    /** Upper bound on tracks when `columns="auto"`: never more than N columns, however wide the container. */
    maxColumns: {
      none: "",
      "2": "[--grid-max:2]",
      "3": "[--grid-max:3]",
      "4": "[--grid-max:4]",
      "5": "[--grid-max:5]",
      "6": "[--grid-max:6]",
    },
    rows: {
      "1": "grid-rows-1",
      "2": "grid-rows-2",
      "3": "grid-rows-3",
      "4": "grid-rows-4",
      "5": "grid-rows-5",
      "6": "grid-rows-6",
    },
    align: { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" },
    /** Responsive collapse. "auto": 3+ cols → 2 on tablet → 1 on mobile; 2 cols → 1 on mobile. */
    stack: { none: "", auto: "", mobile: "max-md:grid-cols-1", tablet: "max-lg:grid-cols-1" },
    gap: {
      "0": "gap-0 [--grid-gap:0px]",
      "1": "gap-1 [--grid-gap:0.25rem]",
      "2": "gap-2 [--grid-gap:0.5rem]",
      "3": "gap-3 [--grid-gap:0.75rem]",
      "4": "gap-4 [--grid-gap:1rem]",
      "5": "gap-6 [--grid-gap:1.5rem]",
      "6": "gap-8 [--grid-gap:2rem]",
      "7": "gap-12 [--grid-gap:3rem]",
    },
  },
  compoundVariants: [
    { columns: "auto", minWidth: "xs", maxColumns: "none", className: "grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))]" },
    { columns: "auto", minWidth: "sm", maxColumns: "none", className: "grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]" },
    { columns: "auto", minWidth: "md", maxColumns: "none", className: "grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]" },
    { columns: "auto", minWidth: "lg", maxColumns: "none", className: "grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))]" },
    { columns: "auto", minWidth: "xl", maxColumns: "none", className: "grid-cols-[repeat(auto-fit,minmax(min(100%,32rem),1fr))]" },
    { columns: "auto", maxColumns: ["2", "3", "4", "5", "6"], className: "grid-cols-[repeat(auto-fit,minmax(min(100%,max(var(--grid-min),calc((100%_-_(var(--grid-max)_-_1)_*_var(--grid-gap))_/_var(--grid-max)))),1fr))]" },
    { stack: "auto", columns: ["2"], className: "max-md:grid-cols-1" },
    { stack: "auto", columns: ["3", "4", "5", "6"], className: "max-lg:grid-cols-2 max-md:grid-cols-1" },
  ],
  defaultVariants: { columns: "2", align: "stretch", gap: "4", stack: "none", minWidth: "md", maxColumns: "none" },
});

export interface GridProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof gridVariants>,
    BgMediaProps {
  /** Polymorphic element tag: div, section, ul, etc. Default "div". */
  as?: ElementType;
  /** Whether to apply translucent panel styling with data-panel attribute. */
  translucent?: boolean;
  /** Surface contrast scope intent. "dark"/"light" auto-invert against the page
      theme (contrast band). "dark-always"/"light-always" lock to one theme
      regardless of page (for media backgrounds). Undefined inherits page theme. */
  surface?: Surface;
}

export function Grid({
  as: Tag = "div",
  className,
  columns,
  minWidth,
  maxColumns,
  rows,
  align,
  gap,
  stack,
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
}: GridProps) {
  const concentricStyle = translucent
    ? concentricContainerStyle("4")
    : {};
  const layoutClass = gridVariants({ columns, minWidth, maxColumns, rows, align, gap, stack });
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

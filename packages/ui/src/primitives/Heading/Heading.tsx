import type { ElementType, HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

// clamp(floor, rem + cqi, ceiling). cqi is 1% of the nearest size container's width and
// falls back to the small viewport when there is none. Each size reaches its floor near
// 400px and its ceiling near 900px of container width. Written as literal classes so
// Tailwind's scanner finds them; underscores become the spaces clamp() requires.
const FLUID_XL = "text-[clamp(1.5rem,1.2rem_+_1.2cqi,1.875rem)]";
const FLUID_2XL = "text-[clamp(1.875rem,1.575rem_+_1.2cqi,2.25rem)]";
const FLUID_3XL = "text-[clamp(2.25rem,1.65rem_+_2.4cqi,3rem)]";
const FLUID_4XL = "text-[clamp(2.25rem,1.05rem_+_4.8cqi,3.75rem)]";
const FLUID_5XL = "text-[clamp(2.25rem,0.96rem_+_5.14cqi,4.5rem)]";

export const headingVariants = cva("text-fg text-balance", {
  variants: {
    size: {
      inherit: "",
      sm: "text-lg",
      md: "text-xl",
      lg: "text-2xl",
      // xl and up are fluid: they grow smoothly with the nearest container (an AppFrame)
      // or, outside one, the window. xl 24-30px, 2xl 30-36, 3xl 36-48, and the display
      // sizes 4xl 36-60 and 5xl 36-72 for heroes. sm, md and lg stay fixed. A text-*
      // class in className replaces the fluid size.
      xl: FLUID_XL,
      "2xl": FLUID_2XL,
      "3xl": FLUID_3XL,
      "4xl": `${FLUID_4XL} leading-[1.08] tracking-tight`,
      "5xl": `${FLUID_5XL} leading-[1.05] tracking-tight`,
      "4": "text-lg",
      "5": "text-xl",
      "6": "text-2xl",
      "7": FLUID_XL,
      "8": FLUID_2XL,
      "9": FLUID_3XL,
      "10": `${FLUID_4XL} leading-[1.08] tracking-tight`,
      "11": `${FLUID_5XL} leading-[1.05] tracking-tight`,
    },
    weight: {
      inherit: "",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    tracking: {
      inherit: "",
      tighter: "tracking-tighter",
      tight: "tracking-tight",
      normal: "tracking-normal",
      wide: "tracking-wide",
      wider: "tracking-wider",
      widest: "tracking-widest",
    },
    truncate: {
      true: "line-clamp-3 overflow-hidden text-ellipsis",
      false: "",
    },
  },
  defaultVariants: { size: "lg", weight: "semibold", tracking: "normal", truncate: false },
});

export interface HeadingProps
  extends HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  /** Polymorphic heading element: h1-h6, div, span, etc. Default "h2". */
  as?: ElementType;
  /** Whether to truncate overflowing text with an ellipsis. */
  truncate?: boolean;
}

const SUBHEADING_TAGS = new Set(["h3", "h4", "h5", "h6"]);
const DISPLAY_SIZES = new Set(["3xl", "4xl", "5xl", "9", "10", "11"]);
const EXPLICIT_FAMILY = /(^|\s)font-(display|subheading|sans|body|serif|mono)(\s|$)/;

/**
 * Font family by role: h1/h2 and display sizes use the display font; h3-h6 use the subheading font
 * (the body font unless the theme sets `subheadingFont`). An explicit font-* class always wins.
 */
function headingFamily(tag: ElementType, size: string | number | null | undefined, className?: string) {
  if (className && EXPLICIT_FAMILY.test(className)) return "";
  const isSub = typeof tag === "string" && SUBHEADING_TAGS.has(tag) && !DISPLAY_SIZES.has(String(size ?? ""));
  return isSub ? "font-subheading" : "font-display";
}

export function Heading({
  as: Tag = "h2",
  size,
  weight,
  tracking,
  truncate,
  className,
  children,
  ...props
}: HeadingProps) {
  return (
    <Tag className={cn(headingFamily(Tag, size, className), headingVariants({ size, weight, tracking, truncate }), className)} {...props}>
      {children}
    </Tag>
  );
}

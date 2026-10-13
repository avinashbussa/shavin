import type { ElementType, HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const textVariants = cva("", {
  variants: {
    size: {
      inherit: "",
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      overline: "text-[10px] uppercase tracking-[0.15em]",
      "1": "text-xs",
      "2": "text-sm",
      "3": "text-base",
      "4": "text-lg",
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
    color: {
      inherit: "",
      default: "text-fg",
      fg: "text-fg",
      muted: "text-fg-muted",
      subtle: "text-fg-subtle",
      danger: "text-danger",
      link: "text-link",
      accent: "text-accent-contrast",
    },
    truncate: {
      true: "line-clamp-3 overflow-hidden text-ellipsis",
      false: "",
    },
  },
  defaultVariants: { size: "inherit", weight: "inherit", color: "inherit", tracking: "inherit", truncate: false },
});

export interface TextProps
  extends Omit<HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof textVariants> {
  /** Polymorphic element: p, span, div, label, etc. Default "p". */
  as?: ElementType;
  /** Whether to truncate overflowing text with an ellipsis. */
  truncate?: boolean;
}

export function Text({
  as: Tag = "p",
  size,
  weight,
  color,
  tracking,
  truncate,
  className,
  children,
  ...props
}: TextProps) {
  return (
    <Tag className={cn(textVariants({ size, weight, color, tracking, truncate }), className)} {...props}>
      {children}
    </Tag>
  );
}

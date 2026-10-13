import type { AnchorHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const linkVariants = cva("transition-colors", {
  variants: {
    underline: {
      always: "underline",
      hover: "no-underline hover:underline",
      none: "no-underline",
    },
    color: {
      default: "text-fg",
      accent: "text-link",
    },
  },
  defaultVariants: { underline: "hover", color: "default" },
});

export interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color">,
    VariantProps<typeof linkVariants> {
  size?: "xs" | "sm" | "md" | "lg";
}

export function Link({
  href,
  children,
  underline,
  color,
  size,
  className,
  ...props
}: LinkProps) {
  const sizeClass = size === "xs" ? "text-xs" : size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : size === "md" ? "text-base" : "";
  return (
    <a href={href} className={cn(linkVariants({ underline, color }), sizeClass, className)} {...props}>
      {children}
    </a>
  );
}

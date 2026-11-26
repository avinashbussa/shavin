import type { AnchorHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { hitAreaClass, type HitArea } from "../../lib/hit-area";

export const linkVariants = cva("transition-colors", {
  variants: {
    underline: {
      always: "underline",
      hover: "no-underline hover:underline",
      none: "no-underline",
    },
    color: {
      default: "text-fg",
      brand: "text-link",
    },
  },
  defaultVariants: { underline: "hover", color: "default" },
});

export interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color">,
    VariantProps<typeof linkVariants> {
  size?: "xs" | "sm" | "md" | "lg";
  /**
   * The link stands on its own (navigation, footer, table of contents, a list item that is only a link)
   * rather than sitting in a sentence. Gives it a hit area of at least 24x24 (WCAG 2.5.8) without changing its
   * layout. Links inside running text are exempt from the rule: leave this off. Defaults to true when
   * `underline="none"` (a link with no underline is not running text, and every navigation and footer link
   * is written that way), otherwise false. Pass `standalone={false}` to opt out.
   */
  standalone?: boolean;
  /** Hit-area override for a `standalone` link: "none" removes it, "touch" grows to 44px on a coarse pointer. Default 24px floor. */
  hitArea?: HitArea;
}

export function Link({
  href,
  children,
  underline,
  color,
  size,
  standalone,
  hitArea,
  className,
  ...props
}: LinkProps) {
  // A link with no underline cannot sit in a sentence (WCAG 1.4.1), so it is a stand-alone link unless said otherwise.
  const isStandalone = standalone ?? underline === "none";
  const sizeClass = size === "xs" ? "text-xs" : size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : size === "md" ? "text-base" : "";
  return (
    <a href={href} className={cn(linkVariants({ underline, color }), sizeClass, isStandalone && "hit-area", isStandalone && hitAreaClass(hitArea, "floor", "Link"), className)} {...props}>
      {children}
    </a>
  );
}

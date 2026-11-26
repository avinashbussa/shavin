import React, { forwardRef, type SVGProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { WISEOWL_LOGO_PATH, WISEOWL_LOGO_VIEWBOX, WISEOWL_MARK_PATH, WISEOWL_MARK_VIEWBOX } from "./paths";

/*
 * Single-colour artwork: it paints with currentColor, so it follows the theme through `color`.
 * brand uses --brand-contrast: raw --brand (e.g. Lime) is ~1.4:1 on white.
 */
export const wiseOwlLogoVariants = cva("inline-block shrink-0 align-middle w-auto", {
  variants: {
    size: {
      sm: "h-6",
      md: "h-8",
      lg: "h-14",
    },
    color: {
      inherit: "text-current",
      default: "text-fg",
      muted: "text-fg-muted",
      brand: "text-brand-contrast",
    },
  },
  defaultVariants: { size: "md", color: "inherit" },
});

export const wiseOwlMarkVariants = cva("inline-block shrink-0 align-middle", {
  variants: {
    size: {
      xs: "h-4 w-4",
      sm: "h-5 w-5",
      md: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
    color: {
      inherit: "text-current",
      default: "text-fg",
      muted: "text-fg-muted",
      brand: "text-brand-contrast",
    },
  },
  defaultVariants: { size: "md", color: "inherit" },
});

export interface WiseOwlLogoProps
  extends Omit<SVGProps<SVGSVGElement>, "color" | "ref">,
    VariantProps<typeof wiseOwlLogoVariants> {
  /** Accessible name. Default "WiseOwl". */
  label?: string;
  /** Hide from assistive tech when the name is already visible next to it. */
  decorative?: boolean;
}

export interface WiseOwlMarkProps
  extends Omit<SVGProps<SVGSVGElement>, "color" | "ref">,
    VariantProps<typeof wiseOwlMarkVariants> {
  /** Accessible name. Default "WiseOwl". */
  label?: string;
  /** Hide from assistive tech when the name is already visible next to it. */
  decorative?: boolean;
}

/** WiseOwl's full logo: the owl mark plus the "Wise Owl" wordmark. Heights 24 / 32 / 56 px; keep it 20 px or taller. */
export const WiseOwlLogo = forwardRef<SVGSVGElement, WiseOwlLogoProps>(function WiseOwlLogo(
  { size = "md", color = "inherit", label = "WiseOwl", decorative = false, className, ...rest },
  ref
) {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={WISEOWL_LOGO_VIEWBOX}
      // Start-aligned like text when a column flex stretches the box wider than the artwork.
      preserveAspectRatio="xMinYMid meet"
      fill="currentColor"
      data-slot="wiseowl-logo"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      {...rest}
      className={cn(wiseOwlLogoVariants({ size, color }), className)}
    >
      <path d={WISEOWL_LOGO_PATH} />
    </svg>
  );
});

/** WiseOwl's owl mark on its own, for sidebars, app icons and tight spaces. 16 to 48 px; keep it 16 px or larger. */
export const WiseOwlMark = forwardRef<SVGSVGElement, WiseOwlMarkProps>(function WiseOwlMark(
  { size = "md", color = "inherit", label = "WiseOwl", decorative = false, className, ...rest },
  ref
) {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={WISEOWL_MARK_VIEWBOX}
      fill="currentColor"
      data-slot="wiseowl-mark"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      {...rest}
      className={cn(wiseOwlMarkVariants({ size, color }), className)}
    >
      <path d={WISEOWL_MARK_PATH} />
    </svg>
  );
});

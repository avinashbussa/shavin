"use client";
import React, { useEffect, useState, type HTMLAttributes, type SVGProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const DEFAULT_GLYPHS = ["✻", "✽", "✶", "✳", "✢"];

export const spinnerVariants = cva("inline-block align-middle shrink-0 text-current", {
  variants: {
    variant: {
      spin: "animate-spin",
      dots: "inline-flex items-center gap-1",
      glyph: "inline-block font-mono select-none",
      ellipsis: "inline-block min-w-[1.2em] text-left select-none",
    },
    size: {
      sm: "h-3.5 w-3.5",
      md: "h-4 w-4",
      lg: "h-7 w-7",
    },
  },
  defaultVariants: { variant: "spin", size: "md" },
});

export interface SpinnerProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof spinnerVariants> {
  /** Custom array of glyphs for variant="glyph". Default ["✻", "✽", "✶", "✳", "✢"] */
  glyphs?: string[];
  /** Animation cycle interval in ms for variant="glyph" or variant="ellipsis". Default 200 */
  intervalMs?: number;
}

export function Spinner({
  variant = "spin",
  size = "md",
  glyphs = DEFAULT_GLYPHS,
  intervalMs = 200,
  className,
  ...props
}: SpinnerProps) {
  const [glyphIdx, setGlyphIdx] = useState(0);
  const [ellipsisCount, setEllipsisCount] = useState(1);

  useEffect(() => {
    if (variant === "glyph") {
      const ms = intervalMs ?? 200;
      const timer = setInterval(() => {
        setGlyphIdx((prev) => (prev + 1) % glyphs.length);
      }, ms);
      return () => clearInterval(timer);
    }
    if (variant === "ellipsis") {
      const ms = intervalMs ?? 400;
      const timer = setInterval(() => {
        setEllipsisCount((prev) => (prev % 3) + 1);
      }, ms);
      return () => clearInterval(timer);
    }
  }, [variant, glyphs, intervalMs]);

  if (variant === "glyph") {
    return (
      <span
        role="status"
        aria-label="Loading"
        className={cn(
          "inline-block select-none text-current transition-opacity duration-150 align-baseline",
          className,
        )}
        {...(props as HTMLAttributes<HTMLSpanElement>)}
      >
        {glyphs[glyphIdx] ?? DEFAULT_GLYPHS[0]}
      </span>
    );
  }

  if (variant === "ellipsis") {
    return (
      <span
        role="status"
        aria-label="Loading"
        className={cn(
          "inline-block min-w-[1.2em] text-left text-current select-none align-baseline",
          className,
        )}
        {...(props as HTMLAttributes<HTMLSpanElement>)}
      >
        {".".repeat(ellipsisCount)}
      </span>
    );
  }

  if (variant === "dots") {
    const dotSizeClass =
      size === "sm" ? "h-1 w-1" : size === "lg" ? "h-2 w-2" : "h-1.5 w-1.5";

    return (
      <span
        role="status"
        aria-label="Loading"
        className={cn("inline-flex items-center gap-1 text-current align-middle", className)}
        {...(props as HTMLAttributes<HTMLSpanElement>)}
      >
        <span
          className={cn("rounded-full bg-current animate-pulse-dot", dotSizeClass)}
          style={{ animationDelay: "0s" }}
        />
        <span
          className={cn("rounded-full bg-current animate-pulse-dot", dotSizeClass)}
          style={{ animationDelay: "0.15s" }}
        />
        <span
          className={cn("rounded-full bg-current animate-pulse-dot", dotSizeClass)}
          style={{ animationDelay: "0.3s" }}
        />
      </span>
    );
  }

  return (
    <svg
      role="status"
      aria-label="Loading"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(spinnerVariants({ variant, size }), className)}
      {...(props as SVGProps<SVGSVGElement>)}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        className="opacity-90"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

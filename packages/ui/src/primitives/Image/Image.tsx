"use client";
import React, { useState, type ImgHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const imageVariants = cva("block overflow-hidden bg-surface-hover", {
  variants: {
    radius: {
      none: "rounded-none",
      small: "rounded-[0.25rem]",
      medium: "rounded-[0.5rem]",
      large: "rounded-[0.75rem]",
      full: "rounded-full",
      inherit: "rounded-[var(--radius-panel)]",
      concentric: "rounded-panel-inner",
    },
  },
  defaultVariants: { radius: "inherit" },
});

const FIT_CLASS = { cover: "object-cover", contain: "object-contain", fill: "object-fill", none: "object-none" } as const;

export interface ImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "width" | "height">,
    VariantProps<typeof imageVariants> {
  /** Image source URL. */
  src?: string;
  /** Image accessible alt text. */
  alt?: string;
  /** CSS aspect-ratio string, e.g. "16/9", "1/1", "4/3". Reserves space to avoid layout shift. */
  ratio?: string;
  /** Object fit style: "cover", "contain", "fill", "none". Default "cover". */
  fit?: "cover" | "contain" | "fill" | "none";
  /** Custom placeholder node shown when src is missing or fails to load. */
  placeholder?: React.ReactNode;
}

export function Image({ src, alt = "", ratio, fit = "cover", radius, placeholder, className, style, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;
  const boxStyle = { ...(ratio ? { aspectRatio: ratio } : null), ...style };

  if (showPlaceholder) {
    return (
      <div
        role="img"
        aria-label={alt || "Image placeholder"}
        className={cn(imageVariants({ radius }), "flex w-full items-center justify-center relative bg-surface-hover text-fg-subtle", className)}
        style={boxStyle}
      >
        {placeholder ?? (
          <svg viewBox="0 0 24 24" fill="none" className="h-1/4 max-h-10 w-1/4 max-w-10 text-fg-subtle" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-4.5-4.5L5 21" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={cn(imageVariants({ radius }), "h-full w-full", FIT_CLASS[fit], className)}
      style={boxStyle}
      {...props}
    />
  );
}

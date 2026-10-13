"use client";
import React from "react";
import * as RadixAvatar from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const avatarVariants = cva("inline-flex shrink-0 items-center justify-center overflow-hidden align-middle", {
  variants: {
    size: {
      sm: "h-7 w-7 text-xs",
      md: "h-9 w-9 text-sm",
      lg: "h-14 w-14 text-lg",
      xl: "h-24 w-24 text-2xl",
    },
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
  defaultVariants: { size: "md", radius: "full" },
});

/** Fallback fill. `neutral` is the default grey; the rest are tinted (`soft`) or filled (`solid`). */
export type AvatarColor = "neutral" | "accent" | "success" | "warning" | "danger";

const FALLBACK_TONE: Record<AvatarColor, { soft: string; solid: string }> = {
  neutral: { soft: "bg-surface-hover text-fg-muted", solid: "bg-fg text-canvas" },
  accent: { soft: "bg-accent/15 text-accent-text", solid: "bg-accent text-accent-fg" },
  success: { soft: "bg-success/15 text-success", solid: "bg-success text-success-fg" },
  warning: { soft: "bg-warning/15 text-warning", solid: "bg-warning text-warning-fg" },
  danger: { soft: "bg-danger/15 text-danger", solid: "bg-danger text-danger-fg" },
};

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /** Image source URL. */
  src?: string;
  /** Image alt text. */
  alt?: string;
  /** Text or letter fallback when image fails to load. */
  fallback?: React.ReactNode;
  /** Custom icon fallback, e.g. `<Icon name="globe" size="sm" />` (inherits the fallback colour). */
  fallbackIcon?: React.ReactNode;
  /** Fallback fill colour: use with `fallbackIcon` or initials for project, workspace or team avatars. Default `neutral`. */
  color?: AvatarColor;
  /** `soft` (tinted, default) or `solid` (filled) when `color` is not neutral. */
  variant?: "soft" | "solid";
  /** Optional custom CSS class name. */
  className?: string;
}

export function Avatar({
  src,
  alt,
  fallback,
  fallbackIcon,
  color = "neutral",
  variant = "soft",
  size,
  radius,
  className,
}: AvatarProps) {
  return (
    <RadixAvatar.Root className={cn(avatarVariants({ size, radius }), className)}>
      <RadixAvatar.Image src={src} alt={alt ?? ""} className="h-full w-full object-cover" />
      <RadixAvatar.Fallback
        delayMs={src ? 200 : 0}
        className={cn("flex h-full w-full items-center justify-center font-semibold", FALLBACK_TONE[color][variant])}
      >
        {fallback || fallbackIcon || (
          <svg viewBox="0 0 24 24" fill="none" className={cn("h-1/2 w-1/2", color === "neutral" ? "text-fg-subtle" : "text-inherit")} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}

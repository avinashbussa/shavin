import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        surface: "bg-surface border border-hairline",
        outline: "border border-hairline bg-transparent",
        soft: "",
        solid: "border border-transparent",
      },
      tone: {
        neutral: "text-fg-subtle",
        // Contrast-safe accent text (raw --accent fails on light surfaces).
        accent: "text-accent-contrast",
        success: "text-success",
        warning: "text-warning",
        danger: "text-danger",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
      radius: {
        none: "rounded-none",
        small: "rounded-[0.25rem]",
        medium: "rounded-[0.5rem]",
        large: "rounded-[0.75rem]",
        full: "rounded-full",
        inherit: "rounded-[var(--radius-lg)]",
        concentric: "rounded-panel-inner",
      },
    },
    compoundVariants: [
      { variant: "surface", tone: "neutral", class: "text-fg-subtle border-hairline" },
      { variant: "surface", tone: "accent", class: "text-accent-contrast border-hairline" },
      { variant: "surface", tone: "success", class: "text-success border-success/30" },
      { variant: "surface", tone: "warning", class: "text-warning border-warning/30" },
      { variant: "surface", tone: "danger", class: "text-danger border-danger/30" },
      { variant: "outline", tone: "neutral", class: "text-fg-subtle border-hairline" },
      { variant: "outline", tone: "accent", class: "text-accent-contrast border-accent/30" },
      { variant: "outline", tone: "success", class: "text-success border-success/30" },
      { variant: "outline", tone: "warning", class: "text-warning border-warning/30" },
      { variant: "outline", tone: "danger", class: "text-danger border-danger/30" },
      { variant: "soft", tone: "neutral", class: "bg-fg/[0.04] text-fg border border-fg/[0.08]" },
      { variant: "soft", tone: "accent", class: "bg-accent/[0.08] text-accent-contrast border border-accent/20" },
      { variant: "soft", tone: "success", class: "bg-success/10 text-success border border-success/20" },
      { variant: "soft", tone: "warning", class: "bg-warning/10 text-warning border border-warning/20" },
      { variant: "soft", tone: "danger", class: "bg-danger/10 text-danger border border-danger/20" },
      { variant: "solid", tone: "neutral", class: "bg-fg text-canvas" },
      { variant: "solid", tone: "accent", class: "bg-accent text-accent-fg" },
      { variant: "solid", tone: "success", class: "bg-success text-canvas" },
      { variant: "solid", tone: "warning", class: "bg-warning text-canvas" },
      { variant: "solid", tone: "danger", class: "bg-danger text-canvas" },
    ],
    defaultVariants: {
      variant: "surface",
      tone: "neutral",
      size: "md",
      radius: "inherit",
    },
  }
);

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof badgeVariants> {
  /** Backward compatible color prop. Maps to tone. */
  color?: "neutral" | "accent" | "success" | "warning" | "danger";
  /** Optional icon node rendered before label. */
  icon?: React.ReactNode;
}

export function Badge({
  className,
  variant,
  tone,
  color,
  size,
  radius,
  icon,
  children,
  ...props
}: BadgeProps) {
  const resolvedTone = tone ?? (color as typeof tone) ?? "neutral";
  const resolvedVariant = variant ?? (color ? (color === "neutral" ? "surface" : "soft") : "surface");

  return (
    <span
      className={cn(badgeVariants({ variant: resolvedVariant, tone: resolvedTone, size, radius }), className)}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

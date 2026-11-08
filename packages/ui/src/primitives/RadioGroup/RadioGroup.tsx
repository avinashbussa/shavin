"use client";
import React, { createContext, useContext, type ComponentPropsWithoutRef, type ReactNode } from "react";
import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

export type RadiusPreset = "none" | "small" | "medium" | "large" | "full" | "inherit" | "concentric";

interface RadioGroupContextValue {
  variant: "default" | "cards";
  radius: RadiusPreset;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue>({
  variant: "default",
  radius: "inherit",
});

export const ringRadiusVariants = cva(
  "flex h-5 w-5 shrink-0 items-center justify-center border border-border-control bg-surface transition data-[state=checked]:border-accent disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      radius: {
        none: "rounded-none",
        small: "rounded-[0.25rem]",
        medium: "rounded-[0.5rem]",
        large: "rounded-[0.75rem]",
        full: "rounded-full",
        inherit: "rounded-full",
        concentric: "rounded-panel-inner",
      },
    },
    defaultVariants: { radius: "inherit" },
  }
);

export const dotRadiusVariants = cva("h-2.5 w-2.5 bg-accent", {
  variants: {
    radius: {
      none: "rounded-none",
      small: "rounded-[0.15rem]",
      medium: "rounded-[0.3rem]",
      large: "rounded-[0.45rem]",
      full: "rounded-full",
      inherit: "rounded-full",
      concentric: "rounded-panel-inner",
    },
  },
  defaultVariants: { radius: "inherit" },
});

export const cardRadiusVariants = cva(
  "flex items-center gap-3 border p-3 text-sm text-fg transition border-hairline data-[state=checked]:border-accent data-[state=checked]:bg-accent/5",
  {
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
  }
);

export interface RadioGroupProps extends ComponentPropsWithoutRef<typeof RadixRadioGroup.Root> {
  /** Visual variant: default radio buttons or cards layout. Default "default". */
  variant?: "default" | "cards";
  /** Radius style for radio items or card containers. Default "inherit". */
  radius?: RadiusPreset;
}

export function RadioGroup({
  variant = "default",
  radius = "inherit",
  disabled,
  className,
  children,
  ...props
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ variant, radius, disabled }}>
      <RadixRadioGroup.Root
        className={cn(
          variant === "cards" ? "grid gap-2 sm:grid-cols-2" : "flex flex-col gap-2",
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </RadixRadioGroup.Root>
    </RadioGroupContext.Provider>
  );
}

export interface RadioProps {
  /** Option value string. */
  value: string;
  /** Primary option label text. */
  label?: string;
  /** Optional secondary description text for card layout. */
  description?: string;
  /** Disabled state. */
  disabled?: boolean;
  /** Radius override for this specific item. */
  radius?: RadiusPreset;
  /** Variant override for this specific item. */
  variant?: "default" | "cards";
  /** Custom wrapper class name. */
  className?: string;
  /** Custom children element to render inside card or label. */
  children?: ReactNode;
  /** Accessible name when there is no visible `label` (e.g. the row text names it visually). */
  "aria-label"?: string;
}

export function Radio({
  value,
  label,
  description,
  disabled: itemDisabled,
  radius: itemRadius,
  variant: itemVariant,
  className,
  children,
  "aria-label": ariaLabel,
}: RadioProps) {
  const ctx = useContext(RadioGroupContext);
  const effectiveVariant = itemVariant ?? ctx.variant;
  const effectiveRadius = itemRadius ?? ctx.radius;
  const isDisabled = itemDisabled ?? ctx.disabled;

  if (effectiveVariant === "cards") {
    return (
      // The card IS the Radix radio (a button), so Space, arrows and role="radio" all work.
      <RadixRadioGroup.Item
        value={value}
        disabled={isDisabled}
        className={cn(
          cardRadiusVariants({ radius: effectiveRadius }),
          "w-full text-left",
          isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-surface-hover data-[state=checked]:hover:bg-accent/5",
          className
        )}
      >
        {children || (
          <span className="flex flex-col gap-0.5 min-w-0">
            {label && <span className="font-semibold text-fg">{label}</span>}
            {description && <span className="text-xs text-fg-muted">{description}</span>}
          </span>
        )}
      </RadixRadioGroup.Item>
    );
  }

  return (
    <label className={cn("flex items-center gap-2 select-none", isDisabled ? "cursor-not-allowed" : "cursor-pointer", className)}>
      <RadixRadioGroup.Item value={value} disabled={isDisabled} aria-label={ariaLabel} className={ringRadiusVariants({ radius: effectiveRadius })}>
        <RadixRadioGroup.Indicator className={dotRadiusVariants({ radius: effectiveRadius })} />
      </RadixRadioGroup.Item>
      {children || (
        label && <span className={cn("text-sm text-fg", isDisabled && "opacity-50")}>{label}</span>
      )}
    </label>
  );
}

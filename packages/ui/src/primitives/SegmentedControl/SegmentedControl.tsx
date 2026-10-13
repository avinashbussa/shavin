"use client";
import { createContext, useContext, type ReactNode } from "react";
import * as RadixToggleGroup from "@radix-ui/react-toggle-group";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

export type Size = "sm" | "md";
export type Variant = "default" | "pill" | "expand" | "icon";

type SegmentedCtx = { size: Size; variant: Variant };
const SizeContext = createContext<SegmentedCtx>({ size: "md", variant: "default" });

const rootPad = { sm: "p-0.5", md: "p-1" } as const;

export interface SegmentedControlProps
  extends Omit<RadixToggleGroup.ToggleGroupSingleProps, "type"> {
  size?: Size;
  /** default | pill | expand | icon. */
  variant?: Variant;
  /** @deprecated use `variant="expand"`. */
  iconOnly?: boolean;
}

export function SegmentedControl({
  className,
  size = "md",
  variant,
  iconOnly = false,
  ...props
}: SegmentedControlProps) {
  const resolved: Variant = variant ?? (iconOnly ? "expand" : "default");
  const isPill = resolved === "pill";

  return (
    <SizeContext.Provider value={{ size, variant: resolved }}>
      <RadixToggleGroup.Root
        type="single"
        className={cn(
          "inline-flex gap-1 overflow-hidden",
          isPill
            ? "rounded-full border border-hairline/60 bg-surface-hover/80"
            : "rounded-[var(--radius-lg)] border border-hairline",
          rootPad[size],
          className,
        )}
        {...props}
      />
    </SizeContext.Provider>
  );
}

export const itemVariants = cva(
  "transition disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
  {
    variants: {
      variant: {
        default:
          "rounded-[calc(var(--radius-lg)-2px)] text-fg-muted hover:bg-surface-hover hover:text-fg active:scale-[0.97] data-[state=on]:bg-accent data-[state=on]:text-accent-fg data-[state=on]:hover:bg-accent",
        pill:
          "rounded-full text-fg-muted font-medium hover:text-fg active:scale-[0.97] data-[state=on]:bg-surface data-[state=on]:text-fg data-[state=on]:font-semibold data-[state=on]:shadow-1 data-[state=on]:border data-[state=on]:border-hairline/40",
        expand:
          "rounded-[calc(var(--radius-lg)-2px)] text-fg-muted hover:bg-surface-hover hover:text-fg active:scale-[0.97] data-[state=on]:bg-accent data-[state=on]:text-accent-fg data-[state=on]:hover:bg-accent",
        icon:
          "rounded-[calc(var(--radius-lg)-2px)] text-fg-muted hover:bg-surface-hover hover:text-fg active:scale-[0.97] data-[state=on]:bg-accent data-[state=on]:text-accent-fg data-[state=on]:hover:bg-accent",
      },
      size: {
        sm: "px-2.5 py-1 text-xs",
        md: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface SegmentedControlItemProps {
  value: string;
  children?: ReactNode;
  icon?: ReactNode;
  label?: ReactNode;
  disabled?: boolean;
}

export function SegmentedControlItem({
  value,
  children,
  icon,
  label,
  disabled,
}: SegmentedControlItemProps) {
  const { size, variant } = useContext(SizeContext);

  if (variant === "icon" && icon !== undefined) {
    return (
      <RadixToggleGroup.Item
        value={value}
        disabled={disabled}
        aria-label={typeof label === "string" ? label : undefined}
        className={cn(itemVariants({ variant, size }), "flex items-center justify-center")}
      >
        <span className="shrink-0">{icon}</span>
      </RadixToggleGroup.Item>
    );
  }

  const iconOnly = variant === "expand";
  if (iconOnly && icon !== undefined) {
    return (
      <RadixToggleGroup.Item
        value={value}
        disabled={disabled}
        className={cn(
          itemVariants({ variant, size }),
          "grid grid-cols-[auto_0fr] items-center gap-0 overflow-hidden",
          "data-[state=on]:grid-cols-[auto_1fr] data-[state=on]:gap-1.5",
        )}
        style={{
          transition:
            "grid-template-columns 160ms cubic-bezier(0.23,1,0.32,1), gap 160ms cubic-bezier(0.23,1,0.32,1), background-color 120ms ease, color 120ms ease, transform 100ms ease",
        }}
      >
        <span className="shrink-0">{icon}</span>
        <span
          className="min-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-opacity data-[state=on]:opacity-100 [[data-state=on]_&]:opacity-100"
          style={{ transition: "opacity 100ms cubic-bezier(0.23,1,0.32,1) 60ms" }}
          aria-hidden={false}
        >
          {label}
        </span>
      </RadixToggleGroup.Item>
    );
  }

  return (
    <RadixToggleGroup.Item
      value={value}
      disabled={disabled}
      className={cn("flex-1 text-center whitespace-nowrap min-w-fit select-none", itemVariants({ variant, size }))}
    >
      {children ?? label}
    </RadixToggleGroup.Item>
  );
}

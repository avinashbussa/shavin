import type { ElementType, ReactNode, HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const rowVariants = cva(
  "group flex w-full items-center gap-2.5 rounded-[var(--radius-lg)] px-2.5 py-2 text-left text-sm transition",
  {
    variants: {
      active: {
        true: "bg-fg/[0.07] font-medium text-fg",
        false: "text-fg-muted hover:bg-fg/[0.05] hover:text-fg",
      },
    },
    defaultVariants: { active: false },
  },
);

export interface RowProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof rowVariants> {
  /** Polymorphic element tag: "button" (default for single click target) or "div" (for nested interactive controls). */
  as?: ElementType;
  /** Icon, color dot, Checkbox, Radio, or drag handle leading slot. */
  leading?: ReactNode;
  /** Chevron, Badge, secondary text, or hover-revealed action button trailing slot. */
  trailing?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Row({
  as: Tag = "button",
  active,
  leading,
  trailing,
  children,
  className,
  ...props
}: RowProps) {
  return (
    <Tag
      type={Tag === "button" ? "button" : undefined}
      className={cn(rowVariants({ active }), className)}
      {...props}
    >
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing && <span className="flex shrink-0 items-center">{trailing}</span>}
    </Tag>
  );
}

export interface RowDragHandleProps {
  className?: string;
}

export function RowDragHandle({ className }: RowDragHandleProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4 cursor-grab text-fg-subtle active:cursor-grabbing", className)} fill="currentColor">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  );
}

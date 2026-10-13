import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { Text } from "../Text";

export const dataListVariants = cva("flex flex-col", {
  variants: {
    orientation: {
      vertical: "gap-4",
      horizontal: "gap-2 [&>div]:flex-row [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-4",
    },
  },
  defaultVariants: { orientation: "vertical" },
});

export interface DataListProps
  extends HTMLAttributes<HTMLDListElement>,
    VariantProps<typeof dataListVariants> {}

export function DataList({
  orientation,
  className,
  ...props
}: DataListProps) {
  return <dl className={cn(dataListVariants({ orientation }), className)} {...props} />;
}

export interface DataListItemProps {
  /** Label text for data term definition. */
  label: string;
  /** Optional custom CSS class name. */
  className?: string;
  /** Value content. */
  children: ReactNode;
}

export function DataListItem({
  label,
  className,
  children,
}: DataListItemProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <dt><Text size="overline" color="subtle" weight="medium">{label}</Text></dt>
      <dd><Text size="sm" weight="medium">{children}</Text></dd>
    </div>
  );
}

"use client";
import { useId, type HTMLAttributes, type ReactNode } from "react";
import { Checkbox } from "../Checkbox/Checkbox";
import { cn } from "../../lib/cn";

export interface CheckboxGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Visible group label; names the group for screen readers (WCAG 1.3.1). Or pass `aria-label`. */
  label?: ReactNode;
  /** Vertical list of CheckboxGroupItem children. */
  children: ReactNode;
  /** Custom wrapper class name. */
  className?: string;
}

export function CheckboxGroup({
  children,
  className,
  label,
  ...props
}: CheckboxGroupProps) {
  const labelId = useId();
  const group = (
    <div role="group" aria-labelledby={label ? labelId : undefined} className={cn("space-y-2", className)} {...props}>
      {children}
    </div>
  );
  if (!label) return group;
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-xs font-semibold text-fg-muted">
        {label}
      </span>
      {group}
    </div>
  );
}

export interface CheckboxGroupItemProps {
  /** Whether item is checked. */
  checked: boolean;
  /** Callback fired when checked state changes. */
  onCheckedChange: (checked: boolean) => void;
  /** Item label text. */
  label: string;
  /** Disabled state. */
  disabled?: boolean;
}

export function CheckboxGroupItem({
  checked,
  onCheckedChange,
  label,
  disabled,
}: CheckboxGroupItemProps) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={(c) => onCheckedChange(c === true)}
      disabled={disabled}
      label={label}
      className="flex"
    />
  );
}

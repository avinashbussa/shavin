"use client";
import type { ReactNode } from "react";
import { Checkbox } from "../Checkbox/Checkbox";
import { cn } from "../../lib/cn";

export interface CheckboxGroupProps {
  /** Vertical list of CheckboxGroupItem children. */
  children: ReactNode;
  /** Custom wrapper class name. */
  className?: string;
}

export function CheckboxGroup({
  children,
  className,
}: CheckboxGroupProps) {
  return (
    <div role="group" className={cn("space-y-2", className)}>
      {children}
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

"use client";
import type { ReactNode, CSSProperties } from "react";
import { Checkbox } from "../Checkbox/Checkbox";
import { cn } from "../../lib/cn";
import { concentricContainerStyle, withConcentricStyle } from "../../lib/concentric";

export interface CheckboxCardsProps {
  /** Checkbox card items grid wrapper. */
  children: ReactNode;
  /** Custom CSS grid layout class name. */
  className?: string;
}

export function CheckboxCards({
  children,
  className,
}: CheckboxCardsProps) {
  return (
    <div role="group" className={cn("grid gap-2 sm:grid-cols-2", className)}>
      {children}
    </div>
  );
}

export interface CheckboxCardsItemProps {
  /** Whether card option is checked. */
  checked: boolean;
  /** Callback fired when checked state changes. */
  onCheckedChange: (checked: boolean) => void;
  /** Content rendered inside card body. */
  children: ReactNode;
  /** Disabled state. */
  disabled?: boolean;
  /** Inline style override. */
  style?: CSSProperties;
}

export function CheckboxCardsItem({
  checked,
  onCheckedChange,
  children,
  disabled,
  style,
}: CheckboxCardsItemProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-panel)] border p-3 transition",
        checked ? "border-accent bg-accent/5" : "border-hairline hover:bg-surface-hover",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
      style={withConcentricStyle(style, concentricContainerStyle("3"))}
    >
      <Checkbox checked={checked} onCheckedChange={(c) => onCheckedChange(c === true)} disabled={disabled} />
      <span className="text-sm text-fg">{children}</span>
    </label>
  );
}

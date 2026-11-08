"use client";
import { useId, type HTMLAttributes, type ReactNode, CSSProperties } from "react";
import { Checkbox } from "../Checkbox/Checkbox";
import { cn } from "../../lib/cn";
import { concentricContainerStyle, withConcentricStyle } from "../../lib/concentric";

export interface CheckboxCardsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Visible group label; names the group for screen readers (WCAG 1.3.1). Or pass `aria-label`. */
  label?: ReactNode;
  /** Checkbox card items grid wrapper. */
  children: ReactNode;
  /** Custom CSS grid layout class name. */
  className?: string;
}

export function CheckboxCards({
  children,
  className,
  label,
  ...props
}: CheckboxCardsProps) {
  const labelId = useId();
  const group = (
    <div role="group" aria-labelledby={label ? labelId : undefined} className={cn("grid gap-2 sm:grid-cols-2", className)} {...props}>
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

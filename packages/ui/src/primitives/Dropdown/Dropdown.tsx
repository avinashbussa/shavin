"use client";
import { useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const triggerVariants = cva(
  "w-full appearance-none rounded-[var(--radius-xl)] border text-fg outline-none disabled:opacity-50 text-left relative",
  {
    variants: {
      size: {
        sm: "py-1.5 pl-2.5 pr-8 text-xs",
        md: "py-2 pl-3 pr-9 text-sm",
      },
      appearance: {
        default: "border-hairline bg-surface focus:border-hairline",
        ghost: "border-transparent bg-transparent hover:bg-surface-hover",
      },
    },
    defaultVariants: { size: "md", appearance: "default" },
  },
);

const chevronPosition = { sm: "right-2.5", md: "right-3" } as const;

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps extends VariantProps<typeof triggerVariants> {
  /** Active selected option value string (controlled). Omit and use `defaultValue` for uncontrolled. */
  value?: string;
  /** Initial selected value when uncontrolled. */
  defaultValue?: string;
  /** Callback fired when selected option value changes. */
  onChange?: (v: string) => void;
  /** Alias of `onChange`. */
  onValueChange?: (v: string) => void;
  /** List of dropdown options ({ value, label }). */
  options: DropdownOption[];
  /** Whether control is disabled. */
  disabled?: boolean;
  /** Rendering variant: native (<select>) or default (custom popup). Default 'default'. */
  variant?: "native" | "default";
  /** Popup placement relative to trigger: 'bottom' or 'top'. Default 'bottom'. */
  placement?: "bottom" | "top";
  /** Popup horizontal alignment relative to trigger: 'start' (left) or 'end' (right). Default 'start'. */
  align?: "start" | "end";
  /** Accessible ARIA label. */
  ariaLabel?: string;
  /** Optional custom CSS class name. */
  className?: string;
}

export function Dropdown({
  value: controlledValue,
  defaultValue,
  onChange,
  onValueChange,
  options,
  disabled,
  size,
  appearance,
  variant = "default",
  placement = "bottom",
  align = "start",
  ariaLabel,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? "");
  const value = controlledValue ?? internalValue;
  const select = (v: string) => {
    if (controlledValue === undefined) setInternalValue(v);
    onChange?.(v);
    onValueChange?.(v);
  };
  const resolvedSize = size ?? "md";
  const selectedOption = options.find((o) => o.value === value) ?? options[0];

  if (variant === "default") {
    return (
      <div className={cn("relative inline-block w-full", className)}>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          onClick={() => setOpen(!open)}
          className={cn(triggerVariants({ size, appearance }), "pr-8 cursor-pointer text-left w-full")}
        >
          <span className="truncate block">{selectedOption?.label}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={cn(
              "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted transition-transform duration-200",
              chevronPosition[resolvedSize],
              open && "rotate-180",
            )}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && !disabled && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              data-panel
              className={cn(
                "absolute z-50 max-h-60 overflow-y-auto rounded-[var(--radius-panel)] border border-hairline p-1 shadow-panel bg-surface animate-in fade-in duration-100 min-w-full w-max max-w-xs",
                align === "end" ? "right-0 left-auto" : "left-0",
                placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
              )}
            >
              {options.map((o) => {
                const isSelected = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      select(o.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 rounded-[var(--radius-lg)] text-xs transition-colors cursor-pointer",
                      isSelected
                        ? "bg-surface-hover font-semibold text-fg"
                        : "text-fg-muted hover:bg-surface-hover hover:text-fg",
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative inline-block w-full", className)}>
      <select
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => select(e.target.value)}
        className={cn(triggerVariants({ size, appearance }), "pr-8")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn(
          "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted",
          chevronPosition[resolvedSize],
        )}
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

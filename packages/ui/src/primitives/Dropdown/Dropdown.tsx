"use client";
import { useState } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const triggerVariants = cva(
  "w-full appearance-none rounded-[var(--radius-xl)] border text-fg disabled:opacity-50 text-left relative",
  {
    variants: {
      size: {
        sm: "py-1.5 pl-2.5 pr-8 text-xs",
        md: "py-2 pl-3 pr-9 text-sm",
      },
      appearance: {
        default: "border-border-control bg-surface",
        ghost: "border-transparent bg-transparent hover:bg-surface-hover",
      },
    },
    defaultVariants: { size: "md", appearance: "default" },
  },
);

const chevronPosition = { sm: "right-2.5", md: "right-3" } as const;

// Radix Select reserves "" for "no value"; carry an empty option value through a sentinel.
const EMPTY = "__shavin-dropdown-empty__";
const enc = (v: string) => (v === "" ? EMPTY : v);
const dec = (v: string) => (v === EMPTY ? "" : v);

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
  /** id of the control, so a `<label htmlFor>` can name it. */
  id?: string;
  /** Form field name. */
  name?: string;
  /** Marks the field required. */
  required?: boolean;
  "aria-labelledby"?: string;
  /** id(s) of hint or error text describing the field. */
  "aria-describedby"?: string;
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
  id,
  name,
  required,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: DropdownProps) {
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
    // Radix Select underneath: listbox/option roles, aria-expanded, arrow keys,
    // typeahead, Escape and focus return (WCAG 2.1.1, 4.1.2). Look and API unchanged.
    return (
      <RadixSelect.Root value={enc(value)} onValueChange={(v) => select(dec(v))} disabled={disabled} name={name} required={required}>
        <div className={cn("relative inline-block w-full", className)}>
          <RadixSelect.Trigger
            id={id}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            className={cn(triggerVariants({ size, appearance }), "group pr-8 cursor-pointer text-left w-full")}
          >
            <span className="truncate block">
              <RadixSelect.Value>{selectedOption?.label}</RadixSelect.Value>
            </span>
            <RadixSelect.Icon asChild>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted transition-transform duration-200 group-data-[state=open]:rotate-180",
                  chevronPosition[resolvedSize],
                )}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </RadixSelect.Icon>
          </RadixSelect.Trigger>
        </div>
        <RadixSelect.Portal>
          <RadixSelect.Content
            data-panel
            position="popper"
            side={placement}
            align={align}
            sideOffset={6}
            collisionPadding={8}
            className="z-[var(--z-floating)] max-h-60 min-w-[var(--radix-select-trigger-width)] max-w-xs overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-surface shadow-panel animate-in fade-in duration-100"
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((o) => (
                <RadixSelect.Item
                  key={o.value}
                  value={enc(o.value)}
                  className="w-full cursor-pointer rounded-[var(--radius-lg)] px-2.5 py-1.5 text-left text-xs text-fg-muted outline-none transition-colors hover:bg-surface-hover hover:text-fg data-[highlighted]:bg-surface-hover data-[highlighted]:text-fg data-[state=checked]:bg-surface-hover data-[state=checked]:font-semibold data-[state=checked]:text-fg"
                >
                  <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    );
  }

  return (
    <div className={cn("relative inline-block w-full", className)}>
      <select
        id={id}
        name={name}
        required={required}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
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
        aria-hidden="true"
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

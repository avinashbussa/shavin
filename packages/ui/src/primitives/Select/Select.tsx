"use client";
import { useState } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { cn } from "../../lib/cn";

export interface Option {
  value: string;
  label: string;
  prefix?: React.ReactNode;
}

export interface OptionGroup {
  group: string;
  options: Option[];
}

function isOptionGroup(o: Option | OptionGroup): o is OptionGroup {
  return "group" in o;
}

export interface SelectProps {
  /** Active selected option value (controlled). Omit and use `defaultValue` for uncontrolled. */
  value?: string;
  /** Initial selected value when uncontrolled. */
  defaultValue?: string;
  /** Flat options list or grouped option list. */
  options: (Option | OptionGroup)[];
  /** Callback fired when user selects an option. */
  onChange?: (v: string) => void;
  /** Alias of `onChange` (Radix naming). */
  onValueChange?: (v: string) => void;
  /** Optional callback fired when an item is hovered/focused for live preview. Passed null on mouseleave/close. */
  onItemHighlight?: (v: string | null) => void;
  /** Accessible ARIA label string. */
  ariaLabel?: string;
  /** Placeholder text when value is unselected. */
  placeholder?: string;
  /** Optional custom CSS class name for the trigger. */
  className?: string;
  /** Optional custom CSS class name for the portaled dropdown content. */
  contentClassName?: string;
  /** Optional custom inline style for the portaled dropdown content. */
  contentStyle?: React.CSSProperties;
  /** Select trigger size. Heights match Button, TextField and Combobox: sm 32px, md 40px, lg 48px. */
  size?: "sm" | "md" | "lg";
  /** Whether the control is disabled. */
  disabled?: boolean;
}

export function Select({
  value: controlledValue,
  defaultValue,
  options,
  onChange,
  onValueChange,
  onItemHighlight,
  ariaLabel,
  placeholder = "Select…",
  className,
  contentClassName,
  contentStyle,
  size = "md",
  disabled,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const value = controlledValue ?? internalValue;

  // Find selected option to display prefix in trigger if present
  const flatOptions: Option[] = [];
  for (const item of options) {
    if (isOptionGroup(item)) {
      flatOptions.push(...item.options);
    } else {
      flatOptions.push(item);
    }
  }
  const selectedOption = flatOptions.find((o) => o.value === value);

  return (
    <RadixSelect.Root
      // Radix throws on an empty-string value; "" means unselected (placeholder).
      value={value === "" ? undefined : value}
      disabled={disabled}
      onValueChange={(v) => {
        onItemHighlight?.(null);
        if (controlledValue === undefined) setInternalValue(v);
        onChange?.(v);
        onValueChange?.(v);
      }}
      onOpenChange={(open) => {
        if (!open) onItemHighlight?.(null);
      }}
    >
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-hairline bg-surface outline-none transition focus:border-hairline data-[placeholder]:text-fg-muted disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" ? "h-8 pl-2.5 pr-2 text-xs" : size === "lg" ? "h-12 pl-3.5 pr-3 text-base" : "h-10 pl-3 pr-2.5 text-base md:text-sm",
          className,
        )}
      >
        <span className="flex items-center gap-2 truncate text-left flex-1 min-w-0">
          {selectedOption?.prefix}
          <span className="truncate">
            <RadixSelect.Value placeholder={placeholder} />
          </span>
        </span>
        <RadixSelect.Icon asChild>
          <svg viewBox="0 0 24 24" fill="none" className={cn("shrink-0 text-fg-muted", size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4")}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          data-panel
          position="popper"
          align="start"
          sideOffset={4}
          avoidCollisions
          collisionPadding={8}
          style={contentStyle}
          onPointerLeave={() => onItemHighlight?.(null)}
          className={cn(
            "animate-rise origin-[var(--radix-select-content-transform-origin)] z-[100] min-w-[var(--radix-select-trigger-width)] max-w-[320px] max-h-[var(--radix-select-content-available-height)] rounded-[var(--radius-panel)] border border-hairline bg-surface text-fg shadow-panel",
            contentClassName
          )}
        >
          <RadixSelect.ScrollUpButton className="flex items-center justify-center py-1 text-fg-muted">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="p-1">
            {options.map((item, idx) => {
              if (isOptionGroup(item)) {
                const safeSubOptions = item.options.filter((o) => o.value !== "");
                if (safeSubOptions.length === 0) return null;
                return (
                  <RadixSelect.Group key={idx}>
                    <RadixSelect.Label className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                      {item.group}
                    </RadixSelect.Label>
                    {safeSubOptions.map((o) => (
                      <RadixSelect.Item
                        key={o.value}
                        value={o.value}
                        onPointerMove={() => onItemHighlight?.(o.value)}
                        onFocus={() => onItemHighlight?.(o.value)}
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-between rounded-[var(--radius-lg)] px-3 outline-none hover:bg-surface-hover data-[highlighted]:bg-surface-hover data-[state=checked]:font-medium data-[state=checked]:text-accent",
                          size === "sm" ? "py-1.5 text-xs" : size === "lg" ? "py-2.5 text-base" : "py-2 text-sm",
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {o.prefix}
                          <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                        </div>
                        <RadixSelect.ItemIndicator>
                          <svg viewBox="0 0 24 24" fill="none" className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}>
                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </RadixSelect.ItemIndicator>
                      </RadixSelect.Item>
                    ))}
                  </RadixSelect.Group>
                );
              }

              if (item.value === "") return null;
              return (
                <RadixSelect.Item
                  key={item.value}
                  value={item.value}
                  onPointerMove={() => onItemHighlight?.(item.value)}
                  onFocus={() => onItemHighlight?.(item.value)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between rounded-[var(--radius-lg)] px-3 outline-none hover:bg-surface-hover data-[highlighted]:bg-surface-hover data-[state=checked]:font-medium data-[state=checked]:text-accent",
                    size === "sm" ? "py-1.5 text-xs" : size === "lg" ? "py-2.5 text-base" : "py-2 text-sm",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.prefix}
                    <RadixSelect.ItemText>{item.label}</RadixSelect.ItemText>
                  </div>
                  <RadixSelect.ItemIndicator>
                    <svg viewBox="0 0 24 24" fill="none" className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}>
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              );
            })}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex items-center justify-center py-1 text-fg-muted">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

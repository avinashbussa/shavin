"use client";

import { useState, useMemo, useRef, useEffect, type InputHTMLAttributes } from "react";
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "../Popover";
import { cn } from "../../lib/cn";

export interface ComboboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "size"> {
  /** Selected or typed string value. */
  value: string;
  /** Callback fired when user selects or types a value string. */
  onChange: (value: string) => void;
  /** List of string option items for autocomplete filtering. */
  options: string[];
  /** Optional formatter function for option labels. */
  prettyOptionLabel?: (val: string) => string;
  /** Size variant: "sm" (28px height, matching Select sm) or "md" (32px height). Default "md". */
  size?: "sm" | "md";
}

export function Combobox({
  value,
  onChange,
  options,
  prettyOptionLabel,
  size = "md",
  className,
  placeholder = "Select or type...",
  disabled,
  ...props
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (triggerRef.current) {
      setWidth(triggerRef.current.getBoundingClientRect().width);
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    const q = (value || "").trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const keyMatch = opt.toLowerCase().includes(q);
      const labelMatch = prettyOptionLabel ? prettyOptionLabel(opt).toLowerCase().includes(q) : false;
      return keyMatch || labelMatch;
    });
  }, [options, value, prettyOptionLabel]);

  const displayValue =
    hoveredOption !== null
      ? prettyOptionLabel
        ? prettyOptionLabel(hoveredOption)
        : hoveredOption
      : value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={triggerRef} className="relative flex items-center w-full">
          <input
            ref={inputRef}
            value={displayValue}
            onChange={(e) => {
              setHoveredOption(null);
              onChange(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              if (!open) setOpen(true);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full rounded-[var(--radius-lg)] border border-hairline bg-surface outline-none focus:border-hairline-strong disabled:opacity-40",
              size === "sm" ? "h-8 pl-2.5 pr-7 text-xs" : "h-10 pl-3 pr-8 text-base md:text-sm",
              className
            )}
            {...props}
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled || options.length === 0}
              onClick={(e) => {
                e.preventDefault();
                setOpen((prev) => !prev);
                inputRef.current?.focus();
              }}
              className="absolute right-0 top-0 bottom-0 px-2 text-fg-muted hover:text-fg disabled:opacity-40 cursor-pointer"
              aria-label="Toggle options"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>

      <PopoverContent
        style={{ width: width ? `${width}px` : "auto" }}
        className="p-1 min-w-[140px] max-h-56 overflow-y-auto shadow-panel"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {filteredOptions.length === 0 ? (
          <div className="px-2.5 py-2 text-xs text-fg-subtle italic">No matching options</div>
        ) : (
          filteredOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseEnter={() => setHoveredOption(opt)}
              onMouseLeave={() => setHoveredOption(null)}
              onClick={() => {
                onChange(opt);
                setHoveredOption(null);
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="flex w-full cursor-pointer items-center justify-between rounded-[var(--radius-lg)] px-2.5 py-1.5 text-left text-xs text-fg hover:bg-surface-hover focus:bg-surface-hover outline-none"
            >
              {prettyOptionLabel ? prettyOptionLabel(opt) : opt}
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

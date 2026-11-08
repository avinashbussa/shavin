"use client";

import React, { useState, useMemo, useRef, useEffect, useId, type InputHTMLAttributes } from "react";
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "../Popover";
import { cn } from "../../lib/cn";
import { announce } from "../../lib/announce";

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
  /** Preview the hovered option in the field as you move over the list. Default true;
   *  set false for a plain select that only applies on click. */
  hoverPreview?: boolean;
}

export function Combobox({
  value,
  onChange,
  options,
  prettyOptionLabel,
  size = "md",
  hoverPreview = true,
  className,
  placeholder = "Select or type...",
  disabled,
  id,
  ...props
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  // Keyboard highlight: focus stays in the input and aria-activedescendant points at
  // the highlighted option (APG editable combobox with list autocomplete).
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const listId = `${autoId}-list`;
  const optionId = (i: number) => `${autoId}-opt-${i}`;

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

  const labelOf = (opt: string) => (prettyOptionLabel ? prettyOptionLabel(opt) : opt);

  // A new filter result resets the highlight and tells screen readers how many matched.
  useEffect(() => {
    setActiveIndex(-1);
    if (!open) return;
    const n = filteredOptions.length;
    const t = setTimeout(() => announce(n === 0 ? "No matching options" : `${n} option${n === 1 ? "" : "s"} available`), 400);
    return () => clearTimeout(t);
  }, [filteredOptions, open]);

  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current?.querySelector(`#${CSS.escape(optionId(activeIndex))}`)?.scrollIntoView({ block: "nearest" });
    // optionId is derived from a stable useId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const commit = (opt: string) => {
    onChange(opt);
    setHoveredOption(null);
    setActiveIndex(-1);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const last = filteredOptions.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) setOpen(true);
        if (!e.altKey && last >= 0) setActiveIndex((i) => (i >= last ? 0 : i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) setOpen(true);
        if (last >= 0) setActiveIndex((i) => (i <= 0 ? last : i - 1));
        break;
      case "Enter":
        if (open && activeIndex >= 0 && filteredOptions[activeIndex] !== undefined) {
          e.preventDefault();
          commit(filteredOptions[activeIndex]);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          setActiveIndex(-1);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
    props.onKeyDown?.(e);
  };

  // With hoverPreview, the field previews the option under the cursor; otherwise it
  // always shows the committed value and only applies on click (like a plain select).
  const displayValue =
    hoverPreview && hoveredOption !== null ? labelOf(hoveredOption) : value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={triggerRef} className="relative flex items-center w-full">
          <input
            ref={inputRef}
            id={inputId}
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
            autoComplete="off"
            className={cn(
              "w-full rounded-[var(--radius-lg)] border border-border-control bg-surface disabled:opacity-40",
              size === "sm" ? "h-8 pl-2.5 pr-7 text-xs" : "h-10 pl-3 pr-8 text-base md:text-sm",
              className
            )}
            {...props}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
            onKeyDown={onKeyDown}
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              // APG: the open button is a pointer convenience; the input owns keyboard focus.
              tabIndex={-1}
              disabled={disabled || options.length === 0}
              onClick={(e) => {
                e.preventDefault();
                setOpen((prev) => !prev);
                inputRef.current?.focus();
              }}
              className="absolute right-0 top-0 bottom-0 px-2 text-fg-muted hover:text-fg disabled:opacity-40 cursor-pointer"
              aria-label="Show options"
              aria-expanded={open}
              aria-controls={listId}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
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
        // Clicks on the input or its button must not count as "outside".
        onInteractOutside={(e) => {
          if (triggerRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={props["aria-labelledby"]}
          aria-label={props["aria-labelledby"] ? undefined : (props["aria-label"] ?? placeholder)}
        >
          {filteredOptions.length === 0 ? (
            <div className="px-2.5 py-2 text-xs text-fg-subtle italic">No matching options</div>
          ) : (
            filteredOptions.map((opt, i) => (
              <div
                key={opt}
                id={optionId(i)}
                role="option"
                aria-selected={i === activeIndex}
                data-highlighted={i === activeIndex || undefined}
                data-current={opt === value || undefined}
                // Keep focus in the input while clicking an option.
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => hoverPreview && setHoveredOption(opt)}
                onMouseLeave={() => hoverPreview && setHoveredOption(null)}
                onClick={() => commit(opt)}
                className="flex w-full cursor-pointer items-center justify-between rounded-[var(--radius-lg)] px-2.5 py-1.5 text-left text-xs text-fg hover:bg-surface-hover data-[highlighted]:bg-surface-hover data-[current]:font-medium"
              >
                {labelOf(opt)}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

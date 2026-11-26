"use client";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { hitAreaClass, type HitArea } from "../../lib/hit-area";

export const checkboxVariants = cva(
  "hit-area-touch peer inline-flex shrink-0 aspect-square items-center justify-center rounded-[var(--radius-lg)] border border-border-control bg-surface transition data-[state=checked]:border-brand-solid data-[state=checked]:bg-brand-solid data-[state=indeterminate]:border-brand-solid data-[state=indeterminate]:bg-brand-solid disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
      },
    },
    defaultVariants: { size: "md" },
  },
);

// Text-color utilities passed via className apply to the label text (the
// span's own "text-fg" would otherwise always win). They are extracted out of
// className so what renders here is exactly what emitted
// <Checkbox className="text-fg-subtle" .../> produces in end-user projects.
const LABEL_TEXT_COLOR_RE =
  /(?:^|\s)text-(?:fg(?:-(?:muted|subtle|strong))?|brand|danger|success|warning|current|\[#[0-9a-fA-F]{3,8}\])(?=\s|$)/g;

const iconSizeBySize = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
} as const;

export interface CheckboxProps
  extends ComponentPropsWithoutRef<typeof RadixCheckbox.Root>,
    VariantProps<typeof checkboxVariants> {
  /** Optional label text placed adjacent to checkbox. */
  label?: string;
  /**
   * Hit-area override (docs: "Target size"). "default": 24px floor, 44px on touch. "none": no hit area
   * growth (dense toolbars; may go below 24px, yours to own). "touch": always 44px on a coarse pointer.
   */
  hitArea?: HitArea;
}

export const Checkbox = forwardRef<
  ElementRef<typeof RadixCheckbox.Root>,
  CheckboxProps
>(function Checkbox({ className, size, label, hitArea, ...props }, ref) {
  // Guard against accidental w-full on the root checkbox button to maintain 1:1 ratio
  const rootClass = !label && className ? className.replace(/\bw-full\b/g, "").trim() : undefined;

  const checkbox = (
    <RadixCheckbox.Root
      ref={ref}
      className={cn(checkboxVariants({ size }), hitAreaClass(hitArea, "touch", "Checkbox"), "aspect-square shrink-0", rootClass)}
      {...props}
    >
      <RadixCheckbox.Indicator className="flex items-center justify-center text-brand-fg">
        <svg viewBox="0 0 24 24" fill="none" className={iconSizeBySize[size ?? "md"]} aria-hidden="true">
          {props.checked === "indeterminate" ? (
            <path d="M6 12h12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          ) : (
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );

  if (label) {
    return (
      <label
        className={cn(
          "inline-flex items-center gap-2 select-none",
          props.disabled ? "cursor-not-allowed" : "cursor-pointer",
          className,
        )}
      >
        {checkbox}
        <span className={cn(size === "sm" ? "text-xs" : "text-sm", "text-fg", className?.match(LABEL_TEXT_COLOR_RE)?.join(" "), props.disabled && "opacity-50")}>
          {label}
        </span>
      </label>
    );
  }

  return checkbox;
});

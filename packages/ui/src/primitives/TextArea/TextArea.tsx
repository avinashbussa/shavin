import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const textAreaVariants = cva(
  "w-full rounded-[var(--radius-lg)] border px-3 py-2 text-base md:text-sm text-fg transition placeholder:text-fg-subtle disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      /**
       * outline (default): a 3:1 control border (WCAG 1.4.11), for forms on any background.
       * soft: filled, no border, for dense tool panels where a visible label and the value or
       * placeholder identify the field. Both show the 2px focus ring.
       */
      variant: {
        outline: "bg-surface",
        soft: "bg-surface-hover hover:bg-hairline/60",
      },
      invalid: {
        true: "border-danger focus-visible:outline-danger",
        false: "",
      },
    },
    compoundVariants: [
      { variant: "outline", invalid: false, class: "border-border-control" },
      { variant: "soft", invalid: false, class: "border-transparent" },
    ],
    defaultVariants: { variant: "outline", invalid: false },
  },
);

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textAreaVariants> {}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className, invalid, variant, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(textAreaVariants({ variant, invalid }), className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

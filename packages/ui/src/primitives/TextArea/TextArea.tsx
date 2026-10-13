import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const textAreaVariants = cva(
  "w-full rounded-[var(--radius-lg)] border border-hairline bg-surface px-3 py-2 text-base md:text-sm text-fg outline-none transition placeholder:text-fg-subtle disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      invalid: {
        true: "border-danger focus:border-danger",
        false: "border-hairline focus:border-hairline",
      },
    },
    defaultVariants: { invalid: false },
  },
);

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textAreaVariants> {}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className, invalid, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(textAreaVariants({ invalid }), className)}
      {...props}
    />
  );
});

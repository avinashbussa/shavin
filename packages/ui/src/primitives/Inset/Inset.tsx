import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const insetVariants = cva("", {
  variants: {
    p: {
      sm: "",
      md: "",
    },
    side: {
      all: "",
      top: "",
      bottom: "",
      x: "",
    },
  },
  compoundVariants: [
    { p: "sm", side: "all", class: "-m-4" },
    { p: "sm", side: "top", class: "-mx-4 -mt-4" },
    { p: "sm", side: "bottom", class: "-mx-4 -mb-4" },
    { p: "sm", side: "x", class: "-mx-4" },
    { p: "md", side: "all", class: "-m-5" },
    { p: "md", side: "top", class: "-mx-5 -mt-5" },
    { p: "md", side: "bottom", class: "-mx-5 -mb-5" },
    { p: "md", side: "x", class: "-mx-5" },
  ],
  defaultVariants: { p: "sm", side: "all" },
});

export interface InsetProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof insetVariants> {
  /** Whether to clip overflow to parent card radius (overflow-hidden rounded-[var(--radius-panel)]). */
  clip?: boolean;
}

export function Inset({
  side,
  p,
  clip,
  className,
  ...props
}: InsetProps) {
  return (
    <div
      className={cn(
        insetVariants({ p, side }),
        clip &&
          (side === "top"
            ? "overflow-hidden rounded-t-[var(--radius-panel)]"
            : side === "bottom"
              ? "overflow-hidden rounded-b-[var(--radius-panel)]"
              : side === "x"
                ? "overflow-hidden"
                : "overflow-hidden rounded-[var(--radius-panel)]"),
        className,
      )}
      {...props}
    />
  );
}

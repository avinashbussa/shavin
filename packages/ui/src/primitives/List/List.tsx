import type { HTMLAttributes, LiHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const listVariants = cva("space-y-1.5 text-sm text-fg", {
  variants: {
    marker: {
      bullet: "list-disc pl-5 marker:text-fg-subtle",
      number: "list-decimal pl-5 marker:text-fg-subtle",
      "lower-roman": "[list-style-type:lower-roman] pl-6 marker:text-fg-subtle",
      "upper-roman": "[list-style-type:upper-roman] pl-6 marker:text-fg-subtle",
      "lower-alpha": "[list-style-type:lower-alpha] pl-5 marker:text-fg-subtle",
      "upper-alpha": "[list-style-type:upper-alpha] pl-5 marker:text-fg-subtle",
      none: "list-none",
    },
  },
  defaultVariants: { marker: "bullet" },
});

export interface ListProps
  extends HTMLAttributes<HTMLUListElement | HTMLOListElement>,
    VariantProps<typeof listVariants> {
  /** Underlying tag type override: "ul" (unordered list) or "ol" (ordered list). Auto-inferred if marker is set. */
  as?: "ul" | "ol";
}

export function List({
  as,
  marker,
  className,
  ...props
}: ListProps) {
  const orderedMarkers = ["number", "lower-roman", "upper-roman", "lower-alpha", "upper-alpha"];
  const Tag = as ?? (marker && orderedMarkers.includes(marker) ? "ol" : "ul");
  return <Tag className={cn(listVariants({ marker }), className)} {...props} />;
}

export interface ListItemProps extends LiHTMLAttributes<HTMLLIElement> {}

export function ListItem({ className, ...props }: ListItemProps) {
  return <li className={cn("leading-relaxed", className)} {...props} />;
}

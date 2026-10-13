import React, { forwardRef } from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const separatorVariants = cva("shrink-0 transition-colors", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full w-px",
    },
    size: {
      "1": "",
      "2": "data-[orientation=horizontal]:h-0.5 data-[orientation=vertical]:w-0.5",
      "3": "data-[orientation=horizontal]:h-1 data-[orientation=vertical]:w-1",
      "4": "data-[orientation=horizontal]:h-2 data-[orientation=vertical]:w-2",
      full: "w-full h-full",
    },
    color: {
      hairline: "bg-hairline",
      "hairline-strong": "bg-hairline-strong",
      subtle: "bg-fg-subtle/30",
      muted: "bg-fg-muted/40",
      default: "bg-fg",
      accent: "bg-accent",
      contrast: "bg-accent-contrast",
      danger: "bg-danger",
      inherit: "bg-current",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    size: "1",
    color: "hairline",
  },
});

export type SeparatorColorToken =
  | "hairline"
  | "hairline-strong"
  | "subtle"
  | "muted"
  | "default"
  | "accent"
  | "contrast"
  | "danger"
  | "inherit";

export type SeparatorSizeToken = "1" | "2" | "3" | "4" | "full";

export interface SeparatorProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>, "color" | "size" | "orientation">,
    Omit<VariantProps<typeof separatorVariants>, "color"> {
  color?: SeparatorColorToken | (string & {});
  size?: SeparatorSizeToken;
  orientation?: "horizontal" | "vertical";
}

const COLOR_TOKENS = new Set([
  "hairline",
  "hairline-strong",
  "subtle",
  "muted",
  "default",
  "accent",
  "contrast",
  "danger",
  "inherit",
]);

export const Separator = forwardRef<React.ElementRef<typeof SeparatorPrimitive.Root>, SeparatorProps>(
  function Separator(
    {
      className,
      orientation = "horizontal",
      size = "1",
      color = "hairline",
      decorative = true,
      style,
      ...props
    },
    ref
  ) {
    const isTokenColor = typeof color === "string" && COLOR_TOKENS.has(color);
    const colorVariant = isTokenColor ? (color as SeparatorColorToken) : undefined;
    const customColorStyle = !isTokenColor && color ? { backgroundColor: color } : {};

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        orientation={orientation}
        decorative={decorative}
        className={cn(
          separatorVariants({
            orientation,
            size,
            color: colorVariant,
          }),
          className
        )}
        style={{ ...customColorStyle, ...style }}
        {...props}
      />
    );
  }
);

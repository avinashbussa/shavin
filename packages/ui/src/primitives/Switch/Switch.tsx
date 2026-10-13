"use client";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as RadixSwitch from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const trackVariants = cva(
  "relative inline-flex shrink-0 items-center rounded-full transition data-[state=checked]:bg-accent data-[state=unchecked]:bg-hairline-strong disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export const thumbVariants = cva(
  "block rounded-full bg-canvas shadow-2 transition-transform data-[state=unchecked]:translate-x-0.5",
  {
    variants: {
      size: {
        sm: "h-4 w-4 data-[state=checked]:translate-x-[18px]",
        md: "h-5 w-5 data-[state=checked]:translate-x-[22px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface SwitchProps
  extends ComponentPropsWithoutRef<typeof RadixSwitch.Root>,
    VariantProps<typeof trackVariants> {}

export const Switch = forwardRef<
  ElementRef<typeof RadixSwitch.Root>,
  SwitchProps
>(function Switch({ className, size, ...props }, ref) {
  return (
    <RadixSwitch.Root ref={ref} className={cn(trackVariants({ size }), className)} {...props}>
      <RadixSwitch.Thumb className={thumbVariants({ size })} />
    </RadixSwitch.Root>
  );
});

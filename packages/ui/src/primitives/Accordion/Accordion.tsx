"use client";
import React, { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as RadixAccordion from "@radix-ui/react-accordion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const accordionVariants = cva("w-full", {
  variants: {
    variant: {
      default: "divide-y divide-hairline border-y border-hairline",
      outline: "space-y-2",
      ghost: "space-y-0.5",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type AccordionProps = ComponentPropsWithoutRef<typeof RadixAccordion.Root> &
  VariantProps<typeof accordionVariants>;

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, variant, ...props }, ref) => (
    <RadixAccordion.Root
      ref={ref}
      className={cn(accordionVariants({ variant }), className)}
      {...(props as any)}
    />
  )
);
Accordion.displayName = "Accordion";

export const AccordionItem = forwardRef<
  ElementRef<typeof RadixAccordion.Item>,
  ComponentPropsWithoutRef<typeof RadixAccordion.Item>
>(({ className, ...props }, ref) => (
  <RadixAccordion.Item
    ref={ref}
    className={cn("transition-colors", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

export const AccordionTrigger = forwardRef<
  ElementRef<typeof RadixAccordion.Trigger>,
  ComponentPropsWithoutRef<typeof RadixAccordion.Trigger>
>(({ className, children, ...props }, ref) => (
  <RadixAccordion.Header className="flex">
    <RadixAccordion.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-3 text-sm font-medium text-fg transition cursor-pointer hover:text-fg [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0 text-fg-subtle transition-transform duration-200"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </RadixAccordion.Trigger>
  </RadixAccordion.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

export const AccordionContent = forwardRef<
  ElementRef<typeof RadixAccordion.Content>,
  ComponentPropsWithoutRef<typeof RadixAccordion.Content>
>(({ className, children, ...props }, ref) => (
  <RadixAccordion.Content
    ref={ref}
    className="shavin-accordion-content overflow-hidden text-sm"
    {...props}
  >
    <div className={cn("pt-0 pb-4 text-fg-muted", className)}>{children}</div>
  </RadixAccordion.Content>
));
AccordionContent.displayName = "AccordionContent";

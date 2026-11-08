"use client";
import type { ComponentProps } from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { cn } from "../../lib/cn";

export const HoverCard = HoverCardPrimitive.Root;
export const HoverCardTrigger = HoverCardPrimitive.Trigger;

export interface HoverCardContentProps extends ComponentProps<typeof HoverCardPrimitive.Content> {}

export function HoverCardContent({
  className,
  children,
  align = "start",
  sideOffset = 6,
  avoidCollisions = true,
  collisionPadding = 8,
  ...props
}: HoverCardContentProps) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        data-panel
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        collisionPadding={collisionPadding}
        className={cn(
          "animate-rise origin-[var(--radix-hover-card-content-transform-origin)] z-[var(--z-floating)] w-72 rounded-[var(--radius-panel)] border border-hairline p-4 shadow-panel focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Portal>
  );
}

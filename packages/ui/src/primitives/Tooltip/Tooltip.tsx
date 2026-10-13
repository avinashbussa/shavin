"use client";
import type { ReactElement, ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../lib/cn";

const TONE_CLASSES = {
  auto: "border border-transparent bg-tooltip text-tooltip-fg",
  // ds-lint-disable-next-line no-hex — forced tone: fixed contrast regardless of theme
  dark: "border border-transparent bg-[#18181b] text-white",
  // ds-lint-disable-next-line no-hex — forced tone: fixed contrast regardless of theme
  light: "border border-transparent bg-white text-[#18181b]",
} as const;

const TONE_ARROW_FILL = {
  auto: "fill-[rgb(var(--bg-tooltip))]",
  // ds-lint-disable-next-line no-hex — forced-tone arrow fill matches TONE_CLASSES.dark
  dark: "fill-[#18181b]",
  light: "fill-white",
} as const;

export interface TooltipProps {
  /** Tooltip popover label content. */
  content: ReactNode;
  /** Trigger element (must support forwardRef). */
  children: ReactElement;
  /** Placement side (top, right, bottom, left). Default top. */
  side?: "top" | "right" | "bottom" | "left";
  /** Open delay duration in milliseconds. Default 300. */
  delayDuration?: number;
  /** Color tone: auto (theme default), dark, or light. Default auto. */
  tone?: "auto" | "dark" | "light";
  /** Optional custom CSS class name. */
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = "top",
  delayDuration = 300,
  tone = "auto",
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            data-panel={tone === "auto" ? true : undefined}
            side={side}
            sideOffset={6}
            avoidCollisions
            collisionPadding={8}
            className={cn(
              "animate-rise-fast origin-[var(--radix-tooltip-content-transform-origin)] z-[90] rounded-[var(--radius-lg)] px-2.5 py-1.5 text-xs shadow-panel max-w-[240px]",
              TONE_CLASSES[tone],
              className,
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className={TONE_ARROW_FILL[tone]} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

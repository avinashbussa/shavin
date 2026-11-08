"use client";
import type { CSSProperties, ReactNode } from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "../../lib/cn";

export interface ScrollAreaProps {
  /** ScrollArea body content. */
  children: ReactNode;
  /** Names the scrollable region for screen readers. */
  "aria-label"?: string;
  /** Custom outer container class name (e.g. h-64 or max-h-96). */
  className?: string;
  style?: CSSProperties;
}

export function ScrollArea({
  children,
  className,
  style,
  "aria-label": ariaLabel,
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      className={cn("overflow-hidden", className)}
      style={style}
    >
      {/* Focusable so the content scrolls by keyboard in every browser (WCAG 2.1.1). */}
      <ScrollAreaPrimitive.Viewport
        tabIndex={0}
        role={ariaLabel ? "region" : undefined}
        aria-label={ariaLabel}
        className="h-full w-full rounded-[inherit]"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="flex w-2.5 touch-none select-none p-0.5"
      >
        <ScrollAreaPrimitive.Thumb className="flex-1 rounded-full bg-hairline-strong" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Scrollbar
        orientation="horizontal"
        className="flex h-2.5 flex-col touch-none select-none p-0.5"
      >
        <ScrollAreaPrimitive.Thumb className="flex-1 rounded-full bg-hairline-strong" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

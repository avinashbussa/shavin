import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

/** Inline prose marks: emphasis, strong importance and inline quotations. */

export interface EmProps {
  children: ReactNode;
  className?: string;
}

export function Em({ children, className }: EmProps) {
  return <em className={cn("italic text-fg", className)}>{children}</em>;
}

export interface StrongProps {
  children: ReactNode;
  className?: string;
}

export function Strong({ children, className }: StrongProps) {
  return <strong className={cn("font-semibold text-fg", className)}>{children}</strong>;
}

export interface QuoteProps {
  children: ReactNode;
  className?: string;
}

export function Quote({ children, className }: QuoteProps) {
  return (
    <span
      className={cn(
        "italic text-fg before:content-['“'] after:content-['”']",
        className,
      )}
    >
      {children}
    </span>
  );
}

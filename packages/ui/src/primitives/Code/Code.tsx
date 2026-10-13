import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface CodeProps {
  children: ReactNode;
  className?: string;
}

export function Code({ children, className }: CodeProps) {
  return (
    <code
      className={cn(
        "rounded bg-surface-hover px-1.5 py-0.5 font-mono text-[0.85em] text-fg",
        className,
      )}
    >
      {children}
    </code>
  );
}

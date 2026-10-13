import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface KbdProps {
  children: ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "rounded-[var(--radius-lg)] border border-hairline border-b-2 bg-surface px-1.5 py-0.5 font-mono text-xs text-fg-muted",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface TopBarProps {
  /** TopBar header content. */
  children?: ReactNode;
  className?: string;
}

export function TopBar({ children, className }: TopBarProps) {
  return (
    <header className={cn("flex items-center min-h-14 border-b border-hairline bg-surface px-4 py-2", className)}>
      {children}
    </header>
  );
}

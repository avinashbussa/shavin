import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface BlockquoteProps {
  children: ReactNode;
  className?: string;
  cite?: string;
}

export function Blockquote({
  children,
  className,
  cite,
}: BlockquoteProps) {
  return (
    <blockquote
      cite={cite}
      className={cn("border-l-2 border-accent pl-4 text-fg-muted", className)}
    >
      {children}
    </blockquote>
  );
}

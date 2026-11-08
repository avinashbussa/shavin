"use client";
import { cn } from "../../lib/cn";
import { ChevronRight } from "lucide-react";
import { Text } from "../Text";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface BreadcrumbsProps {
  /** Array of breadcrumb items ({ label, href, active }). */
  items: BreadcrumbItem[];
  /** Optional custom CSS class name. */
  className?: string;
}

export function Breadcrumbs({
  items,
  className,
}: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0 max-w-full overflow-hidden", className)}>
      {/* An ordered list keeps the trail's position and length available to screen readers. */}
      <ol className="flex items-center gap-1.5 text-xs text-fg-subtle select-none whitespace-nowrap min-w-0">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const current = item.active ?? isLast;
          return (
            <li key={item.label} className="flex items-center gap-1.5 min-w-0">
              {idx > 0 && <ChevronRight className="h-3 w-3 text-fg-muted/60 shrink-0" aria-hidden />}
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className="hover:text-fg transition font-medium cursor-pointer truncate max-w-[140px] shrink-0 text-xs"
                >
                  {item.label}
                </a>
              ) : (
                <Text
                  as="span"
                  size="xs"
                  color={isLast ? "default" : "subtle"}
                  weight={isLast ? "semibold" : "medium"}
                  className="truncate max-w-[160px] shrink-0"
                  aria-current={current ? "page" : undefined}
                >
                  {item.label}
                </Text>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

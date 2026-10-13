"use client";
import React from "react";
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
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-xs text-fg-subtle select-none whitespace-nowrap overflow-hidden max-w-full min-w-0", className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={item.label}>
            {idx > 0 && <ChevronRight className="h-3 w-3 text-fg-muted/60 shrink-0" />}
            {item.href && !isLast ? (
              <a
                href={item.href}
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
              >
                {item.label}
              </Text>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

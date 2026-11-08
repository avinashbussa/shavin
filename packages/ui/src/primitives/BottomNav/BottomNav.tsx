"use client";
import React, { type ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface BottomNavItem {
  href: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
  badge?: string | number;
}

export interface BottomNavProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  /** List of 3 to 5 mobile tab destinations ({ href, label, icon, active, badge }). */
  items: BottomNavItem[];
  /** Callback fired when a mobile tab destination is clicked. */
  onSelect?: (href: string) => void;
  /** Accessible navigation ARIA label. Default 'Bottom navigation'. */
  ariaLabel?: string;
}

export function BottomNav({
  items,
  onSelect,
  className,
  ariaLabel = "Bottom navigation",
  ...props
}: BottomNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-around border-t border-hairline bg-surface/95 px-2 backdrop-blur-md shadow-panel",
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const isActive = item.active;
        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            onClick={(e) => {
              if (onSelect) {
                e.preventDefault();
                onSelect(item.href);
              }
            }}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition cursor-pointer select-none",
              isActive
                ? "text-accent font-semibold"
                : "text-fg-muted hover:text-fg"
            )}
          >
            {item.icon && (
              <span className={cn("relative flex h-5 w-5 items-center justify-center shrink-0", isActive ? "text-accent" : "text-fg-subtle")}>
                <span aria-hidden="true" className="contents">{item.icon}</span>
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-fg">
                    {item.badge}
                  </span>
                )}
              </span>
            )}
            <span className="truncate max-w-[72px] text-center">{item.label}</span>
            {isActive && (
              <span aria-hidden="true" className="absolute bottom-0 h-0.5 w-6 rounded-full bg-accent" />
            )}
          </a>
        );
      })}
    </nav>
  );
}

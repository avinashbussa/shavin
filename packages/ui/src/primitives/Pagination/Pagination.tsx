"use client";
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const paginationVariants = cva("flex items-center gap-1.5", {
  variants: {
    variant: {
      numeric: "justify-center",
      simple: "justify-between",
      cards: "grid grid-cols-1 sm:grid-cols-2 gap-4 w-full",
    },
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    variant: "numeric",
    size: "md",
  },
});

export interface PaginationProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof paginationVariants> {
  /** Current active page (1-indexed). Default 1. */
  page?: number;
  /** Total number of pages. Default 1. */
  totalPages?: number;
  /** Callback fired when a page is selected. */
  onPageChange?: (page: number) => void;
  /** Custom label for previous button/link. Default "Previous". */
  prevLabel?: string;
  /** Custom label for next button/link. Default "Next" or "Up next". */
  nextLabel?: string;
  /** Title text for previous item (used in "cards" variant). */
  prevTitle?: string;
  /** Title text for next item (used in "cards" variant). */
  nextTitle?: string;
  /** Href link for previous card/button (optional, enables link mode). */
  prevHref?: string;
  /** Href link for next card/button (optional, enables link mode). */
  nextHref?: string;
}

export function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  variant = "numeric",
  size,
  prevLabel = "Previous",
  nextLabel = "Next",
  prevTitle,
  nextTitle,
  prevHref,
  nextHref,
  className,
  ...props
}: PaginationProps) {
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  const pages: (number | string)[] = React.useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }
    if (page >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  }, [page, totalPages]);

  if (variant === "cards") {
    return (
      <nav aria-label="Pagination" className={cn(paginationVariants({ variant, size }), className)} {...props}>
        {prevTitle ? (
          <a
            href={prevHref || "#"}
            onClick={(e) => {
              if (onPageChange && !prevHref) {
                e.preventDefault();
                onPageChange(page - 1);
              }
            }}
            className="group block rounded-[var(--radius-panel)] border border-hairline bg-surface-hover/60 hover:bg-surface-hover hover:border-hairline-strong p-4 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-fg-subtle group-hover:text-accent transition">
              <span aria-hidden>←</span>
              <span>{prevLabel}</span>
            </div>
            <div className="mt-1 text-base font-semibold text-fg group-hover:text-accent transition">
              {prevTitle}
            </div>
          </a>
        ) : (
          <div />
        )}

        {nextTitle ? (
          <a
            href={nextHref || "#"}
            onClick={(e) => {
              if (onPageChange && !nextHref) {
                e.preventDefault();
                onPageChange(page + 1);
              }
            }}
            className="group block rounded-[var(--radius-panel)] border border-hairline bg-surface-hover/60 hover:bg-surface-hover hover:border-hairline-strong p-4 transition cursor-pointer sm:text-right"
          >
            <div className="flex items-center gap-1.5 justify-end text-xs font-medium text-fg-subtle group-hover:text-accent transition sm:justify-end">
              <span>{nextLabel === "Next" ? "Up next" : nextLabel}</span>
              <span aria-hidden>→</span>
            </div>
            <div className="mt-1 text-base font-semibold text-fg group-hover:text-accent transition">
              {nextTitle}
            </div>
          </a>
        ) : (
          <div />
        )}
      </nav>
    );
  }

  if (variant === "simple") {
    return (
      <nav aria-label="Pagination" className={cn(paginationVariants({ variant, size }), className)} {...props}>
        <button
          type="button"
          disabled={isFirst}
          onClick={() => onPageChange?.(page - 1)}
          aria-label="Previous Page"
          className="flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-fg transition hover:bg-surface-hover disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span aria-hidden>←</span>
          <span>{prevLabel}</span>
        </button>

        <span className="text-xs font-medium text-fg-muted">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          disabled={isLast}
          onClick={() => onPageChange?.(page + 1)}
          aria-label="Next Page"
          className="flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-fg transition hover:bg-surface-hover disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span>{nextLabel}</span>
          <span aria-hidden>→</span>
        </button>
      </nav>
    );
  }

  return (
    <nav aria-label="Pagination" className={cn(paginationVariants({ variant, size }), className)} {...props}>
      <button
        type="button"
        disabled={isFirst}
        onClick={() => onPageChange?.(page - 1)}
        aria-label="Previous Page"
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] border border-hairline bg-surface text-fg transition hover:bg-surface-hover disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        <span aria-hidden>←</span>
      </button>

      {pages.map((p, idx) => {
        if (typeof p === "string") {
          return (
            <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-fg-subtle select-none">
              {p}
            </span>
          );
        }
        const isActive = p === page;
        return (
          <button
            key={p}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onPageChange?.(p)}
            className={cn(
              "flex h-8 min-w-[32px] items-center justify-center rounded-[var(--radius-lg)] px-2 text-xs font-medium transition cursor-pointer",
              isActive
                ? "bg-accent text-accent-fg font-semibold shadow-card"
                : "border border-hairline bg-surface text-fg hover:bg-surface-hover"
            )}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        disabled={isLast}
        onClick={() => onPageChange?.(page + 1)}
        aria-label="Next Page"
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] border border-hairline bg-surface text-fg transition hover:bg-surface-hover disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        <span aria-hidden>→</span>
      </button>
    </nav>
  );
}

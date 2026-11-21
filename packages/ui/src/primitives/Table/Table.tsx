"use client";
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { useScrollEdges } from "../../lib/scroll-edges";

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Accessible name of the scrolling region, announced once the table is wider than its container. Defaults to the table's own `aria-label` or "Scrollable table". */
  scrollLabel?: string;
}

/**
 * A table that never clips. It scrolls sideways inside its own container when it is wider than the space it is given,
 * fades the edge that still has content (so cut-off values read as "scroll for more"), and becomes keyboard focusable
 * only while it scrolls. Keep the first column short, and do not wrap a Table in `overflow-hidden`.
 */
export function Table({ className, children, scrollLabel, ...props }: TableProps) {
  const { ref, scrollable, fadeStyle } = useScrollEdges<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="w-full overflow-x-auto"
      style={fadeStyle}
      {...(scrollable ? { tabIndex: 0, role: "region", "aria-label": scrollLabel ?? props["aria-label"] ?? "Scrollable table" } : {})}
    >
      <table className={cn("w-full text-sm", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}

export function TableHeader({ className, ...props }: TableHeaderProps) {
  return <thead className={cn(className)} {...props} />;
}

export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, ...props }: TableBodyProps) {
  return <tbody className={cn("divide-y divide-hairline", className)} {...props} />;
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {}

export function TableRow({
  className,
  onClick,
  ...props
}: TableRowProps) {
  return (
    <tr
      className={cn(onClick && "cursor-pointer hover:bg-surface-hover transition", className)}
      onClick={onClick}
      {...props}
    />
  );
}

export interface TableColumnHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {}

export function TableColumnHeaderCell({
  className,
  ...props
}: TableColumnHeaderCellProps) {
  return (
    <th
      className={cn(
        "border-b border-hairline px-3 py-2 text-left text-xs uppercase tracking-wide text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {}

export function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td className={cn("border-b border-hairline px-3 py-2 text-fg", className)} {...props} />
  );
}

import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface TableProps extends HTMLAttributes<HTMLTableElement> {}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
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

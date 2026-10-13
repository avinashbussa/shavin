"use client";
import { useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface SortableProps<T> {
  /** Array of items to reorder. */
  items: T[];
  /** Callback fired when items are drag-reordered. */
  onReorder: (next: T[]) => void;
  /** Function returning unique key per item. */
  getKey: (item: T, index: number) => string | number;
  /** Render prop function for item row content. */
  children: (item: T, index: number) => ReactNode;
  /** Orientation mode: "vertical" (list), "horizontal" (row), or "grid". Default "vertical". */
  orientation?: "vertical" | "horizontal" | "grid";
  className?: string;
}

export function Sortable<T>({
  items,
  onReorder,
  getKey,
  children,
  orientation = "vertical",
  className,
}: SortableProps<T>) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onReorder(next);
  };

  const layout =
    orientation === "vertical"
      ? "flex flex-col gap-2"
      : orientation === "horizontal"
        ? "flex flex-row flex-wrap gap-2"
        : "grid grid-cols-2 gap-2 sm:grid-cols-3";

  return (
    <ul className={cn(layout, className)}>
      {items.map((item, i) => (
        <li
          key={getKey(item, i)}
          draggable
          onDragStart={() => setDrag(i)}
          onDragEnter={() => setOver(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (drag != null) move(drag, i);
            setDrag(null);
            setOver(null);
          }}
          onDragEnd={() => {
            setDrag(null);
            setOver(null);
          }}
          className={cn(
            "cursor-grab rounded-[var(--radius-lg)] transition active:cursor-grabbing",
            drag === i && "opacity-40",
            over === i && drag !== i && "ring-2 ring-accent",
          )}
        >
          {children(item, i)}
        </li>
      ))}
    </ul>
  );
}

export interface SortableHandleProps {
  className?: string;
}

export function SortableHandle({ className }: SortableHandleProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 shrink-0 cursor-grab text-fg-subtle active:cursor-grabbing", className)}
      fill="currentColor"
      aria-hidden
    >
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

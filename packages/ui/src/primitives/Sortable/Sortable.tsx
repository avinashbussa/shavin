"use client";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";
import { announce } from "../../lib/announce";

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
  /** Name of each item for screen-reader announcements. Defaults to its key. */
  getLabel?: (item: T, index: number) => string;
  /** Accessible name of the list. */
  "aria-label"?: string;
  className?: string;
}

type ItemCtx = {
  index: number;
  label: string;
  grabbed: boolean;
  instructionsId: string;
  onHandleKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  onHandleClick: () => void;
};
const SortableItemContext = createContext<ItemCtx | null>(null);

/**
 * Drag to reorder with the mouse, or with the keyboard through `SortableHandle`
 * (WCAG 2.1.1): Space or Enter picks an item up, the arrow keys move it, Space or
 * Enter drops it, Escape puts it back. Every step is announced.
 */
export function Sortable<T>({
  items,
  onReorder,
  getKey,
  children,
  orientation = "vertical",
  getLabel,
  "aria-label": ariaLabel,
  className,
}: SortableProps<T>) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  // Keyboard reorder: the picked-up item's key and the order to restore on Escape.
  const [grabbedKey, setGrabbedKey] = useState<string | number | null>(null);
  const snapshot = useRef<T[] | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const focusKey = useRef<string | number | null>(null);
  const instructionsId = useId();

  const labelOf = (item: T, i: number) => (getLabel ? getLabel(item, i) : String(getKey(item, i)));

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onReorder(next);
  };

  // Moving a keyed node can drop focus in some browsers: put it back on the handle.
  useEffect(() => {
    if (focusKey.current == null) return;
    const key = String(focusKey.current);
    focusKey.current = null;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-sortable-key="${CSS.escape(key)}"] [data-sortable-handle]`)
      ?.focus();
  }, [items]);

  const toggleGrab = (i: number) => {
    const item = items[i];
    const key = getKey(item, i);
    const label = labelOf(item, i);
    if (grabbedKey === key) {
      setGrabbedKey(null);
      snapshot.current = null;
      announce(`${label} dropped at position ${i + 1} of ${items.length}.`);
    } else {
      setGrabbedKey(key);
      snapshot.current = items;
      announce(`${label} picked up, position ${i + 1} of ${items.length}. Use the arrow keys to move, Space to drop, Escape to cancel.`);
    }
  };

  const handleKeyDown = (i: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const item = items[i];
    const key = getKey(item, i);
    const label = labelOf(item, i);
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggleGrab(i);
      return;
    }
    if (grabbedKey !== key) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (snapshot.current) {
        focusKey.current = key;
        onReorder(snapshot.current);
      }
      snapshot.current = null;
      setGrabbedKey(null);
      announce(`Reorder cancelled. ${label} returned to its starting position.`);
      return;
    }
    const step = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const to = i + step;
    if (to < 0 || to >= items.length) return;
    focusKey.current = key;
    move(i, to);
    announce(`${label} moved to position ${to + 1} of ${items.length}.`);
  };

  const layout =
    orientation === "vertical"
      ? "flex flex-col gap-2"
      : orientation === "horizontal"
        ? "flex flex-row flex-wrap gap-2"
        : "grid grid-cols-2 gap-2 sm:grid-cols-3";

  return (
    <>
      <span id={instructionsId} className="sr-only">
        Press Space or Enter to pick up. Use the arrow keys to move, Space to drop, Escape to cancel.
      </span>
      <ul ref={listRef} aria-label={ariaLabel} className={cn(layout, className)}>
        {items.map((item, i) => {
          const key = getKey(item, i);
          const grabbed = grabbedKey === key;
          return (
            <li
              key={key}
              data-sortable-key={String(key)}
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
                grabbed && "ring-2 ring-accent shadow-panel",
              )}
            >
              <SortableItemContext.Provider
                value={{
                  index: i,
                  label: labelOf(item, i),
                  grabbed,
                  instructionsId,
                  onHandleKeyDown: handleKeyDown(i),
                  onHandleClick: () => toggleGrab(i),
                }}
              >
                {children(item, i)}
              </SortableItemContext.Provider>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export interface SortableHandleProps {
  className?: string;
}

/** Grip for a Sortable item: a drag affordance for the pointer and the keyboard control for reordering. */
export function SortableHandle({ className }: SortableHandleProps) {
  const ctx = useContext(SortableItemContext);
  const icon = (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 shrink-0 cursor-grab text-fg-subtle active:cursor-grabbing", !ctx && className)}
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
  if (!ctx) return icon;
  return (
    <button
      type="button"
      data-sortable-handle
      aria-label={`Reorder ${ctx.label}`}
      aria-describedby={ctx.instructionsId}
      aria-pressed={ctx.grabbed}
      onKeyDown={ctx.onHandleKeyDown}
      onClick={(e) => {
        // A pointer click picks up or drops too, so a single tap works with the keys.
        if (e.detail > 0) ctx.onHandleClick();
      }}
      className={cn("-m-1 flex shrink-0 items-center justify-center rounded-[var(--radius-lg)] p-1", className)}
    >
      {icon}
    </button>
  );
}

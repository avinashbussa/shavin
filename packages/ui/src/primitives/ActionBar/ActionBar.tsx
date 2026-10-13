"use client";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "../Popover";
import { cn } from "../../lib/cn";

export type ActionBarItem = {
  value: string;
  label: string;
  keywords?: string[];
  icon?: ReactNode;
};

export type ActionBarGroup = {
  key: string;
  label: string;
  icon?: ReactNode;
  items: ActionBarItem[];
};

export interface ActionBarProps {
  /** Array of action groups ({ key, label, icon, items }). */
  groups: ActionBarGroup[];
  /** Callback fired when an action option is selected (groupKey, value). */
  onAction?: (groupKey: string, value: string) => void;
  /** @deprecated use onAction instead */
  onInsert?: (groupKey: string, value: string) => void;
  /** Optional custom CSS class name. */
  className?: string;
  /** Accessible toolbar label string. Default 'Action Bar'. */
  ariaLabel?: string;
}

export function ActionBar({ groups, onAction, onInsert, className, ariaLabel = "Action Bar" }: ActionBarProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const handleAction = (groupKey: string, value: string) => {
    if (onAction) onAction(groupKey, value);
    if (onInsert) onInsert(groupKey, value);
  };

  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-[var(--radius-panel)] border border-hairline bg-surface p-1 shadow-panel",
        className,
      )}
    >
      {groups.map((group) => (
        <ActionBarGroupTrigger
          key={group.key}
          group={group}
          open={openKey === group.key}
          onOpenChange={(next) => setOpenKey(next ? group.key : null)}
          onAction={handleAction}
        />
      ))}
    </div>
  );
}

function ActionBarGroupTrigger({
  group,
  open,
  onOpenChange,
  onAction,
}: {
  group: ActionBarGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (groupKey: string, value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return group.items;
    return group.items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.keywords ?? []).some((k) => k.toLowerCase().includes(q)),
    );
  }, [group.items, query]);

  function handleOpenChange(next: boolean) {
    if (!next) setQuery("");
    onOpenChange(next);
  }

  function triggerAction(value: string) {
    onAction(group.key, value);
    setQuery("");
    onOpenChange(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[0]) triggerAction(filtered[0].value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleOpenChange(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={group.label}
          className={cn(
            "flex items-center gap-1.5 rounded-[var(--radius-lg)] px-3 py-1.5 text-sm text-fg-muted outline-none transition hover:bg-surface-hover hover:text-fg active:scale-[0.97] cursor-pointer",
            open && "bg-surface-hover text-fg",
          )}
        >
          {group.icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center">{group.icon}</span>}
          <span className="whitespace-nowrap">{group.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-64 p-2"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search…"
          aria-label={`Search ${group.label}`}
          className="mb-2 w-full rounded-[var(--radius-lg)] border border-hairline bg-surface-hover px-2.5 py-1.5 text-sm text-fg outline-none placeholder:text-fg-subtle focus:border-hairline-strong"
        />
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-2.5 py-6 text-center text-sm text-fg-subtle">No matches</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => triggerAction(item.value)}
                className="flex w-full items-center gap-2 rounded-[var(--radius-lg)] px-2.5 py-1.5 text-left text-sm text-fg-muted transition hover:bg-surface-hover hover:text-fg cursor-pointer"
              >
                {item.icon && (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">{item.icon}</span>
                )}
                <span className="truncate">{item.label}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

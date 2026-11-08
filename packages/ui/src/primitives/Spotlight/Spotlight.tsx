"use client";
import React, { useId, useRef, type ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { cn } from "../../lib/cn";
import { useReturnFocus } from "../../lib/useReturnFocus";
import { Kbd } from "../Kbd/Kbd";

export interface SpotlightProps {
  /** Whether the spotlight dialog is open. */
  open: boolean;
  /** Callback fired when open state changes (e.g. via Escape key or backdrop click). */
  onOpenChange: (open: boolean) => void;
  /** Search query value. */
  query: string;
  /** Callback fired when search query changes. */
  onQueryChange: (query: string) => void;
  /** Callback fired on keyboard input (e.g. ArrowUp, ArrowDown, Enter navigation). */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Input placeholder text. */
  placeholder?: string;
  /** Accessible name of the dialog and its search field. Default "Search". */
  title?: string;
  /**
   * id of the highlighted result. When set, the field becomes an ARIA combobox and the
   * results area a listbox: give each result `role="option"`, an `id` and `aria-selected`.
   */
  activeOptionId?: string;
  /** Number of results, announced to screen readers as it changes. */
  resultCount?: number;
  /** Content rendered below input (e.g. search suggestions, grouped items). */
  children?: ReactNode;
  /** Optional custom footer bar (defaults to standard keyboard shortcut hints). */
  footer?: ReactNode;
  /** Additional container className overrides. */
  className?: string;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Spotlight({
  open,
  onOpenChange,
  query,
  onQueryChange,
  onKeyDown,
  placeholder = "Search components, documentation, actions...",
  title = "Search",
  activeOptionId,
  resultCount,
  children,
  footer,
  className,
}: SpotlightProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsId = useId();
  const returnFocus = useReturnFocus(open);
  const combobox = activeOptionId !== undefined;

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="animate-overlay fixed inset-0 z-[100] bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-opacity" />
        <RadixDialog.Content
          className="animate-modal-wrap fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[14vh] px-4 pointer-events-none"
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={returnFocus}
          onClick={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false);
          }}
        >
          <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>
          <div
            data-panel
            className={cn(
              "pointer-events-auto flex flex-col w-full max-w-xl max-h-[72vh] overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-surface shadow-modal focus:outline-none animate-rise",
              className,
            )}
          >
            <div className="flex items-center gap-3 border-b border-hairline px-4 py-3 shrink-0">
              <SearchIcon className="h-4 w-4 shrink-0 text-fg-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                aria-label={title}
                {...(combobox && {
                  role: "combobox",
                  "aria-expanded": true,
                  "aria-controls": resultsId,
                  "aria-autocomplete": "list" as const,
                  "aria-activedescendant": activeOptionId || undefined,
                })}
                className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    onQueryChange("");
                    inputRef.current?.focus();
                  }}
                  className="rounded-[var(--radius-lg)] p-1 text-fg-subtle hover:text-fg transition cursor-pointer"
                  aria-label="Clear query"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              ) : (
                <Kbd className="shrink-0 text-[10px]">ESC</Kbd>
              )}
            </div>

            <div
              id={resultsId}
              {...(combobox && { role: "listbox", "aria-label": title })}
              className="flex-1 min-h-0 overflow-y-auto"
            >
              {children}
            </div>
            {resultCount !== undefined && (
              <div role="status" className="sr-only">
                {resultCount === 0 ? "No results" : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-hairline bg-surface/50 px-4 py-2 text-xs text-fg-subtle shrink-0">
              {footer ?? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Kbd className="text-[10px] px-1 py-0"><span aria-hidden="true">↑</span><span className="sr-only">Up arrow</span></Kbd>
                      <Kbd className="text-[10px] px-1 py-0"><span aria-hidden="true">↓</span><span className="sr-only">Down arrow</span></Kbd>
                      <span>Navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Kbd className="text-[10px] px-1 py-0"><span aria-hidden="true">↵</span><span className="sr-only">Enter</span></Kbd>
                      <span>Select</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Kbd className="text-[10px] px-1 py-0">esc</Kbd>
                    <span>Close</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

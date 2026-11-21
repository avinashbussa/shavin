"use client";
import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Finding } from "../lib/inspector/schema";
import { Row } from "../primitives/Row";
import { Button } from "../primitives/Button";
import { SegmentedControl, SegmentedControlItem } from "../primitives/SegmentedControl";
import { cn } from "../lib/cn";
import { STR } from "./strings";
import { elementLabel, rowText } from "./targets";
import { ruleTitle } from "./strings";
import type { RowState } from "./journalState";

export type ListFilter = "all" | "errors" | "warnings" | "ignored";

export interface IssuesListProps {
  findings: readonly Finding[];
  ignored: ReadonlySet<string>;
  selectedId: string | null;
  /** Row hover or keyboard focus: the matching element is outlined on the page. */
  onActive: (id: string | null) => void;
  onOpen: (id: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  /** One line about what was sent: "2 waiting · 1 with the agent · 4 done" (empty when nothing was sent). */
  strip?: string;
  /** Phone: rows and filter chips get a 44 px hit area (the look stays). */
  touch?: boolean;
  /** Journal wording for a row, once its finding was sent. */
  rowState?: (id: string) => RowState | null;
  /** How many errors "Send N errors" would send (ignored ones excluded); the button is hidden at 0. */
  errorsToSend?: number;
  onSendErrors?: () => void;
  style?: React.CSSProperties;
}

const GROUP_ABOVE = 10;

function dotClass(f: Finding, isIgnored: boolean): string {
  if (isIgnored) return "bg-fg-subtle/60";
  // Error is a filled dot and warning a ring, the same as the markers on the page.
  return f.severity === "error" ? "bg-danger" : "border-[1.5px] border-warning";
}

/**
 * The findings list: a dot and the violation text per row, nothing else. Filter chips count only findings that
 * count (ignored ones are listed last, gray, and never counted). Arrow keys move between rows, Enter opens the
 * finding beside its element.
 */
export function IssuesList({ findings, ignored, selectedId, onActive, onOpen, onUndo, canUndo, strip, rowState, errorsToSend = 0, onSendErrors, style, touch = false }: IssuesListProps): React.JSX.Element {
  const [filter, setFilter] = React.useState<ListFilter>("all");
  const active = findings.filter((f) => !ignored.has(f.id));
  const gray = findings.filter((f) => ignored.has(f.id));
  const errors = active.filter((f) => f.severity === "error");
  const warnings = active.filter((f) => f.severity === "warning");

  const shown: Finding[] =
    filter === "errors" ? errors : filter === "warnings" ? warnings : filter === "ignored" ? gray : [...active, ...gray];

  const groups = React.useMemo(() => {
    if (shown.length <= GROUP_ABOVE || filter === "ignored") return null;
    // Grouped by the short rule title, so rules that say the same thing, such as the token checks, share a group.
    const map = new Map<string, Finding[]>();
    for (const f of shown) {
      const key = ruleTitle(f.rule, f.message);
      map.set(key, [...(map.get(key) ?? []), f]);
    }
    return [...map.entries()].map(([rule, list]) => ({
      rule,
      // Ignored rows sort to the end of their group; counts never include them.
      list: [...list.filter((f) => !ignored.has(f.id)), ...list.filter((f) => ignored.has(f.id))],
      count: list.filter((f) => !ignored.has(f.id)).length,
    }));
  }, [shown, filter, ignored]);

  // Which groups are open: the first one starts open. Keyed by title so it survives a rescan.
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});
  const isOpen = (title: string, index: number) => openGroups[title] ?? index === 0;

  // When the same sentence would repeat down the list (a group header already says it, or several rows share it), a row
  // names its element instead; rows whose sentence is unique keep it.
  const repeated = React.useMemo(() => {
    const seen = new Map<string, number>();
    for (const f of shown) seen.set(f.message, (seen.get(f.message) ?? 0) + 1);
    return new Set([...seen].filter(([, n]) => n > 1).map(([m]) => m));
  }, [shown]);
  const rowLabel = (f: Finding) => (groups || repeated.has(f.message) ? elementLabel(f) : rowText(f));

  const listRef = React.useRef<HTMLDivElement>(null);
  const [focusId, setFocusId] = React.useState<string | null>(null);
  const flat = groups ? groups.flatMap((g) => g.list) : shown;
  const currentId = focusId && flat.some((f) => f.id === focusId) ? focusId : flat[0]?.id ?? null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = flat.findIndex((f) => f.id === currentId);
    const go = (n: number) => {
      const next = flat[Math.max(0, Math.min(flat.length - 1, n))];
      if (!next) return;
      setFocusId(next.id);
      onActive(next.id);
      listRef.current?.querySelector<HTMLElement>(`[data-finding="${next.id}"]`)?.focus();
    };
    if (e.key === "ArrowDown") {
      e.preventDefault();
      go(i + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      go(i - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0);
    } else if (e.key === "End") {
      e.preventDefault();
      go(flat.length - 1);
    }
  };

  const renderRow = (f: Finding) => {
    const isIgnored = ignored.has(f.id);
    const sent = isIgnored ? null : rowState?.(f.id) ?? null;
    return (
      <Row
        key={f.id}
        as="div"
        role="option"
        aria-selected={selectedId === f.id}
        data-finding={f.id}
        tabIndex={f.id === currentId ? 0 : -1}
        active={selectedId === f.id}
        title={`${f.message} (${f.selector})`}
        leading={<span aria-hidden="true" className={cn("h-2 w-2 rounded-full", dotClass(f, isIgnored))} />}
        // The Row primitive truncates its text; in this list a finding's words wrap instead of ending in an ellipsis.
        className={cn("cursor-pointer rounded-[var(--radius-panel-p2,var(--radius-lg))] py-1.5 [&_.truncate]:overflow-visible [&_.truncate]:whitespace-normal [&_.truncate]:break-words [&_.truncate]:[text-overflow:clip]", isIgnored && "opacity-60", touch && "min-h-[44px]")}
        onClick={() => onOpen(f.id)}
        onMouseEnter={() => onActive(f.id)}
        onMouseLeave={() => onActive(null)}
        onFocus={() => {
          setFocusId(f.id);
          onActive(f.id);
        }}
        onBlur={() => onActive(null)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(f.id);
          }
        }}
      >
        <span className="sr-only">{isIgnored ? "Ignored. " : f.severity === "error" ? "Error. " : "Warning. "}{groups || repeated.has(f.message) ? `${f.message} ` : ""}</span>
        {rowLabel(f)}
        {sent ? <span className="block break-words text-[11px] text-fg-muted">{sent.text}</span> : null}
      </Row>
    );
  };

  const chip = (value: ListFilter, label: string) => <SegmentedControlItem key={value} value={value} label={label} />;

  return (
    <section
      aria-label="Findings"
      data-shavin-list=""
      className="flex max-h-full w-80 flex-col rounded-[var(--radius-panel)] border border-hairline bg-elevated p-2 text-fg shadow-panel"
      style={{ pointerEvents: "auto", ...style }}
    >
      <div className="pb-2">
        <SegmentedControl className={touch ? "[&_[role=radio]]:relative [&_[role=radio]]:before:absolute [&_[role=radio]]:before:inset-x-0 [&_[role=radio]]:before:-inset-y-3 [&_[role=radio]]:before:content-['']" : undefined} size="sm" variant="subtle" value={filter} onValueChange={(v) => v && setFilter(v as ListFilter)} aria-label="Filter findings">
          {chip("all", `All ${active.length}`)}
          {chip("errors", `Errors ${errors.length}`)}
          {chip("warnings", `Warnings ${warnings.length}`)}
          {gray.length > 0 ? chip("ignored", `Ignored ${gray.length}`) : null}
        </SegmentedControl>
      </div>
      <div ref={listRef} role="listbox" aria-label="Findings list" onKeyDown={onKeyDown} className="min-h-0 flex-1 overflow-y-auto">
        {flat.length === 0 ? (
          <p className="px-2.5 py-3 text-fg-muted">{STR.emptyList}</p>
        ) : groups ? (
          groups.map((g, gi) => (
            <details
              key={g.rule}
              open={isOpen(g.rule, gi)}
              onToggle={(e) => {
                const open = (e.currentTarget as HTMLDetailsElement).open;
                setOpenGroups((prev) => (prev[g.rule] === open ? prev : { ...prev, [g.rule]: open }));
              }}
              className="pb-1"
            >
              <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-[var(--radius-lg)] px-2 py-1 text-xs text-fg-muted hover:bg-fg/[0.05] [&::-webkit-details-marker]:hidden">
                {isOpen(g.rule, gi) ? <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
                <span className="min-w-0">{g.rule} · {g.count}</span>
              </summary>
              {g.list.map(renderRow)}
            </details>
          ))
        ) : (
          shown.map(renderRow)
        )}
      </div>
      {strip ? (
        <p className="mt-1 truncate whitespace-nowrap border-t border-hairline px-2.5 pt-2 text-xs text-fg-muted" role="status" data-shavin-strip="">
          {strip}
        </p>
      ) : null}
      {errorsToSend > 0 || gray.length > 0 || canUndo ? (
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-hairline px-1 pt-2 text-xs text-fg-muted">
          {errorsToSend > 0 ? (
            <Button variant="ghost" size="sm" onClick={onSendErrors}>
              Send {errorsToSend} error{errorsToSend === 1 ? "" : "s"}
            </Button>
          ) : (
            <span />
          )}
          {gray.length > 0 || canUndo ? (
            <span className="flex items-center gap-1">
              <span>{gray.length} ignored</span>
              <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
                Undo
              </Button>
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

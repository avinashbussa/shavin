"use client";
import * as React from "react";
import { countFindings, makeFinding, type Finding } from "../lib/inspector/schema";
import { contextLabel, describeElement, uniqueSelector } from "../lib/inspector/selector";
import { FindingPopover, type SendOutcome } from "./FindingPopover";
import { Highlight } from "./Highlight";
import { InspectorRoot } from "./InspectorRoot";
import { IssuesLayer } from "./IssuesLayer";
import { IssuesList } from "./IssuesList";
import { Toolbar, type PanelId, type ToolId } from "./Toolbar";
import { SettingsPanel } from "./SettingsPanel";
import { reserveSpace, useSettings } from "./settings";
import { ThemePanel } from "./theme/ThemePanel";
import type { ThemeController } from "./theme/useThemeController";
import { avoidAnchor, dockStyle, loadBarPrefs, panelInsets, saveBarPrefs, type Anchor } from "./barPlacement";
import { copyText, currentTabId, useNow } from "./env";
import { clearIgnored, emptyIgnored, ignore, loadIgnored, restore, saveIgnored, undo, type IgnoredState } from "./ignored";
import { readJournal, sendFindings, withdrawFinding, type JournalEntry, type JournalRead } from "./journalClient";
import { useTimeouts } from "./useTimeouts";
import { RESCAN_WINDOW_MS, countsFor, rowState, stripSummary } from "./journalState";
import { controlsScheme, usePageScheme } from "./scheme";
import { STR } from "./strings";
import { buildPrompt, userFindingInput } from "./prompt";
import { isInspectorElement, useSelectTool, walk } from "./useSelectTool";
import { useTrackedRect } from "./useTrackedRect";
import { DOCK_H, SHEET_GAP, sheetStyle, usePhone } from "./usePhone";
import { resolveTarget } from "./targets";

/** Fired on `window` whenever the ignored set changes, so the audit can re-send its counts. */
export const IGNORED_EVENT = "shavin-inspector-ignored";
/** Fired on `window` when the inspector wants a fresh scan now (an agent marked something done). */
export const RESCAN_EVENT = "shavin-inspector-rescan";

export interface InspectorProps {
  /** All findings of the last scan, ignored ones included. */
  findings: readonly Finding[];
  /** Port of the local bridge, when it is not the default. */
  bridgePort?: number;
  /** Where the bar starts when this browser has no saved position (the `position` prop of ShavinDevTools). */
  position?: Anchor;
  /** The theme controller the Theme panel drives (one instance, shared with the legacy panel). */
  theme?: ThemeController;
  /** Style for the menus the Theme controls open. */
  themeStyle?: React.CSSProperties;
}

const isTyping = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
};

/** Ignored ids in React state, mirrored to localStorage, with Undo history for this page view. */
export function useIgnored() {
  const [state, setState] = React.useState<IgnoredState>(() => emptyIgnored(loadIgnored()));
  const commit = React.useCallback((next: IgnoredState) => {
    setState(next);
    saveIgnored(next.ids);
    window.dispatchEvent(new Event(IGNORED_EVENT));
  }, []);
  return {
    state,
    ignore: (id: string) => commit(ignore(state, id)),
    restore: (id: string) => commit(restore(state, id)),
    undo: () => commit(undo(state).state),
    clear: () => commit(clearIgnored()),
  };
}

const SEV = { error: 0, warning: 1 } as const;

export function Inspector({ findings, bridgePort, theme, themeStyle, position }: InspectorProps): React.JSX.Element {
  const [tool, setTool] = React.useState<ToolId | null>(null);
  const [settings, setSettings] = useSettings();
  const phone = usePhone();
  // Panels open next to whichever tool is on; the latest opened is the first to close on Esc.
  const [panelOrder, setPanelOrder] = React.useState<PanelId[]>([]);
  const panels = React.useMemo(() => new Set(panelOrder), [panelOrder]);
  const [bar, setBar] = React.useState(() => loadBarPrefs(position));
  const dockH = phone && !bar.collapsed ? DOCK_H : 0;
  const setAnchor = React.useCallback((anchor: Anchor) => setBar((b) => ({ ...b, anchor })), []);
  // Reserve space: pad the page for the bar while the switch is on; the page's own padding comes back exactly.
  React.useEffect(() => {
    if (!settings.reserveSpace) return;
    return reserveSpace(bar.anchor);
  }, [settings.reserveSpace, bar.anchor]);
  // Where focus was before it went into the bar: closing the bar gives it back.
  const returnFocus = React.useRef<HTMLElement | null>(null);
  const setCollapsed = React.useCallback((collapsed: boolean) => {
    setBar((b) => ({ ...b, collapsed }));
    if (collapsed) {
      const el = returnFocus.current;
      returnFocus.current = null;
      if (el && el.isConnected) el.focus();
    }
  }, []);
  React.useEffect(() => saveBarPrefs(bar), [bar]);
  const [selected, setSelected] = React.useState<Element | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [pageFindingId, setPageFindingId] = React.useState<string | null>(null);
  const [popoverOpen, setPopoverState] = React.useState(false);
  // The Esc ladder reads this ref, so two quick presses never see a stale "open".
  const popoverRef = React.useRef(false);
  const setPopoverOpen = React.useCallback((open: boolean) => {
    popoverRef.current = open;
    setPopoverState(open);
  }, []);
  // On a phone the sheet holds one thing at a time (list, Theme or Settings): opening one closes the others.
  const togglePanel = React.useCallback(
    (id: PanelId) => {
      if (phone) {
        setPanelOrder((o) => (o.includes(id) ? [] : [id]));
        setTool((t) => (t === "issues" ? null : t));
        setPopoverOpen(false);
        return;
      }
      setPanelOrder((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
    },
    [phone, setPopoverOpen],
  );
  const [pageIndex, setPageIndex] = React.useState(0);
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [listAside, setListAside] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [announce, setAnnounce] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [journal, setJournal] = React.useState<JournalRead | null>(null);
  const [sentIds, setSentIds] = React.useState<ReadonlySet<string>>(new Set());
  const ig = useIgnored();
  // The bar steps out of the way of the selected element; the anchor the person chose is kept and comes back.
  const selectedRect = useTrackedRect(selected);
  const effAnchor = avoidAnchor(bar.anchor, selectedRect ? { x: selectedRect.x, y: selectedRect.y, w: selectedRect.w, h: selectedRect.h } : null, typeof window === "undefined" ? 1280 : window.innerWidth, typeof window === "undefined" ? 800 : window.innerHeight, bar.collapsed ? 40 : 300, 40);
  const page = usePageScheme();
  const scheme = controlsScheme(settings.scheme, page);
  const tabId = React.useMemo(() => currentTabId(), []);

  const later = useTimeouts();
  const say = React.useCallback((text: string) => {
    setNotice(text);
    later(() => setNotice((n) => (n === text ? "" : n)), 5000);
  }, [later]);

  const select = React.useCallback((el: Element | null, id: string | null = null) => {
    setSelected(el);
    setSelectedId(id);
    setPageFindingId(null);
    setPageIndex(0);
    if (el) {
      const r = el.getBoundingClientRect();
      setAnnounce(`Selected ${describeElement(el)}, ${Math.round(r.width)} by ${Math.round(r.height)}`);
    } else setAnnounce("");
  }, []);

  const { hovered } = useSelectTool({
    active: tool === "select",
    onSelect: (el) => {
      select(el);
      setPopoverOpen(true);
    },
  });

  const entryByIdRef = React.useRef<Map<string, JournalEntry>>(new Map());

  // ---- findings on the selected element (errors first), for the pager ----
  const elementFindings = React.useMemo(() => {
    if (pageFindingId) {
      const f = findings.find((x) => x.id === pageFindingId);
      return f ? [f] : [];
    }
    if (!selected) return [];
    const mine = findings.filter((f) => resolveTarget(f) === selected);
    const rank = (f: Finding) => (ig.state.ids.has(f.id) ? 2 : SEV[f.severity]);
    return mine.map((f, i) => ({ f, i })).sort((a, b) => rank(a.f) - rank(b.f) || a.i - b.i).map((x) => x.f);
  }, [findings, selected, pageFindingId, ig.state.ids]);

  const noteKey = pageFindingId ?? (selected ? uniqueSelector(selected) : "");
  const note = notes[noteKey] ?? "";

  const counted = React.useMemo(() => findings.filter((f) => !ig.state.ids.has(f.id)), [findings, ig.state.ids]);
  const stats = React.useMemo(() => countFindings(findings, ig.state.ids), [findings, ig.state.ids]);

  // ---- journal: where what was sent stands ----
  const watching = sentIds.size > 0 || tool === "issues";
  React.useEffect(() => {
    if (!watching) return;
    let alive = true;
    const pull = async () => {
      if (document.hidden) return;
      const r = await readJournal(bridgePort, tabId);
      if (alive) setJournal(r);
    };
    void pull();
    const id = window.setInterval(pull, 2500);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [watching, bridgePort, tabId]);

  const entryById = React.useMemo(() => new Map((journal?.entries ?? []).map((e) => [e.id, e] as const)), [journal]);
  entryByIdRef.current = entryById;
  const recentAck = (journal?.entries ?? []).some((e) => e.state === "acked" && Date.now() - e.ackedAt < RESCAN_WINDOW_MS + 2000);
  const now = useNow(recentAck);
  const present = React.useMemo(() => new Set(findings.map((f) => f.id)), [findings]);
  const stateOf = React.useCallback((id: string) => rowState(entryById.get(id), present.has(id), now), [entryById, present, now]);

  // "Send N errors" counts only errors that are not already on their way: never sent, withdrawn, back in the queue, or
  // marked done by an agent while the problem is still on the page.
  const errorsToSend = React.useMemo(() => {
    const t = Date.now();
    return counted.filter((f) => {
      if (f.severity !== "error") return false;
      const st = rowState(entryByIdRef.current.get(f.id), true, t);
      return st === null || st.kind === "back" || st.kind === "still";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counted, journal, now]);

  // An agent marked something done: ask for a scan now, and once more when the wait for the page to settle is over.
  const rescanned = React.useRef(new Set<string>());
  React.useEffect(() => {
    for (const e of journal?.entries ?? []) {
      if (e.state !== "acked" || rescanned.current.has(e.id)) continue;
      rescanned.current.add(e.id);
      window.dispatchEvent(new Event(RESCAN_EVENT));
      // Not cleared when the journal changes (the poll replaces it every few seconds); cleared on unmount.
      later(() => window.dispatchEvent(new Event(RESCAN_EVENT)), RESCAN_WINDOW_MS);
    }
  }, [journal, later]);

  const sentEntries = React.useMemo(() => (journal?.entries ?? []).filter((e: JournalEntry) => e.state !== "withdrawn"), [journal]);
  const counts = React.useMemo(() => countsFor(sentEntries, new Set(sentEntries.map((e) => e.id))), [sentEntries]);
  const strip = stripSummary(counts);

  // ---- actions ----
  const openFinding = React.useCallback(
    (id: string) => {
      const f = findings.find((x) => x.id === id);
      if (!f) return;
      const el = resolveTarget(f);
      if (!el) {
        if (f.selector === "(page)") {
          setSelected(null);
          setSelectedId(id);
          setPageFindingId(id);
          setPageIndex(0);
          setPopoverOpen(true);
          setAnnounce("");
        } else {
          setAnnounce(STR.gone);
          setSelectedId(id);
          setSelected(null);
        }
        return;
      }
      el.scrollIntoView({ block: "center", inline: "nearest" });
      select(el, id);
      const siblings = findings.filter((x) => resolveTarget(x) === el);
      const rank = (x: Finding) => (ig.state.ids.has(x.id) ? 2 : SEV[x.severity]);
      const ordered = siblings.map((x, i) => ({ x, i })).sort((a, b) => rank(a.x) - rank(b.x) || a.i - b.i).map((v) => v.x);
      setPageIndex(Math.max(0, ordered.findIndex((x) => x.id === id)));
      setPopoverOpen(true);
    },
    [findings, select, ig.state.ids],
  );

  const currentFinding = elementFindings[Math.min(pageIndex, Math.max(0, elementFindings.length - 1))] ?? null;

  const buildOutgoing = React.useCallback((): Finding | null => {
    const comment = note.trim();
    if (currentFinding) return comment ? { ...currentFinding, comment: comment.slice(0, 2000) } : currentFinding;
    if (!selected) return null;
    const r = selected.getBoundingClientRect();
    return makeFinding(
      userFindingInput(selected, { x: r.x, y: r.y, w: r.width, h: r.height, scrollX: window.scrollX, scrollY: window.scrollY }, uniqueSelector(selected), contextLabel(selected), comment),
    );
  }, [currentFinding, note, selected]);

  const send = React.useCallback(async (): Promise<SendOutcome> => {
    const out = buildOutgoing();
    if (!out) return "other";
    const r = await sendFindings([out], { tabId, pathname: location.pathname, origin: location.origin }, bridgePort);
    if (!r.ok) return r.reason === "bridge-down" ? "bridge-down" : r.reason === "too-long" ? "too-long" : r.reason === "save-failed" ? "save-failed" : "other";
    setSentIds((prev) => new Set([...prev, ...r.accepted]));
    setJournal(await readJournal(bridgePort, tabId));
    return r.agentListening ? "ok" : "ok-no-agent";
  }, [buildOutgoing, tabId, bridgePort]);

  const sendErrors = React.useCallback(async () => {
    const list = errorsToSend.slice(0, 50);
    if (list.length === 0) return;
    const r = await sendFindings(list, { tabId, pathname: location.pathname, origin: location.origin }, bridgePort);
    if (!r.ok) return say(r.reason === "bridge-down" ? STR.bridgeDown : STR.saveFailed);
    setSentIds((prev) => new Set([...prev, ...r.accepted]));
    setJournal(await readJournal(bridgePort, tabId));
    say(`Sent ${r.accepted.length} error${r.accepted.length === 1 ? "" : "s"}. ${r.agentListening ? STR.waiting : STR.noAgent}`);
  }, [errorsToSend, tabId, bridgePort, say]);

  const copy = React.useCallback(async () => {
    const out = buildOutgoing();
    if (!out) return false;
    return copyText(buildPrompt({ pathname: location.pathname, finding: out, note: note.trim() }));
  }, [buildOutgoing, note]);

  const ignoreFinding = React.useCallback(
    (id: string) => {
      ig.ignore(id);
      void withdrawFinding(id, bridgePort);
      setPopoverOpen(false);
      say(STR.ignoredDone);
    },
    [ig, bridgePort, say],
  );

  // ---- keyboard ----
  const [hiddenAll, setHiddenAll] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.code === "KeyS") {
        e.preventDefault();
        setHiddenAll((h) => !h);
        return;
      }
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        // While the popover is open it owns Escape (close, or ask to discard a note).
        if (popoverRef.current) return;
        if (selected || selectedId) {
          select(null);
          setPageFindingId(null);
          setActiveId(null);
        } else if (panelOrder.length > 0) setPanelOrder((o) => o.slice(0, -1));
        else if (tool) setTool(null);
        else if (!bar.collapsed && (e.target as Element | null)?.closest?.("[data-shavin-toolbar]")) setCollapsed(true);
        return;
      }
      const inBar = !!(e.target as Element | null)?.closest?.("[data-shavin-toolbar]");
      if (!tool && !inBar && panelOrder.length === 0) return;
      if (e.key === "Enter" && selected && !popoverOpen && !inBar && !isInspectorElement(e.target as Element)) {
        e.preventDefault();
        setPopoverOpen(true);
      } else if (!settings.shortcuts && /^[vVtTiI,]$/.test(e.key)) {
        // Single-key shortcuts are off (Settings): the buttons still work.
      } else if (e.key === "v" || e.key === "V") setTool((t) => (t === "select" ? null : "select"));
      else if (e.key === "i" || e.key === "I") setTool((t) => (t === "issues" ? null : "issues"));
      else if (e.key === "t" || e.key === "T") togglePanel("theme");
      else if (e.key === ",") togglePanel("settings");
      else if (tool === "select" && selected && e.key.startsWith("Arrow") && !isInspectorElement(e.target as Element)) {
        const next = walk(selected, e.key as "ArrowUp");
        if (next) {
          e.preventDefault();
          select(next);
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [tool, selected, selectedId, popoverOpen, select, bar.collapsed, setCollapsed, panelOrder, togglePanel, settings.shortcuts]);

  const mode = tool === "select" ? STR.selectIdle : tool === "issues" ? `Issues ${stats.total}${counts.pending > 0 ? ` · ${counts.pending} waiting` : ""}` : "";
  const target = tool === "select" ? hovered ?? selected : selected;
  const mark = tool === "issues" ? <IssuesLayer findings={counted} activeId={activeId} onOpen={openFinding} /> : null;
  const popoverOn = popoverOpen && (selected !== null || pageFindingId !== null);

  if (hiddenAll) return <></>;
  return (
    <InspectorRoot scheme={scheme} reduceMotion={settings.reduceMotion}>
      <span className="sr-only" role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {announce}
      </span>
      {mark}
      <Highlight target={target} mode={hovered && hovered !== selected ? "hover" : "selected"} />
      {tool === "issues" ? (
        <div style={phone ? { position: "absolute", left: SHEET_GAP, right: SHEET_GAP, bottom: dockH > 0 ? `calc(${dockH}px + env(safe-area-inset-bottom, 0px) + ${SHEET_GAP}px)` : SHEET_GAP, maxHeight: "62vh", display: "flex", pointerEvents: "none", visibility: popoverOn && listAside ? "hidden" : "visible" } : { position: "absolute", ...dockStyle(effAnchor), pointerEvents: "none", visibility: popoverOn && listAside ? "hidden" : "visible" }}>
          <IssuesList
            findings={findings}
            ignored={ig.state.ids}
            selectedId={selectedId}
            onActive={setActiveId}
            onOpen={openFinding}
            onUndo={ig.undo}
            canUndo={ig.state.history.some((id) => ig.state.ids.has(id))}
            strip={strip}
            rowState={stateOf}
            errorsToSend={errorsToSend.length}
            onSendErrors={() => void sendErrors()}
            touch={phone}
            style={phone ? { width: "100%" } : undefined}
          />
        </div>
      ) : null}
      <FindingPopover
        open={popoverOn}
        anchor={selected}
        findings={elementFindings}
        index={pageIndex}
        onIndex={setPageIndex}
        note={note}
        onNote={(v) => setNotes((n) => ({ ...n, [noteKey]: v }))}
        isIgnored={(id) => ig.state.ids.has(id)}
        stateOf={stateOf}
        onSend={send}
        onIgnore={ignoreFinding}
        onRestore={ig.restore}
        onCopy={copy}
        onClose={() => setPopoverOpen(false)}
        getBar={() => document.querySelector("[data-shavin-toolbar]")?.getBoundingClientRect() ?? null}
        getList={() => document.querySelector("[data-shavin-list]")?.getBoundingClientRect() ?? null}
        getPanels={() => Array.from(document.querySelectorAll("[data-shavin-theme-panel], [data-shavin-settings-panel], [data-shavin-chip]")).map((el) => el.getBoundingClientRect())}
        onListAside={setListAside}
      />
      {theme && panels.has("theme") ? (
        <ThemePanel
          theme={theme}
          contentStyle={themeStyle ?? {}}
          insets={panelInsets(effAnchor, "left")}
          floatStyle={phone ? sheetStyle(dockH) : undefined}
          onClose={() => {
            togglePanel("theme");
            const inside = document.activeElement?.closest?.("[data-shavin-theme-panel]");
            if (inside) document.querySelector<HTMLElement>('[data-shavin-toolbar] button[aria-label="Theme"]')?.focus();
          }}
        />
      ) : null}
      {panels.has("settings") ? (
        <SettingsPanel
          settings={settings}
          insets={panelInsets(effAnchor, "right")}
          floatStyle={phone ? sheetStyle(dockH) : undefined}
          onChange={setSettings}
          ignoredCount={ig.state.ids.size}
          onClearIgnored={ig.clear}
          onOpenBridge={() => window.dispatchEvent(new Event("shavin-open-bridge-panel"))}
          onClose={() => {
            togglePanel("settings");
            const inside = document.activeElement?.closest?.("[data-shavin-settings-panel]");
            if (inside) document.querySelector<HTMLElement>('[data-shavin-toolbar] button[aria-label="Settings"]')?.focus();
          }}
        />
      ) : null}
      {notice ? (
        <div role="status" className="rounded-[var(--radius-lg)] border border-hairline bg-elevated px-2.5 py-1.5 text-xs text-fg shadow-panel" style={{ position: "absolute", right: phone ? 8 : 20, bottom: phone ? (dockH > 0 ? `calc(${dockH}px + env(safe-area-inset-bottom, 0px) + ${SHEET_GAP}px)` : SHEET_GAP) : 76, maxWidth: 320, pointerEvents: "none" }}>
          {notice}
        </div>
      ) : null}
      <Toolbar
        active={tool}
        panels={panels}
        onPanel={togglePanel}
        onChange={(t) => {
          setTool(t);
          if (phone && t === "issues") setPanelOrder([]);
          if (t === null || t === "select") setPopoverOpen(false);
          if (t !== "select") setSelected((s) => (t === "issues" ? s : null));
        }}
        errors={stats.errors}
        warnings={stats.warnings}
        mode={mode}
        anchor={effAnchor}
        onAnchor={setAnchor}
        collapsed={bar.collapsed}
        phone={phone}
        onFocusFrom={(el) => (returnFocus.current = el)}
        onCollapsed={(c) => {
          setCollapsed(c);
          if (c) {
            setTool(null);
            setPanelOrder([]);
            setPopoverOpen(false);
            select(null);
          }
        }}
      />
    </InspectorRoot>
  );
}

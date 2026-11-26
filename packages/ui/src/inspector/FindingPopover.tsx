"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight, Copy, EyeOff, Undo2, X } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "../primitives/Popover";
import { Button } from "../primitives/Button";
import { IconButton } from "../primitives/IconButton";
import { TextArea } from "../primitives/TextArea";
import { cn } from "../lib/cn";
import type { Finding } from "../lib/inspector/schema";
import { describeElement } from "../lib/inspector/selector";
import { scrollPageBy } from "./env";
import { MAX_NOTE } from "./journalClient";
import type { RowState } from "./journalState";
import { canSendAgain } from "./journalState";
import { isSheetWidth, placePopover, scrollAboveSheet, scrollToMakeRoom, type Placement } from "./placement";
import { POPOVER, STR } from "./strings";
import { useTimeouts } from "./useTimeouts";
import { useTrackedRect } from "./useTrackedRect";

export type SendOutcome = "ok" | "ok-no-agent" | "bridge-down" | "save-failed" | "too-long" | "other";

export interface FindingPopoverProps {
  open: boolean;
  /** The element the popover is about, or null for a page-level finding. */
  anchor: Element | null;
  /** The findings on this element, errors first (empty for a plain selection). */
  findings: readonly Finding[];
  index: number;
  onIndex: (i: number) => void;
  /** The note belongs to the element and survives paging. */
  note: string;
  onNote: (value: string) => void;
  isIgnored: (id: string) => boolean;
  /** Journal wording for a finding that was sent. */
  stateOf: (id: string) => RowState | null;
  /** Sends the finding on the current page (or a plain selection). */
  onSend: () => Promise<SendOutcome>;
  onIgnore: (id: string) => void;
  onRestore: (id: string) => void;
  onCopy: () => Promise<boolean>;
  /** Close the popover and keep the selection. */
  onClose: () => void;
  /** Where the bar and the list are, so the popover keeps clear of them. */
  getBar: () => DOMRect | null;
  getList: () => DOMRect | null;
  /** Rects the popover must not cover: the open Theme and Settings panels and the element's label chip. */
  getPanels?: () => DOMRect[];
  /** The list steps aside while the popover covers its place. */
  onListAside: (aside: boolean) => void;
}

const NATURAL_W = 320;

function sendMessage(o: SendOutcome | null): { text: string; tone: "muted" | "danger" } | null {
  switch (o) {
    case "ok":
      return { text: STR.waiting, tone: "muted" };
    case "ok-no-agent":
      return { text: STR.noAgent, tone: "muted" };
    case "bridge-down":
      return { text: STR.bridgeDown, tone: "danger" };
    case "save-failed":
      return { text: STR.saveFailed, tone: "danger" };
    case "too-long":
      return { text: STR.tooLong, tone: "danger" };
    case "other":
      return { text: STR.saveFailed, tone: "danger" };
    default:
      return null;
  }
}

/** A line of text with `code` spans for the commands in our messages. */
function withCode(text: string): React.ReactNode {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") ? (
      <code key={i} className="rounded-[6px] bg-fg/[0.08] px-1 py-0.5 font-mono text-[11px]">
        {part.slice(1, -1)}
      </code>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

/**
 * The one dialog for a selected element: what is wrong and how to fix it (when a detector flagged it), a note, and
 * four actions. It sits on the side of the element that has room (never on the element, the bar or the list), follows
 * the element while the page scrolls, and is a bottom sheet on a phone. Esc closes it and keeps the selection; with a
 * longer note the first Esc asks "Discard?".
 */
export function FindingPopover(props: FindingPopoverProps): React.JSX.Element | null {
  const { open, anchor, findings, index, note, isIgnored } = props;
  const finding = findings[Math.min(index, Math.max(0, findings.length - 1))] ?? null;
  const ignored = finding ? isIgnored(finding.id) : false;
  const state = finding ? props.stateOf(finding.id) : null;

  const [sendState, setSendState] = React.useState<"idle" | "sending">("idle");
  const [outcome, setOutcome] = React.useState<SendOutcome | null>(null);
  const [copied, setCopied] = React.useState(false);
  const later = useTimeouts();
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  /** The note as it was when it was last sent: a note that already went to the agent is not "unsaved". */
  const [sentNote, setSentNote] = React.useState<string | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const noteRef = React.useRef<HTMLTextAreaElement>(null);
  const [place, setPlace] = React.useState<Placement | null>(null);
  const scrolledFor = React.useRef<Element | null>(null);
  const targetRect = useTrackedRect(open ? anchor : null);
  const sheet = typeof window !== "undefined" && isSheetWidth(window.innerWidth);

  React.useEffect(() => {
    setOutcome(null);
    setCopied(false);
    setConfirmDiscard(false);
  }, [finding?.id, open]);

  // Placement: measured, then recomputed whenever the element moves or the popover changes height.
  const measure = React.useCallback(() => {
    const box = contentRef.current;
    if (!open || !box) return;
    const prevMax = box.style.maxHeight;
    box.style.maxHeight = "";
    const naturalH = box.scrollHeight;
    box.style.maxHeight = prevMax;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const barRect = props.getBar();
    const bar = barRect ? { x: barRect.x, y: barRect.y, w: barRect.width, h: barRect.height } : { x: W - 300, y: H - 60, w: 280, h: 40 };
    const lr = props.getList();
    const list = lr ? { x: lr.x, y: lr.y, w: lr.width, h: lr.height } : null;
    const target = anchor && targetRect ? targetRect : null;
    const obstacles = (props.getPanels?.() ?? []).map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height }));

    if (isSheetWidth(W)) {
      const h = Math.min(naturalH, H * 0.62);
      // The dock (and the device's bottom safe area under it) is whatever the bar measures from its top edge down.
      const lift = barRect && barRect.height > 0 ? Math.max(0, H - barRect.y) : 0;
      const sheetPlace: Placement = { placed: "inside", x: 8, y: H - h - 8 - lift, maxHeight: H * 0.62, listAside: true };
      setPlace((prev) => (prev && prev.x === sheetPlace.x && prev.y === sheetPlace.y && prev.maxHeight === sheetPlace.maxHeight ? prev : sheetPlace));
      if (target) {
        const d = scrollAboveSheet({ viewport: { W, H }, target, sheetH: h + lift });
        if (d !== 0) scrollPageBy(anchor, d);
      }
      props.onListAside(true);
      return;
    }

    let p = placePopover({ viewport: { W, H }, target, bar, list, obstacles, popover: { w: NATURAL_W, naturalH } });
    if (p.placed === "inside" && target && scrolledFor.current !== anchor) {
      const d = scrollToMakeRoom({ viewport: { W, H }, target, popoverH: naturalH });
      scrolledFor.current = anchor;
      if (d !== null && Math.abs(d) > 1) scrollPageBy(anchor, d);
    }
    setPlace((prev) => (prev && prev.x === p.x && prev.y === p.y && prev.maxHeight === p.maxHeight && prev.placed === p.placed && prev.listAside === p.listAside ? prev : p));
    props.onListAside(p.listAside);
  }, [open, anchor, targetRect, props]);

  React.useLayoutEffect(measure);
  React.useEffect(() => {
    const box = contentRef.current;
    if (!open || !box || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [open, measure]);
  React.useEffect(() => {
    if (!open) {
      scrolledFor.current = null;
      props.onListAside(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const virtualRef = React.useMemo(
    () => ({ current: { getBoundingClientRect: () => new DOMRect(place?.x ?? 0, place?.y ?? 0, 0, 0) } }),
    [place?.x, place?.y],
  );

  const send = async () => {
    if (!finding && !anchor) return;
    if (note.length > MAX_NOTE) return setOutcome("too-long");
    setSendState("sending");
    const o = await props.onSend();
    setSendState("idle");
    setOutcome(o);
    if (o === "ok" || o === "ok-no-agent") setSentNote(note);
  };

  const copy = async () => {
    const ok = await props.onCopy();
    setCopied(ok);
    if (ok) later(() => setCopied(false), 2000);
  };

  const requestClose = () => {
    if (note.trim().length > 20 && note !== sentNote && !confirmDiscard) return setConfirmDiscard(true);
    if (confirmDiscard) props.onNote("");
    props.onClose();
  };

  // The title is the finding's own sentence without its final period; a plain selection shows tag and class.
  const title = finding ? finding.message.replace(/\.$/, "") : anchor ? describeElement(anchor) : "Page";
  const rawMsg = sendMessage(outcome);
  // One status line: the journal's current state once it is known (with the "no agent is waiting" wording while it is
  // still just waiting); the outcome of the click only before that, or when sending failed.
  const msg = rawMsg && (rawMsg.tone === "danger" || !state || ignored) ? rawMsg : null;
  const stateText = state ? (outcome === "ok-no-agent" && state.kind === "waiting" ? STR.noAgent : state.text) : "";
  const evidence = !finding
    ? ""
    : finding.detector === "console"
      ? `Error: ${finding.evidence.measured ?? ""}`.replace(/^Error: Error: /, "Error: ")
      : [finding.evidence.measured && `Measured ${finding.evidence.measured}`, finding.evidence.expected && `expected ${finding.evidence.expected}`].filter(Boolean).join(", ");
  const dotClass = finding ? (ignored ? "bg-fg-subtle/60" : finding.severity === "error" ? "bg-danger" : "border-[1.5px] border-warning") : "";
  const tooLong = note.length > MAX_NOTE;
  const canSend = (finding || anchor) && !ignored && sendState !== "sending" && !tooLong && (finding ? true : note.trim().length > 0);

  return (
    <Popover open={open} modal={false}>
      <PopoverAnchor virtualRef={virtualRef as unknown as React.RefObject<{ getBoundingClientRect(): DOMRect }>} />
      <PopoverContent
        ref={contentRef}
        role="dialog"
        aria-label={POPOVER.dialogLabel}
        side="bottom"
        align="start"
        sideOffset={0}
        avoidCollisions={false}
        data-shavin-popover=""
        className={cn("flex w-80 flex-col gap-2.5 overflow-y-auto p-3 text-fg", sheet && "!w-[calc(100vw-16px)] rounded-t-[var(--radius-panel)]")}
        style={{ maxHeight: place?.maxHeight ?? undefined, pointerEvents: "auto", visibility: place ? "visible" : "hidden", ...(sheet ? { width: "calc(100vw - 16px)" } : null) }}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          noteRef.current?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          requestClose();
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            void send();
          }
        }}
      >
        <div className="flex items-start gap-2">
          {finding ? <span aria-hidden="true" className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotClass)} /> : null}
          <h2 className="min-w-0 flex-1 break-words text-sm font-semibold leading-snug" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }} title={title}>
            {title}
          </h2>
          <IconButton variant="ghost" size="sm" aria-label={POPOVER.close} onClick={props.onClose}>
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </IconButton>
        </div>

        {findings.length > 1 ? (
          <div className="-mt-1 flex items-center gap-0.5 text-xs text-fg-muted" role="group" aria-label="Findings on this element">
            <IconButton variant="ghost" size="sm" aria-label="Previous finding" disabled={index <= 0} onClick={() => props.onIndex(index - 1)}>
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </IconButton>
            <span aria-live="polite" className="px-1">
              {index + 1} of {findings.length}
            </span>
            <IconButton variant="ghost" size="sm" aria-label="Next finding" disabled={index >= findings.length - 1} onClick={() => props.onIndex(index + 1)}>
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </IconButton>
          </div>
        ) : null}

        {finding ? (
          <div className="flex flex-col gap-1 text-xs text-fg-muted">
            {evidence ? <p>{finding.detector === "console" ? evidence : `${evidence}.`}</p> : null}
            {finding.fixHint ? <p>Fix: {finding.fixHint}</p> : null}
          </div>
        ) : null}

        {ignored ? <p className="text-xs text-fg-muted">{STR.ignoredNote}</p> : null}
        {state && !ignored ? (
          <p className="flex items-center justify-between gap-2 text-xs text-fg-muted" role="status">
            <span>{withCode(stateText)}</span>
            {canSendAgain(state) ? (
              <Button variant="ghost" size="sm" onClick={() => void send()}>
                {POPOVER.sendAgain}
              </Button>
            ) : null}
          </p>
        ) : null}

        <TextArea
          ref={noteRef}
          aria-label={POPOVER.noteLabel}
          placeholder={POPOVER.notePlaceholder}
          rows={2}
          value={note}
          invalid={tooLong}
          onChange={(e) => {
            props.onNote(e.target.value);
            setConfirmDiscard(false);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 6 * 20 + 16)}px`;
          }}
          className="resize-none text-xs"
        />

        {msg ? (
          <p className={cn("text-xs", msg.tone === "danger" ? "text-danger" : "text-fg-muted")} role="status">
            {withCode(msg.text)}
          </p>
        ) : null}
        {copied ? (
          <p className="text-xs text-fg-muted" role="status">
            {STR.copied}
          </p>
        ) : null}

        <div className="flex items-center justify-start gap-1">
          {finding ? (
            ignored ? (
              <Button variant="ghost" size="sm" onClick={() => props.onRestore(finding.id)}>
                <Undo2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                {POPOVER.restore}
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => props.onIgnore(finding.id)}>
                <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                {POPOVER.ignore}
              </Button>
            )
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => void copy()}>
            <Copy className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            {POPOVER.copy}
          </Button>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={requestClose}>
            {confirmDiscard ? POPOVER.discard : POPOVER.cancel}
          </Button>
          <Button size="sm" loading={sendState === "sending"} loadingLabel={POPOVER.sending} disabled={!canSend} onClick={() => void send()}>
            {ignored ? POPOVER.ignored : POPOVER.send}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

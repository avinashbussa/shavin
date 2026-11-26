"use client";
import React, { useEffect, useId, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { hitAreaClass, type HitArea } from "../../lib/hit-area";
import { ChevronRight } from "lucide-react";
import { Murmur } from "../Murmur/Murmur";
import { announce } from "../../lib/announce";

export interface ReasoningProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The model's thinking text. */
  children?: React.ReactNode;
  /** thinking: live, open by default with a pulsing mark. done: collapsed summary. Default "done". */
  status?: "thinking" | "done";
  /** Elapsed time shown when done, e.g. "4s". Omit it and the component times the thinking itself. */
  duration?: string;
  /** Fold the text away when status goes from thinking to done (uncontrolled only). Default true; pass false to leave it open. */
  autoCollapse?: boolean;
  /** Cap the open text at this height (px or CSS length) and scroll inside it, so a long chain of thought does not push the message down. */
  maxHeight?: number | string;
  /** Override the trigger label. */
  label?: string;
  /** Initial open state when uncontrolled. Defaults to open while thinking, closed when done. */
  defaultOpen?: boolean;
  /** Controlled open state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Hit-area override (docs: "Target size"). "default": 24px floor (this control stays at 24px on touch). "none": no hit area
   * growth (dense toolbars; may go below 24px, yours to own). "touch": always 44px on a coarse pointer.
   */
  hitArea?: HitArea;
}

/** Collapsible "Thinking…" / "Thought for 4s" disclosure for a model's reasoning. */
export function Reasoning({
  children,
  status = "done",
  duration,
  maxHeight,
  autoCollapse = true,
  label,
  defaultOpen,
  open: openProp,
  onOpenChange,
  hitArea,
  className,
  ...props
}: ReasoningProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultOpen ?? status === "thinking");
  const open = openProp ?? inner;
  const thinking = status === "thinking";
  // Time the thinking ourselves so "Thinking… 4s" is live and "Thought for 4s" is right without the host passing it.
  const [seconds, setSeconds] = useState(0);
  const sawThinking = useRef(thinking);
  const prevThinking = useRef(thinking);
  useEffect(() => {
    if (!thinking) return;
    setSeconds(0);
    const t0 = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [thinking]);
  // thinking -> done: fold the text away (unless the host controls it) and tell screen readers.
  useEffect(() => {
    if (prevThinking.current && !thinking) {
      if (openProp === undefined && autoCollapse) setInner(false);
      announce("Finished thinking", "polite");
    }
    if (thinking) sawThinking.current = true;
    prevThinking.current = thinking;
  }, [thinking, openProp, autoCollapse]);
  const timed = sawThinking.current && seconds > 0 ? `${seconds}s` : undefined;
  const text = label ?? (thinking ? (timed ? `Thinking… ${timed}` : "Thinking…") : duration ?? timed ? `Thought for ${duration ?? timed}` : "Thought process");
  const toggle = () => {
    const next = !open;
    setInner(next);
    onOpenChange?.(next);
  };
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        className={cn("hit-area group inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-lg)] px-1 py-0.5 text-xs font-medium text-fg-muted transition-colors hover:text-fg", hitAreaClass(hitArea, "floor", "Reasoning"))}
      >
        {thinking && <Murmur state="thinking" size={22} label="" />}
        <span>{text}</span>
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} aria-hidden />
      </button>
      {open && children != null && (
        <div id={id} className={cn("border-l border-hairline pl-3 text-sm leading-relaxed text-fg-subtle", maxHeight !== undefined && "overflow-y-auto")} style={maxHeight !== undefined ? { maxHeight } : undefined}>
          {children}
        </div>
      )}
    </div>
  );
}

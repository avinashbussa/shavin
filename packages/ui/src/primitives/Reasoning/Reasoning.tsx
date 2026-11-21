"use client";
import React, { useId, useState } from "react";
import { cn } from "../../lib/cn";
import { hitAreaClass, type HitArea } from "../../lib/hit-area";
import { ChevronRight } from "lucide-react";
import { Murmur } from "../Murmur/Murmur";

export interface ReasoningProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The model's thinking text. */
  children?: React.ReactNode;
  /** thinking: live, open by default with a pulsing mark. done: collapsed summary. Default "done". */
  status?: "thinking" | "done";
  /** Elapsed time shown when done, e.g. "4s". */
  duration?: string;
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
  const text = label ?? (thinking ? "Thinking…" : duration ? `Thought for ${duration}` : "Thought process");
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
        <div id={id} className="border-l border-hairline pl-3 text-sm leading-relaxed text-fg-subtle">
          {children}
        </div>
      )}
    </div>
  );
}

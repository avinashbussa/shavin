"use client";
import React, { useId, useState } from "react";
import { cn } from "../../lib/cn";
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
        className="group inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-lg)] px-1 py-0.5 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
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

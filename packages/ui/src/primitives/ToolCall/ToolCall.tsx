"use client";
import React from "react";
import { cn } from "../../lib/cn";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Murmur } from "../Murmur/Murmur";
import { Text } from "../Text";
import { Ban, Check, Clock, ShieldQuestion, Wrench, X } from "lucide-react";

export type ToolCallStatus = "pending" | "running" | "needs-approval" | "done" | "error" | "denied";
export type ToolApprovalScope = "once" | "always";

const META: Record<ToolCallStatus, { label: string; tone: "neutral" | "accent" | "success" | "warning" | "danger" }> = {
  pending: { label: "Queued", tone: "neutral" },
  running: { label: "Running", tone: "accent" },
  "needs-approval": { label: "Needs approval", tone: "warning" },
  done: { label: "Done", tone: "success" },
  error: { label: "Failed", tone: "danger" },
  denied: { label: "Denied", tone: "neutral" },
};

function StatusIcon({ status }: { status: ToolCallStatus }) {
  const cls = "h-4 w-4";
  if (status === "running") return <Murmur state="working" size={22} label="Running" />;
  if (status === "pending") return <Clock className={cls} aria-hidden />;
  if (status === "needs-approval") return <ShieldQuestion className={cn(cls, "text-warning")} aria-hidden />;
  if (status === "done") return <Check className={cn(cls, "text-success")} aria-hidden />;
  if (status === "error") return <X className={cn(cls, "text-danger")} aria-hidden />;
  if (status === "denied") return <Ban className={cls} aria-hidden />;
  return <Wrench className={cls} aria-hidden />;
}

export interface ToolCallProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Tool identifier shown in monospace, e.g. "search_tickets". */
  name: string;
  /** Lifecycle of the call. */
  status?: ToolCallStatus;
  /** One line saying what the tool is doing or wants to do, in plain language. */
  description?: string;
  /** What the tool will receive, shown in the approval request (e.g. a query or file path). */
  input?: string;
  /** Result of the call. Shown when done or failed. */
  children?: React.ReactNode;
  /** Called when the user allows a call that needs approval. */
  onApprove?: (scope: ToolApprovalScope) => void;
  /** Called when the user denies a call that needs approval. */
  onDeny?: () => void;
  /** Hide the "Always allow" choice. */
  hideAlways?: boolean;
}

/** One tool/function call by an assistant, including the permission request before it runs. */
export function ToolCall({
  name,
  status = "done",
  description,
  input,
  children,
  onApprove,
  onDeny,
  hideAlways,
  className,
  ...props
}: ToolCallProps) {
  const meta = META[status];
  const asking = status === "needs-approval";
  return (
    <div
      className={cn("flex w-full flex-col gap-3 rounded-[var(--radius-panel)] border bg-surface p-3", asking ? "border-warning/40" : "border-hairline", className)}
      data-status={status}
      {...props}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-surface-hover text-fg-muted">
          <StatusIcon status={status} />
        </span>
        <div className="min-w-0 flex-1">
          <Text as="p" size="sm" weight="medium" className="truncate font-mono">{name}</Text>
          {description && <Text as="p" size="xs" color="subtle" className="truncate">{description}</Text>}
        </div>
        <Badge variant="soft" tone={meta.tone} size="sm">{meta.label}</Badge>
      </div>
      {asking && (
        <div role="group" aria-label={`Permission request for ${name}`} className="flex flex-col gap-3">
          {input && <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-[var(--radius-lg)] bg-surface-hover px-3 py-2 font-mono text-xs text-fg-muted">{input}</pre>}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => onApprove?.("once")}>Allow once</Button>
            {!hideAlways && <Button size="sm" variant="outline" onClick={() => onApprove?.("always")}>Always allow</Button>}
            <Button size="sm" variant="ghost" onClick={() => onDeny?.()}>Deny</Button>
          </div>
        </div>
      )}
      {(status === "done" || status === "error") && children != null && (
        <div className="rounded-[var(--radius-lg)] bg-surface-hover px-3 py-2 text-xs text-fg-muted">{children}</div>
      )}
    </div>
  );
}

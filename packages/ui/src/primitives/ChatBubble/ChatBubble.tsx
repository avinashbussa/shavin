"use client";
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { Avatar } from "../Avatar/Avatar";
import { Button } from "../Button/Button";
import { Murmur } from "../Murmur/Murmur";
import { Text } from "../Text";
import { AlertCircle, RotateCw } from "lucide-react";

export const bubbleVariants = cva("w-fit max-w-[85%] px-3 py-2 text-sm leading-relaxed", {
  variants: {
    variant: {
      incoming: "bg-surface-hover text-fg rounded-[var(--radius-panel)] rounded-tl-[0.25rem]",
      outgoing: "bg-accent text-accent-fg rounded-[var(--radius-panel)] rounded-tr-[0.25rem]",
      system: "mx-auto max-w-full bg-transparent px-3 py-1 text-center text-xs text-fg-subtle",
    },
  },
  defaultVariants: { variant: "incoming" },
});

/** Who is speaking. `variant` (incoming, outgoing, system) is the older spelling of the same thing. */
export type ChatRole = "user" | "assistant" | "system";
/** bubble: text sits on a surface. flat: content flows as a document, which is what rich AI replies need. */
export type ChatLayout = "bubble" | "flat";
/**
 * Lifecycle of a turn. submitted/streaming/ready/error match the Vercel AI SDK chat status;
 * stopped is a turn the user cut short.
 */
export type ChatStatus = "ready" | "submitted" | "streaming" | "stopped" | "error";

export interface ChatBubbleProps extends VariantProps<typeof bubbleVariants> {
  /**
   * Message content. For AI turns pass the parts in order: Reasoning, ToolCall, text, CodeBlock, FileOutput.
   * Use layout="flat" (the default for role="assistant") so cards and code are not squeezed into a bubble.
   */
  children?: React.ReactNode;
  /** user, assistant or system. Assistant defaults to layout="flat". Overrides `variant`. */
  role?: ChatRole;
  /** bubble or flat. Defaults to flat for role="assistant", bubble otherwise (and for `variant`). */
  layout?: ChatLayout;
  /** Turn lifecycle. Default "ready". submitted shows the pending indicator, streaming a live caret, stopped a label, error a retry row. */
  status?: ChatStatus;
  /** Message shown when status="error". */
  error?: string;
  /** Called by the Retry button in the error row. */
  onRetry?: () => void;
  /** Footer actions (copy, regenerate, feedback). Hidden while submitted or streaming. */
  actions?: React.ReactNode;
  /** Replaces the pending indicator shown while status="submitted". Default is a Murmur with pendingLabel. */
  indicator?: React.ReactNode;
  /** Text beside the pending indicator. Default "Thinking…". */
  pendingLabel?: string;
  /** Name shown above the bubble. */
  author?: string;
  /** Timestamp / status shown under the bubble. */
  timestamp?: string;
  /** Avatar image for the message sender. */
  avatarSrc?: string;
  /** Fallback initials when no avatar image (e.g. "AI", "AB"). */
  avatarFallback?: string;
  /** Hide the avatar column. */
  hideAvatar?: boolean;
  /** Optional custom CSS class name. */
  className?: string;
}

/**
 * One message in a conversation, human or AI. Handles who is speaking, how the content is laid out,
 * and the turn lifecycle (pending, streaming, stopped, error) so an AI framework only has to map its
 * message parts and status onto it.
 */
export function ChatBubble({
  children,
  variant,
  role,
  layout,
  status = "ready",
  error,
  onRetry,
  actions,
  indicator,
  pendingLabel = "Thinking…",
  author,
  timestamp,
  avatarSrc,
  avatarFallback,
  hideAvatar,
  className,
}: ChatBubbleProps) {
  const resolvedRole: ChatRole = role ?? (variant === "outgoing" ? "user" : variant === "system" ? "system" : "assistant");
  const resolvedLayout: ChatLayout = layout ?? (role === "assistant" ? "flat" : "bubble");
  const surface: "incoming" | "outgoing" | "system" = resolvedRole === "user" ? "outgoing" : resolvedRole === "system" ? "system" : "incoming";

  if (surface === "system") {
    return (
      <div className={cn("flex w-full justify-center", className)}>
        <div className={bubbleVariants({ variant: "system" })}>{children}</div>
      </div>
    );
  }

  const outgoing = surface === "outgoing";
  const flat = resolvedLayout === "flat";
  const live = status === "submitted" || status === "streaming";
  // Keep the live region once a message has streamed: dropping aria-live in the same
  // render that clears aria-busy means the finished text is never announced.
  const [wasLive, setWasLive] = React.useState(live);
  React.useEffect(() => {
    if (live) setWasLive(true);
  }, [live]);
  const liveProps = { "aria-live": live || wasLive ? ("polite" as const) : undefined, "aria-busy": live || undefined };
  const avatar = !hideAvatar && <Avatar size="sm" src={avatarSrc} fallback={avatarFallback} alt={author ?? ""} />;

  const content = (
    <>
      {status === "submitted" && (indicator ?? (
        <span role="status" className="inline-flex items-center gap-2 text-sm text-fg-subtle">
          <Murmur state="thinking" size={20} label="" />
          {pendingLabel}
        </span>
      ))}
      {children}
      {status === "streaming" && <span aria-hidden className="inline-block h-4 w-1.5 animate-pulse-dot rounded-[var(--radius-sm)] bg-accent" />}
    </>
  );

  return (
    <div
      className={cn("flex w-full gap-2", flat ? "items-start gap-3" : "items-end", outgoing ? "flex-row-reverse" : "flex-row", className)}
      data-role={resolvedRole}
      data-status={status}
    >
      {avatar}
      <div className={cn("flex min-w-0 flex-col gap-1", flat ? "flex-1 gap-2" : outgoing ? "items-end" : "items-start")}>
        {author && <Text size="xs" color="muted" weight="medium" className="px-1">{author}</Text>}
        {flat ? (
          <div className="flex min-w-0 flex-col gap-3 text-sm leading-relaxed text-fg" {...liveProps}>
            {content}
          </div>
        ) : (
          <div className={bubbleVariants({ variant: surface })} {...liveProps}>
            {content}
          </div>
        )}
        {status === "stopped" && <Text size="xs" color="subtle" className="px-1">Stopped</Text>}
        {status === "error" && (
          <div role="alert" className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-fg">
            <AlertCircle className="h-4 w-4 shrink-0 text-danger" aria-hidden />
            <span className="min-w-0 flex-1">{error ?? "Something went wrong."}</span>
            {onRetry && (
              <Button size="sm" variant="ghost" onClick={onRetry} iconLeft={<RotateCw className="h-3.5 w-3.5" aria-hidden />}>
                Retry
              </Button>
            )}
          </div>
        )}
        {!live && (actions || timestamp) && (
          <div className="flex items-center gap-2 px-1">
            {timestamp && <Text size="xs" color="subtle">{timestamp}</Text>}
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

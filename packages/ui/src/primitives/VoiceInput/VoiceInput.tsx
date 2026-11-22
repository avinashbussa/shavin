"use client";
import React from "react";
import { cn } from "../../lib/cn";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import { Murmur } from "../Murmur/Murmur";
import { Text } from "../Text";
import { ArrowUp, Mic, MicOff, X } from "lucide-react";

export type VoiceInputState = "idle" | "requesting" | "listening" | "transcribing" | "processing" | "error";
/** push-to-send: record, then press send (a composer). hands-free: the app detects when you stop talking, so there is nothing to send. */
export type VoiceInputMode = "push-to-send" | "hands-free";

export interface VoiceInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Current state. Default "idle". processing is the step after transcribing, when the app acts on what was said. */
  state?: VoiceInputState;
  /** Default "push-to-send". hands-free drops the send arrow: one Stop button ends the session, and the layout is a centred stack that fits a side panel. */
  mode?: VoiceInputMode;
  /** Quiet line under the status, e.g. what the voice command will act on ("Pointing at Hero heading"). */
  description?: string;
  /** Text for the processing state. Default "Working on it…". */
  processingLabel?: string;
  /** Live input level 0-1 that drives the bars while listening. Omit for a gentle idle pulse. */
  level?: number;
  /** Elapsed recording time, e.g. "0:07". */
  elapsed?: string;
  /** Live or final transcript shown while listening or transcribing. Wraps up to two lines. */
  transcript?: string;
  /** Message shown when state="error" (e.g. "Microphone blocked"). */
  error?: string;
  /** Dismiss the error and return to idle (error). */
  onDismiss?: () => void;
  /** Start recording (idle and error). */
  onStart?: () => void;
  /** Stop and send (listening). */
  onStop?: () => void;
  /** Discard the recording (listening). Also shows a cancel button while requesting, transcribing and processing, so nobody has to wait it out. */
  onCancel?: () => void;
}

const BARS = 24;

/** Voice-to-text control for a composer: idle mic, permission wait, live waveform, transcribing, error. */
export function VoiceInput({
  state = "idle",
  mode = "push-to-send",
  description,
  processingLabel = "Working on it…",
  level,
  elapsed,
  transcript,
  error,
  onStart,
  onDismiss,
  onStop,
  onCancel,
  className,
  ...props
}: VoiceInputProps) {
  if (state === "idle") {
    return (
      <div className={className} {...props}>
        <IconButton aria-label="Start voice input" variant="ghost" size="sm" onClick={onStart}>
          <Mic className="h-4 w-4" aria-hidden />
        </IconButton>
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className={cn("flex items-center gap-2", className)} role="alert" {...props}>
        <MicOff className="h-4 w-4 shrink-0 text-danger" aria-hidden />
        <Text size="xs" color="subtle" className="min-w-0 truncate">{error ?? "Voice input is unavailable."}</Text>
        {onStart && <Button size="sm" variant="ghost" onClick={onStart}>Try again</Button>}
        {onDismiss && <IconButton aria-label="Dismiss" variant="ghost" size="sm" onClick={onDismiss}><X className="h-4 w-4" aria-hidden /></IconButton>}
      </div>
    );
  }
  const cancel = onCancel && (
    <IconButton aria-label="Cancel" variant="ghost" size="sm" onClick={onCancel}>
      <X className="h-4 w-4" aria-hidden />
    </IconButton>
  );
  const statusText =
    state === "requesting" ? "Allow microphone access…"
    : state === "transcribing" ? "Transcribing…"
    : state === "processing" ? processingLabel
    : null;

  if (mode === "hands-free") {
    const murmurState = state === "requesting" ? "idle" : state === "transcribing" ? "thinking" : state === "processing" ? "working" : "listening";
    const headline = transcript && state !== "processing" ? transcript : statusText ?? "Listening, hands-free";
    return (
      <div
        className={cn("relative flex w-full min-w-0 flex-col items-center gap-3 px-4 py-5 text-center", className)}
        role={state === "listening" ? "group" : "status"}
        aria-label={state === "listening" ? "Listening" : undefined}
        {...props}
      >
        <Murmur state={murmurState} level={level} size={48} dotSize={0.8} dots={80} label="" />
        <div className="flex w-full min-w-0 flex-col gap-1">
          <Text size="sm" weight="medium" className={cn("break-words", transcript && state === "listening" ? "line-clamp-2 italic" : "line-clamp-2")}>{headline}</Text>
          {description && <Text size="xs" color="subtle" className="truncate">{description}</Text>}
          {elapsed && <Text size="xs" color="muted" className="tabular-nums">{elapsed}</Text>}
        </div>
        <IconButton aria-label={state === "listening" ? "Stop listening" : "Cancel"} variant="ghost" size="sm" onClick={state === "listening" ? (onStop ?? onCancel) : (onCancel ?? onStop)} className="absolute right-2 top-2">
          <X className="h-4 w-4" aria-hidden />
        </IconButton>
      </div>
    );
  }

  if (statusText) {
    return (
      <div className={cn("flex min-w-0 flex-col gap-1", className)} role="status" {...props}>
        <div className="flex items-center gap-2">
          <Murmur state={state === "requesting" ? "idle" : state === "processing" ? "working" : "thinking"} size={22} label="" />
          <Text size="xs" color="subtle" className="min-w-0 flex-1">{statusText}</Text>
          {cancel}
        </div>
        {state === "transcribing" && transcript && <Text size="xs" className="line-clamp-2 break-words">{transcript}</Text>}
        {description && <Text size="xs" color="subtle" className="truncate">{description}</Text>}
      </div>
    );
  }
  const l = Math.min(Math.max(level ?? 0.35, 0), 1);
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-1", className)} role="group" aria-label="Recording voice input" {...props}>
      <div className="flex min-w-0 items-center gap-2">
        <IconButton aria-label="Discard recording" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" aria-hidden />
        </IconButton>
        <div className="flex h-8 min-w-0 flex-1 items-center justify-center gap-[3px]" aria-hidden>
          {Array.from({ length: BARS }).map((_, i) => {
            const shape = 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + 1));
            return (
              <span
                key={i}
                className={cn("w-[3px] rounded-full bg-brand transition-[height] duration-100", level === undefined && "animate-pulse-dot")}
                style={{ height: `${Math.round(12 + 88 * l * shape)}%`, animationDelay: level === undefined ? `${i * 40}ms` : undefined }}
              />
            );
          })}
        </div>
        {elapsed && <Text size="xs" color="muted" className="tabular-nums">{elapsed}</Text>}
        <IconButton aria-label="Stop and send" variant="solid" size="sm" onClick={onStop}>
          <ArrowUp className="h-4 w-4" aria-hidden />
        </IconButton>
      </div>
      {transcript && <Text size="xs" className="line-clamp-2 break-words px-1">{transcript}</Text>}
      {description && <Text size="xs" color="subtle" className="truncate px-1">{description}</Text>}
    </div>
  );
}

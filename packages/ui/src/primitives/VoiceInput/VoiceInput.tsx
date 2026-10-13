"use client";
import React from "react";
import { cn } from "../../lib/cn";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import { Murmur } from "../Murmur/Murmur";
import { Text } from "../Text";
import { ArrowUp, Mic, MicOff, X } from "lucide-react";

export type VoiceInputState = "idle" | "requesting" | "listening" | "transcribing" | "error";

export interface VoiceInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Current state. Default "idle". */
  state?: VoiceInputState;
  /** Live input level 0-1 that drives the bars while listening. Omit for a gentle idle pulse. */
  level?: number;
  /** Elapsed recording time, e.g. "0:07". */
  elapsed?: string;
  /** Live or final transcript shown while listening or transcribing. */
  transcript?: string;
  /** Message shown when state="error" (e.g. "Microphone blocked"). */
  error?: string;
  /** Dismiss the error and return to idle (error). */
  onDismiss?: () => void;
  /** Start recording (idle and error). */
  onStart?: () => void;
  /** Stop and send (listening). */
  onStop?: () => void;
  /** Discard the recording (listening). */
  onCancel?: () => void;
}

const BARS = 24;

/** Voice-to-text control for a composer: idle mic, permission wait, live waveform, transcribing, error. */
export function VoiceInput({
  state = "idle",
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
  if (state === "requesting" || state === "transcribing") {
    return (
      <div className={cn("flex items-center gap-2", className)} role="status" {...props}>
        <Murmur state={state === "requesting" ? "idle" : "thinking"} size={22} label="" />
        <Text size="xs" color="subtle">{state === "requesting" ? "Allow microphone access…" : "Transcribing…"}</Text>
        {state === "transcribing" && transcript && <Text size="xs" className="min-w-0 truncate">{transcript}</Text>}
      </div>
    );
  }
  const l = Math.min(Math.max(level ?? 0.35, 0), 1);
  return (
    <div className={cn("flex w-full min-w-0 items-center gap-2", className)} role="group" aria-label="Recording voice input" {...props}>
      <IconButton aria-label="Discard recording" variant="ghost" size="sm" onClick={onCancel}>
        <X className="h-4 w-4" aria-hidden />
      </IconButton>
      <div className="flex h-8 min-w-0 flex-1 items-center justify-center gap-[3px]" aria-hidden>
        {Array.from({ length: BARS }).map((_, i) => {
          const shape = 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + 1));
          return (
            <span
              key={i}
              className={cn("w-[3px] rounded-full bg-accent transition-[height] duration-100", level === undefined && "animate-pulse-dot")}
              style={{ height: `${Math.round(12 + 88 * l * shape)}%`, animationDelay: level === undefined ? `${i * 40}ms` : undefined }}
            />
          );
        })}
      </div>
      {transcript && <Text size="xs" className="hidden min-w-0 max-w-[40%] truncate sm:block">{transcript}</Text>}
      {elapsed && <Text size="xs" color="muted" className="tabular-nums">{elapsed}</Text>}
      <IconButton aria-label="Stop and send" variant="solid" size="sm" onClick={onStop}>
        <ArrowUp className="h-4 w-4" aria-hidden />
      </IconButton>
    </div>
  );
}

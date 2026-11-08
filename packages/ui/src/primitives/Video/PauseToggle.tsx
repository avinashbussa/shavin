"use client";
import type { RefObject } from "react";
import { cn } from "../../lib/cn";

/**
 * Pause/play button for moving content: autoplay or looping video, background video and
 * fx animations (WCAG 2.2.2: anything that moves for more than five seconds next to other
 * content needs a way to stop it). Sits in the bottom-right corner of the nearest
 * positioned ancestor.
 */
export function MotionPauseButton({
  playing,
  onToggle,
  label = "animation",
  className,
}: {
  playing: boolean;
  onToggle: () => void;
  /** What moves, read after "Pause"/"Play": "background video", "background animation". */
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? `Pause ${label}` : `Play ${label}`}
      className={cn(
        "absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-surface/85 text-fg shadow-2 backdrop-blur-sm transition hover:bg-surface",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l11-6.5z" />}
      </svg>
    </button>
  );
}

/** `MotionPauseButton` wired to a `<video>`. */
export function VideoPauseToggle({
  videoRef,
  playing,
  label = "video",
  className,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  playing: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <MotionPauseButton
      playing={playing}
      label={label}
      className={className}
      onToggle={() => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) void v.play().catch(() => {});
        else v.pause();
      }}
    />
  );
}

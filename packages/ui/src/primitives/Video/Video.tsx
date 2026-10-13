"use client";
import React, { useRef, type VideoHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const videoVariants = cva("block overflow-hidden bg-surface-hover", {
  variants: {
    radius: {
      none: "rounded-none",
      small: "rounded-[0.25rem]",
      medium: "rounded-[0.5rem]",
      large: "rounded-[0.75rem]",
      full: "rounded-full",
      inherit: "rounded-[var(--radius-panel)]",
      concentric: "rounded-panel-inner",
    },
  },
  defaultVariants: { radius: "inherit" },
});

const FIT_CLASS = { cover: "object-cover", contain: "object-contain", fill: "object-fill", none: "object-none" } as const;

export interface VideoProps
  extends Omit<VideoHTMLAttributes<HTMLVideoElement>, "width" | "height">,
    VariantProps<typeof videoVariants> {
  /** Video source URL. */
  src?: string;
  /** Poster image URL shown before the video loads/plays. */
  poster?: string;
  /** Object fit style: "cover", "contain", "fill", "none". Default "cover". */
  fit?: "cover" | "contain" | "fill" | "none";
  /** CSS aspect-ratio string, e.g. "16/9", "1/1". Reserves space to avoid layout shift. */
  ratio?: string;
  /** Autoplay the video (muted is required by browsers for autoplay). Default true. */
  autoPlay?: boolean;
  /** Loop the video. Default true. */
  loop?: boolean;
  /** Mute the video. Default true. */
  muted?: boolean;
  /** Show native browser controls. Default false. */
  controls?: boolean;
  /** Custom placeholder node shown when src is missing. */
  placeholder?: React.ReactNode;
}

export function Video({
  src,
  poster,
  fit = "cover",
  ratio,
  radius,
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
  placeholder,
  className,
  style,
  ...props
}: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const showPlaceholder = !src;
  const boxStyle = { ...(ratio ? { aspectRatio: ratio } : null), ...style };

  if (showPlaceholder) {
    return (
      <div
        role="img"
        aria-label="Video placeholder"
        className={cn(videoVariants({ radius }), "flex w-full items-center justify-center relative bg-surface-hover text-fg-subtle", className)}
        style={boxStyle}
      >
        {placeholder ?? (
          <svg viewBox="0 0 24 24" fill="none" className="h-1/4 max-h-10 w-1/4 max-w-10 text-fg-subtle" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m10 9 5 3-5 3z" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      controls={controls}
      playsInline
      className={cn(videoVariants({ radius }), "h-full w-full", FIT_CLASS[fit], className)}
      style={boxStyle}
      {...props}
    />
  );
}

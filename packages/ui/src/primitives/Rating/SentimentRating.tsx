"use client";
import { useRef, useState, type HTMLAttributes, type KeyboardEvent } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { Icon } from "../Icon";

const button = cva(
  "inline-flex items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95",
  {
    variants: {
      size: { sm: "size-8", md: "size-10", lg: "size-12" },
      selected: {
        true: "border-transparent bg-accent text-accent-fg",
        false: "border-hairline bg-surface text-fg-muted hover:bg-surface-hover hover:text-fg",
      },
    },
    defaultVariants: { size: "md", selected: false },
  },
);

const FACES = [
  { value: 1, icon: "angry", label: "Very unhappy" },
  { value: 2, icon: "frown", label: "Unhappy" },
  { value: 3, icon: "meh", label: "Neutral" },
  { value: 4, icon: "smile", label: "Happy" },
  { value: 5, icon: "laugh", label: "Very happy" },
] as const;

const THUMBS = [
  { value: 1, icon: "thumbs-up", label: "Helpful" },
  { value: -1, icon: "thumbs-down", label: "Not helpful" },
] as const;

export interface SentimentRatingProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** `thumbs`: value 1 is up, -1 is down. `faces`: value 1 (very unhappy) to 5 (very happy). */
  variant?: "thumbs" | "faces";
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  /** Accessible name. @default "How was it?" */
  label?: string;
}

/** Quick feedback in one tap: thumbs up or down, or a five-point face scale. Arrow keys move between options. */
export function SentimentRating({ variant = "thumbs", value, defaultValue = null, onValueChange, size = "md", disabled, label = "How was it?", className, ...props }: SentimentRatingProps) {
  const [inner, setInner] = useState<number | null>(defaultValue);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = value !== undefined ? value : inner;
  const options = variant === "faces" ? FACES : THUMBS;

  function pick(i: number) {
    if (disabled) return;
    const v = options[i].value;
    if (value === undefined) setInner(v);
    onValueChange?.(v);
    refs.current[i]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const at = Math.max(0, options.findIndex((o) => o.value === current));
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (dir) {
      e.preventDefault();
      pick((at + dir + options.length) % options.length);
    }
  }

  return (
    <div role="radiogroup" aria-label={label} aria-disabled={disabled || undefined} onKeyDown={onKeyDown} className={cn("inline-flex items-center gap-2", disabled && "opacity-50", className)} {...props}>
      {options.map((o, i) => {
        const selected = current === o.value;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={o.label}
            title={o.label}
            disabled={disabled}
            tabIndex={selected || (current === null && i === 0) ? 0 : -1}
            onClick={() => pick(i)}
            className={button({ size, selected })}
          >
            <Icon name={o.icon} size={size === "lg" ? "md" : "sm"} color="inherit" />
          </button>
        );
      })}
    </div>
  );
}

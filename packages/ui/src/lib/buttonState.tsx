"use client";
/**
 * Shared pending / disabled behaviour for Button and IconButton (state-components spec §4.1-4.3).
 *
 * | State                       | Element                              | Cursor       | Hover / focus        |
 * |-----------------------------|--------------------------------------|--------------|----------------------|
 * | plain `disabled`            | native `disabled`                    | not-allowed  | not focusable        |
 * | `disabledReason`            | `aria-disabled`, NOT `disabled`      | not-allowed  | focusable; Tooltip   |
 * | `loading`                   | `aria-disabled` + `aria-busy`        | progress     | focusable            |
 *
 * Precedence: loading > disabledReason > disabled. Clicks are swallowed (and a submit blocked) in the
 * two aria-disabled states. `data-inert` carries the state so hover and active styles can be
 * suppressed with `[&:not([data-inert])]:hover:` (the `disabled:` utilities do not match
 * `aria-disabled`).
 */
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { announce } from "./announce";
import { Tooltip } from "../primitives/Tooltip/Tooltip";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type InertState = "disabled" | "reason" | "loading" | undefined;

export interface ButtonStateInput {
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  disabledReason?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  onPointerDown?: (e: PointerEvent<HTMLButtonElement>) => void;
  "aria-describedby"?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLButtonElement>;
}

export function useButtonState({
  disabled,
  loading,
  loadingLabel,
  disabledReason,
  onClick,
  onPointerDown,
  "aria-describedby": describedBy,
  style,
  ref,
}: ButtonStateInput) {
  const inert: InertState = loading ? "loading" : disabledReason ? "reason" : disabled ? "disabled" : undefined;
  const reasonId = useId();
  const [tipOpen, setTipOpen] = useState(false);
  const lastPointer = useRef<string>("mouse");

  // Width before loading started, so a loadingLabel text swap never makes the button shrink.
  const node = useRef<HTMLButtonElement | null>(null);
  const width = useRef<number | null>(null);
  useIsoLayoutEffect(() => {
    if (!loading && node.current) width.current = node.current.offsetWidth;
  });

  // Announce the loading label once when the pending state starts (the spinner itself is hidden).
  useEffect(() => {
    if (loading && loadingLabel) announce(loadingLabel, "polite");
  }, [loading, loadingLabel]);

  // A tap opens the reason tooltip (tooltips do not open on touch); close it after a few seconds.
  useEffect(() => {
    if (!tipOpen || lastPointer.current !== "touch") return;
    const t = window.setTimeout(() => setTipOpen(false), 4000);
    return () => window.clearTimeout(t);
  }, [tipOpen]);

  const ariaInert = inert === "loading" || inert === "reason";

  const setRef = (el: HTMLButtonElement | null) => {
    node.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as { current: HTMLButtonElement | null }).current = el;
  };

  const buttonProps = {
    ref: setRef,
    disabled: inert === "disabled" ? true : undefined,
    "aria-disabled": ariaInert ? (true as const) : undefined,
    "aria-busy": inert === "loading" ? (true as const) : undefined,
    "data-inert": inert,
    "data-loading": inert === "loading" ? "" : undefined,
    "aria-describedby": inert === "reason" ? [describedBy, reasonId].filter(Boolean).join(" ") : describedBy,
    style:
      inert === "loading" && loadingLabel && width.current
        ? { minWidth: width.current, ...style }
        : style,
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      lastPointer.current = e.pointerType;
      onPointerDown?.(e);
    },
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      if (ariaInert) {
        e.preventDefault();
        e.stopPropagation();
        if (inert === "reason" && lastPointer.current === "touch") {
          setTipOpen(true);
          announce(disabledReason!, "polite");
        }
        return;
      }
      onClick?.(e);
    },
  };

  /** Wraps the rendered button with the reason Tooltip and its permanent screen-reader text. */
  const wrap = (button: ReactNode) =>
    inert === "reason" ? (
      <>
        <Tooltip content={disabledReason} open={tipOpen} onOpenChange={setTipOpen}>
          {button as never}
        </Tooltip>
        {/* Radix links the tooltip only while it is open; this keeps the reason described. */}
        <span id={reasonId} hidden>
          {disabledReason}
        </span>
      </>
    ) : (
      button
    );

  return { inert, buttonProps, wrap };
}

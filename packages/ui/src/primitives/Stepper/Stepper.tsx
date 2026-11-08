"use client";
import React from "react";
import { cn } from "../../lib/cn";
import { Text } from "../Text";

export type StepState = "complete" | "current" | "upcoming";
export type StepSize = "sm" | "md";
export type StepperVariant = "default" | "cards" | "pills";

export type Step = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

function indicatorClass(state: StepState, size: StepSize, isClickable: boolean) {
  return cn(
    "flex shrink-0 items-center justify-center rounded-full border-2 font-medium transition select-none",
    size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm",
    state === "complete" && "border-accent bg-accent text-accent-fg",
    state === "current" && "border-accent bg-surface text-accent font-bold",
    state === "upcoming" && "border-hairline bg-surface text-fg-subtle",
    isClickable && "group-hover:scale-105 transition-transform",
  );
}

function CheckIcon({ size }: { size: StepSize }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Labels({
  step,
  state,
  className,
}: {
  step: Step;
  state: StepState;
  className?: string;
}) {
  return (
    <div className={className}>
      <Text
        size="sm"
        weight={state === "current" ? "semibold" : "medium"}
        color={state === "upcoming" ? "muted" : "default"}
      >
        {step.title}
      </Text>
      {step.description && (
        <Text size="xs" color="subtle" className="mt-0.5">
          {step.description}
        </Text>
      )}
    </div>
  );
}

export interface StepperProps {
  /** Array of step definitions ({ title, description, icon, disabled }). */
  steps: Step[];
  /** 0-based active step index. */
  current: number;
  /** Layout orientation: "horizontal" or "vertical". @default "horizontal" */
  orientation?: "horizontal" | "vertical";
  /** Visual variant: "default" (connected circles), "cards" (multi-step wizard cards), or "pills". @default "default" */
  variant?: "default" | "cards" | "pills";
  /** Size variant: "sm" or "md". @default "md" */
  size?: "sm" | "md";
  /** Callback fired when an interactive step is clicked. */
  onStepClick?: (stepIndex: number) => void;
  /** Which steps can be clicked: "completed" (default when onStepClick is set), "all", or false. @default "completed" */
  clickable?: boolean | "completed" | "all";
  className?: string;
}

export function Stepper({
  steps,
  current,
  orientation = "horizontal",
  variant = "default",
  size = "md",
  onStepClick,
  clickable,
  className,
}: StepperProps) {
  const isClickableRule =
    clickable === "all"
      ? "all"
      : clickable === true || clickable === "completed" || onStepClick !== undefined
      ? "completed"
      : false;

  const stateOf = (i: number): StepState =>
    i < current ? "complete" : i === current ? "current" : "upcoming";

  const isStepClickable = (i: number, step: Step) => {
    if (step.disabled) return false;
    if (!onStepClick) return false;
    if (isClickableRule === "all") return true;
    if (isClickableRule === "completed") return i <= current;
    return false;
  };

  const handleStepClick = (i: number, step: Step) => {
    if (isStepClickable(i, step) && onStepClick) {
      onStepClick(i);
    }
  };

  // ── Variant: "cards" (Ideal for dialog wizards & compact form headers) ──
  if (variant === "cards") {
    return (
      <nav aria-label="Progress" className={cn("w-full", className)}>
        <ol
          className={cn(
            "grid gap-2",
            orientation === "vertical"
              ? "grid-cols-1"
              : `grid-cols-2 sm:grid-cols-${Math.min(steps.length, 6)}`
          )}
        >
          {steps.map((step, i) => {
            const state = stateOf(i);
            const clickableStep = isStepClickable(i, step);
            const isCurrent = state === "current";
            const isComplete = state === "complete";

            return (
              <li key={i} className="min-w-0">
                <button
                  type="button"
                  onClick={() => handleStepClick(i, step)}
                  disabled={!clickableStep}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "group flex w-full items-center gap-2.5 rounded-[var(--radius-lg)] p-2 text-left transition",
                    isCurrent
                      ? "border border-hairline bg-surface-hover shadow-1 cursor-default"
                      : isComplete
                      ? clickableStep
                        ? "border border-transparent hover:bg-surface-hover/60 cursor-pointer opacity-90"
                        : "border border-transparent opacity-80 cursor-default"
                      : "border border-transparent opacity-40 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-full font-bold transition",
                      size === "sm" ? "h-6 w-6 text-xs" : "h-7 w-7 text-xs",
                      isCurrent
                        ? "bg-accent text-accent-fg"
                        : isComplete
                        ? "bg-fg text-surface"
                        : "border border-hairline bg-surface text-fg-subtle"
                    )}
                  >
                    {isComplete ? (
                      <CheckIcon size="sm" />
                    ) : step.icon ? (
                      step.icon
                    ) : (
                      i + 1
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-fg leading-tight">
                      {step.title}
                    </div>
                    {step.description && (
                      <div className="truncate text-[11px] text-fg-subtle mt-0.5">
                        {step.description}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  // ── Variant: "pills" (Compact inline flow) ──
  if (variant === "pills") {
    return (
      <nav aria-label="Progress" className={cn("w-full", className)}>
        <ol className="flex flex-wrap items-center gap-2">
          {steps.map((step, i) => {
            const state = stateOf(i);
            const clickableStep = isStepClickable(i, step);
            const isCurrent = state === "current";
            const isComplete = state === "complete";

            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => handleStepClick(i, step)}
                  disabled={!clickableStep}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition",
                    isCurrent
                      ? "bg-accent text-accent-fg font-semibold shadow-1"
                      : isComplete
                      ? "bg-surface border border-hairline text-fg hover:border-hairline-strong cursor-pointer"
                      : "bg-surface/50 border border-hairline text-fg-subtle opacity-60 cursor-not-allowed"
                  )}
                >
                  <span className="font-bold">
                    {isComplete ? "✓" : i + 1}
                  </span>
                  <span>{step.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  // ── Variant: "default" (Standard connected nodes) ──
  const connectorMt = size === "sm" ? "mt-[13px]" : "mt-[17px]";

  if (orientation === "vertical") {
    return (
      <nav aria-label="Progress" className={cn("w-full", className)}>
        <ol className="flex flex-col">
          {steps.map((step, i) => {
            const last = i === steps.length - 1;
            const state = stateOf(i);
            const clickableStep = isStepClickable(i, step);

            const content = (
              <div className="flex gap-3 text-left">
                <div className="flex flex-col items-center">
                  <span className={indicatorClass(state, size, clickableStep)}>
                    {state === "complete" ? (
                      <CheckIcon size={size} />
                    ) : step.icon ? (
                      step.icon
                    ) : (
                      i + 1
                    )}
                  </span>
                  {!last && (
                    <span
                      className={cn(
                        "my-1 w-0.5 flex-1 transition-colors",
                        i < current ? "bg-accent" : "bg-hairline"
                      )}
                    />
                  )}
                </div>
                <Labels
                  step={step}
                  state={state}
                  className={cn(
                    size === "sm" ? "pt-1" : "pt-1.5",
                    !last && "pb-6"
                  )}
                />
              </div>
            );

            return (
              <li key={i} aria-current={state === "current" ? "step" : undefined}>
                {clickableStep ? (
                  <button
                    type="button"
                    onClick={() => handleStepClick(i, step)}
                    className="group w-full rounded-[var(--radius-md)] text-left"
                  >
                    {content}
                  </button>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol className="flex w-full items-start">
        {steps.map((step, i) => {
          const last = i === steps.length - 1;
          const state = stateOf(i);
          const clickableStep = isStepClickable(i, step);

          const content = (
            <div className="flex flex-col items-center text-center">
              <span className={indicatorClass(state, size, clickableStep)}>
                {state === "complete" ? (
                  <CheckIcon size={size} />
                ) : step.icon ? (
                  step.icon
                ) : (
                  i + 1
                )}
              </span>
              <Labels step={step} state={state} className="mt-2 px-2" />
            </div>
          );

          return (
            <li
              key={i}
              className={cn("flex items-start", !last && "flex-1")}
              aria-current={state === "current" ? "step" : undefined}
            >
              {clickableStep ? (
                <button
                  type="button"
                  onClick={() => handleStepClick(i, step)}
                  className="group rounded-[var(--radius-md)] cursor-pointer"
                >
                  {content}
                </button>
              ) : (
                content
              )}
              {!last && (
                <span
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full transition-colors",
                    connectorMt,
                    i < current ? "bg-accent" : "bg-hairline"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

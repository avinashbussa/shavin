"use client";
import * as React from "react";
import { forwardRef, useState, useRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const textFieldVariants = cva(
  "w-full rounded-[var(--radius-lg)] border text-fg transition placeholder:text-fg-subtle disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      /**
       * outline (default): a 3:1 control border (WCAG 1.4.11), for forms on any background.
       * soft: filled, no border, for dense tool panels where a visible label and the value or
       * placeholder identify the field. Both show the 2px focus ring.
       */
      variant: {
        outline: "bg-surface",
        soft: "bg-surface-hover hover:bg-hairline/60",
      },
      size: {
        sm: "h-8 px-2.5 text-xs",
        md: "h-10 px-3 text-base md:text-sm",
        lg: "h-12 px-3.5 text-base",
      },
      invalid: {
        true: "border-danger focus-visible:outline-danger",
        false: "",
      },
    },
    compoundVariants: [
      { variant: "outline", invalid: false, class: "border-border-control" },
      { variant: "soft", invalid: false, class: "border-transparent" },
    ],
    defaultVariants: { variant: "outline", size: "md", invalid: false },
  },
);

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof textFieldVariants> {
  /** Icon rendered inside the field, pinned to the left edge. */
  leadingIcon?: ReactNode;
  /** Icon rendered inside the field, pinned to the right edge. */
  trailingIcon?: ReactNode;
  /** Optional label text rendered above the field. */
  label?: string;
  /** Optional hint/helper text rendered below the field. */
  hint?: string;
  /** Number of digits/slots when type="otp". Default 6. */
  length?: number | string;
  /** Whether to mask digits with bullet dots (for PIN / password OTP codes) or mask password text. Default false. */
  mask?: boolean;
  /** Optional separator element or character rendered midway (e.g. '-' or index=3 for 3-3 split). */
  separator?: ReactNode;
  /** Index position to render the separator (defaults to Math.floor(length / 2)). */
  separatorIndex?: number;
  /** Callback fired when all OTP digits have been entered. */
  onComplete?: (code: string) => void;
  /** Optional custom CSS class name applied directly to individual OTP slot boxes. */
  slotClassName?: string;
  /** Password-only: render the built-in show/hide (Eye/EyeOff) trailing button. Ignored for other types. */
  showHidePassword?: boolean;
  /** Error message text — when set, the field renders in invalid/error state and shows this message below the input. */
  errorMessage?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    className,
    slotClassName,
    variant,
    size = "md",
    invalid = false,
    leadingIcon,
    trailingIcon,
    label,
    hint,
    type,
    length = 6,
    mask = false,
    separator,
    separatorIndex,
    onComplete,
    showHidePassword,
    errorMessage,
    value,
    defaultValue,
    onChange,
    disabled,
    id: customId,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const inputId = customId || autoId;
  const resolvedSize = size ?? "md";
  // Hint and error text are linked to the input so they are read with it (WCAG 1.3.1,
  // 3.3.1); an error message or `invalid` also sets aria-invalid.
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [props["aria-describedby"], errorMessage ? errorId : hint ? hintId : undefined].filter(Boolean).join(" ") || undefined;
  const fieldA11y = {
    "aria-describedby": describedBy,
    "aria-invalid": invalid || Boolean(errorMessage) || props["aria-invalid"] || undefined,
  };

  // --- OTP Verification Input Mode ---
  const isOtp = type === "otp";
  const numLength = Math.min(typeof length === "string" ? parseInt(length, 10) || 6 : (Number(length) || 6), 10);
  const [internalOtpVal, setInternalOtpVal] = useState<string>(
    defaultValue !== undefined ? String(defaultValue).slice(0, numLength) : ""
  );
  const [isFocused, setIsFocused] = useState(false);
  const [caretPos, setCaretPos] = useState<number>(0);
  const innerInputRef = useRef<HTMLInputElement>(null);

  // Password visibility toggle state — declared BEFORE the OTP early return
  // so hook count is stable across type changes (Rules of Hooks).
  const [pwVisible, setPwVisible] = useState(false);

  const otpValue = value !== undefined ? String(value).slice(0, numLength) : internalOtpVal;
  const effectiveSepIndex = separatorIndex !== undefined ? separatorIndex : Math.floor(numLength / 2);
  // When separatorIndex is explicitly set but no separator character is given,
  // default to a hyphen so the split is visually rendered.
  const effectiveSeparator = separator ?? (separatorIndex !== undefined ? "-" : undefined);

  const syncCaret = () => {
    if (innerInputRef.current) {
      setCaretPos(innerInputRef.current.selectionStart ?? otpValue.length);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, numLength);
    if (value === undefined) {
      setInternalOtpVal(raw);
    }
    onChange?.(e);
    setCaretPos(raw.length);
    if (raw.length === numLength) {
      onComplete?.(raw);
    }
  };

  const handleSlotClick = (index: number) => {
    if (disabled) return;
    if (innerInputRef.current) {
      innerInputRef.current.focus();
      const pos = Math.min(index, otpValue.length);
      innerInputRef.current.setSelectionRange(pos, pos);
      setCaretPos(pos);
    }
  };

  if (isOtp) {
    const slotSizeClasses =
      resolvedSize === "sm"
        ? "h-8 w-8 min-w-[2rem] text-xs"
        : resolvedSize === "lg"
        ? "h-12 w-12 min-w-[3rem] text-base"
        : "h-10 w-10 min-w-[2.5rem] text-sm";

    const otpSlots = (
      <div
        className={cn(
          "relative inline-flex items-center gap-2 select-none cursor-text",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={() => {
          if (!disabled && innerInputRef.current) {
            innerInputRef.current.focus();
          }
        }}
      >
        {/* Invisible real HTML input covering entire slot container for accessibility, mobile SMS, and paste */}
        <input
          ref={(node) => {
            (innerInputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }}
          id={inputId}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={numLength}
          value={otpValue}
          onChange={handleOtpChange}
          onFocus={() => {
            setIsFocused(true);
            syncCaret();
          }}
          onBlur={() => setIsFocused(false)}
          onKeyUp={syncCaret}
          onKeyDown={syncCaret}
          onSelect={syncCaret}
          disabled={disabled}
          className="absolute inset-0 h-full w-full opacity-0 z-20 cursor-text select-none text-transparent bg-transparent caret-transparent"
          {...props}
          {...fieldA11y}
        />

        {/* Visual Slots */}
        <div className="relative z-10 flex items-center gap-2 select-none pointer-events-none">
          {Array.from({ length: numLength }).map((_, i) => {
            const digit = otpValue[i];
            const hasValue = digit !== undefined && digit !== "";
            const activeSlotIndex = Math.min(otpValue.length, numLength - 1);
            const isSlotActive = isFocused && i === activeSlotIndex;

            return (
              <React.Fragment key={i}>
                {effectiveSeparator && i === effectiveSepIndex && (
                  <span className="text-fg-muted font-mono px-0.5 select-none text-sm shrink-0">
                    {effectiveSeparator}
                  </span>
                )}
                <div
                  className={cn(
                    "relative shrink-0 flex items-center justify-center font-mono font-normal rounded-[var(--radius-lg)] border bg-surface transition-all text-fg",
                    slotSizeClasses,
                    // Slot boxes are the visible field: 3:1 control border (WCAG 1.4.11); the active
                    // slot shows the same 2px focus ring as other inputs (WCAG 2.4.7).
                    invalid
                      ? "border-danger ring-2 ring-danger/20 text-danger"
                      : isSlotActive
                      ? "border-transparent outline outline-2 -outline-offset-1 outline-[rgb(var(--focus))] text-fg shadow-1"
                      : hasValue
                      ? "border-border-control text-fg"
                      : "border-border-control text-fg-muted",
                    slotClassName
                  )}
                >
                  {hasValue ? (
                    <span className="font-mono select-none">
                      {mask ? "•" : digit}
                    </span>
                  ) : null}
                  {isSlotActive && !hasValue && (
                    <span
                      className="h-4 w-[1.5px] bg-accent rounded-full"
                      style={{ animation: "caret-blink 1s steps(2, start) infinite" }} // ds-lint-disable-line no-unknown-class — CSS keyframe animation name
                    />
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );

    if (!label && !hint && !errorMessage) return otpSlots;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className={cn("text-xs font-semibold text-fg-muted", resolvedSize === "sm" && "text-[11px]")}>
            {label}
          </label>
        )}
        {otpSlots}
        {errorMessage ? (
          <span id={errorId} className={cn("text-xs text-danger", resolvedSize === "sm" && "text-[11px]")}>
            {errorMessage}
          </span>
        ) : hint ? (
          <span id={hintId} className={cn("text-xs text-fg-subtle", resolvedSize === "sm" && "text-[11px]")}>
            {hint}
          </span>
        ) : null}
      </div>
    );
  }

  // --- Standard Text Input Mode ---
  const hasLeading = !!leadingIcon;
  const isPassword = (type ?? "text").toLowerCase() === "password";
  // Built-in visibility toggle defaults ON for password fields (prefilled in
  // Studio, changeable via the Show/Hide Toggle boolean in the props panel).
  // Explicit false opts out. A trailingIcon no longer REPLACES the toggle —
  // both can coexist (trailing icon sits left of the eye toggle).
  const usePwToggle = isPassword && showHidePassword !== false;
  const hasTrailingIcon = !!trailingIcon;
  const hasTrailing = hasTrailingIcon || usePwToggle;
  // Password masking: when mask is on and the eye toggle hasn't revealed it,
  // use type="password"; once revealed, switch to "text".
  const effectiveType = usePwToggle && pwVisible ? "text" : (isPassword && mask ? "password" : type);
  // When both a trailing icon and the eye toggle are present, the icon needs
  // extra right offset so it doesn't overlap the toggle.
  const hasBothTrailing = hasTrailingIcon && usePwToggle;
  const trailingPad = hasBothTrailing
    ? (resolvedSize === "sm" ? "pr-16" : resolvedSize === "lg" ? "pr-20" : "pr-[72px]")
    : (resolvedSize === "sm" ? "pr-8" : resolvedSize === "lg" ? "pr-10" : "pr-9");

  const input = (
    <input
      ref={ref}
      id={inputId}
      type={effectiveType}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        textFieldVariants({ variant, size, invalid }),
        hasLeading && (resolvedSize === "sm" ? "pl-8" : resolvedSize === "lg" ? "pl-10" : "pl-9"),
        hasTrailing && trailingPad,
        className,
      )}
      {...props}
      {...fieldA11y}
    />
  );

  const field = (!hasLeading && !hasTrailing) ? input : (
    <div className="relative w-full">
      {leadingIcon && (
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 flex items-center text-fg-muted",
            resolvedSize === "sm" ? "pl-2.5" : resolvedSize === "lg" ? "pl-3.5" : "pl-3",
          )}
        >
          {leadingIcon}
        </span>
      )}
      {input}
      {/* Trailing icon sits to the LEFT of the eye toggle when both exist */}
      {hasTrailingIcon && (
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 flex items-center text-fg-muted",
            usePwToggle
              ? (resolvedSize === "sm" ? "right-8" : resolvedSize === "lg" ? "right-10" : "right-9")
              : "right-0",
            resolvedSize === "sm" ? "pr-2.5" : resolvedSize === "lg" ? "pr-3.5" : "pr-3",
          )}
        >
          {trailingIcon}
        </span>
      )}
      {usePwToggle && (
        <button
          type="button"
          aria-label="Show password"
          aria-pressed={pwVisible}
          onClick={() => setPwVisible((v) => !v)}
          // At least 24px wide (WCAG 2.5.8); the icon stays where the padding put it.
          className={cn(
            "absolute inset-y-0 right-0 flex min-w-7 items-center justify-end text-fg-muted hover:text-fg transition-colors",
            resolvedSize === "sm" ? "pr-2.5" : resolvedSize === "lg" ? "pr-3.5" : "pr-3",
          )}
        >
          {pwVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );

  if (!label && !hint && !errorMessage) return field;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={inputId} className={cn("text-xs font-semibold text-fg-muted", resolvedSize === "sm" && "text-[11px]")}>
          {label}
        </label>
      )}
      {field}
      {errorMessage ? (
        <span id={errorId} className={cn("text-xs text-danger", resolvedSize === "sm" && "text-[11px]")}>
          {errorMessage}
        </span>
      ) : hint ? (
        <span id={hintId} className={cn("text-xs text-fg-subtle", resolvedSize === "sm" && "text-[11px]")}>
          {hint}
        </span>
      ) : null}
    </div>
  );
});


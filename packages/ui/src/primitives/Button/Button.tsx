import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { hitAreaClass, type HitArea } from "../../lib/hit-area";
import { useButtonState } from "../../lib/buttonState";
import { Spinner } from "../Spinner";

export const buttonVariants = cva(
  "hit-area-touch relative inline-flex items-center justify-center gap-2 font-medium transition [&:not([data-inert])]:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 data-[inert=reason]:cursor-not-allowed data-[inert=reason]:opacity-40 data-[inert=loading]:cursor-progress",
  {
    variants: {
      variant: {
        solid: "",
        soft: "",
        outline: "border bg-fg/[0.04]",
        ghost: "bg-transparent",
      },
      tone: {
        brand: "",
        danger: "",
      },
      size: {
        sm: "h-8 gap-1.5 rounded-[var(--radius-lg)] px-3 text-xs",
        md: "h-10 rounded-[var(--radius-lg)] px-4 text-sm",
        lg: "h-12 rounded-[var(--radius-xl)] px-5 text-base",
      },
    },
    compoundVariants: [
      { variant: "solid", tone: "brand", class: "bg-brand-solid text-brand-fg [&:not([data-inert])]:hover:bg-brand-solid-hover" },
      { variant: "solid", tone: "danger", class: "bg-danger text-danger-fg [&:not([data-inert])]:hover:opacity-90" },
      {
        variant: "soft",
        tone: "brand",
        class: "bg-brand-subtle text-brand-contrast [&:not([data-inert])]:hover:bg-brand-subtle-hover",
      },
      {
        variant: "soft",
        tone: "danger",
        class: "bg-danger/[0.12] text-danger [&:not([data-inert])]:hover:bg-danger/[0.18]",
      },
      { variant: "outline", tone: "brand", class: "border-hairline text-fg [&:not([data-inert])]:hover:bg-fg/[0.08]" },
      {
        variant: "outline",
        tone: "danger",
        class: "border-danger text-danger [&:not([data-inert])]:hover:bg-danger/[0.08]",
      },
      { variant: "ghost", tone: "brand", class: "text-fg [&:not([data-inert])]:hover:bg-fg/[0.06]" },
      { variant: "ghost", tone: "danger", class: "text-danger [&:not([data-inert])]:hover:bg-danger/[0.08]" },
    ],
    defaultVariants: { variant: "solid", tone: "brand", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Whether text label truncates with ellipsis if container space is constrained. Default true. */
  truncate?: boolean;
  /** Icon rendered before the label. Size it to the text (e.g. an h-4 w-4 svg). */
  iconLeft?: ReactNode;
  /** Icon rendered after the label. */
  iconRight?: ReactNode;
  /**
   * Pending state while a request runs: a Spinner replaces `iconLeft` (or covers the label when
   * there is no icon), the width does not change, `aria-busy`, clicks are ignored, the button stays
   * focusable and shows the progress cursor. Not dimmed: it is busy, not unavailable.
   */
  loading?: boolean;
  /** Optional text shown and announced (polite) while `loading`, e.g. "Saving…". */
  loadingLabel?: string;
  /**
   * Why the action is unavailable ("Upgrade to Pro to export"). Renders the button `aria-disabled`
   * (not `disabled`) so it stays focusable and hoverable, with the reason in a Tooltip on hover and
   * keyboard focus, on tap for touch, and as its accessible description. Clicks do nothing.
   * Takes precedence over `disabled`.
   */
  disabledReason?: string;
  /**
   * Hit-area override (docs: "Target size"). "default": 24px floor, 44px on touch. "none": no hit area
   * growth (dense toolbars; may go below 24px, yours to own). "touch": always 44px on a coarse pointer.
   */
  hitArea?: HitArea;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    tone,
    size,
    type = "button",
    asChild = false,
    truncate = true,
    iconLeft,
    iconRight,
    children,
    loading,
    loadingLabel,
    disabledReason,
    hitArea,
    disabled,
    onClick,
    onPointerDown,
    style,
    "aria-describedby": describedBy,
    ...props
  },
  ref,
) {
  const { inert, buttonProps, wrap } = useButtonState({
    disabled,
    loading,
    loadingLabel,
    disabledReason,
    onClick,
    onPointerDown,
    "aria-describedby": describedBy,
    style,
    ref,
  });
  const isLoading = inert === "loading";
  const spinner = (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center">
      <Spinner size="md" label="" />
    </span>
  );
  // With an icon, the spinner takes its slot. Without one (and no loadingLabel), the label keeps its
  // width at opacity 0 (still the accessible name) and the spinner sits centred over it.
  const coverLabel = isLoading && !iconLeft && !loadingLabel;
  const leading = isLoading && !coverLabel ? spinner : iconLeft;
  const label = isLoading && loadingLabel ? loadingLabel : children;

  // asChild: Radix Slot merges the button props onto the child element (e.g. <a href>).
  // Icons ride along as siblings of <Slottable>, passed as direct children so Slot
  // finds the Slottable (inside a Fragment it would merge onto the Fragment).
  if (asChild) {
    return (
      wrap(<Slot
        {...props}
        {...(buttonProps as Record<string, unknown>)}
        ref={buttonProps.ref as never}
        className={cn(buttonVariants({ variant, tone, size }), hitAreaClass(hitArea, "touch", "Button"), truncate && "max-w-full", className)}
      >
        {isLoading ? spinner : iconLeft && <span className="inline-flex shrink-0 items-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:!text-inherit">{iconLeft}</span>}
        <Slottable>{children}</Slottable>
        {iconRight && <span className="inline-flex shrink-0 items-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:!text-inherit">{iconRight}</span>}
      </Slot>)
    );
  }
  return (
    wrap(<button
      type={type}
      className={cn(
        buttonVariants({ variant, tone, size }),
        hitAreaClass(hitArea, "touch", "Button"),
        truncate && "max-w-full",
        className
      )}
      {...props}
      {...buttonProps}
    >
      {leading && <span className="inline-flex shrink-0 items-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:!text-inherit">{leading}</span>}
      {typeof label === "string" ? (
        <span className={cn("inline-block min-w-0", truncate ? "truncate" : "whitespace-normal", coverLabel && "opacity-0")}>
          {label}
        </span>
      ) : coverLabel ? (
        <span className="inline-flex items-center gap-2 opacity-0">{label}</span>
      ) : (
        label
      )}
      {iconRight && <span className={cn("inline-flex shrink-0 items-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:!text-inherit", coverLabel && "opacity-0")}>{iconRight}</span>}
      {coverLabel && <span className="absolute inset-0 flex items-center justify-center">{spinner}</span>}
    </button>)
  );
});

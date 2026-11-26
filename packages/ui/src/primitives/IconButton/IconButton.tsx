import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { hitAreaClass, type HitArea } from "../../lib/hit-area";
import { useButtonState } from "../../lib/buttonState";
import { Spinner } from "../Spinner";

export const iconButtonVariants = cva(
  "hit-area-touch inline-flex shrink-0 items-center justify-center transition [&:not([data-inert])]:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 data-[inert=reason]:cursor-not-allowed data-[inert=reason]:opacity-40 data-[inert=loading]:cursor-progress [&_svg]:!text-inherit",
  {
    variants: {
      variant: {
        solid: "",
        soft: "",
        outline: "border bg-surface",
        ghost: "bg-transparent",
      },
      tone: {
        brand: "",
        danger: "",
      },
      size: {
        sm: "h-8 w-8 rounded-[var(--radius-lg)] [&_svg]:h-4 [&_svg]:w-4",
        md: "h-10 w-10 rounded-[var(--radius-lg)] [&_svg]:h-5 [&_svg]:w-5",
        lg: "h-12 w-12 rounded-[var(--radius-xl)] [&_svg]:h-6 [&_svg]:w-6",
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
      { variant: "outline", tone: "brand", class: "border-hairline text-fg [&:not([data-inert])]:hover:bg-fg/[0.05]" },
      {
        variant: "outline",
        tone: "danger",
        class: "border-danger text-danger [&:not([data-inert])]:hover:bg-danger/[0.08]",
      },
      { variant: "ghost", tone: "brand", class: "text-fg-muted [&:not([data-inert])]:hover:bg-fg/[0.06] [&:not([data-inert])]:hover:text-fg" },
      { variant: "ghost", tone: "danger", class: "text-danger [&:not([data-inert])]:hover:bg-danger/[0.08]" },
    ],
    defaultVariants: { variant: "solid", tone: "brand", size: "md" },
  },
);

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">,
    VariantProps<typeof iconButtonVariants> {
  /** Mandatory ARIA accessible label string for screen reader name computation. */
  "aria-label": string;
  children: ReactNode;
  /** Pending state: a Spinner replaces the icon, `aria-busy`, clicks ignored, stays focusable, progress cursor. */
  loading?: boolean;
  /** Optional text announced (polite) when `loading` starts. */
  loadingLabel?: string;
  /**
   * Why the action is unavailable. Renders `aria-disabled` (focusable) with the reason in a Tooltip
   * on hover, focus and tap, and as the accessible description. Takes precedence over `disabled`.
   */
  disabledReason?: string;
  /**
   * Hit-area override (docs: "Target size"). "default": 24px floor, 44px on touch. "none": no hit area
   * growth (dense toolbars; may go below 24px, yours to own). "touch": always 44px on a coarse pointer.
   */
  hitArea?: HitArea;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    className,
    variant,
    tone,
    size,
    children,
    type = "button",
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
  return wrap(
    <button
      type={type}
      className={cn(iconButtonVariants({ variant, tone, size }), hitAreaClass(hitArea, "touch", "IconButton"), className)}
      {...props}
      {...buttonProps}
    >
      {inert === "loading" ? (
        <span aria-hidden="true" className="inline-flex items-center">
          <Spinner size={size === "lg" ? "lg" : "md"} label="" />
        </span>
      ) : (
        children
      )}
    </button>
  );
});

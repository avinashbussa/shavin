import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const iconButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 [&_svg]:!text-inherit",
  {
    variants: {
      variant: {
        solid: "",
        soft: "",
        outline: "border bg-surface",
        ghost: "bg-transparent",
      },
      tone: {
        accent: "",
        danger: "",
      },
      size: {
        sm: "h-8 w-8 rounded-[var(--radius-lg)] [&_svg]:h-4 [&_svg]:w-4",
        md: "h-10 w-10 rounded-[var(--radius-lg)] [&_svg]:h-5 [&_svg]:w-5",
        lg: "h-12 w-12 rounded-[var(--radius-xl)] [&_svg]:h-6 [&_svg]:w-6",
      },
    },
    compoundVariants: [
      { variant: "solid", tone: "accent", class: "bg-accent text-accent-fg hover:opacity-90" },
      { variant: "solid", tone: "danger", class: "bg-danger text-danger-fg hover:opacity-90" },
      {
        variant: "soft",
        tone: "accent",
        class: "bg-accent-subtle text-accent-contrast hover:bg-accent-subtle-hover",
      },
      {
        variant: "soft",
        tone: "danger",
        class: "bg-[rgb(var(--danger)/0.12)] text-danger hover:bg-[rgb(var(--danger)/0.18)]",
      },
      { variant: "outline", tone: "accent", class: "border-hairline text-fg hover:bg-fg/[0.05]" },
      {
        variant: "outline",
        tone: "danger",
        class: "border-danger text-danger hover:bg-[rgb(var(--danger)/0.08)]",
      },
      { variant: "ghost", tone: "accent", class: "text-fg-muted hover:bg-fg/[0.06] hover:text-fg" },
      { variant: "ghost", tone: "danger", class: "text-danger hover:bg-[rgb(var(--danger)/0.08)]" },
    ],
    defaultVariants: { variant: "solid", tone: "accent", size: "md" },
  },
);

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">,
    VariantProps<typeof iconButtonVariants> {
  /** Mandatory ARIA accessible label string for screen reader name computation. */
  "aria-label": string;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, variant, tone, size, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(iconButtonVariants({ variant, tone, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
});

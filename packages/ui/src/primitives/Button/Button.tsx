import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        solid: "",
        soft: "",
        outline: "border bg-fg/[0.04]",
        ghost: "bg-transparent",
      },
      tone: {
        accent: "",
        danger: "",
      },
      size: {
        sm: "h-8 gap-1.5 rounded-[var(--radius-lg)] px-3 text-xs",
        md: "h-10 rounded-[var(--radius-lg)] px-4 text-sm",
        lg: "h-12 rounded-[var(--radius-xl)] px-5 text-base",
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
      { variant: "outline", tone: "accent", class: "border-hairline text-fg hover:bg-fg/[0.08]" },
      {
        variant: "outline",
        tone: "danger",
        class: "border-danger text-danger hover:bg-[rgb(var(--danger)/0.08)]",
      },
      { variant: "ghost", tone: "accent", class: "text-fg hover:bg-fg/[0.06]" },
      { variant: "ghost", tone: "danger", class: "text-danger hover:bg-[rgb(var(--danger)/0.08)]" },
    ],
    defaultVariants: { variant: "solid", tone: "accent", size: "md" },
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
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, tone, size, type = "button", asChild = false, truncate = true, iconLeft, iconRight, children, ...props },
  ref,
) {
  // asChild: Radix Slot merges the button props onto the child element (e.g. <a href>).
  // Icons ride along as siblings of <Slottable>, passed as direct children so Slot
  // finds the Slottable (inside a Fragment it would merge onto the Fragment).
  if (asChild) {
    return (
      <Slot
        ref={ref as never}
        className={cn(buttonVariants({ variant, tone, size }), truncate && "max-w-full", className)}
        {...props}
      >
        {iconLeft && <span className="inline-flex shrink-0 items-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:!text-inherit">{iconLeft}</span>}
        <Slottable>{children}</Slottable>
        {iconRight && <span className="inline-flex shrink-0 items-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:!text-inherit">{iconRight}</span>}
      </Slot>
    );
  }
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        buttonVariants({ variant, tone, size }),
        truncate && "max-w-full",
        className
      )}
      {...props}
    >
      {iconLeft && <span className="inline-flex shrink-0 items-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:!text-inherit">{iconLeft}</span>}
      {typeof children === "string" ? (
        <span className={cn("inline-block min-w-0", truncate ? "truncate" : "whitespace-normal")}>
          {children}
        </span>
      ) : (
        children
      )}
      {iconRight && <span className="inline-flex shrink-0 items-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:!text-inherit">{iconRight}</span>}
    </button>
  );
});

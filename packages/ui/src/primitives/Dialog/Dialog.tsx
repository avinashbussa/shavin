"use client";
import { useCallback, useState, type ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const modalPanelVariants = cva(
  "animate-modal-in w-full overflow-hidden rounded-[var(--radius-panel)] border border-hairline shadow-modal focus:outline-none",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-2xl",
      },
    },
    defaultVariants: { size: "sm" },
  },
);
const panelVariants = modalPanelVariants;

export interface DialogProps extends VariantProps<typeof panelVariants> {
  /** Heading shown at the top of the dialog (also its accessible name). */
  title: ReactNode;
  /** Supporting line under the title (also its accessible description). */
  description?: ReactNode;
  /** @deprecated Use `description`. */
  subtitle?: ReactNode;
  /** Controlled open state. Pair with `onOpenChange`. */
  open?: boolean;
  /** Initial open state when uncontrolled. Default: closed when `trigger` is set, otherwise open. */
  defaultOpen?: boolean;
  /** Called whenever the dialog asks to open or close (trigger, Escape, backdrop, close button). */
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the dialog, e.g. `<Button>Edit profile</Button>`. */
  trigger?: ReactNode;
  /** Called after the close animation finishes. Use it to unmount a dialog you render conditionally. */
  onClose?: () => void;
  /** Dialog body. */
  children?: ReactNode;
  /** Footer actions, right-aligned. Wrap a button in `<DialogClose asChild>` to close from it. */
  footer?: ReactNode;
  /** Whether clicking the backdrop closes the dialog. Default true. */
  dismissible?: boolean;
  /**
   * Header treatment. `default`: left-aligned title row with a close button. `centered`: centred title and
   * description, no header row (for confirmations, success and invite moments). `bare`: no header row; the title
   * and description sit above the content with no chrome (for forms and pickers that lead with their content).
   */
  layout?: "default" | "centered" | "bare";
  /** Hairlines between header, body and footer. Default: on for `default`, off for `centered` and `bare`. */
  divided?: boolean;
  /** Footer button alignment. `stretch` makes buttons share the row (good on mobile). Default `end`. */
  footerAlign?: "start" | "center" | "end" | "between" | "stretch";
}

const footerAlignClass = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  stretch: "[&>*]:flex-1",
} as const;

export function Dialog({
  title,
  description,
  subtitle,
  open: openProp,
  defaultOpen,
  onOpenChange,
  trigger,
  onClose,
  children,
  footer,
  size,
  dismissible = true,
  layout = "default",
  divided,
  footerAlign = "end",
}: DialogProps) {
  const hasRules = divided ?? layout === "default";
  // Without `open`, `trigger` or `defaultOpen` the dialog is open as soon as it mounts
  // (the original API: render it to show it, unmount it in onClose).
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? !trigger);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const desc = description ?? subtitle;

  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="animate-overlay fixed inset-0 z-[80]" />
        <RadixDialog.Content
          className="animate-modal-wrap fixed inset-0 z-[80] flex items-center justify-center p-4"
          // No description: tell Radix so it does not warn about a missing one.
          {...(desc ? {} : { "aria-describedby": undefined })}
          onPointerDownOutside={(e) => !dismissible && e.preventDefault()}
          onClick={(e) => {
            if (dismissible && e.target === e.currentTarget) close();
          }}
          onAnimationEnd={(e) => {
            if (!open && e.target === e.currentTarget) onClose?.();
          }}
        >
          <div data-panel className={panelVariants({ size })}>
            {layout === "default" ? (
              <div className={cn("flex items-start gap-3 px-5 py-4", hasRules && "border-b border-hairline")}>
                <div className="min-w-0 flex-1">
                  <RadixDialog.Title className="font-subheading text-lg font-semibold tracking-tight">
                    {title}
                  </RadixDialog.Title>
                  {desc && (
                    <RadixDialog.Description className="mt-0.5 text-sm text-fg-muted">{desc}</RadixDialog.Description>
                  )}
                </div>
                <CloseButton onClose={close} className="-mr-1.5 -mt-0.5" />
              </div>
            ) : (
              <div
                className={cn(
                  "relative px-6 pt-6",
                  layout === "centered" && "text-center",
                  hasRules && "border-b border-hairline pb-4",
                  !children && !hasRules && "pb-2",
                )}
              >
                {layout === "bare" && <CloseButton onClose={close} className="absolute right-4 top-4" />}
                <RadixDialog.Title className={cn("font-subheading text-lg font-semibold tracking-tight", layout === "bare" && "pr-8")}>
                  {title}
                </RadixDialog.Title>
                {desc && (
                  <RadixDialog.Description className="mt-1 text-sm text-fg-muted">{desc}</RadixDialog.Description>
                )}
              </div>
            )}

            {children && (
              <div className={layout === "default" ? "p-5" : cn("px-6 pb-2", hasRules ? "py-5" : "pt-4")}>{children}</div>
            )}

            {footer && (
              <div
                className={cn(
                  "flex gap-2",
                  layout === "default" ? "px-5 py-3" : "px-6 pb-6 pt-4",
                  hasRules && "border-t border-hairline",
                  hasRules && layout !== "default" && "pt-4",
                  layout === "centered" && footerAlign === "end" ? footerAlignClass.center : footerAlignClass[footerAlign],
                )}
              >
                {footer}
              </div>
            )}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Closes the surrounding Dialog. Use `asChild` to make a footer button close it. */
export const DialogClose = RadixDialog.Close;

export function CloseButton({
  onClose,
  className,
}: {
  onClose: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClose}
      aria-label="Close"
      className={cn(
        "shrink-0 rounded-[var(--radius-lg)] p-1.5 text-fg-muted transition hover:bg-surface-hover hover:text-fg active:scale-[0.97]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

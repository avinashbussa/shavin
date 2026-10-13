"use client";
import { useCallback, useState, type ReactNode, type CSSProperties } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { CloseButton } from "../Dialog/Dialog";

/**
 * Drawer — edge-mounted overlay panel built on Radix Dialog.
 *
 * Slides in from `side="left"` or `side="right"` with directional
 * slide-in/slide-out animations. Unlike `Sidebar` (which is an in-flow
 * layout primitive), the Drawer overlays content with a backdrop and
 * dismisses on outside click / Escape. Use it for temporary contextual
 * panels: filters, inspectors, quick settings, mobile navigation.
 *
 * Variants (presentation only):
 *   - "floating": inset card with margin, rounded corners, shadow (default)
 *   - "fixed":    flush against the screen edge, full-height panel
 */

// ── Panel width variants ──────────────────────────────────────────────
const drawerPanelVariants = cva(
  "fixed top-0 bottom-0 z-[80] flex flex-col overflow-hidden bg-surface shadow-modal focus:outline-none",
  {
    variants: {
      side: {
        left: "left-0 h-svh w-full max-w-[85vw] border-r border-hairline",
        right: "right-0 h-svh w-full max-w-[85vw] border-l border-hairline",
      },
      variant: {
        fixed: "",
        floating: "",
      },
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-2xl",
      },
    },
    compoundVariants: [
      // Floating left: inset with margin, rounded right edge
      {
        side: "left",
        variant: "floating",
        className:
          "top-2.5 bottom-2.5 left-2.5 h-[calc(100svh-1.25rem)] rounded-[var(--radius-panel)] border border-hairline shadow-panel",
      },
      // Floating right: inset with margin, rounded left edge
      {
        side: "right",
        variant: "floating",
        className:
          "top-2.5 bottom-2.5 right-2.5 h-[calc(100svh-1.25rem)] rounded-[var(--radius-panel)] border border-hairline shadow-panel",
      },
    ],
    defaultVariants: { side: "right", variant: "floating", size: "md" },
  },
);

export interface DrawerProps extends VariantProps<typeof drawerPanelVariants> {
  /** Whether the drawer is open. */
  open: boolean;
  /** Callback fired when drawer requests to close (Escape, backdrop click, close button). */
  onClose: () => void;
  /** Drawer header title (string or custom content like a logo). */
  title: ReactNode;
  /** Optional subtitle line below title. */
  subtitle?: string;
  /** Edge the drawer slides in from. Default "right". */
  side?: "left" | "right";
  /** Presentation variant. "floating" = inset card (default), "fixed" = flush edge. */
  variant?: "fixed" | "floating";
  /** Panel max-width. sm (384px), md (448px), lg (512px), xl (672px). Default "md". */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether clicking the backdrop closes the drawer. Default true. */
  dismissible?: boolean;
  /** Backdrop opacity intensity 0–1. Default uses the theme's --overlay-opacity token. */
  overlayOpacity?: number;
  /** Drawer body content. */
  children?: ReactNode;
  /** Footer slot rendered at the bottom (e.g. action buttons). */
  footer?: ReactNode;
  /** Additional className overrides for the panel. */
  className?: string;
  /** Additional className overrides for the header container. */
  headerClassName?: string;
  /** Whether to use modal mode (focus trap + pointer event blocking). Default true. Set false to allow nested popovers/menus. */
  modal?: boolean;
}

export function Drawer({
  open: controlledOpen,
  onClose,
  title,
  subtitle,
  side = "right",
  variant = "floating",
  size = "md",
  dismissible = true,
  overlayOpacity,
  children,
  footer,
  className,
  headerClassName,
  modal = true,
}: DrawerProps) {
  const [internalOpen, setInternalOpen] = useState(true);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const close = useCallback(() => {
    if (isControlled) {
      // Controlled: tell parent to set open=false. Radix will see open=false,
      // set data-state="closed", and Presence keeps content mounted while
      // the CSS exit animation runs. The parent must NOT unmount the Drawer
      // here — just set open=false. Radix unmounts portal content after anim.
      onClose();
    } else {
      // Uncontrolled: flip internal state. Radix triggers exit animation.
      // onAnimationEnd fires onClose() after the animation completes so
      // the parent can unmount the component.
      setInternalOpen(false);
    }
  }, [isControlled, onClose]);

  // Enter animation class — plays on mount via plain CSS class.
  // Exit animation is driven by [data-state="closed"].animate-drawer-exit
  // in global.css (higher specificity overrides the enter class).
  const enterClass =
    side === "left"
      ? "animate-drawer-left-in"
      : "animate-drawer-right-in";

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(next) => {
      // When not dismissible, ignore outside-triggered close requests.
      // The close button still works because it calls onClose() directly
      // (not through onOpenChange).
      if (!next && !dismissible) return;
      if (!next) close();
    }} modal={modal}>
      <RadixDialog.Portal>
        {modal ? (
          <RadixDialog.Overlay
            className={cn(
              "animate-overlay fixed inset-0 z-[80]",
              !dismissible && "pointer-events-none",
            )}
            style={overlayOpacity !== undefined ? { "--overlay-opacity": overlayOpacity } as CSSProperties : undefined}
          />
        ) : (
          // When modal={false}, Radix Dialog.Overlay returns null — no overlay
          // is emitted to the DOM at all. We render a manual backdrop div so the
          // drawer still gets a visual dimming layer. Placing it as a direct
          // child of Portal means Radix's Presence wraps it, giving us the same
          // enter/exit animation lifecycle as the native Overlay. data-state is
          // set manually so [data-state="closed"].animate-overlay triggers the
          // fade-out exit animation.
          <div
            className={cn(
              "animate-overlay fixed inset-0 z-[80]",
              !dismissible && "pointer-events-none",
            )}
            style={overlayOpacity !== undefined ? { "--overlay-opacity": overlayOpacity } as CSSProperties : undefined}
            data-state={isOpen ? "open" : "closed"}
          />
        )}
        <RadixDialog.Content
          className={cn(
            drawerPanelVariants({ side, variant, size }),
            enterClass,
            // Plain CSS class — NOT a Tailwind variant.
            // The CSS rule [data-state="closed"].animate-drawer-exit[data-side="..."]
            // matches when Radix flips data-state to "closed" on dismiss.
            "animate-drawer-exit",
            className,
          )}
          data-side={side}
          data-variant={variant}
          onPointerDownOutside={(e) => {
            if (!dismissible) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (!dismissible) e.preventDefault();
          }}
          onAnimationEnd={(e) => {
            // For uncontrolled mode: fire onClose after exit animation
            // so the parent can unmount the component.
            // For controlled mode: onClose was already called in close(),
            // and the parent set open=false — Radix handles unmounting.
            if (!isOpen && !isControlled && e.target === e.currentTarget) onClose();
          }}
        >
          {/* Header */}
          <div className={cn("flex items-center gap-3 border-b border-hairline px-5 py-4 shrink-0", headerClassName)}>
            <div className="min-w-0 flex-1">
              <RadixDialog.Title className="font-subheading text-lg font-semibold tracking-tight">
                {title}
              </RadixDialog.Title>
              {subtitle && (
                <RadixDialog.Description className="mt-0.5 truncate text-sm text-fg-muted">
                  {subtitle}
                </RadixDialog.Description>
              )}
            </div>
            <CloseButton onClose={close} className="-mr-1.5 -mt-0.5" />
          </div>

          {/* Body */}
          {children && (
            <div data-panel className="pg-scroll flex-1 overflow-y-auto p-5">
              {children}
            </div>
          )}

          {/* Footer */}
          {footer && (
            <div className="flex justify-end gap-2 border-t border-hairline px-5 py-3 shrink-0">
              {footer}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export { drawerPanelVariants };

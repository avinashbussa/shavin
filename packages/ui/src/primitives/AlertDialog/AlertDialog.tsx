"use client";
import React, { type ReactNode } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "../../lib/cn";
import { useReturnFocus } from "../../lib/useReturnFocus";
import { modalPanelVariants } from "../Dialog/Dialog";
import { Button } from "../Button/Button";
import { AlertTriangle, CheckCircle2, Info, Trash2 } from "lucide-react";

export interface AlertDialogProps {
  /** Whether alert dialog is open. */
  open: boolean;
  /** Callback fired when open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Title of the alert dialog. */
  title: string;
  /** Optional body description element. */
  description?: ReactNode;
  /** Confirm action button label. Default 'Confirm'. */
  confirmLabel?: string;
  /** Cancel action button label. Default 'Cancel'. */
  cancelLabel?: string;
  /** Callback fired when user clicks confirm button. */
  onConfirm: () => void;
  /** Styles confirm action as danger. Deprecated: use intent='danger'. */
  danger?: boolean;
  /** Visual intent/tone: info, warning, success, danger, default. */
  intent?: "info" | "warning" | "success" | "danger" | "default";
  /** Layout alignment: default (left-aligned) or centered. */
  layout?: "default" | "centered";
  /** Optional badge text below title. */
  badgeText?: string;
  /** Optional custom icon element override. */
  icon?: ReactNode;
  /** Children element slot. */
  children?: ReactNode;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  danger = false,
  intent = "default",
  layout = "default",
  badgeText,
  icon,
  children,
}: AlertDialogProps) {
  const resolvedIntent = danger ? "danger" : intent;

  const defaultIcons = {
    danger: <Trash2 className="h-5 w-5 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 shrink-0" />,
    info: <Info className="h-5 w-5 shrink-0" />,
    default: null,
  };

  const largeIcons = {
    danger: <Trash2 className="h-6 w-6 shrink-0" />,
    warning: <AlertTriangle className="h-6 w-6 shrink-0" />,
    success: <CheckCircle2 className="h-6 w-6 shrink-0" />,
    info: <Info className="h-6 w-6 shrink-0" />,
    default: null,
  };

  const iconElement = icon || (layout === "centered" ? largeIcons[resolvedIntent] : defaultIcons[resolvedIntent]);

  const circleClasses = {
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/15 text-warning",
    success: "bg-success/15 text-success",
    info: "bg-accent/10 text-accent",
    default: "bg-surface-hover text-fg",
  };

  const confirmClasses = {
    danger: "bg-danger text-danger-fg",
    warning: "bg-warning text-warning-fg hover:opacity-90",
    success: "bg-success text-success-fg hover:opacity-90",
    info: "bg-accent text-accent-fg",
    default: "bg-accent text-accent-fg",
  };

  const returnFocus = useReturnFocus(open);
  const resolvedCircleClass = circleClasses[resolvedIntent];
  const confirmButtonClass = confirmClasses[resolvedIntent];

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="animate-overlay fixed inset-0 z-[85]" />
        <AlertDialogPrimitive.Content
          className="animate-modal-wrap fixed inset-0 z-[85] flex items-center justify-center p-4"
          // No description: tell Radix so it does not warn about a missing one.
          {...(description ? {} : { "aria-describedby": undefined })}
          onCloseAutoFocus={returnFocus}
        >
          <div data-panel className={cn(modalPanelVariants({ size: "sm" }), "p-6")}>
            {layout === "centered" ? (
              <div className="flex flex-col items-center text-center">
                {iconElement && (
                  <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mb-4 shrink-0", resolvedCircleClass)}>
                    {iconElement}
                  </div>
                )}
                <AlertDialogPrimitive.Title className="font-subheading text-lg font-semibold text-center w-full">
                  {title}
                </AlertDialogPrimitive.Title>
                {badgeText && (
                  <div className="mt-2">
                    <span className={cn(
                      "px-2.5 py-0.5 text-xs font-semibold rounded-full border",
                      resolvedIntent === "danger" ? "bg-danger/10 text-danger border-danger/20" :
                      resolvedIntent === "warning" ? "bg-warning/15 text-warning border-warning/20" :
                      resolvedIntent === "success" ? "bg-success/15 text-success border-success/20" :
                      "bg-accent/10 text-accent border-accent/20"
                    )}>
                      {badgeText}
                    </span>
                  </div>
                )}
                {description && (
                  <AlertDialogPrimitive.Description className="mt-3.5 text-sm text-fg-muted leading-relaxed text-center max-w-sm">
                    {description}
                  </AlertDialogPrimitive.Description>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3">
                {iconElement && <div className="mt-0.5 text-fg shrink-0">{iconElement}</div>}
                <div className="flex-1 text-left">
                  <AlertDialogPrimitive.Title className="font-subheading text-lg font-semibold">
                    {title}
                  </AlertDialogPrimitive.Title>
                  {badgeText && (
                    <div className="mt-1">
                      <span className="inline-block bg-surface-hover border border-hairline px-2 py-0.5 text-[10px] font-semibold rounded-[var(--radius-lg)]">
                        {badgeText}
                      </span>
                    </div>
                  )}
                  {description && (
                    <AlertDialogPrimitive.Description className="mt-1.5 text-sm text-fg-muted leading-relaxed">
                      {description}
                    </AlertDialogPrimitive.Description>
                  )}
                </div>
              </div>
            )}

            {children && <div className="mt-4 w-full">{children}</div>}

            <div className={cn("mt-6 gap-2.5", layout === "centered" ? "flex flex-col-reverse sm:flex-row sm:justify-center w-full" : "flex flex-row justify-end")}>
              <AlertDialogPrimitive.Cancel asChild>
                <Button
                  variant="outline"
                  className={cn(layout === "centered" ? "w-full sm:w-auto" : "")}
                >
                  {cancelLabel}
                </Button>
              </AlertDialogPrimitive.Cancel>
              <AlertDialogPrimitive.Action asChild>
                <Button
                  tone={resolvedIntent === "danger" ? "danger" : "accent"}
                  className={cn(
                    confirmButtonClass,
                    "font-semibold",
                    layout === "centered" ? "w-full sm:w-auto" : ""
                  )}
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </Button>
              </AlertDialogPrimitive.Action>
            </div>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

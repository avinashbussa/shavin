"use client";
import type { ReactNode, ComponentProps } from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export interface ContextMenuProps {
  /** Target trigger element — right-clicking anywhere inside opens context menu. */
  trigger: ReactNode;
  /** Context menu content items. */
  children: ReactNode;
  /** Optional custom class for ContextMenu content panel. */
  className?: string;
}

export function ContextMenu({
  trigger,
  children,
  className,
}: ContextMenuProps) {
  return (
    <ContextMenuPrimitive.Root>
      <ContextMenuPrimitive.Trigger asChild>{trigger}</ContextMenuPrimitive.Trigger>
      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content
          data-panel
          avoidCollisions
          collisionPadding={8}
          className={cn(
            "animate-rise origin-[var(--radix-context-menu-content-transform-origin)] z-[var(--z-floating)] min-w-44 overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-surface p-1 space-y-0.5 shadow-panel focus:outline-none select-none",
            className
          )}
        >
          {children}
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  );
}

export const contextMenuItemVariants = cva(
  "flex items-center w-full cursor-pointer px-2.5 h-7 text-left text-xs rounded-[var(--radius-md)] outline-none hover:bg-surface-hover data-[highlighted]:bg-surface-hover transition-colors",
  {
    variants: {
      variant: {
        default: "text-fg",
        danger: "border-t border-hairline text-danger",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function ContextMenuItem({
  className,
  variant,
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.Item> & VariantProps<typeof contextMenuItemVariants>) {
  return (
    <ContextMenuPrimitive.Item
      className={cn(contextMenuItemVariants({ variant }), className)}
      {...props}
    />
  );
}

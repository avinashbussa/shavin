"use client";
import { forwardRef, type ReactNode, type ButtonHTMLAttributes, type ComponentProps } from "react";
import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export interface MenuProps {
  /** Trigger element slot. */
  trigger: ReactNode;
  /** Menu content items. */
  children: ReactNode;
  /** Content alignment (start or end). Default start. */
  align?: "start" | "end";
  /** Called when the menu opens or closes (e.g. keep a hover-only trigger visible while open). */
  onOpenChange?: (open: boolean) => void;
}

export function Menu({
  trigger,
  children,
  align = "start",
  onOpenChange,
}: MenuProps) {
  return (
    <RadixMenu.Root onOpenChange={onOpenChange}>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          data-panel
          align={align}
          sideOffset={4}
          avoidCollisions
          collisionPadding={8}
          className="animate-rise origin-[var(--radix-dropdown-menu-content-transform-origin)] z-[90] w-52 overflow-hidden rounded-[var(--radius-panel)] border border-hairline shadow-panel focus:outline-none"
        >
          <div className="max-h-[calc(6.5*2.25rem)] overflow-y-auto py-1">
            {children}
          </div>
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}

export const MenuTrigger = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function MenuTrigger({ className, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "rounded-[var(--radius-lg)] p-2 text-fg-muted transition hover:bg-surface-hover hover:text-fg active:scale-[0.97]",
          className,
        )}
        {...props}
      >
        {children ?? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        )}
      </button>
    );
  },
);

const menuItemVariants = cva(
  "block w-full cursor-pointer px-3 py-2 text-left text-sm outline-none hover:bg-surface-hover data-[highlighted]:bg-surface-hover",
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

export function MenuItem({
  className,
  variant,
  ...props
}: ComponentProps<typeof RadixMenu.Item> & VariantProps<typeof menuItemVariants>) {
  return <RadixMenu.Item className={cn(menuItemVariants({ variant }), className)} {...props} />;
}

export function MenuSub({ children, ...props }: RadixMenu.DropdownMenuSubProps) {
  return <RadixMenu.Sub {...props}>{children}</RadixMenu.Sub>;
}

export const MenuSubTrigger = forwardRef<
  HTMLDivElement,
  RadixMenu.DropdownMenuSubTriggerProps & { className?: string; children: ReactNode }
>(function MenuSubTrigger({ className, children, ...props }, ref) {
  return (
    <RadixMenu.SubTrigger
      ref={ref}
      className={cn(
        "flex w-full cursor-default select-none items-center justify-between px-3 py-2 text-sm outline-none hover:bg-surface-hover data-[highlighted]:bg-surface-hover data-[state=open]:bg-surface-hover text-fg",
        className
      )}
      {...props}
    >
      {children}
      <svg viewBox="0 0 24 24" fill="none" className="ml-auto h-3.5 w-3.5 text-fg-muted" stroke="currentColor" strokeWidth="2">
        <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </RadixMenu.SubTrigger>
  );
});

export const MenuSubContent = forwardRef<
  HTMLDivElement,
  RadixMenu.DropdownMenuSubContentProps & { className?: string; children: ReactNode }
>(function MenuSubContent({ className, children, ...props }, ref) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.SubContent
        ref={ref}
        data-panel
        sideOffset={2}
        alignOffset={-5}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-surface shadow-panel animate-rise",
          className
        )}
        {...props}
      >
        <div className="max-h-[calc(6.5*2.25rem)] overflow-y-auto py-1">
          {children}
        </div>
      </RadixMenu.SubContent>
    </RadixMenu.Portal>
  );
});

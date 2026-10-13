"use client";
import { type ElementType, type ReactNode } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/cn";

export type TabVariant = "line" | "segmented" | "pills" | "button" | "pill";
export type TabOrientation = "horizontal" | "vertical";

export interface TabItem {
  value?: string;
  href?: string;
  label: ReactNode;
  icon?: ReactNode;
  content?: ReactNode;
  disabled?: boolean;
  active?: boolean;
  external?: boolean;
}

export interface TabsProps {
  /** Mode: "states" for in-page stateful panels (default), "navigation" for URL routing links. */
  as?: "states" | "navigation";
  /** Visual variant: "line" (default), "segmented", "pills", or "button". */
  variant?: TabVariant;
  /** Layout orientation: "horizontal" (default) or "vertical". */
  orientation?: "horizontal" | "vertical";
  /** Component size: "sm" (small) or "md" (medium, default). */
  size?: "sm" | "md";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** List of tab items. */
  items?: readonly TabItem[];
  /** Alias for items when passing data-driven tabs. */
  tabs?: readonly TabItem[];
  /** Router component for as="navigation" mode (defaults to "a"). */
  linkComponent?: ElementType;
  children?: ReactNode;
  className?: string;
}

function listClass(variant: TabVariant, o: TabOrientation, size: "sm" | "md" = "md") {
  if (variant === "button") {
    return cn(
      "flex items-center",
      size === "sm" ? "gap-0.5" : "gap-1",
      o === "vertical" && "flex-col items-stretch"
    );
  }
  if (variant === "pills" || variant === "pill") {
    return cn(
      "inline-flex border border-hairline/60 bg-surface-hover/80 w-fit",
      o === "vertical" ? "flex-col rounded-[var(--radius-panel)]" : "rounded-full",
      size === "sm" ? "gap-0.5 p-0.5" : "gap-1 p-1"
    );
  }
  if (variant === "segmented") {
    return cn(
      "inline-flex rounded-[var(--radius-panel)] border border-hairline w-fit",
      size === "sm" ? "gap-0.5 p-0.5" : "gap-0.5 p-1",
      o === "vertical" && "flex-col"
    );
  }
  return o === "vertical"
    ? cn("flex flex-col border-l border-hairline", size === "sm" ? "gap-0.5" : "gap-1")
    : cn("flex border-b border-hairline", size === "sm" ? "gap-0.5" : "gap-1");
}

function triggerClass(variant: TabVariant, o: TabOrientation, size: "sm" | "md" = "md") {
  const isSm = size === "sm";
  if (variant === "button") {
    return cn(
      "rounded-[var(--radius-lg)] font-medium text-fg-muted transition hover:bg-surface-hover hover:text-fg data-[state=active]:bg-surface-hover data-[state=active]:text-fg data-[state=active]:font-semibold",
      isSm ? "px-2 py-1 text-xs" : "px-2.5 py-1 text-sm"
    );
  }
  if (variant === "pills" || variant === "pill") {
    return cn(
      "rounded-full font-medium text-fg-muted transition hover:text-fg active:scale-[0.97] data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:font-semibold data-[state=active]:shadow-card data-[state=active]:border data-[state=active]:border-hairline/40",
      isSm ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
    );
  }
  if (variant === "segmented") {
    return cn(
      "rounded-[calc(var(--radius-panel)-2px)] text-fg-muted transition hover:bg-surface-hover active:scale-[0.97] data-[state=active]:bg-accent data-[state=active]:text-accent-fg",
      isSm ? "px-2.5 py-1 text-xs font-medium" : "px-3 py-1.5 text-sm font-medium"
    );
  }
  const active = "data-[state=active]:border-accent data-[state=active]:font-medium data-[state=active]:text-fg";
  const inactive = "data-[state=inactive]:border-transparent data-[state=inactive]:text-fg-muted data-[state=inactive]:hover:text-fg";
  return o === "vertical"
    ? cn("-ml-px border-l-2 text-left transition", isSm ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm", active, inactive)
    : cn("-mb-px border-b-2 transition", isSm ? "px-2.5 py-1.5 text-xs" : "px-3 py-2.5 text-sm", active, inactive);
}

export function Tabs({
  as = "states",
  variant = "line",
  orientation = "horizontal",
  size = "md",
  value,
  defaultValue,
  onValueChange,
  items,
  tabs,
  linkComponent: LinkComponent = "a",
  children,
  className,
}: TabsProps) {
  const resolvedItems = items ?? tabs ?? [];
  const isNavMode = as === "navigation";

  if (isNavMode) {
    return (
      <div className={cn(listClass(variant, orientation, size), className)} role="tablist">
        {resolvedItems.map((item, i) => {
          const isActive = item.active ?? (value ? item.value === value : false);
          return (
            <LinkComponent
              key={`${item.href ?? item.value ?? i}`}
              href={item.href ?? "#"}
              role="tab"
              aria-selected={isActive}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 font-medium transition cursor-pointer whitespace-nowrap",
                variant === "button"
                  ? cn(
                      "rounded-[var(--radius-lg)]",
                      size === "sm" ? "px-2 py-1 text-xs" : "px-2.5 py-1 text-sm",
                      isActive
                        ? "bg-surface-hover text-fg font-semibold"
                        : "text-fg-muted hover:bg-surface-hover hover:text-fg"
                    )
                  : variant === "pills" || variant === "pill"
                  ? cn(
                      "rounded-full",
                      size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
                      isActive
                        ? "bg-surface text-fg font-semibold shadow-card border border-hairline/40"
                        : "text-fg-muted hover:text-fg"
                    )
                  : variant === "segmented"
                  ? cn(
                      "rounded-[calc(var(--radius-panel)-2px)]",
                      size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
                      isActive
                        ? "bg-accent text-accent-fg"
                        : "text-fg-muted hover:bg-surface-hover hover:text-fg"
                    )
                  : cn(
                      orientation === "vertical"
                        ? cn("-ml-px border-l-2", size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm")
                        : cn("-mb-px border-b-2", size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2.5 text-sm"),
                      isActive
                        ? "border-accent text-fg font-medium"
                        : "border-transparent text-fg-muted hover:text-fg"
                    )
              )}
            >
              {item.icon && <span className="[&_svg]:h-4 [&_svg]:w-4">{item.icon}</span>}
              {item.label}
            </LinkComponent>
          );
        })}
        {children}
      </div>
    );
  }

  if (!resolvedItems || resolvedItems.length === 0) {
    return (
      <TabsPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        orientation={orientation}
        className={cn(orientation === "vertical" ? "flex gap-4" : "flex flex-col gap-1", className)}
      >
        {children}
      </TabsPrimitive.Root>
    );
  }

  const initialDefault = defaultValue ?? (resolvedItems[0]?.value ?? "0");
  const hasPanels = resolvedItems.some((t) => t.content != null);

  return (
    <TabsPrimitive.Root
      value={value}
      defaultValue={initialDefault}
      onValueChange={onValueChange}
      orientation={orientation}
      className={cn(orientation === "vertical" ? "flex gap-4" : "flex flex-col gap-1", className)}
    >
      <TabsPrimitive.List className={listClass(variant, orientation, size)}>
        {resolvedItems.map((t, idx) => {
          const itemVal = t.value ?? String(idx);
          return (
            <TabsPrimitive.Trigger
              key={itemVal}
              value={itemVal}
              disabled={t.disabled}
              className={cn("inline-flex items-center gap-1.5", triggerClass(variant, orientation, size))}
            >
              {t.icon && <span className="[&_svg]:h-4 [&_svg]:w-4">{t.icon}</span>}
              {t.label}
            </TabsPrimitive.Trigger>
          );
        })}
      </TabsPrimitive.List>
      {hasPanels && (
        <div className={orientation === "vertical" ? "flex-1" : ""}>
          {resolvedItems.map((t, idx) => {
            const itemVal = t.value ?? String(idx);
            return (
              <TabsPrimitive.Content
                key={itemVal}
                value={itemVal}
                className={cn("outline-none", orientation === "vertical" ? "" : "pt-4")}
              >
                {t.content}
              </TabsPrimitive.Content>
            );
          })}
        </div>
      )}
    </TabsPrimitive.Root>
  );
}

export function TabsList({
  children,
  className,
  variant = "line",
  orientation = "horizontal",
}: {
  children: ReactNode;
  className?: string;
  variant?: TabVariant;
  orientation?: TabOrientation;
}) {
  return (
    <TabsPrimitive.List className={cn(listClass(variant, orientation), className)}>
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  variant = "line",
  orientation = "horizontal",
  disabled,
}: {
  value: string;
  children: ReactNode;
  className?: string;
  variant?: TabVariant;
  orientation?: TabOrientation;
  disabled?: boolean;
}) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      disabled={disabled}
      className={cn(triggerClass(variant, orientation), className)}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TabsPrimitive.Content value={value} className={cn("pt-4 outline-none", className)}>
      {children}
    </TabsPrimitive.Content>
  );
}

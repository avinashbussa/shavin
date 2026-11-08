"use client";
import { type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/cn";
import { useSlidingIndicator } from "../../lib/useSlidingIndicator";

export type TabVariant = "line" | "segmented" | "pills" | "button" | "pill";
export type TabOrientation = "horizontal" | "vertical";

/** Variants that get an animated sliding active indicator (continuity between tabs). */
const SLIDING_TAB = new Set<TabVariant>(["line", "segmented", "pills", "pill"]);

/**
 * TabsPrimitive.List with a single active indicator that glides to the active trigger instead of each
 * trigger drawing its own. Measures the active trigger ([data-state="active"]) and watches for changes via
 * a MutationObserver, so it works for both data-driven and compositional (TabsList/TabsTrigger) usage.
 * Only the line (underline) and segmented (pill) variants slide; others render a plain list.
 */
function IndicatorList({
  variant,
  orientation,
  size = "md",
  className,
  children,
  "aria-label": ariaLabel,
}: {
  variant: TabVariant;
  orientation: TabOrientation;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const horizontal = orientation !== "vertical";
  const slides = SLIDING_TAB.has(variant);
  const { ref, indicatorRef, pos, size: indSize, on, transitionClass: transition } = useSlidingIndicator<HTMLDivElement>({
    enabled: slides,
    orientation,
    activeSelector: '[data-state="active"]',
  });

  const indStyle = horizontal
    ? { transform: `translateX(${pos}px)`, width: indSize }
    : { transform: `translateY(${pos}px)`, height: indSize };
  const hidden = !on && "opacity-0";

  return (
    <TabsPrimitive.List ref={slides ? ref : undefined} aria-label={ariaLabel} className={cn(slides && "relative", listClass(variant, orientation, size), className)}>
      {slides && (
        variant === "line" ? (
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className={cn("pointer-events-none absolute z-0 bg-accent", horizontal ? "bottom-0 h-0.5" : "left-0 w-0.5", transition, hidden)}
            style={indStyle}
          />
        ) : variant === "pills" || variant === "pill" ? (
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className={cn("pointer-events-none absolute z-0 rounded-full border border-hairline/40 bg-surface shadow-card", size === "sm" ? "top-0.5 bottom-0.5" : "top-1 bottom-1", transition, hidden)}
            style={indStyle}
          />
        ) : (
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className={cn("pointer-events-none absolute z-0 rounded-[calc(var(--radius-panel)-2px)] bg-accent", size === "sm" ? "top-0.5 bottom-0.5" : "top-1 bottom-1", transition, hidden)}
            style={indStyle}
          />
        )
      )}
      {children}
    </TabsPrimitive.List>
  );
}

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
  /** Names the tab list (states) or the `<nav>` landmark (navigation). */
  "aria-label"?: string;
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
    // Background comes from the sliding indicator; the trigger only toggles text.
    return cn(
      "relative z-10 rounded-full font-medium text-fg-muted transition hover:text-fg active:scale-[0.97] data-[state=active]:text-fg data-[state=active]:font-semibold",
      isSm ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
    );
  }
  if (variant === "segmented") {
    // Background comes from the sliding indicator; the trigger only toggles text.
    return cn(
      "relative z-10 rounded-[calc(var(--radius-panel)-2px)] text-fg-muted transition hover:text-fg active:scale-[0.97] data-[state=active]:text-accent-fg",
      isSm ? "px-2.5 py-1 text-xs font-medium" : "px-3 py-1.5 text-sm font-medium"
    );
  }
  // line: the underline comes from the sliding indicator; keep a transparent reserved border for layout.
  const active = "data-[state=active]:font-medium data-[state=active]:text-fg";
  const inactive = "data-[state=inactive]:text-fg-muted data-[state=inactive]:hover:text-fg";
  return o === "vertical"
    ? cn("relative z-10 -ml-px border-l-2 border-transparent text-left transition", isSm ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm", active, inactive)
    : cn("relative z-10 -mb-px border-b-2 border-transparent transition", isSm ? "px-2.5 py-1.5 text-xs" : "px-3 py-2.5 text-sm", active, inactive);
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
  "aria-label": ariaLabel,
}: TabsProps) {
  const resolvedItems = items ?? tabs ?? [];
  const isNavMode = as === "navigation";

  if (isNavMode) {
    return (
      // Page links are navigation, not tabs: a labelled <nav> with aria-current, no tab roles.
      <nav aria-label={ariaLabel} className={cn(listClass(variant, orientation, size), className)}>
        {resolvedItems.map((item, i) => {
          const isActive = item.active ?? (value ? item.value === value : false);
          return (
            <LinkComponent
              key={`${item.href ?? item.value ?? i}`}
              href={item.href ?? "#"}
              aria-current={isActive ? "page" : undefined}
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
      </nav>
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
      <IndicatorList variant={variant} orientation={orientation} size={size} aria-label={ariaLabel}>
        {resolvedItems.map((t, idx) => {
          const itemVal = t.value ?? String(idx);
          return (
            <TabsPrimitive.Trigger
              key={itemVal}
              value={itemVal}
              disabled={t.disabled}
              // Used as a filter with no panels here: don't point at panels that don't exist.
              {...(hasPanels ? {} : { "aria-controls": undefined })}
              className={cn("inline-flex items-center justify-center gap-1.5", triggerClass(variant, orientation, size))}
            >
              {t.icon && <span className="[&_svg]:h-4 [&_svg]:w-4">{t.icon}</span>}
              {t.label}
            </TabsPrimitive.Trigger>
          );
        })}
      </IndicatorList>
      {hasPanels && (
        <div className={orientation === "vertical" ? "flex-1" : ""}>
          {resolvedItems.map((t, idx) => {
            const itemVal = t.value ?? String(idx);
            return (
              <TabsPrimitive.Content
                key={itemVal}
                value={itemVal}
                className={cn(orientation === "vertical" ? "" : "pt-4")}
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
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  variant?: TabVariant;
  orientation?: TabOrientation;
  "aria-label"?: string;
}) {
  return (
    <IndicatorList variant={variant} orientation={orientation} className={className} aria-label={ariaLabel}>
      {children}
    </IndicatorList>
  );
}

/** Extra button props (aria-*, data-*, id, title, handlers) pass through to the Radix trigger and win over its own,
 *  e.g. `aria-controls` when the panel is rendered outside `<Tabs>`. */
export function TabsTrigger({
  value,
  children,
  className,
  variant = "line",
  orientation = "horizontal",
  disabled,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>, "value" | "children" | "className" | "disabled"> & {
  value: string;
  children: ReactNode;
  className?: string;
  variant?: TabVariant;
  orientation?: TabOrientation;
  disabled?: boolean;
}) {
  return (
    <TabsPrimitive.Trigger
      {...props}
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
  ...props
}: Omit<ComponentPropsWithoutRef<typeof TabsPrimitive.Content>, "value" | "children" | "className"> & {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TabsPrimitive.Content {...props} value={value} className={cn("pt-4", className)}>
      {children}
    </TabsPrimitive.Content>
  );
}

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useId,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { cn } from "../../lib/cn";
import { Tooltip } from "../Tooltip/Tooltip";
import { Text } from "../Text/Text";
import { Menu, PanelLeft, PanelRight } from "lucide-react";
import { useAppFrame } from "../AppShell/frame-context";
import { useResizable } from "../../lib/useResizable";
import { ResizeHandles, type ResizeHandleColor } from "../Resizable";

export interface SidebarContextValue {
  side: "left" | "right";
  variant: "fixed" | "collapsible" | "floating" | "inset";
  collapsibleMode: "icon" | "offcanvas" | "none";
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("Sidebar compound components must be used within a <Sidebar>");
  }
  return context;
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  /** Sidebar dock side: "left" (Sidenav, left panel) or "right" (Configurator, Inspector). Default "left". */
  side?: "left" | "right";
  /** Sidebar visual variant: fixed width, collapsible rail, floating card, or inset panel. Default "fixed". */
  variant?: "fixed" | "collapsible" | "floating" | "inset";
  /** Collapsible mode: "icon" rail collapse, "offcanvas" full hide, or "none". Default "icon". */
  collapsibleMode?: "icon" | "offcanvas" | "none";
  /** Controlled collapsed state. */
  collapsed?: boolean;
  /** Callback fired when collapsed state changes. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Initial default collapsed state. */
  defaultCollapsed?: boolean;
  /** Custom width CSS string (e.g. "w-60", "w-72", "w-80"). Default "w-60". */
  width?: string;
  /** Enable interactive drag resizability. Default false. */
  resizable?: boolean;
  /** Minimum width in pixels when resizable. Default 180. */
  minWidth?: number;
  /** Maximum width in pixels when resizable. Default 420. */
  maxWidth?: number;
  /** Remember the resized width in localStorage under this key. */
  persistKey?: string;
  /** Resize handle colour on hover, focus and drag. Default "accent-subtle". */
  resizeColor?: ResizeHandleColor;
  /** Custom sidebar content. */
  children?: ReactNode;
  /** Custom root class name. */
  className?: string;
}

export function Sidebar({
  side = "left",
  variant = "fixed",
  collapsibleMode = "icon",
  collapsed: controlledCollapsed,
  onCollapsedChange,
  defaultCollapsed = false,
  width = "w-60",
  resizable = false,
  minWidth = 180,
  maxWidth = 420,
  persistKey,
  resizeColor,
  children,
  className,
  style,
  ...props
}: SidebarProps) {
  const frame = useAppFrame();
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);

  // Inside a compact AppFrame the sidebar is a drawer: always shown in full, whatever its rail state.
  const isCollapsed = frame?.compact ? false : (controlledCollapsed ?? internalCollapsed);

  const setCollapsed = useCallback(
    (nextCollapsed: boolean) => {
      setInternalCollapsed(nextCollapsed);
      onCollapsedChange?.(nextCollapsed);
    },
    [onCollapsedChange]
  );

  const toggleSidebar = useCallback(() => {
    setCollapsed(!isCollapsed);
  }, [isCollapsed, setCollapsed]);

  const resize = useResizable({
    edges: side === "left" ? "right" : "left",
    minWidth,
    maxWidth,
    persistKey,
    disabled: !resizable || isCollapsed,
  });

  let computedWidthClass = width;
  if (variant === "collapsible" && isCollapsed) {
    computedWidthClass = collapsibleMode === "offcanvas" ? "w-0 overflow-hidden opacity-0 border-none" : "w-16";
  }

  const computedStyle = resize.enabled ? { ...style, ...resize.style } : style;

  return (
    <SidebarContext.Provider
      value={{
        side,
        variant,
        collapsibleMode,
        collapsed: isCollapsed,
        setCollapsed,
        toggleSidebar,
      }}
    >
      <aside
        ref={resize.ref}
        data-side={side}
        data-variant={variant}
        data-state={isCollapsed ? "collapsed" : "expanded"}
        // Offcanvas-collapsed: zero width but still in the DOM, so take it out of the
        // tab order and the a11y tree (focus would land on invisible items).
        inert={(variant === "collapsible" && isCollapsed && collapsibleMode === "offcanvas") || undefined}
        style={computedStyle}
        className={cn(
          "relative flex flex-col bg-surface transition-all duration-300 ease-in-out h-full select-none min-h-0 shrink-0",
          side === "left" ? "border-r border-hairline" : "border-l border-hairline",
          variant === "floating" && "m-2.5 rounded-[var(--radius-panel)] border border-hairline shadow-panel h-[calc(100%-1.25rem)]",
          variant === "inset" && "rounded-[var(--radius-panel)] border border-hairline shadow-card",
          resize.isResizing && "!transition-none select-none",
          computedWidthClass,
          className
        )}
        {...props}
      >
        {children}

        <ResizeHandles state={resize} color={resizeColor} sizeHint={false} />
      </aside>
    </SidebarContext.Provider>
  );
}

/**
 * SidebarTrigger — one button, two jobs, chosen by where you put it.
 *  - Inside a `<Sidebar>` (usually its header): collapses / expands the sidebar rail.
 *  - Inside an `<AppFrame>` but outside the sidebar (usually the `<TopBar>`): opens the
 *    navigation drawer. It only appears while the frame is compact, so there is nothing to
 *    show or hide by hand.
 */
export function SidebarTrigger({
  className,
  onClick,
  ...props
}: HTMLAttributes<HTMLButtonElement>) {
  const sidebar = useContext(SidebarContext);
  const frame = useAppFrame();

  if (!sidebar) {
    if (!frame) throw new Error("SidebarTrigger must be used within a <Sidebar> or an <AppFrame>");
    return (
      <button
        type="button"
        onClick={(e) => {
          onClick?.(e);
          // Safari does not focus buttons on click, so name the element to return focus to.
          frame.returnFocusRef.current = e.currentTarget;
          frame.toggleNav();
        }}
        title={frame.open ? "Close navigation" : "Open navigation"}
        aria-label={frame.open ? "Close navigation" : "Open navigation"}
        aria-expanded={frame.open}
        aria-controls={frame.navId}
        className={cn(
          "shavin-frame__trigger h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] text-fg-muted transition hover:bg-surface-hover hover:text-fg active:scale-95 cursor-pointer shrink-0",
          className
        )}
        {...props}
      >
        <Menu className="h-4 w-4" />
      </button>
    );
  }

  // The rail toggle makes no sense inside the drawer.
  if (frame?.compact) return null;

  const { side, collapsed, toggleSidebar } = sidebar;
  const Icon = side === "left" ? PanelLeft : PanelRight;

  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        toggleSidebar();
      }}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] border border-hairline bg-surface text-fg-muted hover:bg-surface-hover hover:text-fg transition cursor-pointer shrink-0",
        className
      )}
      {...props}
    >
      <Icon className={cn("h-4 w-4 transition-transform duration-200", collapsed && "rotate-180")} />
    </button>
  );
}

export function SidebarHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        "flex h-14 items-center justify-between border-b border-hairline px-4 shrink-0 transition-all",
        collapsed && "justify-center px-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto p-2 space-y-3 pg-scroll min-h-0",
        collapsed && "px-1.5 py-2 space-y-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        "flex items-center justify-between border-t border-hairline p-3 shrink-0 transition-all",
        collapsed && "justify-center px-2 p-2.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SidebarSectionProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function SidebarSection({
  title,
  className,
  children,
  ...props
}: SidebarSectionProps) {
  const { collapsed } = useSidebar();
  const titleId = useId();
  return (
    <div
      className={cn("space-y-1", className)}
      {...(title && { role: "group", "aria-labelledby": titleId })}
      {...props}
    >
      {title && (
        <Text
          id={titleId}
          size="overline"
          color="subtle"
          className={cn("px-2 pb-1 font-bold truncate block", collapsed && "sr-only")}
        >
          {title}
        </Text>
      )}
      {children}
    </div>
  );
}

export interface SidebarNavItemProps {
  icon?: ReactNode;
  label: string;
  active?: boolean;
  badge?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function SidebarNavItem({
  icon,
  label,
  active,
  badge,
  href,
  onClick,
  className,
}: SidebarNavItemProps) {
  const { side, collapsed } = useSidebar();
  const frame = useAppFrame();
  const handleClick = () => {
    onClick?.();
    frame?.closeNav();
  };

  const content = (
    <>
      {icon && (
        <span
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 flex items-center justify-center transition-colors",
            active ? "text-fg" : "text-fg-subtle opacity-80"
          )}
        >
          {icon}
        </span>
      )}
      {!collapsed && <span className="truncate flex-1 text-left">{label}</span>}
      {!collapsed && badge && <span className="shrink-0">{badge}</span>}
    </>
  );

  const cls = cn(
    "flex w-full items-center gap-2.5 rounded-[var(--radius-lg)] px-3 py-1.5 text-sm font-medium transition cursor-pointer select-none",
    active ? "bg-surface-hover font-semibold text-fg" : "text-fg-muted hover:bg-surface-hover hover:text-fg",
    collapsed && "justify-center px-0 py-2",
    className
  );

  // Collapsed items show only an icon; the Tooltip describes, it does not name.
  const a11y = {
    "aria-current": active ? ("page" as const) : undefined,
    "aria-label": collapsed ? label : undefined,
  };
  const itemElement = href ? (
    <a href={href} onClick={handleClick} className={cls} {...a11y}>
      {content}
    </a>
  ) : (
    <button type="button" onClick={handleClick} className={cls} {...a11y}>
      {content}
    </button>
  );

  if (collapsed) {
    return <Tooltip content={label} side={side === "left" ? "right" : "left"}>{itemElement}</Tooltip>;
  }

  return itemElement;
}

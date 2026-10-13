"use client";
import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "../Popover";
import { TextField } from "../TextField";
import { cn } from "../../lib/cn";
import * as LucideIcons from "lucide-react";
import * as PhosphorIcons from "@phosphor-icons/react";
import * as RadixIcons from "@radix-ui/react-icons";
import * as MDIIcons from "@mdi/js";
import type { LucideIcon } from "lucide-react";

export type IconComponentType = React.ComponentType<any>;

export interface IconItem {
  id: string;
  name: string;
  library: "lucide" | "phosphor" | "radix" | string;
  component: IconComponentType;
}

export const ICON_REGISTRY: IconItem[] = [];
export const ALL_ICONS: Record<string, IconComponentType> = {};

// 1. Populate Lucide icons
Object.entries(LucideIcons).forEach(([name, comp]) => {
  if (
    (typeof comp === "function" || (typeof comp === "object" && comp !== null && "$$typeof" in comp)) &&
    !name.startsWith("Lucide") &&
    name !== "createLucideIcon" &&
    name !== "LucideIcon" &&
    name !== "default"
  ) {
    const camelKey = name.charAt(0).toLowerCase() + name.slice(1);
    const component = comp as unknown as IconComponentType;
    ALL_ICONS[camelKey] = component;
    const lowerKey = name.toLowerCase();
    if (!ALL_ICONS[lowerKey]) {
      ALL_ICONS[lowerKey] = component;
    }
    if (!ALL_ICONS[name]) {
      ALL_ICONS[name] = component;
    }

    ICON_REGISTRY.push({
      id: `lucide-${camelKey}`,
      name: camelKey,
      library: "lucide",
      component,
    });
  }
});

// 2. Populate Phosphor icons
Object.entries(PhosphorIcons).forEach(([name, comp]) => {
  if (
    (typeof comp === "function" || (typeof comp === "object" && comp !== null && "$$typeof" in comp)) &&
    !name.endsWith("Icon") &&
    !name.startsWith("Icon") &&
    name !== "SSR" &&
    name !== "default"
  ) {
    const camelKey = name.charAt(0).toLowerCase() + name.slice(1);
    const component = comp as unknown as IconComponentType;
    if (!ALL_ICONS[camelKey]) {
      ALL_ICONS[camelKey] = component;
    }
    const lowerKey = name.toLowerCase();
    if (!ALL_ICONS[lowerKey]) {
      ALL_ICONS[lowerKey] = component;
    }
    if (!ALL_ICONS[name]) {
      ALL_ICONS[name] = component;
    }

    ICON_REGISTRY.push({
      id: `phosphor-${camelKey}`,
      name: camelKey,
      library: "phosphor",
      component,
    });
  }
});

// 3. Populate Radix icons
Object.entries(RadixIcons).forEach(([name, comp]) => {
  if (
    (typeof comp === "function" || (typeof comp === "object" && comp !== null && "$$typeof" in comp)) &&
    name !== "default"
  ) {
    const rawName = name.endsWith("Icon") ? name.slice(0, -4) : name;
    const camelKey = rawName.charAt(0).toLowerCase() + rawName.slice(1);
    const component = comp as unknown as IconComponentType;
    if (!ALL_ICONS[camelKey]) {
      ALL_ICONS[camelKey] = component;
    }
    const lowerKey = rawName.toLowerCase();
    if (!ALL_ICONS[lowerKey]) {
      ALL_ICONS[lowerKey] = component;
    }
    if (!ALL_ICONS[name]) {
      ALL_ICONS[name] = component;
    }

    ICON_REGISTRY.push({
      id: `radix-${camelKey}`,
      name: camelKey,
      library: "radix",
      component,
    });
  }
});

// 4. Populate Material Design icons (@mdi/js — path strings only, no @mdi/react)
//    @mdi/js exports SVG path strings (e.g. mdiAbTesting). We render them as
//    inline <svg> elements directly, avoiding the @mdi/react CJS/React-16 dependency.
Object.entries(MDIIcons).forEach(([key, path]) => {
  if (typeof path !== "string" || !key.startsWith("mdi")) return;
  // Strip "mdi" prefix → e.g. "AbTesting" → "abTesting"
  const rawName = key.slice(3);
  const camelKey = rawName.charAt(0).toLowerCase() + rawName.slice(1);
  const lowerKey = camelKey.toLowerCase();

  // Create a wrapper component that renders the MDI path as an inline SVG.
  // We avoid @mdi/react (CJS/React-16) and render the path directly, which is
  // all @mdi/react does internally. Strip Lucide-specific props that MDI doesn't understand.
  const MdiWrapper = ({ strokeWidth: _sw, absoluteStrokeWidth: _asw, size: _sz, ...rest }: any) => (
    <svg viewBox="0 0 24 24" {...rest}>
      <path d={path} fill="currentColor" />
    </svg>
  );

  // Only add to ALL_ICONS if not already present (Lucide/Phosphor/Radix take priority)
  if (!ALL_ICONS[camelKey]) {
    ALL_ICONS[camelKey] = MdiWrapper as unknown as IconComponentType;
  }
  if (!ALL_ICONS[lowerKey]) {
    ALL_ICONS[lowerKey] = MdiWrapper as unknown as IconComponentType;
  }
  if (!ALL_ICONS[key]) {
    ALL_ICONS[key] = MdiWrapper as unknown as IconComponentType;
  }

  ICON_REGISTRY.push({
    id: `material-${camelKey}`,
    name: camelKey,
    library: "material",
    component: MdiWrapper as unknown as IconComponentType,
  });
});

export interface IconPickerProps {
  /** Active selected icon name key. */
  value: string;
  /** Callback fired when an icon is picked. */
  onChange: (v: string) => void;
  /** Optional custom trigger element. If provided, replaces the default trigger button. */
  children?: React.ReactNode;
  /** Visual variant of default trigger: 'default' (full input-like trigger) or 'icon' (compact square button). */
  variant?: "default" | "icon";
  /** Size of the trigger button. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Whether to show a 'None' (Ø) option at start of grid. Default false. */
  allowNone?: boolean;
  /** Enabled icon libraries to show filter tabs for (e.g. ['phosphor', 'lucide', 'radix']). */
  libraries?: string[];
  /** Custom wrapper class name. */
  className?: string;
}

export function IconPicker({
  value,
  onChange,
  children,
  variant = "default",
  size = "md",
  allowNone = false,
  libraries,
  className,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeLibrary, setActiveLibrary] = useState<string>("all");

  const query = search.trim().toLowerCase();

  // 1. Filter by active icon library tab
  const libraryFiltered =
    activeLibrary === "all"
      ? ICON_REGISTRY
      : ICON_REGISTRY.filter(
          (item) => item.library.toLowerCase() === activeLibrary.toLowerCase()
        );

  // 2. Filter by search query
  const filteredIcons = query
    ? libraryFiltered
        .filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.id.toLowerCase().includes(query)
        )
        .slice(0, 120)
    : libraryFiltered.slice(0, 96);

  const SelectedIcon = ALL_ICONS[value] || (value ? ALL_ICONS[value.toLowerCase()] : undefined);

  const defaultTrigger =
    variant === "icon" ? (
      <button
        type="button"
        className={cn(
          "flex items-center justify-center rounded-[var(--radius-lg)] border border-hairline bg-surface text-fg-muted transition hover:bg-surface-hover hover:text-fg cursor-pointer shrink-0 shadow-1",
          size === "sm" ? "h-7 w-7" : size === "lg" ? "h-9 w-9" : "h-8 w-8",
          className
        )}
        title={value || "Pick icon"}
      >
        {SelectedIcon ? (
          <SelectedIcon className={size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-4.5 w-4.5" : "h-4 w-4"} />
        ) : (
          <LucideIcons.Ban className="h-3.5 w-3.5 text-fg-subtle" />
        )}
      </button>
    ) : (
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-hairline bg-surface outline-none transition focus:border-hairline hover:bg-surface-hover cursor-pointer text-left",
          size === "sm" ? "py-1 pl-2.5 pr-2 text-xs" : size === "lg" ? "py-2.5 pl-3 pr-2.5 text-base" : "py-1.5 pl-3 pr-2.5 text-sm",
          className
        )}
      >
        <span className="flex items-center gap-2 truncate text-left flex-1 min-w-0">
          {SelectedIcon ? (
            <SelectedIcon className={cn("shrink-0 text-fg-muted", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
          ) : (
            <LucideIcons.Ban className={cn("shrink-0 text-fg-subtle", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
          )}
          <span className="truncate text-xs text-fg">{value || "none"}</span>
        </span>
        <svg viewBox="0 0 24 24" fill="none" className={cn("shrink-0 text-fg-muted", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    );

  const availableTabs = libraries && libraries.length > 0
    ? ["all", ...Array.from(new Set(libraries.map((l) => l.toLowerCase())))]
    : ["all", "phosphor", "lucide", "radix"];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ? children : defaultTrigger}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 z-[100]">
        <div className="space-y-2.5">
          <TextField
            placeholder="Search icons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="sm"
            className="w-full"
          />
          {availableTabs.length > 1 && (
            <div className="flex items-center gap-1 border-b border-hairline pb-1.5 overflow-x-auto">
              {availableTabs.map((lib) => (
                <button
                  key={lib}
                  type="button"
                  onClick={() => setActiveLibrary(lib)}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-medium rounded-[var(--radius-lg)] capitalize transition cursor-pointer shrink-0",
                    activeLibrary.toLowerCase() === lib
                      ? "bg-accent/15 text-accent font-semibold"
                      : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                  )}
                >
                  {lib}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-8 gap-1 max-h-56 overflow-y-auto pr-1">
            {allowNone && (
              <button
                type="button"
                onClick={() => {
                  onChange("none");
                  setOpen(false);
                }}
                className={cn(
                  "flex flex-col items-center justify-center rounded-[var(--radius-md)] h-8 w-8 hover:bg-surface-hover transition border border-transparent shrink-0",
                  value === "none" && "bg-surface-hover border-accent text-accent"
                )}
                title="None"
              >
                <LucideIcons.Ban className="h-4 w-4 text-fg-subtle" />
              </button>
            )}
            {filteredIcons.map((item) => {
              const IconComp = item.component;
              const isSelected = value === item.name || value.toLowerCase() === item.name.toLowerCase();
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.name);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-[var(--radius-md)] h-8 w-8 hover:bg-surface-hover transition border border-transparent text-fg-muted hover:text-fg shrink-0",
                    isSelected && "bg-surface-hover border-accent text-accent hover:text-accent font-semibold"
                  )}
                  title={`${item.name} (${item.library})`}
                >
                  <IconComp className="h-4 w-4" />
                </button>
              );
            })}
            {filteredIcons.length === 0 && (
              <div className="col-span-8 py-4 text-center text-xs text-fg-subtle">
                No matching icons in {activeLibrary} library.
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

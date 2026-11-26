/**
 * The full icon registry: every icon of Lucide, Phosphor, Radix and Material (MDI), by name.
 * It imports all four libraries in full (about 2.4 MB compressed), so nothing on the root
 * @shavin/ui entry imports it statically: IconPicker loads it when opened, and apps that need
 * the whole catalogue import it from "@shavin/ui/icons". <Icon name> loads single icons instead.
 */
import React from "react";
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


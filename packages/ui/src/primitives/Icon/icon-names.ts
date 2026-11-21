import { LUCIDE_NAMES, PHOSPHOR, RADIX } from "./icon-loaders.generated";
export { ICON_NAMES } from "./icon-display-names.generated";

/**
 * Whether <Icon name> knows this name in Lucide, Phosphor or Radix, matched the way Icon matches
 * ("layout-dashboard" = "layoutDashboard"). Material names are checked when an icon loads, not here.
 */
export function iconExists(name: string): boolean {
  const key = name.toLowerCase().replace(/[-_]/g, "");
  const keys = [key, key.endsWith("icon") ? key.slice(0, -4) : ""].filter(Boolean);
  return keys.some((k) => LUCIDE_NAMES[k] !== undefined || PHOSPHOR[k] !== undefined || RADIX[k] !== undefined);
}

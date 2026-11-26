/**
 * @shavin/ui/icons: the full icon catalogue (every Lucide, Phosphor, Radix and Material icon), for
 * apps that browse or list all icons. It imports four whole libraries, so it is a separate entry;
 * <Icon name="…"> from the root loads one icon at a time and does not need it.
 */
export { ICON_REGISTRY, ALL_ICONS } from "./primitives/IconPicker/registry";
export type { IconItem, IconComponentType } from "./primitives/IconPicker/registry";

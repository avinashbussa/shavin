"use client";
import { createContext, useContext } from "react";

/**
 * Where floating panels (Popover, Menu, ContextMenu, HoverCard, Tooltip, Select, Dropdown) mount.
 * Default `null` keeps the usual behaviour: `document.body`. A frame that scales or clips its content
 * (a block preview, an embedded canvas) provides its own element so panels open inside it, move with
 * it and are clipped by it. Provide one with `<PortalContainerProvider value={element}>`.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null);

export const PortalContainerProvider = PortalContainerContext.Provider;

/** The element floating panels should mount in, or `undefined` for the default (`document.body`). */
export function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContainerContext) ?? undefined;
}

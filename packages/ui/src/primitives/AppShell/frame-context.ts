"use client";
import { createContext, useContext, type MutableRefObject } from "react";

export interface AppFrameContextValue {
  /** True while the frame is narrower than its `compactBelow` width (sidebar is a drawer). */
  compact: boolean;
  /** True while the drawer is open (never true when not compact). */
  open: boolean;
  /** Element that gets focus back when the drawer closes (set by SidebarTrigger; falls back to whatever was focused on open). */
  returnFocusRef: MutableRefObject<HTMLElement | null>;
  /** id of the navigation container, for aria-controls. */
  navId: string;
  setOpen: (open: boolean) => void;
  toggleNav: () => void;
  /** Close the drawer. A no-op when the frame is not compact, so nav items can call it unconditionally. */
  closeNav: () => void;
}

export const AppFrameContext = createContext<AppFrameContextValue | null>(null);

/** The surrounding AppFrame's state, or null outside one. */
export function useAppFrame(): AppFrameContextValue | null {
  return useContext(AppFrameContext);
}

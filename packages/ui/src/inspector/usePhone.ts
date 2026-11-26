import { useEffect, useState } from "react";
import { isSheetWidth } from "./placement";

/** True under 640 px wide: the bar becomes a bottom dock and panels become one bottom sheet. Follows resizes and rotation. */
export function usePhone(): boolean {
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && isSheetWidth(window.innerWidth));
  useEffect(() => {
    const update = () => setPhone(isSheetWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);
  return phone;
}

/** Height of the phone dock and its sheet gap, in px. */
export const DOCK_H = 56;
export const TILE_PHONE = 44;
export const SHEET_GAP = 8;

/** Where a panel sits on a phone: a bottom sheet above the dock, never wider than the screen. */
export const sheetStyle = (dockH: number): React.CSSProperties => ({
  position: "fixed",
  left: SHEET_GAP,
  right: SHEET_GAP,
  top: "auto",
  // The dock is 56 px plus the device's bottom safe area; the sheet sits 8 px above both.
  bottom: dockH > 0 ? `calc(${dockH}px + env(safe-area-inset-bottom, 0px) + ${SHEET_GAP}px)` : SHEET_GAP,
  width: "auto",
  maxHeight: "62vh",
});

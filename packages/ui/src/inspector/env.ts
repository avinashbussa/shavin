/** Small browser helpers the inspector shares: this tab's id, the clipboard, and a ticking clock. */
import { useEffect, useState } from "react";

/** The tab id the audit uses (the panel creates it); used to ask the bridge about this tab's findings only. */
export function currentTabId(): string {
  try {
    return sessionStorage.getItem("__shavin_tab_id") || "default";
  } catch {
    return "default";
  }
}

/** Copies text; false when the browser refuses (no permission, insecure context). */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the old way */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** `Date.now()` that updates every `ms` while `active`, so a time-based label can change on its own. */
export function useNow(active: boolean, ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [active, ms]);
  return active ? now : Date.now();
}

/** The nearest ancestor that scrolls vertically (an app shell often scrolls inside a container, not the window). */
export function scrollParent(el: Element | null): Element | null {
  for (let n = el?.parentElement ?? null; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    const oy = getComputedStyle(n).overflowY;
    if ((oy === "auto" || oy === "scroll" || oy === "overlay") && n.scrollHeight > n.clientHeight + 1) return n;
  }
  return null;
}

/** Scrolls whatever scrolls the element (its scroll container or the window) by `dy` pixels. */
export function scrollPageBy(el: Element | null, dy: number): void {
  const parent = scrollParent(el);
  if (parent) parent.scrollTop += dy;
  else window.scrollBy({ top: dy });
}

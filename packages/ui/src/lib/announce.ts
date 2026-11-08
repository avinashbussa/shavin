"use client";

/**
 * Screen-reader announcements through two persistent live regions (WCAG 4.1.3).
 *
 * A live region only speaks reliably when it exists BEFORE its text changes, so
 * mounting `role="status"` together with its message (a new toast, a spinner) is
 * often silent. These regions are created once, appended to <body>, and reused.
 *
 *   announce("Saved");                    // polite: waits for the user to pause
 *   announce("Upload failed", "assertive"); // interrupts: errors only
 */
export type Politeness = "polite" | "assertive";

const regions: Partial<Record<Politeness, HTMLElement>> = {};

function region(politeness: Politeness): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const existing = regions[politeness];
  if (existing?.isConnected) return existing;
  const el = document.createElement("div");
  el.setAttribute("aria-live", politeness);
  el.setAttribute("aria-atomic", "true");
  el.setAttribute("role", politeness === "assertive" ? "alert" : "status");
  el.setAttribute("data-shavin-announcer", politeness);
  // sr-only, inlined so it works without the stylesheet.
  Object.assign(el.style, {
    position: "absolute",
    width: "1px",
    height: "1px",
    margin: "-1px",
    padding: "0",
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: "0",
  });
  document.body.appendChild(el);
  regions[politeness] = el;
  return el;
}

export function announce(message: string, politeness: Politeness = "polite") {
  const el = region(politeness);
  const text = message.replace(/\s+/g, " ").trim();
  if (!el || !text) return;
  // Clear first so the same message twice in a row is still spoken.
  el.textContent = "";
  window.setTimeout(() => {
    el.textContent = text;
  }, 50);
}

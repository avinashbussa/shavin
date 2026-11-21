/** The inspector's own settings, kept in dev-only localStorage. Pure helpers plus one small hook. */
import * as React from "react";
import type { SchemeChoice } from "./scheme";

export interface InspectorSettings {
  /** V, I, T and comma switch tools while the bar has focus or a tool is on (WCAG 2.1.4: can be turned off). */
  shortcuts: boolean;
  /** Zero motion in the inspector, on top of the OS setting. */
  reduceMotion: boolean;
  /** Colour scheme of the inspector's own controls; `auto` is the opposite of the page. */
  scheme: SchemeChoice;
  /** Pad the page under (or above) the bar by its height so it never covers content. */
  reserveSpace: boolean;
}

export const SETTINGS_KEY = "shavin-inspector-settings";
export const DEFAULT_SETTINGS: InspectorSettings = { shortcuts: true, reduceMotion: false, scheme: "auto", reserveSpace: false };

export function loadSettings(): InspectorSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null") as Partial<InspectorSettings> | null;
    if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;
    return {
      shortcuts: typeof raw.shortcuts === "boolean" ? raw.shortcuts : DEFAULT_SETTINGS.shortcuts,
      reduceMotion: typeof raw.reduceMotion === "boolean" ? raw.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
      scheme: raw.scheme === "light" || raw.scheme === "dark" || raw.scheme === "auto" ? raw.scheme : DEFAULT_SETTINGS.scheme,
      reserveSpace: typeof raw.reserveSpace === "boolean" ? raw.reserveSpace : DEFAULT_SETTINGS.reserveSpace,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: InspectorSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* storage blocked: settings last for this page view */
  }
}

export function useSettings(): [InspectorSettings, (patch: Partial<InspectorSettings>) => void] {
  const [settings, setSettings] = React.useState<InspectorSettings>(loadSettings);
  const update = React.useCallback((patch: Partial<InspectorSettings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);
  return [settings, update];
}

/** Padding to add to the page for the bar, by side. The bar is 40 px, with its 20 px margin and an 8 px gap. */
export const RESERVE_PX = 68;

/**
 * Reserves room for the bar on the page: padding on `body` on the side the bar sits on. Returns a function that puts
 * the page's own padding back exactly.
 */
export function reserveSpace(anchor: string, doc: Document = document): () => void {
  const body = doc.body;
  const side = anchor.startsWith("top") ? "paddingTop" : anchor.startsWith("bottom") ? "paddingBottom" : anchor === "middle-left" ? "paddingLeft" : "paddingRight";
  const inline = body.style[side];
  const computed = doc.defaultView?.getComputedStyle(body)[side] ?? "0px";
  body.style[side] = `calc(${computed} + ${RESERVE_PX}px)`;
  return () => {
    body.style[side] = inline;
  };
}

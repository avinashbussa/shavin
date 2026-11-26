/**
 * Which colour scheme the inspector's own controls use: the opposite of the page, so they stand out from it.
 * Computed from the page's background (first opaque one on body, then html), once, and again only when the page
 * theme changes. Never read on scroll or pointer move.
 */
import { useEffect, useState } from "react";
import { isLight, parseColor, type Rgb } from "../lib/inspector/color";

export type Scheme = "light" | "dark";
export type SchemeChoice = Scheme | "auto";

export const opposite = (s: Scheme): Scheme => (s === "light" ? "dark" : "light");

/** First opaque background colour on body, then html. Null when there is none, or an image or gradient comes first. */
export function pageBackground(doc: Document = document): Rgb | null {
  const win = doc.defaultView;
  if (!win) return null;
  for (const el of [doc.body, doc.documentElement]) {
    if (!el) continue;
    const cs = win.getComputedStyle(el);
    if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
    const c = parseColor(cs.backgroundColor);
    if (c && c.a > 0.6) return c.rgb;
  }
  return null;
}

/** The page's own signal when it paints no solid background: class, data attribute, color-scheme, then the OS. */
export function pageSchemeHint(doc: Document = document): Scheme {
  const html = doc.documentElement;
  const win = doc.defaultView;
  if (html.classList.contains("dark") || html.getAttribute("data-theme") === "dark") return "dark";
  if (html.classList.contains("light") || html.getAttribute("data-theme") === "light") return "light";
  const cs = win?.getComputedStyle(html).colorScheme ?? "";
  if (/\bdark\b/.test(cs) && !/\blight\b/.test(cs)) return "dark";
  if (/\blight\b/.test(cs) && !/\bdark\b/.test(cs)) return "light";
  return win?.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readPageScheme(doc: Document = document): Scheme {
  const bg = pageBackground(doc);
  return bg ? (isLight(bg) ? "light" : "dark") : pageSchemeHint(doc);
}

export const controlsScheme = (choice: SchemeChoice, page: Scheme): Scheme => (choice === "auto" ? opposite(page) : choice);

/** The page's scheme, kept current by watching theme attributes on html and body (not the whole subtree). */
export function usePageScheme(): Scheme {
  const [scheme, setScheme] = useState<Scheme>(() => (typeof document === "undefined" ? "light" : readPageScheme()));
  useEffect(() => {
    const update = () => setScheme(readPageScheme());
    update();
    const mo = new MutationObserver(update);
    const opts = { attributes: true, attributeFilter: ["class", "style", "data-theme"] };
    mo.observe(document.documentElement, opts);
    if (document.body) mo.observe(document.body, opts);
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", update);
    return () => {
      mo.disconnect();
      mq?.removeEventListener?.("change", update);
    };
  }, []);
  return scheme;
}

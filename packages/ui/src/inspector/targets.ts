import type { Finding } from "../lib/inspector/schema";

/** The element a finding is about, or null for a page-level finding or an element that is gone. */
export function resolveTarget(f: Pick<Finding, "selector">, root: ParentNode = document): Element | null {
  if (!f.selector || f.selector === "(page)") return null;
  try {
    const el = root.querySelector(f.selector);
    return el && el.isConnected ? el : null;
  } catch {
    return null;
  }
}

/** Short row text: the judgement, with the element's own text when it helps. */
export function rowText(f: Pick<Finding, "message" | "text" | "rule">): string {
  return f.text && f.rule !== "console.error" ? `${f.message} “${f.text}”` : f.message;
}

/**
 * Short name of the element a finding is about: its tag and what a person would call it, such as `a “Docs”` or
 * `button “Add expense”`. Used for list rows when the same sentence would repeat. Falls back to what the finding
 * recorded when the element is gone.
 */
export function elementLabel(f: Pick<Finding, "selector" | "text" | "context">, root: ParentNode = document): string {
  if (f.selector === "(page)") return "Page";
  const el = resolveTarget(f, root);
  const clean = (v: string | null | undefined) => (v ?? "").replace(/\s+/g, " ").trim();
  const short = (v: string) => (v.length > 24 ? `${v.slice(0, 23)}…` : v);
  if (el) {
    const name = clean(el.getAttribute("aria-label")) || clean(el.getAttribute("alt")) || clean(el.getAttribute("title")) || clean(el.textContent);
    const tag = el.tagName.toLowerCase();
    return name ? `${tag} “${short(name)}”` : tag;
  }
  const tag = /([a-z][a-z0-9-]*)(?:[.#:[][^\s>]*)*$/i.exec(f.selector)?.[1]?.toLowerCase() ?? "element";
  const name = clean(f.text);
  return name ? `${tag} “${short(name)}”` : tag;
}

/**
 * Surface contrast scoping — resolves a `surface` prop into a data attribute.
 *
 * The `surface` prop is a **content-readability intent**, not a literal CSS
 * class directive.  There are four modes, split into two behaviours:
 *
 * **Auto-inverting** (creates a contrast band against the page):
 * - `surface="dark"`  → dark tokens on light page; **inverts** to light on dark page
 * - `surface="light"` → light tokens on light page; **inverts** to dark on dark page
 *
 * **Always** (locked regardless of page theme — use for media backgrounds):
 * - `surface="dark-always"`  → dark tokens on both light and dark pages
 * - `surface="light-always"` → light tokens on both light and dark pages
 *
 * Use `dark` / `light` when the section should visually contrast against the
 * page (e.g. a solid surface card).  Use `dark-always` / `light-always` when
 * the background media (video/image) is always dark or always light,
 * regardless of the page theme — the text must stay readable against the
 * media, not against the page.
 *
 * The intent is resolved by CSS rules in `global.css` that key off
 * `[data-surface]` + `:root.dark` / `:root:not(.dark)`.  CSS handles
 * reactivity automatically — no JS re-render is needed when the user
 * toggles dark mode.
 *
 * The primitives set `data-surface={surface}` on the DOM element.  The CSS
 * rules in `global.css` map this attribute to the appropriate contrast token
 * set based on the page theme.
 */

export type Surface = "dark" | "light" | "dark-always" | "light-always" | undefined;

/**
 * Resolve a `surface` prop value into a CSS class name.
 *
 * Returns `undefined` — surface scoping is now handled entirely via the
 * `data-surface` attribute and CSS rules.  This function is kept for backward
 * compatibility (some primitives still call it in their `cn()` chain) but it
 * no longer contributes a class.  The `data-surface` attribute set directly
 * by each primitive is the sole driver of surface contrast scoping.
 */
export function surfaceClass(surface: Surface): string | undefined {
  return undefined;
}

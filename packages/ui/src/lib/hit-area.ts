/**
 * Per-component override for the target-size policy (docs: "Target size").
 *
 * - `"default"` (or unset): the component's own policy (primary controls: 24px floor, 44px under a coarse
 *   pointer, unless the provider is `touchTargets="compact"`).
 * - `"none"`: no invisible hit area and no growth, at any pointer. For dense tables and toolbars. The control
 *   can then be smaller than the 24px WCAG 2.5.8 floor: that is the consumer's responsibility.
 * - `"touch"`: always grow to 44px under a coarse pointer, even when the provider is compact.
 */
export type HitArea = "none" | "default" | "touch";

/**
 * Classes to add on top of a component's own default hit-area class (kept in its base classes so the
 * exported cva variants keep working on their own). "none" adds `hit-area-none`, which wins over the
 * default utilities; "touch" adds the force modifier (and the touch utility for controls that default to
 * floor-only or to none).
 * @param base What the component uses by default: "touch" (`hit-area-touch`), "floor" (`hit-area`),
 * "input" (`hit-area-input`, a native input) or "none" (secondary control, opt-in only).
 * @param component Component name, used only for the development warning on `hitArea="none"`.
 */
export function hitAreaClass(
  hitArea: HitArea | undefined,
  base: "touch" | "floor" | "input" | "none" = "touch",
  component?: string,
): string {
  if (hitArea === "none") {
    warnHitAreaNone(component);
    return "hit-area-none";
  }
  if (hitArea === "touch") return base === "input" ? "hit-area-input hit-area-force" : "hit-area-touch hit-area-force";
  return "";
}

const warned = new Set<string>();

/** Test hook: forget which component types already warned. */
export function resetHitAreaWarnings(): void {
  warned.clear();
}

/**
 * Development-only, once per component type: `hitArea="none"` removes the invisible hit area, so the control can
 * fall below the WCAG 2.2 AA 2.5.8 floor (24x24 CSS px). Silent in production and during server rendering.
 * We cannot measure the control at render time, so the message says "unless it is already 24px or larger".
 */
function warnHitAreaNone(component = "component"): void {
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") return;
  if (typeof window === "undefined") return;
  if (warned.has(component)) return;
  warned.add(component);
  console.warn(
    `[@shavin/ui] ${component} hitArea="none" drops the control below the WCAG 2.2 AA 2.5.8 target size floor (24x24 CSS px) unless it is already 24px or larger; the trade-off is a smaller click and touch target. ` +
      `To restore it: remove the hitArea prop, use hitArea="default" (or "touch"), or make sure the control has a 24px target another way (size, padding, or the hit-area utility).`,
  );
}

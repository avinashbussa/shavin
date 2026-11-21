/**
 * Score-grade badge for CLI output. Pure and dependency-free: the grade is
 * computed from a score and the script's passing threshold, never hard-coded.
 *
 *   score >= threshold              -> "VERIFIED" plus the highest tier reached
 *   acceptable <= score < threshold -> "ACCEPTABLE" (neutral, not a failure)
 *   score < acceptable              -> "NEEDS WORK [BELOW <acceptable>]" (mild)
 *
 * Tiers and the acceptable floor are data (0-100 scale). Override per call with
 * `threshold`, `acceptable` or `tiers`. A script's exit code must keep using its
 * own threshold logic; this badge is display only.
 */

export const DEFAULT_THRESHOLD = 90;

/** Global default floor for the "ACCEPTABLE" band (scripts keep 80 unless they have a reason). */
export const DEFAULT_ACCEPTABLE = 80;

/** Global default tier preset. Scores below `bronze` can never be verified at the default threshold. */
export const DEFAULT_TIERS = Object.freeze([
  Object.freeze({ name: "bronze", min: 90 }),
  Object.freeze({ name: "silver", min: 95 }),
  Object.freeze({ name: "gold", min: 98 }),
  Object.freeze({ name: "platinum", min: 100 }),
]);

/**
 * @param {number} score 0-100
 * @param {{ threshold?: number, acceptable?: number, tiers?: ReadonlyArray<{name:string,min:number}> }} [opts]
 * @returns {{ score:number, threshold:number, acceptable:number, passed:boolean, band:"verified"|"acceptable"|"needs-work", tier:string|null, label:string, tone:"success"|"neutral"|"warning" }}
 */
export function gradeScore(score, { threshold = DEFAULT_THRESHOLD, acceptable = DEFAULT_ACCEPTABLE, tiers = DEFAULT_TIERS } = {}) {
  const floor = Math.min(acceptable, threshold);
  const base = { score, threshold, acceptable: floor };
  if (!Number.isFinite(score) || score < floor) {
    return { ...base, passed: false, band: "needs-work", tier: null, label: "NEEDS WORK", tone: "warning" };
  }
  if (score < threshold) {
    return { ...base, passed: false, band: "acceptable", tier: null, label: "ACCEPTABLE", tone: "neutral" };
  }
  let tier = null;
  for (const t of [...tiers].sort((x, y) => x.min - y.min)) {
    if (score >= t.min) tier = t.name;
  }
  return { ...base, passed: true, band: "verified", tier, label: "VERIFIED", tone: "success" };
}

/**
 * Render a grade with the caller's `fmt` and `c` (from term-ui / cli ui).
 * `extra` is an optional suffix badge text shown when verified (e.g. "PRODUCTION READY").
 */
export function renderGrade(grade, { fmt, c }, extra) {
  if (grade.band === "needs-work") {
    return `${fmt.warn(grade.label)} ${fmt.badge(`BELOW ${grade.acceptable}`, c.warning)}`;
  }
  if (grade.band === "acceptable") {
    return fmt.muted(grade.label);
  }
  const parts = [grade.tier ? grade.tier.toUpperCase() : null, extra].filter(Boolean).join(" · ");
  return `${fmt.pass(grade.label)}${parts ? " " + fmt.badge(parts, c.success) : ""}`;
}

/** Convenience: compute and render in one call. */
export function gradeBadge(score, ui, opts, extra) {
  return renderGrade(gradeScore(score, opts), ui, extra);
}

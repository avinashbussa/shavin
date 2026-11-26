/**
 * Shape and limits for findings the browser sends to the bridge (pure functions, unit-tested).
 *
 * A finding is data about a page. Element text, selectors, class names, console messages and a developer's note
 * all come from outside the bridge, so nothing here trusts a field: every value is re-typed, stripped of control
 * and bidirectional-override characters and cut to a length, and an unknown field is dropped. The caps match
 * `FINDING_CAPS` in `@shavin/ui` (`lib/inspector/schema.ts`); a test keeps the two in step.
 */

export const FINDING_CAPS = Object.freeze({
  message: 300,
  fixHint: 300,
  selector: 500,
  context: 200,
  text: 60,
  comment: 2000,
  rule: 60,
  evidenceKey: 40,
  evidenceValue: 300,
  propKey: 40,
  propValue: 120,
  props: 12,
  /** Findings kept per snapshot. */
  perSnapshot: 200,
});

export const DETECTORS = Object.freeze(["tokens", "contrast", "line-height", "overlap", "overflow", "tap-target", "console", "user"]);
export const SEVERITIES = Object.freeze(["error", "warning"]);
export const FINDING_ID = /^f_[0-9a-f]{8}$/;

const CONTROL_CHARS = new RegExp("[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f-\\u009f\\u2028\\u2029\\u202a-\\u202e\\u2066-\\u2069]", "g");

export function clampText(value, max) {
  const s = String(value ?? "").replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, Math.max(0, max - 1))}…` : s;
}

export function clampNote(value, max) {
  const s = String(value ?? "").replace(CONTROL_CHARS, "").replace(/\r\n?/g, "\n").trim();
  return s.length > max ? s.slice(0, max) : s;
}

const finite = (n) => typeof n === "number" && Number.isFinite(n);

function cleanRect(r) {
  if (!r || typeof r !== "object") return null;
  const keys = ["x", "y", "w", "h", "scrollX", "scrollY"];
  if (!keys.every((k) => finite(r[k]))) return null;
  const round = (n) => Math.round(n * 10) / 10;
  return Object.fromEntries(keys.map((k) => [k, round(r[k])]));
}

/**
 * Returns a clean finding, or null when the input is not a usable finding (wrong id shape, unknown detector or
 * severity). `ignored` is carried as a boolean so the readers can leave ignored findings out of their counts.
 */
export function sanitizeFinding(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (typeof raw.id !== "string" || !FINDING_ID.test(raw.id)) return null;
  if (!DETECTORS.includes(raw.detector)) return null;
  if (!SEVERITIES.includes(raw.severity)) return null;

  const evidence = {};
  if (raw.evidence && typeof raw.evidence === "object" && !Array.isArray(raw.evidence)) {
    for (const [k, v] of Object.entries(raw.evidence).slice(0, 12)) {
      if (v === undefined || v === null || typeof v === "object") continue;
      evidence[clampText(k, FINDING_CAPS.evidenceKey)] = clampText(v, FINDING_CAPS.evidenceValue);
    }
  }

  const out = {
    id: raw.id,
    detector: raw.detector,
    rule: clampText(raw.rule, FINDING_CAPS.rule),
    severity: raw.severity,
    message: clampText(raw.message, FINDING_CAPS.message),
    evidence,
    fixHint: clampText(raw.fixHint, FINDING_CAPS.fixHint),
    selector: clampText(raw.selector, FINDING_CAPS.selector) || "(page)",
    context: clampText(raw.context, FINDING_CAPS.context),
    rect: cleanRect(raw.rect),
    source: "inspector@1",
    at: finite(raw.at) ? raw.at : Date.now(),
  };
  if (raw.text) out.text = clampText(raw.text, FINDING_CAPS.text);
  if (raw.comment) out.comment = clampNote(raw.comment, FINDING_CAPS.comment);
  if (raw.props && typeof raw.props === "object" && !Array.isArray(raw.props)) {
    const props = {};
    for (const [k, v] of Object.entries(raw.props).slice(0, FINDING_CAPS.props)) {
      if (typeof v === "object" && v !== null) continue;
      props[clampText(k, FINDING_CAPS.propKey)] = clampText(v, FINDING_CAPS.propValue);
    }
    if (Object.keys(props).length) out.props = props;
  }
  if (raw.ignored === true) out.ignored = true;
  return out;
}

/** Keeps the usable findings of a list, drops duplicates by id, and stops at the per-snapshot cap. */
export function sanitizeFindings(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const f = sanitizeFinding(raw);
    if (!f || seen.has(f.id)) continue;
    seen.add(f.id);
    out.push(f);
    if (out.length >= FINDING_CAPS.perSnapshot) break;
  }
  return out;
}

/** Findings the readers should show and count. `tokens` rows duplicate the legacy `issues` list and are left out. */
export function visibleFindings(snapshot, { includeIgnored = false } = {}) {
  const list = Array.isArray(snapshot?.findings) ? snapshot.findings : [];
  return list.filter((f) => f.detector !== "tokens" && (includeIgnored || !f.ignored));
}

/** Clean means: no legacy issues, and no non-ignored finding of any kind. Older inspectors send no findings. */
export function isClean(snapshot) {
  const legacyClean = !!snapshot?.stats?.clean || snapshot?.stats?.total === 0;
  if (!legacyClean) return false;
  const list = Array.isArray(snapshot?.findings) ? snapshot.findings : [];
  return !list.some((f) => !f.ignored);
}

/**
 * Finding schema for the dev inspector.
 *
 * Pure module (no React, no DOM): the same shapes are used by the in-page detectors, the payload the inspector
 * sends to the local bridge, and the tools that read it. Findings are advisory: they describe what looks wrong and
 * suggest a fix, they never block a build.
 *
 * Text fields come from the page (element text, class names, console messages) or from a person typing a note, so
 * every consumer must treat them as data, never as instructions. `makeFinding` strips control characters and
 * enforces the length caps below.
 */

export type FindingSeverity = "error" | "warning";

export type FindingDetector =
  | "tokens"
  | "contrast"
  | "line-height"
  | "overlap"
  | "overflow"
  | "tap-target"
  | "console"
  | "user";

export interface FindingRect {
  /** Viewport coordinates at scan time. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Scroll offsets at scan time, so a reader can turn the rect into page coordinates. */
  scrollX: number;
  scrollY: number;
}

export interface Finding {
  /** Stable across scans: `f_` plus 8 hex digits of a hash of detector, rule, selector and the start of the text. */
  id: string;
  detector: FindingDetector;
  /** For example `contrast.text`, `tap-target.min-24`, `console.error`, `user.note`. */
  rule: string;
  severity: FindingSeverity;
  /** What is wrong, one sentence, judgement first and without numbers. */
  message: string;
  /** The numbers behind the judgement, after it. */
  evidence: { measured?: string; expected?: string; [key: string]: string | undefined };
  /** A suggestion for the fix. Self-contained: no links. */
  fixHint: string;
  /** A CSS selector that matches one element, or `(page)` for a finding about the whole page. */
  selector: string;
  /** A short human label, for example `Card > Heading`. */
  context: string;
  /** Null for page-level findings (a console error has no element). */
  rect: FindingRect | null;
  /** First characters of the element's text. */
  text?: string;
  /** Only for `detector: "user"`: the note a person typed. */
  comment?: string;
  /** Only for `detector: "user"`: a small subset of data-* and aria-* attributes. */
  props?: Record<string, string>;
  source: "inspector@1";
  /** Milliseconds since the epoch. */
  at: number;
}

/** Length limits applied by `makeFinding` and re-applied by the bridge when it stores a finding. */
export const FINDING_CAPS = {
  message: 300,
  fixHint: 300,
  selector: 500,
  context: 200,
  text: 60,
  comment: 2000,
  rule: 60,
  evidenceValue: 300,
  propValue: 120,
  props: 12,
  /** Findings kept per scan; the rest are dropped after sorting errors first. */
  perScan: 200,
} as const;

const CONTROL_CHARS = new RegExp("[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f-\\u009f\\u2028\\u2029\\u202a-\\u202e\\u2066-\\u2069]", "g");

/** Strips control and bidirectional-override characters and trims to `max` characters (with an ellipsis). */
export function clampText(value: unknown, max: number): string {
  const s = String(value ?? "").replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, Math.max(0, max - 1))}…` : s;
}

/** Same as `clampText` but keeps line breaks (for a typed note). */
export function clampNote(value: unknown, max: number): string {
  const s = String(value ?? "").replace(CONTROL_CHARS, "").replace(/\r\n?/g, "\n").trim();
  return s.length > max ? s.slice(0, max) : s;
}

/** FNV-1a, 32 bit, over UTF-16 code units. Small, synchronous and good enough to tell findings apart. */
function fnv1a(input: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * The id of a finding. The severity, rect and message are left out on purpose: the same problem keeps its id while
 * it is fixed in part, resized or scrolled, so an ignore or a journal entry stays attached to it.
 */
export function fingerprint(detector: string, rule: string, selector: string, text = ""): string {
  const key = [detector, rule, selector, text.slice(0, 24)].join("|");
  return `f_${fnv1a(key, 0x811c9dc5).toString(16).padStart(8, "0")}`;
}

const FINDING_ID = /^f_[0-9a-f]{8}$/;
export const isFindingId = (value: unknown): value is string => typeof value === "string" && FINDING_ID.test(value);

export interface FindingInput {
  detector: FindingDetector;
  rule: string;
  severity: FindingSeverity;
  message: string;
  evidence?: Finding["evidence"];
  fixHint: string;
  selector: string;
  context?: string;
  rect?: FindingRect | null;
  text?: string;
  comment?: string;
  props?: Record<string, string>;
  at?: number;
}

const round = (n: number) => Math.round(n * 10) / 10;

function cleanRect(rect: FindingRect | null | undefined): FindingRect | null {
  if (!rect) return null;
  const vals = [rect.x, rect.y, rect.w, rect.h, rect.scrollX, rect.scrollY];
  if (!vals.every((v) => typeof v === "number" && Number.isFinite(v))) return null;
  return { x: round(rect.x), y: round(rect.y), w: round(rect.w), h: round(rect.h), scrollX: round(rect.scrollX), scrollY: round(rect.scrollY) };
}

/** Builds a complete, capped finding. The only constructor the detectors use. */
export function makeFinding(input: FindingInput): Finding {
  const selector = clampText(input.selector, FINDING_CAPS.selector) || "(page)";
  const text = input.text ? clampText(input.text, FINDING_CAPS.text) : "";
  const evidence: Finding["evidence"] = {};
  for (const [k, v] of Object.entries(input.evidence ?? {})) {
    if (v === undefined) continue;
    evidence[clampText(k, 40)] = clampText(v, FINDING_CAPS.evidenceValue);
  }
  const finding: Finding = {
    id: fingerprint(input.detector, input.rule, selector, text),
    detector: input.detector,
    rule: clampText(input.rule, FINDING_CAPS.rule),
    severity: input.severity,
    message: clampText(input.message, FINDING_CAPS.message),
    evidence,
    fixHint: clampText(input.fixHint, FINDING_CAPS.fixHint),
    selector,
    context: clampText(input.context ?? "", FINDING_CAPS.context),
    rect: cleanRect(input.rect),
    source: "inspector@1",
    at: input.at ?? Date.now(),
  };
  if (text) finding.text = text;
  if (input.comment) finding.comment = clampNote(input.comment, FINDING_CAPS.comment);
  if (input.props) {
    const props: Record<string, string> = {};
    for (const [k, v] of Object.entries(input.props).slice(0, FINDING_CAPS.props)) {
      props[clampText(k, 40)] = clampText(v, FINDING_CAPS.propValue);
    }
    if (Object.keys(props).length) finding.props = props;
  }
  return finding;
}

const SEVERITY_RANK: Record<FindingSeverity, number> = { error: 0, warning: 1 };

/** Errors first, then warnings; stable inside a severity. Drops duplicates by id and trims to the per-scan cap. */
export function rankFindings(list: readonly Finding[], cap: number = FINDING_CAPS.perScan): { findings: Finding[]; dropped: number } {
  const seen = new Set<string>();
  const unique: Finding[] = [];
  for (const f of list) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    unique.push(f);
  }
  unique.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  return { findings: unique.slice(0, cap), dropped: Math.max(0, unique.length - cap) };
}

export interface FindingStats {
  total: number;
  errors: number;
  warnings: number;
  clean: boolean;
}

/** Counts findings. Ignored findings are not counted anywhere. */
export function countFindings(list: readonly Finding[], ignored: ReadonlySet<string> = new Set()): FindingStats {
  let errors = 0;
  let warnings = 0;
  for (const f of list) {
    if (ignored.has(f.id)) continue;
    if (f.severity === "error") errors++;
    else warnings++;
  }
  const total = errors + warnings;
  return { total, errors, warnings, clean: total === 0 };
}

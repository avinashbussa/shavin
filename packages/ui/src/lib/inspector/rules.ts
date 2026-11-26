/**
 * The inspector's detectors, as pure functions over data a collector gathered from the page.
 *
 * Nothing here touches the DOM: `analyzePage` takes plain numbers and strings plus two callbacks that turn an opaque
 * element reference into a selector and a label. That keeps every rule testable with fixtures, and reusable by other
 * tools later. The thresholds match the headless `render_check` so the live inspector and the CLI agree.
 */
import { contrastRatio, over, type Rgb, type Rgba } from "./color";
import { makeFinding, rankFindings, type Finding, type FindingRect } from "./schema";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Backdrop =
  | { kind: "solid"; rgb: Rgb }
  | {
      kind: "unknown";
      reason: "image" | "gradient" | "video" | "filter" | "layer";
      /** The element that paints the non-flat background (an ancestor with an image, a layer, a media element). */
      owner?: unknown;
      /** Viewport box of the owner at scan time. */
      ownerBox?: Box;
    };

export interface TextItem {
  ref: unknown;
  text: string;
  /** Viewport coordinates: the bounding box of all of the element's text. */
  box: Box;
  /** The text's own line boxes. Overlap is judged on these, so a paragraph that wraps around an inline code span is not "overlapping" it. */
  rects?: Box[];
  fontSize: number;
  lineHeight: number;
  lines: number;
  weight: number;
  /** Foreground colour, already parsed. Null when it could not be read. */
  color: Rgba | null;
  /** Product of the opacities up the tree. */
  opacity: number;
  backdrop: Backdrop;
  /** A fade or slide is running: the sampled colour is not final. */
  animating: boolean;
  /** An endless loop (marquee): skip overlap. */
  looping: boolean;
  offscreen: boolean;
}

export interface TapItem {
  ref: unknown;
  text: string;
  box: Box;
  /** Hit-area size: the larger of the visible box and a pseudo-element hit area. */
  w: number;
  h: number;
}

export interface OverflowItem {
  ref: unknown;
  box: Box;
  kind: "viewport" | "container";
  /** Human numbers, for example `ends at 1432px, viewport 1280px`. */
  measured: string;
}

export interface PageData {
  items: TextItem[];
  interactive: TapItem[];
  overflow: OverflowItem[];
  viewport: { w: number; h: number; scrollX: number; scrollY: number };
  consoleErrors: string[];
}

export interface RuleHooks {
  selectorOf(ref: unknown): string;
  contextOf(ref: unknown): string;
}

/** Limits that keep a noisy page readable. */
export const RULE_LIMITS = {
  unknownBackdrop: 10,
  overlap: 30,
  overflow: 12,
  console: 10,
  /** Overlap is only judged between boxes at least this big (px). */
  minBox: 2,
  /** Share of the smaller box that must overlap before it counts. */
  overlapRatio: 0.12,
  overlapErrorRatio: 0.3,
  tapMin: 24,
} as const;

const rectOf = (box: Box, v: PageData["viewport"]): FindingRect => ({ x: box.x, y: box.y, w: box.w, h: box.h, scrollX: v.scrollX, scrollY: v.scrollY });

const px = (n: number) => `${Math.round(n)}px`;

/** WCAG large text: 24px, or 18.66px at weight 700. */
export function neededContrast(fontSize: number, weight: number): number {
  return fontSize >= 24 || (fontSize >= 18.66 && weight >= 700) ? 3 : 4.5;
}

/** Text colour as seen on the backdrop: alpha (colour alpha times inherited opacity) composited over it. */
export function effectiveForeground(color: Rgba, opacity: number, backdrop: Rgb): Rgb {
  const top: Rgba = { rgb: color.rgb, a: color.a * opacity };
  const out = over(top, { rgb: backdrop, a: 1 });
  return out.rgb;
}

function lineHeightFindings(data: PageData, hooks: RuleHooks): Finding[] {
  const out: Finding[] = [];
  for (const it of data.items) {
    if (!(it.lineHeight < it.fontSize * 0.95)) continue;
    const multi = it.lines > 1;
    out.push(
      makeFinding({
        detector: "line-height",
        rule: "line-height.tight",
        severity: multi ? "error" : "warning",
        message: multi ? "Text lines are packed so tight they overlap." : "Text is set tighter than its font size.",
        evidence: {
          measured: `line-height ${px(it.lineHeight)}, font-size ${px(it.fontSize)}, ${it.lines} line${multi ? "s" : ""}`,
          expected: "line-height at least the font size",
        },
        fixHint: "Give the text an explicit leading: use a Heading size, or leading-tight or leading-snug.",
        selector: hooks.selectorOf(it.ref),
        context: hooks.contextOf(it.ref),
        rect: rectOf(it.box, data.viewport),
        text: it.text,
      }),
    );
  }
  return out;
}

function contrastFindings(data: PageData, hooks: RuleHooks): Finding[] {
  const out: Finding[] = [];
  /** One finding per element that paints a non-flat background, with how many text elements sit on it. */
  const owners = new Map<unknown, { first: TextItem; reason: string; box: Box; count: number }>();
  for (const it of data.items) {
    if (it.animating || it.offscreen || !it.color) continue;
    if (it.backdrop.kind === "unknown") {
      const owner = it.backdrop.owner ?? it.ref;
      const hit = owners.get(owner);
      if (hit) hit.count++;
      else owners.set(owner, { first: it, reason: it.backdrop.reason, box: it.backdrop.ownerBox ?? it.box, count: 1 });
      continue;
    }
    const bg = it.backdrop.rgb;
    const fg = effectiveForeground(it.color, it.opacity, bg);
    const need = neededContrast(it.fontSize, it.weight);
    const ratio = contrastRatio(fg, bg);
    // 3% tolerance for rounding; below 90% of the need is an error.
    if (ratio >= need * 0.97) continue;
    out.push(
      makeFinding({
        detector: "contrast",
        rule: "contrast.text",
        severity: ratio < need * 0.9 ? "error" : "warning",
        message: "Text is hard to read on its background.",
        evidence: { measured: `${ratio.toFixed(1)}:1`, expected: `${need}:1`, backdrop: "solid ancestor" },
        fixHint: "Use text-fg or text-fg-subtle on bg-surface, or darken the text token.",
        selector: hooks.selectorOf(it.ref),
        context: hooks.contextOf(it.ref),
        rect: rectOf(it.box, data.viewport),
        text: it.text,
      }),
    );
  }
  let shown = 0;
  for (const [owner, o] of owners) {
    if (shown >= RULE_LIMITS.unknownBackdrop) break;
    shown++;
    out.push(
      makeFinding({
        detector: "contrast",
        rule: "contrast.unknown-backdrop",
        severity: "warning",
        message: "Contrast cannot be judged here: the background is not a flat colour.",
        evidence: { reason: o.reason, texts: String(o.count) },
        fixHint: "Check it with render_check, which samples the real pixels.",
        selector: hooks.selectorOf(owner),
        context: hooks.contextOf(owner),
        rect: rectOf(o.box, data.viewport),
      }),
    );
  }
  return out;
}

/** Sweep over line boxes sorted by top edge, so a page with thousands of text boxes stays cheap. */
function overlapFindings(data: PageData, hooks: RuleHooks): Finding[] {
  const out: Finding[] = [];
  const seenPairs = new Set<string>();
  type Entry = { item: TextItem; box: Box };
  const list: Entry[] = [];
  for (const item of data.items) {
    if (item.looping) continue;
    for (const box of item.rects && item.rects.length ? item.rects : [item.box]) {
      if (box.w > RULE_LIMITS.minBox && box.h > RULE_LIMITS.minBox) list.push({ item, box });
    }
  }
  list.sort((a, b) => a.box.y - b.box.y);
  for (let i = 0; i < list.length && out.length < RULE_LIMITS.overlap; i++) {
    const a = list[i]!;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j]!;
      if (b.box.y >= a.box.y + a.box.h) break;
      if (a.item === b.item) continue;
      const ox = Math.min(a.box.x + a.box.w, b.box.x + b.box.w) - Math.max(a.box.x, b.box.x);
      const oy = Math.min(a.box.y + a.box.h, b.box.y + b.box.h) - Math.max(a.box.y, b.box.y);
      if (ox <= 2 || oy <= 2) continue;
      const ratio = (ox * oy) / Math.min(a.box.w * a.box.h, b.box.w * b.box.h);
      if (ratio <= RULE_LIMITS.overlapRatio) continue;
      const selA = hooks.selectorOf(a.item.ref);
      const selB = hooks.selectorOf(b.item.ref);
      if (selA === selB) continue;
      const key = selA < selB ? `${selA}|${selB}` : `${selB}|${selA}`;
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      out.push(
        makeFinding({
          detector: "overlap",
          rule: "overlap.text",
          severity: ratio > RULE_LIMITS.overlapErrorRatio ? "error" : "warning",
          message: "Two pieces of text sit on top of each other.",
          evidence: { measured: `${px(ox)} by ${px(oy)} overlap with ${selB}`, expected: "no overlap" },
          fixHint: "Give the text room: add gap or a wrapping container, or shorten the copy.",
          selector: selA,
          context: hooks.contextOf(a.item.ref),
          rect: rectOf(a.box, data.viewport),
          text: a.item.text,
        }),
      );
      if (out.length >= RULE_LIMITS.overlap) break;
    }
  }
  return out;
}

function tapFindings(data: PageData, hooks: RuleHooks): Finding[] {
  const out: Finding[] = [];
  const min = RULE_LIMITS.tapMin;
  for (const it of data.interactive) {
    if (it.w >= min && it.h >= min) continue;
    out.push(
      makeFinding({
        detector: "tap-target",
        rule: "tap-target.min-24",
        severity: it.w < min && it.h < min ? "error" : "warning",
        message: "Tap target is too small to hit reliably.",
        evidence: { measured: `${Math.round(it.w)} by ${Math.round(it.h)}px`, expected: "at least 24 by 24px (44 on touch)" },
        fixHint: "Use a Button or IconButton size md, or add the hit-area utility.",
        selector: hooks.selectorOf(it.ref),
        context: hooks.contextOf(it.ref),
        rect: rectOf(it.box, data.viewport),
        text: it.text,
      }),
    );
  }
  return out;
}

function overflowFindings(data: PageData, hooks: RuleHooks): Finding[] {
  const out: Finding[] = [];
  for (const it of data.overflow.slice(0, RULE_LIMITS.overflow)) {
    const viewport = it.kind === "viewport";
    out.push(
      makeFinding({
        detector: "overflow",
        rule: viewport ? "overflow.viewport" : "overflow.container",
        severity: "error",
        message: viewport ? "This element runs past the edge of the screen." : "Content spills out of its box.",
        evidence: { measured: it.measured, expected: viewport ? "fits the viewport width" : "fits its container" },
        fixHint: "Let it wrap or scroll inside its own box: min-w-0, overflow-x-auto, or flex-wrap.",
        selector: hooks.selectorOf(it.ref),
        context: hooks.contextOf(it.ref),
        rect: rectOf(it.box, data.viewport),
      }),
    );
  }
  return out;
}

function consoleFindings(data: PageData): Finding[] {
  const seen = new Set<string>();
  const out: Finding[] = [];
  for (const message of data.consoleErrors) {
    const key = message.slice(0, 120);
    if (seen.has(key)) continue;
    seen.add(key);
    if (out.length >= RULE_LIMITS.console) break;
    out.push(
      makeFinding({
        detector: "console",
        rule: "console.error",
        severity: "error",
        message: "The page logged an error.",
        evidence: { measured: message },
        fixHint: "Open the console for the stack trace, then fix the source named in the message.",
        selector: "(page)",
        context: "Console",
        rect: null,
        text: message.slice(0, 40),
      }),
    );
  }
  return out;
}

/** Runs every detector and returns ranked, deduplicated, capped findings. */
export function analyzePage(data: PageData, hooks: RuleHooks): { findings: Finding[]; dropped: number } {
  const all = [
    ...lineHeightFindings(data, hooks),
    ...contrastFindings(data, hooks),
    ...overlapFindings(data, hooks),
    ...tapFindings(data, hooks),
    ...overflowFindings(data, hooks),
    ...consoleFindings(data),
  ];
  return rankFindings(all);
}

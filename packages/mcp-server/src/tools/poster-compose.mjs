/**
 * Poster composer for compose_to_canvas on social-* frames.
 *
 * A social frame is an exact canvas (1080x1350, 1080x1080 or 1600x900) that clips at its edge. The page-section
 * pipeline (scored example blocks stacked top to bottom) does not fit it and ignores the prompt's own text,
 * so social frames get ONE poster section instead: the prompt's headline, subhead and CTA, sized to fit.
 *
 * Pure functions, no I/O: `parsePosterCopy` (prompt -> copy), `fitPoster` (copy + canvas -> heading size / fit
 * verdict) and `composePoster` (both -> module code + a report the tool prints).
 */

import { SOCIAL_FRAME_SIZES } from "./social-presets.mjs";

const LABELS = {
  headline: /\b(?:headline|heading|title)\b/i,
  subhead: /\b(?:sub-?head(?:line|ing)?|sub-?title|tagline|supporting\s+(?:line|text)|sub-?line)\b/i,
  cta: /\b(?:cta|call[\s-]*to[\s-]*action|button)\b/i,
};
const WANTS = {
  subhead: /\b(?:sub-?head(?:line|ing)?|sub-?title|tagline|supporting\s+(?:line|text)|sub-?line|one-?line)\b/i,
  cta: /\b(?:cta|call[\s-]*to[\s-]*action|button)\b/i,
};

/** The placeholders used when a prompt asks for an element but gives no text for it. */
export const POSTER_PLACEHOLDERS = {
  headline: "Your headline here",
  subhead: "Your one-line subhead here",
  cta: "Your call to action",
};

const QUOTE_RE = /["“„«]([^"”“»]{1,500})["”“»]/g;

/**
 * Pull the poster text out of a prompt.
 * Quoted strings are the copy; the words just before a quote say which slot it fills ("headline", "subhead",
 * "CTA"/"button"). Quotes without a label fill the free slots in order: headline, subhead, CTA.
 * @returns {{ headline?: string, subhead?: string, cta?: string, wants: { subhead: boolean, cta: boolean } }}
 */
export function parsePosterCopy(prompt = "") {
  const text = String(prompt);
  const out = {};
  const unlabeled = [];
  let prevEnd = 0;
  for (const m of text.matchAll(QUOTE_RE)) {
    const copy = m[1].trim();
    if (!copy) continue;
    const before = text.slice(Math.max(prevEnd, m.index - 60), m.index);
    prevEnd = m.index + m[0].length;
    // The label nearest the quote wins ("bold headline" -> headline).
    let slot = null;
    let at = -1;
    for (const [name, re] of Object.entries(LABELS)) {
      for (const hit of before.matchAll(new RegExp(re.source, "gi"))) {
        if (hit.index >= at) { at = hit.index; slot = name; }
      }
    }
    if (slot && out[slot] === undefined) out[slot] = copy;
    else unlabeled.push(copy);
  }
  // `Headline: text` / `CTA: text` lines (no quotes). Stops at a newline, `;` or `|`.
  for (const [name, re] of Object.entries(LABELS)) {
    if (out[name] !== undefined) continue;
    const m = text.match(new RegExp(`(?:^|[\\n;,|])\\s*(?:${re.source})\\s*[:=]\\s*([^\\n;|]{1,200})`, "i"));
    if (m) out[name] = m[1].trim().replace(/[.,]$/, "");
  }
  for (const slot of ["headline", "subhead", "cta"]) {
    if (out[slot] === undefined && unlabeled.length) out[slot] = unlabeled.shift();
  }
  return {
    ...out,
    wants: {
      subhead: out.subhead !== undefined || WANTS.subhead.test(text),
      cta: out.cta !== undefined || WANTS.cta.test(text),
    },
  };
}

/** Heading sizes, largest first: font px (the fluid clamp's cap) and line-height. */
const HEADING_STEPS = [
  { size: "5xl", px: 72, lh: 1.05 },
  { size: "4xl", px: 60, lh: 1.08 },
  { size: "3xl", px: 48, lh: 1.15 },
  { size: "2xl", px: 36, lh: 1.2 },
];
const SUBHEAD = { size: "2xl", px: 34, lh: 1.4 };
const CTA_HEIGHT = 48; // Button size="lg" (h-12)
const GAP_HEADING_SUB = 24;
const GAP_BLOCK = 40;
const AVG_CHAR = 0.54; // average display glyph width in em (bold, tight tracking): a slight over-estimate on purpose
const AVG_CHAR_SUB = 0.5;

/** Per-preset layout: padding classes (and their px), the widest the text column may be, the most heading lines. */
const LAYOUTS = {
  "social-portrait": { padClass: "px-20 py-24", padX: 80, padY: 96, maxCol: 896, colClass: "max-w-4xl", maxLines: 5 },
  "social-square": { padClass: "px-20 py-20", padX: 80, padY: 80, maxCol: 896, colClass: "max-w-4xl", maxLines: 4 },
  "social-wide": { padClass: "px-24 py-16", padX: 96, padY: 64, maxCol: 1024, colClass: "max-w-5xl", maxLines: 3 },
};

/** Greedy word wrap on an average glyph width. Returns the line count, or Infinity when one word is wider than the column. */
function wrapLines(text, colPx, charPx) {
  const perLine = Math.floor(colPx / charPx);
  let lines = 1;
  let used = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (word.length > perLine) return Infinity;
    const need = used === 0 ? word.length : used + 1 + word.length;
    if (need > perLine) { lines += 1; used = word.length; } else used = need;
  }
  return lines;
}

/**
 * Pick the largest heading size at which the whole stack (heading, subhead, CTA) fits the canvas.
 * @returns {{ ok: boolean, headingSize: string, headingLines: number, usedHeight: number, availableHeight: number, columnWidth: number }}
 */
export function fitPoster({ device, headline, subhead, cta }) {
  const canvas = SOCIAL_FRAME_SIZES[device];
  const layout = LAYOUTS[device];
  const column = Math.min(layout.maxCol, canvas.width - layout.padX * 2);
  const available = canvas.height - layout.padY * 2;
  const subLines = subhead ? Math.min(wrapLines(subhead, column, SUBHEAD.px * AVG_CHAR_SUB), Infinity) : 0;
  const subHeight = subhead ? subLines * SUBHEAD.px * SUBHEAD.lh + GAP_HEADING_SUB : 0;
  const ctaHeight = cta ? CTA_HEIGHT + GAP_BLOCK : 0;
  let best = null;
  for (const step of HEADING_STEPS) {
    const lines = wrapLines(headline, column, step.px * AVG_CHAR);
    const used = (Number.isFinite(lines) ? lines : 99) * step.px * step.lh + subHeight + ctaHeight;
    const fits = Number.isFinite(lines) && lines <= layout.maxLines && Number.isFinite(subLines) && used <= available * 0.94;
    best = { ok: fits, headingSize: step.size, headingLines: lines, usedHeight: Math.round(used), availableHeight: available, columnWidth: column };
    if (fits) return best;
  }
  return best;
}

/** Escape text for a JSX child: braces and angle brackets would otherwise start an expression or a tag. */
const jsxText = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");

/**
 * Compose one poster section for a social preset.
 * @param {{ prompt: string, device: "social-portrait" | "social-square" | "social-wide" }} args
 * @returns {{ code: string, slug: string, copy: object, fit: object, warnings: string[] }}
 */
export function composePoster({ prompt, device }) {
  const canvas = SOCIAL_FRAME_SIZES[device];
  const layout = LAYOUTS[device];
  if (!canvas || !layout) throw new Error(`composePoster: "${device}" is not a social preset.`);
  const parsed = parsePosterCopy(prompt);
  const warnings = [];

  const copy = {
    headline: parsed.headline ?? POSTER_PLACEHOLDERS.headline,
    subhead: parsed.subhead ?? (parsed.wants.subhead ? POSTER_PLACEHOLDERS.subhead : undefined),
    cta: parsed.cta ?? (parsed.wants.cta ? POSTER_PLACEHOLDERS.cta : undefined),
  };
  const recover = `Re-run compose_to_canvas with the text quoted in the prompt, for example: headline "Your headline", subhead "Your subhead", CTA "Your call to action". Or double-click the text on the canvas and type it.`;
  if (parsed.headline === undefined) {
    warnings.push(`No headline text found in the prompt, so the placeholder "${POSTER_PLACEHOLDERS.headline}" was used (fixture copy is never used). ${recover}`);
  }
  if (parsed.subhead === undefined && parsed.wants.subhead) {
    warnings.push(`The prompt asks for a subhead but gives no text for it, so the placeholder "${POSTER_PLACEHOLDERS.subhead}" was used. ${recover}`);
  }
  if (parsed.cta === undefined && parsed.wants.cta) {
    warnings.push(`The prompt asks for a call to action but gives no text for it, so the placeholder "${POSTER_PLACEHOLDERS.cta}" was used. ${recover}`);
  }

  const fit = fitPoster({ device, ...copy });
  if (!fit.ok) {
    const tooLong = fit.headingLines === Infinity
      ? "one word is wider than the canvas"
      : `the text needs about ${fit.usedHeight}px of the ${fit.availableHeight}px available at the smallest heading size`;
    warnings.push(
      `The text may not fit the ${canvas.width}x${canvas.height} canvas (${tooLong}), so it could be clipped at the edge. ` +
        `Recovery: (1) shorten the headline to about ${Math.max(20, Math.floor((fit.columnWidth / (36 * AVG_CHAR)) * (layout.maxLines - 1)))} characters or fewer and shorten the subhead to one short line, then re-run compose_to_canvas; ` +
        `(2) or use a larger preset ("social-portrait" is 1080x1350); (3) or split the message across two frames.`,
    );
  }

  const heading = `<Heading as="h1" size="${fit.headingSize}">${jsxText(copy.headline)}</Heading>`;
  const sub = copy.subhead
    ? `\n          <Heading as="p" size="${SUBHEAD.size}" weight="normal" className="max-w-xl text-fg-muted text-pretty">${jsxText(copy.subhead)}</Heading>`
    : "";
  const cta = copy.cta ? `\n        <Button size="lg" className="self-start">${jsxText(copy.cta)}</Button>` : "";
  const imports = ["Button", "Flex", "Heading", "Section"].filter((n) => n !== "Button" || copy.cta).join(", ");
  const compName = `Poster${device.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("")}`;
  const code = `import { ${imports} } from "@shavin/ui";

export function ${compName}() {
  return (
    <Section size="none" className="flex h-[${canvas.height}px] flex-col justify-center overflow-hidden ${layout.padClass}">
      <Flex direction="column" gap="7" className="${layout.colClass}">
        <Flex direction="column" gap="5">
          ${heading}${sub}
        </Flex>${cta}
      </Flex>
    </Section>
  );
}
`;
  return { code, slug: `poster-${device}`, copy, fit, warnings };
}

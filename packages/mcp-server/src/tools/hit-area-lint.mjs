/**
 * Warning-level rule for validate_code: `hitArea="none"` (and the `hit-area-none` class) drop a control's
 * invisible hit area, which can leave it below the WCAG 2.2 AA 2.5.8 floor (24x24 CSS px). Allowed, so it is a
 * warning (never fails a file), with the trade-off and how to restore the floor.
 */
import { scanTags } from "./usage-check.mjs";

const ANY_COMPONENT = { has: () => true };

const RESTORE = 'Restore the floor: remove the prop, use hitArea="default" (or "touch"), or make sure the control has a 24px target another way (its own size or padding, or the hit-area utility).';

function lineOf(code, index) {
  let n = 1;
  for (let i = 0; i < index && i < code.length; i++) if (code.charCodeAt(i) === 10) n++;
  return n;
}

/** @returns {{ rule: string, message: string }[]} */
export function findHitAreaWarnings(code) {
  const out = [];
  const seen = new Set();
  const add = (key, message) => {
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ rule: "hit-area-none", message });
  };

  for (const tag of scanTags(code, ANY_COMPONENT)) {
    const a = tag.attrs.find((x) => x.name === "hitArea");
    if (a && a.value === "none") {
      add(`jsx:${tag.name}`, `<${tag.name} hitArea="none"> drops the control below the WCAG 2.2 AA 2.5.8 24px target size floor unless it is already 24px or larger (dense toolbars are the usual reason). ${RESTORE}`);
    }
  }

  const re = /(?<![\w-])((?:[\w-]+:)*)hit-area-none(?![\w-])/g;
  let m;
  while ((m = re.exec(code))) {
    add(`class:${lineOf(code, m.index)}`, `Class hit-area-none (line ${lineOf(code, m.index)}) removes the hit area, so the element can fall below the WCAG 2.2 AA 2.5.8 24px target size floor unless it is already 24px or larger. ${RESTORE.replace("remove the prop, use hitArea=\"default\" (or \"touch\")", "remove the class (or use hit-area / hit-area-touch)")}`);
  }
  return out;
}

/**
 * A CSS selector that matches exactly one element, short enough to read and stable enough to survive a re-render.
 * Pure DOM, no React. Used for finding ids and for what the agent receives.
 */

const MAX_DEPTH = 8;

function esc(value: string): string {
  const css = (globalThis as { CSS?: { escape?: (s: string) => string } }).CSS;
  if (css?.escape) return css.escape(value);
  return value.replace(/[^a-zA-Z0-9_\u00a0-\uffff-]/g, (c) => `\\${c}`);
}

/** Generated ids and classes (React `:r1:`, CSS-module and build hashes) change between builds: do not anchor on them. */
function looksGenerated(token: string): boolean {
  if (/^:r[0-9a-z]+:$/i.test(token)) return true;
  if (/\d{4,}/.test(token)) return true;
  if (/^[a-z]{1,4}[-_][0-9a-f]{5,}$/i.test(token)) return true;
  if (/[0-9a-f]{8,}$/i.test(token) && /\d/.test(token)) return true;
  return false;
}

function stableClasses(el: Element): string[] {
  const out: string[] = [];
  for (const c of Array.from(el.classList)) {
    if (c.length > 28 || /[:[\]/%.!]/.test(c) || looksGenerated(c)) continue;
    out.push(c);
    if (out.length === 2) break;
  }
  return out;
}

function matchCount(root: ParentNode, selector: string): number {
  try {
    return root.querySelectorAll(selector).length;
  } catch {
    return Infinity;
  }
}

function anchor(el: Element): string | null {
  const id = el.getAttribute("id");
  if (id && /^[A-Za-z][\w-]*$/.test(id) && !looksGenerated(id)) return `#${esc(id)}`;
  for (const attr of ["data-testid", "data-test", "data-cy"]) {
    const v = el.getAttribute(attr);
    if (v && v.length <= 60 && !/["\\]/.test(v)) return `[${attr}="${v}"]`;
  }
  return null;
}

function nthOfType(el: Element): number {
  let n = 1;
  for (let s = el.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === el.tagName) n++;
  return n;
}

function hasSameTypeSibling(el: Element): boolean {
  const parent = el.parentElement;
  if (!parent) return false;
  for (const s of Array.from(parent.children)) if (s !== el && s.tagName === el.tagName) return true;
  return false;
}

function segment(el: Element, withNth: boolean): string {
  const tag = el.tagName.toLowerCase();
  const classes = stableClasses(el).map((c) => `.${esc(c)}`).join("");
  const base = `${tag}${classes}`;
  return withNth && hasSameTypeSibling(el) ? `${base}:nth-of-type(${nthOfType(el)})` : base;
}

/**
 * Walks up from `el`, adding one segment at a time, and stops as soon as the path matches only `el`.
 * Falls back to `:nth-of-type` on every level when classes are not enough.
 */
export function uniqueSelector(el: Element, root: ParentNode = el.ownerDocument): string {
  if (!el || el.nodeType !== 1) return "";
  const own = anchor(el);
  if (own && matchCount(root, own) === 1) return own;

  for (const withNth of [false, true]) {
    const parts: string[] = [];
    let node: Element | null = el;
    for (let depth = 0; node && depth < MAX_DEPTH; depth++) {
      const a = depth > 0 ? anchor(node) : null;
      if (a && matchCount(root, a) === 1) {
        parts.unshift(a);
        break;
      }
      parts.unshift(segment(node, withNth));
      const candidate = parts.join(" > ");
      if (matchCount(root, candidate) === 1 && root.querySelector(candidate) === el) return candidate;
      node = node.parentElement;
      if (!node || node === (el.ownerDocument?.documentElement ?? null)) break;
    }
    const candidate = parts.join(" > ");
    if (candidate && matchCount(root, candidate) === 1 && root.querySelector(candidate) === el) return candidate;
  }

  // Last resort: an exact :nth-child path from the body.
  const path: string[] = [];
  let node: Element | null = el;
  while (node && node.tagName !== "BODY" && node.tagName !== "HTML" && path.length < 24) {
    const parent: Element | null = node.parentElement;
    const index = parent ? Array.from(parent.children).indexOf(node) + 1 : 1;
    path.unshift(`${node.tagName.toLowerCase()}:nth-child(${index})`);
    node = parent;
  }
  return `body > ${path.join(" > ")}`;
}

/** `tag.class` of an element, for the short label next to a finding. */
export function describeElement(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const classes = stableClasses(el).map((c) => `.${c}`).join("");
  return `${tag}${classes}`;
}

/** A label such as `section.hero > h1.title`: the element and its parent. */
export function contextLabel(el: Element): string {
  const parent = el.parentElement;
  const self = describeElement(el);
  if (!parent || parent.tagName === "BODY" || parent.tagName === "HTML") return self;
  return `${describeElement(parent)} > ${self}`;
}

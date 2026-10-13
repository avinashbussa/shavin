/**
 * Manifest-backed JSX usage check for validate_code.
 * Flags, with high precision only:
 *   - string-literal values outside a component's cva variant set or a pure
 *     string-union prop type            (<Button variant="primary">)
 *   - near-miss prop names (typos / wrong names) with a "did you mean"
 *                                        (<Button varient="solid">, <Badge colour=..>)
 * Spreads, dynamic expressions and standard HTML/aria/data/on* attrs are ignored.
 */

const HTML_OK = new Set([
  "children", "className", "style", "ref", "key", "id", "role", "tabIndex", "title", "href", "target", "rel",
  "type", "name", "value", "defaultValue", "placeholder", "disabled", "required", "readOnly", "htmlFor", "src", "alt",
  "width", "height", "lang", "dir", "hidden", "autoFocus", "autoComplete", "min", "max", "step", "rows", "cols",
  "checked", "defaultChecked", "asChild", "as", "suppressHydrationWarning", "download", "draggable", "form",
  "method", "action", "pattern", "maxLength", "minLength", "multiple", "loading", "sizes", "srcSet", "colSpan", "rowSpan",
]);

function lev(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

/** Parse `<Name ...attrs>` openings. Returns [{name, attrs:[{name, value|null, expr}], spread}] */
export function scanTags(code, known) {
  const out = [];
  const re = /<([A-Z][A-Za-z0-9]*)(?=[\s/>])/g;
  let m;
  while ((m = re.exec(code))) {
    if (!known.has(m[1])) continue;
    let i = re.lastIndex, depth = 0, quote = null;
    const attrs = [];
    let spread = false;
    for (;;) {
      while (i < code.length && /\s/.test(code[i])) i++;
      if (i >= code.length) break;
      if (code[i] === ">" || (code[i] === "/" && code[i + 1] === ">")) break;
      if (code[i] === "{") { // spread {...x}
        spread = true; depth = 0;
        for (; i < code.length; i++) { if (code[i] === "{") depth++; else if (code[i] === "}" && --depth === 0) { i++; break; } }
        continue;
      }
      const nm = /^[A-Za-z_][\w:-]*/.exec(code.slice(i));
      if (!nm) break;
      i += nm[0].length;
      const attr = { name: nm[0], value: null, dynamic: false };
      if (code[i] === "=") {
        i++;
        if (code[i] === '"' || code[i] === "'") {
          quote = code[i]; const end = code.indexOf(quote, i + 1);
          if (end < 0) break;
          attr.value = code.slice(i + 1, end); i = end + 1;
        } else if (code[i] === "{") {
          depth = 0; const start = i;
          for (; i < code.length; i++) {
            const c = code[i];
            if (c === "{") depth++;
            else if (c === "}" && --depth === 0) { i++; break; }
          }
          const inner = code.slice(start + 1, i - 1).trim();
          const lit = /^(["'])([^"'`$\\]*)\1$/.exec(inner);
          if (lit) attr.value = lit[2]; else attr.dynamic = true;
        }
      }
      attrs.push(attr);
    }
    out.push({ name: m[1], attrs, spread });
  }
  return out;
}

function allowedValues(comp, prop) {
  if (comp.variants && comp.variants[prop]) return comp.variants[prop];
  const p = (comp.props || []).find((x) => x.name === prop);
  if (!p) return null;
  const parts = String(p.type).replace(/\| (null|undefined)/g, "").split("|").map((s) => s.trim());
  if (parts.length && parts.every((s) => /^"[^"]*"$/.test(s) || /^'[^']*'$/.test(s))) return parts.map((s) => s.slice(1, -1));
  return null;
}

// Non-component exports of the "use client" root bundle: calling them from a
// Server Component throws. They are also exported from "@shavin/ui/server".
const SERVER_SAFE = new Set([
  "cn", "isLocalhost", "getWebsiteUrl", "getStudioUrl", "getDocsUrl", "getCommunityUrl", "getKitsUrl", "getAssetsUrl",
  "concentricContainerStyle", "concentricCompoundStyle", "concentricBoundaryResetStyle", "withConcentricStyle",
  "cardPaddingToScale", "surfaceClass", "SHAVIN_META",
]);

function checkServerImports(code) {
  if (/^\s*["']use client["']/m.test(code.slice(0, 400))) return [];
  const out = [];
  const re = /import\s*\{([^}]*)\}\s*from\s*["']@shavin\/ui["']/g;
  let m;
  while ((m = re.exec(code))) {
    const bad = m[1].split(",").map((x) => x.trim().replace(/^type\s+.*/, "").split(/\s+as\s+/)[0]).filter((n) => SERVER_SAFE.has(n));
    if (bad.length) out.push(`${bad.join(", ")} from "@shavin/ui" fails in Server Components (no "use client" here) -> import from "@shavin/ui/server"`);
  }
  return out;
}

export function checkUsage(code, COMPONENTS) {
  const issues0 = checkServerImports(code);
  const comps = new Map((COMPONENTS?.components ?? []).map((c) => [c.name, c]));
  if (!comps.size) return issues0;
  const issues = [...issues0];
  const seen = new Set();
  for (const tag of scanTags(code, comps)) {
    const comp = comps.get(tag.name);
    const names = new Set([...Object.keys(comp.variants || {}), ...(comp.props || []).map((p) => p.name)]);
    for (const a of tag.attrs) {
      let msg = null;
      if (names.has(a.name)) {
        const vals = a.value != null ? allowedValues(comp, a.name) : null;
        if (vals && vals.length && !vals.includes(a.value)) msg = `${tag.name} ${a.name}="${a.value}" -> ${vals.join("/")}`;
      } else if (!HTML_OK.has(a.name) && !/^(on[A-Z]|aria-|data-)/.test(a.name)) {
        let best = null, bd = 3;
        for (const n of [...names, ...HTML_OK]) { const d = lev(a.name.toLowerCase(), n.toLowerCase()); if (d < bd) { bd = d; best = n; } }
        if (best && bd <= 2 && a.name.length > 3) msg = `${tag.name} unknown prop "${a.name}" -> did you mean "${best}"?`;
      }
      if (msg && !seen.has(msg)) { seen.add(msg); issues.push(msg); }
    }
    if (tag.name === "Grid") {
      const get = (n) => tag.attrs.find((a) => a.name === n);
      const auto = get("columns")?.value === "auto";
      const cls = get("className")?.value || "";
      const add = (m) => { if (!seen.has(m)) { seen.add(m); issues.push(m); } };
      if (auto && get("stack") && get("stack").value !== "none") add('Grid columns="auto" wraps by itself; remove stack (it only applies to numeric columns)');
      if (auto && /(^|\s)([\w-]+:)*grid-cols-/.test(cls)) add('Grid columns="auto" with a grid-cols-* className: the class overrides the intrinsic columns. Pick one');
      if (!auto && (get("minWidth") || get("maxColumns"))) add('Grid minWidth/maxColumns only apply with columns="auto"');
    }
  }
  // Placement inside an intrinsic grid is meaningless: tracks come and go with the width.
  if (/<Grid\b[^>]*\bcolumns="auto"/.test(code) && /\b(col|row)-span-\d|\b(col|row)-start-\d|\bgrid-(cols|rows)-subgrid/.test(code)) {
    const m = 'Grid columns="auto" with col-span/row-span/col-start in the same file: spans assume a fixed track count (bento, split, feature+list). Use numeric columns for placed layouts';
    if (!seen.has(m)) { seen.add(m); issues.push(m); }
  }
  return issues;
}

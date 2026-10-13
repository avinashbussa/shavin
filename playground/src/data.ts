import manifest from "@shavin/ui/components.json";
import type { ComponentDoc } from "../../packages/ui/src/authoring/types";

export type { ComponentDoc };

export type ManifestProp = { name: string; type: string; required: boolean; doc?: string; default?: string };

export type ManifestComponent = {
  name: string;
  file: string;
  kind: string;
  radix: string | null;
  description?: string;
  bestPractices?: { guidance: boolean; description: string }[];
  examples?: { title: string; code: string }[];
  variants: Record<string, string[]>;
  defaultVariants: Record<string, string>;
  props: ManifestProp[];
  exports: string[];
  /** Docs sidebar group: layout | typography | components | internal. */
  group?: string;
  /** Shavin tooling rather than a design primitive. */
  internal?: boolean;
};

export type Check = { label: string; ok: boolean; hint: string; soft?: boolean };

export type Primitive = {
  /** Folder name under packages/ui/src/primitives — also the route. */
  slug: string;
  name: string;
  category: string;
  /** Shavin's own tooling (doc says `internal: true`): shown under "Internal tools". */
  internal: boolean;
  doc?: ComponentDoc;
  docFile?: string;
  /** Manifest entry for the primitive itself. */
  main?: ManifestComponent;
  /** Other components exported from the same folder (Dialog parts, etc.). */
  parts: ManifestComponent[];
  checks: Check[];
};

// Eager glob: editing any .doc.ts hot-reloads the page that shows it.
const docModules = import.meta.glob<{ docs?: ComponentDoc; doc?: ComponentDoc }>(
  "../../packages/ui/src/primitives/*/*.doc.ts",
  { eager: true },
);

// Same structure as the docs sidebar (Components → Layout, Typography, Components).
// Each doc file sets `group`; the manifest carries it on every entry.
const GROUP_LABELS: Record<string, string> = {
  layout: "Layout",
  typography: "Typography",
  components: "Components",
};
export const INTERNAL_CATEGORY = "Internal tools";
export const CATEGORY_ORDER = ["Layout", "Typography", "Components", INTERNAL_CATEGORY];

const folderOf = (file: string) => file.match(/primitives\/([^/]+)\//)?.[1];

function checksFor(p: Omit<Primitive, "checks">): Check[] {
  const d = p.doc;
  const bp = d?.usage?.bestPractices ?? [];
  // Keyboard notes are required for Radix-backed components people operate,
  // not for display parts that wrap a static Radix primitive.
  const STATIC_RADIX = /react-(aspect-ratio|avatar|progress|separator|label|visually-hidden|scroll-area|icons)$/;
  const operated = Boolean(p.main?.radix && !STATIC_RADIX.test(p.main.radix));
  const checks: Check[] = [
    { label: "Has a .doc.ts", ok: Boolean(d), hint: `Add packages/ui/src/primitives/${p.slug}/${p.slug}.doc.ts (see Button.doc.ts).` },
    {
      label: "In components.json",
      ok: Boolean(p.main),
      hint: "Export it from packages/ui/src/index.ts, then run npm run manifest:gen.",
    },
    { label: "Description", ok: Boolean(d?.description?.trim()), hint: "One sentence on what it is for." },
    { label: "Examples", ok: (d?.examples?.length ?? 0) > 0, hint: "Add at least one example with JSX code." },
    {
      label: "Do and Don't",
      ok: bp.some((b) => b.guidance) && bp.some((b) => !b.guidance),
      hint: "Add at least one Do and one Don't under usage.bestPractices.",
    },
    { label: "Accessibility notes", ok: (d?.accessibility?.length ?? 0) > 0, hint: "List roles, labels and focus behaviour." },
    {
      label: "Keyboard notes",
      ok: Boolean(d?.keyboard?.trim()),
      hint: "Describe the keys it responds to.",
      soft: !operated,
    },
  ];
  if (d && p.main) {
    const fresh =
      (p.main.description ?? "") === (d.description ?? "") &&
      (p.main.examples?.length ?? 0) === (d.examples?.length ?? 0) &&
      (p.main.bestPractices?.length ?? 0) === bp.length;
    checks.push({
      label: "Manifest up to date",
      ok: fresh,
      hint: "Run npm run manifest:gen and commit components.json.",
    });
  }
  return checks;
}

export function loadPrimitives(): Primitive[] {
  const components = (manifest as unknown as { components: ManifestComponent[] }).components;
  const byFolder = new Map<string, Omit<Primitive, "checks">>();
  const ensure = (slug: string) => {
    let p = byFolder.get(slug);
    if (!p) {
      p = { slug, name: slug, category: "Components", internal: false, parts: [] };
      byFolder.set(slug, p);
    }
    return p;
  };

  for (const [file, mod] of Object.entries(docModules)) {
    const slug = folderOf(file);
    const doc = mod.docs ?? mod.doc;
    if (!slug || !doc) continue;
    const p = ensure(slug);
    p.doc = doc;
    p.name = doc.name || slug;
    p.docFile = file.replace(/^(\.\.\/)+/, "");
  }
  for (const c of components) {
    const slug = folderOf(c.file);
    if (!slug) continue;
    const p = ensure(slug);
    if (c.name === p.name || (!p.doc && c.name === slug)) p.main = c;
    else p.parts.push(c);
  }
  for (const p of byFolder.values()) {
    if (!p.main && p.parts.length) p.main = p.parts.shift();
    p.internal = Boolean(p.doc?.internal || p.main?.internal);
    const group = p.doc?.group ?? p.main?.group ?? "components";
    p.category = p.internal ? INTERNAL_CATEGORY : GROUP_LABELS[group] ?? "Components";
  }
  return [...byFolder.values()]
    .map((p) => ({ ...p, checks: checksFor(p) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const required = (p: Primitive) => p.checks.filter((c) => !c.soft);
export const passing = (p: Primitive) => required(p).filter((c) => c.ok).length;

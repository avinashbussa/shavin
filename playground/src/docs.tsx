import type { ReactNode } from "react";
import { CodeBlock as DSCodeBlock, type CodeBlockProps, Heading, Text, Code, cn } from "@shavin/ui";
import type { BestPracticeDoc } from "../../packages/ui/src/authoring/types";
import type { ManifestComponent } from "./data";

/*
 * The docs site's page building blocks (apps/docs/src/components/Docs.tsx),
 * reproduced here so a primitive looks the same in the playground as it will
 * on the docs site. Keep the class names in step with that file.
 */

export function CodeBlock({ appearance = "dark", ...props }: CodeBlockProps) {
  return <DSCodeBlock appearance={appearance} {...props} />;
}

export function DocExample({
  title,
  description,
  code,
  children,
  defaultOpen = false,
}: {
  title?: string;
  description?: string;
  code: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <section className="mb-8 w-full min-w-0">
      {title && (
        <Heading as="h3" size="sm" className={cn("font-medium", description ? "mb-1.5" : "mb-4")}>
          {title}
        </Heading>
      )}
      {description && <p className="mb-4 text-sm text-fg-muted leading-relaxed">{description}</p>}
      <CodeBlock code={code} split="vertical" variant="collapsible" state={defaultOpen ? "open" : "close"} description={description}>
        {children}
      </CodeBlock>
    </section>
  );
}

type Row = { prop: string; type: string; def: string; required: boolean; doc?: string };

export function PropsTable({ comp }: { comp: ManifestComponent }) {
  const explicit: Row[] = (comp.props ?? []).map((p) => ({
    prop: p.name,
    type: p.type,
    def: p.default ? p.default : comp.defaultVariants[p.name] ? `"${comp.defaultVariants[p.name]}"` : "—",
    required: p.required && !comp.defaultVariants[p.name] && !p.default,
    doc: p.doc,
  }));
  const seen = new Set(explicit.map((r) => r.prop));
  const variantRows: Row[] = Object.entries(comp.variants ?? {})
    .filter(([g]) => !seen.has(g))
    .map(([g, options]) => ({
      prop: g,
      type: options.map((o) => `"${o}"`).join(" | "),
      def: comp.defaultVariants[g] ? `"${comp.defaultVariants[g]}"` : "—",
      required: false,
    }));
  const rows = [...explicit, ...variantRows];

  if (rows.length === 0) {
    return (
      <Text color="muted">
        {comp.name} takes no props beyond <Code>className</Code> and the native element&apos;s attributes.
      </Text>
    );
  }
  const hasDoc = rows.some((r) => Boolean(r.doc));
  return (
    <div>
      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-hairline bg-surface">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-hover text-xs uppercase tracking-wide text-fg-subtle">
              <th className="px-4 py-3 font-medium">Prop</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Default</th>
              {hasDoc && <th className="px-4 py-3 font-medium">Description</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.prop} className={i > 0 ? "border-t border-hairline" : ""}>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-fg">
                  {r.prop}
                  {r.required && <span className="ml-1 text-danger">*</span>}
                </td>
                <td className="px-4 py-3 font-mono text-sm text-fg-muted">{r.type}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-fg-muted">{r.def}</td>
                {hasDoc && <td className="px-4 py-3 text-sm text-fg-muted">{r.doc || "—"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.some((r) => r.required) && (
        <Text size="xs" color="subtle" className="mt-2">
          <span className="text-danger">*</span> required
        </Text>
      )}
    </div>
  );
}

export function RefTable({ head, rows }: { head: [string, string]; rows: [string, ReactNode][] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-hairline bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-hairline bg-surface-hover text-xs uppercase tracking-wide text-fg-subtle">
            <th className="px-4 py-2 font-medium">{head[0]}</th>
            <th className="px-4 py-2 font-medium">{head[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b], i) => (
            <tr key={a} className={i > 0 ? "border-t border-hairline" : ""}>
              <td className="whitespace-nowrap px-4 py-2 font-mono text-sm text-fg align-top">{a}</td>
              <td className="px-4 py-2 text-sm text-fg-muted">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BestPractices({ items }: { items: BestPracticeDoc[] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-hairline bg-surface">
      <table className="w-full text-left text-sm">
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className={i > 0 ? "border-t border-hairline" : ""}>
              <td className="w-24 whitespace-nowrap px-4 py-3 text-xs font-semibold">
                {item.guidance ? (
                  <span className="text-fg font-bold">[Do]</span>
                ) : (
                  <span className="text-fg-subtle font-bold">[Don't]</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm leading-relaxed text-fg-muted">{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Bulleted notes inside the same bordered panel the tables use. */
export function NoteList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 rounded-[var(--radius-panel)] border border-hairline bg-surface px-5 py-4">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-fg-muted">
          <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-fg-subtle" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function ComponentMeta({ description, comp }: { description?: string; comp?: ManifestComponent }) {
  const behavior = comp?.radix ? `Radix — ${comp.radix}` : "Plain markup";
  const snippet = comp ? `// ${behavior}\nimport { ${comp.exports.join(", ")} } from "@shavin/ui";` : null;
  return (
    <div className="mb-8 space-y-4">
      {description && (
        <Text color="muted" size="md" className="leading-relaxed">
          {description}
        </Text>
      )}
      {snippet && <CodeBlock code={snippet} />}
    </div>
  );
}

/** Full-bleed hero, as on every docs page. */
export function HeroBanner({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="dark relative w-full bg-canvas flex flex-col justify-end pt-24 pb-12 text-fg border-b border-hairline md:pt-32 lg:pt-40 mb-10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(var(--hairline)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--hairline)/0.3)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="mx-auto w-full max-w-5xl px-6 md:px-10">
        <div className="relative max-w-4xl space-y-3">
          <h1 className="font-display text-4xl font-bold tracking-tight text-fg md:text-5xl">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

export function DocSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-20">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Heading as="h2" size="sm" className="font-semibold">
          {title}
        </Heading>
        {action}
      </div>
      {children}
    </section>
  );
}

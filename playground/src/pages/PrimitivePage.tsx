import { useCallback, useState } from "react";
import { Callout, Code, Heading, Text } from "@shavin/ui";
import type { Primitive } from "../data";
import { BestPractices, ComponentMeta, DocExample, DocSection, HeroBanner, NoteList, PropsTable } from "../docs";
import { LiveExample, type ExampleStatus } from "../LiveExample";

export function PrimitivePage({ primitive: p }: { primitive: Primitive }) {
  const doc = p.doc;
  const examples = doc?.examples ?? [];
  const [status, setStatus] = useState<Record<number, ExampleStatus>>({});
  const report = useCallback(
    (i: number) => (s: ExampleStatus) => setStatus((prev) => (prev[i] === s ? prev : { ...prev, [i]: s })),
    [],
  );
  const failing = p.checks.filter((c) => !c.ok && !c.soft);
  const broken = Object.values(status).filter((s) => s === "error").length;
  const rendered = Object.values(status).filter((s) => s === "ok").length;
  const docPath = p.docFile ?? `packages/ui/src/primitives/${p.slug}/${p.slug}.doc.ts`;
  const comps = [p.main, ...p.parts].filter((c) => c !== undefined);

  return (
    <>
      <HeroBanner title={p.name}>
        <p className="font-mono text-xs text-fg-subtle">{docPath}</p>
      </HeroBanner>
      <div className="mx-auto max-w-5xl px-6 pb-16 md:px-10">
        {p.internal && (
          <Callout color="neutral" title="Internal tool" className="mb-10">
            Part of Shavin's own tooling rather than a design primitive. It is left out of the primitive count and out of
            the component lists agents build UI from, but it lives here like any other component: improvements are welcome.
          </Callout>
        )}
        {(failing.length > 0 || broken > 0) && (
          <Callout color="warning" title="Before you open a PR" className="mb-10">
            <ul className="mt-1 space-y-1 text-sm">
              {failing.map((c) => (
                <li key={c.label}>
                  <span className="font-medium text-fg">{c.label}:</span> {c.hint}
                </li>
              ))}
              {broken > 0 && (
                <li>
                  <span className="font-medium text-fg">Examples:</span> {broken} example{broken > 1 ? "s" : ""} below fail
                  to render. Examples can use any @shavin/ui export, Lucide icons and the React hooks; define sample data inline.
                </li>
              )}
            </ul>
          </Callout>
        )}

        <ComponentMeta description={doc?.description ?? p.main?.description} comp={p.main} />

        {doc?.features?.length ? (
          <DocSection title="Features">
            <NoteList items={doc.features} />
          </DocSection>
        ) : null}

        <DocSection
          title="Examples"
          action={
            examples.length > 0 && (
              <Text size="xs" color={broken ? "danger" : "subtle"}>
                {rendered} of {examples.length} rendering
              </Text>
            )
          }
        >
          {examples.length === 0 ? (
            <Text color="muted">
              No examples yet. Add them to <Code>examples</Code> in the .doc.ts file.
            </Text>
          ) : (
            examples.map((ex, i) => (
              <DocExample key={`${i}:${ex.code}`} title={ex.title} description={ex.description} code={ex.code}>
                <LiveExample code={ex.code} onStatus={report(i)} />
              </DocExample>
            ))
          )}
        </DocSection>

        {comps.length > 0 && (
          <DocSection title="API reference">
            <div className="space-y-10">
              {comps.map((c) => (
                <div key={c.name}>
                  {comps.length > 1 && (
                    <Heading as="h3" size="sm" className="mb-4 font-medium">
                      {c.name}
                    </Heading>
                  )}
                  <PropsTable comp={c} />
                </div>
              ))}
            </div>
          </DocSection>
        )}

        {doc?.usage?.bestPractices?.length ? (
          <DocSection title="Best practices">
            <BestPractices items={doc.usage.bestPractices} />
          </DocSection>
        ) : null}

        {(doc?.accessibility?.length || doc?.keyboard) && (
          <DocSection title="Accessibility">
            <div className="space-y-4">
              {doc.accessibility?.length ? <NoteList items={doc.accessibility} /> : null}
              {doc.keyboard && (
                <div className="rounded-[var(--radius-panel)] border border-hairline bg-surface px-5 py-4">
                  <Text size="xs" color="subtle" className="mb-1 uppercase tracking-wide">
                    Keyboard
                  </Text>
                  <Text size="sm" color="muted">
                    {doc.keyboard}
                  </Text>
                </div>
              )}
            </div>
          </DocSection>
        )}

        {doc?.notes?.length ? (
          <DocSection title="Notes">
            <NoteList items={doc.notes} />
          </DocSection>
        ) : null}

        <Text size="xs" color="subtle">
          Prose and examples come from <Code>{docPath}</Code>; props and variants from <Code>components.json</Code>, which
          the playground regenerates when you save a primitive.
        </Text>
      </div>
    </>
  );
}

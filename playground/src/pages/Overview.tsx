import { Callout, Code, Text } from "@shavin/ui";
import { type Primitive, passing, required } from "../data";
import { CodeBlock, DocSection, HeroBanner, NoteList } from "../docs";

export function Overview({ primitives, missing }: { primitives: Primitive[]; missing: string | null }) {
  const complete = primitives.filter((p) => passing(p) === required(p).length).length;
  const tools = primitives.filter((p) => p.internal).length;
  const rows = [...primitives].sort(
    (a, b) => passing(a) / required(a).length - passing(b) / required(b).length || a.name.localeCompare(b.name),
  );

  return (
    <>
      <HeroBanner title="Playground">
        <p className="max-w-2xl text-base text-fg-muted leading-relaxed">
          Every primitive in <span className="font-mono text-sm">packages/ui</span>, rendered from your working tree. Edit a
          component, its <span className="font-mono text-sm">.doc.ts</span> or the tokens and the page updates as you save.
        </p>
      </HeroBanner>
      <div className="mx-auto max-w-5xl px-6 pb-16 md:px-10">
        {missing && (
          <Callout color="warning" title={`No primitive called “${missing}”`} className="mb-10">
            Primitives are listed by their folder name under <Code>packages/ui/src/primitives</Code>.
          </Callout>
        )}

        <DocSection title="Adding or changing a primitive">
          <NoteList
            items={[
              "Write the component in packages/ui/src/primitives/<Name>/<Name>.tsx and export it from packages/ui/src/index.ts.",
              "Describe it in <Name>.doc.ts: description, examples, Do and Don't, accessibility and keyboard notes. Button.doc.ts is a good model.",
              "Open its page here. The checklist at the top shows anything missing, and each example renders live.",
              "Run npm run verify before you open the pull request, and attach a screenshot of the page.",
            ]}
          />
          <div className="mt-4">
            <CodeBlock code={"npm run playground   # http://localhost:3700\nnpm run verify"} language="bash" />
          </div>
        </DocSection>

        <DocSection
          title="Doc coverage"
          action={
            <Text size="xs" color="subtle">
              {complete} of {primitives.length} complete · {primitives.length - tools} primitives, {tools} internal tools
            </Text>
          }
        >
          <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-hairline bg-surface">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-hover text-xs uppercase tracking-wide text-fg-subtle">
                  <th className="px-4 py-3 font-medium">Primitive</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Checks</th>
                  <th className="px-4 py-3 font-medium">To fix</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => {
                  const req = required(p);
                  const ok = passing(p);
                  const todo = req.filter((c) => !c.ok).map((c) => c.label);
                  return (
                    <tr key={p.slug} className={i > 0 ? "border-t border-hairline" : ""}>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <a href={`#/${p.slug}`} className="font-medium text-fg hover:underline">
                          {p.name}
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-fg-muted">{p.category}</td>
                      <td className={`whitespace-nowrap px-4 py-2.5 font-mono tabular-nums ${ok === req.length ? "text-success" : "text-warning"}`}>
                        {ok}/{req.length}
                      </td>
                      <td className="px-4 py-2.5 text-fg-muted">{todo.length ? todo.join(", ") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DocSection>
      </div>
    </>
  );
}

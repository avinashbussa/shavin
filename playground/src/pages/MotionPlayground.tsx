import { Badge, Code, Grid, Text } from "@shavin/ui";
import { DocSection, HeroBanner } from "../docs";
import { MotionPreview, type Effect } from "../MotionPreview";

/**
 * Live demo of the zero-setup data-motion runtime (packages/ui/src/lib/motion-runtime.ts). The entrance
 * presets bind to scroll position in real use; here each tile loops the motion (WAAPI) so you can see it.
 */
const ENTRY: readonly [Effect, string][] = [
  ["fade-up", "Fades up from below"],
  ["fade-down", "Fades down from above"],
  ["scale-in", "Grows from 90%"],
  ["blur-in", "Sharpens from blur"],
  ["mask-up", "Wipes up under a mask"],
  ["fade", "Plain opacity"],
];

function Demo({ children }: { children: React.ReactNode }) {
  return <Grid columns="auto" minWidth="sm" gap="4">{children}</Grid>;
}

export function MotionPlayground() {
  return (
    <>
      <HeroBanner title="Motion runtime">
        <Text color="muted">
          Zero-setup <Code>data-motion-*</Code> attributes — add them to any element, nothing to mount.
          Hover a tile to replay its preset; scroll the page to see the parallax drift.
        </Text>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge color="accent">self-boots on import</Badge>
          <Badge color="accent">CSS scroll-driven + IO fallback</Badge>
          <Badge color="accent">gsap optional (scrub / pin)</Badge>
          <Badge>reduced-motion safe</Badge>
        </div>
      </HeroBanner>

      <div className="mx-auto max-w-5xl px-6 pb-24 md:px-10">
        <DocSection title="Entrance presets">
          <Text color="muted" className="mb-4"><Code>data-motion-entry="&lt;preset&gt;"</Code> reveals an element as it scrolls into view.</Text>
          <Demo>
            {ENTRY.map(([effect, note]) => (
              <MotionPreview key={effect} effect={effect} note={note} />
            ))}
          </Demo>
        </DocSection>

        <DocSection title="Tuned — distance · duration · ease">
          <Text color="muted" className="mb-4">Add <Code>-dist</Code> (xs–lg), <Code>-dur</Code> (instant–enter) and <Code>-ease</Code> (out · overshoot) to shape a preset.</Text>
          <Demo>
            <MotionPreview effect="fade-up" dist="lg" label='dist="lg"' note="Longer travel" />
            <MotionPreview effect="scale-in" dur="slow" label='dur="slow"' note="Slower settle" />
            <MotionPreview effect="blur-in" ease="overshoot" label='ease="overshoot"' note="Springy finish" />
          </Demo>
        </DocSection>

        <DocSection title="Scroll-driven">
          <Text color="muted" className="mb-4">
            <Code>data-motion-scroll="parallax"</Code> drifts in pure CSS as it moves through the viewport — scroll to see it.
            {" "}<Code>scrub</Code> / <Code>pin</Code> need the optional <Code>gsap</Code> peer dep and stay inert without it.
          </Text>
          <MotionPreview parallax />
        </DocSection>
      </div>
    </>
  );
}

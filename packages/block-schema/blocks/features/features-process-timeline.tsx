import { Container, Flex, Grid, Heading, Icon, Section, Text } from "@shavin/ui";

const defaultSteps = [
  { icon: "link", title: "Connect", body: "Link any of 11,642 banks and credit unions. Read-only, and it takes about two minutes." },
  { icon: "tags", title: "Sort", body: "WiseOwl categorises the last 24 months. Fix a merchant once and it remembers." },
  { icon: "wallet", title: "Budget", body: "Start from your real spending, not a guess. Set a limit per category or per envelope." },
  { icon: "target", title: "Plan", body: "Add goals like the emergency fund or the house deposit and see the date you reach them." },
  { icon: "circle-check", title: "Review", body: "A short weekly summary tells you what changed, and what to look at next." },
];

export function FeaturesProcessTimeline({ steps = defaultSteps }) {
  return (
    <Section size="body" className="border-y border-hairline">
      <Container size="xl">
        <Flex direction="column" gap="6">
          <Flex direction="column" gap="4">
            <Text size="overline" color="muted">How it works</Text>
            <Heading as="h2" size="3xl" tracking="tight" className="max-w-[24ch] text-balance">From first sync to calm in one afternoon</Heading>
            <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">Five steps, in order. Most households finish the first three before their coffee gets cold.</Text>
          </Flex>
          <Grid columns="5" gap="5" stack="auto" className="relative max-lg:grid-cols-1">
            <Flex aria-hidden className="absolute left-0 right-0 top-5 hidden h-px bg-hairline-strong lg:flex" />
            {steps.map((step, i) => (
              <Flex key={step.title} direction="column" gap="3" className="relative">
                <Flex align="center" justify="center" className="relative size-10 rounded-full border border-hairline-strong bg-canvas text-fg">
                  <Icon name={step.icon} size="sm" color="inherit" />
                </Flex>
                <Text size="overline" color="muted" className="tabular-nums">0{i + 1}</Text>
                <Heading as="h3" size="md">{step.title}</Heading>
                <Text size="sm" color="muted" className="text-pretty">{step.body}</Text>
              </Flex>
            ))}
          </Grid>
        </Flex>
      </Container>
    </Section>
  );
}

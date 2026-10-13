import { Container, Flex, Grid, Heading, Image, Section, Text } from "@shavin/ui";

const defaultRows = [
  {
    overline: "Week 1",
    title: "See every account together",
    body: "Link checking, credit cards, loans and retirement accounts. WiseOwl pulls 24 months of history and sorts it for you.",
    image: "https://assets.lummi.ai/assets/QmSETVchufAEGoYU15T4nFMVr5EKkqp5ZaM5UJmNe8omSw?auto=format&w=1200",
    alt: "Scattered coins on a peach background",
    flip: false,
  },
  {
    overline: "Week 2",
    title: "Find what is quietly leaking",
    body: "The subscriptions view lists every recurring charge. Members cancel 3 forgotten services on average, worth $41.87 a month.",
    image: "https://assets.lummi.ai/assets/QmNqSc99v97Dd7Ba2F1aH4snKgMG1SuM6Mb32S7tox2N7p?auto=format&w=1200",
    alt: "A hand holding a printed receipt",
    flip: true,
  },
  {
    overline: "Week 3",
    title: "Give every payday a job",
    body: "Split income between bills, budgets and goals automatically, so savings happen before spending does.",
    image: "https://assets.lummi.ai/assets/QmfSCe21jQS5RRs8FtCXUt2MKCaKBGgDs2ziDzCs751LEx?auto=format&w=1200",
    alt: "A small potted tree against a two-tone peach wall",
    flip: false,
  },
];

export function FeaturesStorySplit({ rows = defaultRows }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Flex direction="column" gap="7" className="md:gap-16">
          <Flex direction="column" gap="4">
            <Text size="overline" color="muted">How it works</Text>
            <Heading as="h2" size="2xl">From scattered accounts to a plan</Heading>
            <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">
              Most members finish setup in one evening. Here is what happens in the first three weeks.
            </Text>
          </Flex>
          {rows.map((row) => (
            <Grid key={row.title} columns="2" gap="7" align="start" stack="auto">
              <Flex direction="column" gap="3" className="md:pt-8">
                <Text size="overline" color="muted" className="tabular-nums">{row.overline}</Text>
                <Heading as="h3" size="lg">{row.title}</Heading>
                <Text size="lg" color="muted" className="max-w-[40ch] text-pretty tabular-nums">{row.body}</Text>
              </Flex>
              <Image src={row.image} alt={row.alt} ratio="4/3" className={row.flip ? "md:order-first" : "md:order-last"} />
            </Grid>
          ))}
        </Flex>
      </Container>
    </Section>
  );
}

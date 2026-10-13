import { Container, Flex, Grid, Heading, Section, Text } from "@shavin/ui";

const defaultStats = [
  { value: "38,412", label: "households planning with WiseOwl" },
  { value: "$1,284.60", label: "average saved in the first six months" },
  { value: "4.8/5", label: "from 3,906 member reviews" },
];

export function MetricsStatsBar({ stats = defaultStats }) {
  return (
    <Section size="strip">
      <Container size="lg">
        <Grid columns="3" gap="0" stack="mobile" className="md:divide-x md:divide-hairline">
          {stats.map((stat) => (
            <Flex key={stat.label} direction="column" gap="2" className="border-hairline py-6 first:pt-0 last:pb-0 max-md:border-t max-md:first:border-t-0 md:px-8 md:py-0 md:first:pl-0 md:last:pr-0">
              <Heading as="p" size="3xl" weight="medium" tracking="tight" className="tabular-nums">{stat.value}</Heading>
              <Text size="sm" color="muted" className="tabular-nums">{stat.label}</Text>
            </Flex>
          ))}
        </Grid>
      </Container>
    </Section>
  );
}

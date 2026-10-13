import { Card, Container, Flex, Grid, Heading, Icon, Section, Sparkline, Text } from "@shavin/ui";

const defaultCards = [
  {
    label: "Groceries per week",
    value: "$148.22",
    change: "−9.3%",
    icon: "trending-down",
    tone: "success",
    series: [
      { label: "Aug 16", value: 100, tone: "neutral" },
      { label: "Aug 23", value: 76, tone: "neutral" },
      { label: "Aug 30", value: 57, tone: "neutral" },
      { label: "Sep 6", value: 83, tone: "neutral" },
      { label: "Sep 13", value: 39, tone: "neutral" },
      { label: "Sep 20", value: 30, tone: "neutral" },
      { label: "Sep 27", value: 25, tone: "success" },
    ],
  },
  {
    label: "Emergency fund",
    value: "$11,460.00",
    change: "+5.1%",
    icon: "trending-up",
    tone: "success",
    series: [
      { label: "Aug 16", value: 25, tone: "neutral" },
      { label: "Aug 23", value: 36, tone: "neutral" },
      { label: "Aug 30", value: 49, tone: "neutral" },
      { label: "Sep 6", value: 59, tone: "neutral" },
      { label: "Sep 13", value: 72, tone: "neutral" },
      { label: "Sep 20", value: 88, tone: "neutral" },
      { label: "Sep 27", value: 100, tone: "success" },
    ],
  },
  {
    label: "Dining out per week",
    value: "$96.40",
    change: "+12.6%",
    icon: "trending-up",
    tone: "danger",
    series: [
      { label: "Aug 16", value: 34, tone: "neutral" },
      { label: "Aug 23", value: 71, tone: "neutral" },
      { label: "Aug 30", value: 25, tone: "neutral" },
      { label: "Sep 6", value: 86, tone: "neutral" },
      { label: "Sep 13", value: 54, tone: "neutral" },
      { label: "Sep 20", value: 71, tone: "neutral" },
      { label: "Sep 27", value: 100, tone: "success" },
    ],
  },
];

export function MetricsTrendCards({ cards = defaultCards }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Flex direction="column" gap="4">
            <Text size="overline" color="muted">Last 7 weeks</Text>
            <Heading as="h2" size="2xl">Where your money is moving</Heading>
          </Flex>
          <Grid columns="auto" minWidth="md" maxColumns="3" gap="5">
            {cards.map((card) => (
              <Card key={card.label} padding="lg">
                <Flex direction="column" gap="5">
                  <Flex direction="column" gap="2">
                    <Text size="sm" color="muted">{card.label}</Text>
                    <Flex direction="row" align="baseline" justify="between" wrap="wrap" gap="3">
                      <Heading as="p" size="2xl" className="tabular-nums">{card.value}</Heading>
                      <Flex direction="row" align="center" gap="1">
                        <Icon name={card.icon} size="sm" color={card.tone} />
                        <Text size="sm" weight="medium" className={card.tone === "success" ? "text-success tabular-nums" : "text-danger tabular-nums"}>{card.change}</Text>
                      </Flex>
                    </Flex>
                  </Flex>
                  <Sparkline type="bar" data={card.series} className="h-12" />
                </Flex>
              </Card>
            ))}
          </Grid>
        </Flex>
      </Container>
    </Section>
  );
}

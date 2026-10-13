import { Card, Container, Flex, Grid, Heading, Icon, Section, Text } from "@shavin/ui";

const defaultKpis = [
  { label: "Net worth", value: "$184,276.52", change: "+2.4%", note: "vs Aug 31", icon: "trending-up", tone: "success" },
  { label: "Spending", value: "$6,412.38", change: "−6.8%", note: "vs August", icon: "trending-down", tone: "success" },
  { label: "Income", value: "$9,840.00", change: "0.0%", note: "vs August", icon: "minus", tone: "muted" },
  { label: "Savings rate", value: "35%", change: "+4 pts", note: "vs August", icon: "trending-up", tone: "success" },
];

export function MetricsKpiGrid({ kpis = defaultKpis }) {
  return (
    <Section size="compact">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Flex direction="column" gap="4">
            <Text size="overline" color="muted">September 2026</Text>
            <Heading as="h2" size="2xl">Your month at a glance</Heading>
          </Flex>
          <Grid columns="auto" minWidth="sm" maxColumns="4" gap="5">
            {kpis.map((kpi) => (
              <Card key={kpi.label} padding="lg">
                <Flex direction="column" gap="3">
                  <Text size="sm" color="muted">{kpi.label}</Text>
                  <Heading as="p" size="xl" weight="medium" className="tabular-nums">{kpi.value}</Heading>
                  <Flex direction="row" align="center" gap="2">
                    <Icon name={kpi.icon} size="sm" color={kpi.tone} />
                    <Text size="sm" weight="medium" className={kpi.tone === "success" ? "text-success tabular-nums" : kpi.tone === "danger" ? "text-danger tabular-nums" : "text-fg-muted tabular-nums"}>{kpi.change}</Text>
                    <Text size="sm" color="muted">{kpi.note}</Text>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Grid>
        </Flex>
      </Container>
    </Section>
  );
}

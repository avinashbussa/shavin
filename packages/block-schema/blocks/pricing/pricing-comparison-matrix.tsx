import { Badge, Button, Container, Flex, Grid, Heading, Icon, Section, Text } from "@shavin/ui";

const defaultPlans = [
  { name: "Free", price: "$0", period: "forever", featured: false, cta: "Start free" },
  { name: "Plus", price: "$7.99", period: "per month", featured: false, cta: "Start trial" },
  { name: "Household", price: "$13.99", period: "per month", featured: true, cta: "Start trial" },
];

const defaultGroups = [
  {
    title: "Accounts",
    rows: [
      { feature: "Linked accounts", values: ["2", "Unlimited", "Unlimited"] },
      { feature: "Transaction history", values: ["12 months", "24 months", "24 months"] },
      { feature: "Manual and cash accounts", values: ["yes", "yes", "yes"] },
    ],
  },
  {
    title: "Planning",
    rows: [
      { feature: "Budget categories", values: ["10", "Unlimited", "Unlimited"] },
      { feature: "Savings goals", values: ["1", "Unlimited", "Unlimited"] },
      { feature: "Cash-flow forecast", values: ["no", "90 days", "90 days"] },
    ],
  },
  {
    title: "Smart tools",
    rows: [
      { feature: "Receipt scans per month", values: ["5", "50", "150"] },
      { feature: "AI questions per month", values: ["10", "75", "200"] },
      { feature: "Subscription tracking", values: ["yes", "yes", "yes"] },
    ],
  },
  {
    title: "Sharing and support",
    rows: [
      { feature: "Household members", values: ["1", "1", "Up to 6"] },
      { feature: "Roles and permissions", values: ["no", "no", "yes"] },
      { feature: "Support", values: ["Email", "Email and chat", "Priority chat"] },
    ],
  },
];

export function PricingComparisonMatrix({ plans = defaultPlans, groups = defaultGroups }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Flex direction="column" gap="4">
            <Text size="overline" color="muted">Compare plans</Text>
            <Heading as="h2" size="3xl">Every feature, side by side</Heading>
          </Flex>
          <Flex direction="column" gap="0" className="-mx-4 overflow-x-auto px-4">
            <Flex direction="column" gap="0" className="min-w-[44rem]">
              <Grid columns="4" gap="4" className="grid-cols-[1.6fr_repeat(3,minmax(0,1fr))] items-end border-b border-hairline pb-5">
                <Text size="sm" color="muted">Prices in USD</Text>
                {plans.map((plan) => (
                  <Flex key={plan.name} direction="column" align="start" gap="3">
                    <Flex direction="row" align="center" wrap="wrap" gap="2">
                      <Heading as="h3" size="sm">{plan.name}</Heading>
                      {plan.featured && <Badge variant="soft" tone="accent" size="sm" radius="full">Most popular</Badge>}
                    </Flex>
                    <Flex direction="row" align="baseline" gap="1">
                      <Heading as="p" size="lg" className="tabular-nums">{plan.price}</Heading>
                      <Text size="xs" color="muted">{plan.period}</Text>
                    </Flex>
                    <Button size="sm" variant={plan.featured ? "solid" : "outline"}>{plan.cta}</Button>
                  </Flex>
                ))}
              </Grid>
              {groups.map((group) => (
                <Flex key={group.title} direction="column" gap="0">
                  <Text size="sm" weight="semibold" className="border-b border-hairline pb-3 pt-7">{group.title}</Text>
                  {group.rows.map((row) => (
                    <Grid key={row.feature} columns="4" gap="4" align="center" className="grid-cols-[1.6fr_repeat(3,minmax(0,1fr))] border-b border-hairline py-3">
                      <Text size="sm" color="muted">{row.feature}</Text>
                      {row.values.map((value, i) => (
                        <Flex key={i} direction="row" align="center" gap="2">
                          {value === "yes" && <Icon name="check" size="sm" color="contrast" aria-label="Included" />}
                          {value === "no" && <Icon name="minus" size="sm" color="muted" aria-label="Not included" />}
                          {value !== "yes" && value !== "no" && <Text size="sm" className="tabular-nums">{value}</Text>}
                        </Flex>
                      ))}
                    </Grid>
                  ))}
                </Flex>
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}

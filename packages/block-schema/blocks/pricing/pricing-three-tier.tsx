import { Badge, Button, Card, Container, Flex, Grid, Heading, Icon, Section, Separator, Text } from "@shavin/ui";

const defaultTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For one person getting organised.",
    featured: false,
    features: ["2 linked accounts", "10 budget categories", "Bill reminders", "Web and mobile apps"],
    cta: "Start free",
  },
  {
    name: "Plus",
    price: "$7.99",
    period: "per month",
    description: "For individuals who want the full picture.",
    featured: false,
    features: ["Unlimited linked accounts", "Unlimited budgets and goals", "50 receipt scans per month", "75 AI questions per month", "CSV and PDF export"],
    cta: "Start 14-day trial",
  },
  {
    name: "Household",
    price: "$13.99",
    period: "per month",
    description: "For couples and families sharing money.",
    featured: true,
    features: ["Everything in Plus", "Up to 6 household members", "Owner, Editor and Viewer roles", "150 receipt scans per month", "200 AI questions per month"],
    cta: "Start 14-day trial",
  },
];

export function PricingThreeTier({ tiers = defaultTiers }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Flex direction="column" align="center" gap="4" className="text-center">
            <Text size="overline" color="muted">Pricing</Text>
            <Heading as="h2" size="3xl">Simple plans for every household</Heading>
            <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">Start free and upgrade when you need more. Every plan includes read-only bank connections and two-factor sign-in.</Text>
          </Flex>
          <Grid columns="auto" minWidth="md" maxColumns="3" gap="5">
            {tiers.map((tier) => (
              <Card key={tier.name} padding="lg" className={tier.featured ? "border-hairline-strong bg-surface-hover/15" : ""}>
                <Flex direction="column" gap="5" className="h-full">
                  <Flex direction="column" gap="2">
                    <Flex direction="row" align="center" justify="between" gap="2">
                      <Heading as="h3" size="md">{tier.name}</Heading>
                      {tier.featured && <Badge variant="soft" tone="accent" size="sm" radius="full">Most popular</Badge>}
                    </Flex>
                    <Text size="sm" color="muted" className="text-pretty">{tier.description}</Text>
                  </Flex>
                  <Flex direction="row" align="baseline" gap="2">
                    <Heading as="p" size="3xl" className="tabular-nums">{tier.price}</Heading>
                    <Text size="sm" color="muted">{tier.period}</Text>
                  </Flex>
                  <Separator />
                  <Flex direction="column" gap="3">
                    {tier.features.map((feature) => (
                      <Flex key={feature} direction="row" align="start" gap="2">
                        <Icon name="check" size="sm" color="contrast" className="mt-0.5 shrink-0" />
                        <Text size="sm" className="tabular-nums">{feature}</Text>
                      </Flex>
                    ))}
                  </Flex>
                  <Button size="lg" variant={tier.featured ? "solid" : "outline"} className="mt-auto w-full">{tier.cta}</Button>
                </Flex>
              </Card>
            ))}
          </Grid>
          <Text size="xs" color="muted" className="text-center">Prices in USD. Taxes may apply.</Text>
        </Flex>
      </Container>
    </Section>
  );
}

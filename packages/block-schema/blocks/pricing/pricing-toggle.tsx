import { Button, Card, Container, Flex, Grid, Heading, Icon, Link, Section, SegmentedControl, SegmentedControlItem, Separator, Text } from "@shavin/ui";

const defaultPlans = [
  {
    name: "Plus",
    description: "For individuals who want the full picture.",
    price: "$6.33",
    billed: "$76 billed yearly",
    monthly: "or $7.99 billed monthly",
    featured: false,
    features: ["Unlimited accounts and budgets", "50 receipt scans per month", "75 AI questions per month"],
    cta: "Choose Plus",
  },
  {
    name: "Household",
    description: "For couples and families sharing money.",
    price: "$11.17",
    billed: "$134 billed yearly",
    monthly: "or $13.99 billed monthly",
    featured: true,
    features: ["Up to 6 members with roles", "150 receipt scans per month", "200 AI questions per month"],
    cta: "Choose Household",
  },
];

const defaultAdvisor = { label: "Talk to our team", href: "/advisors" };

export function PricingToggle({ plans = defaultPlans, advisor = defaultAdvisor }) {
  return (
    <Section size="body">
      <Container size="md">
        <Flex direction="column" gap="7">
          <Flex direction="column" align="center" gap="4" className="text-center">
            <Text size="overline" color="muted">Pricing</Text>
            <Heading as="h2" size="3xl">Pay monthly or save 20% yearly</Heading>
            <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">Switch plans at any time. Changes are prorated to the day, and you can cancel from settings in two clicks.</Text>
            <Flex direction="row" align="center" justify="center" wrap="wrap" gap="3" className="pt-2">
              <SegmentedControl defaultValue="annual" variant="pill" size="md" aria-label="Billing period">
                <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
                <SegmentedControlItem value="annual">Annual</SegmentedControlItem>
              </SegmentedControl>
              <Text size="sm" weight="medium" color="accent">Save 20% with annual billing</Text>
            </Flex>
          </Flex>
          <Grid columns="auto" minWidth="md" maxColumns="2" gap="5">
            {plans.map((plan) => (
              <Card key={plan.name} padding="lg" className={plan.featured ? "border-hairline-strong bg-surface-hover/15" : ""}>
                <Flex direction="column" gap="5" className="h-full">
                  <Flex direction="column" gap="2">
                    <Heading as="h3" size="md">{plan.name}</Heading>
                    <Text size="sm" color="muted" className="text-pretty">{plan.description}</Text>
                  </Flex>
                  <Flex direction="column" gap="1">
                    <Flex direction="row" align="baseline" gap="2">
                      <Heading as="p" size="3xl" className="tabular-nums">{plan.price}</Heading>
                      <Text size="sm" color="muted">per month</Text>
                    </Flex>
                    <Text size="xs" color="muted" className="tabular-nums">{plan.billed}, {plan.monthly}</Text>
                  </Flex>
                  <Separator />
                  <Flex direction="column" gap="3">
                    {plan.features.map((feature) => (
                      <Flex key={feature} direction="row" align="start" gap="2">
                        <Icon name="check" size="sm" color="contrast" className="mt-0.5 shrink-0" />
                        <Text size="sm" className="tabular-nums">{feature}</Text>
                      </Flex>
                    ))}
                  </Flex>
                  <Button size="lg" variant={plan.featured ? "solid" : "outline"} className="mt-auto w-full" asChild><a href="/signup">{plan.cta}</a></Button>
                </Flex>
              </Card>
            ))}
          </Grid>
          <Card padding="lg">
            <Flex direction="column" justify="between" gap="4" className="md:flex-row md:items-center">
              <Flex direction="row" align="start" gap="4">
                <Icon name="briefcase" size="md" color="muted" className="mt-1 shrink-0" />
                <Flex direction="column" gap="1">
                  <Flex direction="row" align="baseline" wrap="wrap" gap="2">
                    <Heading as="h3" size="md">Advisor</Heading>
                    <Text size="sm" color="muted" className="tabular-nums">$39 per advisor seat, per month</Text>
                  </Flex>
                  <Text size="sm" color="muted" className="max-w-[52ch] text-pretty">For accountants and planners managing client households with read-only access, notes and bulk exports.</Text>
                </Flex>
              </Flex>
              <Link href={advisor.href} size="sm" className="inline-flex h-10 shrink-0 items-center font-medium">{advisor.label}</Link>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}

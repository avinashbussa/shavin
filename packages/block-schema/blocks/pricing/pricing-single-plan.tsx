import { Button, Card, Container, Flex, Grid, Heading, Icon, Image, Section, Separator, Text } from "@shavin/ui";

const defaultFeatures = [
  { icon: "users", label: "Up to 6 household members" },
  { icon: "landmark", label: "Unlimited linked accounts" },
  { icon: "target", label: "Unlimited budgets and goals" },
  { icon: "trending-up", label: "90-day cash-flow forecast" },
  { icon: "receipt", label: "150 receipt scans per month" },
  { icon: "sparkles", label: "200 AI questions per month" },
  { icon: "message-circle", label: "Priority chat support" },
];

export function PricingSinglePlan({ features = defaultFeatures }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Grid columns="2" gap="7" stack="auto" align="center">
          <Flex direction="column" gap="7">
            <Flex direction="column" gap="4">
              <Text size="overline" color="muted">One plan</Text>
              <Heading as="h2" size="3xl">Household, billed once a year</Heading>
              <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">Everything WiseOwl does, for your whole household. One payment of $134 that renews each October.</Text>
            </Flex>
            <Grid columns="auto" minWidth="xs" maxColumns="2" gap="4">
              {features.map((feature) => (
                <Flex key={feature.label} direction="row" align="center" gap="3">
                  <Icon name={feature.icon} size="sm" color="contrast" className="shrink-0" />
                  <Text size="sm" className="tabular-nums">{feature.label}</Text>
                </Flex>
              ))}
            </Grid>
          </Flex>
          <Card padding="lg">
            <Flex direction="column" gap="5">
              <Image
                src="https://assets.lummi.ai/assets/QmVQ6Y2zm36g3VK9LHzgCKqJEbTbL8GYXtmjuHB3nkgzeX?auto=format&w=1200"
                alt="A bright living room with a cream sofa in afternoon sun"
                ratio="21/9"
                radius="concentric"
              />
              <Flex direction="column" gap="1">
                <Flex direction="row" align="baseline" gap="2">
                  <Heading as="p" size="4xl" className="tabular-nums">$134</Heading>
                  <Text size="sm" color="muted">per year</Text>
                </Flex>
                <Text size="sm" color="muted" className="tabular-nums">Works out to $11.17 a month</Text>
              </Flex>
              <Flex direction="column" gap="2">
                <Button size="lg" className="w-full" asChild><a href="/signup">Get Household</a></Button>
                <Button size="lg" variant="ghost" className="w-full" asChild><a href="/signup?trial=1">Start a 14-day trial first</a></Button>
              </Flex>
              <Separator />
              <Flex direction="row" align="start" gap="3">
                <Icon name="shield-check" size="sm" color="muted" className="mt-0.5 shrink-0" />
                <Text size="xs" color="muted" className="text-pretty tabular-nums">30-day money-back guarantee. If WiseOwl is not for you, we refund the full $134.</Text>
              </Flex>
            </Flex>
          </Card>
        </Grid>
      </Container>
    </Section>
  );
}

import { Card, Container, Flex, Grid, Heading, Icon, Link, Section, Text } from "@shavin/ui";

const defaultCards = [
  { icon: "link", title: "Link your accounts", body: "Read-only access through your bank's own secure login.", cta: "Connect a bank", href: "/accounts/link", meta: "About 4 minutes" },
  { icon: "wallet", title: "Build a first budget", body: "Limits suggested from your last 90 days of spending.", cta: "Set up a budget", href: "/budgets/new", meta: "About 6 minutes" },
  { icon: "users", title: "Invite your household", body: "Add a partner or accountant who can view or edit.", cta: "Send an invite", href: "/household/invite", meta: "About 2 minutes" },
];

export function FeaturesInteractiveCards({ cards = defaultCards }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Flex direction="column" gap="4">
            <Text size="overline" color="muted">Start here</Text>
            <Heading as="h2" size="2xl">Three ways to get organised</Heading>
            <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">
              Pick the one that matters most this month. Each takes under ten minutes and works with the accounts you already have.
            </Text>
          </Flex>
          <Grid columns="auto" minWidth="md" maxColumns="3" gap="5">
            {cards.map((card) => (
              <Card key={card.title} padding="lg" interactive className="group relative">
                <Flex direction="column" gap="5" className="h-full">
                  <Flex align="center" justify="center" className="h-10 w-10 shrink-0 rounded-panel-inner bg-accent-subtle">
                    <Icon name={card.icon} size="sm" color="contrast" />
                  </Flex>
                  <Flex direction="column" gap="2">
                    <Text size="overline" color="muted">{card.meta}</Text>
                    <Heading as="h3" size="sm">{card.title}</Heading>
                    <Text size="sm" color="muted" className="text-pretty">{card.body}</Text>
                  </Flex>
                  <Flex direction="row" align="center" gap="1" className="mt-auto">
                    <Link href={card.href} size="sm" underline="none" className="font-medium after:absolute after:inset-0">{card.cta}</Link>
                    <Icon name="arrow-right" size="sm" color="contrast" className="transition-transform group-hover:translate-x-0.5" />
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

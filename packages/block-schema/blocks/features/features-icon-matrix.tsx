import { Container, Flex, Grid, Heading, Icon, Section, Text } from "@shavin/ui";

const defaultItems = [
  { icon: "piggy-bank", title: "Savings goals", body: "Track progress toward a home, a trip or a cushion, with a weekly amount to set aside." },
  { icon: "receipt", title: "Receipt scanning", body: "Photograph a receipt and WiseOwl splits it into line items and categories." },
  { icon: "target", title: "Category budgets", body: "Monthly limits for groceries, dining and more, with rollover for unspent amounts." },
  { icon: "users", title: "Shared households", body: "Invite a partner, family member or accountant as Owner, Editor or Viewer." },
  { icon: "shield-check", title: "Bank-grade security", body: "Read-only connections, AES-256 encryption and two-factor sign-in on every account." },
  { icon: "bell", title: "Quiet alerts", body: "Due bills, large charges and budgets near their limit. Nothing more." },
];

export function FeaturesIconMatrix({ items = defaultItems }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Flex direction="column" gap="4">
            <Text size="overline" color="muted">Capabilities</Text>
            <Heading as="h2" size="2xl">Built for the whole money picture</Heading>
            <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">
              Six everyday tools for budgets, bills, goals and security, on web, iPhone and Android from one account.
            </Text>
          </Flex>
          <Grid columns="auto" minWidth="md" maxColumns="3" gap="6" className="gap-y-10">
            {items.map((item) => (
              <Flex key={item.title} direction="row" align="start" gap="3" className="md:flex-col">
                <Flex align="center" justify="center" className="h-12 w-12 shrink-0 rounded-[var(--radius-lg)] bg-accent-subtle">
                  <Icon name={item.icon} size="md" color="contrast" />
                </Flex>
                <Flex direction="column" gap="1">
                  <Heading as="h3" size="sm">{item.title}</Heading>
                  <Text size="sm" color="muted" className="max-w-[40ch] text-pretty">{item.body}</Text>
                </Flex>
              </Flex>
            ))}
          </Grid>
        </Flex>
      </Container>
    </Section>
  );
}

import { Avatar, Box, Breadcrumbs, Card, Container, Flex, Grid, Heading, Icon, IconButton, Kbd, Progress, Section, Text, TextField } from "@shavin/ui";

const defaultCrumbs = [
  { label: "Household", href: "/household" },
  { label: "Budgets", href: "/budgets" },
  { label: "September" },
];

const defaultBudgets = [
  { name: "Groceries", spent: "$612.40", limit: "$750.00", percent: 82 },
  { name: "Dining out", spent: "$148.20", limit: "$250.00", percent: 59 },
  { name: "Transport", spent: "$96.75", limit: "$180.00", percent: 54 },
];

export function NavStickyAppbar({ crumbs = defaultCrumbs, budgets = defaultBudgets }) {
  return (
    <Section size="compact">
      <Container size="lg">
        <Flex direction="column" className="h-[640px] overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-canvas">
          <Flex as="header" direction="row" align="center" justify="between" gap="4" className="sticky top-0 z-10 h-16 shrink-0 border-b border-hairline bg-surface/80 px-4 backdrop-blur">
            <Breadcrumbs items={crumbs} className="min-w-0 flex-1 md:flex-none" />
            <Box className="w-full max-w-md max-md:hidden">
              <TextField type="search" placeholder="Search transactions, merchants or categories" aria-label="Search" leadingIcon={<Icon name="search" size="sm" color="muted" />} trailingIcon={<Kbd>⌘K</Kbd>} />
            </Box>
            <Flex direction="row" align="center" gap="1" className="shrink-0">
              <IconButton variant="ghost" size="md" aria-label="Search" className="md:hidden">
                <Icon name="search" size="md" color="inherit" />
              </IconButton>
              <Box className="relative">
                <IconButton variant="ghost" size="md" aria-label="Notifications, 3 unread">
                  <Icon name="bell" size="md" color="inherit" />
                </IconButton>
                <Box aria-hidden="true" className="pointer-events-none absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
              </Box>
              <Avatar src="https://assets.lummi.ai/assets/QmUWu25KJZruktibFUXivSoPDWmKs3S9ASXp7zVENaXSqL?auto=format&w=400" alt="Maya Okafor" size="md" className="ml-1" />
            </Flex>
          </Flex>
          <Flex direction="column" gap="6" className="flex-1 overflow-y-auto p-6">
            <Flex direction="column" gap="1">
              <Heading as="h1" size="lg">September budgets</Heading>
              <Text size="sm" color="muted">18 days left in the month. Spending is on pace in 7 of 9 categories.</Text>
            </Flex>
            <Grid columns="auto" minWidth="sm" maxColumns="3" gap="4">
              {budgets.map((budget) => (
                <Card key={budget.name} padding="lg">
                  <Flex direction="column" gap="3">
                    <Text size="sm" color="muted">{budget.name}</Text>
                    <Flex direction="row" align="baseline" gap="2">
                      <Heading as="p" size="lg" className="tabular-nums">{budget.spent}</Heading>
                      <Text size="sm" color="muted" className="tabular-nums">of {budget.limit}</Text>
                    </Flex>
                    <Progress value={budget.percent} />
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}

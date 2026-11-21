import { Avatar, Box, Breadcrumbs, Card, Container, Flex, Grid, Heading, Icon, IconButton, Kbd, Menu, MenuItem, MenuTrigger, Popover, PopoverContent, PopoverTrigger, Progress, Section, Text, TextField } from "@shavin/ui";

const defaultCrumbs = [
  { label: "Household", href: "/household" },
  { label: "Budgets", href: "/budgets" },
  { label: "September" },
];

const defaultNotifications = [
  { title: "Groceries is at 82% of its limit", time: "2 h ago" },
  { title: "Rent posted: $1,850.00", time: "Yesterday" },
  { title: "Shared goal: Maya added $120", time: "2 days ago" },
];

const defaultBudgets = [
  { name: "Groceries", spent: "$612.40", limit: "$750.00", percent: 82 },
  { name: "Dining out", spent: "$148.20", limit: "$250.00", percent: 59 },
  { name: "Transport", spent: "$96.75", limit: "$180.00", percent: 54 },
];

export function NavStickyAppbar({ crumbs = defaultCrumbs, budgets = defaultBudgets, notifications = defaultNotifications }) {
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
              <Popover>
                <PopoverTrigger asChild>
                  <IconButton variant="ghost" size="md" aria-label="Search" className="md:hidden">
                    <Icon name="search" size="md" color="inherit" />
                  </IconButton>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))]">
                  <TextField type="search" placeholder="Search transactions" aria-label="Search transactions" leadingIcon={<Icon name="search" size="sm" color="muted" />} />
                </PopoverContent>
              </Popover>
              <Popover>
                <Box className="relative">
                  <PopoverTrigger asChild>
                    <IconButton variant="ghost" size="md" aria-label="Notifications, 3 unread">
                      <Icon name="bell" size="md" color="inherit" />
                    </IconButton>
                  </PopoverTrigger>
                  <Box aria-hidden="true" className="pointer-events-none absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
                </Box>
                <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))]">
                  <Flex direction="column" gap="3">
                    <Text size="sm" weight="semibold">Notifications</Text>
                    {notifications.map((item) => (
                      <Flex key={item.title} direction="column" gap="0">
                        <Text size="sm">{item.title}</Text>
                        <Text size="xs" color="subtle">{item.time}</Text>
                      </Flex>
                    ))}
                  </Flex>
                </PopoverContent>
              </Popover>
              <Menu trigger={
                <MenuTrigger aria-label="Account menu" className="ml-1 rounded-full">
                  <Avatar src="https://assets.lummi.ai/assets/QmUWu25KJZruktibFUXivSoPDWmKs3S9ASXp7zVENaXSqL?auto=format&w=400" alt="Maya Okafor" size="md" />
                </MenuTrigger>
              }>
                <MenuItem>Profile</MenuItem>
                <MenuItem>Household settings</MenuItem>
                <MenuItem className="border-t border-hairline">Sign out</MenuItem>
              </Menu>
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

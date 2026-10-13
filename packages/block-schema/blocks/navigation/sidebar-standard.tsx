import { AppFrame, Avatar, Box, Card, Container, Flex, Grid, Heading, Icon, Section, Sidebar, SidebarBody, SidebarFooter, SidebarHeader, SidebarNavItem, SidebarSection, SidebarTrigger, Text, TopBar } from "@shavin/ui";

const defaultSections = [
  {
    title: "Overview",
    items: [
      { icon: "layout-dashboard", label: "Overview", active: true },
      { icon: "landmark", label: "Accounts", active: false },
      { icon: "arrow-left-right", label: "Transactions", active: false },
    ],
  },
  {
    title: "Planning",
    items: [
      { icon: "target", label: "Budgets", active: false },
      { icon: "piggy-bank", label: "Goals", active: false },
      { icon: "receipt", label: "Bills", active: false },
      { icon: "trending-up", label: "Forecast", active: false },
    ],
  },
  {
    title: "Settings",
    items: [
      { icon: "users", label: "Members", active: false },
      { icon: "settings", label: "Preferences", active: false },
      { icon: "life-buoy", label: "Help", active: false },
    ],
  },
];

const defaultStats = [
  { label: "Net worth", value: "$184,276.52", note: "Up $2,914.08 this month" },
  { label: "Spent in September", value: "$3,862.19", note: "$1,284.60 left across 9 budgets" },
];

export function SidebarStandard({ sections = defaultSections, stats = defaultStats }) {
  return (
    <Section size="compact">
      <Container size="lg">
        <Box className="h-[640px] overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-canvas">
          <AppFrame
            className="h-full"
            sidebar={
              <Sidebar width="w-64">
                <SidebarHeader>
                  <Heading as="p" size="sm" tracking="tight">WiseOwl</Heading>
                </SidebarHeader>
                <SidebarBody>
                  {sections.map((section) => (
                    <SidebarSection key={section.title} title={section.title}>
                      {section.items.map((item) => (
                        <SidebarNavItem key={item.label} label={item.label} active={item.active} icon={<Icon name={item.icon} size="sm" color="inherit" />} />
                      ))}
                    </SidebarSection>
                  ))}
                </SidebarBody>
                <SidebarFooter>
                  <Flex direction="row" align="center" gap="2" className="min-w-0">
                    <Avatar src="https://assets.lummi.ai/assets/QmUWu25KJZruktibFUXivSoPDWmKs3S9ASXp7zVENaXSqL?auto=format&w=400" fallback="MO" size="sm" />
                    <Flex direction="column" gap="0" className="min-w-0">
                      <Text size="sm" weight="medium" truncate>Maya Okafor</Text>
                      <Text size="xs" color="subtle" truncate>Household owner</Text>
                    </Flex>
                  </Flex>
                </SidebarFooter>
              </Sidebar>
            }
          >
            <TopBar className="gap-2">
              <SidebarTrigger />
              <Text as="span" size="sm" weight="medium">Overview</Text>
            </TopBar>
            <Flex direction="column" gap="6" className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
              <Flex direction="column" gap="1">
                <Heading as="h1" size="lg">Overview</Heading>
                <Text size="sm" color="muted">Okafor-Reyes Household · 7 accounts synced 4 minutes ago</Text>
              </Flex>
              <Grid columns="auto" minWidth="sm" gap="4">
                {stats.map((stat) => (
                  <Card key={stat.label} padding="lg">
                    <Flex direction="column" gap="2">
                      <Text size="sm" color="muted">{stat.label}</Text>
                      <Heading as="p" size="xl" className="tabular-nums">{stat.value}</Heading>
                      <Text size="sm" color="muted" className="tabular-nums">{stat.note}</Text>
                    </Flex>
                  </Card>
                ))}
              </Grid>
              <Flex direction="column" className="min-h-[160px] flex-1 rounded-[var(--radius-panel)] border border-dashed border-hairline" />
            </Flex>
          </AppFrame>
        </Box>
      </Container>
    </Section>
  );
}

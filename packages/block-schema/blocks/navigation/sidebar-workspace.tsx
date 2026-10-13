import { AppFrame, Avatar, Box, Button, Card, Container, Flex, Heading, Icon, Menu, MenuItem, MenuTrigger, Progress, Section, Sidebar, SidebarBody, SidebarFooter, SidebarHeader, SidebarNavItem, SidebarSection, SidebarTrigger, Text, TopBar } from "@shavin/ui";

const defaultHouseholds = [
  { name: "Okafor-Reyes Household", plan: "Household" },
  { name: "Okafor Parents (viewer)", plan: "Household" },
  { name: "Maya · Freelance", plan: "Plus" },
];

const defaultItems = [
  { icon: "layout-dashboard", label: "Overview", active: true },
  { icon: "landmark", label: "Accounts", active: false },
  { icon: "arrow-left-right", label: "Transactions", active: false },
  { icon: "target", label: "Budgets", active: false },
  { icon: "piggy-bank", label: "Goals", active: false },
  { icon: "users", label: "Members", active: false },
];

export function SidebarWorkspace({ households = defaultHouseholds, items = defaultItems }) {
  return (
    <Section size="compact">
      <Container size="lg">
        <Box className="h-[640px] overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-canvas">
          <AppFrame
            className="h-full"
            sidebar={
              <Sidebar width="w-64">
                <SidebarHeader className="h-16 px-2">
                  <Menu trigger={
                    <MenuTrigger aria-label="Switch household" className="flex w-full items-center gap-3 p-2 text-left text-fg">
                      <Avatar fallback="OR" size="sm" radius="large" />
                      <Flex direction="column" gap="0" className="min-w-0 flex-1">
                        <Text size="sm" weight="semibold" truncate>Okafor-Reyes Household</Text>
                        <Text size="xs" color="subtle">Household plan · 4 members</Text>
                      </Flex>
                      <Icon name="chevrons-up-down" size="sm" color="muted" />
                    </MenuTrigger>
                  }>
                    {households.map((household) => (
                      <MenuItem key={household.name}>{household.name}</MenuItem>
                    ))}
                    <MenuItem className="border-t border-hairline">Create household</MenuItem>
                  </Menu>
                </SidebarHeader>
                <SidebarBody>
                  <SidebarSection>
                    {items.map((item) => (
                      <SidebarNavItem key={item.label} label={item.label} active={item.active} icon={<Icon name={item.icon} size="sm" color="inherit" />} />
                    ))}
                  </SidebarSection>
                </SidebarBody>
                <Box className="shrink-0 p-3">
                  <Card padding="md">
                    <Flex direction="column" gap="3">
                      <Flex direction="row" align="center" justify="between" gap="2">
                        <Text size="sm" weight="medium">Receipt scans</Text>
                        <Text size="sm" color="muted" className="tabular-nums">118 / 150</Text>
                      </Flex>
                      <Progress value={79} />
                      <Flex direction="row" align="center" justify="between" gap="2">
                        <Text size="xs" color="muted">Resets Oct 14</Text>
                        <Button variant="ghost" size="sm" className="-mr-2">Manage plan</Button>
                      </Flex>
                    </Flex>
                  </Card>
                </Box>
                <SidebarFooter className="p-2">
                  <Flex direction="row" align="center" gap="2" className="min-w-0 p-1">
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
                <Text size="sm" color="muted">Shared with Daniel Reyes and two more members. Everyone sees the same budgets and goals.</Text>
              </Flex>
              <Flex direction="column" className="min-h-[200px] flex-1 rounded-[var(--radius-panel)] border border-dashed border-hairline" />
            </Flex>
          </AppFrame>
        </Box>
      </Container>
    </Section>
  );
}

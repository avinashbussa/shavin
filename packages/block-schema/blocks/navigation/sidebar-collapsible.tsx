import { Card, Container, Flex, Grid, Heading, Icon, Progress, Section, Sidebar, SidebarBody, SidebarFooter, SidebarHeader, SidebarNavItem, SidebarSection, SidebarTrigger, Text } from "@shavin/ui";

const defaultItems = [
  { icon: "layout-dashboard", label: "Overview", active: true },
  { icon: "landmark", label: "Accounts", active: false },
  { icon: "arrow-left-right", label: "Transactions", active: false },
  { icon: "target", label: "Budgets", active: false },
  { icon: "piggy-bank", label: "Goals", active: false },
  { icon: "receipt", label: "Bills", active: false },
];

const defaultGoals = [
  { name: "Emergency fund", saved: "$8,400.00", target: "$12,000.00", percent: 70 },
  { name: "Summer in Lisbon", saved: "$2,150.00", target: "$4,800.00", percent: 45 },
];

export function SidebarCollapsible({ items = defaultItems, goals = defaultGoals }) {
  return (
    <Section size="compact">
      <Container size="lg">
        <Flex direction="row" className="h-[640px] overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-canvas">
          <Sidebar variant="collapsible" defaultCollapsed>
            <SidebarHeader>
              <Flex role="img" aria-label="WiseOwl" align="center" justify="center" className="h-8 w-8 rounded-[var(--radius-lg)] bg-fg text-sm font-semibold text-canvas">W</Flex>
            </SidebarHeader>
            <SidebarBody>
              <SidebarSection>
                {items.map((item) => (
                  <SidebarNavItem key={item.label} label={item.label} active={item.active} icon={<Icon name={item.icon} size="sm" color="inherit" />} />
                ))}
              </SidebarSection>
            </SidebarBody>
            <SidebarFooter>
              <SidebarTrigger />
            </SidebarFooter>
          </Sidebar>
          <Flex direction="column" gap="6" className="min-w-0 flex-1 overflow-y-auto p-6">
            <Flex direction="column" gap="1">
              <Heading as="h1" size="lg">Overview</Heading>
              <Text size="sm" color="muted">The sidebar stays out of the way. Hover an icon to see its name.</Text>
            </Flex>
            <Card padding="lg">
              <Flex direction="column" gap="2">
                <Text size="sm" color="muted">Net worth</Text>
                <Heading as="p" size="xl" className="tabular-nums">$184,276.52</Heading>
                <Text size="sm" color="muted" className="tabular-nums">Up $2,914.08 since August</Text>
              </Flex>
            </Card>
            <Grid columns="auto" minWidth="sm" maxColumns="2" gap="4">
              {goals.map((goal) => (
                <Card key={goal.name} padding="lg">
                  <Flex direction="column" gap="3">
                    <Text size="sm" weight="medium">{goal.name}</Text>
                    <Text size="sm" color="muted" className="tabular-nums">{goal.saved} of {goal.target}</Text>
                    <Progress value={goal.percent} />
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

import { AppFrame, Button, Card, Container, Flex, Grid, Heading, Icon, Section, Sidebar, SidebarBody, SidebarFooter, SidebarHeader, SidebarNavItem, SidebarSection, SidebarTrigger, Text } from "@shavin/ui";

const defaultItems = [
  { icon: "layout-dashboard", label: "Overview", active: true },
  { icon: "arrow-left-right", label: "Transactions", active: false },
  { icon: "target", label: "Budgets", active: false },
  { icon: "piggy-bank", label: "Goals", active: false },
  { icon: "message-circle", label: "Ask WiseOwl", active: false },
];

const defaultStats = [
  { label: "Net worth", value: "$184,276.52", note: "Up $2,914.08 since August" },
  { label: "Left to spend", value: "$1,284.60", note: "18 days left in September" },
];

export function SidebarFloating({ items = defaultItems, stats = defaultStats }) {
  return (
    <Section size="compact">
      <Container size="lg">
        <Flex bgOverlays="mesh-accent" className="relative h-[640px] overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-canvas">
          <AppFrame
            className="h-full w-full"
            sidebar={
              <Sidebar variant="floating" width="w-60" className="bg-surface/80 backdrop-blur">
                <SidebarHeader className="border-b-0">
                  <Heading as="p" size="sm" tracking="tight">WiseOwl</Heading>
                </SidebarHeader>
                <SidebarBody>
                  <SidebarSection>
                    {items.map((item) => (
                      <SidebarNavItem key={item.label} label={item.label} active={item.active} icon={<Icon name={item.icon} size="sm" color="inherit" />} />
                    ))}
                  </SidebarSection>
                </SidebarBody>
                <SidebarFooter className="border-t-0 p-4">
                  <Flex direction="column" gap="3" className="w-full">
                    <Flex direction="column" gap="1">
                      <Text size="overline" color="muted">Bills due this week</Text>
                      <Text size="sm" className="text-pretty tabular-nums">3 bills totalling $1,418.72 before Friday.</Text>
                    </Flex>
                    <Button variant="outline" size="sm" className="w-full">Review bills</Button>
                  </Flex>
                </SidebarFooter>
              </Sidebar>
            }
          >
            <Flex direction="row" align="center" gap="2" className="shavin-frame-compact-only m-3 mb-0 h-14 shrink-0 rounded-[var(--radius-panel)] border border-hairline bg-surface/80 pl-2 pr-4 shadow-panel backdrop-blur">
              <SidebarTrigger />
              <Heading as="p" size="sm" tracking="tight">WiseOwl</Heading>
            </Flex>
            <Flex direction="column" gap="6" role="region" aria-label="Content" tabIndex={0} className="relative min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
              <Flex direction="column" gap="1">
                <Heading as="h1" size="lg">Good morning, Maya</Heading>
                <Text size="sm" color="muted">Everything synced 4 minutes ago. Two budgets need a look this week.</Text>
              </Flex>
              <Grid columns="auto" minWidth="sm" maxColumns="2" gap="4">
                {stats.map((stat) => (
                  <Card key={stat.label} padding="lg">
                    <Flex direction="column" gap="2">
                      <Text size="sm" color="muted">{stat.label}</Text>
                      <Heading as="p" size="xl" className="tabular-nums">{stat.value}</Heading>
                      <Text size="sm" color="muted">{stat.note}</Text>
                    </Flex>
                  </Card>
                ))}
              </Grid>
            </Flex>
          </AppFrame>
        </Flex>
      </Container>
    </Section>
  );
}

import { AppFrame, Badge, Box, Button, Card, Flex, Grid, Heading, Icon, IconButton, Progress, Sidebar, SidebarBody, SidebarFooter, SidebarHeader, SidebarNavItem, SidebarSection, SidebarTrigger, Table, TableBody, TableCell, TableColumnHeaderCell, TableHeader, TableRow, Text } from "@shavin/ui";

const defaultNavGroups = [
  {
    title: "Money",
    items: [
      { label: "Overview", icon: "layout-dashboard", active: true },
      { label: "Accounts", icon: "landmark", active: false },
      { label: "Transactions", icon: "receipt", active: false },
    ],
  },
  {
    title: "Planning",
    items: [
      { label: "Budgets", icon: "pie-chart", active: false },
      { label: "Goals", icon: "target", active: false },
      { label: "Bills", icon: "calendar-clock", active: false },
    ],
  },
];

const defaultKpis = [
  { label: "Net worth", value: "$184,276.52", change: "+2.4%", tone: "success" },
  { label: "Spent in September", value: "$6,412.38", change: "−6.8%", tone: "success" },
  { label: "Saved in September", value: "$3,427.62", change: "35% of income", tone: "muted" },
  { label: "Bills due in 7 days", value: "$1,418.72", change: "3 bills", tone: "muted" },
];

const defaultTransactions = [
  { date: "Oct 3", merchant: "Shell #4410", category: "Transport", account: "Meridian Visa ••4417", amount: "−$52.18", status: "", credit: false },
  { date: "Oct 2", merchant: "Trader Joe's #142", category: "Groceries", account: "Cascade Checking ••6021", amount: "−$86.47", status: "", credit: false },
  { date: "Oct 1", merchant: "Transfer to Savings", category: "Transfer", account: "Cascade Checking ••6021", amount: "−$1,200.00", status: "Pending", credit: false },
  { date: "Oct 1", merchant: "Riverside Apartments", category: "Rent", account: "Cascade Checking ••6021", amount: "−$2,150.00", status: "", credit: false },
  { date: "Sep 30", merchant: "Pacific Power", category: "Utilities", account: "Cascade Checking ••6021", amount: "−$118.63", status: "", credit: false },
  { date: "Sep 28", merchant: "Portland Public Schools", category: "Income", account: "Cascade Checking ••6021", amount: "+$4,920.00", status: "", credit: true },
];

export function AppShell({ navGroups = defaultNavGroups, kpis = defaultKpis, transactions = defaultTransactions }) {
  return (
    <AppFrame
      className="h-[720px] w-full bg-canvas text-fg"
      sidebar={
        <Sidebar width="w-60">
          <SidebarHeader>
            <Flex direction="row" align="center" gap="2" className="min-w-0">
              <Icon name="wallet" size="md" color="accent" />
              <Flex direction="column" gap="0" className="min-w-0">
                <Text size="sm" weight="semibold">WiseOwl</Text>
                <Text size="xs" color="muted" className="truncate">Okafor-Reyes Household</Text>
              </Flex>
            </Flex>
          </SidebarHeader>
          <SidebarBody>
            {navGroups.map((group) => (
              <SidebarSection key={group.title} title={group.title}>
                {group.items.map((item) => (
                  <SidebarNavItem key={item.label} label={item.label} active={item.active} icon={<Icon name={item.icon} size="sm" color="inherit" />} />
                ))}
              </SidebarSection>
            ))}
          </SidebarBody>
          <SidebarFooter>
            <Box className="w-full rounded-[var(--radius-lg)] border border-hairline p-3">
              <Flex direction="column" gap="2">
                <Flex direction="row" align="center" justify="between" gap="2">
                  <Text size="xs" weight="medium">Household plan</Text>
                  <Text size="xs" color="muted" className="tabular-nums">4 of 6 seats</Text>
                </Flex>
                <Progress value={67} size="sm" label="Seats used" />
              </Flex>
            </Box>
          </SidebarFooter>
        </Sidebar>
      }
    >
      <Flex direction="column" gap="4" className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
        <Flex direction="row" align="center" justify="between" wrap="wrap" gap="3">
          <Flex direction="row" align="center" gap="2" className="min-w-0">
            <SidebarTrigger />
            <Flex direction="column" gap="1" className="min-w-0">
              <Heading as="h1" size="md">Good morning, Maya</Heading>
              <Text size="sm" color="muted">Sunday, October 4 · 3 bills due this week</Text>
            </Flex>
          </Flex>
          <Flex direction="row" align="center" gap="2">
            <IconButton variant="ghost" size="md" aria-label="Search">
              <Icon name="search" />
            </IconButton>
            <IconButton variant="ghost" size="md" aria-label="Notifications">
              <Icon name="bell" />
            </IconButton>
            <Button variant="solid" size="md">Add transaction</Button>
          </Flex>
        </Flex>
        <Grid columns="auto" minWidth="sm" maxColumns="4" gap="3">
          {kpis.map((kpi) => (
            <Card key={kpi.label} padding="sm">
              <Flex direction="column" gap="2">
                <Text size="xs" color="muted">{kpi.label}</Text>
                <Heading as="p" size="md" weight="medium" className="tabular-nums">{kpi.value}</Heading>
                <Text size="xs" weight="medium" className={kpi.tone === "success" ? "text-success tabular-nums" : "text-fg-muted tabular-nums"}>{kpi.change}</Text>
              </Flex>
            </Card>
          ))}
        </Grid>
        <Card padding="sm">
          <Flex direction="column" gap="3">
            <Flex direction="row" align="center" justify="between" gap="3">
              <Heading as="h2" size="sm">Recent transactions</Heading>
              <Button variant="ghost" size="sm">View all transactions</Button>
            </Flex>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableColumnHeaderCell>Date</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Merchant</TableColumnHeaderCell>
                  <TableColumnHeaderCell className="max-md:hidden">Category</TableColumnHeaderCell>
                  <TableColumnHeaderCell className="max-lg:hidden">Account</TableColumnHeaderCell>
                  <TableColumnHeaderCell className="text-right">Amount</TableColumnHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={`${txn.date}-${txn.merchant}`}>
                    <TableCell className="whitespace-nowrap text-fg-muted tabular-nums">{txn.date}</TableCell>
                    <TableCell>
                      <Flex direction="row" align="center" gap="2">
                        <Text size="sm" weight="medium" className="truncate">{txn.merchant}</Text>
                        {txn.status && <Badge variant="soft" size="sm" radius="full" tone="warning">{txn.status}</Badge>}
                      </Flex>
                    </TableCell>
                    <TableCell className="text-fg-muted max-md:hidden">{txn.category}</TableCell>
                    <TableCell className="whitespace-nowrap text-fg-muted max-lg:hidden">{txn.account}</TableCell>
                    <TableCell className={txn.credit ? "whitespace-nowrap text-right font-medium text-success tabular-nums" : "whitespace-nowrap text-right font-medium tabular-nums"}>{txn.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Flex>
        </Card>
      </Flex>
    </AppFrame>
  );
}

import { Box, Container, Flex, Heading, Icon, IconButton, Link, Section, Separator, Text, TextField } from "@shavin/ui";

const defaultRail = [
  { icon: "layout-dashboard", label: "Overview", active: false },
  { icon: "landmark", label: "Accounts", active: true },
  { icon: "target", label: "Budgets", active: false },
  { icon: "piggy-bank", label: "Goals", active: false },
  { icon: "settings", label: "Settings", active: false },
];

const defaultGroups = [
  {
    title: "Cash",
    items: [
      { name: "Cascade Federal Checking", mask: "••6021", balance: "$4,812.36", active: true },
      { name: "Harborline High-Yield Savings", mask: "••3390", balance: "$11,460.00", active: false },
    ],
  },
  {
    title: "Credit",
    items: [
      { name: "Meridian Rewards Visa", mask: "••4417", balance: "-$1,236.18", active: false },
      { name: "Pinecrest Cash Back", mask: "••8805", balance: "-$342.09", active: false },
    ],
  },
  {
    title: "Loans and investments",
    items: [
      { name: "Harborline Auto Loan", mask: "••2274", balance: "-$6,918.40", active: false },
      { name: "Northgate 401(k)", mask: "••1150", balance: "$98,540.83", active: false },
    ],
  },
];

export function SidebarDualResizable({ rail = defaultRail, groups = defaultGroups }) {
  return (
    <Section size="compact">
      <Container size="lg">
        <Flex direction="row" className="h-[640px] overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-canvas">
          <Flex as="nav" direction="column" align="center" gap="1" aria-label="Main" className="w-16 shrink-0 border-r border-hairline bg-surface py-3 max-md:hidden">
            {rail.map((item) => (
              <IconButton key={item.label} variant="ghost" size="md" aria-label={item.label} title={item.label} className={item.active ? "bg-surface-hover text-fg" : ""}>
                <Icon name={item.icon} size="md" color="inherit" />
              </IconButton>
            ))}
          </Flex>
          <Flex direction="column" className="w-full shrink-0 bg-surface md:w-72">
            <Flex direction="column" gap="3" className="shrink-0 border-b border-hairline p-4">
              <Flex direction="row" align="center" justify="between" gap="2">
                <Text size="sm" weight="semibold">Accounts</Text>
                <IconButton variant="ghost" size="sm" aria-label="Add account">
                  <Icon name="plus" size="sm" color="inherit" />
                </IconButton>
              </Flex>
              <TextField type="search" placeholder="Filter accounts" aria-label="Filter accounts" leadingIcon={<Icon name="search" size="sm" color="muted" />} />
            </Flex>
            <Flex direction="column" gap="4" className="min-h-0 flex-1 overflow-y-auto p-2">
              {groups.map((group) => (
                <Flex key={group.title} direction="column" gap="1">
                  <Text size="overline" color="muted" className="px-3 pb-1 pt-2">{group.title}</Text>
                  {group.items.map((item) => (
                    <Link key={item.name} href="/accounts" underline="none" className={item.active ? "flex items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-surface-hover px-3 py-2" : "flex items-center justify-between gap-3 rounded-[var(--radius-lg)] px-3 py-2 hover:bg-surface-hover"}>
                      <Flex direction="column" className="min-w-0">
                        <Text size="sm" weight="medium" truncate>{item.name}</Text>
                        <Text size="xs" color="muted" className="tabular-nums">{item.mask}</Text>
                      </Flex>
                      <Text size="sm" className="shrink-0 tabular-nums">{item.balance}</Text>
                    </Link>
                  ))}
                </Flex>
              ))}
            </Flex>
            <Flex direction="row" align="center" justify="between" gap="2" className="shrink-0 border-t border-hairline px-5 py-3">
              <Text size="sm" color="muted">Net worth</Text>
              <Text size="sm" weight="semibold" className="tabular-nums">$184,276.52</Text>
            </Flex>
          </Flex>
          <Flex role="separator" aria-orientation="vertical" aria-label="Resize account list" align="center" justify="center" className="group relative w-3 shrink-0 cursor-col-resize max-md:hidden">
            <Box className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-hairline group-hover:bg-accent" />
            <Flex align="center" justify="center" className="relative h-8 w-3 rounded-full border border-hairline bg-surface text-fg-muted">
              <Icon name="grip-vertical" size="xs" color="inherit" />
            </Flex>
          </Flex>
          <Flex direction="column" gap="6" className="min-w-0 flex-1 overflow-y-auto p-6 max-md:hidden">
            <Flex direction="column" gap="1">
              <Text size="sm" color="muted">Cascade Federal Checking ••6021</Text>
              <Heading as="h1" size="xl" className="tabular-nums">$4,812.36</Heading>
              <Text size="sm" color="muted">Synced 4 minutes ago</Text>
            </Flex>
            <Separator />
            <Flex direction="column" className="min-h-[200px] flex-1 rounded-[var(--radius-panel)] border border-dashed border-hairline" />
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}

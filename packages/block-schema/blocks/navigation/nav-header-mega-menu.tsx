import { Button, Container, Drawer, Flex, Grid, Icon, IconButton, Image, Link, Popover, PopoverAnchor, PopoverContent, PopoverTrigger, Section, Text, WiseOwlLogo } from "@shavin/ui";

const defaultLinks = [
  { label: "Household", href: "/household" },
  { label: "Pricing", href: "/pricing" },
  { label: "Developers", href: "/developers" },
];

const defaultGroups = [
  {
    title: "Plan",
    items: [
      { icon: "target", label: "Budgets", description: "Monthly limits by category", href: "/product/budgets" },
      { icon: "piggy-bank", label: "Savings goals", description: "Amounts and dates that add up", href: "/product/goals" },
      { icon: "trending-up", label: "Cash-flow forecast", description: "The next 90 days, estimated", href: "/product/forecast" },
    ],
  },
  {
    title: "Track",
    items: [
      { icon: "landmark", label: "Accounts", description: "11,642 banks and credit unions", href: "/product/accounts" },
      { icon: "receipt", label: "Bills & subscriptions", description: "Every recurring charge in one list", href: "/product/bills" },
      { icon: "line-chart", label: "Net worth", description: "Assets and debts over time", href: "/product/net-worth" },
    ],
  },
  {
    title: "Ask",
    items: [
      { icon: "message-circle", label: "Ask WiseOwl", description: "Questions about your spending", href: "/product/ask" },
      { icon: "scan-line", label: "Receipt scanning", description: "Line items from a photo", href: "/product/receipts" },
    ],
  },
];

export function NavHeaderMegaMenu({ links = defaultLinks, groups = defaultGroups }) {
  return (
    <Section as="header" size="compact">
      <Container size="lg">
        <Link href="#main" underline="none" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-lg)] focus:border focus:border-hairline focus:bg-surface focus:px-3 focus:py-2 focus:text-fg">Skip to content</Link>
        <Popover>
          <PopoverAnchor asChild>
            <Flex direction="row" align="center" justify="between" gap="6" className="h-14">
              <WiseOwlLogo />
              <Flex as="nav" direction="row" align="center" gap="1" aria-label="Main" className="max-md:hidden">
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" iconRight={<Icon name="chevron-down" size="sm" />} className="data-[state=open]:bg-surface-hover data-[state=open]:text-fg">Product</Button>
                </PopoverTrigger>
                {links.map((link) => (
                  <Link key={link.label} href={link.href} size="sm" underline="none" className="rounded-[var(--radius-lg)] px-3 py-2 font-medium text-fg-muted hover:bg-surface-hover hover:text-fg">{link.label}</Link>
                ))}
              </Flex>
              <Flex direction="row" align="center" gap="2" className="max-md:hidden">
                <Button variant="ghost" size="sm" asChild><a href="/signin">Sign in</a></Button>
                <Button size="sm" asChild><a href="/signup">Start free</a></Button>
              </Flex>
              <Drawer
                title="Menu"
                side="right"
                size="sm"
                trigger={
                  <IconButton variant="ghost" size="md" aria-label="Open menu" className="md:hidden">
                    <Icon name="menu" size="md" color="inherit" />
                  </IconButton>
                }
              >
                <Flex as="nav" direction="column" gap="5" aria-label="Mobile">
                  {groups.map((group) => (
                    <Flex key={group.title} direction="column" gap="1">
                      <Text size="overline" color="muted">{group.title}</Text>
                      {group.items.map((item) => (
                        <Link key={item.label} href={item.href} size="md" underline="none" className="rounded-[var(--radius-lg)] px-2 py-2 font-medium text-fg hover:bg-surface-hover">{item.label}</Link>
                      ))}
                    </Flex>
                  ))}
                  <Flex direction="column" gap="1">
                    {links.map((link) => (
                      <Link key={link.label} href={link.href} size="md" underline="none" className="rounded-[var(--radius-lg)] px-2 py-2 font-medium text-fg hover:bg-surface-hover">{link.label}</Link>
                    ))}
                  </Flex>
                  <Button asChild><a href="/signup">Start free</a></Button>
                </Flex>
              </Drawer>
            </Flex>
          </PopoverAnchor>
          <PopoverContent align="start" sideOffset={8} className="w-[var(--radix-popper-anchor-width)] overflow-hidden p-0 shadow-panel max-md:hidden">
            <Flex direction="column" className="lg:flex-row">
              <Grid columns="3" gap="6" className="flex-1 p-6">
                {groups.map((group) => (
                  <Flex key={group.title} direction="column" gap="3">
                    <Text size="overline" color="muted" className="px-2">{group.title}</Text>
                    <Flex direction="column" gap="1">
                      {group.items.map((item) => (
                        <Link key={item.label} href={item.href} underline="none" className="flex items-start gap-3 rounded-[var(--radius-lg)] p-2 hover:bg-surface-hover">
                          <Flex align="center" justify="center" className="h-9 w-9 shrink-0 rounded-[var(--radius-lg)] border border-hairline bg-canvas">
                            <Icon name={item.icon} size="sm" color="brand" />
                          </Flex>
                          <Flex direction="column" gap="1" className="min-w-0">
                            <Text size="sm" weight="medium">{item.label}</Text>
                            <Text size="sm" color="muted">{item.description}</Text>
                          </Flex>
                        </Link>
                      ))}
                    </Flex>
                  </Flex>
                ))}
              </Grid>
              <Flex direction="column" gap="4" className="border-hairline bg-canvas p-6 max-lg:border-t lg:w-[320px] lg:border-l">
                <Image src="https://assets.lummi.ai/assets/QmQrVUM5reCYVXq4MvwjghJ9Uhx9Uh4oKm6Y9xBzGE9x1S?auto=format&w=800" alt="A warm red living room with a low sofa" ratio="16/10" radius="concentric" className="max-lg:hidden" />
                <Flex direction="column" gap="2">
                  <Text size="overline" color="muted">New in 3.8</Text>
                  <Text size="md" weight="semibold">Shared goals for households</Text>
                  <Text size="sm" color="muted" className="text-pretty">Track one goal with contributions from everyone in the household.</Text>
                </Flex>
                <Link href="/changelog" size="sm" className="inline-flex items-center gap-1.5 font-medium">
                  Read the release notes
                  <Icon name="arrow-right" size="sm" color="inherit" />
                </Link>
              </Flex>
            </Flex>
          </PopoverContent>
        </Popover>
      </Container>
    </Section>
  );
}

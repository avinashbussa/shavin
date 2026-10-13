import { Button, Container, Flex, Grid, Heading, Icon, Link, Section, Separator, Text } from "@shavin/ui";

const defaultGroups = [
  {
    title: "Product",
    links: [
      { label: "Budgets", href: "/product/budgets" },
      { label: "Savings goals", href: "/product/goals" },
      { label: "Bills & subscriptions", href: "/product/bills" },
      { label: "Net worth", href: "/product/net-worth" },
      { label: "Receipt scanning", href: "/product/receipts" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Households",
    links: [
      { label: "Couples", href: "/households/couples" },
      { label: "Families", href: "/households/families" },
      { label: "Caring for parents", href: "/households/caregivers" },
      { label: "Working with an accountant", href: "/households/accountants" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "API overview", href: "/docs/api" },
      { label: "API reference", href: "/docs/api/reference" },
      { label: "Webhooks", href: "/docs/api/webhooks" },
      { label: "Sandbox", href: "/docs/api/sandbox" },
      { label: "Status", href: "https://status.wiseowl.app" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help centre", href: "/help" },
      { label: "Getting started", href: "/help/getting-started" },
      { label: "Money guides", href: "/guides" },
      { label: "Budget templates", href: "/guides/templates" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Security", href: "/security" },
      { label: "Press", href: "/press" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

const defaultLegal = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Cookie settings", href: "/legal/cookies" },
  { label: "Accessibility", href: "/legal/accessibility" },
];

export function FooterSitemap({ groups = defaultGroups, legal = defaultLegal }) {
  return (
    <Section as="footer" size="strip" className="border-t border-hairline">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Flex direction="column" gap="2">
            <Heading as="p" size="md" tracking="tight">WiseOwl</Heading>
            <Text size="sm" color="muted">Calm control of your money.</Text>
          </Flex>
          <Grid columns="auto" minWidth="xs" maxColumns="5" gap="6" className="gap-y-10">
            {groups.map((group) => (
              <Flex key={group.title} direction="column" gap="4">
                <Text size="overline" color="muted">{group.title}</Text>
                <Flex direction="column" gap="3">
                  {group.links.map((link) => (
                    <Link key={link.label} href={link.href} size="sm">{link.label}</Link>
                  ))}
                </Flex>
              </Flex>
            ))}
          </Grid>
          <Separator />
          <Flex direction="column" gap="4" className="w-full lg:flex-row lg:items-center lg:justify-between">
            <Flex direction="row" align="center" wrap="wrap" gap="4" className="gap-y-2">
              <Text size="sm" color="muted">© 2026 WiseOwl Finance, Inc. · Portland, OR</Text>
              {legal.map((item) => (
                <Link key={item.label} href={item.href} size="sm" className="text-fg-muted hover:text-fg">{item.label}</Link>
              ))}
            </Flex>
            <Flex direction="row" align="center" wrap="wrap" gap="4" className="lg:ml-auto">
              <Flex direction="row" align="center" gap="2">
                <Icon name="shield-check" size="sm" color="muted" />
                <Text size="sm" color="muted">SOC 2 Type II</Text>
              </Flex>
              <Button variant="outline" size="md">
                <Icon name="globe" size="sm" color="muted" />
                English (US)
                <Icon name="chevron-down" size="sm" color="muted" />
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}

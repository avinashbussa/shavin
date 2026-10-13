import { Container, Flex, Grid, Heading, Icon, Link, Section, Separator, Text } from "@shavin/ui";

const defaultGroups = [
  {
    title: "Product",
    links: [
      { label: "Budgets", href: "/product/budgets" },
      { label: "Savings goals", href: "/product/goals" },
      { label: "Bills & subscriptions", href: "/product/bills" },
      { label: "Net worth", href: "/product/net-worth" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help centre", href: "/help" },
      { label: "Money guides", href: "/guides" },
      { label: "API docs", href: "/docs/api" },
      { label: "System status", href: "https://status.wiseowl.app" },
    ],
  },
];

const defaultSocial = [
  { name: "GitHub", icon: "github-logo", href: "https://github.com/wiseowl-finance" },
  { name: "X", icon: "x-logo", href: "https://x.com/wiseowlapp" },
  { name: "LinkedIn", icon: "linkedin-logo", href: "https://linkedin.com/company/wiseowl-finance" },
  { name: "YouTube", icon: "youtube-logo", href: "https://youtube.com/@wiseowlapp" },
];

export function FooterColumns({ groups = defaultGroups, social = defaultSocial }) {
  return (
    <Section as="footer" size="strip" className="border-t border-hairline">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Flex direction="column" gap="7" className="lg:flex-row lg:justify-between">
            <Flex direction="column" gap="3" className="max-w-xs">
              <Heading as="p" size="md" tracking="tight">WiseOwl</Heading>
              <Text size="sm" color="muted" className="text-pretty">Calm control of your money, for you and everyone you share it with.</Text>
            </Flex>
            <Grid columns="auto" minWidth="xs" maxColumns="3" gap="6" className="lg:min-w-[560px]">
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
          </Flex>
          <Separator />
          <Flex direction="column" gap="4" className="md:flex-row md:items-center md:justify-between">
            <Text size="sm" color="muted" className="md:whitespace-nowrap">© 2026 WiseOwl Finance, Inc. WiseOwl is not a bank.</Text>
            <Flex direction="row" gap="1" className="-ml-2.5 md:ml-0 md:-mr-2.5">
              {social.map((item) => (
                <Link key={item.name} href={item.href} aria-label={item.name} className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] text-fg-muted hover:bg-surface-hover hover:text-fg">
                  <Icon name={item.icon} size="md" color="inherit" />
                </Link>
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}

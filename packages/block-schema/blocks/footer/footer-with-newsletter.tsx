import { Button, Card, Container, Flex, Grid, Heading, Icon, Image, Link, Section, Separator, Text, TextField } from "@shavin/ui";

const defaultGroups = [
  {
    title: "Product",
    links: [
      { label: "Budgets", href: "/product/budgets" },
      { label: "Savings goals", href: "/product/goals" },
      { label: "Bills & subscriptions", href: "/product/bills" },
      { label: "Ask WiseOwl", href: "/product/assistant" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help centre", href: "/help" },
      { label: "Money guides", href: "/guides" },
      { label: "Changelog", href: "/changelog" },
      { label: "System status", href: "https://status.wiseowl.app" },
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
];

const defaultLegal = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
];

const defaultSocial = [
  { name: "X", icon: "x-logo", href: "https://x.com/wiseowlapp" },
  { name: "LinkedIn", icon: "linkedin-logo", href: "https://linkedin.com/company/wiseowl-finance" },
  { name: "YouTube", icon: "youtube-logo", href: "https://youtube.com/@wiseowlapp" },
];

export function FooterWithNewsletter({ groups = defaultGroups, legal = defaultLegal, social = defaultSocial }) {
  return (
    <Section as="footer" size="strip" className="border-t border-hairline">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Card padding="lg">
            <Flex direction="column" gap="5" className="md:flex-row md:items-center">
              <Image
                src="https://assets.lummi.ai/assets/QmQ57n8BauDZPxxXUZX1wLGVZDjYBbYXMd5JXWTrrenLqq?auto=format&w=400"
                alt="A succulent on a bright windowsill"
                ratio="1/1"
                radius="concentric"
                className="w-20 shrink-0"
              />
              <Flex direction="column" gap="1" className="flex-1">
                <Heading as="h2" size="md">One money idea every Sunday</Heading>
                <Text size="sm" color="muted" className="max-w-[52ch] text-pretty tabular-nums">Practical habits and one reader question, read by 21,786 people each week.</Text>
              </Flex>
              <Flex direction="column" gap="2" className="sm:flex-row md:w-[400px]">
                <TextField type="email" placeholder="you@example.com" aria-label="Email address" className="h-10 flex-1" />
                <Button size="md" className="w-full shrink-0 sm:w-auto">Subscribe</Button>
              </Flex>
            </Flex>
          </Card>
          <Grid columns="4" gap="6" className="max-lg:grid-cols-3 max-md:grid-cols-2">
            <Flex direction="column" gap="3" className="max-lg:col-span-3 max-md:col-span-2">
              <Heading as="p" size="md" tracking="tight">WiseOwl</Heading>
              <Text size="sm" color="muted">Calm control of your money.</Text>
            </Flex>
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
          <Flex direction="column" gap="4" className="md:flex-row md:items-center md:justify-between">
            <Flex direction="row" align="center" wrap="wrap" gap="4" className="gap-y-1">
              <Text size="sm" color="muted">© 2026 WiseOwl Finance, Inc. WiseOwl is not a bank.</Text>
              {legal.map((item) => (
                <Link key={item.label} href={item.href} size="sm" className="inline-flex h-10 items-center text-fg-muted hover:text-fg">{item.label}</Link>
              ))}
            </Flex>
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

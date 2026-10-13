import { Container, Flex, Heading, Icon, Link, Section, Text } from "@shavin/ui";

const defaultLinks = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Status", href: "https://status.wiseowl.app" },
  { label: "help@wiseowl.app", href: "mailto:help@wiseowl.app" },
];

const defaultSocial = [
  { name: "GitHub", icon: "github-logo", href: "https://github.com/wiseowl-finance" },
  { name: "X", icon: "x-logo", href: "https://x.com/wiseowlapp" },
  { name: "LinkedIn", icon: "linkedin-logo", href: "https://linkedin.com/company/wiseowl-finance" },
];

export function FooterCompactSingleRow({ links = defaultLinks, social = defaultSocial }) {
  return (
    <Section as="footer" size="compact" className="border-t border-hairline">
      <Container size="lg">
        <Flex direction="column" gap="4" className="lg:flex-row lg:items-center lg:gap-8">
          <Flex direction="row" align="center" justify="between" gap="4" className="lg:contents">
            <Heading as="p" size="md" tracking="tight" className="lg:order-1">WiseOwl</Heading>
            <Flex direction="row" gap="1" className="-mr-2.5 lg:order-3 lg:mr-0">
              {social.map((item) => (
                <Link key={item.name} href={item.href} aria-label={item.name} className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] text-fg-muted hover:bg-surface-hover hover:text-fg">
                  <Icon name={item.icon} size="md" color="inherit" />
                </Link>
              ))}
            </Flex>
          </Flex>
          <Flex direction="row" wrap="wrap" gap="5" className="gap-y-1 lg:order-2 lg:flex-1">
            {links.map((link) => (
              <Link key={link.label} href={link.href} size="sm" className="inline-flex h-10 items-center">{link.label}</Link>
            ))}
          </Flex>
          <Text size="sm" color="muted" className="shrink-0 whitespace-nowrap lg:order-4">© 2026 WiseOwl Finance, Inc.</Text>
        </Flex>
      </Container>
    </Section>
  );
}

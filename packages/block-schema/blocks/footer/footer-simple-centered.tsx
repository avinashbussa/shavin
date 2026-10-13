import { Container, Flex, Heading, Icon, Link, Section, Separator, Text } from "@shavin/ui";

const defaultLinks = [
  { label: "Product", href: "/product" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
  { label: "Help", href: "/help" },
  { label: "Privacy", href: "/legal/privacy" },
];

const defaultSocial = [
  { name: "X", icon: "x-logo", href: "https://x.com/wiseowlapp" },
  { name: "LinkedIn", icon: "linkedin-logo", href: "https://linkedin.com/company/wiseowl-finance" },
  { name: "YouTube", icon: "youtube-logo", href: "https://youtube.com/@wiseowlapp" },
];

export function FooterSimpleCentered({ links = defaultLinks, social = defaultSocial }) {
  return (
    <Section as="footer" size="body" className="border-t border-hairline">
      <Container size="md">
        <Flex direction="column" align="center" gap="5" className="text-center">
          <Flex direction="column" align="center" gap="4">
            <Heading as="p" size="5xl" tracking="tighter">WiseOwl</Heading>
            <Text size="lg" color="muted">Calm control of your money.</Text>
          </Flex>
          <Flex direction="row" justify="center" wrap="wrap" gap="5" className="gap-y-2">
            {links.map((link) => (
              <Link key={link.label} href={link.href} size="sm" className="inline-flex h-10 items-center">{link.label}</Link>
            ))}
          </Flex>
          <Flex direction="row" justify="center" gap="1">
            {social.map((item) => (
              <Link key={item.name} href={item.href} aria-label={item.name} className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] text-fg-muted hover:bg-surface-hover hover:text-fg">
                <Icon name={item.icon} size="md" color="inherit" />
              </Link>
            ))}
          </Flex>
          <Separator className="w-full" />
          <Text size="sm" color="muted">© 2026 WiseOwl Finance, Inc.</Text>
        </Flex>
      </Container>
    </Section>
  );
}

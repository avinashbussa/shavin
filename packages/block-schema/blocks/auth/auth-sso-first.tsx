import { Button, Card, Container, Flex, Heading, Icon, Link, Section, Separator, Text, TextField } from "@shavin/ui";

const defaultProviders = [
  { label: "Continue with Google", icon: "google-logo" },
  { label: "Continue with GitHub", icon: "github-logo" },
  { label: "Continue with Apple", icon: "apple-logo" },
];

export function AuthSsoFirst({ providers = defaultProviders }) {
  return (
    <Section size="hero" bgOverlays="mesh-accent" className="flex items-center justify-center">
      <Container size="xs">
        <Flex direction="column" align="center" gap="6">
          <Heading as="p" size="sm" tracking="tight">WiseOwl</Heading>
          <Card padding="lg" className="w-full max-w-[420px]">
            <Flex direction="column" gap="5">
              <Flex direction="column" gap="2">
                <Heading as="h1" size="lg">Sign in to WiseOwl</Heading>
                <Text size="sm" color="muted" className="text-pretty">Use the account you already trust. We never see your provider password.</Text>
              </Flex>
              <Flex direction="column" gap="3">
                {providers.map((provider) => (
                  <Button key={provider.label} size="lg" variant="outline" className="w-full" iconLeft={<Icon name={provider.icon} size="sm" />}>{provider.label}</Button>
                ))}
              </Flex>
              <Flex direction="row" align="center" gap="3">
                <Separator className="flex-1" />
                <Text size="xs" color="muted">or use email</Text>
                <Separator className="flex-1" />
              </Flex>
              <Flex direction="column" gap="4">
                <TextField label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
                <Button size="lg" className="w-full">Continue with email</Button>
              </Flex>
              <Text size="xs" color="muted" className="text-center text-pretty">By continuing you agree to the <Link href="/legal/terms">Terms of Service</Link> and <Link href="/legal/privacy">Privacy Policy</Link>.</Text>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}

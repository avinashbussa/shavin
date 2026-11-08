import { Button, Card, Container, Flex, Grid, Heading, Icon, Link, Section, Separator, Text, TextField } from "@shavin/ui";

const defaultProviders = [
  { label: "Google", icon: "google-logo" },
  { label: "GitHub", icon: "github-logo" },
];

export function AuthSignup({ providers = defaultProviders }) {
  return (
    <Section size="hero" bgOverlays="mesh-accent" className="flex items-center justify-center">
      <Container size="xs">
        <Flex direction="column" align="center" gap="6">
          <Heading as="p" size="sm" tracking="tight">WiseOwl</Heading>
          <Card padding="lg" className="w-full max-w-[420px]">
            <Flex direction="column" gap="5">
              <Flex direction="column" gap="2">
                <Heading as="h1" size="lg">Create your free account</Heading>
                <Text size="sm" color="muted" className="text-pretty">Free for one person with two linked accounts. No card required.</Text>
              </Flex>
              <Grid columns="2" gap="3">
                {providers.map((provider) => (
                  <Button key={provider.label} variant="outline" className="w-full" iconLeft={<Icon name={provider.icon} size="sm" />}>{provider.label}</Button>
                ))}
              </Grid>
              <Flex direction="row" align="center" gap="3">
                <Separator className="flex-1" />
                <Text size="xs" color="muted">or</Text>
                <Separator className="flex-1" />
              </Flex>
              <form className="flex flex-col gap-5">
              <Flex direction="column" gap="4">
                <TextField label="Full name" placeholder="Maya Okafor" autoComplete="name" />
                <TextField label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
                <TextField label="Password" type="password" placeholder="At least 12 characters" hint="Use 12+ characters with a number or symbol." autoComplete="new-password" />
              </Flex>
              <Button type="submit" size="lg" className="w-full">Create account</Button>
              </form>
              <Flex direction="column" gap="2">
                <Text size="xs" color="muted" className="text-center text-pretty">By creating an account you agree to the <Link href="/legal/terms">Terms</Link> and <Link href="/legal/privacy">Privacy Policy</Link>.</Text>
                <Text size="xs" color="muted" className="text-center">Already have an account? <Link href="/signin" color="accent">Sign in</Link></Text>
              </Flex>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}

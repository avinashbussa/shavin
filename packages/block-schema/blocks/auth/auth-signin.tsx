import { Button, Card, Checkbox, Container, Flex, Grid, Heading, Icon, Link, Section, Separator, Text, TextField } from "@shavin/ui";

const defaultProviders = [
  { label: "Google", icon: "google-logo" },
  { label: "GitHub", icon: "github-logo" },
];

export function AuthSignin({ providers = defaultProviders }) {
  return (
    <Section size="hero" bgOverlays="mesh-accent" className="flex items-center justify-center">
      <Container size="xs">
        <Flex direction="column" align="center" gap="6">
          <Heading as="p" size="sm" tracking="tight">WiseOwl</Heading>
          <Card padding="lg" className="w-full max-w-[420px]">
            <Flex direction="column" gap="5">
              <Flex direction="column" gap="2">
                <Heading as="h1" size="lg">Welcome back</Heading>
                <Text size="sm" color="muted" className="text-pretty">Sign in to see your accounts, budgets and household.</Text>
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
                <TextField label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
                <TextField label="Password" type="password" placeholder="Enter your password" autoComplete="current-password" />
                <Flex direction="row" align="center" justify="between" gap="3" wrap="wrap">
                  <Checkbox label="Keep me signed in" />
                  <Link href="/forgot" size="sm" color="accent">Forgot password?</Link>
                </Flex>
              </Flex>
              <Button type="submit" size="lg" className="w-full">Sign in</Button>
              </form>
              <Text size="xs" color="muted" className="text-center">New to WiseOwl? <Link href="/signup" color="accent">Create a free account</Link></Text>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}

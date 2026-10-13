import { Button, Card, Container, Flex, Heading, Icon, Link, Section, Text, TextField } from "@shavin/ui";

export function AuthForgot() {
  return (
    <Section size="hero" bgOverlays="mesh-accent" className="flex items-center justify-center">
      <Container size="xs">
        <Flex direction="column" align="center" gap="6">
          <Heading as="p" size="sm" tracking="tight">WiseOwl</Heading>
          <Card padding="lg" className="w-full max-w-[420px]">
            <Flex direction="column" gap="5">
              <Link href="/signin" size="sm" underline="none" className="inline-flex h-10 w-fit items-center gap-1.5 text-fg-muted hover:text-fg">
                <Icon name="arrow-left" size="sm" color="inherit" />
                Back to sign in
              </Link>
              <Flex direction="column" gap="2">
                <Heading as="h1" size="lg">Reset your password</Heading>
                <Text size="sm" color="muted" className="text-pretty">Enter the email on your account and we will send a reset link. It works once and expires in 30 minutes.</Text>
              </Flex>
              <TextField label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
              <Button size="lg" className="w-full">Send reset link</Button>
              <Text size="xs" color="muted" className="text-center text-pretty">The link comes from help@wiseowl.app. Check your spam folder if it has not arrived in a few minutes.</Text>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}

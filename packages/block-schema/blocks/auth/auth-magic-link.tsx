import { Button, Card, Container, Flex, Heading, Icon, Section, Text, TextField } from "@shavin/ui";

export function AuthMagicLink() {
  return (
    <Section size="hero" bgOverlays="mesh-accent" className="flex items-center justify-center">
      <Container size="xs">
        <Flex direction="column" align="center" gap="6">
          <Heading as="p" size="sm" tracking="tight">WiseOwl</Heading>
          <Card padding="lg" className="w-full max-w-[420px]">
            <Flex direction="column" gap="5">
              <Flex direction="column" gap="2">
                <Heading as="h1" size="lg">Sign in without a password</Heading>
                <Text size="sm" color="muted" className="text-pretty">We will email you a secure link that signs you in on this device.</Text>
              </Flex>
              <form className="flex flex-col gap-5">
                <TextField label="Email" type="email" placeholder="you@example.com" autoComplete="email" hint="Check your inbox after sending. The link works once and expires in 15 minutes." />
                <Flex direction="column" gap="2">
                  <Button type="submit" size="lg" className="w-full" iconLeft={<Icon name="mail" size="sm" />}>Email me a link</Button>
                  <Button size="lg" variant="ghost" className="w-full">Use a password instead</Button>
                </Flex>
              </form>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}

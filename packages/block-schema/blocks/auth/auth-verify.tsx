import { Button, Card, Container, Flex, Heading, Link, Section, Text, TextField } from "@shavin/ui";

export function AuthVerify() {
  return (
    <Section size="hero" bgOverlays="mesh-accent" className="flex items-center justify-center">
      <Container size="xs">
        <Flex direction="column" align="center" gap="6">
          <Heading as="p" size="sm" tracking="tight">WiseOwl</Heading>
          <Card padding="lg" className="w-full max-w-[420px]">
            <Flex direction="column" gap="5">
              <Flex direction="column" gap="2">
                <Heading as="h1" size="lg">Enter your verification code</Heading>
                <Text size="sm" color="muted" className="text-pretty">We sent a 6-digit code to maya.okafor@example.com. It expires in 10 minutes.</Text>
              </Flex>
              <TextField type="otp" length={6} label="Verification code" autoComplete="one-time-code" className="flex w-full [&>div]:w-full" slotClassName="w-auto min-w-0 flex-1" />
              <Button size="lg" className="w-full">Verify email</Button>
              <Flex direction="column" align="center" gap="2">
                <Text size="sm" color="muted" className="tabular-nums">No code yet? <Link href="/verify/resend" color="accent">Resend code</Link> in 0:42</Text>
                <Text size="xs" color="muted">Wrong address? <Link href="/signup">Change email</Link></Text>
              </Flex>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}

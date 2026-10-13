import { Button, Card, Flex, Heading, Link, Text, TextField } from "@shavin/ui";

export function SignInCard() {
  return (
    <Card padding="lg" className="w-full max-w-[400px]">
      <Flex direction="column" gap="5">
        <Flex direction="column" gap="1">
          <Heading as="h2" size="md">Sign in</Heading>
          <Text size="sm" color="muted">Use your WiseOwl email and password.</Text>
        </Flex>
        <Flex direction="column" gap="4">
          <TextField label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
          <TextField label="Password" type="password" placeholder="Enter your password" autoComplete="current-password" />
        </Flex>
        <Button className="w-full">Sign in</Button>
        <Link href="/forgot" size="sm" color="accent" className="mx-auto">Forgot password?</Link>
      </Flex>
    </Card>
  );
}

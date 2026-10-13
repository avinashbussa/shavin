import { Button, Container, Flex, Grid, Heading, Link, Section, Text, TextField } from "@shavin/ui";

export function AuthSplitScreen() {
  return (
    <Section className="py-0">
      <Grid columns="2" gap="0" stack="auto" className="min-h-[100svh]">
        <Flex
          direction="column"
          justify="end"
          surface="dark-always"
          bgImage="https://assets.lummi.ai/assets/QmVQ6Y2zm36g3VK9LHzgCKqJEbTbL8GYXtmjuHB3nkgzeX?auto=format&w=1600"
          bgOverlays="scrim"
          className="hidden p-10 md:flex lg:p-14"
        >
          <Flex direction="column" gap="4" className="max-w-[40ch]">
            <Heading as="blockquote" size="xl" weight="medium" className="text-pretty">Sunday money check-ins went from an hour of spreadsheets to fifteen minutes with coffee.</Heading>
            <Flex direction="column" gap="1">
              <Text size="sm" weight="medium">Lena Hoffmann</Text>
              <Text size="sm" color="muted">Household owner · Denver, CO</Text>
            </Flex>
          </Flex>
        </Flex>
        <Flex direction="column" justify="center" className="py-16">
          <Container size="xs">
            <Flex direction="column" gap="6" className="mx-auto w-full max-w-[400px]">
              <Heading as="p" size="sm" tracking="tight">WiseOwl</Heading>
              <Flex direction="column" gap="2">
                <Heading as="h1" size="xl">Sign in to your household</Heading>
                <Text size="sm" color="muted" className="text-pretty">Pick up where you left off. Your partner sees the same numbers the moment you update a budget.</Text>
              </Flex>
              <Flex direction="column" gap="4">
                <TextField label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
                <TextField label="Password" type="password" placeholder="Enter your password" autoComplete="current-password" />
                <Link href="/forgot" size="sm" color="accent" className="w-fit">Forgot password?</Link>
              </Flex>
              <Flex direction="column" gap="3">
                <Button size="lg" className="w-full">Sign in</Button>
                <Button size="lg" variant="outline" className="w-full">Email me a sign-in link</Button>
              </Flex>
              <Text size="xs" color="muted">New to WiseOwl? <Link href="/signup" color="accent">Create a free account</Link></Text>
            </Flex>
          </Container>
        </Flex>
      </Grid>
    </Section>
  );
}

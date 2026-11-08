import { Button, Container, Flex, Heading, Section, Text } from "@shavin/ui";

export function HeroCenteredMedia() {
  return (
    <Section
      size="hero"
      surface="dark-always"
      bgImage="https://assets.lummi.ai/assets/QmVUhpcUfSHzRLkfpCkKZb8Q2FrYitiVwsi4cRTXF2aXVY?auto=format&w=2000"
      bgOverlays="dark-30, gradient-bottom/70"
    >
      <Container size="md">
        <Flex direction="column" align="center" gap="6" className="text-center">
          <Flex direction="column" align="center" gap="4">
            <Text size="overline" color="muted">Personal finance</Text>
            <Heading as="h1" size="5xl">Know where every dollar stands</Heading>
            <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">
              WiseOwl connects your bank accounts, budgets and bills in one calm view, so money decisions take minutes instead of evenings.
            </Text>
          </Flex>
          <Flex direction="row" justify="center" wrap="wrap" gap="3">
            <Button size="lg" asChild><a href="/signup">Start free</a></Button>
            <Button size="lg" variant="outline" asChild><a href="#how-it-works">See how it works</a></Button>
          </Flex>
          <Text size="sm" color="muted" className="tabular-nums">Rated 4.8/5 from 3,906 reviews · 38,412 households</Text>
        </Flex>
      </Container>
    </Section>
  );
}

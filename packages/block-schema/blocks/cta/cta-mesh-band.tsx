import { Button, Container, Flex, Heading, Section, Text } from "@shavin/ui";

export function CtaMeshBand() {
  return (
    <Section size="hero" bgOverlays="mesh-accent">
      <Container size="md">
        <Flex direction="column" align="center" gap="6" className="text-center">
          <Flex direction="column" align="center" gap="5">
            <Text size="overline" color="muted">Get started</Text>
            <Heading as="h2" size="4xl">Start your calmer money month</Heading>
            <Text size="lg" color="muted" className="max-w-[52ch] text-pretty tabular-nums">
              Join 38,412 households who check in with WiseOwl a few minutes a week and stopped worrying about the rest.
            </Text>
          </Flex>
          <Flex direction="row" justify="center" wrap="wrap" gap="3">
            <Button size="lg" asChild><a href="/signup">Start free</a></Button>
            <Button size="lg" variant="outline" asChild><a href="/contact">Talk to us</a></Button>
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}

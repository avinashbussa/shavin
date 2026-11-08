import { Button, Container, Flex, Heading, Section, Text } from "@shavin/ui";

export function CtaConversionBanner() {
  return (
    <Section
      size="body"
      surface="dark-always"
      bgImage="https://assets.lummi.ai/assets/QmQrVUM5reCYVXq4MvwjghJ9Uhx9Uh4oKm6Y9xBzGE9x1S?auto=format&w=2000"
      bgOverlays="dark-50, scrim-left"
    >
      <Container size="lg">
        <Flex direction="row" align="end" justify="between" gap="7" wrap="wrap">
          <Flex direction="column" gap="3" className="max-w-xl">
            <Text size="overline" color="muted">Plus trial</Text>
            <Heading as="h2" size="2xl">Try Plus free for 14 days</Heading>
            <Text size="lg" color="muted" className="max-w-[46ch] text-pretty">
              Unlimited budgets, receipt scanning and the WiseOwl assistant. We remind you three days before the trial ends.
            </Text>
          </Flex>
          <Flex direction="row" wrap="wrap" gap="3" className="shrink-0">
            <Button size="lg" asChild><a href="/signup">Start free trial</a></Button>
            <Button size="lg" variant="outline" asChild><a href="/pricing">Compare plans</a></Button>
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}

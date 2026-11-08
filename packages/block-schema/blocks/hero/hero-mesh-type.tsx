import { Button, Container, Flex, Heading, Section, Text } from "@shavin/ui";

export function HeroMeshType() {
  return (
    <Section size="hero" surface="dark-always" bgOverlays="mesh-lime-animated">
      <Container size="md">
        <Flex direction="column" align="center" gap="7" className="text-center">
          <Flex direction="column" align="center" gap="5">
            <Heading as="h1" size="5xl">Your money, finally in one place</Heading>
            <Text size="lg" color="muted" className="max-w-[50ch] text-pretty tabular-nums">
              Link 11,642 banks and credit unions, see every balance and bill, and plan the month ahead in one sitting.
            </Text>
          </Flex>
          <Flex direction="column" align="center" gap="3">
            <Button size="lg" asChild><a href="/signup">Create your free account</a></Button>
            <Text size="sm" color="muted">No card required. Read-only access. Cancel any time.</Text>
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}

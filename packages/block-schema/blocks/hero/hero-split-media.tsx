import { Button, Container, Flex, Grid, Heading, Icon, Image, Section, Text } from "@shavin/ui";

const defaultPoints = ["Read-only bank connections", "Owner, Editor and Viewer roles", "Free for one person, forever"];

export function HeroSplitMedia({ points = defaultPoints }) {
  return (
    <Section size="hero" bgOverlays="mesh-accent">
      <Container size="lg">
        <Grid columns="2" gap="7" align="center" stack="auto">
          <Flex direction="column" gap="6">
            <Flex direction="column" gap="4">
              <Text size="overline" color="muted">For households</Text>
              <Heading as="h1" size="4xl">Plan money together, without the arguments</Heading>
              <Text size="lg" color="muted" className="max-w-[48ch] text-pretty">
                Share budgets, goals and bills with a partner or family member. Everyone sees the same numbers, and you choose who can edit.
              </Text>
            </Flex>
            <Flex direction="row" wrap="wrap" gap="3">
              <Button size="lg">Start a household</Button>
              <Button size="lg" variant="ghost">Compare plans</Button>
            </Flex>
            <Flex direction="column" gap="2">
              {points.map((point) => (
                <Flex key={point} direction="row" align="center" gap="2">
                  <Icon name="check" size="sm" color="accent" />
                  <Text size="sm" color="muted">{point}</Text>
                </Flex>
              ))}
            </Flex>
          </Flex>
          <Image
            src="https://assets.lummi.ai/assets/QmTsaPtLFDMQpYQYMP9C1qWfaxtEWp1EcQUNPQgT4mXY29?auto=format&w=1200"
            alt="A couple sitting close together against a warm pink wall"
            ratio="4/5"
            className="shadow-panel"
          />
        </Grid>
      </Container>
    </Section>
  );
}

import { Button, Container, Flex, Heading, Section, Text } from "@shavin/ui";

export function HeroVideoStatement() {
  return (
    <Section
      size="hero"
      surface="dark-always"
      bgVideo="https://videos.pexels.com/video-files/33227529/14158549_1280_720_30fps.mp4"
      bgPoster="https://images.pexels.com/videos/33227529/fsky-33227529.jpeg?auto=compress&w=1600"
      bgOverlays="dark-30, scrim-left"
    >
      <Container size="lg">
        <Flex direction="column" gap="6" className="max-w-2xl">
          <Flex direction="column" gap="4">
            <Text size="overline" color="muted">Calm money</Text>
            <Heading as="h1" size="5xl">Less checking. More knowing.</Heading>
            <Text size="lg" color="muted" className="max-w-[46ch] text-pretty">
              Quiet alerts tell you only what matters: a bill due, a budget near its limit, a charge that looks unfamiliar.
            </Text>
          </Flex>
          <Flex direction="row" wrap="wrap" gap="3">
            <Button size="lg">Start free</Button>
            <Button size="lg" variant="outline">Watch the 90-second tour</Button>
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}

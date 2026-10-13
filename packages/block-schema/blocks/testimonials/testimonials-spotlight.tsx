import { Container, Flex, Grid, Heading, Image, Section, Text } from "@shavin/ui";

export function TestimonialsSpotlight() {
  return (
    <Section size="body">
      <Container size="lg">
        <Grid columns="2" gap="7" align="center" stack="auto" className="md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Image
            src="https://assets.lummi.ai/assets/QmUWu25KJZruktibFUXivSoPDWmKs3S9ASXp7zVENaXSqL?auto=format&w=800"
            alt="Maya Okafor in soft window light"
            ratio="3/4"
            radius="concentric"
            className="w-full max-md:mx-auto max-md:max-w-[280px]"
          />
          <Flex direction="column" gap="6">
            <Text size="overline" color="muted">Member story</Text>
            <Heading as="p" size="3xl" weight="normal" className="max-w-[24ch] text-pretty">
              “We used to argue about money every month. Now we spend twenty minutes on Sunday looking at the same screen, and that’s it. We paid off the car eight months early.”
            </Heading>
            <Flex direction="column" gap="1" className="border-t border-hairline pt-5">
              <Text size="md" weight="semibold">Maya Okafor</Text>
              <Text size="sm" color="muted">Household owner since 2023 · Portland, OR</Text>
            </Flex>
          </Flex>
        </Grid>
      </Container>
    </Section>
  );
}

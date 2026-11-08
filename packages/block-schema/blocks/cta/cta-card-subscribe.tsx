import { Button, Card, Container, Flex, Grid, Heading, Image, Section, Text, TextField } from "@shavin/ui";

export function CtaCardSubscribe() {
  return (
    <Section size="body">
      <Container size="lg">
        <Card padding="lg">
          <Grid columns="2" gap="7" align="center" stack="auto">
            <Flex direction="column" gap="6">
              <Flex direction="column" gap="4">
                <Text size="overline" color="muted">Newsletter</Text>
                <Heading as="h2" size="2xl">One useful money idea, every Sunday</Heading>
                <Text size="lg" color="muted" className="max-w-[46ch] text-pretty tabular-nums">
                  One practical habit, one reader question and one chart. Read by 21,786 people. Unsubscribe in one click.
                </Text>
              </Flex>
              <Flex direction="column" gap="2">
                <form className="flex flex-col gap-2 sm:flex-row">
                  <TextField type="email" placeholder="you@example.com" aria-label="Email address" autoComplete="email" className="h-10" />
                  <Button type="submit" className="w-full shrink-0 sm:w-auto">Subscribe</Button>
                </form>
                <Text size="xs" color="muted">We never share your address. See our privacy policy.</Text>
              </Flex>
            </Flex>
            <Image
              src="https://assets.lummi.ai/assets/QmQ57n8BauDZPxxXUZX1wLGVZDjYBbYXMd5JXWTrrenLqq?auto=format&w=1200"
              alt="A succulent on a bright windowsill"
              ratio="4/3"
              radius="concentric"
              className="object-bottom"
            />
          </Grid>
        </Card>
      </Container>
    </Section>
  );
}

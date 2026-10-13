import { Avatar, Card, Container, Flex, Grid, Heading, Icon, Section, Text } from "@shavin/ui";

const defaultQuotes = [
  { name: "Aiyana Whitehorse", role: "Civil engineer", photo: "https://assets.lummi.ai/assets/QmQcKhezkk7r1v6yWpKETiLR22bUnVth1qxou372nTSS7w?auto=format&w=400", quote: "The home goal says $612 per paycheck. Knowing the exact number made it easy to stick with." },
  { name: "Samir Haddad", role: "Small-business owner", photo: "https://assets.lummi.ai/assets/QmXfEoGQdAQxXbT8ydEjxDR8UtXpmywjsqyUQCUeDLz4Ej?auto=format&w=400", quote: "Separate households for home and the shop finally stopped me mixing the two." },
];

export function TestimonialsFeatured({ quotes = defaultQuotes }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Flex direction="column" gap="4">
            <Text size="overline" color="muted">In their words</Text>
            <Heading as="h2" size="3xl">Households who stopped guessing</Heading>
          </Flex>
          <Grid columns="auto" minWidth="md" maxColumns="3" gap="5">
            <Card padding="xl" className="md:col-span-2 lg:row-span-2">
              <Flex direction="column" justify="between" gap="7" className="h-full">
                <Flex direction="column" gap="5">
                  <Icon name="quote" size="xl" color="muted" />
                  <Heading as="p" size="2xl" weight="normal" className="text-pretty">
                    I can see my parents’ bills from two states away and catch a missed payment before it becomes a late fee. They keep full control.
                  </Heading>
                </Flex>
                <Flex direction="row" align="center" gap="4">
                  <Avatar src="https://assets.lummi.ai/assets/QmX5eK5oLpmJmSstwYVDmKtsUjU7UPN3BXVMSjJkup2FZV?auto=format&w=400" alt="Fatima Al-Sayed" size="lg" />
                  <Flex direction="column" gap="0">
                    <Text size="md" weight="semibold">Fatima Al-Sayed</Text>
                    <Text size="sm" color="muted">Pharmacist · manages her parents’ household</Text>
                  </Flex>
                </Flex>
              </Flex>
            </Card>
            {quotes.map((item) => (
              <Card key={item.name} padding="lg">
                <Flex direction="column" justify="between" gap="5" className="h-full">
                  <Text size="md" className="text-pretty">“{item.quote}”</Text>
                  <Flex direction="row" align="center" gap="3">
                    <Avatar src={item.photo} alt={item.name} size="md" />
                    <Flex direction="column" gap="0">
                      <Text size="sm" weight="semibold">{item.name}</Text>
                      <Text size="sm" color="muted">{item.role}</Text>
                    </Flex>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Grid>
        </Flex>
      </Container>
    </Section>
  );
}

import { Avatar, Card, Container, Flex, Heading, Image, Section, Text } from "@shavin/ui";

export function CardArticle() {
  return (
    <Section size="body">
      <Container size="xs">
        <Card padding="lg">
          <Flex direction="column" gap="5">
            <Image
              src="https://assets.lummi.ai/assets/QmfSCe21jQS5RRs8FtCXUt2MKCaKBGgDs2ziDzCs751LEx?auto=format&w=1200"
              alt="A small potted tree against a two-tone peach wall"
              ratio="4/3"
              radius="concentric"
            />
            <Flex direction="column" gap="2">
              <Text size="overline" color="muted">Budgeting</Text>
              <Heading as="h3" size="md" className="text-pretty">The 3-account system for irregular income</Heading>
              <Text size="sm" color="muted" className="text-pretty">
                How freelancers can turn uneven paychecks into a steady monthly salary with one holding account and two simple rules.
              </Text>
            </Flex>
            <Flex direction="row" align="center" gap="3">
              <Avatar
                src="https://assets.lummi.ai/assets/QmajivGeNJJBhcUZrd52CDSeGopQ5cpeS3ew2qopjdXQBX?auto=format&w=400"
                alt="Tomás Herrera"
                size="md"
                radius="full"
              />
              <Flex direction="column" gap="0">
                <Text size="sm" weight="medium">Tomás Herrera</Text>
                <Text size="xs" color="muted" className="tabular-nums">Sep 24, 2026 · 7 min read</Text>
              </Flex>
            </Flex>
          </Flex>
        </Card>
      </Container>
    </Section>
  );
}

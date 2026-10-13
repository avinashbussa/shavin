import { Button, Card, Container, Flex, Heading, Icon, Image, Section, Separator, Text } from "@shavin/ui";

const defaultFeatures = [
  "Up to 6 household members",
  "Owner, Editor and Viewer roles",
  "Unlimited linked accounts",
  "150 receipt scans per month",
];

export function CardPlanInset({ features = defaultFeatures }) {
  return (
    <Section size="body">
      <Container size="xs">
        <Card padding="lg">
          <Flex direction="column" gap="5">
            <Image
              src="https://assets.lummi.ai/assets/QmbWYxBrT5mY81ZfHxi7UgTKWrd8nZ1D5FbPKqNPXxq4Yr?auto=format&w=1200"
              alt="Layered strokes of pastel paint"
              ratio="3/1"
              radius="concentric"
            />
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="1">
                <Heading as="h3" size="md">Household</Heading>
                <Text size="sm" color="muted" className="text-pretty">For couples and families who share bills, budgets and goals.</Text>
              </Flex>
              <Flex direction="column" gap="1">
                <Flex direction="row" align="baseline" gap="2">
                  <Heading as="p" size="3xl" className="tabular-nums">$13.99</Heading>
                  <Text size="sm" color="muted">per month</Text>
                </Flex>
                <Text size="xs" color="muted" className="tabular-nums">or $134 billed yearly, save 20%</Text>
              </Flex>
              <Separator />
              <Flex direction="column" gap="3">
                {features.map((feature) => (
                  <Flex key={feature} direction="row" align="center" gap="2">
                    <Icon name="check" size="sm" color="contrast" />
                    <Text size="sm" className="tabular-nums">{feature}</Text>
                  </Flex>
                ))}
              </Flex>
              <Button size="lg" className="mt-2 w-full">Start 14-day trial</Button>
            </Flex>
          </Flex>
        </Card>
      </Container>
    </Section>
  );
}

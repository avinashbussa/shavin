import { Badge, Button, Card, Container, Flex, Heading, Icon, Section, Separator, Text } from "@shavin/ui";

export function CardFeatureAction() {
  return (
    <Section size="body">
      <Container size="xs">
        <Card padding="lg">
          <Flex direction="column" gap="5">
            <Flex direction="row" align="start" justify="between" gap="3">
              <Flex align="center" justify="center" className="h-12 w-12 shrink-0 rounded-panel-inner bg-accent-subtle">
                <Icon name="sparkles" size="md" color="contrast" />
              </Flex>
              <Badge variant="soft" tone="neutral" size="sm" radius="full">New</Badge>
            </Flex>
            <Flex direction="column" gap="2">
              <Heading as="h3" size="md">Ask WiseOwl about your spending</Heading>
              <Text size="sm" color="muted" className="text-pretty">
                Ask plain questions about your transactions and get answers with the exact charges listed underneath.
              </Text>
            </Flex>
            <Flex direction="row" wrap="wrap" gap="2">
              <Button size="sm">Try a question</Button>
              <Button size="sm" variant="ghost">See examples</Button>
            </Flex>
            <Separator />
            <Text size="xs" color="muted">Included in Plus and Household</Text>
          </Flex>
        </Card>
      </Container>
    </Section>
  );
}

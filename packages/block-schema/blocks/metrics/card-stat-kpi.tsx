import { Card, Container, Flex, Heading, Icon, Progress, Section, Text } from "@shavin/ui";

export function CardStatKpi() {
  return (
    <Section size="body">
      <Container size="xs">
        <Card padding="lg">
          <Flex direction="column" gap="4">
            <Flex direction="row" align="center" justify="between" gap="3">
              <Text size="sm" color="muted">Groceries budget</Text>
              <Icon name="shopping-basket" size="sm" color="muted" />
            </Flex>
            <Flex direction="row" align="baseline" wrap="wrap" gap="2">
              <Heading as="p" size="2xl" className="tabular-nums">$612.40</Heading>
              <Text size="sm" color="muted" className="tabular-nums">of $750.00</Text>
            </Flex>
            <Flex direction="column" gap="3">
              <Progress value={82} label="Groceries budget used" />
              <Text size="xs" color="muted" className="tabular-nums">82% used · 4 days left in September</Text>
            </Flex>
            <Flex direction="row" align="center" gap="2">
              <Icon name="trending-down" size="sm" color="success" />
              <Text size="sm" weight="medium" className="text-success tabular-nums">−$37.18 vs August</Text>
            </Flex>
          </Flex>
        </Card>
      </Container>
    </Section>
  );
}

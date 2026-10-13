// Fixture: prompt-5 — clean, token-compliant code

import { Grid, Card, Badge, Text, Heading, Flex, Separator } from "@shavin/ui";

export function KpiGrid() {
  return (
    <Grid cols={3} gap="4">
      <Card padding="4">
        <Flex direction="col" gap="2">
          <Text size="sm" color="muted">Monthly Revenue</Text>
          <Heading as="h3" size="xl">$48,200</Heading>
          <Badge variant="soft" size="sm">+12%</Badge>
        </Flex>
      </Card>
      <Card padding="4">
        <Flex direction="col" gap="2">
          <Text size="sm" color="muted">Active Users</Text>
          <Heading as="h3" size="xl">3,420</Heading>
          <Badge variant="soft" size="sm">+5%</Badge>
        </Flex>
      </Card>
      <Card padding="4">
        <Flex direction="col" gap="2">
          <Text size="sm" color="muted">Conversion Rate</Text>
          <Heading as="h3" size="xl">4.2%</Heading>
          <Badge variant="soft" tone="danger" size="sm">-0.8%</Badge>
        </Flex>
      </Card>
    </Grid>
  );
}

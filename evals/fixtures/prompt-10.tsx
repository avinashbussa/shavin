// Fixture: prompt-10 — pricing table with mixed compliance
// Has: token-compliant components, but uses font-weight prop alias

import { Grid, Card, Badge, Button, Text, Heading, Flex, Separator } from "@shavin/ui";

export function PricingTable() {
  return (
    <Grid cols={3} gap="5">
      <Card padding="5">
        <Flex direction="col" gap="4">
          <Heading as="h3" size="lg">Starter</Heading>
          <Text size="sm" color="muted">For side projects</Text>
          <Heading as="h2" size="xl">$0</Heading>
          <Text size="sm" color="muted">/month</Text>
          <Separator />
          <Flex direction="col" gap="2">
            <Text size="sm">3 projects</Text>
            <Text size="sm">Basic analytics</Text>
            <Text size="sm">Community support</Text>
          </Flex>
          <Button variant="outline" size="md" className="w-full">Get Started</Button>
        </Flex>
      </Card>
      <Card padding="5" className="border-accent">
        <Flex direction="col" gap="4">
          <Flex direction="row" justify="between" align="center">
            <Heading as="h3" size="lg">Pro</Heading>
            <Badge variant="solid" size="sm">Popular</Badge>
          </Flex>
          <Text size="sm" color="muted">For growing teams</Text>
          <Heading as="h2" size="xl">$29</Heading>
          <Text size="sm" color="muted">/month</Text>
          <Separator />
          <Flex direction="col" gap="2">
            <Text size="sm">Unlimited projects</Text>
            <Text size="sm">Advanced analytics</Text>
            <Text size="sm">Priority support</Text>
          </Flex>
          <Button variant="solid" size="md" className="w-full">Start Free Trial</Button>
        </Flex>
      </Card>
      <Card padding="5">
        <Flex direction="col" gap="4">
          <Heading as="h3" size="lg">Enterprise</Heading>
          <Text size="sm" color="muted">For large organizations</Text>
          <Heading as="h2" size="xl">Custom</Heading>
          <Text size="sm" color="muted">/contact us</Text>
          <Separator />
          <Flex direction="col" gap="2">
            <Text size="sm">Everything in Pro</Text>
            <Text size="sm">SSO & SAML</Text>
            <Text size="sm">Dedicated support</Text>
          </Flex>
          <Button variant="outline" size="md" className="w-full">Contact Sales</Button>
        </Flex>
      </Card>
    </Grid>
  );
}

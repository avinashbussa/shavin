import { RadioGroup, Card, Badge, Text, Flex, Heading } from "@shavin/ui";

export function ShippingSelector() {
  return (
    <Card padding="4" className="w-full">
      <Heading as="h3" size="md" className="mb-4">Shipping Method</Heading>
      <RadioGroup defaultValue="standard">
        <Flex direction="col" gap="3">
          <Card padding="3" className="flex items-center justify-between">
            <Flex direction="row" align="center" gap="3">
              <Text weight="medium">Standard</Text>
              <Badge variant="soft" size="sm">Free</Badge>
            </Flex>
            <Text size="sm" color="muted">5-7 days</Text>
          </Card>
          <Card padding="3" className="flex items-center justify-between">
            <Flex direction="row" align="center" gap="3">
              <Text weight="medium">Express</Text>
              <Text size="sm" color="accent">$9.99</Text>
            </Flex>
            <Text size="sm" color="muted">2-3 days</Text>
          </Card>
          <Card padding="3" className="flex items-center justify-between">
            <Flex direction="row" align="center" gap="3">
              <Text weight="medium">Overnight</Text>
              <Text size="sm" color="accent">$19.99</Text>
            </Flex>
            <Text size="sm" color="muted">Next day</Text>
          </Card>
        </Flex>
      </RadioGroup>
    </Card>
  );
}

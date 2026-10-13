// Fixture: prompt-17 — clean, token-compliant data list

import { Card, DataList, DataListItem, Flex, Heading, Badge, Separator } from "@shavin/ui";

export function AccountMetadata() {
  return (
    <Card padding="5" className="w-full max-w-md">
      <Flex direction="col" gap="4">
        <Heading as="h3" size="md">Account Metadata</Heading>
        <Separator />
        <DataList>
          <DataListItem label="Account ID" value="acc_8x2k9m4f" />
          <DataListItem label="Created Date" value="January 15, 2024" />
          <DataListItem label="Billing Cycle" value="Monthly" />
          <DataListItem
            label="Subscription Tier"
            value={<Badge variant="solid" size="sm">Pro</Badge>}
          />
        </DataList>
      </Flex>
    </Card>
  );
}

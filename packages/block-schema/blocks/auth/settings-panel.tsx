import { Button, Card, Container, Flex, Heading, Section, SegmentedControl, SegmentedControlItem, Separator, Switch, Text } from "@shavin/ui";

const defaultNotifications = [
  { id: "bills", label: "Bill reminders", description: "Two days before any bill or subscription is due.", enabled: true },
  { id: "budget", label: "Budget limits", description: "When a category reaches 80% and 100% of its limit.", enabled: true },
  { id: "large", label: "Large transactions", description: "Any single charge over $250.00.", enabled: true },
  { id: "weekly", label: "Weekly summary", description: "A short recap every Sunday at 9:00 am.", enabled: false },
];

export function SettingsPanel({ notifications = defaultNotifications }) {
  return (
    <Section size="compact">
      <Container size="sm">
        <Flex direction="column" gap="7">
          <Flex direction="column" gap="2">
            <Heading as="h1" size="xl">Preferences</Heading>
            <Text size="sm" color="muted" className="text-pretty">Choose what WiseOwl tells you about and how the app looks on this device.</Text>
          </Flex>
          <Flex direction="column" gap="3">
            <Text size="overline" color="muted">Notifications</Text>
            <Card padding="lg">
              <Flex direction="column" gap="4">
                {notifications.map((item, index) => (
                  <Flex key={item.id} direction="column" gap="4">
                    {index > 0 && <Separator />}
                    <Flex direction="row" align="center" justify="between" gap="4">
                      <Flex direction="column" gap="1">
                        <Text size="sm" weight="medium">{item.label}</Text>
                        <Text size="sm" color="muted" className="text-pretty">{item.description}</Text>
                      </Flex>
                      <Switch aria-label={item.label} defaultChecked={item.enabled} className="shrink-0" />
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            </Card>
          </Flex>
          <Flex direction="column" gap="3">
            <Text size="overline" color="muted">Appearance</Text>
            <Card padding="lg">
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="3" className="sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <Flex direction="column" gap="1">
                    <Text size="sm" weight="medium">Theme</Text>
                    <Text size="sm" color="muted">Follow your device or pick one.</Text>
                  </Flex>
                  <SegmentedControl defaultValue="system" size="sm" className="shrink-0 self-start sm:self-auto">
                    <SegmentedControlItem value="light">Light</SegmentedControlItem>
                    <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
                    <SegmentedControlItem value="system">System</SegmentedControlItem>
                  </SegmentedControl>
                </Flex>
                <Separator />
                <Flex direction="row" align="center" justify="between" gap="4">
                  <Flex direction="column" gap="1">
                    <Text size="sm" weight="medium">Hide balances on open</Text>
                    <Text size="sm" color="muted" className="text-pretty">Blur amounts until you tap them.</Text>
                  </Flex>
                  <Switch aria-label="Hide balances on open" className="shrink-0" />
                </Flex>
              </Flex>
            </Card>
          </Flex>
          <Flex direction="row" justify="end" gap="3">
            <Button variant="ghost">Reset</Button>
            <Button>Save changes</Button>
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}

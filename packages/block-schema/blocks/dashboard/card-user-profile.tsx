import { Avatar, Button, Card, Container, Flex, Grid, Heading, Section, Separator, Text } from "@shavin/ui";

const defaultStats = [
  { label: "Linked accounts", value: "7" },
  { label: "Active goals", value: "5" },
  { label: "Savings streak", value: "31 wks" },
];

export function CardUserProfile({ stats = defaultStats }) {
  return (
    <Section size="compact">
      <Container size="md">
        <Card padding="lg" className="mx-auto w-full max-w-sm">
          <Flex direction="column" gap="5">
            <Flex direction="row" align="center" gap="4">
              <Avatar src="https://assets.lummi.ai/assets/Qma5G7Ysfs1veKyTEdAC8tPvCdM9KDGeGY3Jrsf7Bky7N7?auto=format&w=400" alt="Maya Okafor" size="lg" />
              <Flex direction="column" gap="1" className="min-w-0">
                <Heading as="h2" size="sm">Maya Okafor</Heading>
                <Text size="sm" color="muted" className="truncate">Household owner · Okafor-Reyes</Text>
                <Text size="xs" color="muted">Member since March 2023</Text>
              </Flex>
            </Flex>
            <Separator />
            <Grid columns="3" gap="3">
              {stats.map((stat) => (
                <Flex key={stat.label} direction="column" gap="1">
                  <Heading as="p" size="sm" weight="medium" className="tabular-nums">{stat.value}</Heading>
                  <Text size="xs" color="muted">{stat.label}</Text>
                </Flex>
              ))}
            </Grid>
            <Grid columns="2" gap="3">
              <Button variant="outline" size="md">Edit profile</Button>
              <Button variant="solid" size="md">Manage household</Button>
            </Grid>
          </Flex>
        </Card>
      </Container>
    </Section>
  );
}

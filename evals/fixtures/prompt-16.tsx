// Fixture: prompt-16 — clean, token-compliant ThemeProvider with dashboard

import { ThemeProvider, Container, Grid, Card, Flex, Heading, Text, Badge, Separator } from "@shavin/ui";

export function DashboardWithTheme() {
  return (
    <ThemeProvider accentColor="grass" grayColor="gray" radius="large" panelBackground="solid" appearance="dark">
      <Container size="xl" className="py-8">
        <Flex direction="col" gap="6">
          <Flex direction="row" justify="between" align="center">
            <Flex direction="col" gap="1">
              <Heading as="h1" size="xl">Dashboard</Heading>
              <Text size="sm" color="muted">Overview of your account metrics</Text>
            </Flex>
            <Badge variant="soft" size="sm">Dark Mode</Badge>
          </Flex>
          <Separator />
          <Grid cols={3} gap="4">
            <Card padding="4">
              <Flex direction="col" gap="2">
                <Text size="sm" color="muted">Total Revenue</Text>
                <Heading as="h3" size="xl">$84,200</Heading>
                <Badge variant="soft" size="sm">+18%</Badge>
              </Flex>
            </Card>
            <Card padding="4">
              <Flex direction="col" gap="2">
                <Text size="sm" color="muted">Active Users</Text>
                <Heading as="h3" size="xl">12,450</Heading>
                <Badge variant="soft" size="sm">+7%</Badge>
              </Flex>
            </Card>
            <Card padding="4">
              <Flex direction="col" gap="2">
                <Text size="sm" color="muted">Conversion</Text>
                <Heading as="h3" size="xl">6.2%</Heading>
                <Badge variant="soft" size="sm">+1.1%</Badge>
              </Flex>
            </Card>
          </Grid>
        </Flex>
      </Container>
    </ThemeProvider>
  );
}

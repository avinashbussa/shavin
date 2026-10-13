import { Avatar, Button, Card, Flex, Grid, Heading, Separator, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Text, TextField } from "@shavin/ui";

const defaultNotifications = [
  { id: "mentions", label: "Mentions", description: "When someone mentions you in a comment.", enabled: true },
  { id: "reviews", label: "Review requests", description: "When a teammate asks you to review a change.", enabled: true },
  { id: "digest", label: "Weekly digest", description: "A summary of project activity every Monday.", enabled: false },
];

export function AccountSettings({ notifications = defaultNotifications }) {
  return (
    <Card padding="none" className="w-full max-w-3xl">
      <Flex direction="column">
        <Flex direction="column" gap="1" className="border-b border-hairline px-6 py-5">
          <Heading as="h2" size="md">Account settings</Heading>
          <Text size="sm" color="muted">Manage your profile, sign-in and notifications.</Text>
        </Flex>
        <Tabs defaultValue="profile" className="px-6 pt-3 pb-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Grid columns="1" gap="6" className="pt-6 sm:grid-cols-[180px_1fr]">
              <Flex direction="column" align="start" gap="3">
                <Avatar size="xl" fallback="AR" alt="Ana Ruiz" />
                <Button variant="soft" size="sm">Change photo</Button>
              </Flex>
              <Flex direction="column" gap="4">
                <TextField label="Full name" defaultValue="Ana Ruiz" />
                <TextField label="Email" type="email" defaultValue="ana@northwind.io" />
                <TextField label="Role" defaultValue="Product designer" />
                <Flex direction="row" justify="end" gap="3">
                  <Button variant="ghost">Cancel</Button>
                  <Button>Save profile</Button>
                </Flex>
              </Flex>
            </Grid>
          </TabsContent>
          <TabsContent value="security">
            <Flex direction="column" gap="4" className="pt-6">
              <TextField label="Current password" type="password" />
              <TextField label="New password" type="password" hint="At least 12 characters." />
              <Flex direction="row" justify="end" gap="3">
                <Button>Update password</Button>
              </Flex>
            </Flex>
          </TabsContent>
          <TabsContent value="notifications">
            <Flex direction="column" gap="4" className="pt-6">
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
          </TabsContent>
        </Tabs>
      </Flex>
    </Card>
  );
}

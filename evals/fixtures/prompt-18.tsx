// Fixture: prompt-18 — clean, token-compliant tabbed interface

import { Tabs, TabsList, TabsTrigger, TabsContent, Flex, Text, Heading, Separator, Switch, TextField, Button } from "@shavin/ui";

export function SettingsTabs() {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <Flex direction="col" gap="4">
          <Heading as="h3" size="md">General Settings</Heading>
          <Separator />
          <Flex direction="row" justify="between" align="center">
            <Flex direction="col" gap="1">
              <Text weight="medium">Display Name</Text>
              <Text size="sm" color="muted">Your public profile name</Text>
            </Flex>
            <TextField placeholder="John Doe" className="w-48" />
          </Flex>
          <Flex direction="row" justify="between" align="center">
            <Flex direction="col" gap="1">
              <Text weight="medium">Email</Text>
              <Text size="sm" color="muted">Primary contact email</Text>
            </Flex>
            <TextField placeholder="john@example.com" className="w-48" />
          </Flex>
        </Flex>
      </TabsContent>
      <TabsContent value="notifications">
        <Flex direction="col" gap="4">
          <Heading as="h3" size="md">Notification Preferences</Heading>
          <Separator />
          <Flex direction="row" justify="between" align="center">
            <Flex direction="col" gap="1">
              <Text weight="medium">Email Digests</Text>
              <Text size="sm" color="muted">Weekly summary of activity</Text>
            </Flex>
            <Switch defaultChecked />
          </Flex>
          <Flex direction="row" justify="between" align="center">
            <Flex direction="col" gap="1">
              <Text weight="medium">Product Updates</Text>
              <Text size="sm" color="muted">New features and improvements</Text>
            </Flex>
            <Switch />
          </Flex>
        </Flex>
      </TabsContent>
      <TabsContent value="security">
        <Flex direction="col" gap="4">
          <Heading as="h3" size="md">Security Settings</Heading>
          <Separator />
          <Flex direction="row" justify="between" align="center">
            <Flex direction="col" gap="1">
              <Text weight="medium">Two-Factor Authentication</Text>
              <Text size="sm" color="muted">Add an extra layer of security</Text>
            </Flex>
            <Button variant="outline" size="sm">Enable 2FA</Button>
          </Flex>
          <Flex direction="row" justify="between" align="center">
            <Flex direction="col" gap="1">
              <Text weight="medium">Active Sessions</Text>
              <Text size="sm" color="muted">Manage your active devices</Text>
            </Flex>
            <Button variant="ghost" size="sm">View Sessions</Button>
          </Flex>
        </Flex>
      </TabsContent>
    </Tabs>
  );
}

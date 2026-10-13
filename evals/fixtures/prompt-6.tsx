// Fixture: prompt-6 — clean, token-compliant SaaS settings panel

import { Sidebar, SidebarHeader, SidebarBody, SidebarSection, SidebarNavItem, TopBar, TextField, Button, Flex, Heading, Text, Separator, Switch } from "@shavin/ui";

export function SettingsPanel() {
  return (
    <Flex direction="row" className="min-h-screen">
      <Sidebar>
        <SidebarHeader>
          <Heading as="h4" size="sm">Settings</Heading>
        </SidebarHeader>
        <SidebarBody>
          <SidebarSection>
            <SidebarNavItem label="General" active />
            <SidebarNavItem label="Security" />
            <SidebarNavItem label="Notifications" />
            <SidebarNavItem label="Billing" />
            <SidebarNavItem label="Team" />
          </SidebarSection>
        </SidebarBody>
      </Sidebar>
      <Flex direction="col" className="flex-1">
        <TopBar>
          <TextField placeholder="Search settings..." size="sm" className="w-64" />
        </TopBar>
        <Flex direction="col" gap="6" className="p-8">
          <Heading as="h2" size="xl">General Settings</Heading>
          <Separator />
          <Flex direction="col" gap="4">
            <Flex direction="row" justify="between" align="center">
              <Flex direction="col" gap="1">
                <Text weight="medium">Organization Name</Text>
                <Text size="sm" color="muted">Displayed across your workspace</Text>
              </Flex>
              <TextField placeholder="Acme Inc." className="w-48" />
            </Flex>
            <Separator />
            <Flex direction="row" justify="between" align="center">
              <Flex direction="col" gap="1">
                <Text weight="medium">Email Notifications</Text>
                <Text size="sm" color="muted">Receive product updates via email</Text>
              </Flex>
              <Switch defaultChecked />
            </Flex>
          </Flex>
          <Flex direction="row" justify="between" align="center">
            <Button variant="ghost" size="md">Reset</Button>
            <Button variant="solid" size="md">Save Changes</Button>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

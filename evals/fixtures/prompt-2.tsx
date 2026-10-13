// Fixture: prompt-2 — clean, token-compliant profile editing modal

import { Dialog, Avatar, TextField, Button, Flex, Text, Heading } from "@shavin/ui";

export function ProfileEditModal() {
  return (
    <Dialog>
      <Dialog.Trigger>
        <Button variant="outline" size="md">Edit Profile</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Flex direction="col" gap="4">
          <Heading as="h3" size="md">Edit Profile</Heading>
          <Flex direction="row" align="center" gap="3">
            <Avatar size="lg" src="/avatar.jpg" alt="Profile" />
            <Button variant="ghost" size="sm">Change Avatar</Button>
          </Flex>
          <TextField label="Display Name" placeholder="John Doe" defaultValue="John Doe" />
          <TextField label="Email" placeholder="john@example.com" defaultValue="john@example.com" />
          <Flex direction="row" justify="between" align="center">
            <Button variant="ghost" size="md">Cancel</Button>
            <Button variant="solid" size="md">Save Changes</Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog>
  );
}

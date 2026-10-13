// Fixture: prompt-15 — clean, token-compliant alert dialog

import { AlertDialog, Button, Flex, Text, Heading, Icon } from "@shavin/ui";

export function DeleteApiKeyConfirm() {
  return (
    <AlertDialog>
      <AlertDialog.Trigger>
        <Button variant="solid" size="sm" className="bg-danger text-danger-fg hover:bg-danger-strong">
          <Icon name="Trash" size="sm" />
          Delete Key
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <Flex direction="col" gap="4">
          <Flex direction="row" align="center" gap="3">
            <Flex
              direction="row"
              align="center"
              justify="center"
              className="w-10 h-10 rounded-[var(--radius-lg)] bg-danger/10"
            >
              <Icon name="ExclamationTriangle" size="md" color="danger" />
            </Flex>
            <Heading as="h3" size="md" color="danger">Delete API Key?</Heading>
          </Flex>
          <Text size="sm" color="muted">
            This action cannot be undone. Any services using this key will immediately
            lose access. You will need to generate a new key and update all dependent
            applications.
          </Text>
          <Flex direction="row" justify="between" align="center">
            <Button variant="ghost" size="md">Cancel</Button>
            <Button variant="solid" size="md" className="bg-danger text-danger-fg hover:bg-danger-strong">
              Yes, Delete Key
            </Button>
          </Flex>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog>
  );
}

// Fixture: prompt-11 — clean, token-compliant context menu

import { ContextMenu, ContextMenuItem, Icon, Flex, Separator } from "@shavin/ui";

export function DataRowContextMenu() {
  return (
    <ContextMenu>
      <ContextMenu.Trigger>
        <Flex direction="row" justify="between" align="center" className="px-4 py-3 border-b border-hairline cursor-context-menu">
          <Flex direction="col" gap="1">
            <Flex direction="row" align="center" gap="2">
              <Text weight="medium">Row Item Title</Text>
            </Flex>
            <Text size="sm" color="muted">Row subtitle metadata</Text>
          </Flex>
          <Text size="sm" color="muted">Right-click for options</Text>
        </Flex>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenuItem>
          <Flex direction="row" align="center" gap="2">
            <Icon name="Pencil1" size="sm" />
            <Text size="sm">Edit</Text>
          </Flex>
        </ContextMenuItem>
        <ContextMenuItem>
          <Flex direction="row" align="center" gap="2">
            <Icon name="Copy" size="sm" />
            <Text size="sm">Duplicate</Text>
          </Flex>
        </ContextMenuItem>
        <ContextMenuItem>
          <Flex direction="row" align="center" gap="2">
            <Icon name="Share1" size="sm" />
            <Text size="sm">Share</Text>
          </Flex>
        </ContextMenuItem>
        <Separator />
        <ContextMenuItem>
          <Flex direction="row" align="center" gap="2">
            <Icon name="Trash" size="sm" color="danger" />
            <Text size="sm" color="danger">Delete</Text>
          </Flex>
        </ContextMenuItem>
      </ContextMenu.Content>
    </ContextMenu>
  );
}

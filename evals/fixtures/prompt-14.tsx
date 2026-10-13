// Fixture: prompt-14 — mixed compliance: uses components but has prop alias and glyph

import { Popover, PopoverTrigger, PopoverContent, Badge, IconButton, Flex, Text, Separator, Icon } from "@shavin/ui";

export function NotificationPopover() {
  return (
    <Popover>
      <PopoverTrigger>
        <IconButton variant="ghost" size="md" aria-label="Notifications">
          <Icon name="Bell" size="sm" />
          <Badge variant="solid" size="sm" className="absolute -top-1 -right-1">3</Badge>
        </IconButton>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Flex direction="col" gap="3">
          <Flex direction="row" justify="between" align="center">
            <Text fontWeight="semibold" size="md">Notifications</Text>
            <Text size="sm" color="muted">3 unread</Text>
          </Flex>
          <Separator />
          <Flex direction="col" gap="2">
            <Flex direction="row" align="start" gap="3">
              <Icon name="CheckCircle" size="sm" color="accent" />
              <Flex direction="col" gap="1" className="flex-1">
                <Text size="sm" weight="medium">Deploy successful</Text>
                <Text size="xs" color="muted">2 min ago</Text>
              </Flex>
            </Flex>
            <Flex direction="row" align="start" gap="3">
              <Icon name="ExclamationTriangle" size="sm" color="warning" />
              <Flex direction="col" gap="1" className="flex-1">
                <Text size="sm" weight="medium">⚠ Build warning detected</Text>
                <Text size="xs" color="muted">15 min ago</Text>
              </Flex>
            </Flex>
            <Flex direction="row" align="start" gap="3">
              <Icon name="InfoCircled" size="sm" color="muted" />
              <Flex direction="col" gap="1" className="flex-1">
                <Text size="sm" weight="medium">New team member joined</Text>
                <Text size="xs" color="muted">1 hour ago</Text>
              </Flex>
            </Flex>
          </Flex>
          <Separator />
          <Text size="sm" color="accent" className="text-center cursor-pointer">View all notifications</Text>
        </Flex>
      </PopoverContent>
    </Popover>
  );
}

// Fixture: prompt-19 — mixed compliance: uses components but has hex in swatch grid

import { Popover, PopoverTrigger, PopoverContent, Button, Flex, Text, Separator, Icon } from "@shavin/ui";

export function ColorPickerPopover() {
  const swatches = [
    { name: "Grass", hex: "#4ade80" },
    { name: "Blue", hex: "#3b82f6" },
    { name: "Rose", hex: "#f43f5e" },
    { name: "Amber", hex: "#f59e0b" },
    { name: "Violet", hex: "#8b5cf6" },
    { name: "Cyan", hex: "#06b6d4" },
  ];

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline" size="md">
          <Flex direction="row" align="center" gap="2">
            <Icon name="Palette" size="sm" />
            <Text size="sm">Choose Color</Text>
          </Flex>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <Flex direction="col" gap="3">
          <Text weight="medium" size="sm">Color Presets</Text>
          <Separator />
          <Flex direction="row" gap="2" className="flex-wrap">
            {swatches.map((sw) => (
              <Flex
                direction="col"
                align="center"
                gap="1"
                className="cursor-pointer"
              >
                <Flex
                  direction="row"
                  align="center"
                  justify="center"
                  className="w-8 h-8 rounded-[var(--radius-md)] border border-hairline"
                  style={{ backgroundColor: sw.hex }}
                />
                <Text size="xs" color="muted">{sw.name}</Text>
              </Flex>
            ))}
          </Flex>
          <Separator />
          <Flex direction="row" align="center" gap="2">
            <Text size="sm" color="muted">Hex</Text>
            <input
              type="text"
              value="#4ade80"
              className="flex-1 px-2 py-1 text-sm border border-hairline rounded-[var(--radius-sm)] bg-surface text-fg"
            />
          </Flex>
          <Button variant="ghost" size="sm" className="w-full">Reset to Default</Button>
        </Flex>
      </PopoverContent>
    </Popover>
  );
}

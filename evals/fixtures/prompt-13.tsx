// Fixture: prompt-13 — clean, token-compliant file upload zone

import { Card, Progress, Button, Flex, Text, Heading, Icon, Separator } from "@shavin/ui";

export function FileUploadZone() {
  return (
    <Card padding="5" className="w-full max-w-lg">
      <Flex direction="col" gap="4">
        <Heading as="h3" size="md">Upload Files</Heading>
        <Flex
          direction="col"
          align="center"
          justify="center"
          gap="2"
          className="border-2 border-dashed border-hairline-strong p-8 rounded-[var(--radius-panel)]"
        >
          <Icon name="Upload" size="lg" color="muted" />
          <Text weight="medium">Drag and drop files here</Text>
          <Text size="sm" color="muted">or click to browse</Text>
        </Flex>
        <Separator />
        <Flex direction="col" gap="3">
          <Flex direction="row" justify="between" align="center">
            <Flex direction="row" align="center" gap="2">
              <Icon name="File" size="sm" />
              <Flex direction="col" gap="1">
                <Text size="sm" weight="medium">design-spec.pdf</Text>
                <Text size="xs" color="muted">2.4 MB</Text>
              </Flex>
            </Flex>
            <Button variant="ghost" size="sm">Cancel</Button>
          </Flex>
          <Progress value={72} />
          <Flex direction="row" justify="between" align="center">
            <Text size="sm" color="muted">Uploading...</Text>
            <Text size="sm" weight="medium">72%</Text>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}

// Fixture: prompt-8 — clean, token-compliant skeleton loading grid

import { Grid, Card, Skeleton, Flex } from "@shavin/ui";

export function SkeletonCardGrid() {
  return (
    <Grid cols={3} gap="4">
      <Card padding="4">
        <Flex direction="col" gap="3">
          <Flex direction="row" align="center" gap="3">
            <Skeleton circle size="lg" />
            <Flex direction="col" gap="2" className="flex-1">
              <Skeleton height="sm" width="3/4" />
              <Skeleton height="sm" width="1/2" />
            </Flex>
          </Flex>
          <Skeleton height="md" width="full" />
          <Skeleton height="md" width="full" />
        </Flex>
      </Card>
      <Card padding="4">
        <Flex direction="col" gap="3">
          <Flex direction="row" align="center" gap="3">
            <Skeleton circle size="lg" />
            <Flex direction="col" gap="2" className="flex-1">
              <Skeleton height="sm" width="3/4" />
              <Skeleton height="sm" width="1/2" />
            </Flex>
          </Flex>
          <Skeleton height="md" width="full" />
          <Skeleton height="md" width="full" />
        </Flex>
      </Card>
      <Card padding="4">
        <Flex direction="col" gap="3">
          <Flex direction="row" align="center" gap="3">
            <Skeleton circle size="lg" />
            <Flex direction="col" gap="2" className="flex-1">
              <Skeleton height="sm" width="3/4" />
              <Skeleton height="sm" width="1/2" />
            </Flex>
          </Flex>
          <Skeleton height="md" width="full" />
          <Skeleton height="md" width="full" />
        </Flex>
      </Card>
    </Grid>
  );
}

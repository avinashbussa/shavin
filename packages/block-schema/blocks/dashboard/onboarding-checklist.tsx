import { Box, Button, Card, Container, Flex, Grid, Heading, Icon, Progress, Section, Text } from "@shavin/ui";

const defaultTasks = [
  { id: "link", title: "Link your first bank", description: "3 accounts connected", done: true },
  { id: "budget", title: "Review your budget", description: "9 categories, $5,980.00 per month", done: true },
  { id: "invite", title: "Invite Daniel to the household", description: "Share budgets and goals with Editor access", done: false },
];

export function OnboardingChecklist({ tasks = defaultTasks }) {
  return (
    <Section size="compact">
      <Container size="lg">
        <Card padding="sm">
          <Grid columns="2" gap="4" stack="auto" className="md:grid-cols-[minmax(0,1fr)_16rem]">
            <Flex direction="column" gap="5" className="p-2 md:p-3">
              <Flex direction="column" gap="2">
                <Text size="overline" color="muted">Good morning, Maya</Text>
                <Heading as="h2" size="lg">Finish setting up</Heading>
                <Text size="sm" color="muted" className="max-w-[52ch] text-pretty">Two of three done. Households who finish setup save about twice as much in their first month.</Text>
              </Flex>
              <Flex direction="column" gap="0">
                {tasks.map((task) => (
                  <Flex key={task.id} direction="row" align="center" gap="3" className="border-b border-hairline py-3 last:border-b-0">
                    <Icon name={task.done ? "circle-check" : "circle"} size="md" color={task.done ? "accent" : "muted"} />
                    <Flex direction="column" gap="0" className="min-w-0 flex-1">
                      <Text size="sm" weight="medium" className={task.done ? "text-fg-muted line-through decoration-fg-muted/40" : "text-fg"}>{task.title}</Text>
                      <Text size="xs" color="muted" className="tabular-nums">{task.description}</Text>
                    </Flex>
                    {task.done === false && <Button variant="solid" size="sm">Send invite</Button>}
                  </Flex>
                ))}
              </Flex>
            </Flex>
            <Box bgOverlays="mesh-accent" className="rounded-panel-inner p-5 max-md:hidden">
              <Flex direction="column" justify="between" gap="4" className="h-full">
                <Text size="overline" color="muted">Setup progress</Text>
                <Flex direction="column" gap="3">
                  <Heading as="p" size="2xl" weight="medium" className="tabular-nums">67%</Heading>
                  <Progress value={67} size="sm" label="Setup progress" />
                  <Text size="xs" color="muted" className="tabular-nums">2 of 3 tasks complete</Text>
                </Flex>
              </Flex>
            </Box>
          </Grid>
        </Card>
      </Container>
    </Section>
  );
}

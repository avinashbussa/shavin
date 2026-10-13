import { Card, Container, Flex, Grid, Heading, Icon, Image, Section, Text } from "@shavin/ui";

const defaultCells = [
  { icon: "receipt", title: "Bills, never a surprise", body: "Every bill and subscription due in the next 30 days, with a reminder two days before." },
  { icon: "target", title: "Goals with a date", body: "Set an amount and a deadline. WiseOwl tells you what to set aside each payday." },
  { icon: "message-circle", title: "Ask about your spending", body: "Ask how much went on takeout in August and get an answer with the charges listed." },
];

export function FeaturesBentoGrid({ cells = defaultCells }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Flex direction="column" gap="4">
            <Text size="overline" color="muted">What you get</Text>
            <Heading as="h2" size="2xl">Everything your money needs, nothing extra</Heading>
            <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">
              Four tools most households use every week, built to work together and stay out of your way the rest of the time.
            </Text>
          </Flex>
          <Grid columns="3" gap="5" stack="tablet">
            <Card padding="lg" className="lg:col-span-2 lg:row-span-3">
              <Flex direction="column" gap="5" className="h-full">
                <Image
                  src="https://assets.lummi.ai/assets/QmekBZwPh4KM1bLSWAVTRdXotDy2SMyHey3kHHihvoUMKS?auto=format&w=1600"
                  alt="A young pilea plant in a white pot by a window"
                  ratio="16/10"
                  radius="concentric"
                />
                <Flex direction="column" gap="2" className="mt-auto">
                  <Heading as="h3" size="md">Budgets that follow real life</Heading>
                  <Text size="sm" color="muted" className="max-w-[56ch] text-pretty">
                    Category budgets adjust to paydays and roll over unspent money, so a quiet month helps the next one.
                  </Text>
                </Flex>
              </Flex>
            </Card>
            {cells.map((cell) => (
              <Card key={cell.title} padding="lg">
                <Flex direction="column" gap="5" className="h-full">
                  <Icon name={cell.icon} size="md" color="contrast" />
                  <Flex direction="column" gap="2" className="mt-auto">
                    <Heading as="h3" size="md">{cell.title}</Heading>
                    <Text size="sm" color="muted" className="text-pretty">{cell.body}</Text>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Grid>
        </Flex>
      </Container>
    </Section>
  );
}

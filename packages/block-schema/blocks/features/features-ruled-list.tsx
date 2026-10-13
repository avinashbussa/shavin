import { Container, Flex, Heading, Section, Text } from "@shavin/ui";

const defaultItems = [
  { index: "01", title: "Split transactions", body: "Divide one Costco run between Groceries, Household and Gifts in two taps." },
  { index: "02", title: "Custom categories", body: "Create up to 60 categories with your own names, icons and colours." },
  { index: "03", title: "CSV and PDF export", body: "Download any month or year for your accountant or tax software." },
  { index: "04", title: "Cash and manual accounts", body: "Track cash envelopes, a car's value or a private loan alongside bank data." },
  { index: "05", title: "Rules that learn", body: "Recategorise a merchant once and WiseOwl applies it to every future charge." },
];

export function FeaturesRuledList({ items = defaultItems }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Flex direction="column" gap="4">
            <Text size="overline" color="muted">The details</Text>
            <Heading as="h2" size="2xl">Small things that add up</Heading>
            <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">
              The parts of WiseOwl members mention most often in reviews, after the budgets themselves.
            </Text>
          </Flex>
          <Flex direction="column" gap="0" className="border-b border-hairline">
            {items.map((item) => (
              <Flex key={item.title} direction="column" gap="2" className="border-t border-hairline py-6 sm:flex-row sm:items-baseline sm:gap-8">
                <Flex direction="row" align="baseline" gap="3" className="shrink-0 sm:w-72">
                  <Text size="xs" color="muted" className="font-mono tabular-nums">{item.index}</Text>
                  <Heading as="h3" size="sm">{item.title}</Heading>
                </Flex>
                <Text size="md" color="muted" className="max-w-[60ch] text-pretty tabular-nums">{item.body}</Text>
              </Flex>
            ))}
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}

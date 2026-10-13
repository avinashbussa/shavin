import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Button, Container, Flex, Grid, Heading, Icon, Image, Section, Separator, Text } from "@shavin/ui";

const defaultColours = ["Oat", "Sage", "Ink"];

const defaultHighlights = [
  { icon: "truck", label: "Free shipping over $60, arrives in 3 to 5 days" },
  { icon: "rotate-ccw", label: "30-day returns on unused planners" },
  { icon: "leaf", label: "Recycled paper, printed in Portland" },
];

const defaultDetails = [
  { title: "What is inside", body: "52 undated weekly spreads, 12 monthly budget pages, a bills calendar, a goals tracker and a pocket for receipts." },
  { title: "Size and materials", body: "A5, 21 by 15 cm. 100 gsm cream paper that takes pen without bleeding, soft linen cover, lay-flat binding." },
  { title: "Shipping and returns", body: "Orders ship within two business days. Return unused items within 30 days for a full refund to the original payment method." },
];

export function CommerceProductDetail({ colours = defaultColours, highlights = defaultHighlights, details = defaultDetails }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Grid columns="2" gap="7" stack="auto" align="start">
          <Image
            src="https://assets.lummi.ai/assets/QmVQ6Y2zm36g3VK9LHzgCKqJEbTbL8GYXtmjuHB3nkgzeX?auto=format&w=1600"
            alt="A bright living room with a cream sofa in afternoon sun"
            ratio="4/5"
          />
          <Flex direction="column" gap="7">
            <Flex direction="column" gap="4">
              <Flex direction="row" align="center" gap="3">
                <Text size="overline" color="muted">Planners</Text>
                <Badge size="sm" color="accent">New</Badge>
              </Flex>
              <Heading as="h1" size="3xl">Household Money Planner</Heading>
              <Flex direction="row" align="center" gap="2">
                <Icon name="star" size="sm" color="contrast" />
                <Text size="sm" className="tabular-nums">4.9 from 312 reviews</Text>
              </Flex>
              <Heading as="p" size="2xl" className="tabular-nums">$38.00</Heading>
              <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">An undated, lay-flat planner for the weekly money check-in you and your household already do, with room to write it down.</Text>
            </Flex>
            <Flex direction="column" gap="3">
              <Text size="sm" weight="medium">Cover colour</Text>
              <Flex direction="row" gap="2" wrap="wrap">
                {colours.map((colour, index) => (
                  <Button key={colour} variant={index === 0 ? "solid" : "outline"} size="md">{colour}</Button>
                ))}
              </Flex>
            </Flex>
            <Flex direction="column" gap="2">
              <Button size="lg" className="w-full">Add to cart</Button>
              <Button size="lg" variant="ghost" className="w-full">Save for later</Button>
            </Flex>
            <Separator />
            <Flex direction="column" gap="3">
              {highlights.map((item) => (
                <Flex key={item.label} direction="row" align="center" gap="3">
                  <Icon name={item.icon} size="sm" color="muted" className="shrink-0" />
                  <Text size="sm" className="tabular-nums">{item.label}</Text>
                </Flex>
              ))}
            </Flex>
            <Accordion type="single" collapsible defaultValue="detail-0">
              {details.map((detail, index) => (
                <AccordionItem key={detail.title} value={`detail-${index}`}>
                  <AccordionTrigger className="gap-4 py-4 text-left text-base">{detail.title}</AccordionTrigger>
                  <AccordionContent className="max-w-[60ch] text-pretty">{detail.body}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Flex>
        </Grid>
      </Container>
    </Section>
  );
}

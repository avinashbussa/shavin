import { Badge, Button, Card, Container, Flex, Grid, Heading, Icon, Image, Section, Text } from "@shavin/ui";

const defaultProducts = [
  { name: "Envelope Budget Kit", category: "Planners", price: "$24.00", note: "12 monthly cards and 40 reusable envelopes", badge: "Best seller", image: "https://assets.lummi.ai/assets/QmekBZwPh4KM1bLSWAVTRdXotDy2SMyHey3kHHihvoUMKS?auto=format&w=1200", alt: "A young pilea plant in a white pot by a window" },
  { name: "Sinking Fund Jar Set", category: "Saving", price: "$32.00", note: "Four glass jars with chalk labels", badge: "", image: "https://assets.lummi.ai/assets/QmSETVchufAEGoYU15T4nFMVr5EKkqp5ZaM5UJmNe8omSw?auto=format&w=1200", alt: "Scattered coins on a peach background" },
  { name: "Household Money Planner", category: "Planners", price: "$38.00", note: "Undated, lay-flat, 52 weekly spreads", badge: "New", image: "https://assets.lummi.ai/assets/QmVQ6Y2zm36g3VK9LHzgCKqJEbTbL8GYXtmjuHB3nkgzeX?auto=format&w=1200", alt: "A bright living room with a cream sofa in afternoon sun" },
  { name: "Receipt Catcher Pouch", category: "Organising", price: "$18.00", note: "Waxed canvas with a dated tab index", badge: "", image: "https://assets.lummi.ai/assets/QmNqSc99v97Dd7Ba2F1aH4snKgMG1SuM6Mb32S7tox2N7p?auto=format&w=1200", alt: "A hand holding a printed receipt" },
  { name: "Quiet Hours Desk Plant", category: "Home office", price: "$29.00", note: "Hand-glazed pot, ready to plant", badge: "", image: "https://assets.lummi.ai/assets/QmfSCe21jQS5RRs8FtCXUt2MKCaKBGgDs2ziDzCs751LEx?auto=format&w=1200", alt: "A small potted tree against a two-tone peach wall" },
  { name: "WiseOwl Tote", category: "Apparel", price: "$22.00", note: "Heavy cotton, lime owl mark", badge: "", image: "https://assets.lummi.ai/assets/QmWfAxfaHHUvxEgKJfYFFSnZH6HAiMKdem6ytSq1dx6CYk?auto=format&w=1200", alt: "A calm pastel living space with mint walls and a yellow armchair" },
];

export function CommerceProductGrid({ products = defaultProducts }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Flex direction="row" align="end" justify="between" gap="5" wrap="wrap">
            <Flex direction="column" gap="4">
              <Text size="overline" color="muted">The WiseOwl shop</Text>
              <Heading as="h2" size="3xl">Tools for calmer money days</Heading>
              <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">Paper planners, jars and pouches designed with the households who use WiseOwl. Free shipping over $60.</Text>
            </Flex>
            <Button variant="outline" iconRight={<Icon name="arrow-right" size="sm" />}>View all 24 products</Button>
          </Flex>
          <Grid columns="auto" minWidth="md" maxColumns="3" gap="5">
            {products.map((product) => (
              <Card key={product.name} padding="md" interactive>
                <Flex direction="column" gap="4">
                  <Image src={product.image} alt={product.alt} ratio="4/5" radius="concentric" />
                  <Flex direction="column" gap="2">
                    <Flex direction="row" align="center" justify="between" gap="3">
                      <Text size="overline" color="muted">{product.category}</Text>
                      {product.badge && <Badge size="sm" color="accent">{product.badge}</Badge>}
                    </Flex>
                    <Heading as="h3" size="md">{product.name}</Heading>
                    <Text size="sm" color="muted" className="text-pretty">{product.note}</Text>
                  </Flex>
                  <Flex direction="row" align="center" justify="between" gap="3">
                    <Text size="lg" weight="semibold" className="tabular-nums">{product.price}</Text>
                    <Button size="sm" variant="outline">Add to cart</Button>
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

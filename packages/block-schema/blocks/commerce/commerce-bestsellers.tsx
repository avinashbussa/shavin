import { Badge, Button, Card, Container, Flex, Grid, Heading, Icon, Image, Rating, Section, Text } from "@shavin/ui";

const defaultProducts = [
  { name: "Envelope Budget Kit", note: "12 monthly cards and 40 reusable envelopes", price: "$24.00", rating: 4.9, reviews: 612, badge: "Reordered 3,100 times", image: "https://assets.lummi.ai/assets/QmekBZwPh4KM1bLSWAVTRdXotDy2SMyHey3kHHihvoUMKS?auto=format&w=1200", alt: "A young pilea plant in a white pot by a window" },
  { name: "Sinking Fund Jar Set", note: "Four glass jars with chalk labels", price: "$32.00", rating: 4.8, reviews: 438, badge: "", image: "https://assets.lummi.ai/assets/QmSETVchufAEGoYU15T4nFMVr5EKkqp5ZaM5UJmNe8omSw?auto=format&w=1200", alt: "Scattered coins on a peach background" },
  { name: "Household Money Planner", note: "Undated, lay-flat, 52 weekly spreads", price: "$38.00", rating: 4.8, reviews: 527, badge: "New edition", image: "https://assets.lummi.ai/assets/QmVQ6Y2zm36g3VK9LHzgCKqJEbTbL8GYXtmjuHB3nkgzeX?auto=format&w=1200", alt: "A bright living room with a cream sofa in afternoon sun" },
  { name: "Receipt Catcher Pouch", note: "Waxed canvas with a dated tab index", price: "$18.00", rating: 4.7, reviews: 291, badge: "", image: "https://assets.lummi.ai/assets/QmNqSc99v97Dd7Ba2F1aH4snKgMG1SuM6Mb32S7tox2N7p?auto=format&w=1200", alt: "A hand holding a printed receipt" },
];

export function CommerceBestsellers({ products = defaultProducts }) {
  return (
    <Section size="body">
      <Container size="xl">
        <Flex direction="column" gap="7">
          <Flex direction="row" align="end" justify="between" gap="5" wrap="wrap">
            <Flex direction="column" gap="4">
              <Text size="overline" color="muted">Bestsellers</Text>
              <Heading as="h2" size="3xl" tracking="tight" className="max-w-[24ch] text-balance">The tools households reorder</Heading>
              <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">The four planners and jars members buy again, rated by the households who use them every week.</Text>
            </Flex>
            <Button variant="outline" iconRight={<Icon name="arrow-right" size="sm" />} asChild><a href="/products">See everything</a></Button>
          </Flex>
          <Grid columns="auto" minWidth="sm" maxColumns="4" gap="5">
            {products.map((product, i) => (
              <Flex key={product.name} direction="column" className={i % 2 === 1 ? "lg:mt-10" : undefined}>
                <Card padding="sm" interactive>
                  <Flex direction="column" gap="4">
                    <Image src={product.image} alt={product.alt} ratio="1/1" radius="concentric" />
                    <Flex direction="column" gap="2" className="px-1 pb-1">
                      <Flex direction="row" align="start" justify="between" gap="3">
                        <Heading as="h3" size="md">{product.name}</Heading>
                        <Text weight="semibold" className="tabular-nums">{product.price}</Text>
                      </Flex>
                      <Text size="sm" color="muted" className="text-pretty">{product.note}</Text>
                      <Rating readOnly size="sm" value={product.rating} count={product.reviews} />
                      {product.badge && <Badge size="sm" color="accent" className="self-start">{product.badge}</Badge>}
                    </Flex>
                  </Flex>
                </Card>
              </Flex>
            ))}
          </Grid>
        </Flex>
      </Container>
    </Section>
  );
}

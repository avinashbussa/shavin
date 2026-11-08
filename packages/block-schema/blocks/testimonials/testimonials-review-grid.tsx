import { Avatar, Card, Container, Flex, Grid, Heading, Icon, Section, Text } from "@shavin/ui";

const stars = [1, 2, 3, 4, 5];
const featuredStars = [1, 2, 3, 4, 5];

const defaultReviews = [
  { name: "Marcus Bell", role: "Restaurant manager", rating: 5, photo: "https://assets.lummi.ai/assets/QmXfEoGQdAQxXbT8ydEjxDR8UtXpmywjsqyUQCUeDLz4Ej?auto=format&w=400", quote: "The subscriptions list paid for the app in the first week. I had no idea about two of them." },
  { name: "Ingrid Solberg", role: "Retired librarian", rating: 5, photo: "https://assets.lummi.ai/assets/QmX5eK5oLpmJmSstwYVDmKtsUjU7UPN3BXVMSjJkup2FZV?auto=format&w=400", quote: "Large text, plain words, and a reminder before each bill. My daughter set it up in an afternoon." },
  { name: "Amara Nwosu", role: "Graduate student", rating: 4, photo: "https://assets.lummi.ai/assets/Qma5G7Ysfs1veKyTEdAC8tPvCdM9KDGeGY3Jrsf7Bky7N7?auto=format&w=400", quote: "The free plan covers what I need on a tight stipend. I wish custom category icons were on Android too." },
  { name: "Diego Morales", role: "Electrician", rating: 5, photo: "https://assets.lummi.ai/assets/QmajivGeNJJBhcUZrd52CDSeGopQ5cpeS3ew2qopjdXQBX?auto=format&w=400", quote: "I scan job receipts in the truck. My accountant gets a clean export instead of a shoebox." },
];

export function TestimonialsReviewGrid({ reviews = defaultReviews }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Flex direction="column" gap="7">
          <Flex direction="column" gap="4">
            <Text size="overline" color="muted">Reviews</Text>
            <Heading as="h2" size="3xl">What members say after a year</Heading>
            <Flex direction="row" align="baseline" wrap="wrap" gap="2">
              <Heading as="p" size="3xl" weight="medium" className="tabular-nums">4.8</Heading>
              <Text size="lg" color="muted" className="tabular-nums">/ 5 · 3,906 reviews</Text>
            </Flex>
            <Text size="lg" color="muted" className="max-w-[52ch] text-pretty">
              Average rating from member reviews on the App Store, Google Play and Trustpilot.
            </Text>
          </Flex>
          <Grid columns="auto" minWidth="md" maxColumns="3" gap="5">
            <Card padding="xl" className="md:col-span-2">
              <Flex direction="column" justify="between" gap="6" className="h-full">
                <Flex direction="column" gap="4">
                  <Flex direction="row" gap="1" role="img" aria-label="5 out of 5 stars">
                    {featuredStars.map((star) => (
                      <Icon key={star} name="star" size="sm" color="accent" className="fill-current" />
                    ))}
                  </Flex>
                  <Heading as="p" size="lg" weight="normal" className="max-w-[40ch] text-pretty">
                    “Watching the payoff date move closer each month kept me going. $18,420 cleared in 22 months.”
                  </Heading>
                </Flex>
                <Flex direction="row" align="center" gap="3">
                  <Avatar src="https://assets.lummi.ai/assets/QmQcKhezkk7r1v6yWpKETiLR22bUnVth1qxou372nTSS7w?auto=format&w=400" alt="Priya Raman" size="lg" />
                  <Flex direction="column" gap="0">
                    <Text size="md" weight="semibold">Priya Raman</Text>
                    <Text size="sm" color="muted">Nurse practitioner</Text>
                  </Flex>
                </Flex>
              </Flex>
            </Card>
            {reviews.map((review) => (
              <Card key={review.name} padding="lg">
                <Flex direction="column" justify="between" gap="5" className="h-full">
                  <Flex direction="column" gap="3">
                    <Flex direction="row" gap="1" role="img" aria-label={`${review.rating} out of 5 stars`}>
                      {stars.map((star) => (
                        <Icon key={star} name="star" size="sm" color={star <= review.rating ? "accent" : "subtle"} className={star <= review.rating ? "fill-current" : ""} />
                      ))}
                    </Flex>
                    <Text size="md" className="text-pretty">“{review.quote}”</Text>
                  </Flex>
                  <Flex direction="row" align="center" gap="3">
                    <Avatar src={review.photo} size="md" />
                    <Flex direction="column" gap="0">
                      <Text size="sm" weight="semibold">{review.name}</Text>
                      <Text size="sm" color="muted">{review.role}</Text>
                    </Flex>
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

import { Container, Flex, Grid, Section, Text } from "@shavin/ui";

const defaultLogos = [
  { name: "Harborline" },
  { name: "Cascade Federal" },
  { name: "Pinecrest Savings" },
  { name: "Meridian Trust" },
  { name: "The Ledger Weekly" },
  { name: "Household Money" },
  { name: "Northgate CU" },
  { name: "Plainspoken" },
];

export function TestimonialsLogoWall({ logos = defaultLogos }) {
  return (
    <Section size="strip">
      <Container size="lg">
        <Flex direction="column" align="center" gap="7">
          <Text size="overline" color="muted" className="text-center">Trusted by banks and the press</Text>
          <Grid columns="auto" minWidth="xs" maxColumns="4" gap="5" className="w-full">
            {logos.map((logo) => (
              <Flex key={logo.name} align="center" justify="center" className="h-16">
                <Text size="lg" weight="semibold" color="muted" tracking="tight" className="whitespace-nowrap text-center max-md:text-base">{logo.name}</Text>
              </Flex>
            ))}
          </Grid>
          <Text size="sm" color="muted" className="text-center tabular-nums">WiseOwl connects with 11,642 banks and credit unions.</Text>
        </Flex>
      </Container>
    </Section>
  );
}

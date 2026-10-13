import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Container, Flex, Grid, Heading, Icon, Section, Text } from "@shavin/ui";

const defaultQuestions = [
  { q: "Can WiseOwl move money from my accounts?", a: "No. Connections are read-only, so WiseOwl can see balances and transactions but cannot move, send or withdraw money." },
  { q: "How do you keep my data secure?", a: "Data is encrypted with AES-256 at rest and TLS 1.3 in transit. Two-factor sign-in is available on every plan." },
  { q: "Which banks are supported?", a: "WiseOwl connects with 11,642 banks and credit unions in the US and Canada. You can add manual accounts for anything else." },
  { q: "Do you sell my data?", a: "Never. We make money from subscriptions only, and we do not show ads or share your data with lenders." },
  { q: "How does household sharing work?", a: "The Owner invites up to five people and gives each one Viewer, Editor or Owner access. You can remove anyone at any time." },
  { q: "What happens when my free trial ends?", a: "We email you three days before. If you do nothing, your account moves to the Free plan and keeps your data." },
  { q: "Can my accountant see my finances?", a: "Yes. Invite them as a Viewer to give read-only access, or use the Advisor plan if they manage several households." },
  { q: "How do I delete my account?", a: "Go to Settings, then Account, then Delete account. We erase your data within 30 days and send a confirmation email." },
];

export function FaqAccordionSection({ questions = defaultQuestions }) {
  return (
    <Section size="body">
      <Container size="lg">
        <Grid columns="2" gap="7" stack="auto" align="start">
          <Flex direction="column" gap="5" className="md:sticky md:top-24">
            <Flex direction="column" gap="3">
              <Text size="overline" color="muted">FAQ</Text>
              <Heading as="h2" size="3xl" tracking="tight">Questions people ask before joining</Heading>
              <Text size="lg" color="muted" className="max-w-[44ch] text-pretty">Still unsure? Write to help@wiseowl.app and a person replies within one business day.</Text>
            </Flex>
            <Button variant="outline" iconLeft={<Icon name="mail" size="sm" color="inherit" />} className="self-start">Email support</Button>
          </Flex>
          <Accordion type="single" collapsible defaultValue="question-0">
            {questions.map((question, index) => (
              <AccordionItem key={question.q} value={`question-${index}`}>
                <AccordionTrigger className="gap-4 py-4 text-left text-base">{question.q}</AccordionTrigger>
                <AccordionContent className="max-w-[60ch] pr-8 text-pretty">{question.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Grid>
      </Container>
    </Section>
  );
}

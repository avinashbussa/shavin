import { Button, Card, Container, Flex, Heading, Icon, Image, Link, Section, Separator, Text, TextField, WiseOwlLogo } from "@shavin/ui";

export function AuthSsoFirst() {
  return (
    <Section size="hero" bgOverlays="mesh-brand" className="flex items-center justify-center">
      <Container size="xs">
        <Flex direction="column" align="center" gap="6">
          <WiseOwlLogo size="sm" />
          <Card padding="lg" className="w-full max-w-[420px]">
            <Flex direction="column" gap="5">
              <Flex direction="column" gap="2">
                <Heading as="h1" size="lg">Sign in to WiseOwl</Heading>
                <Text size="sm" color="muted" className="text-pretty">Use the account you already trust. We never see your provider password.</Text>
              </Flex>
              <Flex direction="column" gap="3">
                <Button size="lg" variant="outline" className="w-full" iconLeft={<Image src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%23EA4335' d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'/%3E%3Cpath fill='%234285F4' d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'/%3E%3Cpath fill='%23FBBC05' d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'/%3E%3Cpath fill='%2334A853' d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'/%3E%3C/svg%3E" fit="contain" radius="none" className="size-[18px]" />}>Continue with Google</Button>
                <Button size="lg" variant="outline" className="w-full" iconLeft={<Icon name="github-logo" size="sm" />}>Continue with GitHub</Button>
                <Button size="lg" variant="outline" className="w-full" iconLeft={<Icon name="key" size="sm" />}>Continue with SSO</Button>
              </Flex>
              <Flex direction="row" align="center" gap="3">
                <Separator className="flex-1" />
                <Text size="xs" color="muted">or use email</Text>
                <Separator className="flex-1" />
              </Flex>
              <form className="flex flex-col gap-4">
                <TextField label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
                <Button type="submit" size="lg" className="w-full">Continue with email</Button>
              </form>
              <Text size="xs" color="muted" className="text-center text-pretty">By continuing you agree to the <Link href="/legal/terms">Terms of Service</Link> and <Link href="/legal/privacy">Privacy Policy</Link>.</Text>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}

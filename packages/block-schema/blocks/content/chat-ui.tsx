import { Avatar, Badge, Box, Button, Card, ChatBubble, Container, Flex, Heading, Icon, IconButton, Section, Text, TextField } from "@shavin/ui";

const defaultMessages = [
  { id: "m1", from: "user", time: "9:41 am", text: "Hi, I moved $1,200.00 from checking to savings on Thursday and it still shows as pending. Is something wrong?" },
  {
    id: "m2",
    from: "agent",
    time: "9:43 am",
    text: "Hi Daniel, thanks for checking. Here is the transfer I can see on your account.",
    transfer: { amount: "$1,200.00", route: "Cascade Federal Checking ••6021 to Harborline Savings ••3390", status: "Pending", eta: "Expected to clear Monday, Oct 5" },
  },
  { id: "m3", from: "agent", time: "9:44 am", text: "Transfers between two different banks usually take 2–3 business days. Harborline posts incoming transfers overnight." },
  { id: "m4", from: "user", time: "9:46 am", text: "Got it. Will my savings goal update on its own once it clears?" },
  { id: "m5", from: "agent", time: "9:47 am", text: "Yes. Once it posts, your Emergency fund goal moves from $11,460.00 to $12,660.00 automatically." },
];

const defaultReplies = ["Thanks, that helps", "Remind me on Monday", "Show my savings goal"];

export function ChatUi({ messages = defaultMessages, replies = defaultReplies }) {
  return (
    <Section size="compact">
      <Container size="sm">
        <Card padding="none" className="overflow-hidden">
          <Flex direction="column" className="h-[680px]">
            <Flex direction="row" align="center" gap="3" className="shrink-0 border-b border-hairline px-4 py-3">
              <Avatar size="md" src="https://assets.lummi.ai/assets/Qma5G7Ysfs1veKyTEdAC8tPvCdM9KDGeGY3Jrsf7Bky7N7?auto=format&w=400" fallback="NP" />
              <Flex direction="column" className="min-w-0 flex-1">
                <Heading as="h2" size="inherit" className="text-sm font-semibold">Noor Patel</Heading>
                <Text size="xs" color="muted" className="truncate">WiseOwl support · replies in about 3 min</Text>
              </Flex>
              <IconButton variant="ghost" size="md" aria-label="Conversation options">
                <Icon name="more-horizontal" size="md" color="inherit" />
              </IconButton>
            </Flex>
            <Flex direction="column" gap="4" role="log" aria-label="Messages" tabIndex={0} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
              <ChatBubble variant="system">Today</ChatBubble>
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  variant={message.from === "user" ? "outgoing" : "incoming"}
                  timestamp={message.time}
                  avatarSrc="https://assets.lummi.ai/assets/Qma5G7Ysfs1veKyTEdAC8tPvCdM9KDGeGY3Jrsf7Bky7N7?auto=format&w=400"
                  avatarFallback="NP"
                  hideAvatar={message.from === "user"}
                >
                  {message.text}
                  {message.transfer && (
                    <Flex direction="column" gap="2" className="mt-3 min-w-[240px] rounded-panel-inner border border-hairline bg-surface p-3">
                      <Flex direction="row" align="center" justify="between" gap="3">
                        <Text size="xs" color="muted">Transfer</Text>
                        <Badge variant="soft" tone="warning" size="sm">{message.transfer.status}</Badge>
                      </Flex>
                      <Heading as="p" size="md" className="tabular-nums">{message.transfer.amount}</Heading>
                      <Text size="xs" color="muted" className="text-pretty">{message.transfer.route}</Text>
                      <Flex direction="row" align="center" gap="2">
                        <Icon name="clock" size="xs" color="muted" />
                        <Text size="xs" color="muted">{message.transfer.eta}</Text>
                      </Flex>
                    </Flex>
                  )}
                </ChatBubble>
              ))}
              <Flex direction="row" align="end" gap="2">
                <Avatar size="sm" src="https://assets.lummi.ai/assets/Qma5G7Ysfs1veKyTEdAC8tPvCdM9KDGeGY3Jrsf7Bky7N7?auto=format&w=400" fallback="NP" />
                <Flex direction="row" align="center" gap="1" className="rounded-[var(--radius-panel)] rounded-tl-[var(--radius-sm)] bg-surface-hover px-3 py-3" role="status" aria-label="Noor is typing">
                  <Box className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-subtle" />
                  <Box className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-subtle [animation-delay:150ms]" />
                  <Box className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-subtle [animation-delay:300ms]" />
                </Flex>
              </Flex>
            </Flex>
            <Flex direction="column" gap="3" className="shrink-0 border-t border-hairline p-3">
              <Flex direction="row" gap="2" className="overflow-x-auto">
                {replies.map((reply) => (
                  <Button key={reply} variant="outline" size="sm" className="shrink-0 rounded-full">{reply}</Button>
                ))}
              </Flex>
              <Flex direction="row" align="center" gap="2">
                <IconButton variant="ghost" size="md" aria-label="Attach screenshot">
                  <Icon name="paperclip" size="md" color="inherit" />
                </IconButton>
                <TextField aria-label="Message" placeholder="Write a message…" className="h-10 min-w-0 flex-1" />
                <IconButton size="md" aria-label="Send">
                  <Icon name="send-horizontal" size="md" color="inherit" />
                </IconButton>
              </Flex>
            </Flex>
          </Flex>
        </Card>
      </Container>
    </Section>
  );
}

import { Avatar, Badge, Button, Container, Flex, Icon, IconButton, Section, Select, Separator, Switch, Text, TextArea } from "@shavin/ui";

const defaultTransactions = [
  { merchant: "Trader Joe's #142", date: "Oct 2", amount: "-$86.47", selected: true },
  { merchant: "Portland General Electric", date: "Oct 1", amount: "-$128.30", selected: false },
  { merchant: "Cascade Federal payroll", date: "Sep 30", amount: "$3,412.00", selected: false },
  { merchant: "Powell's Books", date: "Sep 29", amount: "-$24.95", selected: false },
  { merchant: "TriMet", date: "Sep 29", amount: "-$5.00", selected: false },
];

const defaultDetails = [
  { label: "Date", value: "Oct 2, 2026" },
  { label: "Account", value: "Cascade Federal Checking ••6021" },
  { label: "Paid by", value: "Daniel Reyes" },
];

const defaultCategories = [
  { value: "groceries", label: "Groceries" },
  { value: "dining-out", label: "Dining out" },
  { value: "household", label: "Household" },
  { value: "kids", label: "Kids" },
];

export function SidebarInspector({ transactions = defaultTransactions, details = defaultDetails, categories = defaultCategories }) {
  return (
    <Section size="compact">
      <Container size="lg">
        <Flex direction="row" className="h-[640px] overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-canvas">
          <Flex direction="column" gap="1" className="min-w-0 flex-1 overflow-y-auto p-3 max-md:hidden">
            <Text size="overline" color="muted" className="px-3 py-2">October</Text>
            {transactions.map((txn) => (
              <Flex key={txn.merchant} direction="row" align="center" justify="between" gap="4" className={txn.selected ? "rounded-[var(--radius-lg)] bg-surface-hover px-3 py-2.5" : "rounded-[var(--radius-lg)] px-3 py-2.5"}>
                <Flex direction="column" className="min-w-0">
                  <Text size="sm" weight="medium" truncate>{txn.merchant}</Text>
                  <Text size="xs" color="muted">{txn.date}</Text>
                </Flex>
                <Text size="sm" weight="medium" className="shrink-0 tabular-nums">{txn.amount}</Text>
              </Flex>
            ))}
          </Flex>
          <Flex as="aside" direction="column" aria-label="Transaction details" className="w-full shrink-0 border-hairline bg-surface md:w-[360px] md:border-l">
            <Flex direction="row" align="center" justify="between" gap="3" className="h-14 shrink-0 border-b border-hairline pl-5 pr-3">
              <Text size="sm" weight="semibold">Transaction details</Text>
              <IconButton variant="ghost" size="sm" aria-label="Close details">
                <Icon name="x" size="sm" color="inherit" />
              </IconButton>
            </Flex>
            <Flex direction="column" gap="6" className="min-h-0 flex-1 overflow-y-auto p-5">
              <Flex direction="row" align="center" gap="3">
                <Avatar fallback="TJ" size="md" radius="large" />
                <Flex direction="column" gap="1" className="min-w-0 flex-1">
                  <Text size="sm" weight="medium" truncate>Trader Joe's #142</Text>
                  <Text size="lg" weight="semibold" className="tabular-nums">-$86.47</Text>
                </Flex>
                <Badge variant="soft" tone="success" size="sm">Posted</Badge>
              </Flex>
              <Flex direction="column" gap="3">
                <Text size="overline" color="muted">Details</Text>
                {details.map((row) => (
                  <Flex key={row.label} direction="row" justify="between" gap="4">
                    <Text size="sm" color="muted" className="shrink-0">{row.label}</Text>
                    <Text size="sm" className="min-w-0 text-right">{row.value}</Text>
                  </Flex>
                ))}
                <Flex direction="row" align="center" justify="between" gap="4">
                  <Text size="sm" color="muted" className="shrink-0">Category</Text>
                  <Select defaultValue="groceries" options={categories} size="sm" ariaLabel="Category" className="w-40" />
                </Flex>
              </Flex>
              <Separator />
              <Flex direction="column" gap="3">
                <Text size="overline" color="muted">Notes</Text>
                <TextArea aria-label="Notes" rows={3} defaultValue="Includes school snacks for the week" />
              </Flex>
              <Separator />
              <Flex direction="column" gap="3">
                <Text size="overline" color="muted">Split</Text>
                <Flex direction="row" align="center" justify="between" gap="4">
                  <Flex direction="column" gap="1">
                    <Text size="sm" weight="medium">Split this transaction</Text>
                    <Text size="sm" color="muted" className="text-pretty">Divide the amount across categories or members.</Text>
                  </Flex>
                  <Switch aria-label="Split this transaction" className="shrink-0" />
                </Flex>
              </Flex>
            </Flex>
            <Flex direction="row" justify="end" gap="2" className="shrink-0 border-t border-hairline p-4">
              <Button variant="ghost" size="sm">Discard</Button>
              <Button size="sm">Save changes</Button>
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}

// Fixture: prompt-9 — mixed compliance: mostly clean but uses raw HTML table elements

import { Card, Checkbox, Pagination, Flex, Heading, Text, Button } from "@shavin/ui";

export function CustomerDataTable() {
  return (
    <Card padding="4">
      <Flex direction="col" gap="4">
        <Flex direction="row" justify="between" align="center">
          <Heading as="h3" size="md">Customers</Heading>
          <Button variant="outline" size="sm">Export CSV</Button>
        </Flex>
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline">
              <th className="text-left p-2"><Checkbox /></th>
              <th className="text-left p-2 text-sm font-medium text-muted">Name</th>
              <th className="text-left p-2 text-sm font-medium text-muted">Role</th>
              <th className="text-left p-2 text-sm font-medium text-muted">Status</th>
              <th className="text-left p-2 text-sm font-medium text-muted">Last Active</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-hairline">
              <td className="p-2"><Checkbox /></td>
              <td className="p-2 text-sm">Jane Cooper</td>
              <td className="p-2 text-sm">Admin</td>
              <td className="p-2 text-sm">Active</td>
              <td className="p-2 text-sm color-muted">2 min ago</td>
            </tr>
            <tr className="border-b border-hairline">
              <td className="p-2"><Checkbox /></td>
              <td className="p-2 text-sm">Wade Warren</td>
              <td className="p-2 text-sm">Member</td>
              <td className="p-2 text-sm">Inactive</td>
              <td className="p-2 text-sm color-muted">1 hour ago</td>
            </tr>
          </tbody>
        </table>
        <Flex direction="row" justify="between" align="center">
          <Text size="sm" color="muted">2 of 48 customers</Text>
          <Pagination totalPages={5} currentPage={1} />
        </Flex>
      </Flex>
    </Card>
  );
}

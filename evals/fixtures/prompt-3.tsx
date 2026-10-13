// Fixture: prompt-3 — dirty code with common AI violations
// Intentional violations: raw HTML elements, hex color, raw Tailwind color, glyph, inline style

import { Stepper, Button, Card, Flex } from "@shavin/ui";

export function CheckoutWizard() {
  return (
    <Card padding="4">
      <Stepper
        steps={[
          { label: "Cart", key: "cart" },
          { label: "Shipping", key: "shipping" },
          { label: "Payment", key: "payment" },
        ]}
        currentStep={0}
      />
      <div className="mt-6 p-4 bg-blue-50 rounded-lg" style={{ minHeight: "200px" }}>
        <p className="text-lg font-semibold text-[#1e40af]">🛒 Cart Items</p>
        <ul className="mt-2">
          <li className="text-sm text-slate-600">Product A — $29.99</li>
          <li className="text-sm text-slate-600">Product B — $14.99</li>
        </ul>
      </div>
      <Flex direction="row" justify="between" align="center" className="mt-4">
        <Button variant="ghost" size="md">Back</Button>
        <Button variant="solid" size="md">Continue to Shipping</Button>
      </Flex>
    </Card>
  );
}

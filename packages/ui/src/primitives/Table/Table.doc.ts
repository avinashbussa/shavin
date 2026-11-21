import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Table",
  description: "Data grid table primitives matching design system divider and hairline border visual token specifications.",
  features: [
    "Components: Table, TableHeader, TableBody, TableRow, TableColumnHeaderCell, TableCell",
    "Scrolls sideways inside its own container when wider than the space it is given, fades the edge that still has content and becomes keyboard focusable only while it scrolls (scrollLabel names the region)",
    "Row hover highlight and click handler support",
    "Standardized cell padding and border-hairline dividers"
  ],
  accessibility: [
    "Native HTML5 <table>, <thead>, <tbody>, <th>, and <td> semantic elements",
    "High contrast header text tracking",
    "While the table scrolls it is a focusable region (tabIndex 0, role region) named by scrollLabel, so keyboard users can scroll it"
  ],
  keyboard: "Tab to interactive table cells or action buttons inside table rows",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Table for structured tabular data, invoices, user directories, and audit logs."
      },
      {
        guidance: false,
        description: "Do not use Table for page layout columns — reach for Grid or Flex instead."
      },
      {
        guidance: false,
        description: "Do not wrap a Table in overflow-hidden (a Card with overflow-hidden clips the scroll area). Keep the first column short; a comparison table with many columns is fine, it scrolls and fades."
      }
    ]
  },
  structure: [
    "Table > TableHeader > TableRow > TableColumnHeaderCell; Table > TableBody > TableRow > TableCell",
  ],
  examples: [
    {
      title: "Data Directory Table",
      code: `<Table>
  <TableHeader><TableRow><TableColumnHeaderCell>Name</TableColumnHeaderCell><TableColumnHeaderCell>Role</TableColumnHeaderCell></TableRow></TableHeader>
  <TableBody><TableRow><TableCell>Elena Rostova</TableCell><TableCell>Staff Engineer</TableCell></TableRow></TableBody>
</Table>`
    }
  ]
};

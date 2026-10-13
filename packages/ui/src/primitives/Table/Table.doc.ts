import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Table",
  description: "Data grid table primitives matching design system divider and hairline border visual token specifications.",
  features: [
    "Components: Table, TableHeader, TableBody, TableRow, TableColumnHeaderCell, TableCell",
    "Horizontal scroll container wrapper (overflow-x-auto)",
    "Row hover highlight and click handler support",
    "Standardized cell padding and border-hairline dividers"
  ],
  accessibility: [
    "Native HTML5 <table>, <thead>, <tbody>, <th>, and <td> semantic elements",
    "High contrast header text tracking"
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
      }
    ]
  },
  examples: [
    {
      title: "Data Directory Table",
      code: '<Table><TableHeader><TableRow><TableColumnHeaderCell>Name</TableColumnHeaderCell><TableColumnHeaderCell>Role</TableColumnHeaderCell></TableRow></TableHeader><TableBody><TableRow><TableCell>Elena Rostova</TableCell><TableCell>Staff Engineer</TableCell></TableRow></TableBody></Table>'
    }
  ]
};

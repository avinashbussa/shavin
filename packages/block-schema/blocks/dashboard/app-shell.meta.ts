import type { BlockMeta } from "../../src/authored";

export default {
  name: "Application Shell",
  description: "Full household-finance app frame: sidebar with grouped nav and seat usage, greeting header with actions, four KPI tiles and a recent-transactions table.",
  tags: ["app-shell", "dashboard", "sidebar", "kpi", "table"],
  tier: "system",
  layout: "app-shell",
} satisfies BlockMeta;

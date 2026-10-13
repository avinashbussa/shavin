import type { BlockMeta } from "../../src/authored";

export default {
  name: "Article Card",
  description: "Blog article card with a 16:9 photo, category overline, excerpt and author row.",
  tags: ["card", "article", "blog", "media"],
  replaces: "card-media-hero",
} satisfies BlockMeta;

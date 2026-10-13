import { SYSTEM_BLOCKS, COMMUNITY_BLOCKS } from "@shavin/block-schema";
import { c, fmt, g, printCard, startSpinner } from "../ui.mjs";

export async function listCommand(categoryOrFlag = null, options = {}) {
  const isCommunity = categoryOrFlag === "--community" || options.community;
  const categoryFilter = isCommunity && categoryOrFlag === "--community" ? null : categoryOrFlag;

  const spinner = startSpinner("Fetching catalog from shavin.cc/r/catalog.json...");

  let remoteCatalog = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch("https://shavin.cc/r/catalog.json", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      remoteCatalog = await res.json();
    }
  } catch {
    // Offline fallback
  }

  if (remoteCatalog) {
    spinner.succeed(`Catalog loaded (https://shavin.cc/r)`);
  } else {
    spinner.warn(`Using offline fallback`);
  }

  const blocks = isCommunity
    ? (remoteCatalog
        ? remoteCatalog.filter((b) => (categoryFilter ? b.category === categoryFilter : true))
        : (categoryFilter
            ? COMMUNITY_BLOCKS.filter((b) => b.category === categoryFilter)
            : COMMUNITY_BLOCKS))
    : (categoryFilter
        ? (remoteCatalog || SYSTEM_BLOCKS).filter((b) => b.category === categoryFilter)
        : (remoteCatalog || SYSTEM_BLOCKS));

  if (blocks.length === 0) {
    console.log(`\n  ${fmt.warn(`No blocks found for category: ${categoryFilter}`)}\n`);
    return;
  }

  const grouped = {};
  for (const b of blocks) {
    const cat = b.category || "general";
    grouped[cat] = grouped[cat] || [];
    grouped[cat].push(b);
  }

  const cardItems = [];
  const entries = Object.entries(grouped);

  entries.forEach(([cat, list], catIdx) => {
    cardItems.push({ sectionTitle: `${cat.toUpperCase()} (${list.length} blocks)` });
    for (const item of list) {
      const authorSuffix = item.author && item.author !== "shavin" ? ` ${fmt.tag("@" + (item.author.username || item.author))}` : "";
      const scoreBadge = item.qualityScore ? ` ${c.success}[★ ${item.qualityScore}]${c.reset}` : "";
      cardItems.push(`  ${c.fgMuted}${g.bullet}${c.reset} ${fmt.code(item.slug.padEnd(26))} ${c.fgMuted}│${c.reset} ${c.fg}${item.name.padEnd(30)}${c.reset}${authorSuffix}${scoreBadge}`);
    }
  });

  printCard({
    title: `${c.brand}${g.section} @shavin/ui ${isCommunity ? "Community Creator" : "Block"} Catalog${c.reset}`,
    items: cardItems,
    footer: `${c.fgSubtle}Quick install:${c.reset} ${fmt.code("npx @shavin/cli add <slug>")}`,
  });
}

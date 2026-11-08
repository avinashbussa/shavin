import { initCommand } from "./commands/init.mjs";
import { addCommand } from "./commands/add.mjs";
import { listCommand } from "./commands/list.mjs";
import { checkCommand } from "./commands/check.mjs";
import { publishCommand } from "./commands/publish.mjs";
import { contextCommand } from "./commands/context.mjs";
import { bridgeCommand } from "./commands/bridge.mjs";
import { brandCommand } from "./commands/brand.mjs";
import { fileURLToPath } from "node:url";
import { c, fmt, g, printBanner } from "./ui.mjs";

export async function runCli(argv = []) {
  // Command Start Padding (2 empty lines when entering any command)
  process.stdout.write("\n\n");

  const [cmd, ...rest] = argv;

  switch (cmd) {
    case "init":
      const useOklch = rest.includes("--oklch");
      await initCommand({ oklch: useOklch });
      break;

    case "context":
      const isJson = rest.includes("--json");
      const shouldSave = !rest.includes("--no-save");
      const targetIdx = rest.indexOf("--target");
      const targetDir = targetIdx !== -1 ? rest[targetIdx + 1] : process.cwd();
      await contextCommand({ json: isJson, targetDir, save: shouldSave });
      break;

    case "add":
      const slug = rest[0];
      const overwrite = rest.includes("--overwrite");
      await addCommand(slug, { overwrite });
      break;

    case "list":
    case "ls":
      const isCommunity = rest.includes("--community");
      const cat = rest.find((arg) => !arg.startsWith("--"));
      await listCommand(isCommunity ? "--community" : cat, { community: isCommunity });
      break;

    case "publish":
      const filePath = rest[0];
      await publishCommand(filePath);
      break;

    case "check":
      await checkCommand();
      break;

    case "bridge":
      const portIdx = rest.indexOf("--port");
      // No --port → undefined, so bridgeCommand resolves the canonical default from @shavin/mcp.
      const portVal = portIdx !== -1 ? rest[portIdx + 1] : undefined;
      await bridgeCommand({ port: portVal });
      break;

    case "brand":
      await brandCommand(rest);
      break;

    case "--help":
    case "-h":
    case "help":
    default:
      printBanner("@shavin/cli", "UI Primitives, Block Registry & Agent Distribution");
      console.log(`  ${c.bold}${c.fg}Usage:${c.reset}
    ${c.brand}npx @shavin/cli${c.reset} ${c.fgMuted}<command> [options]${c.reset}

  ${c.bold}${c.fg}Commands:${c.reset}
    ${c.brand}${"init".padEnd(20)}${c.reset} ${c.fgSubtle}Scaffold @shavin/ui, SHAVIN.md & Tailwind preset${c.reset}
    ${c.brand}${"add <slug>".padEnd(20)}${c.reset} ${c.fgSubtle}Install block from canonical registry (@author/slug)${c.reset}
    ${c.brand}${"list [cat]".padEnd(20)}${c.reset} ${c.fgSubtle}Browse available blocks (--community for creator catalog)${c.reset}
    ${c.brand}${"check".padEnd(20)}${c.reset} ${c.fgSubtle}Audit project setup, tokens & ThemeProvider${c.reset}
    ${c.brand}${"context".padEnd(20)}${c.reset} ${c.fgSubtle}Extract < 300 token AI prompt manifest${c.reset}
    ${c.brand}${"publish <file>".padEnd(20)}${c.reset} ${c.fgSubtle}Verify block with MCP quality gate & package manifest${c.reset}
    ${c.brand}${"bridge".padEnd(20)}${c.reset} ${c.fgSubtle}Start the Agent-Browser Bridge daemon${c.reset}
    ${c.brand}${"brand [--check|--init]".padEnd(20)}${c.reset} ${c.fgSubtle}Generate or scaffold brand color tokens${c.reset}

  ${c.bold}${c.fg}Options:${c.reset}
    ${c.fgMuted}${"--oklch".padEnd(20)}${c.reset} ${c.fgSubtle}Use OKLCH color space for init (v4 OKLCH path)${c.reset}
    ${c.fgMuted}${"--overwrite".padEnd(20)}${c.reset} ${c.fgSubtle}Overwrite existing files when adding blocks${c.reset}
    ${c.fgMuted}${"--community".padEnd(20)}${c.reset} ${c.fgSubtle}Query online community creator registry${c.reset}
    ${c.fgMuted}${"--port <port>".padEnd(20)}${c.reset} ${c.fgSubtle}Override the bridge server port${c.reset}
    ${c.fgMuted}${"--json".padEnd(20)}${c.reset} ${c.fgSubtle}Output machine-readable JSON format${c.reset}
    ${c.fgMuted}${"--help, -h".padEnd(20)}${c.reset} ${c.fgSubtle}Show this help menu${c.reset}
`);
      break;
  }
}

// Direct execution guard
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli(process.argv.slice(2)).catch((err) => {
    console.error(`\n${fmt.error("CLI Error: " + (err.message || err))}`);
    process.exit(1);
  });
}

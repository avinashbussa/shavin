/**
 * The help text. Lives apart from the command modules so `shavin <command> --help` answers without loading them: `add`
 * imports @shavin/block-schema, and help must work even when a dependency is missing or not built (as --version does).
 */
import { c, printBanner } from "./ui.mjs";

export const KNOWN_COMMANDS = ["init", "context", "add", "list", "ls", "publish", "check", "doctor", "bridge", "brand", "findings"];

/** True for `shavin <command> --help` / `-h` (a known command). The bare `--help`, `-h` and `help` are the CLI's default case. */
export function isCommandHelp(argv) {
  const [cmd, ...rest] = argv;
  return KNOWN_COMMANDS.includes(cmd) && rest.some((a) => a === "--help" || a === "-h");
}

export function printHelp() {
  printBanner("@shavin/cli", "UI Primitives, Block Registry & Agent Distribution");
  console.log(`  ${c.bold}${c.fg}Usage:${c.reset}
    ${c.brand}npx @shavin/cli${c.reset} ${c.fgMuted}<command> [options]${c.reset}

  ${c.bold}${c.fg}Commands:${c.reset}
    ${c.brand}${"init".padEnd(20)}${c.reset} ${c.fgSubtle}Scaffold @shavin/ui, SHAVIN.md & Tailwind preset${c.reset}
    ${c.brand}${"add <slug>".padEnd(20)}${c.reset} ${c.fgSubtle}Install block from canonical registry (@author/slug)${c.reset}
    ${c.brand}${"list [cat]".padEnd(20)}${c.reset} ${c.fgSubtle}Browse available blocks (--community for creator catalog)${c.reset}
    ${c.brand}${"check, doctor".padEnd(20)}${c.reset} ${c.fgSubtle}Health check: versions, setup, agent files (--json; --render <url> loads a page headless; exits 1 on failure)${c.reset}
    ${c.brand}${"context".padEnd(20)}${c.reset} ${c.fgSubtle}Extract < 300 token AI prompt manifest${c.reset}
    ${c.brand}${"publish <file>".padEnd(20)}${c.reset} ${c.fgSubtle}Verify block with MCP quality gate & package manifest${c.reset}
    ${c.brand}${"bridge".padEnd(20)}${c.reset} ${c.fgSubtle}Start the Agent-Browser Bridge daemon${c.reset}
    ${c.brand}${"findings".padEnd(20)}${c.reset} ${c.fgSubtle}Read, take or finish findings sent from the page${c.reset}
    ${c.brand}${"brand [--check|--init]".padEnd(20)}${c.reset} ${c.fgSubtle}Generate or scaffold brand color tokens, or apply a theme (--color, --display-font, --body-font, --mode, --confirm)${c.reset}

  ${c.bold}${c.fg}Options:${c.reset}
    ${c.fgMuted}${"--oklch".padEnd(20)}${c.reset} ${c.fgSubtle}Use OKLCH color space for init (v4 OKLCH path)${c.reset}
    ${c.fgMuted}${"--overwrite".padEnd(20)}${c.reset} ${c.fgSubtle}Overwrite existing files when adding blocks${c.reset}
    ${c.fgMuted}${"--yes, -y".padEnd(20)}${c.reset} ${c.fgSubtle}add: run init and install missing packages without asking${c.reset}
    ${c.fgMuted}${"--community".padEnd(20)}${c.reset} ${c.fgSubtle}Query online community creator registry${c.reset}
    ${c.fgMuted}${"--port <port>".padEnd(20)}${c.reset} ${c.fgSubtle}Override the bridge server port${c.reset}
    ${c.fgMuted}${"--json".padEnd(20)}${c.reset} ${c.fgSubtle}Output machine-readable JSON format${c.reset}
    ${c.fgMuted}${"--version, -v".padEnd(20)}${c.reset} ${c.fgSubtle}Print the CLI version${c.reset}
    ${c.fgMuted}${"--help, -h".padEnd(20)}${c.reset} ${c.fgSubtle}Show this help menu${c.reset}
`);
}

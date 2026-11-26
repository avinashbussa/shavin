import { initCommand } from "./commands/init.mjs";
import { addCommand } from "./commands/add.mjs";
import { listCommand } from "./commands/list.mjs";
import { checkCommand } from "./commands/check.mjs";
import { publishCommand } from "./commands/publish.mjs";
import { contextCommand } from "./commands/context.mjs";
import { bridgeCommand } from "./commands/bridge.mjs";
import { brandCommand } from "./commands/brand.mjs";
import { findingsCommand } from "./commands/findings.mjs";
import { fileURLToPath } from "node:url";
import { cliVersion, isVersionRequest } from "./version.mjs";
import { fmt } from "./ui.mjs";
import { isCommandHelp, printHelp } from "./help.mjs";

export async function runCli(argv = []) {
  if (isVersionRequest(argv[0])) {
    process.stdout.write(`${cliVersion()}\n`);
    return;
  }
  // Command Start Padding (2 empty lines when entering any command)
  process.stdout.write("\n\n");

  const [cmd, ...rest] = argv;

  // `shavin <command> --help` (or -h) shows the help and does nothing else: `brand` and `bridge` would otherwise run.
  const wantsHelp = isCommandHelp(argv);

  switch (wantsHelp ? "help" : cmd) {
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
      const yes = rest.includes("--yes") || rest.includes("-y");
      await addCommand(slug, { overwrite, yes, oklch: rest.includes("--oklch") });
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
    case "doctor": {
      const targetIdx = rest.indexOf("--target");
      const renderIdx = rest.indexOf("--render");
      await checkCommand({ json: rest.includes("--json"), targetDir: targetIdx !== -1 ? rest[targetIdx + 1] : undefined, renderUrl: renderIdx !== -1 ? rest[renderIdx + 1] : undefined });
      break;
    }

    case "bridge":
      const portIdx = rest.indexOf("--port");
      // No --port → undefined, so bridgeCommand resolves the canonical default from @shavin/mcp.
      const portVal = portIdx !== -1 ? rest[portIdx + 1] : undefined;
      await bridgeCommand({ port: portVal });
      break;

    case "brand":
      await brandCommand(rest);
      break;

    case "findings":
      await findingsCommand(rest);
      break;

    case "--help":
    case "-h":
    case "help":
    default:
      printHelp();
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

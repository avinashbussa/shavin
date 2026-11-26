#!/usr/bin/env node
import { cliVersion, isVersionRequest } from "../src/version.mjs";
import { isCommandHelp, printHelp } from "../src/help.mjs";

// The version flag answers before the command modules load, so it works even when a dependency is missing.
if (isVersionRequest(process.argv[2])) {
  process.stdout.write(`${cliVersion()}\n`);
} else if (isCommandHelp(process.argv.slice(2))) {
  // Help answers without loading the command modules, so it works when a dependency is missing or not built.
  process.stdout.write("\n\n");
  printHelp();
} else {
  const { runCli } = await import("../src/index.mjs");
  runCli(process.argv.slice(2)).catch((err) => {
    console.error("\n[shavin-cli] Error:", err.message || err);
    process.exit(1);
  });
}

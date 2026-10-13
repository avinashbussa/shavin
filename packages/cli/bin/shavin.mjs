#!/usr/bin/env node
import { runCli } from "../src/index.mjs";

runCli(process.argv.slice(2)).catch((err) => {
  console.error("\n[shavin-cli] Error:", err.message || err);
  process.exit(1);
});

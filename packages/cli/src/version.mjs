import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The CLI's own version, read from its package.json (always in the published tarball). */
export const cliVersion = () =>
  JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8")).version;

/** `shavin --version`, `-v` and `version`. */
export const isVersionRequest = (arg) => ["--version", "-v", "version"].includes(arg);

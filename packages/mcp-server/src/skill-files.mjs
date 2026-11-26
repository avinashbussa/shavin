import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { relPosix } from "./posix-path.mjs";

/**
 * Every .md file under a skill folder. `relPath` is relative to `baseDir` with "/" separators on every platform
 * (Windows `path` uses backslashes), because skill file keys such as "references/compositions/hero" are compared
 * with "/" strings by the catalogue loader and the get_skill section lookup. `pathImpl` is for tests.
 */
export function walkDirFiles(dir, baseDir = dir, pathImpl = path) {
  const results = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = pathImpl.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDirFiles(fullPath, baseDir, pathImpl));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push({ fullPath, relPath: relPosix(baseDir, fullPath, pathImpl), name: entry.name });
    }
  }
  return results;
}

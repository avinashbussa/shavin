/**
 * Path helpers: print and compare paths with forward slashes on every platform (Windows `path` returns
 * backslashes), and use `path.join` / `path.resolve` only for file system access.
 */
import { relative, sep } from "node:path";

/** `a\\b\\c` → `a/b/c` (no-op on POSIX). */
export const posix = (p) => String(p).split(sep).join("/").replace(/\\/g, "/");

/** Path of `to` relative to `from`, with forward slashes ("" when equal). */
export const relPosix = (from, to) => posix(relative(from, to));

/** Like relPosix but always starts with "./" or "../" (for `@source`, `@import` and config paths). */
export const relSpec = (from, to) => {
  const r = relPosix(from, to);
  return r.startsWith(".") ? r : `./${r}`;
};

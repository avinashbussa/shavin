/**
 * Shared source-scanning helpers for the token/class lint guards.
 * Zero-dependency; used by lint-tokens.mjs and lint-classes.mjs.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Blank out comments (// and block) while preserving newlines and string
 * contents — a tiny char scanner that tracks string state so a `//` inside a
 * URL string isn't mistaken for a comment. Returns source with comment bytes
 * replaced by spaces (line numbers intact).
 */
export function stripComments(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  let state = "code"; // code | line | block | s-single | s-double | s-tick
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (state === "code") {
      if (c === "/" && d === "/") { state = "line"; out += "  "; i += 2; continue; }
      if (c === "/" && d === "*") { state = "block"; out += "  "; i += 2; continue; }
      if (c === "'") { state = "s-single"; out += c; i++; continue; }
      if (c === '"') { state = "s-double"; out += c; i++; continue; }
      if (c === "`") { state = "s-tick"; out += c; i++; continue; }
      out += c; i++; continue;
    }
    if (state === "line") {
      if (c === "\n") { state = "code"; out += c; }
      else out += c === "\t" ? "\t" : " ";
      i++; continue;
    }
    if (state === "block") {
      if (c === "*" && d === "/") { state = "code"; out += "  "; i += 2; continue; }
      out += c === "\n" ? "\n" : " ";
      i++; continue;
    }
    if (c === "\\") { out += c + (d ?? ""); i += 2; continue; }
    out += c;
    if ((state === "s-single" && c === "'") || (state === "s-double" && c === '"') || (state === "s-tick" && c === "`")) {
      state = "code";
    }
    i++;
  }
  return out;
}

/** Recursively list .ts/.tsx files under a dir, skipping deps/build output. */
export function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".next" || entry === "dist") continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

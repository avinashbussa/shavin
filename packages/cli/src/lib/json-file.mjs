/**
 * Reading JSON files that belong to the user's project (package.json, .mcp.json, editor settings, .shavin/config.json).
 * Windows editors and PowerShell's `Out-File -Encoding utf8` write a leading UTF-8 BOM (U+FEFF), which JSON.parse
 * rejects, so a perfectly good file looked corrupt. Pure: no console output, callers decide how to tell the user.
 */
import { readFileSync } from "node:fs";

/** `text` without a leading UTF-8 byte order mark. */
export const stripBom = (text) => String(text).replace(/^﻿/, "");

/** JSON.parse that accepts a leading BOM (and CRLF line endings, which JSON allows anyway). */
export const parseJson = (text) => JSON.parse(stripBom(text));

/** Reads and parses a JSON file. Throws the JSON.parse error when the file is not valid JSON. */
export const readJsonFile = (file) => parseJson(readFileSync(file, "utf8"));

/**
 * The one message for a file that is not valid JSON, with the way out. `what` says what was left undone,
 * for example "init did not add the Shavin server".
 */
export function invalidJsonMessage(file, err, what) {
  const reason = err && err.message ? ` (${err.message})` : "";
  return `${file} is not valid JSON${reason}, so ${what}. Fix the file (a trailing comma or a comment is the usual cause; editor settings files may use comments, which this tool does not rewrite), or move it aside, then run the command again.`;
}

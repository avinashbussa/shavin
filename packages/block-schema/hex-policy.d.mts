export interface HexViolation {
  hex: string;
  /** Offset into the source string. */
  index: number;
  /** 1-based line number. */
  line: number;
  reason: "css" | "arbitrary-class" | "style" | "color-key" | "color-fn" | "standalone";
}
export interface HexPolicyOptions {
  lang?: "css" | "js";
  filename?: string;
}
export function looksLikeColorHex(hex: string, suffix?: string): boolean;
export function findHexViolations(source: string, opts?: HexPolicyOptions): HexViolation[];
export function matchHexColors(source: string, opts?: HexPolicyOptions): string[];
export function hasHexViolation(source: string, opts?: HexPolicyOptions): boolean;

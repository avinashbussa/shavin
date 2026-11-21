/** Maps the existing token-purity audit rows onto the finding schema, so Issues shows them next to the new detectors. */
import { makeFinding, type Finding } from "./schema";

export interface TokenIssueInput {
  category: "Token Purity" | "Semantic Tokens" | "Concentric Radius" | "Surface Elevation" | "Typography Scale" | string;
  severity: "error" | "warning";
  detail: string;
  /** The element the row was found on. */
  node?: Element | null;
}

const RULE_BY_CATEGORY: Record<string, string> = {
  "Token Purity": "tokens.purity",
  "Semantic Tokens": "tokens.semantic",
  "Concentric Radius": "tokens.radius",
  "Surface Elevation": "tokens.surface",
  "Typography Scale": "tokens.type",
};

export interface TokenFindingHooks {
  selectorOf(node: Element): string;
  contextOf(node: Element): string;
  scroll: { x: number; y: number };
}

export function tokenFindings(issues: readonly TokenIssueInput[], hooks: TokenFindingHooks): Finding[] {
  const out: Finding[] = [];
  for (const issue of issues) {
    const node = issue.node;
    if (!node || node.nodeType !== 1) continue;
    const r = node.getBoundingClientRect();
    out.push(
      makeFinding({
        detector: "tokens",
        rule: RULE_BY_CATEGORY[issue.category] ?? "tokens.purity",
        severity: issue.severity,
        message: "Style bypasses the design tokens.",
        evidence: { measured: issue.detail, expected: "a semantic token", category: issue.category },
        fixHint: "Use the semantic token (bg-surface, text-fg, border-hairline, shadow-card, rounded-[var(--radius-panel)]).",
        selector: hooks.selectorOf(node),
        context: hooks.contextOf(node),
        rect: { x: r.x, y: r.y, w: r.width, h: r.height, scrollX: hooks.scroll.x, scrollY: hooks.scroll.y },
        text: (node.textContent ?? "").trim().slice(0, 40),
      }),
    );
  }
  return out;
}

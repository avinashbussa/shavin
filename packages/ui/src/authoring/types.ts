/**
 * @file types.ts
 * Authoring schema and type definitions for @shavin/ui component documentation.
 * Used in co-located {ComponentName}.doc.ts files.
 */

export interface BestPracticeDoc {
  /** True for 'Do' guidelines, False for 'Don't' warnings */
  guidance: boolean;
  /** Actionable design system advice */
  description: string;
}

export interface ExampleDoc {
  /** Short title of the example */
  title: string;
  /** Optional explanation */
  description?: string;
  /** Valid JSX code snippet */
  code: string;
}

export interface ComponentDocProse {
  /**
   * Shavin's own tooling rather than a design primitive (e.g. ShavinDevTools,
   * BlockPreview). Internal components stay in the repo, the playground and
   * components.json (marked `internal`), but are left out of the primitive
   * count and the component lists agents build UI from.
   */
  internal?: boolean;
  /**
   * Where the component sits in the docs sidebar and the playground:
   * "layout", "typography", or (omitted) "components".
   */
  group?: "layout" | "typography";
  /** Concise description of the component purpose and role */
  description: string;
  /** Key features (variants, sizes, animations) */
  features?: string[];
  /** Special behavioral or architectural notes */
  notes?: string[];
  /** Accessibility highlights (WCAG 2.2 AA) */
  accessibility?: string[];
  /** Keyboard navigation shortcuts (e.g. 'Space/Enter to activate') */
  keyboard?: string;
  /** Usage best practices (Do / Don't callout guidance) */
  usage?: {
    bestPractices?: BestPracticeDoc[];
  };
  /**
   * One-line composition notes shown to agents: sub-component nesting
   * ("Table > TableHeader > TableRow > TableColumnHeaderCell"), provider and
   * hook setup. Keep each line short; the MCP prints them verbatim.
   */
  structure?: string[];
  /** Interactive code examples */
  examples?: ExampleDoc[];
}

export interface ComponentDoc extends ComponentDocProse {
  /** Component name (e.g., 'Button') */
  name: string;
}

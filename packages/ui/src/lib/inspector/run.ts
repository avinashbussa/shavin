/** One call that collects the page and runs every detector. The inspector UI and tests both use this. */
import { collectPage, type CollectOptions } from "./collect";
import { analyzePage, type RuleHooks } from "./rules";
import { contextLabel, uniqueSelector } from "./selector";
import type { Finding } from "./schema";

export interface InspectionResult {
  findings: Finding[];
  dropped: number;
}

/** Selector and label lookups are memoised per element for the duration of one scan. */
export function domHooks(doc: Document): RuleHooks {
  const selectors = new WeakMap<object, string>();
  const contexts = new WeakMap<object, string>();
  return {
    selectorOf(ref) {
      if (!ref || typeof ref !== "object") return String(ref);
      let s = selectors.get(ref);
      if (s === undefined) {
        s = uniqueSelector(ref as Element, doc);
        selectors.set(ref, s);
      }
      return s;
    },
    contextOf(ref) {
      if (!ref || typeof ref !== "object") return "";
      let s = contexts.get(ref);
      if (s === undefined) {
        s = contextLabel(ref as Element);
        contexts.set(ref, s);
      }
      return s;
    },
  };
}

export function inspectDocument(options: CollectOptions = {}): InspectionResult {
  const doc = options.doc ?? document;
  return analyzePage(collectPage({ ...options, doc }), domHooks(doc));
}

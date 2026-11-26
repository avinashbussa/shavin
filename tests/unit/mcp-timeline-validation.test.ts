import { describe, it, expect } from "vitest";
// @ts-ignore .mjs
import { checkMotionTimelines, validateCode } from "../../packages/mcp-server/src/tools/validation.mjs";

const rule = (code: string) => checkMotionTimelines(code).map((t: { rule: string }) => t.rule);

describe("checkMotionTimelines", () => {
  it("passes a well-formed timeline (root + members)", () => {
    const code = `<Section data-motion-tl="t1" data-motion-tl-trigger="load">
      <h1 data-motion-tl-member="t1" data-motion-tl-at="0" data-motion-tl-effect="fade-up">A</h1>
      <p data-motion-tl-member="t1" data-motion-tl-at="120" data-motion-tl-effect="fade">B</p>
    </Section>`;
    expect(checkMotionTimelines(code)).toEqual([]);
  });

  it("flags an orphan member (no matching root)", () => {
    const code = `<p data-motion-tl-member="ghost" data-motion-tl-at="0" data-motion-tl-effect="fade">B</p>`;
    expect(rule(code)).toContain("timeline-orphan-member");
  });

  it("flags a dead timeline (root with no members)", () => {
    const code = `<Section data-motion-tl="t9" data-motion-tl-trigger="load">nothing</Section>`;
    expect(rule(code)).toContain("timeline-no-members");
  });

  it("flags a member that also runs its own entry/scroll", () => {
    const code = `<Section data-motion-tl="t1">
      <h1 data-motion-tl-member="t1" data-motion-tl-at="0" data-motion-tl-effect="fade-up" data-motion-entry="fade-up">A</h1>
    </Section>`;
    expect(rule(code)).toContain("timeline-member-standalone");
  });

  it("does not confuse data-motion-tl-member/-at with the root attribute", () => {
    // Only -member/-at/-effect present, no bare data-motion-tl= → the member is an orphan, root set is empty.
    const code = `<p data-motion-tl-member="t1" data-motion-tl-at="0" data-motion-tl-effect="fade">x</p>`;
    const rules = rule(code);
    expect(rules).toContain("timeline-orphan-member");
    expect(rules).not.toContain("timeline-no-members"); // no real root was detected
  });

  it("surfaces timeline rules through validateCode", () => {
    const code = `<p data-motion-tl-member="ghost" data-motion-tl-effect="fade">B</p>`;
    expect(validateCode(code).some((v: string) => /timeline-orphan-member/.test(v))).toBe(true);
  });

  it("clean code produces no timeline violations", () => {
    expect(checkMotionTimelines(`<div className="p-4">hi</div>`)).toEqual([]);
  });
});

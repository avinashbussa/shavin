import { describe, it, expect } from "vitest";
import { PROMPT_CAP, UNTRUSTED_LINE, buildPrompt, userFindingInput } from "../../../packages/ui/src/inspector/prompt";
import { makeFinding } from "../../../packages/ui/src/lib/inspector/schema";

const finding = makeFinding({
  detector: "contrast",
  rule: "contrast.text",
  severity: "error",
  message: "Text is hard to read on its background.",
  evidence: { measured: "3.1:1", expected: "4.5:1" },
  fixHint: "Use text-fg or text-fg-subtle on bg-surface, or darken the text token.",
  selector: "a.footer-link",
  context: "Footer > Link",
  rect: { x: 64.4, y: 1900.2, w: 96, h: 20, scrollX: 0, scrollY: 0 },
  text: "Privacy policy",
});

describe("buildPrompt", () => {
  it("has the shape from the design: what to do, the judgement, the element, the numbers, a suggestion, the note, the data line", () => {
    const text = buildPrompt({ pathname: "/pricing", finding, note: "This is on every page, please fix the token not the one link." });
    expect(text.split("\n")).toEqual([
      "Fix this issue on the page at /pricing.",
      "",
      "Text is hard to read on its background. (error, contrast)",
      'Element: a.footer-link in Footer > Link, text "Privacy policy", at 64,1900, 96 by 20 px.',
      "Measured 3.1:1, expected 4.5:1.",
      "Suggestion: Use text-fg or text-fg-subtle on bg-surface, or darken the text token.",
      "My note: This is on every page, please fix the token not the one link.",
      "",
      UNTRUSTED_LINE,
    ]);
  });

  it("puts the judgement before the numbers and ends with the safety line", () => {
    const text = buildPrompt({ pathname: "/", finding });
    expect(text.indexOf("hard to read")).toBeLessThan(text.indexOf("Measured"));
    expect(text.endsWith(UNTRUSTED_LINE)).toBe(true);
    expect(text).not.toContain("My note");
  });

  it("a plain selection says look at this element and leaves out judgement, numbers and suggestion", () => {
    const u = makeFinding({ ...userFindingInput(document.createElement("div"), { x: 1, y: 2, w: 3, h: 4, scrollX: 0, scrollY: 0 }, "div.card", "main > div.card", "make it calmer") });
    const text = buildPrompt({ pathname: "/home", finding: u, note: "make it calmer" });
    expect(text).toMatch(/^Look at this element on the page at \/home\./);
    expect(text).toContain("Element: div.card in main > div.card");
    expect(text).not.toMatch(/Measured|Suggestion|\(warning, user\)/);
    expect(text).toContain("My note: make it calmer");
  });

  it("a page-level finding says the whole page", () => {
    const page = makeFinding({ detector: "console", rule: "console.error", severity: "error", message: "The page logged an error.", fixHint: "Open the console.", selector: "(page)", rect: null, evidence: { measured: "TypeError: x" } });
    const text = buildPrompt({ pathname: "/", finding: page });
    expect(text).toContain("Element: the whole page.");
    expect(text).toContain("Measured TypeError: x.");
  });

  it("stays under 1,500 characters with a huge note, and the safety line survives", () => {
    const text = buildPrompt({ pathname: "/", finding, note: "n".repeat(5000) });
    expect(text.length).toBeLessThanOrEqual(PROMPT_CAP);
    expect(text.endsWith(UNTRUSTED_LINE)).toBe(true);
    expect(text).toContain("My note: nnn");
    expect(text).toContain("…");
  });

  it("keeps the note when it fits, whole", () => {
    const text = buildPrompt({ pathname: "/", finding, note: "short" });
    expect(text).toContain("My note: short");
    expect(text).not.toContain("…");
  });

  it("strips control characters from the note and keeps its line breaks", () => {
    const text = buildPrompt({ pathname: "/", finding, note: "one\u0000\ntwo‮" });
    expect(text).toContain("My note: one\ntwo");
    expect(text).not.toMatch(/[\u0000‮]/);
  });

  it("cuts a path that is far too long", () => {
    expect(buildPrompt({ pathname: "/" + "p".repeat(500), finding }).split("\n")[0]!.length).toBeLessThan(160);
  });
});

describe("userFindingInput", () => {
  it("copies only data-, aria- and role attributes, at most 12, and the text head", () => {
    const el = document.createElement("section");
    el.setAttribute("data-section", "hero");
    el.setAttribute("aria-label", "Intro");
    el.setAttribute("role", "region");
    el.setAttribute("onclick", "alert(1)");
    el.setAttribute("style", "color: red");
    for (let i = 0; i < 20; i++) el.setAttribute(`data-k${i}`, "v");
    el.textContent = "Hello ".repeat(30);
    const input = userFindingInput(el, { x: 0, y: 0, w: 1, h: 1, scrollX: 0, scrollY: 0 }, "section.hero", "main > section", "note");
    expect(input.detector).toBe("user");
    expect(Object.keys(input.props).length).toBeLessThanOrEqual(12);
    expect(input.props["onclick"]).toBeUndefined();
    expect(input.props["style"]).toBeUndefined();
    expect(input.props["data-section"]).toBe("hero");
    expect(input.text.length).toBeLessThanOrEqual(60);
    expect(input.comment).toBe("note");
  });
});

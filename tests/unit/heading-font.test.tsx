import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Heading } from "../../packages/ui/src";

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("Heading font role", () => {
  it("uses display for h1 and h2", () => {
    expect(html(<Heading as="h1">x</Heading>)).toContain("font-display");
    expect(html(<Heading>x</Heading>)).toContain("font-display");
  });
  it("uses the subheading font for h3-h6", () => {
    for (const t of ["h3", "h4", "h5", "h6"]) {
      const out = html(<Heading as={t as "h3"}>x</Heading>);
      expect(out).toContain("font-subheading");
      expect(out).not.toContain("font-display");
    }
  });
  it("keeps display for display sizes and non-heading tags", () => {
    expect(html(<Heading as="h3" size="3xl">x</Heading>)).toContain("font-display");
    expect(html(<Heading as="div">x</Heading>)).toContain("font-display");
  });
  it("lets an explicit font class win", () => {
    const out = html(<Heading as="h3" className="font-display">x</Heading>);
    expect(out).toContain("font-display");
    expect(out).not.toContain("font-subheading");
  });
});

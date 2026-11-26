import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StatCard } from "../../packages/ui/src";

describe("StatCard alert", () => {
  it("never underlines the value (an underline reads as a link)", () => {
    const html = renderToStaticMarkup(<StatCard label="To ship" value="2" alert />);
    expect(html).not.toMatch(/underline/);
  });

  it("marks the card with a warning dot and text for screen readers", () => {
    const html = renderToStaticMarkup(<StatCard label="To ship" value="2" alert />);
    expect(html).toMatch(/bg-warning/);
    expect(html).toMatch(/Needs attention: /);
    expect(html).toMatch(/aria-hidden="true"/);
  });

  it("renders the plain card when alert is off", () => {
    const html = renderToStaticMarkup(<StatCard label="Orders" value="8" />);
    expect(html).not.toMatch(/bg-warning|Needs attention/);
  });
});

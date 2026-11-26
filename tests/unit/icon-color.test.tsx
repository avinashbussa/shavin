import { describe, expect, it, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { Button, Icon, IconButton } from "@shavin/ui";
import { preloadIcons } from "@shavin/ui";

// <Icon name> loads each icon on demand; these tests render synchronously, so load icons first.
beforeAll(() => preloadIcons(), 60_000);

const svgOf = (c: HTMLElement) => c.querySelector("svg") as SVGElement;

describe("icon colour inheritance", () => {
  it("a bare Icon follows its parent's text colour by default", () => {
    const { container } = render(<span className="text-brand-fg"><Icon name="arrow-right" /></span>);
    expect(svgOf(container).getAttribute("class")).toContain("text-inherit");
    expect(svgOf(container).getAttribute("class")).not.toContain("text-fg");
  });

  it("an explicit colour still wins", () => {
    const { container } = render(<Icon name="arrow-right" color="muted" />);
    expect(svgOf(container).getAttribute("class")).toContain("text-fg-muted");
  });

  it("IconButton and Button force their icons to inherit", () => {
    const a = render(<IconButton aria-label="Next"><Icon name="arrow-right" color="muted" /></IconButton>);
    expect(a.container.querySelector("button")?.className).toContain("[&_svg]:!text-inherit");
    const b = render(<Button iconRight={<Icon name="arrow-right" color="muted" />}>Go</Button>);
    const slot = b.container.querySelector("button > span:last-child");
    expect(slot?.getAttribute("class")).toContain("[&>svg]:!text-inherit");
  });
});

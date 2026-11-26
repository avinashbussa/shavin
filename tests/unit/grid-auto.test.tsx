import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Grid } from "@shavin/ui";

const MIN = { xs: "10rem", sm: "14rem", md: "18rem", lg: "24rem", xl: "32rem" } as const;

describe('Grid columns="auto" is intrinsic (container-driven, no viewport breakpoints)', () => {
  for (const [size, rem] of Object.entries(MIN)) {
    it(`minWidth ${size} wraps at ${rem} and is capped at the container width`, () => {
      const { container } = render(<Grid columns="auto" minWidth={size as keyof typeof MIN}>x</Grid>);
      expect((container.firstElementChild as HTMLElement).className).toContain(
        `grid-cols-[repeat(auto-fit,minmax(min(100%,${rem}),1fr))]`,
      );
    });
  }

  it("defaults to md and carries no fixed column count or breakpoint classes", () => {
    const { container } = render(<Grid columns="auto">x</Grid>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("min(100%,18rem)");
    expect(cls).not.toMatch(/(^|\s)grid-cols-\d/);
    expect(cls).not.toMatch(/max-(sm|md|lg)/);
  });

  it("leaves numeric columns untouched", () => {
    const { container } = render(<Grid columns="3" stack="auto">x</Grid>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("grid-cols-3");
    expect(cls).not.toContain("auto-fit");
  });

  it("maxColumns caps tracks using the gap and the cap, and keeps minWidth as a floor", () => {
    const { container } = render(<Grid columns="auto" minWidth="sm" maxColumns="3" gap="5">x</Grid>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("[--grid-max:3]");
    expect(cls).toContain("[--grid-min:14rem]");
    expect(cls).toContain("[--grid-gap:1.5rem]");
    expect(cls).toContain("var(--grid-max)");
    // the uncapped class must not be emitted alongside it
    expect(cls).not.toContain("minmax(min(100%,14rem),1fr)");
  });

  it("without maxColumns the uncapped class is used", () => {
    const { container } = render(<Grid columns="auto" minWidth="sm">x</Grid>);
    expect((container.firstElementChild as HTMLElement).className).not.toContain("--grid-max)");
  });
});

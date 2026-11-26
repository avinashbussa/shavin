import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Heading } from "@shavin/ui";

const cls = (ui: React.ReactElement) => render(ui).container.firstElementChild!.className;

describe("Heading fluid sizes", () => {
  it("4xl and 5xl use one fluid size, not viewport steps", () => {
    for (const size of ["4xl", "5xl", "10", "11"] as const) {
      const c = cls(<Heading size={size}>Title</Heading>);
      expect(c).toMatch(/text-\[clamp\(2\.25rem,[^\]]+cqi,(3\.75|4\.5)rem\)\]/);
      expect(c).not.toMatch(/\b(sm|md|lg):text-/);
    }
  });

  it("keeps the old floor and ceilings (36-60px, 36-72px)", () => {
    expect(cls(<Heading size="4xl">T</Heading>)).toContain("text-[clamp(2.25rem,1.05rem_+_4.8cqi,3.75rem)]");
    expect(cls(<Heading size="5xl">T</Heading>)).toContain("text-[clamp(2.25rem,0.96rem_+_5.14cqi,4.5rem)]");
  });

  it("a text-* size in className replaces the fluid size and keeps the colour", () => {
    const c = cls(<Heading size="5xl" className="text-6xl">T</Heading>);
    expect(c).toContain("text-6xl");
    expect(c).not.toContain("clamp(");
    expect(c).toContain("text-fg");
  });

  it("stepped sizes can still be written by hand", () => {
    const c = cls(<Heading size="5xl" className="text-4xl md:text-6xl">T</Heading>);
    expect(c).not.toContain("clamp(");
    expect(c).toContain("text-4xl");
    expect(c).toContain("md:text-6xl");
  });

  it("xl, 2xl and 3xl are fluid with the old desktop size as their ceiling", () => {
    expect(cls(<Heading size="xl">T</Heading>)).toContain("text-[clamp(1.5rem,1.2rem_+_1.2cqi,1.875rem)]");
    expect(cls(<Heading size="2xl">T</Heading>)).toContain("text-[clamp(1.875rem,1.575rem_+_1.2cqi,2.25rem)]");
    expect(cls(<Heading size="3xl">T</Heading>)).toContain("text-[clamp(2.25rem,1.65rem_+_2.4cqi,3rem)]");
  });

  it("sm, md and lg stay fixed", () => {
    expect(cls(<Heading size="lg">T</Heading>)).toMatch(/\btext-2xl\b/);
    expect(cls(<Heading size="md">T</Heading>)).toMatch(/\btext-xl\b/);
    expect(cls(<Heading size="sm">T</Heading>)).toMatch(/\btext-lg\b/);
    expect(cls(<Heading size="lg">T</Heading>)).not.toContain("clamp(");
  });
});

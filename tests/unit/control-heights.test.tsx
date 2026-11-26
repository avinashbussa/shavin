import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Avatar, Button, Select, TextArea, TextField } from "@shavin/ui";

const HEIGHT = { sm: "h-8", md: "h-10", lg: "h-12" } as const;
const options = [{ value: "a", label: "A" }];

describe("form controls share one height scale with Button", () => {
  for (const size of ["sm", "md", "lg"] as const) {
    it(`${size}: TextField, Select and Button all use ${HEIGHT[size]}`, () => {
      const { container } = render(
        <div>
          <TextField size={size} aria-label="t" />
          <Select size={size} ariaLabel="s" options={options} />
          <Button size={size}>Go</Button>
        </div>,
      );
      const input = container.querySelector("input") as HTMLElement;
      const trigger = container.querySelector("[role=combobox]") as HTMLElement;
      const button = container.querySelector("button:not([role=combobox])") as HTMLElement;
      for (const el of [input, trigger, button]) expect(el.className).toContain(HEIGHT[size]);
    });
  }

  it("md inputs are 16px on small screens (no iOS zoom) and 14px from md up, with no per-kit override needed", () => {
    const { container } = render(<div><TextField aria-label="t" /><TextArea aria-label="a" /><Select ariaLabel="s" options={options} /></div>);
    for (const el of [container.querySelector("input"), container.querySelector("textarea"), container.querySelector("[role=combobox]")]) {
      expect(el?.className).toContain("text-base");
      expect(el?.className).toContain("md:text-sm");
    }
  });
});

describe("Avatar colour fallback", () => {
  it("tints the fallback by colour and variant, neutral by default", async () => {
    const { findByText, rerender } = render(<Avatar fallback="AB" />);
    expect((await findByText("AB")).className).toContain("bg-surface-hover");
    rerender(<Avatar fallback="AB" color="brand" variant="solid" />);
    expect((await findByText("AB")).className).toContain("bg-brand");
    expect((await findByText("AB")).className).toContain("text-brand-fg");
  });
});

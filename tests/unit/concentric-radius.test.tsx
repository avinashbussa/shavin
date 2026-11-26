import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CONCENTRIC_FLOOR,
  concentricContainerStyle,
  concentricRadius,
  paddingScaleFromClassName,
} from "../../packages/ui/src/lib/concentric";
import * as ui from "../../packages/ui/src/index";
import { Card } from "../../packages/ui/src/primitives/Card/Card";
import { Box } from "../../packages/ui/src/primitives/Box/Box";
import { Flex } from "../../packages/ui/src/primitives/Flex/Flex";
import { scopedThemeVars, themeCss } from "../../packages/ui/src/lib/theme-presets";

const inner = (el: HTMLElement) => el.style.getPropertyValue("--radius-panel-inner");

describe("concentric radius helpers (F1-F4)", () => {
  it("no padding: inner radius is the outer one, minus the border", () => {
    expect(concentricRadius("0")).toBe("var(--radius-panel)");
    expect(concentricRadius("0", { border: true })).toBe("max(0px, calc(var(--radius-panel) - 1px))");
  });

  it("padding subtracts with the floor", () => {
    expect(concentricRadius("4")).toBe(`max(${CONCENTRIC_FLOOR}, calc(var(--radius-panel) - 1rem))`);
  });

  it("never references --radius-panel-inner inside its own value (no CSS cycle)", () => {
    for (const p of ["0", "1", "4", "8"]) {
      const v = (concentricContainerStyle(p) as Record<string, string>)["--radius-panel-inner"];
      expect(v).not.toContain("--radius-panel-inner");
    }
  });

  it("Card padding none sets the inner radius instead of inheriting an ancestor's", () => {
    const s = concentricContainerStyle("none", true, { border: true }) as Record<string, string>;
    expect(s["--radius-panel-inner"]).toBe("max(0px, calc(var(--radius-panel) - 1px))");
  });

  it("the self-referencing compound helper is gone", () => {
    expect((ui as Record<string, unknown>).concentricCompoundStyle).toBeUndefined();
  });

  it("reads the real padding from className", () => {
    expect(paddingScaleFromClassName("p-6 gap-2")).toBe("6");
    expect(paddingScaleFromClassName("px-4 py-8")).toBe("4");
    expect(paddingScaleFromClassName("px-4")).toBe("0");
    expect(paddingScaleFromClassName("md:p-8 text-fg")).toBe("0");
    expect(paddingScaleFromClassName(undefined)).toBe("0");
  });
});

describe("containers use their real padding", () => {
  it("translucent Box/Flex subtract the className padding, not a hardcoded p-4", () => {
    const { container } = render(
      <>
        <Box translucent className="p-8">a</Box>
        <Flex translucent className="p-2">b</Flex>
      </>,
    );
    const [box, flex] = Array.from(container.children) as HTMLElement[];
    expect(inner(box)).toContain("2rem");
    expect(inner(flex)).toContain("0.5rem");
  });

  it("a Card inside a Card takes the parent's inner radius as its outer radius", () => {
    const { container } = render(
      <Card padding="md">
        <Card padding="sm">x</Card>
      </Card>,
    );
    const outer = container.firstElementChild as HTMLElement;
    const nested = outer.querySelector("div") as HTMLElement;
    const parentInner = inner(outer);
    expect(parentInner).toContain("1.25rem");
    expect(nested.style.borderRadius).toBe(parentInner);
    expect(inner(nested)).toContain(parentInner);
  });

  it("a top-level Card keeps the panel radius from its class", () => {
    const { container } = render(<Card padding="md">x</Card>);
    expect((container.firstElementChild as HTMLElement).style.borderRadius).toBe("");
  });
});

describe("radius presets reset the inner radius", () => {
  it("scopedThemeVars sets --radius-panel-inner with the scope's radius", () => {
    expect(scopedThemeVars(undefined, undefined, "large")["--radius-panel-inner"]).toBe("1.5rem");
  });

  it("themeCss sets --radius-panel-inner with the theme's radius", () => {
    expect(themeCss({ radius: "small" })).toMatch(/--radius-panel-inner:\s*0\.5rem/);
  });

  it("applyRadiusPreset sets --radius-panel-inner on the root", () => {
    ui.applyRadiusPreset("large");
    expect(document.documentElement.style.getPropertyValue("--radius-panel-inner")).toBe("1.5rem");
    ui.applyRadiusPreset("medium");
  });
});

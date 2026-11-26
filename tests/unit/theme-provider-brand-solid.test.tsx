import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Button, Badge, ScopedThemeProvider, ThemeProvider } from "@shavin/ui";
import { brandSolidFor, resolveBrandTriplet, scopedThemeVars, themeCss } from "../../packages/ui/src/lib/theme-presets";

/**
 * ThemeProvider / ScopedThemeProvider `brandSolid`: the data attribute, the tokens it writes (first
 * paint and runtime), inheritance, and the development-only warning for "perceptual".
 */
const root = () => document.documentElement;
const prop = (name: string) => root().style.getPropertyValue(name);

beforeEach(() => {
  root().removeAttribute("style");
  root().removeAttribute("data-brand-solid");
  root().classList.remove("dark");
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("ThemeProvider brandSolid", () => {
  const blue = resolveBrandTriplet("Blue", false);
  const expected = (mode: "accessible" | "exact" | "perceptual") => brandSolidFor(blue, false, mode);

  it("defaults to accessible: darker fill, white text, data attribute on <html>", () => {
    render(<ThemeProvider brandColor="Blue" devTools={false} />);
    expect(root().dataset.brandSolid).toBe("accessible");
    const s = expected("accessible");
    expect(prop("--brand")).toBe(blue);
    expect(prop("--brand-solid")).toBe(s.fill);
    expect(prop("--brand-solid-hover")).toBe(s.hover);
    expect(prop("--brand-fg")).toBe("255 255 255");
    expect(s.fill).not.toBe(blue);
  });

  it.each(["exact", "perceptual"] as const)("brandSolid=%s writes that mode's tokens at runtime", (mode) => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ThemeProvider brandColor="Blue" brandSolid={mode} devTools={false} />);
    expect(root().dataset.brandSolid).toBe(mode);
    const s = expected(mode);
    expect(prop("--brand-solid")).toBe(blue);
    expect(prop("--brand-solid-hover")).toBe(s.hover);
    expect(prop("--brand-fg")).toBe(s.fg);
  });

  it("exact keeps the previous text colour (near-black on Blue), accessible and perceptual use white", () => {
    expect(expected("exact").fg).toBe("10 10 12");
    expect(expected("accessible").fg).toBe("255 255 255");
    expect(expected("perceptual").fg).toBe("255 255 255");
  });

  it("changing the prop re-applies the tokens", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<ThemeProvider brandColor="Blue" devTools={false} />);
    expect(prop("--brand-solid")).toBe(expected("accessible").fill);
    rerender(<ThemeProvider brandColor="Blue" brandSolid="exact" devTools={false} />);
    expect(root().dataset.brandSolid).toBe("exact");
    expect(prop("--brand-solid")).toBe(blue);
    expect(prop("--brand-fg")).toBe("10 10 12");
  });

  it("the server HTML carries the solid tokens, so there is no flash before hydration", () => {
    const html = renderToString(<ThemeProvider brandColor="Blue" devTools={false}><p>x</p></ThemeProvider>);
    expect(html).toContain(`--brand-solid:${expected("accessible").fill}`);
    expect(html).toContain("--brand-fg:255 255 255");
    const exact = renderToString(<ThemeProvider brandColor="Blue" brandSolid="exact" devTools={false}><p>x</p></ThemeProvider>);
    expect(exact).toContain(`--brand-solid:${blue}`);
    expect(exact).toContain("--brand-fg:10 10 12");
  });

  it("themeCss emits page, on-dark and on-light solid tokens", () => {
    const css = themeCss({ brandColor: "Blue" });
    for (const name of ["--brand-solid", "--brand-solid-hover", "--brand-on-dark-solid", "--brand-on-dark-solid-hover", "--brand-on-light-solid", "--brand-on-light-solid-hover"]) {
      expect(css, name).toContain(`${name}:`);
    }
  });

  it("unknown values fall back to accessible", () => {
    const css = themeCss({ brandColor: "Blue", brandSolid: "nonsense" as never });
    expect(css).toContain(`--brand-solid:${expected("accessible").fill}`);
  });
});

describe("brandSolid=perceptual warning", () => {
  it("warns once in development, naming the consequence and the way back", async () => {
    vi.resetModules();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mod = await import("@shavin/ui");
    const { render: r } = await import("@testing-library/react");
    r(<mod.ThemeProvider brandColor="Blue" brandSolid="perceptual" devTools={false} />);
    r(<mod.ThemeProvider brandColor="Red" brandSolid="perceptual" devTools={false} />);
    expect(warn).toHaveBeenCalledTimes(1);
    const msg = String(warn.mock.calls[0][0]);
    expect(msg).toContain('brandSolid="perceptual"');
    expect(msg).toContain("WCAG 2 AA");
    expect(msg).toContain("14 of the 24");
    expect(msg).toContain('brandSolid="accessible"');
  });

  it("is silent in production, and for accessible and exact", async () => {
    vi.resetModules();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    const mod = await import("@shavin/ui");
    const { render: r } = await import("@testing-library/react");
    r(<mod.ThemeProvider brandColor="Blue" brandSolid="perceptual" devTools={false} />);
    vi.unstubAllEnvs();
    r(<mod.ThemeProvider brandColor="Blue" brandSolid="exact" devTools={false} />);
    r(<mod.ThemeProvider brandColor="Blue" devTools={false} />);
    expect(warn).not.toHaveBeenCalled();
  });

  it("does not run on the server", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderToString(<ThemeProvider brandColor="Blue" brandSolid="perceptual" devTools={false}><p>x</p></ThemeProvider>);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("ScopedThemeProvider brandSolid", () => {
  it("scopedThemeVars writes the mode's solid tokens", () => {
    const blue = resolveBrandTriplet("Blue", false);
    const acc = scopedThemeVars("Blue", undefined, undefined, false, undefined, undefined, undefined, "rgb", "accessible");
    expect(acc["--brand-solid"]).toBe(brandSolidFor(blue, false).fill);
    expect(acc["--brand-fg"]).toBe("255 255 255");
    const ex = scopedThemeVars("Blue", undefined, undefined, false, undefined, undefined, undefined, "rgb", "exact");
    expect(ex["--brand-solid"]).toBe(blue);
    expect(ex["--brand-fg"]).toBe("10 10 12");
    const dark = scopedThemeVars("Blue", undefined, undefined, true, undefined, undefined, undefined, "rgb", "accessible");
    expect(dark["--brand-solid-hover"]).toBe(brandSolidFor(resolveBrandTriplet("Blue", true), true).hover);
  });

  it("a scope without a brand maps to the on-light/on-dark solid tokens of the root", () => {
    const v = scopedThemeVars(undefined, undefined, undefined, true);
    expect(v["--brand-solid"]).toBe("var(--brand-on-dark-solid, var(--brand-solid))");
    expect(v["--brand-solid-hover"]).toBe("var(--brand-on-dark-solid-hover, var(--brand-solid-hover))");
  });

  it("inherits the mode from the ThemeProvider above when unset, and overrides it when set", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const blue = resolveBrandTriplet("Blue", false);
    const { container } = render(
      <ThemeProvider brandColor="Violet" brandSolid="exact" devTools={false}>
        <ScopedThemeProvider data-testid="inherits" brandColor="Blue" />
        <ScopedThemeProvider data-testid="own" brandColor="Blue" brandSolid="accessible" />
        <ScopedThemeProvider data-testid="plain" />
        <ScopedThemeProvider data-testid="modeOnly" brandSolid="accessible" />
      </ThemeProvider>,
    );
    const el = (id: string) => container.querySelector(`[data-testid="${id}"]`) as HTMLElement;
    expect(el("inherits").dataset.brandSolid).toBe("exact");
    expect(el("inherits").style.getPropertyValue("--brand-solid")).toBe(blue);
    expect(el("own").dataset.brandSolid).toBe("accessible");
    expect(el("own").style.getPropertyValue("--brand-solid")).toBe(brandSolidFor(blue, false).fill);
    // No brand and no mode of its own: leaves the root's tokens alone (CSS inheritance).
    expect(el("plain").dataset.brandSolid).toBeUndefined();
    expect(el("plain").style.getPropertyValue("--brand-solid")).toContain("var(--brand-on-light-solid");
    // Only a mode, different from the root's: re-derived from the brand the root resolved (Violet).
    expect(el("modeOnly").dataset.brandSolid).toBe("accessible");
    expect(el("modeOnly").style.getPropertyValue("--brand-solid")).toBe(brandSolidFor(resolveBrandTriplet("Violet", false), false, "accessible").fill);
  });

  it("defaults to accessible with no ThemeProvider at all", () => {
    const blue = resolveBrandTriplet("Blue", false);
    const { container } = render(<ScopedThemeProvider data-testid="s" brandColor="Blue" />);
    const s = container.querySelector('[data-testid="s"]') as HTMLElement;
    expect(s.dataset.brandSolid).toBe("accessible");
    expect(s.style.getPropertyValue("--brand-solid")).toBe(brandSolidFor(blue, false).fill);
  });
});

describe("solid primitives use the accessible fill and keep their disabled look", () => {
  it("solid brand Button is bg-brand-solid with text-brand-fg and a hover fill, not an opacity hover", () => {
    const { getByRole } = render(<Button>Save</Button>);
    const cls = getByRole("button").className;
    expect(cls).toContain("bg-brand-solid");
    expect(cls).toContain("text-brand-fg");
    expect(cls).toContain("hover:bg-brand-solid-hover");
    expect(cls).not.toMatch(/(^|\s)bg-brand(\s|$)/);
    expect(cls).not.toContain("hover:opacity-90");
  });

  it("a disabled solid Button keeps its disabled look (no hover fill, reduced opacity)", () => {
    const { getByRole } = render(<Button disabled>Save</Button>);
    const cls = getByRole("button").className;
    expect(cls).toMatch(/disabled:opacity|opacity-50|data-\[inert\]/);
    expect(cls).toContain("[&:not([data-inert])]:hover:bg-brand-solid-hover");
  });

  it("solid brand Badge uses the solid fill", () => {
    const { container } = render(<Badge variant="solid" tone="brand">New</Badge>);
    expect((container.firstChild as HTMLElement).className).toContain("bg-brand-solid");
    expect((container.firstChild as HTMLElement).className).toContain("text-brand-fg");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  Button,
  Checkbox,
  Combobox,
  Dropdown,
  IconButton,
  Link,
  Radio,
  RadioGroup,
  ScopedThemeProvider,
  SegmentedControl,
  SegmentedControlItem,
  Switch,
  Tabs,
  TextField,
  ThemeProvider,
} from "@shavin/ui";
import { hitAreaClass, resetHitAreaWarnings } from "../../packages/ui/src/lib/hit-area";

/**
 * Target-size switch and per-component overrides (docs: "Target size"). Real layout (sizes at a fine and a
 * coarse pointer, in both modes) is asserted in tests/a11y/tap-targets; this file covers the plumbing in jsdom:
 * the provider attribute, the override classes on the elements, and the shipped CSS tokens.
 */
// The older tests below pass hitArea="none" on purpose; keep their dev warnings out of the output.
const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

const css = readFileSync(resolve(__dirname, "../../packages/ui/src/styles/base.css"), "utf8");

describe("hitAreaClass", () => {
  it("adds nothing for default, hit-area-none for none, the force modifier for touch", () => {
    expect(hitAreaClass(undefined)).toBe("");
    expect(hitAreaClass("default")).toBe("");
    expect(hitAreaClass("none")).toBe("hit-area-none");
    expect(hitAreaClass("touch")).toBe("hit-area-touch hit-area-force");
    expect(hitAreaClass("touch", "floor")).toBe("hit-area-touch hit-area-force");
    expect(hitAreaClass("touch", "input")).toBe("hit-area-input hit-area-force");
    expect(hitAreaClass("none", "input")).toBe("hit-area-none");
  });
});

describe("hitArea=\"none\" development warning", () => {
  const original = process.env.NODE_ENV;
  beforeEach(() => {
    resetHitAreaWarnings();
    warn.mockClear();
  });
  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = original;
  });

  it("warns once per component type, naming the AA floor and how to restore it", () => {
    hitAreaClass("none", "touch", "Button");
    hitAreaClass("none", "touch", "Button");
    expect(warn).toHaveBeenCalledTimes(1);
    const msg = String(warn.mock.calls[0][0]);
    expect(msg).toContain("Button");
    expect(msg).toContain("2.5.8");
    expect(msg).toContain("24");
    expect(msg).toContain('hitArea="default"');
    hitAreaClass("none", "input", "TextField");
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("warns from a real component, once for many instances", () => {
    render(<><Button hitArea="none">a</Button><Button hitArea="none">b</Button><Switch hitArea="none" /></>);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls.map((c) => String(c[0])).join("\n")).toMatch(/Button[\s\S]*Switch/);
  });

  it("does not warn in production", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    hitAreaClass("none", "touch", "Button");
    expect(warn).not.toHaveBeenCalled();
  });

  it("stays silent without a window (server rendering) and still returns the class", () => {
    vi.stubGlobal("window", undefined);
    try {
      expect(hitAreaClass("none", "touch", "Button")).toBe("hit-area-none");
    } finally {
      vi.unstubAllGlobals();
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it("does not warn for default, touch or unset", () => {
    hitAreaClass(undefined, "touch", "Button");
    hitAreaClass("default", "touch", "Button");
    hitAreaClass("touch", "touch", "Button");
    render(<Button>x</Button>);
    render(<Button hitArea="touch">x</Button>);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("ThemeProvider touchTargets", () => {
  it("defaults to comfortable and writes data-touch-targets on <html>, removed on unmount", () => {
    const { unmount } = render(<ThemeProvider devTools={false} />);
    expect(document.documentElement.getAttribute("data-touch-targets")).toBe("comfortable");
    unmount();
    expect(document.documentElement.hasAttribute("data-touch-targets")).toBe(false);
  });

  it("compact sets the attribute and follows prop changes", () => {
    const { rerender, unmount } = render(<ThemeProvider devTools={false} touchTargets="compact" />);
    expect(document.documentElement.getAttribute("data-touch-targets")).toBe("compact");
    rerender(<ThemeProvider devTools={false} touchTargets="comfortable" />);
    expect(document.documentElement.getAttribute("data-touch-targets")).toBe("comfortable");
    unmount();
  });

  it("compact also puts the token in the server HTML so the first paint is compact", () => {
    const html = renderToString(<ThemeProvider devTools={false} touchTargets="compact" />);
    expect(html).toContain("--tap-min-touch:var(--tap-min");
    expect(renderToString(<ThemeProvider devTools={false} />)).not.toContain("shavin-touch-targets");
  });
});

describe("ScopedThemeProvider touchTargets", () => {
  it("writes data-touch-targets on its container, and nothing when unset (it inherits)", () => {
    const a = render(<ScopedThemeProvider touchTargets="compact" data-testid="s" />);
    expect(a.getByTestId("s").getAttribute("data-touch-targets")).toBe("compact");
    const b = render(<ScopedThemeProvider data-testid="t" />);
    expect(b.getByTestId("t").hasAttribute("data-touch-targets")).toBe(false);
  });
});

describe("ScopedThemeProvider inheritance (documented: unset inherits, explicit overrides)", () => {
  const effective = (el: Element) => el.closest("[data-touch-targets]")?.getAttribute("data-touch-targets") ?? "comfortable";

  it("a compact page keeps an unset scoped island compact; an explicit comfortable island overrides", () => {
    const { getByTestId, unmount } = render(
      <>
        <ThemeProvider devTools={false} touchTargets="compact" />
        <ScopedThemeProvider data-testid="unset"><Button>a</Button></ScopedThemeProvider>
        <ScopedThemeProvider touchTargets="comfortable" data-testid="explicit"><Button>b</Button></ScopedThemeProvider>
      </>,
    );
    expect(document.documentElement.getAttribute("data-touch-targets")).toBe("compact");
    expect(getByTestId("unset").hasAttribute("data-touch-targets")).toBe(false);
    expect(effective(getByTestId("unset"))).toBe("compact");
    expect(effective(getByTestId("explicit"))).toBe("comfortable");
    unmount();
  });

  it("the CSS only keys on the attribute, so an island without it inherits the token from its parent", () => {
    expect(css).toMatch(/\[data-touch-targets="compact"\]\s*\{/);
    expect(css).toMatch(/\[data-touch-targets="comfortable"\]\s*\{/);
    expect(css).not.toMatch(/--tap-min-touch:[^;}]*;[^}]*\}\s*\[data-scope-theme/);
  });
});

describe("shipped CSS (base.css)", () => {
  it("declares the public tokens and the compact fallback", () => {
    expect(css).toMatch(/:root\s*\{[^}]*--tap-min:\s*24px/);
    expect(css).toMatch(/:root\s*\{[^}]*--tap-min-touch:\s*44px/);
    expect(css).toMatch(/\[data-touch-targets="compact"\]\s*\{\s*--tap-min-touch:\s*var\(--tap-min/);
    expect(css).toMatch(/\[data-touch-targets="comfortable"\]\s*\{\s*--tap-min-touch:\s*44px/);
  });

  it("has no hard-coded 24px/44px left in the utilities, only the token defaults", () => {
    const utilities = css.slice(css.indexOf(":where(.hit-area, .hit-area-touch) {")).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of utilities.matchAll(/(\d+)px/g)) {
      // every px in the utilities is a var() fallback or the documented 44px force floor
      const at = utilities.slice(Math.max(0, m.index! - 40), m.index! + 6);
      expect(at, at).toMatch(/var\(--tap-min(-touch)?,\s*\d+px|44px\)/);
    }
  });

  it("ships the five utilities", () => {
    for (const c of ["hit-area", "hit-area-touch", "hit-area-force", "hit-area-input", "hit-area-none"]) {
      expect(css).toContain(`.${c}`);
    }
  });

  it("the opt-out is zero specificity and later than the utilities, so a consumer's own ::after still wins over it", () => {
    expect(css).toMatch(/:where\(\.hit-area-none\)::after\s*\{[^}]*content:\s*revert/);
    expect(css.indexOf(":where(.hit-area-none)::after")).toBeGreaterThan(css.indexOf(":where(.hit-area, .hit-area-touch)::after"));
  });
});

const has = (el: Element, c: string) => el.classList.contains(c);

describe("hitArea prop on components", () => {
  it("Button: default keeps hit-area-touch, none adds hit-area-none, touch adds the force modifier", () => {
    const { getByText: text } = render(
      <>
        <Button>d</Button>
        <Button hitArea="none">n</Button>
        <Button hitArea="touch">t</Button>
      </>,
    );
    const getByText = (t: string) => text(t).closest("button")!;
    expect(has(getByText("d"), "hit-area-touch")).toBe(true);
    expect(has(getByText("d"), "hit-area-none")).toBe(false);
    expect(has(getByText("n"), "hit-area-none")).toBe(true);
    expect(has(getByText("t"), "hit-area-force")).toBe(true);
  });

  it("IconButton, Switch, Checkbox honour it", () => {
    const { getByLabelText } = render(
      <>
        <IconButton aria-label="ib" hitArea="none">x</IconButton>
        <Switch aria-label="sw" hitArea="none" />
        <Checkbox aria-label="cb" hitArea="touch" />
      </>,
    );
    expect(has(getByLabelText("ib"), "hit-area-none")).toBe(true);
    expect(has(getByLabelText("sw"), "hit-area-none")).toBe(true);
    expect(has(getByLabelText("cb"), "hit-area-force")).toBe(true);
  });

  it("RadioGroup passes it to the radios and Radio can override the group", () => {
    const { getAllByRole } = render(
      <RadioGroup hitArea="none" defaultValue="a" aria-label="g">
        <Radio value="a" aria-label="a" />
        <Radio value="b" aria-label="b" hitArea="touch" />
      </RadioGroup>,
    );
    const [a, b] = getAllByRole("radio");
    expect(has(a, "hit-area-none")).toBe(true);
    expect(has(b, "hit-area-force")).toBe(true);
  });

  it("Tabs and SegmentedControl pass it to every trigger", () => {
    const t = render(<Tabs hitArea="none" items={[{ value: "a", label: "A" }, { value: "b", label: "B" }]} defaultValue="a" aria-label="t" />);
    t.getAllByRole("tab").forEach((el) => expect(has(el, "hit-area-none")).toBe(true));
    const s = render(
      <SegmentedControl hitArea="none" defaultValue="a" aria-label="s">
        <SegmentedControlItem value="a" label="A" />
        <SegmentedControlItem value="b" label="B" hitArea="touch" />
      </SegmentedControl>,
    );
    const radios = s.getAllByRole("radio");
    expect(has(radios[0], "hit-area-none")).toBe(true);
    expect(has(radios[1], "hit-area-force")).toBe(true);
  });

  it("native inputs: default carries hit-area-input (grows on touch via CSS), none drops it, touch forces it", () => {
    const { getByLabelText } = render(
      <>
        <TextField aria-label="tf" />
        <TextField aria-label="tfn" hitArea="none" />
        <TextField aria-label="tft" hitArea="touch" />
        <Combobox aria-label="cb" value="" onChange={() => {}} options={["a"]} />
        <Combobox aria-label="cbn" value="" onChange={() => {}} options={["a"]} hitArea="none" />
        <Dropdown variant="native" ariaLabel="dd" options={[{ value: "a", label: "A" }]} />
        <Dropdown variant="native" ariaLabel="ddn" options={[{ value: "a", label: "A" }]} hitArea="none" />
      </>,
    );
    expect(has(getByLabelText("tf"), "hit-area-input")).toBe(true);
    expect(has(getByLabelText("tf"), "hit-area-none")).toBe(false);
    expect(has(getByLabelText("tfn"), "hit-area-none")).toBe(true);
    expect(has(getByLabelText("tft"), "hit-area-force")).toBe(true);
    expect(has(getByLabelText("cb"), "hit-area-input")).toBe(true);
    expect(has(getByLabelText("cbn"), "hit-area-none")).toBe(true);
    expect(has(getByLabelText("dd"), "hit-area-input")).toBe(true);
    expect(has(getByLabelText("ddn"), "hit-area-none")).toBe(true);
  });

  it("no component still hard-codes a 44px coarse-pointer min-height", () => {
    for (const f of ["TextField/TextField", "Combobox/Combobox", "Dropdown/Dropdown"]) {
      const src = readFileSync(resolve(__dirname, `../../packages/ui/src/primitives/${f}.tsx`), "utf8");
      expect(src).not.toContain("min-h-11");
    }
  });
});

describe("Link standalone", () => {
  it("an inline link is unchanged; standalone gets the 24px hit area; it can be opted out or raised", () => {
    const { getByText } = render(
      <>
        <Link href="#a">inline</Link>
        <Link href="#b" standalone>alone</Link>
        <Link href="#c" standalone hitArea="none">none</Link>
        <Link href="#d" standalone hitArea="touch">touch</Link>
      </>,
    );
    expect(has(getByText("inline"), "hit-area")).toBe(false);
    expect(has(getByText("alone"), "hit-area")).toBe(true);
    expect(has(getByText("none"), "hit-area-none")).toBe(true);
    expect(has(getByText("touch"), "hit-area-force")).toBe(true);
  });

  it("underline=\"none\" implies standalone, and standalone={false} opts out", () => {
    const { getByText } = render(
      <>
        <Link href="#a" underline="none">nav</Link>
        <Link href="#b" underline="none" standalone={false}>optout</Link>
        <Link href="#c" underline="always">underlined</Link>
      </>,
    );
    expect(has(getByText("nav"), "hit-area")).toBe(true);
    expect(has(getByText("optout"), "hit-area")).toBe(false);
    expect(has(getByText("underlined"), "hit-area")).toBe(false);
  });
});

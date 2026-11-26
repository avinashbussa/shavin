import * as React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within, cleanup, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShavinDevTools } from "../../../packages/ui/src/primitives/ShavinDevTools";
import { BRAND_PRESETS, GRAY_PRESETS } from "../../../packages/ui/src/lib/theme-presets";

/**
 * Guards the theme controls of the dev inspector: the same behaviour before and after they moved into the shared
 * theme controller. It drives the real panel (the legacy panel's Theme tab) through the controls people use.
 */
const reset = () => {
  localStorage.clear();
  sessionStorage.clear();
  document.documentElement.className = "";
  document.documentElement.removeAttribute("style");
};

beforeEach(() => {
  reset();
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) }) as Response));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  reset();
});

async function openPanel() {
  localStorage.setItem("shavin-inspector-bar", JSON.stringify({ anchor: "bottom-right", collapsed: false }));
  render(<ShavinDevTools forceShow />);
  // The Theme tool of the control bar opens the floating Theme panel (the legacy panel's Theme tab is gone).
  const tool = await screen.findByRole("button", { name: "Theme" }, { timeout: 30000 });
  await userEvent.click(tool);
  await screen.findByText("Brand Color", {}, { timeout: 30000 });
}

// The first test pays for loading the lazy panel and the fonts bundle.
describe("the Theme controls", { timeout: 60000 }, () => {
  it("lists every control the tab has always had", async () => {
    await openPanel();
    for (const label of ["Theme", "Brand Color", "Custom Hex", "Gray Family", "Appearance", "Radius", "Scaling", "Panel Style", "Heading Font", "Subheading Font", "Body Font"]) {
      expect(screen.getAllByText(label).length, label).toBeGreaterThan(0);
    }
    expect(screen.getByRole("button", { name: "Reset to project theme" })).toBeTruthy();
    expect(screen.getByText("Copy Theme Code")).toBeTruthy();
    expect(screen.getByText("Theme Code")).toBeTruthy();
  });

  it("a brand swatch sets the brand on the page and remembers it", async () => {
    await openPanel();
    const preset = BRAND_PRESETS.find((p) => p.name !== "Blue")!;
    await userEvent.click(screen.getByTitle(preset.name));
    expect(localStorage.getItem("shavin-brand")).toBe(preset.hex);
    expect(document.documentElement.style.getPropertyValue("--brand")).not.toBe("");
  });

  it("Appearance toggles dark mode on the page", async () => {
    await openPanel();
    await userEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("shavin-appearance")).toBe("dark");
    await userEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("shavin-appearance")).toBe("light");
  });

  it("Radius and Gray write the page's variables and storage", async () => {
    await openPanel();
    await userEvent.click(screen.getByRole("button", { name: "Large" }));
    expect(localStorage.getItem("shavin-radius")).toBe("large");
    const gray = GRAY_PRESETS.find((g) => g.name !== "Zinc")!;
    await userEvent.click(screen.getByTitle(gray.name));
    expect(localStorage.getItem("shavin-gray")).toBe(gray.name);
  });

  it("Panel Style switches between solid and translucent", async () => {
    await openPanel();
    const translucent = screen.getAllByRole("button").find((b) => /^Translucent$/i.test(b.textContent ?? ""))!;
    await userEvent.click(translucent);
    expect(localStorage.getItem("shavin-panel")).toBe("translucent");
    const solid = screen.getAllByRole("button").find((b) => /^Solid$/i.test(b.textContent ?? ""))!;
    await userEvent.click(solid);
    expect(localStorage.getItem("shavin-panel")).toBe("solid");
  });

  it("the Theme Code snippet follows the choices", async () => {
    await openPanel();
    await userEvent.click(screen.getByRole("button", { name: "Large" }));
    const pre = document.querySelector("pre")!;
    await waitFor(() => expect(pre.textContent).toMatch(/radius="large"/));
    expect(pre.textContent).toMatch(/<ThemeProvider/);
  });

  it("Copy Theme Code copies the snippet and says so", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await openPanel();
    await userEvent.click(screen.getByText("Copy Theme Code"));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(String(writeText.mock.calls[0]![0])).toMatch(/<ThemeProvider/);
    expect(await screen.findByText("Copied ThemeProvider JSX!")).toBeTruthy();
  });

  it("Reset puts the project's own theme back", async () => {
    await openPanel();
    await userEvent.click(screen.getByRole("button", { name: "Large" }));
    expect(localStorage.getItem("shavin-radius")).toBe("large");
    await userEvent.click(screen.getByRole("button", { name: "Reset to project theme" }));
    // Reset clears what the controls remembered, so the app's own ThemeProvider settings apply again.
    expect(localStorage.getItem("shavin-radius")).not.toBe("large");
  });

  it("follows a theme the app changes on its own (the shavin-theme-change event)", async () => {
    await openPanel();
    act(() => {
      document.documentElement.classList.add("dark");
      localStorage.setItem("shavin-radius", "full");
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    });
    const pre = document.querySelector("pre")!;
    await waitFor(() => expect(pre.textContent).toMatch(/radius="full"/));
  });

  it("starts from the theme the app's ThemeProvider was given (the shavin-theme-init event)", async () => {
    await openPanel();
    act(() => {
      window.dispatchEvent(
        new CustomEvent("shavin-theme-init", { detail: { gray: "Slate", radius: "small", scaling: 105, translucentPanels: false, displayFont: "Inter", bodyFont: "Inter" } }),
      );
    });
    const pre = document.querySelector("pre")!;
    await waitFor(() => expect(pre.textContent).toMatch(/radius="small"/));
    expect(pre.textContent).toMatch(/grayColor="slate"/);
    expect(pre.textContent).toMatch(/scaling=\{105\}/);
  });

  it("offers a custom font through the font select without a link to a website", async () => {
    await openPanel();
    expect(document.body.innerHTML).not.toMatch(/docs\.shavin\.cc|https?:\/\/[^"' ]*shavin/);
  });

  // The Copy Theme Code output for three representative states. The inline snapshots were recorded on the code from
  // before the theme controls moved into the shared controller, and must not change with it.
  describe("Copy Theme Code output", () => {
    const snippet = () => document.querySelector("pre")!.textContent;

    it("the starting state", async () => {
      await openPanel();
      expect(snippet()).toMatchInlineSnapshot(`
        "<ThemeProvider
          brandColor="Blue"
          grayColor="zinc"
          radius="medium"
          scaling={100}
          panelBackground="solid"
          displayFont="Rethink Sans"
          bodyFont="Inter"
        >
          {children}
        </ThemeProvider>"
      `);
    });

    it("after changing radius, gray and appearance by hand", async () => {
      await openPanel();
      await userEvent.click(screen.getByRole("button", { name: "Large" }));
      await userEvent.click(screen.getByTitle("Stone"));
      await userEvent.click(screen.getByRole("button", { name: "Dark" }));
      await waitFor(() => expect(snippet()).toMatch(/radius="large"/));
      expect(snippet()).toMatchInlineSnapshot(`
        "<ThemeProvider
          brandColor="Blue"
          grayColor="stone"
          radius="large"
          scaling={100}
          panelBackground="solid"
          displayFont="Rethink Sans"
          bodyFont="Inter"
        >
          {children}
        </ThemeProvider>"
      `);
    });

    it("after the app's ThemeProvider announces its own settings", async () => {
      await openPanel();
      act(() => {
        window.dispatchEvent(
          new CustomEvent("shavin-theme-init", { detail: { brand: "Teal", gray: "Slate", radius: "small", scaling: 105, translucentPanels: true, displayFont: "Inter", bodyFont: "Inter" } }),
        );
      });
      await waitFor(() => expect(snippet()).toMatch(/radius="small"/));
      expect(snippet()).toMatchInlineSnapshot(`
        "<ThemeProvider
          brandColor="Blue"
          grayColor="slate"
          radius="small"
          scaling={105}
          panelBackground="solid"
          displayFont="Inter"
          bodyFont="Inter"
        >
          {children}
        </ThemeProvider>"
      `);
    });
  });
});

describe("the floating Theme panel", { timeout: 60000 }, () => {
  async function openFloating() {
    localStorage.setItem("shavin-inspector-bar", JSON.stringify({ anchor: "bottom-right", collapsed: false }));
    render(<ShavinDevTools forceShow />);
    const bar = await screen.findByRole("button", { name: "Theme" }, { timeout: 30000 });
    await userEvent.click(bar);
    return screen.findByRole("region", { name: "Theme" });
  }

  it("opens from the bar's Theme tool with every theme control, and closes with its button, giving focus back", async () => {
    const panel = await openFloating();
    for (const label of ["Brand Color", "Gray Family", "Appearance", "Radius", "Scaling", "Panel Style", "Heading Font", "Body Font"]) {
      expect(within(panel).getAllByText(label).length, label).toBeGreaterThan(0);
    }
    expect(within(panel).getByRole("button", { name: "Reset to project theme" })).toBeTruthy();
    await userEvent.click(within(panel).getByRole("button", { name: "Close the Theme panel" }));
    expect(screen.queryByRole("region", { name: "Theme" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Theme" }));
  });

  it("drives the same controller: Radius and Gray write the page's variables and storage", async () => {
    const panel = await openFloating();
    await userEvent.click(within(panel).getByRole("button", { name: "Large" }));
    await userEvent.click(within(panel).getByTitle("Stone"));
    await waitFor(() => expect(localStorage.getItem("shavin-radius")).toBe("large"));
    expect(localStorage.getItem("shavin-gray")).toBe("Stone");
  });

  it("the inspector's own look never follows the theme being edited (brand, gray, radius, scaling)", async () => {
    const panel = await openFloating();
    const scope = () => document.querySelector("[data-shavin-scope]") as HTMLElement;
    const before = scope().getAttribute("style");
    const panelBefore = panel.getAttribute("style");
    await userEvent.click(within(panel).getByRole("button", { name: "Large" }));
    await userEvent.click(within(panel).getByTitle("Stone"));
    await userEvent.click(within(panel).getByTitle(BRAND_PRESETS[3]!.name));
    await waitFor(() => expect(localStorage.getItem("shavin-radius")).toBe("large"));
    expect(scope().getAttribute("style")).toBe(before);
    expect(panel.getAttribute("style")).toBe(panelBefore);
    expect(scope().getAttribute("data-scheme") ?? scope().closest("[data-scheme]")?.getAttribute("data-scheme")).toBeTruthy();
  });

  it("the T key opens it and Esc closes it", async () => {
    await openFloating();
    await userEvent.click(screen.getByRole("button", { name: "Theme" })); // close via the tool
    expect(screen.queryByRole("region", { name: "Theme" })).toBeNull();
    screen.getByRole("button", { name: "Theme" }).focus();
    await userEvent.keyboard("t");
    expect(await screen.findByRole("region", { name: "Theme" })).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("region", { name: "Theme" })).toBeNull();
  });
});


describe("the Theme panel on a page whose brand is painted differently in dark mode", () => {
  it("reads the page's near-white dark brand as Monochrome, not as the inspector's own Blue", async () => {
    document.documentElement.classList.add("dark");
    // ds-lint-disable-next-line no-hex — a fixture colour
    document.documentElement.style.setProperty("--brand", "228 228 231");
    await openPanel();
    const code = (document.querySelector("pre") as HTMLElement).textContent ?? "";
    expect(code).not.toMatch(/Blue/);
    expect(code).toMatch(/Monochrome/);
  });
});

describe("the Theme panel on a light page with the OKLCH build's near-black Monochrome", () => {
  it("reads #18181b as Monochrome, and the code block follows", async () => {
    // ds-lint-disable-next-line no-hex — a fixture colour
    document.documentElement.style.setProperty("--brand", "24 24 27");
    await openPanel();
    const code = (document.querySelector("pre") as HTMLElement).textContent ?? "";
    expect(code).not.toMatch(/Blue/);
    expect(code).toMatch(/Monochrome/);
  });
});

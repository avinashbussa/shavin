import * as React from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { sheetStyle, DOCK_H, SHEET_GAP } from "../../../packages/ui/src/inspector/usePhone";
import { Inspector } from "../../../packages/ui/src/inspector/Inspector";

const setWidth = (w: number) => {
  Object.defineProperty(window, "innerWidth", { value: w, configurable: true, writable: true });
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
};
const bar = () => document.querySelector("[data-shavin-toolbar]") as HTMLElement;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("shavin-inspector-bar", JSON.stringify({ anchor: "top-left", collapsed: false }));
  document.body.innerHTML = "";
  Object.defineProperty(window, "innerWidth", { value: 390, configurable: true, writable: true });
});
afterEach(() => {
  cleanup();
  Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true, writable: true });
});

describe("on a phone (under 640 px)", () => {
  it("the bar is a full-width bottom dock, 56 px tall, with 44 px icon targets, whatever anchor was saved", () => {
    render(<Inspector findings={[]} />);
    const s = bar().style;
    expect([s.left, s.right, s.bottom]).toEqual(["0px", "0px", "0px"]);
    expect(s.height).toContain("56px");
    expect(bar().getAttribute("aria-orientation")).toBe("horizontal");
    for (const name of ["Select", "Issues", "Theme", "Settings"]) {
      const b = screen.getByRole("button", { name });
      expect([b.style.width, b.style.height]).toEqual(["44px", "44px"]);
    }
    expect(screen.getAllByRole("button", { name: "Collapse the inspector bar" })[0]!.style.width).toBe("44px");
  });

  it("collapsed it is a 44 px tile", () => {
    localStorage.setItem("shavin-inspector-bar", JSON.stringify({ anchor: "bottom-right", collapsed: true }));
    render(<Inspector findings={[]} />);
    const tile = screen.getByRole("button", { name: "Open the inspector bar" });
    expect([tile.style.width, tile.style.height]).toEqual(["44px", "44px"]);
  });

  it("the mark does not drag on a phone", () => {
    render(<Inspector findings={[]} />);
    const mark = screen.getByRole("button", { name: "Collapse the inspector bar" });
    fireEvent.pointerDown(mark, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(window, { clientX: 200, clientY: 200 });
    fireEvent.pointerUp(window, { clientX: 200, clientY: 200 });
    expect(bar().style.left).toBe("0px");
    expect(JSON.parse(localStorage.getItem("shavin-inspector-bar")!).anchor).toBe("top-left");
  });

  it("Theme, Settings and the list share one sheet: opening one closes the others", async () => {
    render(<Inspector findings={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    const settings = screen.getByRole("region", { name: "Settings" });
    expect([settings.style.left, settings.style.right]).toEqual(["8px", "8px"]);

    await userEvent.click(screen.getByRole("button", { name: "Theme" }));
    expect(screen.queryByRole("region", { name: "Settings" })).toBeNull();
    // (The Theme panel needs the theme controller that ShavinDevTools provides; its tool state is what we check here.)
    expect(screen.getByRole("button", { name: "Theme" }).getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: "Issues" }));
    expect(screen.getByRole("button", { name: "Theme" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("region", { name: "Findings" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.queryByRole("region", { name: "Findings" })).toBeNull();
    expect(screen.getByRole("button", { name: "Issues" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("region", { name: "Settings" })).toBeTruthy();
  });

  it("Esc closes the sheet, then collapses the dock", async () => {
    render(<Inspector findings={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("region", { name: "Settings" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Open the inspector bar" })).toBeTruthy();
  });

  it("widening the window gives the floating bar and side panels back", async () => {
    render(<Inspector findings={[]} />);
    setWidth(1024);
    expect(bar().style.left).not.toBe("0px");
    await userEvent.click(screen.getByRole("button", { name: "Theme" }));
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("button", { name: "Theme" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("region", { name: "Settings" })).toBeTruthy();
  });
});

describe("safe area (jsdom cannot evaluate env(), so the CSS strings are checked)", () => {
  it("the sheet sits 8 px above the dock and the device's bottom safe area", () => {
    expect(sheetStyle(DOCK_H).bottom).toBe(`calc(${DOCK_H}px + env(safe-area-inset-bottom, 0px) + ${SHEET_GAP}px)`);
    expect(sheetStyle(0).bottom).toBe(SHEET_GAP);
  });
  it("the dock pads its bottom by the safe area and the collapsed tile lifts by it", async () => {
    const src = await import("node:fs").then((fs) => fs.readFileSync("packages/ui/src/inspector/Toolbar.tsx", "utf8"));
    expect(src).toMatch(/paddingBottom: "env\(safe-area-inset-bottom, 0px\)"/);
    expect(src).toMatch(/height: `calc\(\$\{DOCK_H\}px \+ env\(safe-area-inset-bottom, 0px\)\)`/);
    expect(src).toMatch(/bottom: "calc\(12px \+ env\(safe-area-inset-bottom, 0px\)\)"/);
  });
});

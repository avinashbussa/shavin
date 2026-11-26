import * as React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Inspector } from "../../../packages/ui/src/inspector/Inspector";
import { DEFAULT_SETTINGS, SETTINGS_KEY, loadSettings, reserveSpace, saveSettings, RESERVE_PX } from "../../../packages/ui/src/inspector/settings";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("shavin-inspector-bar", JSON.stringify({ anchor: "bottom-right", collapsed: false }));
  document.body.innerHTML = "";
  document.body.removeAttribute("style");
});
afterEach(() => cleanup());

describe("settings storage", () => {
  it("defaults: shortcuts on, motion on, colours auto, reserve space off", () => {
    expect(loadSettings()).toEqual({ shortcuts: true, reduceMotion: false, scheme: "auto", reserveSpace: false });
  });
  it("remembers a change and ignores garbage", () => {
    saveSettings({ ...DEFAULT_SETTINGS, scheme: "dark", reserveSpace: true });
    expect(loadSettings()).toMatchObject({ scheme: "dark", reserveSpace: true });
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ scheme: "purple", shortcuts: "yes" }));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    localStorage.setItem(SETTINGS_KEY, "nope");
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
  it("reserve space pads the side the bar is on and puts the page's own padding back exactly", () => {
    document.body.style.paddingBottom = "10px";
    const undo = reserveSpace("bottom-right");
    expect(document.body.style.paddingBottom).toContain(`${10 + RESERVE_PX}px`);
    undo();
    expect(document.body.style.paddingBottom).toBe("10px");
    const undoTop = reserveSpace("top-left");
    expect(document.body.style.paddingTop).toContain(`${RESERVE_PX}px`);
    undoTop();
    expect(document.body.style.paddingTop).toBe("");
  });
});

describe("the Settings panel", () => {
  const open = async () => {
    render(<Inspector findings={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    return screen.getByRole("region", { name: "Settings" });
  };

  it("opens from the bar with every setting, the shortcuts list and the Bridge and MCP row", async () => {
    const panel = await open();
    for (const name of ["Single-key shortcuts", "Reduce motion", "Reserve space"]) expect(within(panel).getByRole("switch", { name })).toBeTruthy();
    expect(within(panel).getByRole("radiogroup", { name: "Inspector colours" })).toBeTruthy();
    expect(within(panel).getByText("Ignored findings: 0")).toBeTruthy();
    expect(within(panel).getByText("Alt")).toBeTruthy();
    expect(within(panel).getByRole("button", { name: /Bridge and MCP panel/ })).toBeTruthy();
    expect(within(panel).getByRole("switch", { name: "Reserve space" }).getAttribute("aria-checked")).toBe("false");
  });

  it("the Bridge and MCP row asks the legacy panel to open", async () => {
    const panel = await open();
    const heard = vi.fn();
    window.addEventListener("shavin-open-bridge-panel", heard);
    await userEvent.click(within(panel).getByRole("button", { name: /Bridge and MCP panel/ }));
    window.removeEventListener("shavin-open-bridge-panel", heard);
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it("turning single-key shortcuts off stops V, I, T and comma, and the buttons still work", async () => {
    const panel = await open();
    await userEvent.click(within(panel).getByRole("switch", { name: "Single-key shortcuts" }));
    await userEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(screen.getByRole("button", { name: "Select" }).getAttribute("aria-pressed")).toBe("true");
    await userEvent.keyboard("i");
    await userEvent.keyboard("t");
    expect(screen.getByRole("button", { name: "Issues" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "Theme" }).getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(screen.getByRole("button", { name: "Issues" }));
    expect(screen.getByRole("button", { name: "Issues" }).getAttribute("aria-pressed")).toBe("true");
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)!).shortcuts).toBe(false);
  });

  it("forcing light or dark sets the inspector's scheme, whatever the page is", async () => {
    const panel = await open();
    const root = () => document.querySelector("[data-shavin-inspector]") as HTMLElement;
    await userEvent.click(within(panel).getByRole("radio", { name: "Dark" }));
    expect(root().getAttribute("data-scheme")).toBe("dark");
    await userEvent.click(within(panel).getByRole("radio", { name: "Light" }));
    expect(root().getAttribute("data-scheme")).toBe("light");
  });

  it("reduce motion zeroes the motion tokens in the inspector's scope", async () => {
    const panel = await open();
    const scope = () => document.querySelector("[data-shavin-scope]") as HTMLElement;
    expect(scope().style.getPropertyValue("--dur-base")).toBe("");
    await userEvent.click(within(panel).getByRole("switch", { name: "Reduce motion" }));
    expect(scope().style.getPropertyValue("--dur-base")).toBe("0ms");
    expect(scope().style.getPropertyValue("--dur-fast")).toBe("0ms");
  });

  it("reserve space pads the page while on and restores it when off", async () => {
    const panel = await open();
    await userEvent.click(within(panel).getByRole("switch", { name: "Reserve space" }));
    expect(document.body.style.paddingBottom).toContain(`${RESERVE_PX}px`);
    await userEvent.click(within(panel).getByRole("switch", { name: "Reserve space" }));
    expect(document.body.style.paddingBottom).toBe("");
  });

  it("clear all un-ignores everything and is disabled when nothing is ignored", async () => {
    localStorage.setItem("shavin-inspector-ignored", JSON.stringify(["f_00000001", "f_00000002"]));
    const panel = await open();
    expect(within(panel).getByText("Ignored findings: 2")).toBeTruthy();
    await userEvent.click(within(panel).getByRole("button", { name: "Clear all" }));
    expect(within(panel).getByText("Ignored findings: 0")).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("shavin-inspector-ignored")!)).toEqual([]);
    expect((within(panel).getByRole("button", { name: "Clear all" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("closes with its button and Esc, and gives focus back to the Settings tool", async () => {
    const panel = await open();
    await userEvent.click(within(panel).getByRole("button", { name: "Close Settings" }));
    expect(screen.queryByRole("region", { name: "Settings" })).toBeNull();
    screen.getByRole("button", { name: "Settings" }).focus();
    await userEvent.keyboard(",");
    expect(screen.getByRole("region", { name: "Settings" })).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("region", { name: "Settings" })).toBeNull();
  });
});

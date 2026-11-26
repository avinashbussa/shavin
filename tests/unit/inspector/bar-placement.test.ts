import { describe, it, expect, beforeEach } from "vitest";
import { ANCHORS, anchorCenter, anchorStyle, isVertical, loadBarPrefs, saveBarPrefs, snapAnchor, stepAnchor } from "../../../packages/ui/src/inspector/barPlacement";

describe("bar placement", () => {
  beforeEach(() => localStorage.clear());

  it("has eight anchors and a bottom-right default that starts collapsed", () => {
    expect(ANCHORS).toHaveLength(8);
    expect(loadBarPrefs()).toEqual({ anchor: "bottom-right", collapsed: true });
  });

  it("snaps to the closest anchor from where it was let go", () => {
    const vw = 1200;
    const vh = 800;
    for (const a of ANCHORS) {
      const c = anchorCenter(a, vw, vh, 160, 40);
      expect(snapAnchor(c.x + 12, c.y - 9, vw, vh, 160, 40)).toBe(a);
    }
    expect(snapAnchor(1100, 700, vw, vh, 160, 40)).toBe("bottom-right");
    expect(snapAnchor(30, 400, vw, vh, 40, 160)).toBe("middle-left");
  });

  it("side edges are vertical; the rest are horizontal", () => {
    expect(ANCHORS.filter(isVertical)).toEqual(["middle-left", "middle-right"]);
  });

  it("steps over the grid and stays put at an edge", () => {
    expect(stepAnchor("bottom-right", "left")).toBe("bottom-center");
    expect(stepAnchor("bottom-right", "right")).toBe("bottom-right");
    expect(stepAnchor("bottom-right", "up")).toBe("middle-right");
    expect(stepAnchor("top-center", "up")).toBe("top-center");
    expect(stepAnchor("top-center", "down")).toBe("top-center");
  });

  it("positions: corners by margin, centres by transform", () => {
    expect(anchorStyle("bottom-right")).toEqual({ bottom: 20, right: 20 });
    expect(anchorStyle("top-center")).toEqual({ top: 20, left: "50%", transform: "translate(-50%, 0)" });
    expect(anchorStyle("middle-left")).toEqual({ top: "50%", left: 20, transform: "translate(0, -50%)" });
  });

  it("remembers anchor and collapsed state, and ignores garbage", () => {
    saveBarPrefs({ anchor: "top-left", collapsed: false });
    expect(loadBarPrefs()).toEqual({ anchor: "top-left", collapsed: false });
    localStorage.setItem("shavin-inspector-bar", "{\"anchor\":\"nowhere\",\"collapsed\":3}");
    expect(loadBarPrefs()).toEqual({ anchor: "bottom-right", collapsed: true });
    localStorage.setItem("shavin-inspector-bar", "not json");
    expect(loadBarPrefs()).toEqual({ anchor: "bottom-right", collapsed: true });
  });
});

import { dockStyle } from "../../../packages/ui/src/inspector/barPlacement";

describe("where the list opens", () => {
  it("next to the bar, on the side facing the page, aligned with the bar's edge", () => {
    expect(dockStyle("bottom-right")).toMatchObject({ bottom: 68, top: 20, alignItems: "flex-end", justifyContent: "flex-end" });
    expect(dockStyle("bottom-left")).toMatchObject({ bottom: 68, justifyContent: "flex-start" });
    expect(dockStyle("top-center")).toMatchObject({ top: 68, bottom: 20, alignItems: "flex-start", justifyContent: "center" });
    expect(dockStyle("middle-left")).toMatchObject({ left: 68, right: 20, alignItems: "center", justifyContent: "flex-start" });
    expect(dockStyle("middle-right")).toMatchObject({ right: 68, left: 20, justifyContent: "flex-end" });
  });
});

import { avoidAnchor, panelInsets } from "../../../packages/ui/src/inspector/barPlacement";

describe("the bar steps out of the way of the selection", () => {
  const vw = 1280;
  const vh = 800;
  it("keeps the chosen anchor when nothing is covered", () => {
    expect(avoidAnchor("bottom-right", null, vw, vh, 300, 40)).toBe("bottom-right");
    expect(avoidAnchor("bottom-right", { x: 100, y: 100, w: 200, h: 50 }, vw, vh, 300, 40)).toBe("bottom-right");
  });
  it("tries bottom right, bottom left, bottom centre, then the top", () => {
    const onBR = { x: 1000, y: 735, w: 200, h: 30 };
    expect(avoidAnchor("bottom-right", onBR, vw, vh, 300, 40)).toBe("bottom-left");
    const onBoth = { x: 20, y: 735, w: 1240, h: 30 };
    expect(avoidAnchor("bottom-right", onBoth, vw, vh, 300, 40)).toBe("top-right");
    const bottomBand = { x: 0, y: 700, w: 1280, h: 100 };
    expect(avoidAnchor("bottom-right", bottomBand, vw, vh, 300, 40)).toBe("top-right");
  });
  it("leaves the choice alone when the selection covers every option", () => {
    expect(avoidAnchor("bottom-left", { x: 0, y: 0, w: 1280, h: 800 }, vw, vh, 300, 40)).toBe("bottom-left");
  });
  it("moves a bar chosen at a side edge too, when it covers the selection", () => {
    expect(avoidAnchor("middle-left", { x: 10, y: 380, w: 100, h: 40 }, vw, vh, 40, 40)).toBe("bottom-right");
  });
});

describe("side panels step around the bar", () => {
  it("shorter at the bar's end of the column, moved over on the middle of the edge, untouched elsewhere", () => {
    expect(panelInsets("bottom-left", "left")).toEqual({ top: 20, bottom: 68, left: 20, right: 20 });
    expect(panelInsets("top-left", "left")).toMatchObject({ top: 68, bottom: 20 });
    expect(panelInsets("middle-left", "left")).toMatchObject({ left: 68, top: 20, bottom: 20 });
    expect(panelInsets("bottom-right", "left")).toEqual({ top: 20, bottom: 20, left: 20, right: 20 });
    expect(panelInsets("bottom-right", "right")).toMatchObject({ bottom: 68 });
    expect(panelInsets("bottom-center", "right")).toMatchObject({ bottom: 20 });
  });
});

describe("the starting anchor", () => {
  it("is the `position` prop until the bar has been moved, then the remembered spot wins", () => {
    localStorage.clear();
    expect(loadBarPrefs("top-left")).toEqual({ anchor: "top-left", collapsed: true });
    saveBarPrefs({ anchor: "bottom-center", collapsed: false });
    expect(loadBarPrefs("top-left").anchor).toBe("bottom-center");
  });
});

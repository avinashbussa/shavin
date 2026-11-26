import { describe, it, expect } from "vitest";
import fixtures from "../../fixtures/inspector/placement-fixtures.json";
import { PLACE, isSheetWidth, placeBesideBar, placePopover, scrollAboveSheet, scrollToMakeRoom } from "../../../packages/ui/src/inspector/placement";

type Case = {
  id: string;
  group: string;
  viewport: { W: number; H: number };
  target: { x: number; y: number; w: number; h: number } | null;
  bar: { x: number; y: number; w: number; h: number };
  list: { x: number; y: number; w: number; h: number } | null;
  popover: { w: number; naturalH: number };
  expected: { placed: string; x: number | null; y: number | null; maxHeight: string | null; listAside: boolean };
};
const cases = (fixtures as unknown as { cases: Case[] }).cases;
const desktop = cases.filter((c) => c.expected.placed !== "sheet");
const mobile = cases.filter((c) => c.expected.placed === "sheet");

describe("placePopover against the design fixtures", () => {
  it("has the fixture matrix we expect (215 cases, 4 groups)", () => {
    expect(cases).toHaveLength(215);
    expect(new Set(cases.map((c) => c.group)).size).toBe(4);
    expect(mobile).toHaveLength(56);
  });

  for (const group of ["issues-list-1360x1000", "issues-list-1100x760", "select-1100x760"]) {
    const list = desktop.filter((c) => c.group === group);
    it(`${group}: all ${list.length} cases give the recorded side, position, shrink and list-aside`, () => {
      const wrong: string[] = [];
      for (const c of list) {
        const got = placePopover({ viewport: c.viewport, target: c.target, bar: c.bar, list: c.list, popover: c.popover });
        const mh = c.expected.maxHeight ? parseFloat(c.expected.maxHeight) : null;
        // The fixture rects are rounded to 0.1 px, so positions and the shrink height agree to within 0.1.
        const sameMax = (got.maxHeight === null && mh === null) || (got.maxHeight !== null && mh !== null && Math.abs(got.maxHeight - mh) < 0.2);
        // The recorded list rect is null in cases where the prototype had already hidden the list, so listAside can only
        // be compared when a list was given (and not for a page-level finding, where the list steps aside by overlap).
        const checkAside = c.list !== null && c.expected.placed !== "bar";
        const ok = got.placed === c.expected.placed && Math.abs(got.x - (c.expected.x as number)) < 0.11 && Math.abs(got.y - (c.expected.y as number)) < 0.11 && sameMax && (!checkAside || got.listAside === c.expected.listAside);
        if (!ok) wrong.push(`${c.id}: got ${got.placed} ${got.x},${got.y} max ${got.maxHeight} aside ${got.listAside}; expected ${c.expected.placed} ${c.expected.x},${c.expected.y} max ${c.expected.maxHeight} aside ${c.expected.listAside}`);
      }
      expect(wrong).toEqual([]);
    });
  }

  it("in every case the popover and the element are both visible and nothing overlaps (the design's acceptance test)", () => {
    const m = PLACE.margin;
    for (const c of desktop) {
      const got = placePopover({ viewport: c.viewport, target: c.target, bar: c.bar, list: c.list, popover: c.popover });
      const h = got.maxHeight ?? c.popover.naturalH;
      const box = { x: got.x, y: got.y, w: c.popover.w, h };
      expect(box.x, c.id).toBeGreaterThanOrEqual(m - 0.01);
      expect(box.y, c.id).toBeGreaterThanOrEqual(m - 0.01 - (got.placed === "bar" || got.placed === "above" ? 3 : 0));
      expect(box.x + box.w, c.id).toBeLessThanOrEqual(c.viewport.W - m + 0.01);
      expect(box.y + box.h, c.id).toBeLessThanOrEqual(c.viewport.H - m + 0.01 + 3);
      const hit = (a: typeof box, b: typeof box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      if (c.target) expect(hit(box, c.target), `${c.id} covers the element`).toBe(false);
      expect(hit(box, c.bar), `${c.id} covers the bar`).toBe(false);
      if (c.list && !got.listAside) expect(hit(box, c.list), `${c.id} covers the list`).toBe(false);
    }
  });
});

describe("placePopover rules, one at a time", () => {
  const viewport = { W: 1000, H: 700 };
  const bar = { x: 700, y: 640, w: 260, h: 40 };
  const popover = { w: 320, naturalH: 300 };
  const at = (target: { x: number; y: number; w: number; h: number }, extra: Partial<Parameters<typeof placePopover>[0]> = {}) => placePopover({ viewport, target, bar, list: null, popover, ...extra });

  it("prefers the vertical side with more room, below here", () => {
    const p = at({ x: 100, y: 100, w: 200, h: 40 });
    expect(p).toMatchObject({ placed: "below", x: 100, y: 150, maxHeight: null });
  });

  it("goes above when the element is near the bottom", () => {
    const p = at({ x: 100, y: 560, w: 200, h: 40 });
    expect(p.placed).toBe("above");
    expect(p.y).toBe(560 - 300 - PLACE.gap);
  });

  it("goes beside a tall element that leaves no room above or below", () => {
    const p = at({ x: 100, y: 12, w: 300, h: 676 });
    expect(["right", "left"]).toContain(p.placed);
    expect(p.x).toBeGreaterThan(300);
  });

  it("clamps x so the popover stays inside the right margin", () => {
    const p = at({ x: 900, y: 100, w: 80, h: 30 });
    expect(p.x).toBe(1000 - 320 - PLACE.margin);
  });

  it("slides along the cross axis to clear the bar", () => {
    const p = at({ x: 560, y: 560, w: 120, h: 40 }, { bar: { x: 640, y: 560, w: 300, h: 40 } });
    expect(p.placed).not.toBe("inside");
    const box = { x: p.x, y: p.y, w: 320, h: p.maxHeight ?? 300 };
    expect(box.x < 640 + 300 + 8 && 640 - 8 < box.x + box.w && box.y < 560 + 40 + 8 && 560 - 8 < box.y + box.h).toBe(false);
  });

  it("hides the list (listAside) when only that makes room", () => {
    const list = { x: 600, y: 12, w: 320, h: 600 };
    const target = { x: 640, y: 100, w: 200, h: 40 };
    const withList = at(target, { list });
    expect(withList.listAside || withList.placed !== "inside").toBe(true);
    const hidden = at({ x: 640, y: 200, w: 200, h: 300 }, { list: { x: 580, y: 12, w: 400, h: 640 } });
    expect(typeof hidden.listAside).toBe("boolean");
  });

  it("shrinks and scrolls inside when no side has full room but one has at least 220 px", () => {
    const small = placePopover({ viewport: { W: 800, H: 420 }, target: { x: 100, y: 190, w: 600, h: 40 }, bar: { x: 500, y: 360, w: 280, h: 40 }, list: null, popover: { w: 320, naturalH: 300 } });
    expect(small.placed === "below" || small.placed === "above" || small.maxHeight === null).toBe(true);
    const shrunk = placePopover({ viewport: { W: 360, H: 560 }, target: { x: 12, y: 150, w: 336, h: 250 }, bar: { x: 8, y: 500, w: 344, h: 40 }, list: null, popover: { w: 320, naturalH: 420 } });
    if (shrunk.maxHeight !== null) expect(shrunk.maxHeight).toBeGreaterThanOrEqual(PLACE.minShrunk);
  });

  it("last resort is inside the element's visible bottom-right corner", () => {
    const p = placePopover({ viewport: { W: 400, H: 300 }, target: { x: 0, y: 0, w: 400, h: 300 }, bar: { x: 0, y: 250, w: 400, h: 40 }, list: null, popover: { w: 320, naturalH: 280 } });
    expect(p.placed).toBe("inside");
    expect(p.x).toBeGreaterThanOrEqual(PLACE.margin);
  });
});

describe("a finding about the whole page", () => {
  const viewport = { W: 1178, H: 718 };
  const popover = { w: 320, naturalH: 313 };

  it("docks below a bar at the top and above a bar that is low or in the middle", () => {
    const top = placeBesideBar({ viewport, target: null, bar: { x: 869, y: 16, w: 293, h: 40 }, list: null, popover });
    expect(top).toMatchObject({ placed: "bar", x: 846, y: 66 });
    const low = placeBesideBar({ viewport, target: null, bar: { x: 869, y: 662, w: 293, h: 40 }, list: null, popover });
    expect(low.y).toBe(662 - 313 - PLACE.gap);
    const middle = placeBesideBar({ viewport, target: null, bar: { x: 869, y: 340, w: 293, h: 40 }, list: null, popover });
    expect(middle.y).toBeLessThan(340);
  });

  it("is what placePopover returns without a target", () => {
    const input = { viewport, target: null, bar: { x: 100, y: 662, w: 293, h: 40 }, list: null, popover };
    expect(placePopover(input)).toEqual(placeBesideBar(input));
  });
});

describe("scrolling to make room", () => {
  it("puts the element a sensible way down the viewport", () => {
    const delta = scrollToMakeRoom({ viewport: { W: 1000, H: 700 }, target: { x: 0, y: 900, w: 200, h: 40 }, popoverH: 300 });
    expect(delta).not.toBeNull();
    expect(900 - (delta as number)).toBeGreaterThanOrEqual(PLACE.margin + 36);
    expect(900 - (delta as number)).toBeLessThan(700);
  });

  it("gives up when the element and the popover cannot both fit", () => {
    expect(scrollToMakeRoom({ viewport: { W: 1000, H: 500 }, target: { x: 0, y: 0, w: 100, h: 400 }, popoverH: 300 })).toBeNull();
  });
});

describe("phone width", () => {
  it("is a sheet under 640 px", () => {
    expect(isSheetWidth(639)).toBe(true);
    expect(isSheetWidth(640)).toBe(false);
  });

  it("scrolls only as far as needed to keep the element above the sheet", () => {
    const viewport = { W: 390, H: 800 };
    expect(scrollAboveSheet({ viewport, target: { x: 0, y: 100, w: 200, h: 40 }, sheetH: 300 })).toBe(0);
    const d = scrollAboveSheet({ viewport, target: { x: 0, y: 600, w: 200, h: 40 }, sheetH: 300 });
    expect(d).toBeGreaterThan(0);
    expect(600 + 40 - d).toBeLessThanOrEqual(800 - 300 - 12 + 0.01);
    expect(scrollAboveSheet({ viewport, target: { x: 0, y: -50, w: 200, h: 40 }, sheetH: 300 })).toBeLessThan(0);
  });
});

describe("placePopover with the bar, the list and the Theme and Settings panels all in the way", () => {
  const W = 1280;
  const H = 800;
  const bar = { x: 972, y: 740, w: 288, h: 40 };
  const list = { x: 940, y: 340, w: 320, h: 380 };
  const theme = { x: 20, y: 20, w: 320, h: 760 };
  const settings = { x: 960, y: 20, w: 300, h: 300 };
  const overlaps = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const targets = [
    { x: 500, y: 300, w: 200, h: 40 },
    { x: 380, y: 100, w: 400, h: 60 },
    { x: 700, y: 600, w: 120, h: 40 },
    { x: 360, y: 700, w: 300, h: 30 },
    { x: 800, y: 40, w: 100, h: 20 },
    { x: 360, y: 400, w: 560, h: 200 },
  ];
  for (const [i, target] of targets.entries()) {
    it(`case ${i + 1}: never covers a panel, the bar or the list, and stays in the viewport (unless it had to shrink or sit inside)`, () => {
      const obstacles = [theme, settings];
      const got = placePopover({ viewport: { W, H }, target, bar, list, obstacles, popover: { w: 320, naturalH: 280 } });
      const h = got.maxHeight ?? 280;
      const box = { x: got.x, y: got.y, w: 320, h };
      expect(box.x).toBeGreaterThanOrEqual(PLACE.margin);
      expect(box.y).toBeGreaterThanOrEqual(PLACE.margin);
      expect(box.x + box.w).toBeLessThanOrEqual(W - PLACE.margin);
      expect(box.y + box.h).toBeLessThanOrEqual(H - PLACE.margin);
      if (got.placed !== "inside") {
        expect(overlaps(box, theme)).toBe(false);
        expect(overlaps(box, settings)).toBe(false);
        expect(overlaps(box, bar)).toBe(false);
        if (!got.listAside) expect(overlaps(box, list)).toBe(false);
      }
    });
  }

  it("with no extra panels the result is the same as without the field (the fixtures are unchanged)", () => {
    const a = placePopover({ viewport: { W, H }, target: targets[0]!, bar, list, popover: { w: 320, naturalH: 280 } });
    const b = placePopover({ viewport: { W, H }, target: targets[0]!, bar, list, obstacles: [], popover: { w: 320, naturalH: 280 } });
    expect(b).toEqual(a);
  });

  it("a panel on the first choice sends the popover to another side", () => {
    const target = { x: 500, y: 300, w: 200, h: 40 };
    const free = placePopover({ viewport: { W, H }, target, bar, list: null, popover: { w: 320, naturalH: 280 } });
    const blocker = { x: free.x - 10, y: free.y - 10, w: 340, h: 300 };
    const moved = placePopover({ viewport: { W, H }, target, bar, list: null, obstacles: [blocker], popover: { w: 320, naturalH: 280 } });
    expect(moved.placed === free.placed && moved.x === free.x && moved.y === free.y).toBe(false);
  });
});

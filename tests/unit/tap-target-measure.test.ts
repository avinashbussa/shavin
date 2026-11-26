import { afterEach, beforeEach, describe, expect, it } from "vitest";
// @ts-expect-error plain ESM shared with the adherence scorer and the Playwright tap-target suite
import { judgeTargets, measureHitAreas, undersized } from "../a11y/tap-targets/hit-area.mjs";
// @ts-expect-error plain ESM shared with the adherence scorer and the Playwright tap-target suite
import { PRIMARY_BY_PAGE, PRIMARY_SELECTOR, SECONDARY_CONTEXT } from "../a11y/tap-targets/primary.mjs";

/**
 * The measurement used by the tap-target suite and by evals/adherence/score.mjs. jsdom has no layout,
 * so rects and `elementFromPoint` are faked: each element gets a rect, and a point answers with the
 * last-registered element whose rect (or, for a `hitRect`, its larger invisible hit area) contains it.
 */
type R = { x: number; y: number; w: number; h: number };
const rects = new Map<Element, { box: R; hit?: R }>();

function place(el: Element, box: R, hit?: R) {
  rects.set(el, { box, hit });
  el.getBoundingClientRect = () => ({ x: box.x, y: box.y, left: box.x, top: box.y, width: box.w, height: box.h, right: box.x + box.w, bottom: box.y + box.h, toJSON() {} }) as DOMRect;
}
const inside = (r: R, x: number, y: number) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

beforeEach(() => {
  document.body.innerHTML = "";
  rects.clear();
  Element.prototype.scrollIntoView = () => {};
  // Top of the stack first, like the browser: later-registered elements paint on top.
  document.elementsFromPoint = (x: number, y: number) =>
    [...rects].filter(([, r]) => inside(r.hit ?? r.box, x, y)).map(([el]) => el).reverse();
  document.elementFromPoint = (x: number, y: number) => document.elementsFromPoint(x, y)[0] ?? null;
});
afterEach(() => {
  document.body.innerHTML = "";
});

const add = (html: string) => {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host.firstElementChild as HTMLElement;
};

describe("measureHitAreas", () => {
  it("measures the visual box when nothing extends it", () => {
    const b = add('<button type="button">Go</button>');
    place(b, { x: 100, y: 100, w: 40, h: 20 });
    const [m] = measureHitAreas({});
    expect(m.hit).toEqual({ w: 40, h: 20 });
    expect(undersized([m], 24)).toHaveLength(1);
  });

  it("counts an invisible hit area that elementFromPoint attributes to the control", () => {
    const b = add('<button type="button">Go</button>');
    place(b, { x: 100, y: 100, w: 40, h: 20 }, { x: 98, y: 88, w: 44, h: 44 });
    const [m] = measureHitAreas({});
    expect(m.visual).toEqual({ w: 40, h: 20 });
    expect(m.hit).toEqual({ w: 44, h: 44 });
    expect(undersized([m], 44)).toHaveLength(0);
  });

  it("checks width as well as height", () => {
    const b = add('<button type="button">I</button>');
    place(b, { x: 100, y: 100, w: 16, h: 48 });
    const [m] = measureHitAreas({});
    expect(undersized([m], 24)).toHaveLength(1);
    expect(undersized([m], 24)[0].hit.w).toBe(16);
  });

  it("skips inert, aria-hidden, hidden, opacity 0, disabled and pointer-events none", () => {
    const html = [
      '<button inert>a</button>',
      '<div aria-hidden="true"><button>b</button></div>',
      '<button style="display:none">c</button>',
      '<button style="visibility:hidden">d</button>',
      '<input type="checkbox" style="opacity:0" />',
      "<button disabled>e</button>",
      '<button style="pointer-events:none">f</button>',
    ].join("");
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    host.querySelectorAll("button, input").forEach((el, i) => place(el, { x: 10, y: 10 + i * 30, w: 10, h: 10 }));
    expect(measureHitAreas({})).toEqual([]);
  });

  it("exempts a link inside running text but not a stand-alone link", () => {
    const host = document.createElement("div");
    host.innerHTML = '<p>See the <a href="/a">billing guide</a> for more.</p><nav><a href="/b">Home</a></nav>';
    document.body.appendChild(host);
    const [inline, standalone] = Array.from(host.querySelectorAll("a"));
    place(inline, { x: 10, y: 10, w: 80, h: 17 });
    place(standalone, { x: 10, y: 60, w: 34, h: 16 });
    const labels = measureHitAreas({}).map((m: { label: string }) => m.label);
    expect(labels).toHaveLength(1);
    expect(labels[0]).toContain("Home");
  });

  it("lets two controls with overlapping hit areas each keep their own area", () => {
    const host = document.createElement("div");
    host.innerHTML = "<button>A</button><button>B</button>";
    document.body.appendChild(host);
    const [a, b] = Array.from(host.querySelectorAll("button"));
    place(a, { x: 100, y: 100, w: 28, h: 28 }, { x: 92, y: 92, w: 44, h: 44 });
    place(b, { x: 134, y: 100, w: 28, h: 28 }, { x: 126, y: 92, w: 44, h: 44 });
    const [ma, mb] = measureHitAreas({});
    expect(ma.hit).toEqual({ w: 44, h: 44 });
    expect(mb.hit).toEqual({ w: 44, h: 44 });
  });

  it("attributes a label's area to its input", () => {
    const host = document.createElement("div");
    host.innerHTML = '<label for="c">Accept<input id="c" type="checkbox" /></label>';
    document.body.appendChild(host);
    const label = host.querySelector("label")!;
    const input = host.querySelector("input")!;
    place(label, { x: 10, y: 10, w: 90, h: 30 });
    place(input, { x: 80, y: 20, w: 20, h: 20 });
    const [m] = measureHitAreas({});
    expect(m.hit.h).toBeGreaterThanOrEqual(30);
  });
});

describe("primary controls and the scorer's two bars", () => {
  const measure = (html: string, boxes: R[]) => {
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    Array.from(host.querySelectorAll("button, input, select, [role=radio]")).forEach((el, i) => place(el, boxes[i]));
    return measureHitAreas({ primary: PRIMARY_SELECTOR, secondary: SECONDARY_CONTEXT }) as { label: string; primary: boolean; hit: { w: number; h: number } }[];
  };

  it("marks buttons, inputs and selects as primary, and controls in a Calendar grid, Pagination or the colour swatches as secondary", () => {
    const m = measure(
      '<button>Save</button><input type="text" /><select></select>' +
        '<div role="grid"><button>12</button></div>' +
        '<nav aria-label="Pagination"><button>2</button></nav>' +
        '<div role="radiogroup" aria-label="Colors"><button role="radio" aria-label="Red"></button></div>',
      Array.from({ length: 6 }, (_, i) => ({ x: 10, y: 10 + i * 60, w: 100, h: 40 })),
    );
    expect(m.map((x) => x.primary)).toEqual([true, true, true, false, false, false]);
  });

  it("judges primary controls at 44px on a coarse pointer and everything else at the 24px floor", () => {
    const m = measure(
      '<button>Save</button><div role="grid"><button>12</button></div>',
      [{ x: 10, y: 10, w: 40, h: 40 }, { x: 10, y: 100, w: 30, h: 30 }],
    );
    const coarse = judgeTargets(m, { coarse: true });
    expect(coarse.primaryMisses).toBe(1); // 40px primary under the 44 bar
    expect(coarse.secondaryMisses).toBe(0); // 30px secondary clears 24
    const fine = judgeTargets(m, { coarse: false });
    expect(fine.small).toHaveLength(0); // mouse: 24 for everyone
  });

  it("flags a secondary control under 24px even on a coarse pointer", () => {
    const m = measure('<div role="grid"><button>1</button></div>', [{ x: 10, y: 10, w: 20, h: 20 }]);
    expect(judgeTargets(m, { coarse: true }).secondaryMisses).toBe(1);
  });

  it("shares one primary list: every per-page selector in the suite is covered by the scorer's page-agnostic selector", () => {
    const covered = new Set(PRIMARY_SELECTOR.split(/,\s*(?![^\[]*\])/).map((x: string) => x.trim()));
    // Each page selector's roles/tags must appear in the generic list (the Sidebar trigger is a plain button).
    for (const [page, selector] of Object.entries(PRIMARY_BY_PAGE) as [string, string][]) {
      for (const part of selector.split(/,\s*(?![^\[]*\])/)) {
        const key = part.trim();
        const generic = key.startsWith("button") ? "button" : key.startsWith("input") ? PRIMARY_SELECTOR.split(", ")[1] : key;
        expect(covered.has(generic) || PRIMARY_SELECTOR.includes(generic), `${page}: ${key}`).toBe(true);
      }
    }
  });
});

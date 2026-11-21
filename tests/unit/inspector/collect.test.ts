// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { backdropOf, collectPage, isFaintTexture } from "../../../packages/ui/src/lib/inspector/collect";
import { inspectDocument } from "../../../packages/ui/src/lib/inspector/run";

/** jsdom has no layout. Every element may carry data-box="x,y,w,h" (viewport px); text ranges use their element's box. */
function boxOf(el: Element | null): { x: number; y: number; width: number; height: number; right: number; bottom: number; left: number; top: number } {
  const raw = el?.getAttribute?.("data-box");
  const [x = 0, y = 0, w = 0, h = 0] = raw ? raw.split(",").map(Number) : [];
  return { x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h };
}

beforeEach(() => {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    return boxOf(this) as DOMRect;
  });
  (Range.prototype as unknown as { getClientRects: () => DOMRect[] }).getClientRects = function (this: Range) {
    const el = this.startContainer.parentElement;
    return [boxOf(el) as DOMRect] as unknown as DOMRect[] & { item: (i: number) => DOMRect | null };
  };
  (document as unknown as { elementsFromPoint: () => Element[] }).elementsFromPoint = () => [];
  Object.defineProperty(window, "innerWidth", { value: 1280, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
  const realStyle = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((el: Element) => realStyle(el));
  Object.defineProperty(document.documentElement, "scrollWidth", { value: 0, configurable: true });
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

const mount = (html: string) => {
  document.body.innerHTML = html;
};

describe("collectPage: text", () => {
  it("reads font, colour, line count and the backdrop of an element", () => {
    mount(`<section style="background-color: rgb(255, 255, 255)"><p data-box="10,20,300,40" style="font-size: 20px; line-height: 18px; color: rgb(200, 200, 200); font-weight: 600">Faint headline</p></section>`);
    const data = collectPage();
    expect(data.items).toHaveLength(1);
    const it = data.items[0]!;
    expect(it).toMatchObject({ text: "Faint headline", fontSize: 20, lineHeight: 18, weight: 600, lines: 1, animating: false, looping: false });
    expect(it.box).toEqual({ x: 10, y: 20, w: 300, h: 40 });
    expect(it.color).toEqual({ rgb: [200, 200, 200], a: 1 });
    expect(it.backdrop).toEqual({ kind: "solid", rgb: [255, 255, 255] });
  });

  it("skips aria-hidden, inert, disabled, display:none and screen-reader-only text", () => {
    mount(`
      <p data-box="0,0,100,20">visible</p>
      <p data-box="0,0,100,20" aria-hidden="true">hidden by aria</p>
      <div inert><p data-box="0,0,100,20">inert</p></div>
      <p data-box="0,0,100,20" style="display: none">display none</p>
      <p data-box="0,0,1,1">tiny</p>
      <button disabled data-box="0,0,80,20">disabled</button>
    `);
    expect(collectPage().items.map((i) => i.text)).toEqual(["visible"]);
  });

  it("skips the inspector's own nodes", () => {
    mount(`<p data-box="0,0,100,20">page</p><div data-shavin-inspector><p data-box="0,0,100,20">ours</p></div><div class="shavin-dev-tools-root"><p data-box="0,0,100,20">legacy</p></div>`);
    expect(collectPage().items.map((i) => i.text)).toEqual(["page"]);
  });

  it("multiplies opacity up the tree and drops invisible text", () => {
    mount(`<div style="opacity: 0.5"><p data-box="0,0,100,20" style="opacity: 0.5">half of half</p></div><p data-box="0,0,100,20" style="opacity: 0">gone</p>`);
    const items = collectPage().items;
    expect(items).toHaveLength(1);
    expect(items[0]!.opacity).toBeCloseTo(0.25, 5);
  });

  it("flags text that sits off the left or right edge", () => {
    mount(`<p data-box="1300,0,100,20">right</p><p data-box="-200,0,100,20">left</p><p data-box="10,0,100,20">in</p>`);
    const byText = Object.fromEntries(collectPage().items.map((i) => [i.text, i.offscreen]));
    expect(byText).toEqual({ right: true, left: true, in: false });
  });

  it("caps the number of text elements it reads", () => {
    mount(Array.from({ length: 50 }, (_, i) => `<p data-box="0,${i * 30},100,20">row ${i}</p>`).join(""));
    expect(collectPage({ maxText: 10 }).items.length).toBeLessThanOrEqual(10);
  });
});

describe("backdropOf", () => {
  it("uses the first opaque ancestor", () => {
    mount(`<div style="background-color: rgb(10, 20, 30)"><div><span id="t">x</span></div></div>`);
    expect(backdropOf(document.getElementById("t")!)).toEqual({ kind: "solid", rgb: [10, 20, 30] });
  });

  it("composites translucent layers over the opaque one beneath", () => {
    mount(`<div style="background-color: rgb(255, 255, 255)"><div style="background-color: rgba(0, 0, 0, 0.5)"><span id="t">x</span></div></div>`);
    expect(backdropOf(document.getElementById("t")!)).toEqual({ kind: "solid", rgb: [128, 128, 128] });
  });

  it("falls back to white when nothing is painted", () => {
    mount(`<div><span id="t">x</span></div>`);
    expect(backdropOf(document.getElementById("t")!)).toEqual({ kind: "solid", rgb: [255, 255, 255] });
  });

  it("answers unknown for a background image, a gradient and a backdrop filter", () => {
    mount(`
      <div style="background-image: url(a.png)"><span id="img">x</span></div>
      <div style="background-image: linear-gradient(red, blue)"><span id="grad">x</span></div>
      <div id="frost"><span id="blur">x</span></div>`);
    // jsdom drops properties it does not know, so report backdrop-filter for one element by hand.
    const real = window.getComputedStyle;
    vi.spyOn(window, "getComputedStyle").mockImplementation((el: Element) => {
      const cs = real(el);
      return el.id === "frost" ? (Object.assign(Object.create(cs), { backdropFilter: "blur(8px)" }) as CSSStyleDeclaration) : cs;
    });
    expect(backdropOf(document.getElementById("img")!)).toMatchObject({ kind: "unknown", reason: "image" });
    expect(backdropOf(document.getElementById("grad")!)).toMatchObject({ kind: "unknown", reason: "gradient" });
    expect(backdropOf(document.getElementById("blur")!)).toMatchObject({ kind: "unknown", reason: "filter" });
  });

  it("names the element that paints the non-flat background as its owner, with its box", () => {
    mount(`<header id="hdr" data-box="0,0,1280,60" style="background-image: url(a.png)"><a id="a" data-box="10,10,50,20">Docs</a><a id="b" data-box="80,10,50,20">Blog</a></header>`);
    const a = backdropOf(document.getElementById("a")!) as { owner?: Element; ownerBox?: unknown };
    const b = backdropOf(document.getElementById("b")!) as { owner?: Element };
    expect(a.owner).toBe(document.getElementById("hdr"));
    expect(b.owner).toBe(a.owner);
    expect(a.ownerBox).toEqual({ x: 0, y: 0, w: 1280, h: 60 });
  });
});

describe("backdrop painted by a positioned layer", () => {
  const button = (layerStyle: string, extra = "") =>
    `<div style="background-color: rgb(24, 24, 27)"><button data-box="0,0,100,40" style="position: relative"><span id="layer" data-box="0,0,100,40" style="position: absolute; ${layerStyle}"></span>${extra}<span id="label" data-box="20,10,60,20" style="color: rgb(10, 10, 12)">Solid</span></button></div>`;

  it("uses one opaque flat layer as the backdrop (a button's fill span)", () => {
    mount(button("background-color: rgb(250, 250, 250)"));
    expect(backdropOf(document.getElementById("label")!)).toEqual({ kind: "solid", rgb: [250, 250, 250] });
  });

  it("is unknown when the layer is translucent, an image or a gradient", () => {
    mount(button("background-color: rgba(250, 250, 250, 0.4)"));
    const t = backdropOf(document.getElementById("label")!) as { kind: string; reason?: string; owner?: Element };
    expect(t).toMatchObject({ kind: "unknown", reason: "layer" });
    expect(t.owner).toBe(document.getElementById("layer"));
    mount(button("background-image: linear-gradient(red, blue)"));
    expect(backdropOf(document.getElementById("label")!)).toMatchObject({ kind: "unknown", reason: "layer" });
  });

  it("is unknown when two layers cover the text", () => {
    mount(button("background-color: rgb(250, 250, 250)", `<span data-box="0,0,100,40" style="position: absolute; background-color: rgb(1, 2, 3)"></span>`));
    expect(backdropOf(document.getElementById("label")!)).toMatchObject({ kind: "unknown", reason: "layer" });
  });

  it("ignores a layer that does not cover the text, or is hidden, or paints nothing", () => {
    mount(button("background-color: rgb(250, 250, 250); display: none"));
    expect(backdropOf(document.getElementById("label")!)).toEqual({ kind: "solid", rgb: [24, 24, 27] });
    mount(button("background-color: transparent"));
    expect(backdropOf(document.getElementById("label")!)).toEqual({ kind: "solid", rgb: [24, 24, 27] });
    mount(`<div style="background-color: rgb(24, 24, 27)"><span data-box="500,500,10,10" style="position: absolute; background-color: rgb(250,250,250)"></span><p id="t" data-box="0,0,50,20">x</p></div>`);
    expect(backdropOf(document.getElementById("t")!)).toEqual({ kind: "solid", rgb: [24, 24, 27] });
  });

  it("the judged contrast of that button text is then correct, not a false error", () => {
    mount(button("background-color: rgb(250, 250, 250)"));
    const { findings } = inspectDocument();
    expect(findings.filter((f) => f.rule.startsWith("contrast"))).toEqual([]);
  });
});

describe("faint textures do not make a backdrop unknown", () => {
  it("isFaintTexture: low-alpha gradients and nearly transparent elements", () => {
    expect(isFaintTexture("linear-gradient(to right, rgba(39, 39, 42, 0.3) 1px, rgba(0, 0, 0, 0) 1px)", 1)).toBe(true);
    expect(isFaintTexture("radial-gradient(rgb(228, 228, 231) 1px, rgba(0, 0, 0, 0) 1px)", 0.1)).toBe(true);
    expect(isFaintTexture("linear-gradient(red, blue)", 1)).toBe(false);
    expect(isFaintTexture("linear-gradient(rgba(0,0,0,0.9), rgba(0,0,0,0))", 1)).toBe(false);
    expect(isFaintTexture("url(a.png)", 0.1)).toBe(false);
    // An opacity the engine did not report counts as fully opaque.
    expect(isFaintTexture("linear-gradient(to right, rgba(1,2,3,0.2), transparent)", Number.NaN)).toBe(true);
    expect(isFaintTexture("linear-gradient(to right, rgba(1,2,3,0.8), transparent)", Number.NaN)).toBe(false);
  });

  it("a dot-pattern layer behind a label (opacity 0.1) leaves the flat backdrop in charge", () => {
    mount(`<div style="background-color: rgb(24, 24, 27)"><div data-box="0,0,300,100" style="position: absolute; opacity: 0.1; background-image: radial-gradient(rgb(228, 228, 231) 1px, rgba(0, 0, 0, 0) 1px)"></div><p id="t" data-box="10,10,100,20">label</p></div>`);
    expect(backdropOf(document.getElementById("t")!)).toEqual({ kind: "solid", rgb: [24, 24, 27] });
  });

  it("a faint gradient on an ancestor is skipped, a strong one is not", () => {
    mount(`<div style="background-color: rgb(24, 24, 27)"><div style="background-image: linear-gradient(to right, rgba(39,39,42,0.3) 1px, rgba(0,0,0,0) 1px)"><p id="a" data-box="0,0,10,10">a</p></div><div style="background-image: linear-gradient(rgba(255,0,0,1), rgba(0,0,255,1))"><p id="b" data-box="0,0,10,10">b</p></div></div>`);
    expect(backdropOf(document.getElementById("a")!)).toEqual({ kind: "solid", rgb: [24, 24, 27] });
    expect(backdropOf(document.getElementById("b")!)).toMatchObject({ kind: "unknown", reason: "gradient" });
  });
});

describe("media behind text", () => {
  it("treats an image or video painted behind the text as an unknown backdrop", () => {
    mount(`<div style="background-color: rgb(255, 255, 255)"><video id="v"></video><p id="t" data-box="0,0,200,24" style="color: rgb(255, 255, 255)">Over a video</p></div>`);
    const t = document.getElementById("t")!;
    const v = document.getElementById("v")!;
    (document as unknown as { elementsFromPoint: () => Element[] }).elementsFromPoint = () => [t, v, document.body];
    const b = collectPage().items[0]!.backdrop as { kind: string; reason?: string; owner?: Element };
    expect(b).toMatchObject({ kind: "unknown", reason: "video" });
    expect(b.owner).toBe(v);
  });

  it("keeps a solid backdrop when only ancestors are below the text", () => {
    mount(`<div id="d" style="background-color: rgb(0, 0, 0)"><p id="t" data-box="0,0,200,24" style="color: rgb(255, 255, 255)">Plain</p></div>`);
    const t = document.getElementById("t")!;
    (document as unknown as { elementsFromPoint: () => Element[] }).elementsFromPoint = () => [t, document.getElementById("d")!, document.body];
    expect(collectPage().items[0]!.backdrop).toEqual({ kind: "solid", rgb: [0, 0, 0] });
  });

  it("survives a hit test that throws", () => {
    mount(`<p data-box="0,0,200,24" style="color: rgb(0,0,0)">x</p>`);
    (document as unknown as { elementsFromPoint: () => Element[] }).elementsFromPoint = () => {
      throw new Error("no layout");
    };
    expect(collectPage().items).toHaveLength(1);
  });
});

describe("collectPage: interactive elements", () => {
  it("measures buttons and links and skips a link inside a sentence", () => {
    mount(`
      <button id="b" data-box="0,0,20,20">x</button>
      <p>Read the <a href="#" style="display: inline" data-box="0,0,60,16">policy</a> now.</p>
      <a href="#" id="alone" style="display: inline" data-box="0,0,60,16">alone</a>`);
    const refs = collectPage().interactive.map((t) => (t.ref as Element).id || (t.ref as Element).tagName);
    expect(refs).toContain("b");
    expect(refs).toContain("alone");
    expect(refs).not.toContain("A");
  });

  it("skips hidden, zero-size and disabled controls", () => {
    mount(`<button data-box="0,0,0,0">zero</button><button disabled data-box="0,0,10,10">dis</button><button aria-hidden="true" data-box="0,0,10,10">h</button><button data-box="0,0,30,30">ok</button>`);
    expect(collectPage().interactive).toHaveLength(1);
  });
});

describe("collectPage: overflow", () => {
  const widths = (el: Element, scroll: number, client: number) => {
    Object.defineProperty(el, "scrollWidth", { value: scroll, configurable: true });
    Object.defineProperty(el, "clientWidth", { value: client, configurable: true });
  };

  it("finds the element that crosses the viewport edge, not its descendants", () => {
    mount(`<main data-box="0,0,1280,800"><div id="wide" data-box="0,0,1500,100"><span id="child" data-box="0,0,1400,20">x</span></div></main>`);
    widths(document.documentElement, 1500, 1280);
    const o = collectPage().overflow.filter((x) => x.kind === "viewport");
    expect(o.map((x) => (x.ref as Element).id)).toEqual(["wide"]);
    expect(o[0]!.measured).toBe("ends at 1500px, viewport 1280px");
  });

  it("ignores overflow that an ancestor clips", () => {
    mount(`<main data-box="0,0,1280,800"><div style="overflow-x: auto" data-box="0,0,1280,100"><div id="inner" data-box="0,0,2000,50">x</div></div></main>`);
    widths(document.documentElement, 1280, 1280);
    expect(collectPage().overflow).toHaveLength(0);
  });

  it("reports a page that scrolls sideways even when no single element can be named", () => {
    mount(`<main data-box="0,0,1280,800"><p data-box="0,0,100,20">x</p></main>`);
    widths(document.documentElement, 1600, 1280);
    const o = collectPage().overflow;
    expect(o).toHaveLength(1);
    expect(o[0]).toMatchObject({ kind: "viewport", measured: "page 1600px wide, viewport 1280px" });
  });

  it("finds a box whose child spills out of it", () => {
    mount(`<div id="card" data-box="0,0,300,100"><div data-box="0,0,500,40">wide child</div></div>`);
    widths(document.getElementById("card")!, 500, 300);
    const o = collectPage().overflow.filter((x) => x.kind === "container");
    expect(o).toHaveLength(1);
    expect(o[0]!.measured).toBe("content 500px in a 300px box");
  });

  it("ignores decorative layers: an absolutely positioned box, and spills that carry no text", () => {
    mount(`<div id="a" style="position: absolute" data-box="0,0,300,100"><div data-box="0,0,500,40">wide child</div></div><div id="b" data-box="0,200,300,100"><div data-box="0,0,500,40"></div></div>`);
    widths(document.getElementById("a")!, 500, 300);
    widths(document.getElementById("b")!, 500, 300);
    expect(collectPage().overflow).toHaveLength(0);
  });

  it("does not report a box that scrolls on purpose", () => {
    mount(`<div id="card" style="overflow-x: auto" data-box="0,0,300,100"><div data-box="0,0,500,40">x</div></div>`);
    widths(document.getElementById("card")!, 500, 300);
    expect(collectPage().overflow).toHaveLength(0);
  });
});

describe("inspectDocument end to end", () => {
  it("returns findings with unique selectors and the expected rules", () => {
    mount(`
      <main style="background-color: rgb(255, 255, 255)" data-box="0,0,1280,800">
        <h2 class="title" data-box="10,10,400,40" style="font-size: 30px; line-height: 24px; color: rgb(0, 0, 0)">Heading that is tight</h2>
        <p class="note" data-box="10,100,300,20" style="font-size: 16px; line-height: 24px; color: rgb(210, 210, 210)">Faint note</p>
        <button class="tiny" data-box="10,200,16,16">x</button>
      </main>`);
    const { findings } = inspectDocument();
    const rules = findings.map((f) => f.rule).sort();
    expect(rules).toEqual(["contrast.text", "line-height.tight", "tap-target.min-24"]);
    for (const f of findings) {
      expect(document.querySelectorAll(f.selector)).toHaveLength(1);
      expect(f.rect).not.toBeNull();
    }
    expect(findings[0]!.severity).toBe("error");
  });

  it("is clean on a well-formed page", () => {
    mount(`<main style="background-color: rgb(255, 255, 255)" data-box="0,0,1280,800"><p data-box="10,10,300,24" style="font-size: 16px; line-height: 24px; color: rgb(20, 20, 20)">Fine</p><button data-box="10,60,80,40">Go</button></main>`);
    expect(inspectDocument().findings).toEqual([]);
  });

  it("adds console errors passed in as page-level findings", () => {
    mount(`<p data-box="0,0,100,24" style="font-size: 16px; line-height: 24px; color: rgb(0,0,0)">ok</p>`);
    const { findings } = inspectDocument({ consoleErrors: ["boom"] });
    expect(findings.map((f) => f.rule)).toEqual(["console.error"]);
    expect(findings[0]!.rect).toBeNull();
  });
});

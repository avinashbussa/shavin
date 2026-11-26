// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { contextLabel, describeElement, uniqueSelector } from "../../../packages/ui/src/lib/inspector/selector";

const mount = (html: string) => {
  document.body.innerHTML = html;
};
const check = (el: Element) => {
  const sel = uniqueSelector(el, document);
  expect(sel.length).toBeGreaterThan(0);
  const all = document.querySelectorAll(sel);
  expect(all.length).toBe(1);
  expect(all[0]).toBe(el);
  return sel;
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("uniqueSelector", () => {
  it("uses a stable id", () => {
    mount('<main><button id="save">Save</button><button>Other</button></main>');
    expect(check(document.getElementById("save")!)).toBe("#save");
  });

  it("does not anchor on generated ids and classes", () => {
    mount('<div id=":r1:" class="css-1a2b3c4d5e"><p class="lead">one</p></div><div id="x12345"><p class="lead">two</p></div>');
    const p = document.querySelectorAll("p.lead")[1]!;
    const sel = check(p);
    expect(sel).not.toMatch(/:r1:|css-1a2b3c4d5e|x12345/);
  });

  it("prefers data-testid", () => {
    mount('<ul><li data-testid="row-a">a</li><li data-testid="row-b">b</li></ul>');
    expect(check(document.querySelector('[data-testid="row-b"]')!)).toBe('[data-testid="row-b"]');
  });

  it("distinguishes identical siblings with nth-of-type", () => {
    mount("<ul><li>a</li><li>b</li><li>c</li></ul>");
    const items = document.querySelectorAll("li");
    const sels = Array.from(items).map(check);
    expect(new Set(sels).size).toBe(3);
  });

  it("works for deep structures with repeated classes", () => {
    let html = "";
    for (let i = 0; i < 4; i++) html += `<section class="card"><div class="body"><span class="label">x</span><span class="label">y</span></div></section>`;
    mount(html);
    for (const el of Array.from(document.querySelectorAll(".label"))) check(el);
  });

  it("escapes awkward but legal class names", () => {
    mount('<div><p class="a:b">one</p><p class="w-[10px]">two</p><p class="plain">three</p></div>');
    for (const el of Array.from(document.querySelectorAll("p"))) check(el);
  });

  it("copes with the body and a lone element", () => {
    mount("<span>solo</span>");
    check(document.querySelector("span")!);
  });

  it("returns an empty string for a non-element", () => {
    expect(uniqueSelector(null as unknown as Element, document)).toBe("");
  });

  it("falls back to an nth-child path when nothing else is unique", () => {
    mount("<div><div><div><i></i><i></i></div></div></div>");
    for (const el of Array.from(document.querySelectorAll("i"))) check(el);
  });

  it("stays short on a big page", () => {
    let html = "";
    for (let i = 0; i < 300; i++) html += `<div class="row"><a href="#">link ${i}</a></div>`;
    mount(html);
    const el = document.querySelectorAll("a")[250]!;
    const sel = check(el);
    expect(sel.length).toBeLessThan(120);
  });
});

describe("labels", () => {
  it("describes an element and its parent", () => {
    mount('<section class="hero"><h1 class="title big">Hi</h1></section>');
    const h1 = document.querySelector("h1")!;
    expect(describeElement(h1)).toBe("h1.title.big");
    expect(contextLabel(h1)).toBe("section.hero > h1.title.big");
  });
});

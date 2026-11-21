import { render, screen, act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Table, TableBody, TableCell, TableColumnHeaderCell, TableHeader, TableRow } from "@shavin/ui";

const proto = HTMLElement.prototype;
const original = { sw: Object.getOwnPropertyDescriptor(proto, "scrollWidth"), cw: Object.getOwnPropertyDescriptor(proto, "clientWidth") };
const size = (scrollWidth: number, clientWidth: number) => {
  Object.defineProperty(proto, "scrollWidth", { configurable: true, get: () => scrollWidth });
  Object.defineProperty(proto, "clientWidth", { configurable: true, get: () => clientWidth });
};
afterEach(() => {
  if (original.sw) Object.defineProperty(proto, "scrollWidth", original.sw); else delete (proto as unknown as Record<string, unknown>).scrollWidth;
  if (original.cw) Object.defineProperty(proto, "clientWidth", original.cw); else delete (proto as unknown as Record<string, unknown>).clientWidth;
});

const sample = (props = {}) => (
  <Table {...props}>
    <TableHeader><TableRow><TableColumnHeaderCell>Plan</TableColumnHeaderCell><TableColumnHeaderCell>Runs</TableColumnHeaderCell></TableRow></TableHeader>
    <TableBody><TableRow><TableCell>Pro</TableCell><TableCell>20,000</TableCell></TableRow></TableBody>
  </Table>
);

describe("Table scrolling", () => {
  it("is plain when it fits: no focus stop, no fade", () => {
    size(300, 300);
    const { container } = render(sample());
    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap.getAttribute("tabindex")).toBeNull();
    expect(wrap.getAttribute("role")).toBeNull();
    expect(wrap.style.maskImage || wrap.getAttribute("style") || "").not.toMatch(/gradient/);
  });

  it("becomes a named, focusable region with a fade on the cut-off edge when wider than its container", () => {
    size(600, 300);
    const { container } = render(sample({ scrollLabel: "Plan comparison" }));
    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap.getAttribute("tabindex")).toBe("0");
    expect(screen.getByRole("region", { name: "Plan comparison" })).toBe(wrap);
    // not scrolled yet: only the end edge fades
    expect(wrap.style.cssText).toMatch(/linear-gradient\(to right, transparent 0(px)?, black 0px/);
    expect(wrap.style.cssText).toMatch(/calc\(100% - 28px\)/);
  });

  it("falls back to 'Scrollable table' and then fades the start edge once scrolled to the end", () => {
    size(600, 300);
    const { container } = render(sample());
    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap.getAttribute("aria-label")).toBe("Scrollable table");
    act(() => { wrap.scrollLeft = 300; wrap.dispatchEvent(new Event("scroll")); });
    expect(wrap.style.cssText).toMatch(/black 28px/);
    expect(wrap.style.cssText).toMatch(/calc\(100% - 0px\)/);
  });
});

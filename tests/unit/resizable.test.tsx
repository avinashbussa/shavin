import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Box, Card, Flex, resolveResizeEdges } from "@shavin/ui";
import { PanelGroup, Panel, PanelHandle } from "@shavin/ui/panels";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("resolveResizeEdges", () => {
  it("expands shorthands", () => {
    expect(resolveResizeEdges(undefined)).toEqual([]);
    expect(resolveResizeEdges(false)).toEqual([]);
    expect(resolveResizeEdges(true)).toEqual(["right", "bottom", "bottom-right"]);
    expect(resolveResizeEdges("both")).toEqual(["right", "bottom", "bottom-right"]);
    expect(resolveResizeEdges("x")).toEqual(["left", "right"]);
    expect(resolveResizeEdges("y")).toEqual(["top", "bottom"]);
    expect(resolveResizeEdges("left")).toEqual(["left"]);
    expect(resolveResizeEdges(["bottom-left", "left", "left"])).toEqual(["left", "bottom-left"]);
  });
});

describe("resizable prop", () => {
  it("does not leak resize props to the DOM when off", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<Box minWidth={100} persistKey="x" data-testid="box">Body</Box>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("minwidth")).toBeNull();
    expect(el.getAttribute("persistkey")).toBeNull();
    expect(el.style.minWidth).toBe("");
    expect(screen.queryByRole("separator")).toBeNull();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("renders one focusable separator per edge", () => {
    render(<Card resizable="both">Body</Card>);
    const handles = screen.getAllByRole("separator");
    expect(handles.map((h) => h.getAttribute("data-edge"))).toEqual(["right", "bottom", "bottom-right"]);
    expect(handles[0].getAttribute("aria-label")).toBe("Resize width");
    expect(handles[0].getAttribute("aria-orientation")).toBe("vertical");
    expect(handles[1].getAttribute("aria-label")).toBe("Resize height");
    expect(handles.every((h) => h.tabIndex === 0)).toBe(true);
  });

  it("resizes with the keyboard within bounds and resets", () => {
    const { container } = render(
      <Flex resizable="right" minWidth={100} maxWidth={300}>
        Body
      </Flex>
    );
    const el = container.firstElementChild as HTMLElement;
    const handle = screen.getByRole("separator");
    expect(el.style.minWidth).toBe("100px");
    expect(el.style.maxWidth).toBe("300px");

    // jsdom lays nothing out (offsetWidth 0), so one step clamps to the minimum.
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(el.style.width).toBe("100px");
    fireEvent.keyDown(handle, { key: "End" });
    expect(el.style.width).toBe("300px");
    fireEvent.keyDown(handle, { key: "Home" });
    expect(el.style.width).toBe("100px");
    fireEvent.keyDown(handle, { key: "Enter" });
    expect(el.style.width).toBe("");
  });

  it("ignores keys on the other axis", () => {
    const { container } = render(<Box resizable="right" minWidth={50}>Body</Box>);
    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowDown" });
    expect((container.firstElementChild as HTMLElement).style.height).toBe("");
  });

  it("persists and restores the size with persistKey", () => {
    const first = render(<Box resizable="bottom" maxHeight={240} persistKey="test-panel">Body</Box>);
    fireEvent.keyDown(screen.getByRole("separator"), { key: "End" });
    expect(JSON.parse(window.localStorage.getItem("shavin:resize:test-panel") ?? "null")).toEqual({ height: 240 });
    first.unmount();

    const { container } = render(<Box resizable="bottom" maxHeight={240} persistKey="test-panel">Body</Box>);
    expect((container.firstElementChild as HTMLElement).style.height).toBe("240px");
  });

  it("applies resizeColor and keeps it off the DOM", () => {
    const { container } = render(<Box resizable="right" resizeColor="neutral">Body</Box>);
    expect(screen.getByRole("separator").className).toContain("hover:after:bg-fg-subtle");
    expect(screen.getByRole("separator").className).not.toContain("hover:after:bg-brand");
    expect((container.firstElementChild as HTMLElement).getAttribute("resizecolor")).toBeNull();
  });

  it("keeps lines off rounded corners and puts corner handles on the curve", () => {
    // jsdom has no layout; give elements a size so radii are not capped to 0.
    const w = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
    const h = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => 200 });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => 100 });
    try {
      render(
        // Longhands: jsdom does not expand the border-radius shorthand (browsers do).
        <Box
          resizable={["right", "bottom-right"]}
          style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 8, borderBottomLeftRadius: 4 }}
        >
          Body
        </Box>
      );
      const [right, corner] = screen.getAllByRole("separator");
      expect(right.style.getPropertyValue("--resize-inset-start")).toBe("16px");
      expect(right.style.getPropertyValue("--resize-inset-end")).toBe("8px");
      // 8 · (1 − 1/√2) ≈ 2.3px in from both sides of the bottom-right corner.
      expect(corner.style.translate).toBe("-2.3px -2.3px");
    } finally {
      if (w) Object.defineProperty(HTMLElement.prototype, "offsetWidth", w);
      if (h) Object.defineProperty(HTMLElement.prototype, "offsetHeight", h);
    }
  });

  it("defaults to the brand-subtle colour", () => {
    render(<Box resizable="right">Body</Box>);
    expect(screen.getByRole("separator").className).toContain("hover:after:bg-brand/40");
  });

  it("slides the grip with the pointer while dragging and re-centres it on release", () => {
    render(<Box resizable={["right", "bottom-right"]} resizeHandle="grip">Body</Box>);
    const [right, corner] = screen.getAllByRole("separator");
    // Hover alone does not move it.
    fireEvent.pointerMove(right, { clientX: 5, clientY: 30 });
    expect(right.style.getPropertyValue("--resize-thumb")).toBe("");

    fireEvent.pointerDown(right, { button: 0, clientX: 5, clientY: 40 });
    expect(right.style.getPropertyValue("--resize-thumb")).toBe("40px");
    fireEvent.pointerMove(window, { clientX: 30, clientY: 70 });
    expect(right.style.getPropertyValue("--resize-thumb")).toBe("70px");
    fireEvent.pointerUp(window, { clientX: 30, clientY: 70 });
    expect(right.style.getPropertyValue("--resize-thumb")).toBe("");

    // Corners have no trail.
    fireEvent.pointerDown(corner, { button: 0, clientX: 5, clientY: 40 });
    expect(corner.style.getPropertyValue("--resize-thumb")).toBe("");
    fireEvent.pointerUp(window);
  });

  it("forwards the caller's ref", () => {
    let node: HTMLElement | null = null;
    render(<Box resizable="right" ref={(el) => { node = el; }}>Body</Box>);
    expect(node).toBeInstanceOf(HTMLElement);
  });
});

describe("@shavin/ui/panels", () => {
  it("renders panels with a separator between them", () => {
    render(
      <div style={{ width: 600, height: 300 }}>
        <PanelGroup>
          <Panel id="a">A</Panel>
          <PanelHandle />
          <Panel id="b">B</Panel>
        </PanelGroup>
      </div>
    );
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
    expect(screen.getByRole("separator")).toBeTruthy();
  });
});

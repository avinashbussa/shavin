import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CapsuleSlider } from "@shavin/ui";

afterEach(cleanup);

/** A 100px-wide slider from 0 to 100, so clientX maps straight onto the value. */
function setup() {
  const onValueChange = vi.fn();
  render(<CapsuleSlider label="Level" defaultValue={50} min={0} max={100} onValueChange={onValueChange} />);
  const slider = screen.getByRole("slider");
  slider.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 32, width: 100, height: 32, x: 0, y: 0, toJSON() {} });
  slider.setPointerCapture = () => {};
  slider.releasePointerCapture = () => {};
  return { slider, onValueChange };
}

describe("CapsuleSlider pointer handling", () => {
  it("drags with the primary button and stops on release", () => {
    const { slider, onValueChange } = setup();
    fireEvent.pointerDown(slider, { button: 0, buttons: 1, pointerType: "mouse", clientX: 20 });
    fireEvent.pointerMove(slider, { buttons: 1, pointerType: "mouse", clientX: 30 });
    fireEvent.pointerUp(slider, { button: 0, pointerType: "mouse", clientX: 30 });
    fireEvent.pointerMove(slider, { buttons: 0, pointerType: "mouse", clientX: 90 });
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual([20, 30]);
    expect(slider.getAttribute("aria-valuenow")).toBe("30");
  });

  it("ignores right- and middle-clicks", () => {
    const { slider, onValueChange } = setup();
    fireEvent.pointerDown(slider, { button: 2, buttons: 2, pointerType: "mouse", clientX: 80 });
    fireEvent.pointerDown(slider, { button: 1, buttons: 4, pointerType: "mouse", clientX: 80 });
    fireEvent.pointerMove(slider, { buttons: 0, pointerType: "mouse", clientX: 10 });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(slider.getAttribute("data-dragging")).toBe("false");
  });

  it("ends a drag whose release went missing instead of following hover", () => {
    const { slider, onValueChange } = setup();
    fireEvent.pointerDown(slider, { button: 0, buttons: 1, pointerType: "mouse", clientX: 40 });
    // No pointerup: the mouse is now moving with no button held.
    fireEvent.pointerMove(slider, { buttons: 0, pointerType: "mouse", clientX: 90 });
    fireEvent.pointerMove(slider, { buttons: 0, pointerType: "mouse", clientX: 10 });
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual([40]);
    expect(slider.getAttribute("data-dragging")).toBe("false");
  });

  it("ends the drag when pointer capture is lost", () => {
    const { slider } = setup();
    fireEvent.pointerDown(slider, { button: 0, buttons: 1, pointerType: "mouse", clientX: 40 });
    expect(slider.getAttribute("data-dragging")).toBe("true");
    fireEvent.lostPointerCapture(slider);
    expect(slider.getAttribute("data-dragging")).toBe("false");
  });
});

describe("CapsuleSlider accessibility", () => {
  it("names itself from a string label or aria-label", () => {
    render(<CapsuleSlider label="Speed" defaultValue={1} />);
    expect(screen.getByRole("slider", { name: "Speed" })).toBeTruthy();
    cleanup();
    render(<CapsuleSlider label="Speed" aria-label="Playback speed" defaultValue={1} />);
    expect(screen.getByRole("slider", { name: "Playback speed" })).toBeTruthy();
  });

  it("names itself from a non-string label through aria-labelledby", () => {
    render(<CapsuleSlider label={<b>Dot size</b>} defaultValue={1} />);
    const slider = screen.getByRole("slider", { name: "Dot size" });
    expect(slider.getAttribute("aria-label")).toBeNull();
    expect(document.getElementById(slider.getAttribute("aria-labelledby")!)?.textContent).toBe("Dot size");
  });

  it("moves ten steps on PageUp and PageDown, clamped to the range", () => {
    render(<CapsuleSlider label="Size" defaultValue={50} min={0} max={100} step={4} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "PageUp" });
    expect(slider.getAttribute("aria-valuenow")).toBe("90");
    fireEvent.keyDown(slider, { key: "PageUp" });
    expect(slider.getAttribute("aria-valuenow")).toBe("100");
    fireEvent.keyDown(slider, { key: "PageDown" });
    expect(slider.getAttribute("aria-valuenow")).toBe("60");
  });
});

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Drawer } from "@shavin/ui";

describe("Drawer trigger and uncontrolled use", () => {
  it("is closed until the trigger is activated, then opens", async () => {
    render(
      <Drawer title="Menu" trigger={<button type="button">Open menu</button>}>
        <p>Drawer body</p>
      </Drawer>,
    );
    expect(screen.queryByText("Drawer body")).toBeNull();
    fireEvent.click(screen.getByText("Open menu"));
    await waitFor(() => expect(screen.getByText("Drawer body")).toBeTruthy());
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("can be reopened after Escape closes it", async () => {
    render(
      <Drawer title="Menu" trigger={<button type="button">Open menu</button>}>
        <p>Drawer body</p>
      </Drawer>,
    );
    const trigger = screen.getByText("Open menu");
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
    fireEvent.click(trigger);
    await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("true"));
  });

  it("defaultOpen opens a trigger drawer on mount, and a drawer with no trigger is open by default (as before)", () => {
    const { unmount } = render(
      <Drawer title="A" defaultOpen trigger={<button type="button">t</button>}>
        <p>open body</p>
      </Drawer>,
    );
    expect(screen.getByText("open body")).toBeTruthy();
    unmount();
    render(
      <Drawer title="B">
        <p>plain body</p>
      </Drawer>,
    );
    expect(screen.getByText("plain body")).toBeTruthy();
  });

  it("controlled use is unchanged: open and onClose, and onOpenChange sees the trigger", async () => {
    const onClose = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <Drawer title="C" open onClose={onClose} onOpenChange={onOpenChange}>
        <p>controlled body</p>
      </Drawer>,
    );
    expect(screen.getByText("controlled body")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

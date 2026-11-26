import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Menu, MenuItem, MenuTrigger, Popover, PopoverContent, PopoverTrigger, PortalContainerProvider, Tooltip } from "@shavin/ui";

const OpenPopover = () => (
  <Popover defaultOpen>
    <PopoverTrigger>Open</PopoverTrigger>
    <PopoverContent>Panel text</PopoverContent>
  </Popover>
);

describe("PortalContainerProvider", () => {
  it("mounts floating panels in document.body by default", () => {
    const frame = document.createElement("div");
    document.body.appendChild(frame);
    render(<OpenPopover />);
    const panel = screen.getByText("Panel text");
    expect(document.body.contains(panel)).toBe(true);
    expect(frame.contains(panel)).toBe(false);
    frame.remove();
  });

  it("mounts a Popover panel inside the provided frame", () => {
    const frame = document.createElement("div");
    document.body.appendChild(frame);
    render(
      <PortalContainerProvider value={frame}>
        <OpenPopover />
      </PortalContainerProvider>,
    );
    expect(frame.contains(screen.getByText("Panel text"))).toBe(true);
    frame.remove();
  });

  it("applies to Menu and Tooltip as well", () => {
    const frame = document.createElement("div");
    document.body.appendChild(frame);
    render(
      <PortalContainerProvider value={frame}>
        <Menu trigger={<MenuTrigger>Actions</MenuTrigger>} onOpenChange={() => {}}>
          <MenuItem>Rename</MenuItem>
        </Menu>
        <Tooltip content="Tip text" open>
          <button type="button">Hover me</button>
        </Tooltip>
      </PortalContainerProvider>,
    );
    expect(frame.textContent).toContain("Tip text");
    frame.remove();
  });
});

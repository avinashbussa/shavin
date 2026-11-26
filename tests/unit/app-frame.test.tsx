import { describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { AppFrame, Sidebar, SidebarBody, SidebarNavItem, SidebarTrigger, TopBar } from "@shavin/ui";

// jsdom has no layout: clientWidth is 0, so the frame is always "compact" here, which is the
// mode with behaviour worth testing (drawer open/close, inert, focus, Escape).
function Shell({ routeKey }: { routeKey?: string }) {
  return (
    <AppFrame
      routeKey={routeKey}
      sidebar={
        <Sidebar>
          <SidebarBody>
            <SidebarNavItem label="Reports" />
          </SidebarBody>
        </Sidebar>
      }
    >
      <TopBar>
        <SidebarTrigger />
      </TopBar>
      <p>Page</p>
    </AppFrame>
  );
}

const nav = (c: HTMLElement) => c.querySelector(".shavin-frame__nav") as HTMLElement;
const main = (c: HTMLElement) => c.querySelector("main") as HTMLElement;

describe("AppFrame: sidebar becomes a drawer when compact", () => {
  it("renders the sidebar once, closed and inert, with a trigger wired to it", () => {
    const { container, getByRole } = render(<Shell />);
    expect(container.querySelectorAll("aside")).toHaveLength(1);
    expect(nav(container).hasAttribute("data-open")).toBe(false);
    expect(nav(container).hasAttribute("inert")).toBe(true);
    expect(nav(container).getAttribute("role")).toBe("dialog");
    const trigger = getByRole("button", { name: "Open navigation", hidden: true });
    expect(trigger.className).toContain("shavin-frame__trigger");
    expect(trigger.getAttribute("aria-controls")).toBe(nav(container).id);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("trigger opens the drawer and makes the page inert", () => {
    const { container, getByRole } = render(<Shell />);
    fireEvent.click(getByRole("button", { name: "Open navigation", hidden: true }));
    expect(nav(container).hasAttribute("data-open")).toBe(true);
    expect(nav(container).hasAttribute("inert")).toBe(false);
    expect(main(container).hasAttribute("inert")).toBe(true);
    expect(container.querySelector(".shavin-frame__scrim")?.hasAttribute("data-open")).toBe(true);
  });

  it("Escape, scrim click and nav item click each close it", () => {
    const { container, getByRole, getByText } = render(<Shell />);
    const open = () => fireEvent.click(getByRole("button", { name: /navigation/i, hidden: true }));
    open();
    fireEvent.keyDown(container.querySelector(".shavin-frame")!, { key: "Escape" });
    expect(nav(container).hasAttribute("data-open")).toBe(false);
    open();
    fireEvent.click(container.querySelector(".shavin-frame__scrim")!);
    expect(nav(container).hasAttribute("data-open")).toBe(false);
    open();
    fireEvent.click(getByText("Reports"));
    expect(nav(container).hasAttribute("data-open")).toBe(false);
  });

  it("a route change closes it", () => {
    const { container, getByRole, rerender } = render(<Shell routeKey="/a" />);
    fireEvent.click(getByRole("button", { name: "Open navigation", hidden: true }));
    expect(nav(container).hasAttribute("data-open")).toBe(true);
    rerender(<Shell routeKey="/b" />);
    expect(nav(container).hasAttribute("data-open")).toBe(false);
  });

  it("SidebarTrigger outside an AppFrame and a Sidebar throws a clear error", () => {
    expect(() => render(<SidebarTrigger />)).toThrow(/Sidebar> or an <AppFrame/);
  });
});

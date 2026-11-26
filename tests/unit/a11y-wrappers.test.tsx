import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  AlertDialog,
  Dialog,
  Menu,
  MenuItem,
  MenuTrigger,
  Radio,
  RadioGroup,
  SegmentedControl,
  SegmentedControlItem,
  Select,
  Spotlight,
  Switch,
  Tabs,
} from "@shavin/ui";

// Behaviour Radix does not give us for free: names, focus return without a
// Trigger, pattern choice. See docs/principles/accessibility.md §2.

function ControlledDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Edit</button>
      <Dialog title="Edit item" open={open} onOpenChange={setOpen}>
        <p>Body</p>
      </Dialog>
    </>
  );
}

function ControlledAlert() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Delete</button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete file?"
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

describe("a11y: dialogs return focus without a Trigger", () => {
  it("controlled Dialog returns focus to the opener on Escape", async () => {
    const user = userEvent.setup();
    render(<ControlledDialog />);
    const opener = screen.getByRole("button", { name: "Edit" });
    await user.click(opener);
    expect(await screen.findByRole("dialog", { name: "Edit item" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it("AlertDialog returns focus to the opener on cancel", async () => {
    const user = userEvent.setup();
    render(<ControlledAlert />);
    const opener = screen.getByRole("button", { name: "Delete" });
    await user.click(opener);
    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });
});

describe("a11y: Spotlight", () => {
  it("names the dialog and the search field, and exposes combobox semantics", async () => {
    render(
      <Spotlight open onOpenChange={() => {}} query="" onQueryChange={() => {}} activeOptionId="r1" resultCount={1}>
        <div role="option" id="r1" aria-selected="true">
          Button
        </div>
      </Spotlight>,
    );
    expect(await screen.findByRole("dialog", { name: "Search" })).toBeInTheDocument();
    const input = screen.getByRole("combobox", { name: "Search" });
    expect(input).toHaveAttribute("aria-activedescendant", "r1");
    expect(screen.getByRole("listbox", { name: "Search" })).toContainElement(screen.getByRole("option"));
    expect(screen.getByRole("status")).toHaveTextContent("1 result");
  });
});

describe("a11y: form wrappers", () => {
  it("Select can be named by a <label htmlFor> and linked to a hint", () => {
    render(
      <div>
        <label htmlFor="country">Country</label>
        <Select id="country" aria-describedby="country-hint" aria-invalid options={[{ value: "in", label: "India" }]} />
        <p id="country-hint">Where you live</p>
      </div>,
    );
    const trigger = screen.getByRole("combobox", { name: "Country" });
    expect(trigger).toHaveAttribute("aria-describedby", "country-hint");
    expect(trigger).toHaveAttribute("aria-invalid", "true");
  });

  it("Switch label names the switch", () => {
    render(<Switch label="Email alerts" />);
    expect(screen.getByRole("switch", { name: "Email alerts" })).toBeInTheDocument();
  });

  it("RadioGroup cards select with Space", async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup aria-label="Plan" variant="cards">
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" />
      </RadioGroup>,
    );
    const pro = screen.getByRole("radio", { name: "Pro" });
    pro.focus();
    await user.keyboard(" ");
    expect(pro).toHaveAttribute("aria-checked", "true");
  });
});

describe("a11y: names and patterns", () => {
  it("MenuTrigger without children is named", () => {
    render(
      <Menu trigger={<MenuTrigger />}>
        <MenuItem>Rename</MenuItem>
      </Menu>,
    );
    expect(screen.getByRole("button", { name: "More options" })).toBeInTheDocument();
  });

  it("icon-only SegmentedControl items always have a name", () => {
    render(
      <SegmentedControl variant="icon" defaultValue="grid" aria-label="View">
        <SegmentedControlItem value="grid" icon={<span>▦</span>} />
        <SegmentedControlItem value="list" icon={<span>≡</span>} aria-label="List view" />
      </SegmentedControl>,
    );
    expect(screen.getByRole("radio", { name: "grid" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "List view" })).toBeInTheDocument();
  });

  it("SegmentedControl cannot be cleared by clicking the active item", async () => {
    const user = userEvent.setup();
    render(
      <SegmentedControl defaultValue="a" aria-label="Mode">
        <SegmentedControlItem value="a" label="A" />
        <SegmentedControlItem value="b" label="B" />
      </SegmentedControl>,
    );
    const a = screen.getByRole("radio", { name: "A" });
    await user.click(a);
    expect(a).toHaveAttribute("aria-checked", "true");
  });

  it("Tabs in navigation mode is a labelled nav with aria-current, not a tablist", () => {
    render(
      <Tabs
        as="navigation"
        aria-label="Settings sections"
        items={[
          { label: "Profile", href: "/profile", active: true },
          { label: "Billing", href: "/billing" },
        ]}
      />,
    );
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByRole("navigation", { name: "Settings sections" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Billing" })).not.toHaveAttribute("aria-current");
  });
});

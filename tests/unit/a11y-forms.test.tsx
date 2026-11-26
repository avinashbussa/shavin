import { useState } from "react";
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  CheckboxCards,
  CheckboxCardsItem,
  CheckboxGroup,
  CheckboxGroupItem,
  ColorPicker,
  IconPicker,
  NpsScale,
  TimePickerClock,
  TimePickerInput,
} from "@shavin/ui";
import { preloadIcons } from "@shavin/ui";

// <Icon name> loads each icon on demand; these tests render synchronously, so load icons first.
beforeAll(() => preloadIcons(), 60_000);

// Phase 5: form controls name their groups, expose values, and work from the keyboard.

describe("a11y: checkbox groups", () => {
  it("CheckboxGroup and CheckboxCards are named by their label", () => {
    render(
      <>
        <CheckboxGroup label="Notifications">
          <CheckboxGroupItem checked={false} onCheckedChange={() => {}} label="Email" />
        </CheckboxGroup>
        <CheckboxCards aria-label="Add-ons">
          <CheckboxCardsItem checked={false} onCheckedChange={() => {}}>Backups</CheckboxCardsItem>
        </CheckboxCards>
      </>,
    );
    expect(screen.getByRole("group", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Add-ons" })).toBeInTheDocument();
  });
});

describe("a11y: TimePicker", () => {
  it("segments are spinbuttons that step with the arrow keys", async () => {
    const user = userEvent.setup();
    function Demo() {
      const [t, setT] = useState(new Date(2026, 9, 30, 9, 15));
      return <TimePickerInput value={t} onChange={setT} ariaLabel="Start time" />;
    }
    render(<Demo />);
    const group = screen.getByRole("group", { name: "Start time" });
    const hours = within(group).getByRole("spinbutton", { name: "Hours" });
    expect(hours).toHaveAttribute("aria-valuenow", "9");
    hours.focus();
    await user.keyboard("{ArrowUp}");
    await waitFor(() => expect(hours).toHaveAttribute("aria-valuenow", "10"));
    expect(within(group).getByRole("spinbutton", { name: "Minutes" })).toHaveAttribute("aria-valuenow", "15");
  });

  it("clock dial is a radio group and keeps focus when it switches to minutes", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    function Demo() {
      const [t, setT] = useState(new Date(2026, 9, 30, 3, 20));
      return <TimePickerClock value={t} onChange={setT} />;
    }
    render(<Demo />);
    await user.click(screen.getByRole("button", { name: /^Time, / }));
    const hourDial = await screen.findByRole("radiogroup", { name: "Hour" });
    const three = within(hourDial).getByRole("radio", { name: "3 o'clock" });
    expect(three).toHaveAttribute("aria-checked", "true");
    three.focus();
    await user.keyboard("{Enter}");
    const minuteDial = await screen.findByRole("radiogroup", { name: "Minutes" });
    await waitFor(() => expect(within(minuteDial).getByRole("radio", { name: "20 minutes" })).toHaveFocus());
  });
});

describe("a11y: ColorPicker", () => {
  it("the saturation/brightness area is a keyboard 2D slider", async () => {
    const user = userEvent.setup();
    let last = "";
    render(<ColorPicker variant="canvas" value="#808080" onChange={(v) => (last = v)} />);
    const area = screen.getByRole("slider", { name: "Saturation and brightness" });
    expect(area).toHaveAttribute("aria-valuetext", expect.stringMatching(/^Saturation \d+%, brightness \d+%$/));
    area.focus();
    await user.keyboard("{ArrowUp}");
    expect(last).not.toBe("");
  });

  it("swatches are one radio group with arrow keys", async () => {
    const user = userEvent.setup();
    function Demo() {
      const [v, setV] = useState("");
      return <ColorPicker variant="swatches" value={v} onChange={setV} />;
    }
    render(<Demo />);
    const group = screen.getByRole("radiogroup", { name: "Colors" });
    const radios = within(group).getAllByRole("radio");
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1);
    radios[0].focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(radios[1]).toHaveAttribute("aria-checked", "true"));
    expect(radios[1]).toHaveFocus();
  });
});

describe("a11y: IconPicker", () => {
  it("search is labelled and Down moves into a single-tab-stop listbox", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<IconPicker value="" onChange={() => {}} />);
    await user.click(screen.getByRole("button"));
    const search = await screen.findByRole("textbox", { name: "Search icons" });
    const list = screen.getByRole("listbox", { name: "Icons" });
    // The icon catalogue loads when the picker opens.
    await waitFor(() => expect(within(list).getAllByRole("option").length).toBeGreaterThan(1), { timeout: 15_000 });
    expect(within(list).getAllByRole("option").filter((o) => o.tabIndex === 0)).toHaveLength(1);
    search.focus();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement?.getAttribute("role")).toBe("option");
    const first = document.activeElement;
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).not.toBe(first);
    expect(document.activeElement?.getAttribute("role")).toBe("option");
  });
});

describe("a11y: NpsScale", () => {
  it("describes the scale ends", () => {
    render(<NpsScale />);
    expect(screen.getByRole("radiogroup")).toHaveAccessibleDescription(/0, Not at all likely.*10, Extremely likely/);
  });
});

describe("soft variant (dense tool panels)", () => {
  it("drops the border but keeps names and the focus ring path", async () => {
    const { Select, TextField } = await import("@shavin/ui");
    render(
      <>
        <Select variant="soft" ariaLabel="Viewport" value="d" options={[{ value: "d", label: "Desktop" }]} />
        <TextField variant="soft" aria-label="Width" defaultValue="1440" />
      </>,
    );
    const trigger = screen.getByRole("combobox", { name: "Viewport" });
    const field = screen.getByRole("textbox", { name: "Width" });
    expect(trigger.className).toContain("border-transparent");
    expect(trigger.className).not.toContain("border-border-control");
    expect(field.className).toContain("border-transparent");
    // No outline-none: the global focus ring still applies.
    expect(trigger.className).not.toMatch(/\boutline-none\b/);
    expect(field.className).not.toMatch(/\boutline-none\b/);
  });

  it("outline stays the default", async () => {
    const { TextField } = await import("@shavin/ui");
    render(<TextField aria-label="Email" />);
    expect(screen.getByRole("textbox", { name: "Email" }).className).toContain("border-border-control");
  });
});

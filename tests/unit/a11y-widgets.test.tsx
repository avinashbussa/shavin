import { useState } from "react";
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CalendarView, Combobox, DatePicker, Dropdown, Sortable, SortableHandle } from "@shavin/ui";
import { preloadIcons } from "@shavin/ui";

// <Icon name> loads each icon on demand; these tests render synchronously, so load icons first.
beforeAll(() => preloadIcons(), 60_000);

// Phase 4: the hand-rolled composite widgets follow their APG keyboard patterns.

// Day buttons are labelled in the runtime's locale (e.g. "Wednesday 14 October, 2026" on en-GB/en-IN,
// "Wednesday, October 14, 2026" on en-US). Build the expected name the same way.
const dayName = (y: number, m: number, d: number) =>
  new Date(y, m, d).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

const OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

describe("a11y: Dropdown (select-only listbox)", () => {
  it("opens from the keyboard and picks with arrows + Enter", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    function Demo() {
      const [v, setV] = useState("all");
      return <Dropdown ariaLabel="Status" value={v} onChange={setV} options={OPTIONS} />;
    }
    render(<Demo />);
    const trigger = screen.getByRole("combobox", { name: "Status" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(trigger).toHaveTextContent("Active"));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("a11y: Combobox (editable, list autocomplete)", () => {
  it("highlights with the arrows via aria-activedescendant and commits with Enter", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    function Demo() {
      const [v, setV] = useState("");
      return <Combobox aria-label="Fruit" value={v} onChange={setV} options={["Apple", "Banana", "Cherry"]} />;
    }
    render(<Demo />);
    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    const active = input.getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    expect(document.getElementById(active!)).toHaveTextContent("Banana");
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("Banana");
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-expanded", "false");
  });
});

describe("a11y: CalendarView (date grid)", () => {
  it("is a grid with one tab stop; arrows move focus, Enter selects", async () => {
    const user = userEvent.setup();
    const picked: Date[] = [];
    render(<CalendarView defaultDate={new Date(2026, 9, 14)} onSelectDate={(d) => picked.push(d)} fitContainer={false} />);
    const grid = screen.getByRole("grid", { name: "October 2026" });
    const tabbable = within(grid).getAllByRole("button").filter((b) => b.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAccessibleName(dayName(2026, 9, 14));

    tabbable[0].focus();
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(document.activeElement).toHaveAccessibleName(dayName(2026, 9, 22));
    await user.keyboard("{Enter}");
    expect(picked.at(-1)?.getDate()).toBe(22);
    expect(document.activeElement?.closest('[role="gridcell"]')).toHaveAttribute("aria-selected", "true");
  });

  it("PageDown moves to the same day next month", async () => {
    const user = userEvent.setup();
    render(<CalendarView defaultDate={new Date(2026, 0, 31)} fitContainer={false} />);
    const day = within(screen.getByRole("grid")).getAllByRole("button").find((b) => b.tabIndex === 0)!;
    day.focus();
    await user.keyboard("{PageDown}");
    expect(screen.getByRole("grid", { name: "February 2026" })).toBeInTheDocument();
    expect(document.activeElement).toHaveAccessibleName(dayName(2026, 1, 28));
  });
});

describe("a11y: DatePicker", () => {
  it("opens as a dialog focused on the selected day and returns focus on Escape", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<DatePicker value={new Date(2026, 9, 30)} onChange={() => {}} dateOnly />);
    const trigger = screen.getByRole("button", { name: "Choose date" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "October 2026" });
    expect(within(dialog).getByRole("grid")).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName(dayName(2026, 9, 30)));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveAccessibleName(dayName(2026, 9, 31));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("names the time inputs", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<DatePicker value={new Date(2026, 9, 30, 9, 15)} onChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Choose date" }));
    const time = await screen.findByRole("group", { name: "Time" });
    expect(within(time).getByRole("spinbutton", { name: "Hours" })).toHaveValue(9);
    expect(within(time).getByRole("spinbutton", { name: "Minutes" })).toHaveValue(15);
  });
});

describe("a11y: Sortable (keyboard reorder)", () => {
  it("picks up with Space, moves with arrows, drops with Space", async () => {
    const user = userEvent.setup();
    function Demo() {
      const [list, setList] = useState(["Alpha", "Beta", "Gamma"]);
      return (
        <Sortable items={list} onReorder={setList} getKey={(x) => x} aria-label="Priorities">
          {(item) => (
            <div>
              <SortableHandle />
              <span>{item}</span>
            </div>
          )}
        </Sortable>
      );
    }
    render(<Demo />);
    const handle = screen.getByRole("button", { name: "Reorder Alpha" });
    handle.focus();
    await user.keyboard(" ");
    expect(handle).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    await user.keyboard(" ");
    const items = within(screen.getByRole("list", { name: "Priorities" })).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["Beta", "Gamma", "Alpha"]);
    expect(screen.getByRole("button", { name: "Reorder Alpha" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Reorder Alpha" })).toHaveAttribute("aria-pressed", "false");
  });

  it("Escape restores the original order", async () => {
    const user = userEvent.setup();
    function Demo() {
      const [list, setList] = useState(["Alpha", "Beta", "Gamma"]);
      return (
        <Sortable items={list} onReorder={setList} getKey={(x) => x}>
          {(item) => (
            <div>
              <SortableHandle />
              {item}
            </div>
          )}
        </Sortable>
      );
    }
    render(<Demo />);
    screen.getByRole("button", { name: "Reorder Alpha" }).focus();
    await user.keyboard(" {ArrowDown}{Escape}");
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Alpha", "Beta", "Gamma"]);
  });
});

describe("a11y: Button asChild (navigation CTAs)", () => {
  it("renders the link itself with button styling and keeps icons", async () => {
    const { Button: Btn, Icon } = await import("@shavin/ui");
    const errors: unknown[] = [];
    const orig = console.error;
    console.error = (...a: unknown[]) => errors.push(a);
    try {
      render(
        <Btn asChild iconRight={<Icon name="arrow-right" size="sm" />}>
          <a href="/pricing">Compare plans</a>
        </Btn>,
      );
    } finally {
      console.error = orig;
    }
    const link = screen.getByRole("link", { name: "Compare plans" });
    expect(link).toHaveAttribute("href", "/pricing");
    expect(link.closest("button")).toBeNull();
    expect(link.querySelector("svg")).not.toBeNull();
    expect(errors).toHaveLength(0);
  });
});

import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AlertDialog, IconButton, Select, ThemeSwitcher } from "@shavin/ui";

// These lock down the behaviors AGENTS.md documents as load-bearing gotchas.
// A future edit that reintroduces the bug (or removes the guard) fails here.

describe("Select contract (AGENTS.md 'When to reach for Radix' — react-select)", () => {
  it("defensively strips an option with value:'' instead of breaking the list", async () => {
    // Gotcha 1: Radix reserves value="" as its no-selection sentinel and
    // throws if a real Item uses it. Select.tsx filters it out
    // (src/primitives/Select.tsx line 36: options.filter(o => o.value !== "")).
    // The bad option must not render, and the good ones must still work.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Select
        value="a"
        ariaLabel="Category"
        onChange={() => {}}
        options={[
          { value: "", label: "SENTINEL_SHOULD_BE_STRIPPED" },
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
      />,
    );

    // Opening at all proves the empty-value item didn't crash Radix.
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    const listbox = await screen.findByRole("listbox");

    expect(within(listbox).queryByText("SENTINEL_SHOULD_BE_STRIPPED")).toBeNull();
    expect(within(listbox).getByRole("option", { name: "Alpha" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Beta" })).toBeInTheDocument();
  });

  it("scrolls options through Select.Viewport, not a second scroll container on Content", async () => {
    // Gotcha 2: options MUST live inside Radix's Select.Viewport
    // (src/primitives/Select.tsx lines 78-95) so keyboard-nav/Enter bookkeeping
    // stays in sync. We assert the viewport exists and the items live inside it
    // — the structural half of the contract that holds without real layout.
    // (The ScrollUp/DownButtons are rendered by Radix only when the list is
    // actually scrollable, which needs real box metrics jsdom doesn't compute,
    // so they're intentionally not asserted here.)
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Select
        value="a"
        ariaLabel="Category"
        onChange={() => {}}
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await screen.findByRole("listbox");

    const viewport = document.querySelector("[data-radix-select-viewport]");
    expect(viewport).not.toBeNull();
    expect(within(viewport as HTMLElement).getByRole("option", { name: "Alpha" })).toBeInTheDocument();
  });
});

describe("AlertDialog contract (AGENTS.md — react-alert-dialog)", () => {
  it("defaults focus to the Cancel action, not the destructive Confirm", async () => {
    // The a11y-correct default for a destructive confirm: opening focuses
    // Cancel so an accidental Enter doesn't fire the dangerous action.
    render(
      <AlertDialog
        open
        onOpenChange={() => {}}
        title="Delete project?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={() => {}}
      />,
    );

    const cancel = await screen.findByRole("button", { name: "Cancel" });
    await waitFor(() => expect(cancel).toHaveFocus());

    // Sanity: the destructive action exists but is NOT the focused element.
    const confirm = screen.getByRole("button", { name: "Delete" });
    expect(confirm).not.toHaveFocus();
  });
});

describe("IconButton contract (AGENTS.md — requires an aria-label)", () => {
  it("exposes its aria-label as the button's accessible name", () => {
    // TS enforces the label at compile time (aria-label is a required prop);
    // this asserts it actually reaches the rendered button as an a11y name,
    // since the icon-only button has no visible text to fall back on.
    render(
      <IconButton aria-label="Delete item">
        <svg viewBox="0 0 24 24" aria-hidden="true" />
      </IconButton>,
    );

    expect(screen.getByRole("button", { name: "Delete item" })).toBeInTheDocument();
  });
});

describe("ThemeSwitcher contract", () => {
  it("renders segmented variant with accessibility attributes", () => {
    render(<ThemeSwitcher variant="segmented" showLabels />);
    expect(screen.getByRole("radiogroup", { name: "Theme mode" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "System" })).toBeInTheDocument();
  });

  it("renders binary switch variant", () => {
    render(<ThemeSwitcher variant="switch" />);
    expect(screen.getByRole("switch", { name: "Toggle dark mode" })).toBeInTheDocument();
  });
});


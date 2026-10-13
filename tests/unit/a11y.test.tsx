import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import {
  Button,
  Checkbox,
  Dialog,
  RadioGroup,
  Radio,
  Select,
  TextField,
} from "@shavin/ui";

// Component fragments aren't whole pages, so page-scope rules (every node must
// sit in a landmark, page must have one <h1>) are false positives here. We
// keep every content/name/role/state rule — those are the ones that catch a
// real regression — and disable only the page-structure trio.
async function expectNoViolations(node: Element = document.body) {
  const results = await axe(node, {
    rules: {
      region: { enabled: false },
      "landmark-one-main": { enabled: false },
      "page-has-heading-one": { enabled: false },
    },
  });
  expect(results).toHaveNoViolations();
}

describe("a11y: key composed components have no axe violations", () => {
  it("Button", async () => {
    const { container } = render(<Button>Save changes</Button>);
    await expectNoViolations(container);
  });

  it("TextField associated with a <label>", async () => {
    const { container } = render(
      <div>
        <label htmlFor="full-name">Full name</label>
        <TextField id="full-name" />
      </div>,
    );
    await expectNoViolations(container);
  });

  it("Checkbox with an accessible name", async () => {
    const { container } = render(<Checkbox aria-label="Accept terms" />);
    await expectNoViolations(container);
  });

  it("RadioGroup with named options", async () => {
    const { container } = render(
      <RadioGroup aria-label="Notification frequency" defaultValue="daily">
        <Radio value="daily" label="Daily" />
        <Radio value="weekly" label="Weekly" />
      </RadioGroup>,
    );
    await expectNoViolations(container);
  });

  it("Dialog (open) — portaled, audited on document.body", async () => {
    render(
      <Dialog title="Edit item" subtitle="Update the fields below" onClose={() => {}}>
        <p>Body content</p>
      </Dialog>,
    );
    // Radix portals the panel to <body>, so audit the whole document.
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await expectNoViolations(document.body);
  });

  it("Select (open) — listbox + options are accessible", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Select
        value="a"
        ariaLabel="Choose a category"
        onChange={() => {}}
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Choose a category" }));
    // Listbox is portaled once open.
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    await expectNoViolations(document.body);
  });
});

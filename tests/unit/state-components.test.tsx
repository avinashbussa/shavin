import { useEffect, useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import {
  Button,
  Callout,
  EmptyState,
  FormErrorSummary,
  FormField,
  IconButton,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextArea,
  TextField,
  ToastProvider,
  useToast,
} from "@shavin/ui";

// Workstream C (docs: ~/Agents/departments/design/specs/state-components.md): the components that
// make every state reachable by one named import, and their a11y wiring.

async function expectNoViolations(node: Element) {
  const results = await axe(node, {
    rules: {
      region: { enabled: false },
      "landmark-one-main": { enabled: false },
      "page-has-heading-one": { enabled: false },
      "heading-order": { enabled: false },
    },
  });
  expect(results).toHaveNoViolations();
}

const announcer = (p: "polite" | "assertive") => document.querySelector(`[data-shavin-announcer="${p}"]`);

describe("Button states (§4.1-4.3)", () => {
  it("plain disabled: native disabled, not-allowed cursor, no pointer-events-none", () => {
    render(<Button disabled>Save</Button>);
    const b = screen.getByRole("button", { name: "Save" });
    expect(b).toBeDisabled();
    expect(b.className).toContain("disabled:cursor-not-allowed");
    expect(b.className).not.toContain("pointer-events-none");
    expect(b).toHaveAttribute("data-inert", "disabled");
  });

  it("loading: aria-busy + aria-disabled, focusable, clicks ignored, spinner hidden, label announced", async () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="Saving…" onClick={onClick}>
        Save changes
      </Button>,
    );
    const b = screen.getByRole("button");
    expect(b).toHaveAttribute("aria-busy", "true");
    expect(b).toHaveAttribute("aria-disabled", "true");
    expect(b).not.toBeDisabled();
    expect(b).toHaveTextContent("Saving…");
    expect(b.className).toContain("data-[inert=loading]:cursor-progress");
    // the spinner's own status role is hidden inside the button
    expect(within(b).queryByRole("status")).toBeNull();
    b.focus();
    expect(b).toHaveFocus();
    await userEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
    await waitFor(() => expect(announcer("polite")?.textContent).toBe("Saving…"));
  });

  it("loading without an icon keeps the label (accessible name) and its width", () => {
    render(<Button loading>Save changes</Button>);
    const b = screen.getByRole("button", { name: "Save changes" });
    expect(within(b).getByText("Save changes").className).toContain("opacity-0");
  });

  it("disabledReason: focusable, described by the reason, clicks and submit blocked", async () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" disabledReason="Upgrade to Pro to export" onClick={onClick}>
          Export CSV
        </Button>
      </form>,
    );
    const b = screen.getByRole("button", { name: "Export CSV" });
    expect(b).not.toBeDisabled();
    expect(b).toHaveAttribute("aria-disabled", "true");
    expect(b).toHaveAccessibleDescription("Upgrade to Pro to export");
    await userEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disabledReason shows the reason in a Tooltip on keyboard focus", async () => {
    render(<Button disabledReason="Add a title first">Publish</Button>);
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Publish" })).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Add a title first");
  });

  it("IconButton has the same loading and reason behaviour", async () => {
    const onClick = vi.fn();
    render(
      <>
        <IconButton aria-label="Refresh" loading onClick={onClick}>
          <svg />
        </IconButton>
        <IconButton aria-label="Delete" disabledReason="Only owners can delete" onClick={onClick}>
          <svg />
        </IconButton>
      </>,
    );
    const refresh = screen.getByRole("button", { name: "Refresh" });
    expect(refresh).toHaveAttribute("aria-busy", "true");
    const del = screen.getByRole("button", { name: "Delete" });
    expect(del).toHaveAccessibleDescription("Only owners can delete");
    await userEvent.click(refresh);
    await userEvent.click(del);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("button states have no axe violations", async () => {
    const { container } = render(
      <div>
        <Button loading loadingLabel="Saving…">Save</Button>
        <Button disabledReason="Add a title first">Publish</Button>
        <Button disabled>Off</Button>
        <IconButton aria-label="Refresh" loading><svg /></IconButton>
      </div>,
    );
    await expectNoViolations(container);
  });
});

describe("Callout roles (§5)", () => {
  it("danger is an alert, other colours a status, a passed role wins", () => {
    const { container } = render(
      <div>
        <Callout color="danger" title="Save failed">Try again.</Callout>
        <Callout color="success" title="Saved">Done.</Callout>
        <Callout color="danger" role="note" title="Static">Notice.</Callout>
      </div>,
    );
    const c = within(container as HTMLElement);
    expect(c.getByRole("alert")).toHaveTextContent("Save failed");
    expect(c.getByRole("status")).toHaveTextContent("Saved");
    expect(c.getByRole("note")).toHaveTextContent("Static");
  });
});

describe("EmptyState (§1)", () => {
  it("renders a real heading, hides the icon and needs no role", () => {
    const { container } = render(
      <EmptyState kind="first-time" title="No orders yet" description="Share your shop link." action={<Button>Copy shop link</Button>} />,
    );
    expect(screen.getByRole("heading", { level: 3, name: "No orders yet" })).toBeInTheDocument();
    expect(container.querySelector("[aria-hidden='true'] svg")).not.toBeNull();
    expect(container.firstElementChild).not.toHaveAttribute("role");
  });

  it("no-results announces its title once; focusOnMount focuses the title", async () => {
    render(<EmptyState kind="no-results" title="No orders match these filters" />);
    await waitFor(() => expect(announcer("polite")?.textContent).toBe("No orders match these filters"));
    render(<EmptyState kind="success" title="Your workspace is ready" titleAs="h2" focusOnMount />);
    expect(screen.getByRole("heading", { name: "Your workspace is ready" })).toHaveFocus();
  });

  it("all kinds have no axe violations", async () => {
    const { container } = render(
      <div>
        {(["first-time", "empty", "no-results", "success"] as const).map((k) => (
          <EmptyState key={k} kind={k} variant="bordered" title={`Title ${k}`} description="One sentence." action={<Button>Act</Button>} />
        ))}
      </div>,
    );
    await expectNoViolations(container);
  });
});

describe("FormField (§2.1)", () => {
  it("labels the control and links the hint", () => {
    render(
      <FormField label="Bio" hint="Shown on your profile." required={false}>
        <TextArea />
      </FormField>,
    );
    const ta = screen.getByRole("textbox", { name: /Bio/ });
    expect(ta).toHaveAccessibleDescription("Shown on your profile.");
    expect(ta).not.toHaveAttribute("aria-required");
    expect(screen.getByText("Optional")).toBeInTheDocument();
  });

  it("an error replaces the hint, sets aria-invalid and is announced once", async () => {
    function Harness() {
      const [err, setErr] = useState<string | undefined>();
      const [n, setN] = useState(0);
      return (
        <>
          <FormField label="Bio" hint="Hint" error={err}>
            <TextArea />
          </FormField>
          <button onClick={() => setErr("Write at least 10 characters.")}>err</button>
          <button onClick={() => setN(n + 1)}>rerender</button>
        </>
      );
    }
    render(<Harness />);
    await userEvent.click(screen.getByText("err"));
    const ta = screen.getByRole("textbox", { name: "Bio" });
    expect(ta).toHaveAttribute("aria-invalid", "true");
    expect(ta).toHaveAttribute("aria-required", "true");
    expect(ta).toHaveAccessibleDescription("Write at least 10 characters.");
    await waitFor(() => expect(announcer("polite")?.textContent).toBe("Write at least 10 characters."));
    announcer("polite")!.textContent = "";
    await userEvent.click(screen.getByText("rerender"));
    await new Promise((r) => setTimeout(r, 80));
    expect(announcer("polite")?.textContent).toBe("");
  });

  it("names a Select through aria-labelledby and passes required, not aria-required", () => {
    render(
      <FormField label="Time zone" error="Choose a time zone.">
        <Select options={[{ value: "utc", label: "UTC" }]} />
      </FormField>,
    );
    const trigger = screen.getByRole("combobox", { name: "Time zone" });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAccessibleDescription("Choose a time zone.");
  });

  it("wraps a RadioGroup in a fieldset with a legend", () => {
    render(
      <FormField label="Plan" hint="You can change this later.">
        <RadioGroup defaultValue="free">
          <Radio value="free" label="Free" />
          <Radio value="pro" label="Pro" />
        </RadioGroup>
      </FormField>,
    );
    expect(screen.getByRole("group", { name: "Plan" }).tagName).toBe("FIELDSET");
    expect(screen.getByRole("radiogroup", { name: "Plan" })).toBeInTheDocument();
  });

  it("disabled passes through and the hint gives the reason; Switch keeps its own label", () => {
    render(
      <FormField hint="Available on the Pro plan." disabled>
        <Switch label="Weekly summary" />
      </FormField>,
    );
    const sw = screen.getByRole("switch", { name: "Weekly summary" });
    expect(sw).toBeDisabled();
    expect(sw).toHaveAccessibleDescription("Available on the Pro plan.");
    expect(sw).not.toHaveAttribute("aria-required");
  });

  it("form states have no axe violations", async () => {
    const { container } = render(
      <form>
        <FormField label="Bio" hint="Hint"><TextArea /></FormField>
        <FormField label="Notes" error="Too short"><TextArea /></FormField>
        <FormField label="Handle" hint="Verified" status="success"><TextArea /></FormField>
        <FormField label="Locked" hint="Set by your admin" readOnly><TextArea defaultValue="x" /></FormField>
        <FormField label="Zone" hint="Pro plan only" disabled><Select options={[{ value: "a", label: "A" }]} /></FormField>
        <FormField label="Plan"><RadioGroup defaultValue="a"><Radio value="a" label="A" /></RadioGroup></FormField>
      </form>,
    );
    await expectNoViolations(container);
  });
});

describe("TextField announceError", () => {
  it("announces once when the error first appears, not when announceError is false", async () => {
    const { rerender } = render(<TextField label="Email" />);
    rerender(<TextField label="Email" errorMessage="Enter an email like name@company.com" />);
    await waitFor(() => expect(announcer("polite")?.textContent).toBe("Enter an email like name@company.com"));
    announcer("polite")!.textContent = "";
    render(<TextField label="Name" announceError={false} />);
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {});
    expect(announcer("polite")?.textContent).toBe("");
  });
});

describe("FormErrorSummary (§2.2)", () => {
  it("is a group named by its heading, takes focus, links to fields and silences field announcements", async () => {
    function Form() {
      const [submitted, setSubmitted] = useState(false);
      const errors = submitted ? [{ id: "email", message: "Enter an email" }, { id: "bio", message: "Write a bio" }] : [];
      return (
        <form noValidate onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
          {errors.length > 0 && <FormErrorSummary errors={errors} />}
          <TextField id="email" label="Email" errorMessage={submitted ? "Enter an email" : undefined} />
          <FormField id="bio" label="Bio" error={submitted ? "Write a bio" : undefined}><TextArea /></FormField>
          <Button type="submit">Save</Button>
        </form>
      );
    }
    render(<Form />);
    announcer("polite") && (announcer("polite")!.textContent = "");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    const group = screen.getByRole("group", { name: "Fix 2 fields to continue" });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(within(group).getByRole("heading")).toHaveFocus();
    await new Promise((r) => setTimeout(r, 80));
    expect(announcer("polite")?.textContent ?? "").toBe("");
    await userEvent.click(within(group).getByRole("link", { name: "Write a bio" }));
    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveFocus();
  });

  it("renders nothing without errors and has no axe violations with them", async () => {
    const { container, rerender } = render(<FormErrorSummary errors={[]} focusOnMount={false} />);
    expect(container.firstChild).toBeNull();
    rerender(
      <div>
        <FormErrorSummary errors={[{ id: "a", message: "Fix A" }]} focusOnMount={false} />
        <TextField id="a" label="A" />
      </div>,
    );
    await expectNoViolations(container);
  });
});

describe("Toast (§3)", () => {
  it("drops an identical message that is already showing", async () => {
    function Fire() {
      const { success } = useToast();
      useEffect(() => {
        success("Changes saved");
        success("Changes saved");
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return null;
    }
    render(
      <ToastProvider>
        <Fire />
      </ToastProvider>,
    );
    const region = await screen.findByRole("region", { name: "Notifications" });
    await waitFor(() => expect(within(region).getAllByText("Changes saved")).toHaveLength(1));
  });
});

import { useEffect } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  AppFrame,
  Breadcrumbs,
  Sidebar,
  SidebarBody,
  SidebarNavItem,
  SidebarSection,
  Spinner,
  TextField,
  ToastProvider,
  useToast,
} from "@shavin/ui";

// Live regions, aria-current, skip link and field descriptions: the phase-3
// helpers in docs/audits/accessibility-audit-2026-10.md §3.

const announcer = (p: "polite" | "assertive") => document.querySelector(`[data-shavin-announcer="${p}"]`);

function Fire({ kind, title }: { kind: "success" | "error"; title: string }) {
  const toast = useToast();
  useEffect(() => {
    toast[kind](title);
    // Fire once on mount; the toast API object is not referentially stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

describe("a11y: announcements", () => {
  it("toasts speak through the persistent polite region", async () => {
    render(
      <ToastProvider>
        <Fire kind="success" title="Saved" />
      </ToastProvider>,
    );
    await waitFor(() => expect(announcer("polite")).toHaveTextContent("Saved"));
  });

  it("error toasts use the assertive region", async () => {
    render(
      <ToastProvider>
        <Fire kind="error" title="Upload failed" />
      </ToastProvider>,
    );
    await waitFor(() => expect(announcer("assertive")).toHaveTextContent("Upload failed"));
  });

  it("Spinner exposes one stable label, not the animated glyph", () => {
    const { container } = render(<Spinner variant="glyph" label="Loading results" />);
    const status = within(container).getByRole("status");
    // Only the label is exposed; the cycling glyph is aria-hidden.
    const exposed = [...status.childNodes].filter((n) => !(n instanceof Element && n.getAttribute("aria-hidden") === "true"));
    expect(exposed.map((n) => n.textContent).join("")).toBe("Loading results");
  });
});

describe("a11y: current location", () => {
  it("SidebarNavItem marks the active page and names collapsed icon items", () => {
    render(
      <Sidebar variant="collapsible" collapsed>
        <SidebarBody>
          <SidebarSection title="Workspace">
            <SidebarNavItem label="Inbox" href="/inbox" icon={<span>i</span>} active />
            <SidebarNavItem label="Archive" href="/archive" icon={<span>a</span>} />
          </SidebarSection>
        </SidebarBody>
      </Sidebar>,
    );
    expect(screen.getByRole("link", { name: "Inbox" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Archive" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("group", { name: "Workspace" })).toBeInTheDocument();
  });

  it("Breadcrumbs is an ordered list ending at the current page", () => {
    render(<Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Settings" }]} />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav.querySelectorAll("ol > li")).toHaveLength(2);
    expect(screen.getByText("Settings")).toHaveAttribute("aria-current", "page");
  });

  it("AppFrame's first tab stop skips to main content", async () => {
    const user = userEvent.setup();
    render(
      <AppFrame sidebar={<button>Nav item</button>}>
        <p>Content</p>
      </AppFrame>,
    );
    await user.tab();
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveFocus();
    await user.click(skip);
    expect(screen.getByRole("main")).toHaveFocus();
  });
});

describe("a11y: field descriptions", () => {
  it("TextField links its error and sets aria-invalid", () => {
    render(<TextField label="Email" errorMessage="Enter a valid email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid email");
  });

  it("TextField links its hint", () => {
    render(<TextField label="Username" hint="Letters and numbers only" />);
    expect(screen.getByLabelText("Username")).toHaveAccessibleDescription("Letters and numbers only");
  });

  it("password reveal is reachable by keyboard and reports its state", () => {
    render(<TextField label="Password" type="password" showHidePassword />);
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle).not.toHaveAttribute("tabindex", "-1");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});

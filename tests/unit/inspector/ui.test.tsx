import * as React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within, cleanup, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toolbar } from "../../../packages/ui/src/inspector/Toolbar";
import { IssuesList } from "../../../packages/ui/src/inspector/IssuesList";
import { IssuesLayer, markerAnchor } from "../../../packages/ui/src/inspector/IssuesLayer";
import { Inspector } from "../../../packages/ui/src/inspector/Inspector";
import { InspectorRoot } from "../../../packages/ui/src/inspector/InspectorRoot";
import { makeFinding, type Finding } from "../../../packages/ui/src/lib/inspector/schema";

const f = (n: number, over: Partial<Parameters<typeof makeFinding>[0]> = {}): Finding =>
  makeFinding({
    detector: "contrast",
    rule: "contrast.text",
    severity: "error",
    message: `Finding number ${n}`,
    fixHint: "Fix it.",
    selector: `#el${n}`,
    text: `text ${n}`,
    rect: { x: 10, y: 10 + n * 40, w: 100, h: 20, scrollX: 0, scrollY: 0 },
    ...over,
  });

beforeEach(() => {
  localStorage.clear();
  // Tests drive the tools, so the bar starts open (a real first visit starts collapsed).
  localStorage.setItem("shavin-inspector-bar", JSON.stringify({ anchor: "bottom-right", collapsed: false }));
  document.body.innerHTML = "";
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const raw = this.getAttribute("data-box");
    const [x = 0, y = 0, w = 0, h = 0] = raw ? raw.split(",").map(Number) : [];
    return { x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} } as DOMRect;
  });
  (document as unknown as { elementFromPoint: () => Element | null }).elementFromPoint = () => document.getElementById("target");
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Toolbar", () => {
  const setup = (over: Partial<React.ComponentProps<typeof Toolbar>> = {}) => {
    const onChange = vi.fn();
    render(<Toolbar active={null} onChange={onChange} errors={0} warnings={0} mode="" anchor="bottom-right" onAnchor={() => {}} collapsed={false} onCollapsed={() => {}} {...over} />);
    return onChange;
  };

  it("is a labelled toolbar with one tab stop (roving tabindex)", () => {
    setup();
    const bar = screen.getByRole("toolbar", { name: "Shavin inspector" });
    const buttons = within(bar).getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("tabindex"))).toEqual(["0", "-1", "-1", "-1", "-1"]);
  });

  it("arrow keys, Home and End move focus and the tab stop with them", async () => {
    setup();
    const [mark, select, , , issues] = screen.getAllByRole("button");
    mark!.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(select);
    expect(select!.getAttribute("tabindex")).toBe("0");
    expect(mark!.getAttribute("tabindex")).toBe("-1");
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(document.activeElement).toBe(mark);
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(issues);
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(mark);
  });

  it("the mark collapses the bar, and collapsed it is one button that opens it", async () => {
    const onCollapsed = vi.fn();
    setup({ onCollapsed });
    await userEvent.click(screen.getByRole("button", { name: "Collapse the inspector bar" }));
    expect(onCollapsed).toHaveBeenCalledWith(true);
  });

  it("collapsed: only the round tile, with a dot when findings count", () => {
    setup({ collapsed: true, errors: 1 });
    const bar = screen.getByRole("toolbar");
    expect(within(bar).getAllByRole("button")).toHaveLength(1);
    expect(within(bar).getByRole("button", { name: "Open the inspector bar" }).querySelector(".bg-danger")).not.toBeNull();
  });

  it("Shift+arrow on the mark moves the bar to the next anchor, plain arrows move focus", async () => {
    const onAnchor = vi.fn();
    setup({ onAnchor });
    screen.getByRole("button", { name: "Collapse the inspector bar" }).focus();
    await userEvent.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(onAnchor).toHaveBeenCalledWith("bottom-center");
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(onAnchor).toHaveBeenLastCalledWith("middle-right");
  });

  it("reserves no label slot when there is no mode text, and adds one when there is", () => {
    const { unmount } = render(<Toolbar active={null} onChange={() => {}} errors={0} warnings={0} mode="" anchor="bottom-right" onAnchor={() => {}} collapsed={false} onCollapsed={() => {}} />);
    expect(screen.getByRole("toolbar").querySelector(".px-2")).toBeNull();
    unmount();
    render(<Toolbar active="select" onChange={() => {}} errors={0} warnings={0} mode="Select, click an element" anchor="bottom-right" onAnchor={() => {}} collapsed={false} onCollapsed={() => {}} />);
    expect(screen.getByRole("toolbar").querySelector(".px-2")?.textContent).toBe("Select, click an element");
  });

  it("is vertical on a side edge", () => {
    setup({ anchor: "middle-left" });
    expect(screen.getByRole("toolbar").getAttribute("aria-orientation")).toBe("vertical");
  });

  it("marks the active tool with aria-pressed and toggles it off on a second click", async () => {
    const onChange = setup({ active: "select" });
    const select = screen.getByRole("button", { name: "Select" });
    expect(select.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Issues" }).getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(select);
    expect(onChange).toHaveBeenCalledWith(null);
    await userEvent.click(screen.getByRole("button", { name: "Issues" }));
    expect(onChange).toHaveBeenCalledWith("issues");
  });

  it("announces the mode politely", () => {
    setup({ mode: "Issues 3" });
    const live = screen.getByText("Issues 3");
    expect(live.getAttribute("aria-live")).toBe("polite");
  });
});

describe("IssuesList", () => {
  const base = { selectedId: null, onActive: vi.fn(), onOpen: vi.fn(), onUndo: vi.fn(), canUndo: false };

  it("an error is a filled dot and a warning is a ring, in the list as on the page", () => {
    const warn = f(2, { severity: "warning" });
    render(<IssuesList {...base} ignored={new Set()} findings={[f(1), warn]} />);
    const dots = screen.getAllByRole("option").map((r) => r.querySelector('span[aria-hidden="true"]') as HTMLElement);
    expect(dots[0]!.className).toMatch(/bg-danger/);
    expect(dots[1]!.className).toMatch(/border-warning/);
    expect(dots[1]!.className).not.toMatch(/bg-warning/);
  });

  it("on a phone the rows are at least 44 px high", () => {
    render(<IssuesList {...base} ignored={new Set()} touch findings={[f(1)]} />);
    expect(screen.getByRole("option").className).toMatch(/min-h-\[44px\]/);
  });

  it("a row's words wrap instead of ending in an ellipsis", () => {
    render(<IssuesList {...base} ignored={new Set()} findings={[f(1, { message: "A very long sentence that would be cut short in a narrow list." })]} />);
    const row = screen.getByRole("option");
    expect(row.className).toMatch(/\[&_\.truncate\]:whitespace-normal/);
  });

  it("one dot and the violation text per row; ignored rows are listed last and never counted", () => {
    const a = f(1);
    const b = f(2, { severity: "warning" });
    const c = f(3);
    render(<IssuesList {...base} findings={[a, b, c]} ignored={new Set([c.id])} />);
    const rows = screen.getAllByRole("option");
    expect(rows.map((r) => r.textContent)).toEqual([expect.stringContaining("Finding number 1"), expect.stringContaining("Finding number 2"), expect.stringContaining("Finding number 3")]);
    expect(rows[2]!.textContent).toContain("Ignored.");
    expect(screen.getByText("All 2")).toBeTruthy();
    expect(screen.getByText("Errors 1")).toBeTruthy();
    expect(screen.getByText("Warnings 1")).toBeTruthy();
    expect(screen.getByText("Ignored 1")).toBeTruthy();
    expect(screen.getByText("1 ignored")).toBeTruthy();
  });

  it("filters: Errors, Warnings and Ignored show only their rows", async () => {
    const a = f(1);
    const b = f(2, { severity: "warning" });
    const c = f(3);
    render(<IssuesList {...base} findings={[a, b, c]} ignored={new Set([c.id])} />);
    await userEvent.click(screen.getByText("Warnings 1"));
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option").textContent).toContain("Finding number 2");
    await userEvent.click(screen.getByText("Errors 1"));
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option").textContent).toContain("Finding number 1");
    await userEvent.click(screen.getByText("Ignored 1"));
    expect(screen.getByRole("option").textContent).toContain("Finding number 3");
  });

  it("hides the Ignored chip and the footer when nothing is ignored", () => {
    render(<IssuesList {...base} findings={[f(1)]} ignored={new Set()} />);
    expect(screen.queryByText(/^Ignored/)).toBeNull();
    expect(screen.queryByText("Undo")).toBeNull();
  });

  it("an empty list says so", () => {
    render(<IssuesList {...base} findings={[]} ignored={new Set()} />);
    expect(screen.getByText("No findings.")).toBeTruthy();
  });

  it("groups by rule above ten findings and keeps ignored rows at the end of their group with a count that excludes them", () => {
    const list = Array.from({ length: 12 }, (_, i) => f(i + 1, i < 8 ? { rule: "contrast.text", message: "Text is hard to read." } : { rule: "tap-target.min-24", message: "Tap target is too small." }));
    const ign = new Set([list[0]!.id]);
    const { container } = render(<IssuesList {...base} findings={list} ignored={ign} />);
    const groups = container.querySelectorAll("details");
    expect(groups).toHaveLength(2);
    expect(groups[0]!.querySelector("summary")!.textContent).toContain("· 7");
    const firstGroupRows = groups[0]!.querySelectorAll('[role="option"]');
    expect(firstGroupRows[firstGroupRows.length - 1]!.textContent).toContain("Ignored.");
    expect((groups[0] as HTMLDetailsElement).open).toBe(true);
    expect((groups[1] as HTMLDetailsElement).open).toBe(false);
  });

  it("rules that say the same thing share one group", () => {
    const list = Array.from({ length: 12 }, (_, i) => f(i + 1, { rule: i % 2 ? "tokens.purity" : "tokens.radius", message: "Style bypasses the design tokens." }));
    const { container } = render(<IssuesList {...base} findings={list} ignored={new Set()} />);
    expect(container.querySelectorAll("details")).toHaveLength(1);
    expect(container.querySelector("summary")!.textContent).toContain("Style bypasses the design tokens · 12");
  });

  it("opens a finding on click and on Enter; arrow keys move between rows", async () => {
    const onOpen = vi.fn();
    const onActive = vi.fn();
    render(<IssuesList {...base} onOpen={onOpen} onActive={onActive} findings={[f(1), f(2), f(3)]} ignored={new Set()} />);
    const rows = screen.getAllByRole("option");
    await userEvent.click(rows[1]!);
    expect(onOpen).toHaveBeenCalledWith(f(2).id);
    rows[0]!.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rows[1]);
    await userEvent.keyboard("{Enter}");
    expect(onOpen).toHaveBeenLastCalledWith(f(2).id);
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(rows[2]);
    expect(onActive).toHaveBeenCalledWith(f(3).id);
  });

  it("group headers use chevron icons, not text triangles, and follow the open state", async () => {
    const list = Array.from({ length: 12 }, (_, i) => f(i + 1, i < 8 ? { rule: "a.b", message: "First problem." } : { rule: "c.d", message: "Second problem." }));
    const { container } = render(<IssuesList {...base} findings={list} ignored={new Set()} />);
    const summaries = container.querySelectorAll("summary");
    expect(summaries).toHaveLength(2);
    for (const sm of Array.from(summaries)) {
      expect(sm.textContent).not.toMatch(/[▶▼►▸▾]/);
      expect(sm.querySelector("svg")).not.toBeNull();
    }
    expect(summaries[0]!.querySelector("svg")!.getAttribute("class")).toContain("lucide-chevron-down");
    expect(summaries[1]!.querySelector("svg")!.getAttribute("class")).toContain("lucide-chevron-right");
    await userEvent.click(summaries[1]!);
    expect(container.querySelectorAll("summary")[1]!.querySelector("svg")!.getAttribute("class")).toContain("lucide-chevron-down");
  });

  it("rows name their element when the same sentence would repeat, and keep the sentence when it is unique", () => {
    document.body.innerHTML = `<main><a id="el1" aria-label="Docs" href="#">x</a><button id="el2">Add expense</button><p id="el3">A long paragraph of text that goes on and on and on</p></main>`;
    const a = f(1, { message: "Tap target is too small to hit reliably.", rule: "tap-target.min-24" });
    const b = f(2, { message: "Tap target is too small to hit reliably.", rule: "tap-target.min-24" });
    const c = f(3, { message: "Content spills out of its box.", rule: "overflow.container" });
    render(<IssuesList {...base} findings={[a, b, c]} ignored={new Set()} />);
    const rows = screen.getAllByRole("option").map((r) => r.textContent);
    expect(rows[0]).toContain("a “Docs”");
    expect(rows[1]).toContain("button “Add expense”");
    expect(rows[2]).toContain("Content spills out of its box.");
    // The sentence is still there for screen readers and in the tooltip.
    expect(rows[0]).toContain("Tap target is too small to hit reliably.");
    expect(screen.getAllByRole("option")[0]!.getAttribute("title")).toContain("Tap target is too small");
  });

  it("above ten findings the header is the short rule title with the count and rows name their elements", () => {
    document.body.innerHTML = Array.from({ length: 12 }, (_, i) => `<a id="el${i + 1}" href="#">Link ${i + 1}</a>`).join("");
    const list = Array.from({ length: 12 }, (_, i) => f(i + 1, { message: "Tap target is too small to hit reliably.", rule: "tap-target.min-24" }));
    const { container } = render(<IssuesList {...base} findings={list} ignored={new Set()} />);
    expect(container.querySelector("summary")!.textContent).toBe("Tap target is too small · 12");
    expect(screen.getAllByRole("option")[0]!.textContent).toContain("a “Link 1”");
  });

  it("the strip stays on one line", () => {
    render(<IssuesList {...base} findings={[f(1)]} ignored={new Set()} strip="2 waiting · 1 with the agent · 4 done" />);
    const strip = document.querySelector("[data-shavin-strip]") as HTMLElement;
    expect(strip.textContent).toBe("2 waiting · 1 with the agent · 4 done");
    expect(strip.className).toMatch(/whitespace-nowrap/);
    expect(strip.className).toMatch(/truncate/);
  });

  it("only one row is a tab stop", () => {
    render(<IssuesList {...base} findings={[f(1), f(2), f(3)]} ignored={new Set()} />);
    expect(screen.getAllByRole("option").map((r) => r.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
  });

  it("Undo is enabled only when there is something to undo", async () => {
    const onUndo = vi.fn();
    const a = f(1);
    const { rerender } = render(<IssuesList {...base} onUndo={onUndo} canUndo={false} findings={[a]} ignored={new Set([a.id])} />);
    expect((screen.getByText("Undo") as HTMLButtonElement).closest("button")!.disabled).toBe(true);
    rerender(<IssuesList {...base} onUndo={onUndo} canUndo findings={[a]} ignored={new Set([a.id])} />);
    await userEvent.click(screen.getByText("Undo"));
    expect(onUndo).toHaveBeenCalled();
  });
});

describe("IssuesLayer", () => {
  const mountTargets = (n: number) => {
    document.body.innerHTML = Array.from({ length: n }, (_, i) => `<div id="el${i + 1}" data-box="${20 + (i % 10) * 90},${40 + Math.floor(i / 10) * 60},60,30">x</div>`).join("");
  };

  it("draws a marker per finding with an accessible name, and a tint when there are few", () => {
    mountTargets(3);
    const { container } = render(<IssuesLayer findings={[f(1), f(2, { severity: "warning" }), f(3)]} activeId={null} onOpen={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0]!.getAttribute("aria-label")).toMatch(/^(Error|Warning): Finding number/);
    expect(container.querySelectorAll("[data-shavin-markers] > div[aria-hidden]").length).toBe(3);
  });

  it("caps markers at twelve, says how many are only in the list, and drops tints above ten findings", () => {
    mountTargets(30);
    const list = Array.from({ length: 30 }, (_, i) => f(i + 1));
    const { container } = render(<IssuesLayer findings={list} activeId={null} onOpen={vi.fn()} />);
    expect(screen.getAllByRole("button").length).toBeLessThanOrEqual(12);
    expect(screen.getByText(/more in the list/)).toBeTruthy();
    expect(container.querySelectorAll("[data-shavin-markers] > div[aria-hidden]").length).toBe(0);
  });

  it("gives no marker to a finding whose element is gone or that has no element", () => {
    mountTargets(1);
    const gone = f(2);
    const page = makeFinding({ detector: "console", rule: "console.error", severity: "error", message: "The page logged an error.", fixHint: "x", selector: "(page)", rect: null });
    render(<IssuesLayer findings={[f(1), gone, page]} activeId={null} onOpen={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("the visible mark is 8 px (a dot for an error, a ring for a warning) inside a 24 px hit area", () => {
    mountTargets(2);
    render(<IssuesLayer findings={[f(1), f(2, { severity: "warning" })]} activeId={null} onOpen={vi.fn()} />);
    const [err, warn] = screen.getAllByRole("button");
    for (const b of [err!, warn!]) {
      expect(b.style.width).toBe("24px");
      expect(b.style.height).toBe("24px");
    }
    const dot = err!.querySelector("span")!;
    const ring = warn!.querySelector("span")!;
    expect([dot.style.width, dot.style.height]).toEqual(["8px", "8px"]);
    expect([ring.style.width, ring.style.height]).toEqual(["8px", "8px"]);
    expect(dot.style.background).toContain("--danger");
    expect(ring.style.background).toBe("transparent");
    expect(ring.style.border).toContain("1.5px solid");
  });

  it("a cluster of findings is one chip, 18 px, with the count inside", () => {
    document.body.innerHTML = `<div id="el1" data-box="200,200,60,30">x</div><div id="el2" data-box="205,205,60,30">y</div>`;
    render(<IssuesLayer findings={[f(1), f(2)]} activeId={null} onOpen={vi.fn()} />);
    const chip = screen.getByRole("button").querySelector("span")!;
    expect([chip.style.width, chip.style.height]).toEqual(["18px", "18px"]);
    expect(chip.textContent).toBe("2");
  });

  it("clicking a marker opens its finding", async () => {
    mountTargets(1);
    const onOpen = vi.fn();
    render(<IssuesLayer findings={[f(1)]} activeId={null} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledWith(f(1).id);
  });

  it("outlines the element of the active row", () => {
    mountTargets(2);
    const { container } = render(<IssuesLayer findings={[f(1), f(2)]} activeId={f(2).id} onOpen={vi.fn()} />);
    const lines = Array.from(container.querySelectorAll<HTMLElement>("[data-shavin-markers] > div[aria-hidden]")).filter((d) => d.style.border.includes("1px solid"));
    expect(lines).toHaveLength(1);
  });
});

describe("markerAnchor", () => {
  const vw = 1280;
  const vh = 800;
  it("sits just outside the top-left corner, about 6 px up and left", () => {
    expect(markerAnchor({ x: 300, y: 200, w: 120, h: 40 }, vw, vh)).toEqual({ x: 294, y: 194 });
  });
  it("an element at the left edge or narrower than the hit area gets it outside on the left, vertically centred", () => {
    expect(markerAnchor({ x: 10, y: 100, w: 200, h: 40 }, vw, vh)).toEqual({ x: 12, y: 120 });
    expect(markerAnchor({ x: 300, y: 100, w: 16, h: 16 }, vw, vh)).toEqual({ x: 292, y: 108 });
  });
  it("is clamped so the whole 24 px hit area stays inside the viewport", () => {
    expect(markerAnchor({ x: 600, y: 2, w: 100, h: 20 }, vw, vh).y).toBe(12);
    expect(markerAnchor({ x: 1275, y: 100, w: 100, h: 20 }, vw, vh).x).toBe(1268);
    expect(markerAnchor({ x: 300, y: 900, w: 100, h: 20 }, vw, vh).y).toBe(788);
  });
});

describe("InspectorRoot", () => {
  it("is its own scope: scheme attribute, pinned status colours, and a portal host inside the scope", () => {
    const { container } = render(
      <InspectorRoot scheme="dark">
        <span>child</span>
      </InspectorRoot>,
    );
    const root = container.querySelector<HTMLElement>("[data-shavin-inspector]")!;
    expect(root.getAttribute("data-scheme")).toBe("dark");
    const scope = root.querySelector<HTMLElement>("[data-shavin-scope]")!;
    expect(scope.style.getPropertyValue("--danger")).toBe("235 113 104");
    expect(scope.style.getPropertyValue("--shavin-element")).toBe("176 112 222");
    expect(scope.contains(root.querySelector("[data-shavin-portal]"))).toBe(true);
    expect(root.style.pointerEvents).toBe("none");
  });

  it("pins the light status colours for the light scheme", () => {
    const { container } = render(<InspectorRoot scheme="light"><span /></InspectorRoot>);
    const scope = container.querySelector<HTMLElement>("[data-shavin-scope]")!;
    expect(scope.style.getPropertyValue("--danger")).toBe("186 55 42");
    expect(scope.classList.contains("dark")).toBe(false);
  });
});

describe("Inspector", () => {
  const page = () => {
    document.body.innerHTML = `<main><p id="target" data-box="10,10,200,30">Hello</p><div id="el1" data-box="10,100,100,20">one</div></main>`;
  };
  const press = (key: string, init: KeyboardEventInit = {}) => act(() => void fireEvent.keyDown(document.body, { key, ...init }));

  it("starts idle: only the bar, no list, no highlight shown", () => {
    page();
    render(<Inspector findings={[f(1)]} />);
    expect(screen.getByRole("toolbar")).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
    expect((document.querySelector("[data-shavin-highlight]") as HTMLElement).style.opacity).toBe("0");
  });

  it("the V and I keys switch tools only when a tool is active or the bar has focus", async () => {
    page();
    render(<Inspector findings={[f(1)]} />);
    press("i");
    expect(screen.queryByRole("listbox")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Issues" }));
    expect(screen.getByRole("listbox")).toBeTruthy();
    press("v");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByRole("button", { name: "Select" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("typing in a field never triggers a shortcut", async () => {
    page();
    render(<Inspector findings={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Select" }));
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { key: "i" });
    expect(screen.getByRole("button", { name: "Select" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("no key typed in a host input, textarea or editable element reaches the inspector", async () => {
    page();
    render(<Inspector findings={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Select" }));
    const input = document.createElement("input");
    const area = document.createElement("textarea");
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    // jsdom does not derive isContentEditable from the attribute.
    Object.defineProperty(editable, "isContentEditable", { value: true });
    document.body.append(input, area, editable);
    for (const el of [input, area, editable]) {
      el.focus();
      for (const key of ["v", "V", "i", "I", "t", "T", ",", "Escape"]) fireEvent.keyDown(el, { key });
    }
    expect(screen.getByRole("button", { name: "Select" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Issues" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("with no tool on and focus on the page, the shortcut keys do nothing", () => {
    page();
    render(<Inspector findings={[]} />);
    fireEvent.keyDown(document.body, { key: "v" });
    fireEvent.keyDown(document.body, { key: "i" });
    expect(screen.getByRole("button", { name: "Select" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "Issues" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("a first visit starts collapsed; the tile opens the bar and the choice is remembered", async () => {
    page();
    localStorage.clear();
    const { unmount } = render(<Inspector findings={[]} />);
    expect(screen.queryByRole("button", { name: "Select" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Open the inspector bar" }));
    expect(screen.getByRole("button", { name: "Select" })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("shavin-inspector-bar")!).collapsed).toBe(false);
    unmount();
    render(<Inspector findings={[]} />);
    expect(screen.getByRole("button", { name: "Select" })).toBeTruthy();
  });

  it("Esc in the bar with nothing else open collapses it, after backing out a tool first", async () => {
    page();
    render(<Inspector findings={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Select" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Select" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "Select" })).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Select" })).toBeNull();
    expect(screen.getByRole("button", { name: "Open the inspector bar" })).toBeTruthy();
  });

  it("collapsing the bar turns the active tool off", async () => {
    page();
    render(<Inspector findings={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Issues" }));
    await userEvent.click(screen.getByRole("button", { name: "Collapse the inspector bar" }));
    expect(document.querySelector("[data-shavin-list]")).toBeNull();
  });

  it("Select: clicking a page element selects it, outlines it, announces it and does not reach the page", async () => {
    page();
    const pageClick = vi.fn();
    document.getElementById("target")!.addEventListener("click", pageClick);
    render(<Inspector findings={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Select" }));
    const target = document.getElementById("target")!;
    await act(async () => {
      fireEvent.click(target, { clientX: 20, clientY: 20 });
    });
    expect(pageClick).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toMatch(/^Selected p, 200 by 30/);
    const hl = document.querySelector("[data-shavin-highlight]") as HTMLElement;
    expect(hl.style.opacity).toBe("1");
  });

  it("Esc backs out one step at a time: the popover, then the selection, then the tool", async () => {
    page();
    render(<Inspector findings={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Select" }));
    await act(async () => {
      fireEvent.click(document.getElementById("target")!, { clientX: 20, clientY: 20 });
    });
    expect(screen.getByRole("dialog", { name: "Comment on selected element" })).toBeTruthy();
    press("Escape");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("status").textContent).toMatch(/^Selected p/);
    press("Escape");
    expect(screen.getByRole("status").textContent).toBe("");
    expect(screen.getByRole("button", { name: "Select" }).getAttribute("aria-pressed")).toBe("true");
    press("Escape");
    expect(screen.getByRole("button", { name: "Select" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("tooltips and other floating parts portal into the inspector's own scope, not into the page", async () => {
    page();
    render(<Inspector findings={[]} />);
    await userEvent.tab();
    const tip = await screen.findByRole("tooltip");
    const scope = document.querySelector("[data-shavin-scope]")!;
    expect(scope.contains(tip)).toBe(true);
    expect(tip.closest("[data-shavin-inspector]")).not.toBeNull();
    expect(document.body.querySelector(":scope > [data-radix-popper-content-wrapper]")).toBeNull();
  });

  it("the page's theme cannot reach the inspector: pinned colours stay on the scope while the page changes", () => {
    page();
    document.documentElement.classList.add("dark");
    document.documentElement.style.setProperty("--danger", "1 2 3");
    const { rerender } = render(<Inspector findings={[]} />);
    const scope = document.querySelector<HTMLElement>("[data-shavin-scope]")!;
    const before = scope.style.getPropertyValue("--danger");
    document.documentElement.style.setProperty("--danger", "9 9 9");
    rerender(<Inspector findings={[]} />);
    expect(scope.style.getPropertyValue("--danger")).toBe(before);
    expect(before).not.toBe("");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.removeProperty("--danger");
  });

  it("Alt+Shift+S hides the whole inspector and shows it again", () => {
    page();
    render(<Inspector findings={[]} />);
    expect(screen.queryByRole("toolbar")).not.toBeNull();
    act(() => void fireEvent.keyDown(document.body, { key: "S", code: "KeyS", altKey: true, shiftKey: true }));
    expect(screen.queryByRole("toolbar")).toBeNull();
    act(() => void fireEvent.keyDown(document.body, { key: "S", code: "KeyS", altKey: true, shiftKey: true }));
    expect(screen.queryByRole("toolbar")).not.toBeNull();
  });

  it("the Issues badge and mode label count only findings that are not ignored", async () => {
    page();
    const a = f(1);
    const b = f(2, { severity: "warning" });
    localStorage.setItem("shavin-inspector-ignored", JSON.stringify([a.id]));
    render(<Inspector findings={[a, b]} />);
    await userEvent.click(screen.getByRole("button", { name: "Issues" }));
    expect(screen.getByText("Issues 1")).toBeTruthy();
    expect(screen.getByText("All 1")).toBeTruthy();
  });

  it("opening a finding from the list scrolls to its element and selects it", async () => {
    page();
    render(<Inspector findings={[f(1)]} />);
    await userEvent.click(screen.getByRole("button", { name: "Issues" }));
    await userEvent.click(screen.getAllByRole("option")[0]!);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toMatch(/^Selected div/);
  });

  it("a page-level finding opens its popover with nothing highlighted", async () => {
    page();
    const pageFinding = makeFinding({ detector: "console", rule: "console.error", severity: "error", message: "The page logged an error.", fixHint: "Open the console.", selector: "(page)", rect: null });
    render(<Inspector findings={[pageFinding]} />);
    await userEvent.click(screen.getByRole("button", { name: "Issues" }));
    await userEvent.click(screen.getAllByRole("option")[0]!);
    const dialog = await screen.findByRole("dialog", { name: "Comment on selected element" });
    expect(within(dialog).getByText("The page logged an error")).toBeTruthy();
    expect((document.querySelector("[data-shavin-highlight]") as HTMLElement).style.opacity).toBe("0");
  });

  it("Tab from a page control reaches the bar; closing it with Esc returns focus to that control", async () => {
    page();
    const before = document.createElement("button");
    before.textContent = "Page button";
    document.body.prepend(before);
    render(<Inspector findings={[]} />);
    before.focus();
    await userEvent.tab();
    const mark = screen.getByRole("button", { name: "Collapse the inspector bar" });
    expect(document.activeElement).toBe(mark);
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Select" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Select" })).toBeNull();
    expect(document.activeElement).toBe(before);
  });

  it("every control in the bar can be reached with the keyboard", async () => {
    page();
    render(<Inspector findings={[]} />);
    const mark = screen.getByRole("button", { name: "Collapse the inspector bar" });
    mark.focus();
    const seen: string[] = [mark.getAttribute("aria-label")!];
    for (let i = 0; i < 4; i++) {
      await userEvent.keyboard("{ArrowRight}");
      seen.push((document.activeElement as HTMLElement).getAttribute("aria-label")!);
    }
    expect(seen).toEqual(["Collapse the inspector bar", "Select", "Issues", "Theme", "Settings"]);
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Settings" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("T and , open and close the Theme and Settings panels, and both can be open next to a tool", async () => {
    page();
    render(<Inspector findings={[]} />);
    const pressed = (n: string) => screen.getByRole("button", { name: n }).getAttribute("aria-pressed");
    await userEvent.click(screen.getByRole("button", { name: "Select" }));
    await userEvent.keyboard("t");
    await userEvent.keyboard(",");
    expect([pressed("Select"), pressed("Theme"), pressed("Settings")]).toEqual(["true", "true", "true"]);
    await userEvent.keyboard("t");
    expect([pressed("Theme"), pressed("Settings")]).toEqual(["false", "true"]);
  });

  it("Esc ladder: panel, then tool, then collapse, one step per press", async () => {
    page();
    render(<Inspector findings={[]} />);
    const pressed = (n: string) => screen.getByRole("button", { name: n }).getAttribute("aria-pressed");
    await userEvent.click(screen.getByRole("button", { name: "Select" }));
    await userEvent.click(screen.getByRole("button", { name: "Theme" }));
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    await userEvent.keyboard("{Escape}");
    expect([pressed("Select"), pressed("Theme"), pressed("Settings")]).toEqual(["true", "true", "false"]);
    await userEvent.keyboard("{Escape}");
    expect([pressed("Select"), pressed("Theme")]).toEqual(["true", "false"]);
    await userEvent.keyboard("{Escape}");
    expect(pressed("Select")).toBe("false");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Select" })).toBeNull();
  });

  it("no T or , typed in a host field toggles a panel", async () => {
    page();
    render(<Inspector findings={[]} />);
    const input = document.createElement("input");
    document.body.appendChild(input);
    await userEvent.click(screen.getByRole("button", { name: "Select" }));
    input.focus();
    await userEvent.keyboard("t,");
    expect(screen.getByRole("button", { name: "Theme" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "Settings" }).getAttribute("aria-pressed")).toBe("false");
  });
});

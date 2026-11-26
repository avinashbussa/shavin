import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "jest-axe";
import { ChatBubble, Reasoning, ToolCall, VoiceInput } from "@shavin/ui";

// New states and props for voice and streaming chat UIs: ChatBubble, ToolCall, VoiceInput, Reasoning.

// Murmur draws on a canvas; jsdom has none and logs "not implemented" on every mount.
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

const announcer = (p: "polite" | "assertive") => document.querySelector(`[data-shavin-announcer="${p}"]`);

describe("ChatBubble", () => {
  it("caps width on the column, not the bubble, so a bubble sizes to its text", () => {
    const { container } = render(<ChatBubble role="user" hideAvatar>make this a row</ChatBubble>);
    const bubble = screen.getByText("make this a row");
    // A percentage max-width on the bubble resolved against a shrink-wrapped parent and wrapped early.
    expect(bubble.className).toContain("max-w-full");
    expect(bubble.className).not.toContain("max-w-[85%]");
    expect(container.querySelector(".max-w-\\[85\\%\\]")).not.toBeNull();
  });

  it("keeps the existing look by default: tail on the top corner, avatar shown for every role", () => {
    const { container } = render(<ChatBubble role="user" avatarFallback="AB">hi</ChatBubble>);
    expect(screen.getByText("hi").className).toContain("rounded-tr-");
    // Avatar column present (two children: avatar + message column), as on main for every role.
    expect(container.querySelector("[data-role='user']")?.children).toHaveLength(2);
  });

  it("sharpCorner moves the tail, none keeps every corner round", () => {
    const { rerender } = render(<ChatBubble role="user" hideAvatar sharpCorner="bottom">hi</ChatBubble>);
    expect(screen.getByText("hi").className).toContain("rounded-br-");
    rerender(<ChatBubble role="user" hideAvatar sharpCorner="none">hi</ChatBubble>);
    expect(screen.getByText("hi").className).not.toMatch(/rounded-(tr|br|tl|bl)-/);
  });

  it("hoverTimestamp keeps the timestamp hidden until hover", () => {
    render(<ChatBubble role="user" hideAvatar timestamp="9:41" hoverTimestamp>hi</ChatBubble>);
    expect(screen.getByText("9:41").className).toContain("opacity-0");
  });

  it("interim marks unconfirmed live text quiet and italic", () => {
    render(<ChatBubble role="user" interim>make this</ChatBubble>);
    const span = screen.getByText("make this");
    expect(span.tagName).toBe("SPAN");
    expect(span.className).toMatch(/italic/);
    expect(span.className).toMatch(/text-fg-subtle/);
  });

  it("without interim the text is not wrapped in a quiet span", () => {
    render(<ChatBubble role="user">done</ChatBubble>);
    expect(screen.getByText("done").className).not.toMatch(/italic/);
  });
});

describe("ToolCall", () => {
  it("title replaces the monospace name with a wrapping heading", () => {
    render(<ToolCall name="set_prop" title="Change property" />);
    const heading = screen.getByText("Change property");
    expect(heading.className).toContain("break-words");
    expect(heading.className).not.toContain("font-mono");
    expect(screen.queryByText("set_prop")).toBeNull();
  });

  it("without title the name stays monospace", () => {
    render(<ToolCall name="search_tickets" />);
    expect(screen.getByText("search_tickets").className).toContain("font-mono");
  });

  it("compact keeps the status for screen readers but drops the badge", () => {
    const { container } = render(<ToolCall name="x" title="Move" status="done" compact />);
    const label = screen.getByText("Done");
    expect(label.className).toContain("sr-only");
    // Badge is a visible chip; only the sr-only text is left.
    expect(container.querySelectorAll("[class*='sr-only']")).toHaveLength(1);
  });

  it("non-compact still shows the visible status badge", () => {
    render(<ToolCall name="x" status="error" />);
    expect(screen.getByText("Failed").className).not.toContain("sr-only");
  });

  it("footer renders under the result with its own actions", async () => {
    const onUndo = vi.fn();
    render(
      <ToolCall name="x" title="Change text" footer={<button type="button" onClick={onUndo}>Undo</button>}>
        Set text
      </ToolCall>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Set text")).toBeInTheDocument();
  });

  it("no footer, no footer row", () => {
    const { container } = render(<ToolCall name="x">Result</ToolCall>);
    expect(container.querySelector(".border-t")).toBeNull();
  });
});

describe("VoiceInput", () => {
  it("push-to-send listening shows the send arrow and a wrapping transcript", () => {
    render(<VoiceInput state="listening" transcript="make this heading bigger" description="Pointing at Hero" onStop={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole("button", { name: "Stop and send" })).toBeInTheDocument();
    const t = screen.getByText("make this heading bigger");
    expect(t.className).toContain("line-clamp-2");
    expect(t.className).not.toContain("hidden");
    expect(screen.getByText("Pointing at Hero")).toBeInTheDocument();
  });

  it("hands-free has one Stop button, no send arrow, and calls onStop", async () => {
    const onStop = vi.fn();
    render(<VoiceInput mode="hands-free" state="listening" description="Speak, or point at a layer first" onStop={onStop} />);
    expect(screen.queryByRole("button", { name: "Stop and send" })).toBeNull();
    expect(screen.getByText("Listening, hands-free")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Stop listening" }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("hands-free shows the transcript as the headline while listening", () => {
    render(<VoiceInput mode="hands-free" state="listening" transcript="round the corners" />);
    expect(screen.getByText("round the corners")).toBeInTheDocument();
    expect(screen.queryByText("Listening, hands-free")).toBeNull();
  });

  it("processing shows the label (default and custom) as a status", () => {
    const { rerender } = render(<VoiceInput state="processing" />);
    expect(screen.getByRole("status")).toHaveTextContent("Working on it…");
    rerender(<VoiceInput state="processing" processingLabel="Applying the change…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Applying the change…");
  });

  it("processing in hands-free keeps the status label even with a transcript", () => {
    render(<VoiceInput mode="hands-free" state="processing" transcript="old words" processingLabel="Applying…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Applying…");
    expect(screen.queryByText("old words")).toBeNull();
  });

  it.each(["requesting", "transcribing", "processing"] as const)("onCancel adds a cancel button while %s", async (state) => {
    const onCancel = vi.fn();
    render(<VoiceInput state={state} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("no cancel button without onCancel", () => {
    render(<VoiceInput state="transcribing" />);
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("transcribing wraps the transcript and shows the description", () => {
    render(<VoiceInput state="transcribing" transcript="add a pricing section" description="Pointing at Hero" />);
    expect(screen.getByText("add a pricing section").className).toContain("line-clamp-2");
    expect(screen.getByText("Pointing at Hero")).toBeInTheDocument();
  });
});

describe("Reasoning", () => {
  afterEach(() => vi.useRealTimers());

  it("times the thinking itself and reports Thought for Ns when done", () => {
    vi.useFakeTimers();
    const { rerender } = render(<Reasoning status="thinking">hmm</Reasoning>);
    expect(screen.getByRole("button")).toHaveTextContent("Thinking…");
    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.getByRole("button")).toHaveTextContent("Thinking… 4s");
    rerender(<Reasoning status="done">hmm</Reasoning>);
    expect(screen.getByRole("button")).toHaveTextContent("Thought for 4s");
  });

  it("an explicit duration wins over the measured one", () => {
    vi.useFakeTimers();
    const { rerender } = render(<Reasoning status="thinking">x</Reasoning>);
    act(() => { vi.advanceTimersByTime(2000); });
    rerender(<Reasoning status="done" duration="9s">x</Reasoning>);
    expect(screen.getByRole("button")).toHaveTextContent("Thought for 9s");
  });

  it("a Reasoning that starts done and untimed says Thought process", () => {
    render(<Reasoning status="done">x</Reasoning>);
    expect(screen.getByRole("button")).toHaveTextContent("Thought process");
  });

  it("folds away when thinking finishes and announces it", async () => {
    const { rerender } = render(<Reasoning status="thinking">the text</Reasoning>);
    expect(screen.getByText("the text")).toBeInTheDocument();
    rerender(<Reasoning status="done">the text</Reasoning>);
    expect(screen.queryByText("the text")).toBeNull();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
    await vi.waitFor(() => expect(announcer("polite")).toHaveTextContent("Finished thinking"));
  });

  it("a controlled open state is left alone when thinking finishes", () => {
    const { rerender } = render(<Reasoning status="thinking" open>the text</Reasoning>);
    rerender(<Reasoning status="done" open>the text</Reasoning>);
    expect(screen.getByText("the text")).toBeInTheDocument();
  });

  it("the user can reopen it after it folds", async () => {
    const { rerender } = render(<Reasoning status="thinking">the text</Reasoning>);
    rerender(<Reasoning status="done">the text</Reasoning>);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("the text")).toBeInTheDocument();
  });

  it("autoCollapse={false} leaves the text open when thinking finishes", () => {
    const { rerender } = render(<Reasoning status="thinking" autoCollapse={false}>the text</Reasoning>);
    rerender(<Reasoning status="done" autoCollapse={false}>the text</Reasoning>);
    expect(screen.getByText("the text")).toBeInTheDocument();
  });

  it("maxHeight scrolls the open text inside the block", () => {
    render(<Reasoning status="thinking" maxHeight={120}>long text</Reasoning>);
    const body = screen.getByText("long text");
    expect(body.style.maxHeight).toBe("120px");
    expect(body.className).toContain("overflow-y-auto");
  });

  it("without maxHeight the text is not clamped", () => {
    render(<Reasoning status="thinking">short</Reasoning>);
    const body = screen.getByText("short");
    expect(body.style.maxHeight).toBe("");
    expect(body.className).not.toContain("overflow-y-auto");
  });
});

describe("a11y: new states have no axe violations", () => {
  it.each([
    ["VoiceInput hands-free listening", <VoiceInput key="a" mode="hands-free" state="listening" transcript="make it bigger" description="Pointing at Hero" onStop={() => {}} />],
    ["VoiceInput hands-free processing", <VoiceInput key="b" mode="hands-free" state="processing" onCancel={() => {}} />],
    ["VoiceInput processing with cancel", <VoiceInput key="c" state="processing" onCancel={() => {}} />],
    ["VoiceInput transcribing with cancel", <VoiceInput key="d" state="transcribing" transcript="add a section" onCancel={() => {}} />],
    ["ToolCall compact with title and footer", <ToolCall key="e" name="set_prop" title="Change property" compact footer={<button type="button">Undo</button>}>Set direction</ToolCall>],
    ["ChatBubble interim", <ChatBubble key="f" role="user" hideAvatar interim>make this</ChatBubble>],
    ["Reasoning with maxHeight", <Reasoning key="g" status="thinking" maxHeight={80}>long text</Reasoning>],
  ])("%s", async (_name, ui) => {
    const { container } = render(<div>{ui}</div>);
    expect(await axe(container)).toHaveNoViolations();
  });
});

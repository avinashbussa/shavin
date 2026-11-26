import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NpsScale, Rating, RatingSummary, SentimentRating, calculateNps } from "@shavin/ui";

describe("Rating", () => {
  it("is announced as an image when read only", () => {
    render(<Rating readOnly value={4.5} />);
    expect(screen.getByRole("img", { name: "4.5 out of 5 stars" })).toBeTruthy();
  });

  it("fills a partial star by its fraction", () => {
    const { container } = render(<Rating readOnly value={3.4} />);
    const widths = Array.from(container.querySelectorAll<HTMLElement>("[data-fill]")).map((el) => Math.round(parseFloat(el.style.width)));
    expect(widths).toEqual([100, 100, 100, 40, 0]);
  });

  it("moves with the arrow keys and reports the value", () => {
    const onValueChange = vi.fn();
    render(<Rating defaultValue={2} precision="half" onValueChange={onValueChange} />);
    const slider = screen.getByRole("slider", { name: "Rating" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenLastCalledWith(2.5);
    fireEvent.keyDown(slider, { key: "End" });
    expect(onValueChange).toHaveBeenLastCalledWith(5);
    fireEvent.keyDown(slider, { key: "Home" });
    expect(onValueChange).toHaveBeenLastCalledWith(0);
  });

  it("does nothing when disabled", () => {
    const onValueChange = vi.fn();
    render(<Rating disabled value={2} onValueChange={onValueChange} />);
    // Stays a slider (keeps its input semantics) but is disabled and inert to keys.
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-disabled", "true");
    expect(slider).toHaveAttribute("tabindex", "-1");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("NpsScale", () => {
  it("renders 0 to 10 and selects", () => {
    const onValueChange = vi.fn();
    render(<NpsScale onValueChange={onValueChange} />);
    expect(screen.getAllByRole("radio")).toHaveLength(11);
    fireEvent.click(screen.getByRole("radio", { name: "9" }));
    expect(onValueChange).toHaveBeenCalledWith(9);
    expect(screen.getByRole("radio", { name: "9" }).getAttribute("aria-checked")).toBe("true");
  });

  it("calculates the score", () => {
    expect(calculateNps([10, 9, 9, 8, 7, 3])).toMatchObject({ score: 33, promoters: 3, passives: 2, detractors: 1, total: 6 });
    expect(calculateNps([]).score).toBe(0);
  });
});

describe("SentimentRating", () => {
  it("offers thumbs by default and faces on request", () => {
    const { rerender } = render(<SentimentRating />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    rerender(<SentimentRating variant="faces" />);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("reports -1 for thumbs down", () => {
    const onValueChange = vi.fn();
    render(<SentimentRating onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Not helpful" }));
    expect(onValueChange).toHaveBeenCalledWith(-1);
  });
});

describe("RatingSummary", () => {
  it("derives the average and total from counts", () => {
    render(<RatingSummary counts={[0, 0, 0, 5, 5]} />);
    expect(screen.getByText("4.5")).toBeTruthy();
    expect(screen.getByText("10 reviews")).toBeTruthy();
  });

  it("makes rows filter buttons when onSelect is set", () => {
    const onSelect = vi.fn();
    render(<RatingSummary counts={[1, 2, 3, 4, 5]} onSelect={onSelect} />);
    // A listitem wraps a real toggle button (a role on the button would drop its semantics).
    const button = screen.getByRole("button", { name: "5 stars, 5 reviews" });
    expect(button.closest('[role="listitem"]')).not.toBeNull();
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(5);
  });
});

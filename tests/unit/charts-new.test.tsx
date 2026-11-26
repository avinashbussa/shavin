import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BarChart, DonutChart, FunnelChart, Heatmap, LineChart, niceScale } from "@shavin/ui";

const rows = [
  { label: "Mon", a: 10, b: 4 },
  { label: "Tue", a: 25, b: 12 },
  { label: "Wed", a: 18, b: 9 },
];
const series = [{ key: "a", name: "A" }, { key: "b", name: "B", tone: "success" }];
const texts = (c: HTMLElement) => Array.from(c.querySelectorAll("text")).map((t) => t.textContent);

describe("niceScale", () => {
  it("rounds the maximum up to round ticks", () => {
    expect(niceScale(2785).ticks).toEqual([0, 1000, 2000, 3000]);
    expect(niceScale(87).max).toBe(100);
    expect(niceScale(0).ticks.length).toBeGreaterThan(1);
  });
});

describe("LineChart", () => {
  it("draws one path per series plus a legend, and stacks areas", () => {
    const { container, getAllByText } = render(<LineChart data={rows} series={series} />);
    expect(container.querySelectorAll("path[stroke]:not(pattern path)")).toHaveLength(2);
    // Legend entry (the series name also heads a column of the screen-reader data table).
    expect(getAllByText("B").some((el) => !el.closest("table"))).toBe(true);
    const area = render(<LineChart type="area" stacked data={rows} series={series} />);
    expect(area.container.querySelectorAll("path[fill]:not([fill='none'])")).toHaveLength(2);
  });
  it("uses round y ticks", () => {
    const { container } = render(<LineChart data={rows} series={series} />);
    expect(texts(container).filter((t) => /^\d+$/.test(t ?? ""))).toContain("30");
  });
});

describe("BarChart", () => {
  it("draws one bar per series per category when grouped", () => {
    const { container } = render(<BarChart data={rows} series={series} />);
    expect(container.querySelectorAll("[role=group] svg rect:not([fill='transparent']):not(pattern rect)")).toHaveLength(rows.length * series.length);
  });
  it("puts labels on the left when horizontal", () => {
    const { container } = render(<BarChart orientation="horizontal" data={rows} series={series} mode="stacked" />);
    expect(texts(container)).toEqual(expect.arrayContaining(["Mon", "Tue", "Wed"]));
  });
});

describe("Heatmap", () => {
  it("renders values and leaves null cells empty", () => {
    const { container } = render(<Heatmap rows={["r1", "r2"]} columns={["c1", "c2"]} values={[[10, 20], [30, null]]} />);
    expect(container.textContent).toContain("30");
    expect(container.querySelectorAll("[title]")).toHaveLength(3);
  });
});

describe("FunnelChart", () => {
  const steps = [{ name: "Seen", value: 1000 }, { name: "Clicked", value: 500 }, { name: "Bought", value: 100 }];
  it("shows drop-off in both orientations", () => {
    for (const orientation of ["horizontal", "vertical"] as const) {
      const { container } = render(<FunnelChart steps={steps} orientation={orientation} />);
      expect(container.textContent).toContain("50%");
      expect(container.textContent).toContain("80%");
    }
  });
  it("hides drop-off on request", () => {
    const { container } = render(<FunnelChart steps={steps} showDropOff={false} />);
    expect(container.textContent).not.toContain("drop");
  });
});

describe("DonutChart", () => {
  it("renders a ring segment and a legend row per slice with percentages", () => {
    const { container } = render(<DonutChart data={[{ label: "Free", value: 75 }, { label: "Paid", value: 25 }]} />);
    expect(container.querySelectorAll("circle")).toHaveLength(3);
    expect(container.textContent).toContain("75%");
    expect(container.textContent).toContain("100");
  });
});

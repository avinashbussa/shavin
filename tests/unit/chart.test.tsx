import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { BarChart, LineChart, Sparkline, formatChartValue } from "@shavin/ui";

const data = [
  { label: "Oct", name: "Oct 2025", value: 6884.12 },
  { label: "Nov", value: 3000, tone: "success" as const },
  { label: "Dec", value: 9000, tone: "neutral" as const },
  { label: "Jan", value: 1000 },
];

const texts = (c: HTMLElement) => Array.from(c.querySelectorAll("text")).map((t) => t.textContent);
// Plot bars only: skip the hover hit areas, the series fill patterns and the legend swatches.
const bars = (c: HTMLElement) =>
  Array.from(c.querySelectorAll("[role=group] svg rect")).filter((r) => r.getAttribute("fill") !== "transparent" && !r.closest("pattern"));

describe("formatChartValue", () => {
  it("formats number, compact, currency, percent", () => {
    expect(formatChartValue(3000)).toBe("3000");
    expect(formatChartValue(9000, "compact")).toBe("9k");
    expect(formatChartValue(1500000, "currency")).toBe("$1.5m");
    expect(formatChartValue(27, "percent")).toBe("27%");
    expect(formatChartValue(5, "number", "~", " ms")).toBe("~5 ms");
    expect(formatChartValue(6884.12, "currency", undefined, undefined, true)).toBe("$6,884.12");
  });
});

describe("BarChart", () => {
  it("works with a single series of values (no series prop)", () => {
    const { container } = render(<BarChart data={data} />);
    expect(bars(container)).toHaveLength(data.length);
  });

  it("formats y ticks, honours tickCount and yMax", () => {
    const { container } = render(<BarChart data={data} yFormat="currency" tickCount={3} yMax={9000} />);
    expect(texts(container).filter((t) => t?.startsWith("$"))).toEqual(["$0", "$3k", "$6k", "$9k"]);
  });

  it("controls x labels (stride, mobile stride, explicit list, hidden)", () => {
    const names = ["Oct", "Nov", "Dec", "Jan"];
    const every = render(<BarChart data={data} xLabelEvery={2} />);
    expect(texts(every.container).filter((t) => names.includes(t ?? ""))).toEqual(["Oct", "Dec"]);
    const mobile = render(<BarChart data={data} xLabelEveryMobile={2} />);
    const nov = Array.from(mobile.container.querySelectorAll("text")).find((t) => t.textContent === "Nov");
    expect(nov?.getAttribute("class")).toContain("max-md:hidden");
    const explicit = render(<BarChart data={data} xLabels={["Oct", "Jan"]} />);
    expect(texts(explicit.container).filter((t) => names.includes(t ?? ""))).toEqual(["Oct", "Jan"]);
    const none = render(<BarChart data={data} showXAxis={false} />);
    expect(texts(none.container).includes("Oct")).toBe(false);
  });

  it("hides the y axis and grid on request", () => {
    const { container } = render(<BarChart data={data} showYAxis={false} showGrid={false} />);
    expect(container.querySelectorAll("line")).toHaveLength(0);
    expect(texts(container).every((t) => !/^\d/.test(t ?? ""))).toBe(true);
  });

  it("applies height", () => {
    const { container } = render(<BarChart data={data} height={120} padding={{ left: 0 }} />);
    expect((container.querySelector("svg")?.parentElement as HTMLElement).style.height).toBe("120px");
  });

  it("maps datum tone and bar radius to tokens", () => {
    const { container } = render(<BarChart data={data} barRadius="floor" showGrid={false} />);
    const rects = bars(container);
    expect(rects[1].getAttribute("fill")).toBe("rgb(var(--success))");
    expect(rects[2].getAttribute("fill")).toBe("rgb(var(--fg-muted) / 0.4)");
    // jsdom drops the SVG `rx` CSS property, so assert on server markup.
    expect(renderToStaticMarkup(<BarChart data={data} barRadius="floor" />)).toContain("rx:min(var(--radius-lg)");
    expect(renderToStaticMarkup(<BarChart data={data} />)).toContain("rx:var(--radius-sm)");
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it("grouped series use series tone and respect maxBarWidth", () => {
    const { container } = render(
      <BarChart data={[{ label: "A", a: 10, b: 5 }]} series={[{ key: "a", name: "A", tone: "neutral" }, { key: "b", name: "B", tone: "accent" }]} maxBarWidth={20} />,
    );
    const rects = bars(container);
    // Second series is patterned (WCAG 1.4.1); the pattern carries the series tone.
    const fill = rects[1].getAttribute("fill")!;
    expect(fill).toMatch(/^url\(#/);
    expect(container.querySelector(`${fill.slice(4, -1).replace(/([^\w#-])/g, "\\$1")} rect`)?.getAttribute("fill")).toBe("rgb(var(--accent))");
    expect(Number(rects[0].getAttribute("width"))).toBeLessThanOrEqual(20);
  });

  it("draws negative values below the zero line", () => {
    const { container } = render(<BarChart data={[{ label: "A", value: 10 }, { label: "B", value: -10 }]} />);
    const [up, down] = bars(container);
    expect(Number(down.getAttribute("y"))).toBeGreaterThan(Number(up.getAttribute("y")));
  });
});

describe("LineChart", () => {
  it("works with a single series of values (no series prop)", () => {
    const { container } = render(<LineChart data={data} />);
    expect(container.querySelectorAll("path").length).toBe(1);
  });

  it("supports step curves and hiding the y axis", () => {
    const { container } = render(<LineChart curve="step" data={data} showYAxis={false} />);
    expect(container.querySelector("path")?.getAttribute("d")).toMatch(/H .* V /);
    expect(texts(container).includes("0")).toBe(false);
  });
});

describe("Sparkline", () => {
  it("has no axes, grid or text and fills its container", () => {
    const { container } = render(<Sparkline type="bar" data={data} className="h-12" />);
    expect(container.querySelectorAll("text")).toHaveLength(0);
    expect(container.querySelectorAll("line")).toHaveLength(0);
    expect(container.querySelectorAll("rect")).toHaveLength(data.length);
    expect(container.firstElementChild?.className).toContain("h-12");
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("draws a line from plain numbers", () => {
    const { container } = render(<Sparkline data={[1, 3, 2, 5]} />);
    expect(container.querySelector("path")?.getAttribute("stroke")).toBe("rgb(var(--accent))");
  });
});

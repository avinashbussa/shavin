import { describe, it, expect } from "vitest";
import { MARKER_LIMITS, inViewport, intersects, planMarkers, type MarkerInput } from "../../../packages/ui/src/inspector/geometry";

const p = (id: string, x: number, y: number, severity: "error" | "warning" = "error"): MarkerInput => ({ id, x, y, severity });

describe("planMarkers tint", () => {
  it("tints only when 10 or fewer findings count in total, even if fewer of them are on screen", () => {
    expect(planMarkers([p("a", 10, 10)], MARKER_LIMITS, 10).tint).toBe(true);
    expect(planMarkers([p("a", 10, 10)], MARKER_LIMITS, 12).tint).toBe(false);
    expect(planMarkers([p("a", 10, 10)]).tint).toBe(true);
  });
});

describe("planMarkers", () => {
  it("one finding: one marker, tint on", () => {
    const plan = planMarkers([p("a", 10, 10)]);
    expect(plan.markers).toHaveLength(1);
    expect(plan.markers[0]!.ids).toEqual(["a"]);
    expect(plan.hidden).toBe(0);
    expect(plan.tint).toBe(true);
  });

  it("merges markers closer than 24px and keeps the worse severity", () => {
    const plan = planMarkers([p("w", 100, 100, "warning"), p("e", 110, 105, "error"), p("far", 300, 300)]);
    expect(plan.markers).toHaveLength(2);
    const merged = plan.markers.find((m) => m.ids.length === 2)!;
    expect(merged.severity).toBe("error");
    expect(merged.ids.sort()).toEqual(["e", "w"]);
  });

  it("tint only for 10 findings or fewer", () => {
    const few = Array.from({ length: 10 }, (_, i) => p(`f${i}`, i * 100, 0));
    const many = Array.from({ length: 11 }, (_, i) => p(`g${i}`, i * 100, 0));
    expect(planMarkers(few).tint).toBe(true);
    expect(planMarkers(many).tint).toBe(false);
  });

  it("never draws more than 12 markers; the rest count as hidden, errors first", () => {
    const pts = [
      ...Array.from({ length: 10 }, (_, i) => p(`w${i}`, i * 60, 0, "warning")),
      ...Array.from({ length: 10 }, (_, i) => p(`e${i}`, i * 60, 200, "error")),
    ];
    const plan = planMarkers(pts);
    expect(plan.markers).toHaveLength(MARKER_LIMITS.max);
    expect(plan.markers.filter((m) => m.severity === "error")).toHaveLength(10);
    expect(plan.hidden).toBe(8);
  });

  it("above 50 findings it merges on a 96px grid", () => {
    const pts = Array.from({ length: 60 }, (_, i) => p(`n${i}`, (i % 10) * 30, Math.floor(i / 10) * 30));
    const plan = planMarkers(pts);
    expect(plan.markers.length).toBeLessThanOrEqual(MARKER_LIMITS.max);
    expect(plan.markers.reduce((n, m) => n + m.ids.length, 0) + plan.hidden).toBe(60);
    expect(plan.tint).toBe(false);
  });

  it("is stable: the same points in a different order give the same markers", () => {
    const a = [p("a", 10, 10), p("b", 200, 50, "warning"), p("c", 400, 300)];
    const b = [a[2]!, a[0]!, a[1]!];
    expect(planMarkers(a).markers.map((m) => m.ids[0])).toEqual(planMarkers(b).markers.map((m) => m.ids[0]));
  });

  it("empty input", () => {
    expect(planMarkers([])).toEqual({ markers: [], hidden: 0, tint: true });
  });
});

describe("rect helpers", () => {
  it("intersects", () => {
    expect(intersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(intersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });
  it("inViewport", () => {
    expect(inViewport({ x: 10, y: 10, w: 5, h: 5 }, 100, 100)).toBe(true);
    expect(inViewport({ x: -20, y: 0, w: 10, h: 10 }, 100, 100)).toBe(false);
    expect(inViewport({ x: 0, y: 120, w: 10, h: 10 }, 100, 100)).toBe(false);
  });
});

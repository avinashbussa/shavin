// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock GSAP so the scrub/pin backend can be exercised without the real library / scrolling.
const gsapTo = vi.fn();
const gsapFromTo = vi.fn();
const registerPlugin = vi.fn();
const tlFromTo = vi.fn();
const gsapTimeline = vi.fn(() => ({ fromTo: tlFromTo }));
vi.mock("gsap", () => ({ gsap: { to: gsapTo, fromTo: gsapFromTo, timeline: gsapTimeline, set: vi.fn(), registerPlugin } }));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: {} }));
vi.mock("gsap/SplitText", () => ({ SplitText: class MockSplitText { words = []; chars = []; lines = []; } }));

/**
 * The IntersectionObserver reveal fallback (browsers without animation-timeline). We stub
 * CSS.supports -> false and a minimal IntersectionObserver, then drive initMotionRuntime().
 */

// Flush all pending microtasks (the chained dynamic-import awaits in loadGsap()).
const flush = async () => { for (let i = 0; i < 15; i++) await new Promise((r) => setTimeout(r, 0)); };

type IOCb = (entries: { isIntersecting: boolean; target: Element }[]) => void;
const observed: Element[] = [];
let ioCb: IOCb | null = null;

class MockIO {
  constructor(cb: IOCb) { ioCb = cb; }
  observe(el: Element) { observed.push(el); }
  unobserve(el: Element) { const i = observed.indexOf(el); if (i >= 0) observed.splice(i, 1); }
  disconnect() {}
}

// No-op MutationObserver: the fallback path installs one per module instance and never disconnects it.
// resetModules leaves those leaked observers attached to document, so a later DOM append would re-fire
// a prior instance's scan (with its own motionConfig) and corrupt assertions. Tests drive scans via
// explicit initMotionRuntime() calls, so a no-op MO is correct here.
class NoopMO { observe() {} disconnect() {} takeRecords() { return []; } }

async function load() {
  vi.stubGlobal("CSS", { supports: () => false }); // force the JS fallback path
  vi.stubGlobal("MutationObserver", NoopMO as unknown as typeof MutationObserver);
  vi.stubGlobal("IntersectionObserver", MockIO as unknown as typeof IntersectionObserver);
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
  return await import("../../packages/ui/src/lib/motion-runtime");
}

describe("motion runtime — IO reveal fallback", () => {
  beforeEach(() => { observed.length = 0; ioCb = null; document.body.innerHTML = ""; vi.resetModules(); });

  it("arms + observes a [data-motion-entry] element and reveals on intersection", async () => {
    const { initMotionRuntime } = await load();
    const el = document.createElement("div");
    el.setAttribute("data-motion-entry", "fade-up");
    document.body.appendChild(el);

    initMotionRuntime();
    expect(el.hasAttribute("data-motion-armed")).toBe(true);
    expect(observed).toContain(el);

    ioCb?.([{ isIntersecting: true, target: el }]);
    expect(el.hasAttribute("data-motion-in")).toBe(true);
    expect(observed).not.toContain(el); // unobserved after a once reveal
  });

  it("applies entry delay as --motion-delay", async () => {
    const { initMotionRuntime } = await load();
    const el = document.createElement("div");
    el.setAttribute("data-motion-entry", "fade");
    el.setAttribute("data-motion-entry-delay", "120");
    document.body.appendChild(el);
    initMotionRuntime();
    expect(el.style.getPropertyValue("--motion-delay")).toBe("120ms");
  });

  it("skips elements inside [data-motion-paused]", async () => {
    const { initMotionRuntime } = await load();
    const scope = document.createElement("div");
    scope.setAttribute("data-motion-paused", "");
    const el = document.createElement("div");
    el.setAttribute("data-motion-entry", "fade");
    scope.appendChild(el);
    document.body.appendChild(scope);
    initMotionRuntime();
    expect(el.hasAttribute("data-motion-armed")).toBe(false);
    expect(observed).not.toContain(el);
  });

  it("keeps observing when once is disabled", async () => {
    const { initMotionRuntime } = await load();
    const el = document.createElement("div");
    el.setAttribute("data-motion-entry", "fade");
    el.setAttribute("data-motion-entry-once", "0");
    document.body.appendChild(el);
    initMotionRuntime();
    ioCb?.([{ isIntersecting: true, target: el }]);
    expect(el.hasAttribute("data-motion-in")).toBe(true);
    expect(observed).toContain(el); // still observed (can re-trigger)
  });
});

describe("motion runtime — GSAP scrub/pin backend", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    gsapTo.mockClear(); gsapFromTo.mockClear(); registerPlugin.mockClear();
    vi.resetModules();
  });

  it("lazy-loads gsap and wires a scrub scene", async () => {
    const { initMotionRuntime } = await load();
    const el = document.createElement("div");
    el.setAttribute("data-motion-scroll", "scrub");
    document.body.appendChild(el);

    initMotionRuntime();
    await vi.waitFor(() => expect(gsapFromTo).toHaveBeenCalledTimes(1), { timeout: 4000 });

    expect(registerPlugin).toHaveBeenCalled();
    expect(el.hasAttribute("data-motion-wired")).toBe(true);
  });

  it("uses a consumer-supplied motionConfig.loadGsap instead of importing gsap", async () => {
    const { initMotionRuntime, motionConfig } = await load();
    const customTo = vi.fn();
    const customFromTo = vi.fn();
    const customRegister = vi.fn();
    const loader = vi.fn(async () => ({
      gsap: { to: customTo, fromTo: customFromTo, timeline: vi.fn(), set: vi.fn(), registerPlugin: customRegister } as never,
      ScrollTrigger: {},
    }));
    motionConfig.loadGsap = loader;
    const el = document.createElement("div");
    el.setAttribute("data-motion-scroll", "scrub");
    document.body.appendChild(el);

    initMotionRuntime();
    await vi.waitFor(() => expect(customFromTo).toHaveBeenCalledTimes(1), { timeout: 4000 });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(customRegister).toHaveBeenCalled();
    expect(gsapFromTo).not.toHaveBeenCalled(); // the mocked "gsap" package was never used
    motionConfig.loadGsap = undefined;
  });

  it("wires a pin scene with gsap.to + a pin ScrollTrigger", async () => {
    const { initMotionRuntime } = await load();
    const el = document.createElement("div");
    el.setAttribute("data-motion-scroll", "pin");
    document.body.appendChild(el);

    initMotionRuntime();
    await flush();

    expect(gsapTo).toHaveBeenCalledTimes(1);
    const cfg = gsapTo.mock.calls[0][1] as { scrollTrigger: { pin: boolean } };
    expect(cfg.scrollTrigger.pin).toBe(true);
    expect(el.hasAttribute("data-motion-wired")).toBe(true);
  });

  it("does not wire scrub/pin inside [data-motion-paused] (Studio canvas)", async () => {
    const { initMotionRuntime } = await load();
    const scope = document.createElement("div");
    scope.setAttribute("data-motion-paused", "");
    const el = document.createElement("div");
    el.setAttribute("data-motion-scroll", "scrub");
    scope.appendChild(el);
    document.body.appendChild(scope);

    initMotionRuntime();
    await flush();

    expect(gsapFromTo).not.toHaveBeenCalled();
    expect(el.hasAttribute("data-motion-wired")).toBe(false);
  });

  it("stays inert when motionConfig.gsap is false (kill switch)", async () => {
    const mod = await load();
    mod.motionConfig.gsap = false;
    const el = document.createElement("div");
    el.setAttribute("data-motion-scroll", "scrub");
    document.body.appendChild(el);

    mod.initMotionRuntime();
    await flush();

    expect(gsapFromTo).not.toHaveBeenCalled();
    expect(el.hasAttribute("data-motion-wired")).toBe(false);
    mod.motionConfig.gsap = true; // restore
  });
});

describe("motion runtime — GSAP timelines (Tier 3)", () => {
  // Build a [data-motion-tl] root containing `n` member children.
  function timelineRoot(trigger: string, extra: Record<string, string>, members: Record<string, string>[]) {
    const root = document.createElement("div");
    root.setAttribute("data-motion-tl", "t1");
    root.setAttribute("data-motion-tl-trigger", trigger);
    for (const [k, v] of Object.entries(extra)) root.setAttribute(k, v);
    for (const m of members) {
      const el = document.createElement("div");
      el.setAttribute("data-motion-tl-member", "t1");
      for (const [k, v] of Object.entries(m)) el.setAttribute(k, v);
      root.appendChild(el);
    }
    return root;
  }

  beforeEach(() => {
    document.body.innerHTML = "";
    gsapTimeline.mockClear(); tlFromTo.mockClear(); gsapFromTo.mockClear();
    vi.resetModules();
  });

  it("builds a load timeline and adds a tween per member", async () => {
    const { initMotionRuntime } = await load();
    const root = timelineRoot("load", {}, [
      { "data-motion-tl-at": "0", "data-motion-tl-effect": "fade-up" },
      { "data-motion-tl-at": "120", "data-motion-tl-effect": "scale-in" },
    ]);
    document.body.appendChild(root);

    initMotionRuntime();
    await flush();

    expect(gsapTimeline).toHaveBeenCalledTimes(1);
    expect(gsapTimeline.mock.calls[0][0]).toEqual({}); // load → no scrollTrigger
    expect(tlFromTo).toHaveBeenCalledTimes(2);
    expect(root.hasAttribute("data-motion-tl-wired")).toBe(true);
  });

  it("attaches a scrub ScrollTrigger (with pin) for a scroll+scrub timeline", async () => {
    const { initMotionRuntime } = await load();
    const root = timelineRoot("scroll",
      { "data-motion-tl-mode": "scrub", "data-motion-tl-pin": "1", "data-motion-tl-start": "top top", "data-motion-tl-end": "+=150%" },
      [{ "data-motion-tl-at": "0", "data-motion-tl-effect": "fade-up" }, { "data-motion-tl-at": "100", "data-motion-tl-effect": "mask-up" }]);
    document.body.appendChild(root);

    initMotionRuntime();
    await flush();

    const vars = gsapTimeline.mock.calls[0][0] as { scrollTrigger: { scrub: boolean; pin: boolean; end: string } };
    expect(vars.scrollTrigger.scrub).toBe(true);
    expect(vars.scrollTrigger.pin).toBe(true);
    expect(vars.scrollTrigger.end).toBe("+=150%");
    expect(tlFromTo).toHaveBeenCalledTimes(2);
  });

  it("opts a timeline member out of standalone entry", async () => {
    const { initMotionRuntime } = await load();
    const root = timelineRoot("load", {}, []);
    const member = document.createElement("div");
    member.setAttribute("data-motion-tl-member", "t1");
    member.setAttribute("data-motion-entry", "fade"); // would normally arm
    root.appendChild(member);
    document.body.appendChild(root);

    initMotionRuntime();
    await flush();

    expect(member.hasAttribute("data-motion-armed")).toBe(false); // entry suppressed — timeline owns it
  });

  it("reduced-motion reveals members without building a timeline", async () => {
    const { initMotionRuntime } = await load();
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }));
    const root = timelineRoot("load", {}, [{ "data-motion-tl-at": "0", "data-motion-tl-effect": "fade" }]);
    document.body.appendChild(root);

    initMotionRuntime();
    await flush();

    expect(gsapTimeline).not.toHaveBeenCalled();
    expect((root.firstElementChild as HTMLElement).style.opacity).toBe("1");
    expect(root.hasAttribute("data-motion-tl-wired")).toBe(true);
  });

  it("does not build a timeline inside [data-motion-paused]", async () => {
    const { initMotionRuntime } = await load();
    const scope = document.createElement("div");
    scope.setAttribute("data-motion-paused", "");
    scope.appendChild(timelineRoot("load", {}, [{ "data-motion-tl-at": "0", "data-motion-tl-effect": "fade" }]));
    document.body.appendChild(scope);

    initMotionRuntime();
    await flush();

    expect(gsapTimeline).not.toHaveBeenCalled();
    expect(scope.querySelector("[data-motion-tl]")!.hasAttribute("data-motion-tl-wired")).toBe(false);
  });

  it("stays inert when motionConfig.gsap is false (kill switch)", async () => {
    const mod = await load();
    mod.motionConfig.gsap = false;
    const root = timelineRoot("load", {}, [{ "data-motion-tl-at": "0", "data-motion-tl-effect": "fade" }]);
    document.body.appendChild(root);

    mod.initMotionRuntime();
    await flush();

    expect(gsapTimeline).not.toHaveBeenCalled();
    expect(root.hasAttribute("data-motion-tl-wired")).toBe(false);
    mod.motionConfig.gsap = true; // restore
  });
});

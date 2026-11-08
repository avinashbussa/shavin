"use client";
/**
 * Self-initializing motion runtime (see docs/architecture/motion-tab-spec.md, §5).
 *
 * Zero-setup: imported for its side effect by the @shavin/ui barrel — there is NO component to mount.
 * It only does the parts CSS can't:
 *   - an IntersectionObserver reveal FALLBACK for browsers without `animation-timeline: view()`
 *     (modern browsers use the pure-CSS scroll-driven path and this stays idle),
 *   - entry `delay` / `stagger` (time-based; scroll-driven ignores delay),
 *   - a lazy GSAP seam for scroll `scrub`/`pin` (gsap is an optional peer, imported on demand).
 *
 * Respects `[data-motion-paused]` (Studio's editing canvas) and `prefers-reduced-motion`; idempotent;
 * guarded so it is inert during SSR.
 */

let booted = false;

/**
 * Capability flags for the motion engine backends. `gsap` is the power backend for scroll scrub/pin
 * (and later timelines). Set `motionConfig.gsap = false` to disable it — the one-flag kill switch:
 * scrub/pin become no-ops and GSAP is never loaded. GSAP is an OPTIONAL peer dependency; if it is not
 * installed the loader fails gracefully and scrub/pin simply don't run.
 */
export const motionConfig = { gsap: true };

type SplitTextCtor = new (target: Element, vars: { type: string }) => { words: Element[]; chars: Element[]; lines: Element[] };
let gsapLoader: Promise<{ gsap: typeof import("gsap").gsap; SplitText: SplitTextCtor | null } | null> | null = null;
function loadGsap() {
  if (gsapLoader) return gsapLoader;
  gsapLoader = (async () => {
    try {
      const gsapMod = await import("gsap");
      const gsap = gsapMod.gsap ?? (gsapMod as unknown as { default: typeof gsapMod.gsap }).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      // SplitText (free since gsap 3.13) powers split-text timeline lanes; optional — skip if absent.
      let SplitText: SplitTextCtor | null = null;
      try { const m = await import("gsap/SplitText"); SplitText = (m as unknown as { SplitText: SplitTextCtor }).SplitText; if (SplitText) gsap.registerPlugin(SplitText as unknown as object); } catch { SplitText = null; }
      return { gsap, SplitText };
    } catch {
      return null; // gsap not installed / not enabled → graceful no-op
    }
  })();
  return gsapLoader;
}

const hasDom = (): boolean => typeof window !== "undefined" && typeof document !== "undefined";
const supportsViewTimeline = (): boolean => {
  try { return typeof CSS !== "undefined" && CSS.supports("animation-timeline", "view()"); } catch { return false; }
};
const prefersReduced = (): boolean => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
};
const isPaused = (el: Element): boolean => !!el.closest("[data-motion-paused]");
const cssEscape = (s: string): string => {
  try { return (typeof CSS !== "undefined" && CSS.escape) ? CSS.escape(s) : s; } catch { return s; }
};

// --- Shared effect vocabulary (one source of truth for scrub + timelines) ---
// Token → concrete value (matches @shavin/ui global.css; reduced-motion is handled by GATING, not here).
const DIST_PX: Record<string, number> = { xs: 4, sm: 8, md: 16, lg: 24 };
const DUR_MS: Record<string, number> = { instant: 100, fast: 160, base: 240, slow: 400, enter: 560 };
const GSAP_EASE: Record<string, string> = { standard: "power2.inOut", out: "power3.out", in: "power2.in", overshoot: "back.out(1.6)" };
const distPx = (t: string): number => DIST_PX[t] ?? 16;
const durSec = (t: string): number => (DUR_MS[t] ?? 560) / 1000;
const easeOf = (t: string): string => GSAP_EASE[t] ?? "power3.out";

type GVars = Record<string, unknown>;
/** The hidden start state for an entry preset (shared by scrub reveal + timeline tracks). */
function effectFrom(effect: string, dist: number): GVars {
  switch (effect) {
    case "fade": return { autoAlpha: 0 };
    case "fade-down": return { autoAlpha: 0, y: -dist };
    case "scale-in": return { autoAlpha: 0, scale: 0.94 };
    case "blur-in": return { autoAlpha: 0, filter: "blur(8px)" };
    case "mask-up": return { autoAlpha: 0, yPercent: 30 };
    case "fade-up": default: return { autoAlpha: 0, y: dist };
  }
}
/** The revealed end state for an entry preset. */
function effectTo(effect: string): GVars {
  switch (effect) {
    case "scale-in": return { autoAlpha: 1, scale: 1 };
    case "blur-in": return { autoAlpha: 1, filter: "blur(0px)" };
    case "mask-up": return { autoAlpha: 1, yPercent: 0 };
    case "fade-up": case "fade-down": return { autoAlpha: 1, y: 0 };
    case "fade": default: return { autoAlpha: 1 };
  }
}

// --- IntersectionObserver reveal fallback (only when scroll-driven timelines are unsupported) ---
let revealObserver: IntersectionObserver | null = null;
function ensureObserver(): IntersectionObserver {
  if (revealObserver) return revealObserver;
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.setAttribute("data-motion-in", "");
        if (el.getAttribute("data-motion-entry-once") !== "0") revealObserver!.unobserve(el);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
  );
  return revealObserver;
}

function armEntry(el: HTMLElement): void {
  if (el.hasAttribute("data-motion-armed") || el.hasAttribute("data-motion-in")) return;
  if (el.hasAttribute("data-motion-tl-member")) return; // a timeline drives this element, not standalone entry
  if (isPaused(el)) return;
  // Explicit delay (ms) and parent-driven stagger (index * --stagger) feed the CSS transition-delay.
  const delayAttr = el.getAttribute("data-motion-entry-delay");
  let delayMs = delayAttr ? parseInt(delayAttr, 10) || 0 : 0;
  const staggerParent = el.closest<HTMLElement>("[data-motion-entry-stagger='1']");
  if (staggerParent && staggerParent !== el) {
    const sibs = Array.from(staggerParent.querySelectorAll<HTMLElement>("[data-motion-entry]"));
    const idx = sibs.indexOf(el);
    if (idx > 0) delayMs += idx * 60; // --stagger default (60ms); reduced-motion zeroes travel anyway
  }
  if (delayMs) el.style.setProperty("--motion-delay", `${delayMs}ms`);
  el.setAttribute("data-motion-armed", "");
  ensureObserver().observe(el);
}

// --- GSAP seam for scrub / pin (Phase 3). gsap is an optional peer, loaded on demand. ---
function initScrollScenes(root: ParentNode): void {
  if (!motionConfig.gsap || prefersReduced()) return;
  const scenes = [...(root.querySelectorAll?.("[data-motion-scroll='scrub'],[data-motion-scroll='pin']") ?? [])]
    .filter((el) => !el.hasAttribute("data-motion-wired") && !el.hasAttribute("data-motion-tl-member") && !isPaused(el)) as HTMLElement[];
  if (!scenes.length) return;
  void loadGsap().then((lib) => {
    if (!lib) return; // gsap unavailable — parallax/sticky still work via CSS; scrub/pin stay inert
    const { gsap } = lib;
    type TV = Parameters<typeof gsap.set>[1]; // TweenVars (single signature — no overload ambiguity)
    for (const el of scenes) {
      if (el.hasAttribute("data-motion-wired")) continue;
      el.setAttribute("data-motion-wired", "");
      const effect = el.getAttribute("data-motion-scroll");
      const start = el.getAttribute("data-motion-scroll-start") || undefined;
      const end = el.getAttribute("data-motion-scroll-end") || undefined;
      if (effect === "pin") {
        gsap.to(el, { scrollTrigger: { trigger: el, start: start || "top top", end: end || "+=100%", pin: true, pinSpacing: true } });
      } else if (effect === "scrub") {
        gsap.fromTo(
          el,
          effectFrom("fade-up", distPx("lg")) as TV,
          { ...effectTo("fade-up"), ease: "none", scrollTrigger: { trigger: el, start: start || "top bottom", end: end || "top center", scrub: true } } as TV,
        );
      }
    }
  });
}

// --- Tier 3: document-level Timelines (GSAP), see docs/architecture/motion-timelines-spec.md ---
// A timeline member is hidden up front by CSS (`.shavin-motion-js [data-motion-tl-member]`) so there is
// no flash before the clock reveals it. If GSAP is unavailable (or reduced-motion), reveal them instead.
function revealMembers(rootEl: HTMLElement): void {
  rootEl.querySelectorAll<HTMLElement>("[data-motion-tl-member]").forEach((el) => { el.style.opacity = "1"; });
}

function initTimelines(root: ParentNode): void {
  if (!motionConfig.gsap) return;
  const roots = [...(root.querySelectorAll?.("[data-motion-tl]") ?? [])]
    .filter((el) => !el.hasAttribute("data-motion-tl-wired") && !isPaused(el)) as HTMLElement[];
  if (!roots.length) return;
  // Reduced motion: never animate — reveal members at their final state and mark done.
  if (prefersReduced()) {
    for (const r of roots) { revealMembers(r); r.setAttribute("data-motion-tl-wired", ""); }
    return;
  }
  void loadGsap().then((lib) => {
    if (!lib) { for (const r of roots) { revealMembers(r); r.setAttribute("data-motion-tl-wired", ""); } return; }
    const { gsap } = lib;
    type TV = Parameters<typeof gsap.set>[1]; // TweenVars (single signature — no overload ambiguity)
    for (const rootEl of roots) {
      if (rootEl.hasAttribute("data-motion-tl-wired")) continue;
      rootEl.setAttribute("data-motion-tl-wired", "");
      const id = rootEl.getAttribute("data-motion-tl");
      if (!id) continue;
      const members = [...rootEl.querySelectorAll(`[data-motion-tl-member="${cssEscape(id)}"]`)] as HTMLElement[];
      if (!members.length) continue;

      const trigger = rootEl.getAttribute("data-motion-tl-trigger") || "load";
      const mode = rootEl.getAttribute("data-motion-tl-mode") || "reveal";
      const start = rootEl.getAttribute("data-motion-tl-start") || undefined;
      const end = rootEl.getAttribute("data-motion-tl-end") || undefined;
      const pin = rootEl.getAttribute("data-motion-tl-pin") === "1";
      const isScrub = trigger === "scroll" && mode === "scrub";

      // load auto-plays; scroll attaches a ScrollTrigger to the timeline; click stays paused until fired.
      const vars: GVars = {};
      if (trigger === "scroll") {
        vars.scrollTrigger = isScrub
          ? { trigger: rootEl, start: start || "top top", end: end || "+=100%", scrub: true, pin }
          : { trigger: rootEl, start: start || "top 80%", toggleActions: "play none none none", once: true };
      }
      if (trigger === "click") vars.paused = true;
      const tl = gsap.timeline(vars as Parameters<typeof gsap.timeline>[0]);

      for (const m of members) {
        const at = parseFloat(m.getAttribute("data-motion-tl-at") || "0") || 0;
        const effect = m.getAttribute("data-motion-tl-effect") || "fade";
        const from = effectFrom(effect, distPx(m.getAttribute("data-motion-tl-dist") || "md"));
        const to: GVars = { ...effectTo(effect) };
        if (isScrub) { to.ease = "none"; to.duration = 0.5; }       // positions are 0–100 (%) of the scrubbed range
        else { to.ease = easeOf(m.getAttribute("data-motion-tl-ease") || "out"); to.duration = durSec(m.getAttribute("data-motion-tl-dur") || "enter"); }
        const pos = isScrub ? at / 100 : at / 1000;                 // scrub → unit fraction; time → seconds
        const staggerMs = parseFloat(m.getAttribute("data-motion-tl-stagger") || "0") || 0;
        const split = m.getAttribute("data-motion-tl-split");
        if (split && lib.SplitText) {
          // Split-text lane: break the node into words/chars/lines and stagger the pieces.
          m.style.opacity = "1";
          const st = new lib.SplitText(m, { type: split });
          const pieces = (split === "words" ? st.words : split === "chars" ? st.chars : st.lines) as unknown as HTMLElement[];
          const list = m.getAttribute("data-motion-tl-stagger-order") === "reverse" ? [...pieces].reverse() : pieces;
          const step = isScrub ? staggerMs / 100 : staggerMs / 1000;
          list.forEach((u, i) => tl.fromTo(u, from as TV, to as TV, pos + i * step));
        } else if (staggerMs > 0 && m.children.length > 1) {
          // Container lane: stagger the item children instead of animating the container as one.
          m.style.opacity = "1"; // the container is a member (CSS-hidden); reveal it, animate its items
          const order = m.getAttribute("data-motion-tl-stagger-order") || "forward";
          let items = Array.from(m.children) as HTMLElement[];
          if (order === "reverse") items.reverse();
          else if (order === "cols") items = colMajorOrder(m, items);
          const step = isScrub ? staggerMs / 100 : staggerMs / 1000;
          items.forEach((it, i) => tl.fromTo(it, from as TV, to as TV, pos + i * step));
        } else {
          tl.fromTo(m, from as TV, to as TV, pos);
        }
      }

      // Click trigger: restart the (paused) timeline when the designated control — a [data-motion-tl-play]
      // descendant, else the root — is clicked or activated by keyboard.
      if (trigger === "click") {
        const btn = (rootEl.querySelector("[data-motion-tl-play]") as HTMLElement) || rootEl;
        const play = () => tl.restart();
        btn.addEventListener("click", play);
        btn.addEventListener("keydown", (e) => {
          const k = (e as KeyboardEvent).key;
          if (k === "Enter" || k === " ") { e.preventDefault(); play(); }
        });
      }
    }
  });
}

/** Reorder row-major items into column-major, using the grid's computed column count (1 col → unchanged). */
function colMajorOrder(parent: HTMLElement, items: HTMLElement[]): HTMLElement[] {
  let cols = 1;
  try { cols = (getComputedStyle(parent).gridTemplateColumns || "").split(/\s+/).filter(Boolean).length || 1; } catch { cols = 1; }
  if (cols <= 1) return items;
  const rows = Math.ceil(items.length / cols);
  const out: HTMLElement[] = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) { const i = r * cols + c; if (i < items.length) out.push(items[i]); }
  return out;
}

function scan(root: ParentNode): void {
  if (!supportsViewTimeline() && !prefersReduced()) {
    const entries = root.querySelectorAll?.("[data-motion-entry]");
    entries?.forEach((el) => armEntry(el as HTMLElement));
  }
  initScrollScenes(root);
  initTimelines(root);
}

/** Idempotent boot. Safe to call repeatedly; re-scans for newly added motion elements. */
export function initMotionRuntime(): void {
  if (!hasDom()) return;
  const run = () => scan(document);
  if (!booted) {
    booted = true;
    // Mark the document so CSS can hide timeline members before the clock reveals them. Skipped under
    // reduced-motion (members then stay visible — the correct final state, no JS reveal needed).
    if (!prefersReduced()) { try { document.documentElement.classList.add("shavin-motion-js"); } catch {} }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
    else run();
    // Pick up dynamically inserted elements (e.g. Studio canvas) — only matters for the IO fallback.
    if (!supportsViewTimeline()) {
      const mo = new MutationObserver(() => { if (hasDom()) scan(document); });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    }
  } else {
    run();
  }
}

// Self-init on import (guarded). This is the "zero-setup" entry point.
if (hasDom()) initMotionRuntime();

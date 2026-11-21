/**
 * Default GSAP loader for the motion runtime. Kept in its own module so every `gsap` import sits
 * behind a single lazy edge (`import("./motion-gsap")`). GSAP is an optional peer: each import is
 * inside its own try block (bundlers read that as "optional" and do not fail the build when gsap is
 * not installed), and a missing gsap makes this reject so the runtime treats scrub/pin as no-ops.
 */
import type { GsapModules } from "./motion-runtime";

export async function loadDefaultGsap(): Promise<GsapModules> {
  let gsapMod: typeof import("gsap");
  let ScrollTrigger: object;
  try {
    gsapMod = await import("gsap");
  } catch {
    throw new Error("gsap is not installed");
  }
  try {
    ScrollTrigger = (await import("gsap/ScrollTrigger")).ScrollTrigger;
  } catch {
    throw new Error("gsap/ScrollTrigger is not available");
  }
  const gsap = gsapMod.gsap ?? (gsapMod as unknown as { default: typeof gsapMod.gsap }).default;
  // SplitText (free since gsap 3.13) powers split-text timeline lanes; optional, skipped if absent.
  let SplitText: object | null = null;
  try { SplitText = (await import("gsap/SplitText") as unknown as { SplitText: object }).SplitText ?? null; } catch { SplitText = null; }
  return { gsap, ScrollTrigger, SplitText };
}

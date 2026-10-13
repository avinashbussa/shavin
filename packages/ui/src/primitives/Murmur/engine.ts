/**
 * Murmur engine: a swarm of dots on a sphere, moved by a per-state function.
 * Built-in states are free and live in @shavin/ui. More states can be added with
 * `registerMurmurState` (the Pro set ships in @shavin/fx).
 */
export interface MurmurFrame {
  /** Milliseconds since the component mounted. */
  t: number;
  /** Live input level 0-1 (listening). */
  level: number;
  /** Speed multiplier. */
  speed: number;
}

/** A dot's fixed identity: a point on the unit sphere plus a random phase. */
export interface MurmurDot {
  x: number;
  y: number;
  z: number;
  /** 0-2π, random but stable per dot. */
  phase: number;
  /** 0-1 position index along the swarm, for sweeps and waves. */
  index: number;
}

/** What a state function writes for each dot, each frame. Unit space, z toward the viewer. */
export interface MurmurOut {
  x: number;
  y: number;
  z: number;
  /** Dot size multiplier, 1 = default. */
  size: number;
  /** 0-1. */
  alpha: number;
}

export type MurmurStateFn = (dot: MurmurDot, frame: MurmurFrame, out: MurmurOut) => void;

export function rotateY(o: MurmurOut, a: number) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const x = o.x * c + o.z * s;
  o.z = -o.x * s + o.z * c;
  o.x = x;
}

export function rotateX(o: MurmurOut, a: number) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const y = o.y * c - o.z * s;
  o.z = o.y * s + o.z * c;
  o.y = y;
}

export function place(dot: MurmurDot, o: MurmurOut, radius = 1) {
  o.x = dot.x * radius;
  o.y = dot.y * radius;
  o.z = dot.z * radius;
  o.size = 1;
  o.alpha = 1;
}

/** Fibonacci sphere with seeded phases, so the same count always gives the same swarm. */
export function makeDots(count: number): MurmurDot[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = golden * i;
    return { x: Math.cos(a) * r, y, z: Math.sin(a) * r, phase: rand() * Math.PI * 2, index: i / Math.max(1, count - 1) };
  });
}

const twinkle = (d: MurmurDot, t: number, rate: number) => 0.5 + 0.5 * Math.sin(t * rate + d.phase);

const BUILT_IN: Record<string, MurmurStateFn> = {
  /** Resting: slow turn, dim. */
  idle(d, f, o) {
    place(d, o);
    rotateY(o, f.t * 0.0002 * f.speed);
    o.size = 0.95;
    o.alpha = 0.6;
  },
  /** The model is reasoning: a slow turn, a gentle breath and dots that twinkle. */
  thinking(d, f, o) {
    place(d, o, 1 + 0.05 * Math.sin(f.t * 0.0015 + d.phase * 0.5));
    rotateY(o, f.t * 0.0006 * f.speed);
    const k = twinkle(d, f.t, 0.003 * f.speed);
    o.size = 0.85 + 0.6 * k;
    o.alpha = 0.6 + 0.4 * k;
  },
  /** A tool is running: faster, twisted by latitude and tumbling. */
  working(d, f, o) {
    place(d, o, 1 + 0.12 * Math.sin(f.t * 0.004 * f.speed + d.phase));
    rotateY(o, f.t * 0.0016 * f.speed + d.y * 1.8);
    rotateX(o, Math.sin(f.t * 0.0008 * f.speed) * 0.5);
    o.size = 1;
    o.alpha = 0.9;
  },
  /** Voice input: rings travel up the sphere and swell with the live level. */
  listening(d, f, o) {
    place(d, o, 1 + (0.08 + 0.4 * f.level) * Math.sin(d.y * 5 - f.t * 0.008 * f.speed));
    rotateY(o, f.t * 0.0004 * f.speed);
    o.size = 0.9 + f.level * 0.8;
    o.alpha = 0.7 + 0.3 * Math.min(1, f.level * 1.5 + 0.2);
  },
};

const registry = new Map<string, MurmurStateFn>(Object.entries(BUILT_IN));

/** Adds or replaces a state. @shavin/fx uses this to install its Pro states. */
export function registerMurmurState(name: string, fn: MurmurStateFn) {
  registry.set(name, fn);
}

export function getMurmurState(name: string): MurmurStateFn {
  return registry.get(name) ?? BUILT_IN.thinking;
}

export const MURMUR_FREE_STATES = Object.keys(BUILT_IN);

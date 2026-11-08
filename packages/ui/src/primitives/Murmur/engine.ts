/**
 * Murmur engine: a swarm of dots on a sphere, moved by a per-state function.
 * Every state is built in and free: idle, thinking, working, listening, searching, composing,
 * weaving, connecting, and the loaders orbiting and looping. Add your own with
 * `registerMurmurState`.
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


/** Rotate (x, z) about the y axis. */
const spin = (x: number, z: number, a: number): [number, number] => {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c + z * s, -x * s + z * c];
};

/** searching: a bright band sweeps the sphere while dots drift outward like a scan. */
const searching: MurmurStateFn = (d, f, o) => {
  const t = (f.t / 1000) * f.speed;
  const [x, z] = spin(d.x, d.z, t * 0.6);
  const sweep = (Math.sin(t * 2.2 - d.y * 3) + 1) / 2;
  const r = 1 + 0.12 * sweep;
  o.x = x * r; o.y = d.y * r; o.z = z * r;
  o.size = 0.8 + sweep * 0.9;
  o.alpha = 0.3 + sweep * 0.7;
};

/** composing: dots rise and settle in rows, like a line of text being written. */
const composing: MurmurStateFn = (d, f, o) => {
  const t = (f.t / 1000) * f.speed;
  const [x, z] = spin(d.x, d.z, t * 0.25);
  const bob = Math.sin(t * 3 + d.index * 18) * 0.08;
  o.x = x; o.y = d.y + bob; o.z = z;
  const lead = (Math.sin(t * 2 - d.index * 6) + 1) / 2;
  o.size = 0.7 + lead * 0.8;
  o.alpha = 0.35 + lead * 0.65;
};

/** weaving: two counter-rotating bands cross, so the swarm reads as a loom. */
const weaving: MurmurStateFn = (d, f, o) => {
  const t = (f.t / 1000) * f.speed;
  const dir = d.index < 0.5 ? 1 : -1;
  const [x, z] = spin(d.x, d.z, t * 0.9 * dir);
  const wave = Math.sin(d.y * 6 + t * 2 * dir) * 0.1;
  o.x = x * (1 + wave); o.y = d.y; o.z = z * (1 + wave);
  o.size = 0.9 + Math.abs(wave) * 5;
  o.alpha = 0.5 + 0.5 * Math.sin(t * 2 + d.phase);
};

/** connecting: the swarm pulls together and releases, a handshake pulse. */
const connecting: MurmurStateFn = (d, f, o) => {
  const t = (f.t / 1000) * f.speed;
  const pulse = (Math.sin(t * 2.4) + 1) / 2;
  const r = 0.55 + 0.5 * pulse;
  const [x, z] = spin(d.x, d.z, t * 0.4);
  o.x = x * r; o.y = d.y * r; o.z = z * r;
  o.size = 0.8 + pulse * 0.8;
  o.alpha = 0.4 + pulse * 0.6;
};

/**
 * orbiting (ref 10): the swarm lays out as a flat ring of dots with a bright pulse chasing
 * round it, a loader that reads at small sizes. Fewer dots (dots={20}) gives the beaded look.
 */
const orbiting: MurmurStateFn = (d, f, o) => {
  const t = (f.t / 1000) * f.speed;
  const ang = d.index * Math.PI * 2 - Math.PI / 2;
  const head = t * 2.4;
  const lit = Math.pow(0.5 + 0.5 * Math.cos(ang - head), 6);
  const r = 0.92 + 0.04 * Math.sin(t * 1.6);
  o.x = Math.cos(ang) * r;
  o.y = Math.sin(ang) * r;
  o.z = 0;
  o.size = 0.55 + lit * 0.9;
  o.alpha = 0.25 + lit * 0.75;
};

/** looping (ref 8): the dots trace an infinity sign with a comet running along it. */
const looping: MurmurStateFn = (d, f, o) => {
  const t = (f.t / 1000) * f.speed;
  const s = d.index * Math.PI * 2;
  const den = 1 + Math.sin(s) * Math.sin(s);
  // Distance behind the comet's head along the loop, 0..1.
  const behind = (((t * 0.32 - d.index) % 1) + 1) % 1;
  const lit = Math.pow(1 - behind, 3);
  o.x = Math.cos(s) / den;
  o.y = (Math.sin(s) * Math.cos(s)) / den;
  o.z = 0;
  o.size = 0.45 + lit * 0.9;
  o.alpha = 0.18 + lit * 0.82;
};

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
  searching,
  composing,
  weaving,
  connecting,
  orbiting,
  looping,
};

const registry = new Map<string, MurmurStateFn>(Object.entries(BUILT_IN));

/** Adds or replaces a state. */
export function registerMurmurState(name: string, fn: MurmurStateFn) {
  registry.set(name, fn);
}

export function getMurmurState(name: string): MurmurStateFn {
  return registry.get(name) ?? BUILT_IN.thinking;
}

/** Every built-in state. */
export const MURMUR_STATES = Object.keys(BUILT_IN);
/** @deprecated Every state is free now; same as MURMUR_STATES. */
export const MURMUR_FREE_STATES = MURMUR_STATES;

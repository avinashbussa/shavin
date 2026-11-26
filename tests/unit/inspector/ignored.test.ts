import { describe, it, expect } from "vitest";
import { IGNORED_KEY, emptyIgnored, ignore, loadIgnored, restore, saveIgnored, undo, type StorageLike } from "../../../packages/ui/src/inspector/ignored";

const memory = (): StorageLike & { data: Record<string, string> } => {
  const data: Record<string, string> = {};
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
};

const A = "f_00000001";
const B = "f_00000002";
const C = "f_00000003";

describe("ignored findings", () => {
  it("ignore and restore are pure and idempotent", () => {
    const s0 = emptyIgnored();
    const s1 = ignore(s0, A);
    expect(s0.ids.has(A)).toBe(false);
    expect(s1.ids.has(A)).toBe(true);
    expect(ignore(s1, A)).toBe(s1);
    const s2 = restore(s1, A);
    expect(s2.ids.has(A)).toBe(false);
    expect(restore(s2, A)).toBe(s2);
  });

  it("refuses anything that is not a finding id", () => {
    const s = emptyIgnored();
    expect(ignore(s, "not-an-id")).toBe(s);
    expect(ignore(s, "../../etc")).toBe(s);
  });

  it("undo restores the most recent ignore first, then the one before", () => {
    let s = ignore(ignore(ignore(emptyIgnored(), A), B), C);
    const u1 = undo(s);
    expect(u1.restored).toBe(C);
    const u2 = undo(u1.state);
    expect(u2.restored).toBe(B);
    expect(u2.state.ids.has(A)).toBe(true);
    s = undo(undo(u2.state).state).state;
    expect(undo(s).restored).toBeNull();
  });

  it("undo skips an id that was restored by hand", () => {
    let s = ignore(ignore(emptyIgnored(), A), B);
    s = restore(s, B);
    expect(undo(s).restored).toBe(A);
  });

  it("saves and loads through storage, keeping only valid ids", () => {
    const st = memory();
    saveIgnored(new Set([A, B]), st);
    expect([...loadIgnored(st)].sort()).toEqual([A, B]);
    st.data[IGNORED_KEY] = JSON.stringify([A, "junk", 5, null, B]);
    expect([...loadIgnored(st)].sort()).toEqual([A, B]);
  });

  it("survives corrupt, missing or throwing storage", () => {
    const st = memory();
    st.data[IGNORED_KEY] = "{not json";
    expect(loadIgnored(st).size).toBe(0);
    expect(loadIgnored(null).size).toBe(0);
    const throwing: StorageLike = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); } };
    expect(loadIgnored(throwing).size).toBe(0);
    expect(() => saveIgnored(new Set([A]), throwing)).not.toThrow();
  });

  it("keeps at most 500 ids", () => {
    const st = memory();
    const ids = new Set(Array.from({ length: 700 }, (_, i) => `f_${i.toString(16).padStart(8, "0")}`));
    saveIgnored(ids, st);
    expect(loadIgnored(st).size).toBe(500);
  });
});

/**
 * Ignored findings: a set of finding ids kept in the browser's localStorage (dev only, per origin).
 * An id is a hash of detector, rule, selector and the start of the text, so an ignore follows the element across
 * reloads and pages, and stops applying when the element changes enough to get a new id.
 */
import { isFindingId } from "../lib/inspector/schema";

export const IGNORED_KEY = "shavin-inspector-ignored";
const MAX_IGNORED = 500;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadIgnored(storage: StorageLike | null = defaultStorage()): Set<string> {
  try {
    const raw = storage?.getItem(IGNORED_KEY);
    if (!raw) return new Set();
    const list: unknown = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list.filter(isFindingId).slice(-MAX_IGNORED) : []);
  } catch {
    return new Set();
  }
}

export function saveIgnored(ids: ReadonlySet<string>, storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.setItem(IGNORED_KEY, JSON.stringify([...ids].filter(isFindingId).slice(-MAX_IGNORED)));
  } catch {
    /* storage can be full or blocked: the ignore then lasts for this page view only */
  }
}

export interface IgnoredState {
  ids: ReadonlySet<string>;
  /** Most recent first, for Undo. */
  history: readonly string[];
}

export const emptyIgnored = (ids: ReadonlySet<string> = new Set()): IgnoredState => ({ ids, history: [] });

export function ignore(state: IgnoredState, id: string): IgnoredState {
  if (!isFindingId(id) || state.ids.has(id)) return state;
  return { ids: new Set([...state.ids, id]), history: [id, ...state.history].slice(0, 50) };
}

export function restore(state: IgnoredState, id: string): IgnoredState {
  if (!state.ids.has(id)) return state;
  const ids = new Set(state.ids);
  ids.delete(id);
  return { ids, history: state.history.filter((h) => h !== id) };
}

/** Restores the most recently ignored finding. */
export function undo(state: IgnoredState): { state: IgnoredState; restored: string | null } {
  const last = state.history.find((id) => state.ids.has(id)) ?? null;
  return last ? { state: restore(state, last), restored: last } : { state, restored: null };
}

export const clearIgnored = (): IgnoredState => emptyIgnored();

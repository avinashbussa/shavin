"use client";
import type { ComponentType, CSSProperties, HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

/** Static, token-driven variants. `registerBackdrop` lets an app add its own. */
export const BACKDROP_FREE_VARIANTS = ["mesh", "aurora", "grid", "dots"] as const;
export type BackdropVariant = (typeof BACKDROP_FREE_VARIANTS)[number] | (string & {});

export interface BackdropProps extends HTMLAttributes<HTMLDivElement> {
  /** Which backdrop to draw. Unknown names fall back to `mesh`. */
  variant?: BackdropVariant;
}

export type BackdropRenderer = ComponentType<{ className?: string }>;

const registry = new Map<string, BackdropRenderer>();

/** Adds or replaces a backdrop variant. @shavin/fx uses this to install its Pro variants. */
export function registerBackdrop(name: string, renderer: BackdropRenderer) {
  registry.set(name, renderer);
}

const lines = (size: string): CSSProperties => ({
  backgroundImage: `linear-gradient(to right, color-mix(in srgb, currentColor 9%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, currentColor 9%, transparent) 1px, transparent 1px)`,
  backgroundSize: `${size} ${size}`,
  maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
  WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
});

const dots = (): CSSProperties => ({
  backgroundImage: "radial-gradient(color-mix(in srgb, currentColor 22%, transparent) 1.2px, transparent 1.2px)",
  backgroundSize: "22px 22px",
  maskImage: "radial-gradient(ellipse at center, black 25%, transparent 75%)",
  WebkitMaskImage: "radial-gradient(ellipse at center, black 25%, transparent 75%)",
});

function Mesh() {
  return (
    <>
      <div className="absolute -left-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-accent opacity-25 blur-3xl" />
      <div className="absolute -bottom-1/3 -right-1/4 h-3/4 w-3/4 rounded-full bg-accent opacity-20 blur-3xl" />
      <div className="absolute left-1/3 top-1/3 h-1/2 w-1/2 rounded-full bg-fg opacity-[0.07] blur-3xl" />
    </>
  );
}

function Aurora() {
  return (
    <>
      <div className="absolute -inset-x-1/4 top-0 h-2/3 -skew-y-12 bg-gradient-to-r from-transparent via-accent to-transparent opacity-20 blur-3xl" />
      <div className="absolute -inset-x-1/4 bottom-0 h-1/2 skew-y-12 bg-gradient-to-r from-accent via-transparent to-accent opacity-15 blur-3xl" />
    </>
  );
}

/** A decorative, token-driven background that fills its positioned parent. Put content above it with `relative`. */
export function Backdrop({ variant = "mesh", className, ...props }: BackdropProps) {
  const Custom = registry.get(variant);
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden text-fg", className)} {...props}>
      {Custom ? (
        <Custom className="absolute inset-0" />
      ) : variant === "aurora" ? (
        <Aurora />
      ) : variant === "grid" ? (
        <div className="absolute inset-0" style={lines("40px")} />
      ) : variant === "dots" ? (
        <div className="absolute inset-0" style={dots()} />
      ) : (
        <Mesh />
      )}
    </div>
  );
}

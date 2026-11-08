import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-lg)] bg-fg/[0.08]", className)}
      {...props}
    />
  );
}

export interface SkeletonMimicProps {
  /** Whether loading placeholder overlay is active. Default true. */
  loading?: boolean;
  /** Actual component structure to mirror into loading pulse placeholders. */
  children: ReactNode;
  className?: string;
}

export function SkeletonMimic({
  loading = true,
  children,
  className,
}: SkeletonMimicProps) {
  if (!loading) return <>{children}</>;
  return (
    <div
      aria-hidden
      // aria-hidden alone leaves the mimicked controls tabbable.
      inert
      className={cn(
        "pointer-events-none select-none",
        "[&_*]:!animate-pulse [&_*]:!rounded-[var(--radius-lg)] [&_*]:!border-transparent [&_*]:!bg-fg/[0.08] [&_*]:!text-transparent [&_*]:!shadow-none",
        "[&_img]:!opacity-0 [&_svg]:!opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

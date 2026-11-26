"use client";
import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleCheck, FolderOpen, Inbox, SearchX } from "lucide-react";
import { cn } from "../../lib/cn";
import { announce } from "../../lib/announce";

export const emptyStateVariants = cva("flex w-full text-fg", {
  variants: {
    layout: {
      centered: "flex-col items-center text-center",
      inline: "flex-row items-center gap-4 text-left",
    },
    size: {
      sm: "",
      md: "",
      lg: "",
    },
    variant: {
      plain: "",
      // A region that must stay visible (table body, drop zone): dashed hairline panel.
      bordered: "rounded-[var(--radius-panel)] border border-dashed border-hairline-strong px-6",
    },
  },
  compoundVariants: [
    { layout: "centered", size: "sm", class: "py-6" },
    { layout: "centered", size: "md", class: "py-10" },
    { layout: "centered", size: "lg", class: "py-16" },
    { layout: "inline", class: "py-4" },
  ],
  defaultVariants: { layout: "centered", size: "md", variant: "plain" },
});

const iconTileVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-hairline bg-surface",
  {
    variants: {
      size: {
        sm: "h-8 w-8 [&_svg]:h-4 [&_svg]:w-4",
        md: "h-10 w-10 [&_svg]:h-5 [&_svg]:w-5",
        lg: "h-12 w-12 [&_svg]:h-6 [&_svg]:w-6",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const TITLE_SIZE = { sm: "text-sm", md: "text-base", lg: "text-lg" } as const;

export type EmptyStateKind = "first-time" | "empty" | "no-results" | "success";

const DEFAULT_ICON: Record<EmptyStateKind, ReactNode> = {
  "first-time": <Inbox />,
  empty: <FolderOpen />,
  "no-results": <SearchX />,
  success: <CircleCheck />,
};

export interface EmptyStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof emptyStateVariants> {
  /**
   * The situation: sets the default icon only (copy always comes from you).
   * first-time = never created one; empty = had items, none now; no-results = a filter or search
   * matched nothing; success = a flow finished (a result screen).
   */
  kind?: EmptyStateKind;
  /** Specific title: "No invoices yet", never "No data" or "Nothing here". */
  title: string;
  /** One sentence, at most 25 words: what is missing and how to add it. */
  description?: ReactNode;
  /** Icon override (use `<Icon name>`). Default per kind: inbox, folder-open, search-x, circle-check. */
  icon?: ReactNode;
  /** Monochrome illustration; replaces the icon. Rendered aria-hidden. */
  illustration?: ReactNode;
  /** The one primary action that fixes the emptiness (a Button). */
  action?: ReactNode;
  /** A second, quieter action (a ghost Button or Link). */
  secondaryAction?: ReactNode;
  /** Heading element, independent of size. Default h3. */
  titleAs?: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  /**
   * Announce the title (polite) once on mount, for an empty state that replaces content after the
   * user acts. Default true for no-results, false otherwise.
   */
  announce?: boolean;
  /** Move focus to the title on mount. Recommended for kind="success" result screens. */
  focusOnMount?: boolean;
}

/**
 * EmptyState — the one component for "nothing is shown here yet": first-time, empty, no-results
 * and success result screens. Sits on the surface it replaces (no card, AP-09); `bordered` keeps a
 * region visible.
 */
export function EmptyState({
  kind = "empty",
  title,
  description,
  icon,
  illustration,
  action,
  secondaryAction,
  titleAs: TitleTag = "h3",
  announce: shouldAnnounce,
  focusOnMount = false,
  layout,
  size,
  variant,
  className,
  ...props
}: EmptyStateProps) {
  const titleRef = useRef<HTMLElement | null>(null);
  const resolvedSize = size ?? "md";
  const inline = layout === "inline";
  const doAnnounce = shouldAnnounce ?? kind === "no-results";

  useEffect(() => {
    if (doAnnounce) announce(title, "polite");
    if (focusOnMount) titleRef.current?.focus();
    // Mount only: an empty state is announced when it appears, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visual = illustration ? (
    <div aria-hidden="true" className="text-fg-subtle">
      {illustration}
    </div>
  ) : (
    <span
      aria-hidden="true"
      className={cn(iconTileVariants({ size: resolvedSize }), kind === "success" ? "text-success" : "text-fg-subtle")}
    >
      {icon ?? DEFAULT_ICON[kind]}
    </span>
  );

  const actions =
    action || secondaryAction ? (
      <div className={cn("flex flex-wrap items-center gap-2", inline ? "shrink-0" : "justify-center")}>
        {action}
        {secondaryAction}
      </div>
    ) : null;

  return (
    <div
      data-empty-state={kind}
      className={cn(emptyStateVariants({ layout, size, variant }), className)}
      {...props}
    >
      {visual}
      <div className={cn("flex min-w-0 flex-col gap-1", inline ? "flex-1" : "mt-3 max-w-sm items-center")}>
        <TitleTag
          ref={titleRef as never}
          tabIndex={focusOnMount ? -1 : undefined}
          className={cn("font-semibold text-fg", TITLE_SIZE[resolvedSize])}
        >
          {title}
        </TitleTag>
        {description && <p className="text-sm text-fg-subtle">{description}</p>}
      </div>
      {actions && <div className={inline ? "" : "mt-4"}>{actions}</div>}
    </div>
  );
}

"use client";
import { useEffect, useId, useLayoutEffect, useRef, type HTMLAttributes, type MouseEvent } from "react";
import { cn } from "../../lib/cn";
import { silenceFieldErrorAnnouncements } from "../../lib/announce";
import { Callout } from "../Callout/Callout";
import { Link } from "../Link/Link";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface FormErrorSummaryItem {
  /** The invalid field's id (TextField / FormField `id`). */
  id: string;
  /** What is wrong and how to fix it: "Enter an email like name@company.com". */
  message: string;
}

export interface FormErrorSummaryProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "role" | "color"> {
  /** One entry per invalid field; each becomes a link that focuses that field. */
  errors: FormErrorSummaryItem[];
  /** Heading. Default "Fix 1 field to continue" / "Fix N fields to continue". */
  title?: string;
  /** Move focus to the heading when the summary appears after a failed submit (WCAG 3.3.1). Default true. */
  focusOnMount?: boolean;
  /** Heading element. Default h2. */
  titleAs?: "h2" | "h3" | "h4";
}

/**
 * FormErrorSummary — submit-time error list for forms of 3+ fields (WCAG 3.3.1). A danger Callout
 * with role="group" (not "alert": the focus move to its heading is the one announcement), a heading
 * that takes focus, and a link per invalid field. Keep the field-level errors as well.
 */
export function FormErrorSummary({
  errors,
  title,
  focusOnMount = true,
  titleAs: TitleTag = "h2",
  className,
  ...props
}: FormErrorSummaryProps) {
  const headingId = useId();
  const headingRef = useRef<HTMLElement | null>(null);
  const count = errors.length;
  const heading = title ?? `Fix ${count} ${count === 1 ? "field" : "fields"} to continue`;

  // Runs before the fields' passive effects in the same commit, so their per-field announcements
  // stay silent and the focus move below is the single announcement.
  useIsoLayoutEffect(() => {
    if (focusOnMount) silenceFieldErrorAnnouncements();
  }, []);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
    // Mount only: the summary takes focus when it appears after a failed submit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (count === 0) return null;

  const focusField = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.focus({ preventScroll: true });
  };

  return (
    <Callout
      color="danger"
      role="group"
      aria-labelledby={headingId}
      className={cn("mb-4", className)}
      {...props}
    >
      <TitleTag
        id={headingId}
        ref={headingRef as never}
        tabIndex={-1}
        className="mb-1 text-sm font-semibold leading-snug text-fg"
      >
        {heading}
      </TitleTag>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {errors.map((err) => (
          <li key={err.id}>
            <Link href={`#${err.id}`} onClick={focusField(err.id)} underline="always" size="sm" className="py-1 underline-offset-2">
              {err.message}
            </Link>
          </li>
        ))}
      </ul>
    </Callout>
  );
}

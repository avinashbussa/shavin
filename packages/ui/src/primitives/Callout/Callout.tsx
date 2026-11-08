import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export const calloutVariants = cva(
  "flex w-full items-start gap-3 rounded-[var(--radius-panel)] border p-4 text-sm transition-colors",
  {
    variants: {
      color: {
        neutral: "bg-surface-hover/60 text-fg border-hairline",
        accent: "bg-accent/10 text-fg border-accent/30",
        success: "bg-success/10 text-fg border-success/30",
        warning: "bg-warning/10 text-fg border-warning/30",
        danger: "bg-danger/10 text-fg border-danger/30",
      },
    },
    defaultVariants: {
      color: "neutral",
    },
  }
);

const defaultIcons: Record<NonNullable<VariantProps<typeof calloutVariants>["color"]>, React.ReactNode> = {
  neutral: <Info className="h-5 w-5 shrink-0 text-fg-muted" />,
  accent: <Info className="h-5 w-5 shrink-0 text-accent-contrast" />,
  success: <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />,
  warning: <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />,
  danger: <AlertCircle className="h-5 w-5 shrink-0 text-danger" />,
};

export interface CalloutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof calloutVariants> {
  /** Title text header for callout. */
  title?: string;
  /**
   * Element for the title. Default `p`: a callout title labels a note, it does not open a
   * section. Use a heading level that fits the page outline when it should be navigable.
   */
  titleAs?: "p" | "h2" | "h3" | "h4" | "h5" | "h6";
  /** Custom icon node override. */
  icon?: React.ReactNode;
}

export function Callout({
  className,
  color = "neutral",
  title,
  icon,
  titleAs: TitleTag = "p",
  children,
  ...props
}: CalloutProps) {
  const resolvedColor = color ?? "neutral";
  const iconNode = icon ?? defaultIcons[resolvedColor];

  return (
    <div className={cn(calloutVariants({ color: resolvedColor }), className)} {...props}>
      {iconNode}
      <div className="flex-1 min-w-0">
        {title && <TitleTag className="font-semibold leading-none mb-1 text-fg">{title}</TitleTag>}
        <div className="text-sm leading-relaxed text-fg-muted">{children}</div>
      </div>
    </div>
  );
}

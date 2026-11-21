import { createContext, useContext, type ReactNode, type HTMLAttributes, type ElementType, type Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { cardPaddingToScale, concentricContainerStyle, concentricRadius, withConcentricStyle } from "../../lib/concentric";
import { Text } from "../Text";
import { bgMediaLayer, resolveBgReadability, type BgMediaProps } from "../../lib/media-overlays";
import { surfaceClass, type Surface } from "../../lib/surface";
import { withResizable, type ResizableProps } from "../Resizable";

const cardVariants = cva("rounded-[var(--radius-panel)] border border-hairline bg-surface text-fg transition-all duration-200 ease-out", {
  variants: {
    padding: {
      none: "",
      xs: "p-2",
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
      xl: "p-8",
      "2xl": "p-10",
      "3xl": "p-12",
    },
    interactive: {
      true: "hover:border-hairline-strong hover:shadow-panel cursor-pointer",
      false: "",
    },
  },
  defaultVariants: { padding: "none", interactive: false },
});

/** Padding-only class map — used for the z-10 content wrapper when bg media is
 *  present, so padding goes on the wrapper while the visual base (rounded,
 *  border, bg-surface) stays on the parent positioning shell. */
const CARD_PADDING: Record<string, string> = {
  none: "",
  xs: "p-2",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
  xl: "p-8",
  "2xl": "p-10",
  "3xl": "p-12",
};

/** The inner radius (a CSS expression) of the nearest Card above, so a Card inside a Card takes
 *  that as its own outer radius instead of the full panel radius. */
const CardRadiusContext = createContext<string | null>(null);

function CardBase({
  className,
  padding,
  interactive,
  style,
  bgVideo,
  bgImage,
  bgSize,
  bgOverlays,
  bgVideoPaused,
  bgPoster,
  /** Surface contrast scope intent. "dark"/"light" auto-invert against the page
      theme (contrast band). "dark-always"/"light-always" lock to one theme
      regardless of page (for media backgrounds). Undefined inherits page theme. */
  surface,
  children,
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, "onResize"> & VariantProps<typeof cardVariants> & BgMediaProps & ResizableProps & { style?: React.CSSProperties; surface?: Surface; ref?: Ref<HTMLDivElement> }) {
  // Concentric chain: a nested Card's outer radius is its parent Card's inner radius; its own inner
  // radius (for concentric children and the next Card down) subtracts its padding, or with
  // padding="none" equals its outer radius minus the 1px border.
  const parentInner = useContext(CardRadiusContext);
  const outer = parentInner ?? "var(--radius-panel)";
  const inner = concentricRadius(cardPaddingToScale((padding as string) || "none"), { outer, border: true }) ?? outer;
  const concentricStyle = {
    ...concentricContainerStyle((padding as string) || "none", true, { outer, border: true }),
    ...(parentInner ? { borderRadius: parentInner } : {}),
  };
  const paddingClass = CARD_PADDING[(padding as string) || "none"] || "";
  const bg = resolveBgReadability({ surface, bgVideo, bgImage, bgOverlays });
  const { hasMedia, media, content } = bgMediaLayer({ bgVideo, bgImage, bgSize, bgOverlays: bg.bgOverlays, bgVideoPaused, bgPoster }, paddingClass);
  return <div
    data-surface={bg.surface || undefined}
    className={cn(hasMedia ? "relative overflow-hidden" : "", cardVariants({ padding: hasMedia ? "none" : padding, interactive }), surfaceClass(bg.surface), className)}
    style={withConcentricStyle(concentricStyle, style ?? {})} {...props}
  >
    {media}
    <CardRadiusContext.Provider value={inner}>{content(children)}</CardRadiusContext.Provider>
  </div>;
}

export const Card = withResizable(CardBase, "Card");

export function CardList({
  as: Tag = "div",
  className,
  style,
  ...props
}: HTMLAttributes<HTMLElement> & { as?: ElementType; style?: React.CSSProperties }) {
  return (
    <Tag
      className={cn("divide-y divide-hairline rounded-[var(--radius-panel)] border border-hairline bg-surface overflow-hidden", className)}
      style={style}
      {...props}
    />
  );
}

export function CardListItem({
  as: Tag = "div",
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { as?: ElementType }) {
  return (
    <Tag
      className={cn("flex items-center gap-3 px-4 py-3 hover:bg-surface-hover", className)}
      {...props}
    />
  );
}

export function CardRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="p-4">
      <Text weight="semibold">{label}</Text>
      <div className="mt-1.5 flex items-center justify-between gap-4">{children}</div>
    </div>
  );
}

const statCardVariants = cva("rounded-[var(--radius-panel)] border border-hairline bg-surface", {
  variants: {
    padding: {
      sm: "p-4",
      md: "p-5",
    },
  },
  defaultVariants: { padding: "sm" },
});

export function StatCard({
  label,
  value,
  sub,
  trend,
  alert,
  padding = "sm",
  style,
  className,
  ...props
}: {
  label: string;
  value: string;
  /** Small line under the value, e.g. a change like "+7.8%". */
  sub?: string;
  /** Colours the sub line: up = success, down = danger. */
  trend?: "up" | "down" | "flat";
  /** Marks the card as needing attention: a warning dot before the label and "Needs attention" for screen readers. Never underlines the value (an underline reads as a link). */
  alert?: boolean;
  style?: React.CSSProperties;
} & VariantProps<typeof statCardVariants> & HTMLAttributes<HTMLDivElement>) {
  const concentricStyle = concentricContainerStyle(padding as string, true);
  return (
    <div className={cn(statCardVariants({ padding }), className)} style={withConcentricStyle(style, concentricStyle)} {...props}>
      <Text size="xs" color="muted" className={cn(alert && "inline-flex items-center gap-1.5")}>
        {alert && (
          <>
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-warning" />
            <span className="sr-only">Needs attention: </span>
          </>
        )}
        {label}
      </Text>
      <Text size="lg" weight="semibold" className="mt-1 text-2xl font-semibold">
        {value}
      </Text>
      {sub && <Text size="xs" color="subtle" className={cn("mt-0.5", trend === "up" && "text-success", trend === "down" && "text-danger")}>{sub}</Text>}
    </div>
  );
}

import React, { Suspense, forwardRef, lazy } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
// The generated name tables (about 150 kB of source) load with the first named icon, not with the
// bundle: a page that never renders `<Icon name>` never fetches them.
const loadTables = () => import("./icon-loaders.generated");
import type { LucideIcon } from "lucide-react";

export const iconVariants = cva("inline-flex shrink-0 items-center justify-center transition-colors", {
  variants: {
    size: {
      xs: "h-3 w-3 [&_svg]:h-3 [&_svg]:w-3",
      sm: "h-4 w-4 [&_svg]:h-4 [&_svg]:w-4",
      md: "h-5 w-5 [&_svg]:h-5 [&_svg]:w-5",
      lg: "h-6 w-6 [&_svg]:h-6 [&_svg]:w-6",
      xl: "h-8 w-8 [&_svg]:h-8 [&_svg]:w-8",
      "2xl": "h-10 w-10 [&_svg]:h-10 [&_svg]:w-10",
      "3xl": "h-12 w-12 [&_svg]:h-12 [&_svg]:w-12",
    },
    color: {
      default: "text-fg",
      subtle: "text-fg-subtle",
      muted: "text-fg-muted",
      // Brand graphics sit on light surfaces too: raw --brand (e.g. Lime) is
      // ~1.4:1 on white. --brand-contrast is the contrast-safe variant in
      // light mode and stays chromatic in dark mode.
      brand: "text-brand-contrast",
      contrast: "text-brand-contrast",
      success: "text-success",
      warning: "text-warning",
      danger: "text-danger",
      inherit: "text-inherit",
    },
  },
  defaultVariants: {
    size: "md",
    color: "inherit",
  },
});

export type IconSizeToken = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
export type IconColorToken = "default" | "subtle" | "muted" | "brand" | "contrast" | "success" | "warning" | "danger" | "inherit";

export interface IconProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, "color" | "size"> {
  /** Name of the icon in Lucide / Shavin icon set (e.g. "Sparkles", "Search", "arrow-right"). */
  name?: string;
  /** Direct icon component or custom React node to render. */
  icon?: LucideIcon | React.ElementType | React.ReactNode;
  /** Size token (xs, sm, md, lg, xl, 2xl, 3xl) or custom numeric pixel value (16-256) or CSS size string. */
  size?: IconSizeToken | number | string;
  /** Semantic color token or custom hex/CSS color string. Defaults to "inherit" (currentColor), so an icon always takes the colour of its parent (buttons, tabs, chips, filled brand surfaces). */
  color?: IconColorToken | (string & {});
  /** Stroke width for vector lines (from 0.5 to 3.0 in 0.25 steps, default 2). */
  strokeWidth?: number;
  /** Whether stroke width remains absolute regardless of scaling. */
  absoluteStrokeWidth?: boolean;
  /** Custom pixel or CSS size override if not using size prop. */
  customSize?: number | string;
  /** Optional title for accessibility hover tooltip. */
  title?: string;
  /** Accessible ARIA label. */
  "aria-label"?: string;
  className?: string;
}

const TOKEN_SIZES = new Set(["xs", "sm", "md", "lg", "xl", "2xl", "3xl"]);
const TOKEN_COLORS = new Set(["default", "subtle", "muted", "brand", "contrast", "success", "warning", "danger", "inherit"]);

/** Names match the way Icon always has: case-insensitive, ignoring "-" and "_" ("layout-dashboard" = "layoutDashboard"). */
function normalizeIconName(name: string): string {
  return name.toLowerCase().replace(/[-_]/g, "");
}

type IconComponent = React.ComponentType<any>;
type Library = "lucide" | "phosphor" | "radix" | "material";

/** Material icons are SVG path strings; render them the way @mdi/react would, minus Lucide-only props. */
function materialIcon(path: string): IconComponent {
  const MaterialIcon = forwardRef<SVGSVGElement, any>(function MaterialIcon(
    { strokeWidth: _sw, absoluteStrokeWidth: _asw, size: _size, ...rest },
    ref
  ) {
    return (
      <svg ref={ref} viewBox="0 0 24 24" {...rest}>
        <path d={path} fill="currentColor" />
      </svg>
    );
  });
  return MaterialIcon;
}

/** Placeholder for names no library has: a circled exclamation mark, as before. */
const MissingIcon = forwardRef<SVGSVGElement, any>(function MissingIcon(
  { strokeWidth = 2, absoluteStrokeWidth: _asw, size: _size, ...rest },
  ref
) {
  return (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
});

/**
 * Find which library has a name and load just that icon. Lucide, Phosphor and Radix names are known
 * from the generated tables; anything else checks the Material names, which load on first miss.
 */
async function loadIconByName(name: string): Promise<{ library: Library | "unknown"; Component: IconComponent }> {
  const T = await loadTables();
  const raw = normalizeIconName(name);
  const candidates = [raw];
  if (raw.endsWith("icon")) candidates.push(raw.slice(0, -4)); // Radix/Phosphor export names ("BellIcon")
  if (raw.startsWith("mdi")) candidates.push(raw.slice(3)); // @mdi/js export names ("mdiBell")
  for (const key of candidates) {
    const lucide = T.LUCIDE_NAMES[key];
    if (lucide) {
      const m = await T.LUCIDE_BUCKETS[lucide[0]]();
      return { library: "lucide", Component: m[lucide[1]] as IconComponent };
    }
    const phosphor = T.PHOSPHOR[key];
    if (phosphor) {
      const m = await T.PHOSPHOR_BUCKETS[phosphor[0]]();
      return { library: "phosphor", Component: m[phosphor[1]] as IconComponent };
    }
    const radix = T.RADIX[key];
    if (radix) return { library: "radix", Component: (await T.loadRadix())[radix] as IconComponent };
  }
  const { MATERIAL } = await T.loadMaterialNames();
  const exp = candidates.map((k) => MATERIAL[k]).find(Boolean);
  if (!exp) {
    if (process.env.NODE_ENV !== "production") console.warn(`[@shavin/ui] Icon: no icon named "${name}".`);
    return { library: "unknown", Component: MissingIcon };
  }
  const mdi = await T.loadMaterial();
  return { library: "unknown", Component: materialIcon(mdi[exp] as string) };
}

/**
 * Only Lucide icons take `strokeWidth` / `absoluteStrokeWidth`; for the other libraries they would
 * land on the <svg> as stray attributes. The library is only known once the icon has loaded, so the
 * loaded component is wrapped to pass those two props on for Lucide and drop them otherwise.
 */
function withLibraryProps(library: Library | "unknown", Component: IconComponent): IconComponent {
  if (library === "lucide" || Component === MissingIcon) return Component;
  const Wrapped = forwardRef<SVGSVGElement, any>(function LibraryIcon({ strokeWidth: _sw, absoluteStrokeWidth: _asw, ...rest }, ref) {
    const C = Component as React.ComponentType<any>;
    return <C ref={ref} {...rest} />;
  });
  return Wrapped as unknown as IconComponent;
}

/** Icons that have finished loading render synchronously from here, with no Suspense boundary. */
const loadedIcons = new Map<string, IconComponent>();

/** One lazy component per name, created once and reused, so each icon file is fetched at most once. */
const lazyIcons = new Map<string, { Component: React.LazyExoticComponent<IconComponent>; ready: Promise<void> }>();
function lazyIcon(name: string) {
  const key = normalizeIconName(name);
  let entry = lazyIcons.get(key);
  if (!entry) {
    const loaded = loadIconByName(name).then(({ library, Component }) => {
      const C = withLibraryProps(library, Component ?? MissingIcon);
      loadedIcons.set(key, C);
      return C;
    });
    entry = { Component: lazy(() => loaded.then((C) => ({ default: C }))), ready: loaded.then(() => undefined) };
    lazyIcons.set(key, entry);
  }
  return entry;
}

/**
 * Load icons ahead of rendering. Streaming server rendering (Next.js, renderToReadableStream,
 * prerender) waits for icons on its own; synchronous renderers (renderToString,
 * renderToStaticMarkup, tests that assert right after render) need the icons loaded first.
 * With no names, loads every Lucide and Phosphor icon, which suits Node scripts.
 */
export async function preloadIcons(names?: string[]): Promise<void> {
  const list: string[] = names ?? (await loadTables().then((T) => [...Object.keys(T.LUCIDE_NAMES), ...Object.keys(T.PHOSPHOR)]));
  await Promise.all(list.map((n) => lazyIcon(n).ready));
}

/**
 * Lucide is the only library whose icons take strokeWidth / absoluteStrokeWidth. Its components carry
 * a displayName equal to the icon name; Phosphor's end in "Icon" and Radix's have none.
 */
function isLucideIcon(comp: IconComponent): boolean {
  const c = comp as { displayName?: string; render?: { name?: string } };
  return typeof c.displayName === "string" && !c.displayName.endsWith("Icon") && c.render?.name === c.displayName;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  {
    name,
    icon: IconComponent,
    size = "md",
    color = "inherit",
    strokeWidth = 2,
    absoluteStrokeWidth = false,
    customSize,
    className,
    style,
    ...props
  },
  ref
) {
  // Determine if size is a recognized token or a custom numeric/pixel size
  const isTokenSize = typeof size === "string" && TOKEN_SIZES.has(size);
  const sizeVariant = isTokenSize ? (size as IconSizeToken) : undefined;
  const rawDimension = customSize ?? (!isTokenSize ? size : undefined);
  const resolvedDimension = typeof rawDimension === "number" ? `${rawDimension}px` : rawDimension;

  // Determine if color is a recognized semantic token or a custom CSS/hex color
  const isTokenColor = typeof color === "string" && TOKEN_COLORS.has(color);
  const colorVariant = isTokenColor ? (color as IconColorToken) : undefined;
  const customColorStyle = !isTokenColor && color ? { color } : {};

  const mergedStyle: React.CSSProperties = {
    ...(resolvedDimension ? { width: resolvedDimension, height: resolvedDimension } : {}),
    ...customColorStyle,
    ...style,
  };

  const commonClasses = cn(
    iconVariants({
      size: sizeVariant,
      color: colorVariant,
    }),
    className
  );

  const parsedNum =
    typeof rawDimension === "number"
      ? rawDimension
      : typeof rawDimension === "string" && !isNaN(Number(rawDimension))
      ? Number(rawDimension)
      : undefined;

  // If a direct React Element / Node is passed
  if (React.isValidElement(IconComponent)) {
    return (
      <span
        className={commonClasses}
        style={mergedStyle}
      >
        {IconComponent}
      </span>
    );
  }

  // If a Lucide or React Component type is passed
  if (typeof IconComponent === "function" || (typeof IconComponent === "object" && IconComponent !== null)) {
    const Component = IconComponent as LucideIcon;
    const _isLucide = isLucideIcon(Component as React.ComponentType<any>);
    return (
      <Component
        ref={ref}
        size={parsedNum}
        {...(_isLucide ? { strokeWidth, absoluteStrokeWidth } : {})}
        className={commonClasses}
        style={mergedStyle}
        aria-hidden={!props["aria-label"] && !props.title}
        {...(props as any)}
      />
    );
  }

  // Lookup by string name (either via name prop or string passed to icon prop). Only the named icon's
  // file is loaded; while it loads, an empty box of the same size holds its place.
  const stringName = name || (typeof IconComponent === "string" ? IconComponent : undefined);
  if (!stringName) {
    return <MissingIcon ref={ref} className={commonClasses} style={mergedStyle} aria-hidden={!props["aria-label"] && !props.title} {...props} />;
  }
  // Both branches render the same Suspense boundary. The server often has the icon loaded already
  // and renders it directly, while the browser's first render still has to load it; with one
  // boundary in both trees, React keeps the server's SVG until the file arrives instead of
  // reporting a hydration mismatch.
  const fallback = <span className={commonClasses} style={mergedStyle} aria-hidden />;
  const Loaded = loadedIcons.get(normalizeIconName(stringName));
  if (Loaded) {
    return (
      <Suspense fallback={fallback}>
        <Loaded
          ref={ref}
          size={parsedNum}
          strokeWidth={strokeWidth}
          absoluteStrokeWidth={absoluteStrokeWidth}
          className={commonClasses}
          style={mergedStyle}
          aria-hidden={!props["aria-label"] && !props.title}
          {...(props as any)}
        />
      </Suspense>
    );
  }
  const { Component: Lazy } = lazyIcon(stringName);
  return (
    <Suspense fallback={fallback}>
      <Lazy
        ref={ref}
        size={parsedNum}
        strokeWidth={strokeWidth}
        absoluteStrokeWidth={absoluteStrokeWidth}
        className={commonClasses}
        style={mergedStyle}
        aria-hidden={!props["aria-label"] && !props.title}
        {...(props as any)}
      />
    </Suspense>
  );
});

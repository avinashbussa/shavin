import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { ALL_ICONS, ICON_REGISTRY } from "../IconPicker";
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
      // Accent graphics sit on light surfaces too: raw --accent (e.g. Lime) is
      // ~1.4:1 on white. --accent-contrast is the contrast-safe variant in
      // light mode and stays chromatic in dark mode.
      accent: "text-accent-contrast",
      contrast: "text-accent-contrast",
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
export type IconColorToken = "default" | "subtle" | "muted" | "accent" | "contrast" | "success" | "warning" | "danger" | "inherit";

export interface IconProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, "color" | "size"> {
  /** Name of the icon in Lucide / Shavin icon set (e.g. "Sparkles", "Search", "arrow-right"). */
  name?: string;
  /** Direct icon component or custom React node to render. */
  icon?: LucideIcon | React.ElementType | React.ReactNode;
  /** Size token (xs, sm, md, lg, xl, 2xl, 3xl) or custom numeric pixel value (16-256) or CSS size string. */
  size?: IconSizeToken | number | string;
  /** Semantic color token or custom hex/CSS color string. Defaults to "inherit" (currentColor), so an icon always takes the colour of its parent (buttons, tabs, chips, filled accent surfaces). */
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
const TOKEN_COLORS = new Set(["default", "subtle", "muted", "accent", "contrast", "success", "warning", "danger", "inherit"]);

/** Helper to resolve icon component by name string */
function resolveIcon(name?: string): React.ComponentType<any> | null {
  if (!name) return null;
  if (ALL_ICONS[name]) return ALL_ICONS[name];
  const camelKey = name.charAt(0).toLowerCase() + name.slice(1);
  if (ALL_ICONS[camelKey]) return ALL_ICONS[camelKey];
  const lowerKey = name.toLowerCase().replace(/[-_]/g, "");
  const match = Object.keys(ALL_ICONS).find(
    (k) => k.toLowerCase().replace(/[-_]/g, "") === lowerKey
  );
  return match ? ALL_ICONS[match] : null;
}

/** Build a lookup map of component → library for stripping incompatible props */
const _COMPONENT_LIBRARY_MAP = new WeakMap<React.ComponentType<any>, string>();
for (const item of ICON_REGISTRY) {
  _COMPONENT_LIBRARY_MAP.set(item.component, item.library);
}

/** Check if a resolved icon component belongs to Lucide (the only library that accepts strokeWidth/absoluteStrokeWidth) */
function isLucideIcon(comp: React.ComponentType<any>): boolean {
  if (_COMPONENT_LIBRARY_MAP.get(comp) === "lucide") return true;
  // Fallback: check if the component's propTypes include strokeWidth (Lucide sets this)
  const anyComp = comp as any;
  return !!anyComp.propTypes && !!anyComp.propTypes.strokeWidth;
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

  // Lookup by string name (either via name prop or string passed to icon prop)
  const stringName = name || (typeof IconComponent === "string" ? IconComponent : undefined);
  const Resolved = resolveIcon(stringName);
  if (Resolved) {
    const _isLucide = isLucideIcon(Resolved);
    return (
      <Resolved
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

  // Fallback placeholder icon if name not found
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={commonClasses}
      style={mergedStyle}
      aria-hidden={!props["aria-label"] && !props.title}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
});

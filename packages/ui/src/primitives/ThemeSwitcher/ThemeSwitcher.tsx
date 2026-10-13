"use client";
import React, { useEffect, useState, useCallback, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import { Sun, Moon, Desktop, Check } from "@phosphor-icons/react";
import { cn } from "../../lib/cn";
import { Switch } from "../Switch";

import { applyAccentColor } from "../../lib/theme-presets";

export type ThemeMode = "light" | "dark" | "system";

export interface UseThemeOptions {
  storageKey?: string;
  defaultTheme?: ThemeMode;
}

export function useTheme(options: UseThemeOptions = {}) {
  const { storageKey = "shavin-theme", defaultTheme = "light" } = options;
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });
  const [mounted, setMounted] = useState(false);

  // Read initial theme from storage and system preference
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(storageKey) as ThemeMode | null;
      if (stored && (stored === "light" || stored === "dark" || stored === "system")) {
        setThemeState(stored);
      } else if (typeof document !== "undefined") {
        const isDark = document.documentElement.classList.contains("dark");
        setThemeState(isDark ? "dark" : "light");
      }
    } catch {
      // Ignore localStorage access errors
    }

    if (typeof window !== "undefined" && window.matchMedia) {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      setSystemTheme(mql.matches ? "dark" : "light");

      const handler = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? "dark" : "light");
      };
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [storageKey]);

  // Sync state to DOM and storage
  const resolvedTheme: "light" | "dark" =
    theme === "system" ? systemTheme : theme;

  const applyThemeToDOM = useCallback((resolved: "light" | "dark", rawTheme: ThemeMode) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.setAttribute("data-theme", resolved);
    root.style.colorScheme = resolved;
    applyAccentColor();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyThemeToDOM(resolvedTheme, theme);
  }, [resolvedTheme, theme, mounted, applyThemeToDOM]);

  // Listen for storage events across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        const val = e.newValue as ThemeMode;
        if (val === "light" || val === "dark" || val === "system") {
          setThemeState(val);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {
        // Ignore
      }
      const nextResolved = newTheme === "system" ? systemTheme : newTheme;
      applyThemeToDOM(nextResolved, newTheme);
    },
    [storageKey, systemTheme, applyThemeToDOM]
  );

  const toggleTheme = useCallback(() => {
    const isCurrentlyDark = typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : resolvedTheme === "dark";
    const nextTheme: ThemeMode = isCurrentlyDark ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    toggleTheme,
    mounted,
  };
}

export interface ThemeScriptProps {
  storageKey?: string;
  defaultTheme?: ThemeMode;
  /** Adds the translucent-panels class before first paint (the provider's panelBackground). */
  translucentPanels?: boolean;
}

/**
 * Hydration script to inject in <head> or at root of page to prevent flash of unstyled theme (FOUC).
 */
export function ThemeScript({
  storageKey = "shavin-theme",
  defaultTheme = "system",
  translucentPanels = false,
}: ThemeScriptProps) {
  const scriptContent = `
(function() {
  try {
    var key = '${storageKey}';
    var def = '${defaultTheme}';
    var stored = localStorage.getItem(key) || sessionStorage.getItem(key) || localStorage.getItem('shavin-appearance') || sessionStorage.getItem('shavin-appearance') || def;
    var isDark = stored === 'dark' || (stored === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    ${translucentPanels ? "root.classList.add('translucent-panels');" : ""}
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  } catch (e) {}
})();
  `.trim();

  // The script only does its job in server-rendered HTML. When React creates it
  // in the browser (client-only apps such as Vite, or a client-side mount) it
  // never runs, and React 19 logs "Encountered a script tag". Marking it as a
  // data block there keeps it inert and silent; ThemeProvider's effect applies
  // the theme instead. suppressHydrationWarning covers the server/client
  // difference in `type` during hydration.
  const isServer = typeof window === "undefined";
  return (
    <script
      id="shavin-theme-script"
      type={isServer ? undefined : "application/json"}
      dangerouslySetInnerHTML={{ __html: scriptContent }}
      suppressHydrationWarning
    />
  );
}

const themeSwitcherVariants = cva("inline-flex items-center transition-all", {
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface ThemeSwitcherProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof themeSwitcherVariants> {
  variant?: "icon-button" | "segmented" | "menu" | "switch";
  storageKey?: string;
  defaultTheme?: ThemeMode;
  showLabels?: boolean;
  labels?: {
    light?: string;
    dark?: string;
    system?: string;
  };
}

export const ThemeSwitcher = forwardRef<HTMLDivElement, ThemeSwitcherProps>(
  function ThemeSwitcher(
    {
      variant = "icon-button",
      size = "md",
      storageKey = "shavin-theme",
      defaultTheme = "system",
      showLabels = false,
      labels = { light: "Light", dark: "Dark", system: "System" },
      className,
      ...props
    },
    ref
  ) {
    const { theme, resolvedTheme, setTheme, toggleTheme, mounted } = useTheme({
      storageKey,
      defaultTheme,
    });

    const iconSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;
    const btnSizeCls =
      size === "sm"
        ? "h-7 px-2 text-xs gap-1.5"
        : size === "lg"
        ? "h-9 px-3 text-sm gap-2"
        : "h-8 px-2.5 text-xs gap-1.5";

    // 1. Switch variant (binary toggle light <-> dark)
    if (variant === "switch") {
      return (
        <div
          ref={ref}
          className={cn("inline-flex items-center gap-2", className)}
          {...props}
        >
          <Sun size={iconSize} className="text-fg-muted shrink-0" aria-hidden />
          <Switch
            size={size === "lg" ? "md" : "sm"}
            checked={mounted ? resolvedTheme === "dark" : false}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Toggle dark mode"
          />
          <Moon size={iconSize} className="text-fg-muted shrink-0" aria-hidden />
        </div>
      );
    }

    // 2. Segmented variant (3-way selector)
    if (variant === "segmented") {
      return (
        <div
          ref={ref}
          role="radiogroup"
          aria-label="Theme mode"
          className={cn(
            "inline-flex items-center p-0.5 rounded-[var(--radius-lg)] border border-hairline bg-surface shadow-1",
            className
          )}
          {...props}
        >
          {(["light", "dark", "system"] as const).map((mode) => {
            const isActive = mounted ? theme === mode : mode === defaultTheme;
            const IconComp =
              mode === "light" ? Sun : mode === "dark" ? Moon : Desktop;
            const labelText = labels[mode] || mode;

            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setTheme(mode)}
                className={cn(
                  "flex items-center justify-center rounded-[calc(var(--radius-lg)-2px)] font-medium transition cursor-pointer select-none",
                  btnSizeCls,
                  isActive
                    ? "bg-surface-hover text-fg font-semibold shadow-1"
                    : "text-fg-muted hover:text-fg hover:bg-surface-hover/50"
                )}
                title={labelText}
              >
                <IconComp size={iconSize} className="shrink-0" aria-hidden />
                {showLabels && <span>{labelText}</span>}
              </button>
            );
          })}
        </div>
      );
    }

    // 3. Menu variant (Radix dropdown menu)
    if (variant === "menu") {
      const ActiveIcon =
        mounted && resolvedTheme === "dark" ? Moon : Sun;

      return (
        <div ref={ref} className={cn("inline-flex", className)} {...props}>
          <RadixMenu.Root>
            <RadixMenu.Trigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center rounded-[var(--radius-lg)] border border-hairline bg-surface text-fg hover:bg-surface-hover hover:text-fg transition shadow-1 cursor-pointer",
                  btnSizeCls
                )}
                aria-label="Select appearance theme"
              >
                <ActiveIcon size={iconSize} className="shrink-0" aria-hidden />
                {showLabels && (
                  <span className="capitalize">
                    {mounted ? labels[theme] || theme : labels[defaultTheme] || defaultTheme}
                  </span>
                )}
              </button>
            </RadixMenu.Trigger>
            <RadixMenu.Portal>
              <RadixMenu.Content
                data-panel
                align="end"
                sideOffset={4}
                avoidCollisions
                collisionPadding={8}
                className="animate-rise origin-[var(--radix-dropdown-menu-content-transform-origin)] z-50 w-36 overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-surface shadow-panel focus:outline-none p-1"
              >
                {(["light", "dark", "system"] as const).map((mode) => {
                  const isActive = mounted ? theme === mode : mode === defaultTheme;
                  const IconComp =
                    mode === "light" ? Sun : mode === "dark" ? Moon : Desktop;
                  const labelText = labels[mode] || mode;

                  return (
                    <RadixMenu.Item
                      key={mode}
                      onClick={() => setTheme(mode)}
                      className="flex w-full items-center justify-between px-2.5 py-1.5 text-xs text-fg rounded-[var(--radius-lg)] cursor-pointer outline-none hover:bg-surface-hover data-[highlighted]:bg-surface-hover transition"
                    >
                      <div className="flex items-center gap-2">
                        <IconComp size={14} className="text-fg-muted shrink-0" />
                        <span>{labelText}</span>
                      </div>
                      {isActive && (
                        <Check size={12} className="text-fg shrink-0" />
                      )}
                    </RadixMenu.Item>
                  );
                })}
              </RadixMenu.Content>
            </RadixMenu.Portal>
          </RadixMenu.Root>
        </div>
      );
    }

    // 4. Icon button variant (default single button toggle)
    const CurrentIcon =
      (mounted ? resolvedTheme : defaultTheme) === "dark" ? Moon : Sun;
    const currentLabel =
      mounted ? labels[theme] || theme : labels[defaultTheme] || defaultTheme;

    return (
      <div ref={ref} className={cn("inline-flex", className)} {...props}>
        <button
          type="button"
          onClick={toggleTheme}
          className={cn(
            "flex items-center justify-center rounded-[var(--radius-lg)] text-fg-muted hover:text-fg hover:bg-surface-hover/60 transition cursor-pointer",
            btnSizeCls
          )}
          aria-label={`Toggle theme (current: ${currentLabel})`}
          title={`Appearance: ${currentLabel}`}
        >
          <CurrentIcon size={iconSize} className="shrink-0" aria-hidden />
          {showLabels && <span>{currentLabel}</span>}
        </button>
      </div>
    );
  }
);

import { reapplyBrandColor } from "../../lib/theme-presets";

/**
 * Appearance for client-only apps (Vite, createRoot).
 *
 * ThemeScript sets the `dark` class, `data-theme` and `color-scheme` from the stored preference or the OS
 * setting, but only as an inline script in server-rendered HTML. A client-only app never runs it, so the
 * page would stay light on a dark OS. ThemeProvider calls this on mount instead. It does nothing when the
 * HTML was already resolved (the script ran, or next-themes or the app set the class or `data-theme`), so
 * server-rendered apps behave exactly as before.
 *
 * The lookup and the DOM writes mirror the ThemeScript source on purpose; a test runs both and compares.
 */

const MARK = "data-shavin-theme-resolved";

export interface ClientThemeOptions {
  storageKey?: string;
  defaultTheme?: "light" | "dark" | "system";
  translucentPanels?: boolean;
}

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

/** The preference ThemeScript would use: stored choice (either storage, either key), else the default. */
export function readThemePreference(storageKey: string, defaultTheme: string): string {
  return (
    read(() => localStorage, storageKey) ||
    read(() => sessionStorage, storageKey) ||
    read(() => localStorage, "shavin-appearance") ||
    read(() => sessionStorage, "shavin-appearance") ||
    defaultTheme
  );
}

function writeMode(root: HTMLElement, dark: boolean) {
  if (dark) root.classList.add("dark");
  else root.classList.remove("dark");
  root.setAttribute("data-theme", dark ? "dark" : "light");
  root.style.colorScheme = dark ? "dark" : "light";
}

/**
 * Resolves the appearance on mount when nothing has. Returns a cleanup that stops following the OS, or
 * null when the HTML was already resolved by someone else (the caller then does nothing).
 */
export function resolveClientTheme({ storageKey = "shavin-theme", defaultTheme = "system", translucentPanels = false }: ClientThemeOptions = {}): (() => void) | null {
  if (typeof document === "undefined") return null;
  const root = document.documentElement;
  const ours = root.getAttribute(MARK) === "1";
  const alreadyResolved = root.hasAttribute("data-theme") || root.classList.contains("dark") || root.classList.contains("light");
  if (alreadyResolved && !ours) return null;

  const mql = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const isDark = (preference: string) => preference === "dark" || (preference === "system" && !!mql && mql.matches);
  const preference = readThemePreference(storageKey, defaultTheme);

  if (!ours) {
    root.setAttribute(MARK, "1");
    if (translucentPanels) root.classList.add("translucent-panels");
    writeMode(root, isDark(preference));
  }

  if (preference !== "system" || !mql) return () => {};
  const onChange = () => {
    // Re-read the preference: an explicit choice made since mount (useTheme, ThemeSwitcher) wins over the OS.
    const now = readThemePreference(storageKey, defaultTheme);
    if (now !== "system") return;
    writeMode(root, isDark(now));
    reapplyBrandColor();
  };
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

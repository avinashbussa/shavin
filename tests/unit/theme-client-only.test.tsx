import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ThemeProvider, ThemeScript } from "@shavin/ui";
import { scopedThemeVars } from "../../packages/ui/src/lib/theme-presets";
import { resolveClientTheme } from "../../packages/ui/src/primitives/ThemeProvider/clientTheme";

/**
 * Client-only apps (Vite, createRoot) never run the inline ThemeScript, so ThemeProvider resolves the
 * appearance itself on mount: "system" follows the OS, a stored choice wins, and a page whose HTML was
 * already resolved (server-rendered) is left alone. Uses a matchMedia mock; no real browser.
 */
const html = () => document.documentElement;
const prop = (name: string) => html().style.getPropertyValue(name);

interface MockMql {
  matches: boolean;
  listeners: Set<() => void>;
}
let mql: MockMql;
let addSpy: ReturnType<typeof vi.fn>;
let removeSpy: ReturnType<typeof vi.fn>;

function stubMatchMedia(dark: boolean) {
  mql = { matches: dark, listeners: new Set() };
  addSpy = vi.fn((_t: string, cb: () => void) => mql.listeners.add(cb));
  removeSpy = vi.fn((_t: string, cb: () => void) => mql.listeners.delete(cb));
  vi.stubGlobal("matchMedia", (q: string) => ({
    get matches() {
      return q.includes("dark") ? mql.matches : false;
    },
    media: q,
    addEventListener: addSpy,
    removeEventListener: removeSpy,
  }));
}
const setOs = (dark: boolean) => {
  mql.matches = dark;
  act(() => mql.listeners.forEach((cb) => cb()));
};

beforeEach(() => {
  html().removeAttribute("style");
  html().removeAttribute("data-theme");
  html().removeAttribute("data-shavin-theme-resolved");
  html().className = "";
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ThemeProvider in a client-only app", () => {
  it("dark OS, nothing stored: dark class, data-theme, color-scheme and dark brand tokens before the effects", () => {
    stubMatchMedia(true);
    render(<ThemeProvider brandColor="Blue" devTools={false} />);
    expect(html().classList.contains("dark")).toBe(true);
    expect(html().getAttribute("data-theme")).toBe("dark");
    expect(html().style.colorScheme).toBe("dark");
    expect(prop("--brand-solid")).toBe(scopedThemeVars("Blue", undefined, undefined, true)["--brand-solid"]);
  });

  it("light OS, nothing stored: light", () => {
    stubMatchMedia(false);
    render(<ThemeProvider brandColor="Blue" devTools={false} />);
    expect(html().classList.contains("dark")).toBe(false);
    expect(html().getAttribute("data-theme")).toBe("light");
    expect(prop("--brand-solid")).toBe(scopedThemeVars("Blue", undefined, undefined, false)["--brand-solid"]);
  });

  it("an explicit stored light stays light on a dark OS and does not listen to the OS", () => {
    stubMatchMedia(true);
    localStorage.setItem("shavin-theme", "light");
    render(<ThemeProvider devTools={false} />);
    expect(html().getAttribute("data-theme")).toBe("light");
    expect(html().classList.contains("dark")).toBe(false);
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("an explicit stored dark stays dark on a light OS; the legacy shavin-appearance key counts too", () => {
    stubMatchMedia(false);
    sessionStorage.setItem("shavin-appearance", "dark");
    render(<ThemeProvider devTools={false} />);
    expect(html().getAttribute("data-theme")).toBe("dark");
  });

  it('defaultTheme="light" on a dark OS stays light', () => {
    stubMatchMedia(true);
    render(<ThemeProvider defaultTheme="light" devTools={false} />);
    expect(html().getAttribute("data-theme")).toBe("light");
  });

  it("follows OS changes while the preference is system, brand tokens included", () => {
    stubMatchMedia(false);
    render(<ThemeProvider brandColor="Blue" devTools={false} />);
    expect(html().getAttribute("data-theme")).toBe("light");
    setOs(true);
    expect(html().classList.contains("dark")).toBe(true);
    expect(html().getAttribute("data-theme")).toBe("dark");
    expect(html().style.colorScheme).toBe("dark");
    expect(prop("--brand-solid")).toBe(scopedThemeVars("Blue", undefined, undefined, true)["--brand-solid"]);
    setOs(false);
    expect(html().getAttribute("data-theme")).toBe("light");
    expect(prop("--brand-solid")).toBe(scopedThemeVars("Blue", undefined, undefined, false)["--brand-solid"]);
  });

  it("an explicit choice made after mount wins over later OS changes", () => {
    stubMatchMedia(false);
    render(<ThemeProvider devTools={false} />);
    localStorage.setItem("shavin-theme", "light");
    setOs(true);
    expect(html().getAttribute("data-theme")).toBe("light");
  });

  it("stops listening on unmount", () => {
    stubMatchMedia(false);
    const { unmount } = render(<ThemeProvider devTools={false} />);
    expect(mql.listeners.size).toBe(1);
    unmount();
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(mql.listeners.size).toBe(0);
  });

  it("still follows the OS after React StrictMode's second mount", () => {
    stubMatchMedia(false);
    render(
      <StrictMode>
        <ThemeProvider devTools={false} />
      </StrictMode>,
    );
    expect(html().getAttribute("data-theme")).toBe("light");
    setOs(true);
    expect(html().getAttribute("data-theme")).toBe("dark");
  });

  it("copes without matchMedia (light, no listener)", () => {
    vi.stubGlobal("matchMedia", undefined);
    render(<ThemeProvider devTools={false} />);
    expect(html().getAttribute("data-theme")).toBe("light");
  });
});

describe("ThemeProvider in a server-rendered app", () => {
  it("leaves HTML the ThemeScript already resolved alone (light on a dark OS)", () => {
    stubMatchMedia(true);
    html().setAttribute("data-theme", "light");
    html().style.colorScheme = "light";
    render(<ThemeProvider devTools={false} />);
    expect(html().getAttribute("data-theme")).toBe("light");
    expect(html().classList.contains("dark")).toBe(false);
    expect(html().hasAttribute("data-shavin-theme-resolved")).toBe(false);
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("leaves a dark class set by the server (or by next-themes) alone on a light OS", () => {
    stubMatchMedia(false);
    html().classList.add("dark");
    render(<ThemeProvider devTools={false} />);
    expect(html().classList.contains("dark")).toBe(true);
    expect(html().hasAttribute("data-theme")).toBe(false);
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("resolveClientTheme returns null for already resolved HTML", () => {
    stubMatchMedia(true);
    html().setAttribute("data-theme", "dark");
    expect(resolveClientTheme()).toBeNull();
  });
});

describe("resolveClientTheme matches the ThemeScript", () => {
  /** The script source ThemeScript puts in the server HTML. */
  const scriptSource = () => {
    const m = /<script[^>]*id="shavin-theme-script"[^>]*>([\s\S]*?)<\/script>/.exec(renderToString(<ThemeScript />));
    if (!m) throw new Error("ThemeScript did not render a script");
    return m[1].replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
  };
  const snapshot = () => ({ dark: html().classList.contains("dark"), theme: html().getAttribute("data-theme"), scheme: html().style.colorScheme });
  const reset = () => {
    html().removeAttribute("style");
    html().removeAttribute("data-theme");
    html().removeAttribute("data-shavin-theme-resolved");
    html().className = "";
  };

  const cases: Array<[string, string | null, boolean]> = [
    ["nothing stored, light OS", null, false],
    ["nothing stored, dark OS", null, true],
    ["stored light, dark OS", "light", true],
    ["stored dark, light OS", "dark", false],
    ["stored system, dark OS", "system", true],
    ["stored system, light OS", "system", false],
  ];
  it.each(cases)("%s", (_label, stored, osDark) => {
    stubMatchMedia(osDark);
    if (stored) localStorage.setItem("shavin-theme", stored);
    new Function(scriptSource())();
    const fromScript = snapshot();
    reset();
    resolveClientTheme();
    expect(snapshot()).toEqual(fromScript);
  });
});

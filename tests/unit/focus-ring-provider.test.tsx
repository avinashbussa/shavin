import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { ThemeProvider, ScopedThemeProvider } from "@shavin/ui";

describe("focusRing setting (ThemeProvider / ScopedThemeProvider)", () => {
  it("ThemeProvider writes data-focus-ring on <html> before first paint (SSR script)", () => {
    for (const mode of ["subtle", "default", "strong"] as const) {
      expect(renderToString(<ThemeProvider focusRing={mode} devTools={false} />)).toContain(`setAttribute('data-focus-ring', '${mode}')`);
    }
  });
  it("ThemeProvider without the prop does not touch the attribute (CSS default is subtle)", () => {
    expect(renderToString(<ThemeProvider devTools={false} />)).not.toContain("data-focus-ring");
  });
  it("ScopedThemeProvider sets the attribute on its root; unset inherits (no attribute)", () => {
    expect(renderToString(<ScopedThemeProvider focusRing="strong">x</ScopedThemeProvider>)).toContain('data-focus-ring="strong"');
    expect(renderToString(<ScopedThemeProvider>x</ScopedThemeProvider>)).not.toContain("data-focus-ring");
  });
});

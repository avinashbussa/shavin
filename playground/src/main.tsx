import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ScopedThemeProvider, ThemeProvider, ToastProvider } from "@shavin/ui";
import { App } from "./App";
import "./styles.css";

/**
 * `?touch=compact` mounts the real ThemeProvider with touchTargets="compact" (the tap-target suite uses it to
 * test the global switch); `?touch=scoped-compact` wraps the app in a compact ScopedThemeProvider instead.
 * Without the parameter nothing is mounted, so the playground shows the stock stylesheet (comfortable).
 */
function withTouchMode(children: ReactNode): ReactNode {
  const mode = new URLSearchParams(window.location.search).get("touch");
  if (mode === "compact") {
    return (
      <ThemeProvider touchTargets="compact" devTools={false}>
        {children}
      </ThemeProvider>
    );
  }
  if (mode === "scoped-compact") {
    return <ScopedThemeProvider touchTargets="compact">{children}</ScopedThemeProvider>;
  }
  return children;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>{withTouchMode(<App />)}</ToastProvider>
  </StrictMode>,
);

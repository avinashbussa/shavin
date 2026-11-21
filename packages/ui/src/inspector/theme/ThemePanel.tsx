"use client";
import * as React from "react";
import { RotateCcw, X } from "lucide-react";
import { Button } from "../../primitives/Button";
import { IconButton } from "../../primitives/IconButton";
import { ThemeControls } from "./ThemeControls";
import type { ThemeController } from "./useThemeController";

export interface ThemePanelProps {
  theme: ThemeController;
  /** Style for menus the controls open (font, size), so they match the panel. */
  contentStyle: React.CSSProperties;
  onClose: () => void;
  /** Insets from the viewport edges, so the panel steps around the bar. */
  insets?: { top: number; bottom: number; left: number };
  /** Replaces the floating position (the phone sheet). */
  floatStyle?: React.CSSProperties;
}

/**
 * The floating Theme panel: the same controls the legacy panel's Theme tab has, in a panel of the inspector's own
 * that docks to the left edge and closes with its own button or Esc. It sits inside the inspector's pinned token
 * scope, so changing the page's theme never changes how this panel looks.
 */
export function ThemePanel({ theme, contentStyle, onClose, insets, floatStyle }: ThemePanelProps): React.JSX.Element {
  return (
    <section
      aria-label="Theme"
      data-shavin-theme-panel=""
      data-panel=""
      className="flex flex-col overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-elevated text-fg shadow-panel"
      style={{ position: "absolute", left: insets?.left ?? 20, top: insets?.top ?? 20, bottom: insets?.bottom ?? 20, width: 320, pointerEvents: "auto", ...contentStyle, zIndex: undefined, ...floatStyle }}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-hairline px-4 py-2.5">
        <h2 className="m-0 text-sm font-semibold tracking-tight text-fg">Theme</h2>
        <div className="flex items-center gap-1">
          <IconButton variant="ghost" size="sm" aria-label="Reset to project theme" onClick={theme.resetAll}>
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          </IconButton>
          <IconButton variant="ghost" size="sm" aria-label="Close the Theme panel" onClick={onClose}>
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </IconButton>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4" onWheel={(e) => e.stopPropagation()}>
        <ThemeControls theme={theme} contentStyle={contentStyle} />
      </div>
      <footer className="shrink-0 border-t border-hairline p-3">
        <Button type="button" variant="solid" size="sm" className="w-full" onClick={theme.copyCode}>
          {theme.copied ? "Copied ThemeProvider JSX!" : "Copy Theme Code"}
        </Button>
      </footer>
    </section>
  );
}

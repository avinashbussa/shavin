"use client";
import * as React from "react";
import { ExternalLink, X } from "lucide-react";
import { Button } from "../primitives/Button";
import { IconButton } from "../primitives/IconButton";
import { Kbd } from "../primitives/Kbd";
import { SegmentedControl, SegmentedControlItem } from "../primitives/SegmentedControl";
import { Switch } from "../primitives/Switch";
import type { InspectorSettings } from "./settings";
import type { SchemeChoice } from "./scheme";

export interface SettingsPanelProps {
  settings: InspectorSettings;
  onChange: (patch: Partial<InspectorSettings>) => void;
  ignoredCount: number;
  onClearIgnored: () => void;
  /** Opens the Bridge and MCP panel (the legacy panel: DS Audit, MCP, Stream). Omitted when it is not available. */
  onOpenBridge?: () => void;
  onClose: () => void;
  /** Insets from the viewport edges, so the panel steps around the bar. */
  insets?: { top: number; bottom: number; right: number };
  /** Replaces the floating position (the phone sheet). */
  floatStyle?: React.CSSProperties;
}

const SHORTCUTS: ReadonlyArray<[string, string]> = [
  ["V", "Select"],
  ["I", "Issues"],
  ["T", "Theme"],
  [",", "Settings"],
  ["Esc", "Back out one step"],
  ["Alt Shift S", "Show or hide the inspector"],
];

/** Settings for the inspector: a non-modal panel, opened from the bar. Everything here is stored in this browser only. */
export function SettingsPanel({ settings, onChange, ignoredCount, onClearIgnored, onOpenBridge, onClose, insets, floatStyle }: SettingsPanelProps): React.JSX.Element {
  return (
    <section
      aria-label="Settings"
      data-shavin-settings-panel=""
      data-panel=""
      className="flex flex-col overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-elevated text-fg shadow-panel"
      style={{ position: "absolute", right: insets?.right ?? 20, top: insets?.top ?? 20, maxHeight: `calc(100% - ${(insets?.top ?? 20) + (insets?.bottom ?? 20)}px)`, width: 300, pointerEvents: "auto", ...floatStyle }}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-hairline px-4 py-2.5">
        <h2 className="m-0 text-sm font-semibold tracking-tight text-fg">Settings</h2>
        <IconButton variant="ghost" size="sm" aria-label="Close Settings" onClick={onClose}>
          <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </IconButton>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4" style={{ fontSize: 12, lineHeight: 1.5 }} onWheel={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium text-fg">Single-key shortcuts</div>
            <div className="text-[11px] text-fg-muted">V, I, T and comma, while the bar has focus or a tool is on.</div>
          </div>
          <Switch size="sm" aria-label="Single-key shortcuts" checked={settings.shortcuts} onCheckedChange={(v) => onChange({ shortcuts: v })} />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium text-fg">Reduce motion</div>
            <div className="text-[11px] text-fg-muted">No animation in the inspector. The system setting is always respected.</div>
          </div>
          <Switch size="sm" aria-label="Reduce motion" checked={settings.reduceMotion} onCheckedChange={(v) => onChange({ reduceMotion: v })} />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium text-fg">Reserve space</div>
            <div className="text-[11px] text-fg-muted">Pad the page by the bar's height so the bar never covers content.</div>
          </div>
          <Switch size="sm" aria-label="Reserve space" checked={settings.reserveSpace} onCheckedChange={(v) => onChange({ reserveSpace: v })} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium text-fg">Inspector colours</div>
          <SegmentedControl size="sm" variant="subtle" value={settings.scheme} onValueChange={(v) => v && onChange({ scheme: v as SchemeChoice })} aria-label="Inspector colours">
            <SegmentedControlItem value="auto" label="Auto" />
            <SegmentedControlItem value="light" label="Light" />
            <SegmentedControlItem value="dark" label="Dark" />
          </SegmentedControl>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium text-fg">Ignored findings: {ignoredCount}</div>
            <div className="text-[11px] text-fg-muted">An ignore stops applying when the element's selector or text changes.</div>
          </div>
          <Button size="sm" variant="outline" disabled={ignoredCount === 0} onClick={onClearIgnored}>
            Clear all
          </Button>
        </div>
        <div>
          <div className="mb-1.5 font-medium text-fg">Shortcuts</div>
          <dl className="m-0 space-y-1">
            {SHORTCUTS.map(([key, what]) => (
              <div key={what} className="flex items-center justify-between gap-3">
                <dt className="text-fg-muted">{what}</dt>
                <dd className="m-0 flex gap-1">
                  {key.split(" ").map((k) => (
                    <Kbd key={k} className={k.length > 1 ? "min-w-7 text-center font-sans" : "min-w-6 text-center font-sans"}>
                      {k}
                    </Kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        {onOpenBridge ? (
          <Button size="sm" variant="outline" className="w-full justify-between" onClick={onOpenBridge}>
            Bridge and MCP panel
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </section>
  );
}

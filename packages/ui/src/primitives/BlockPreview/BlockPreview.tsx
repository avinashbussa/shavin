"use client";
import React, { useState, useEffect, useRef, createContext, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { Button } from "../Button";
import { Card } from "../Card";
import { AspectRatio } from "../AspectRatio";
import { SegmentedControl, SegmentedControlItem } from "../SegmentedControl";
import { CodeBlock } from "../CodeBlock";
import { cn } from "../../lib/cn";
import { Monitor, Tablet, Smartphone, ArrowUpRight, Code2, X } from "lucide-react";

export const DeviceContext = createContext<"desktop" | "tablet" | "mobile">("desktop");

export interface BlockPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title of the block displayed in code modal and headers */
  title: string;
  /** Full JSX/TSX raw source code */
  code: string;
  /** CLI install command, e.g. `npx @shavin/cli add ...` */
  command: string;
  /** Layout mode for canvas composition */
  layout?: "fullscreen" | "sidebar" | "sidebar-right" | "header" | "centered" | "plain" | "app-shell";
  /** Optional builder template key to link to Shavin Studio */
  builderKey?: string;
  /** Optional direct URL override for Studio/Builder */
  builderUrl?: string;
  /** Live interactive component or BlockRenderer tree */
  children: ReactNode;
}

export function BlockPreview({
  title,
  code,
  command,
  layout = "fullscreen",
  builderKey,
  builderUrl,
  children,
  className,
  ...props
}: BlockPreviewProps): React.JSX.Element {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showCode, setShowCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [parentWidth, setParentWidth] = useState(800);
  // Natural height of the block at desktop width, so the desktop frame can fit it instead of cropping to 16:9.
  const measureRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setParentWidth(entry.contentRect.width || 800);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = measureRef.current;
    if (!el || device !== "desktop") return;
    const ro = new ResizeObserver(() => setContentH(Math.ceil(el.offsetHeight)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [device, layout]);

  const handleCopyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1200);
      });
    }
  };

  const handleCopyCommand = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(command).then(() => {
        setCopiedCommand(true);
        setTimeout(() => setCopiedCommand(false), 1200);
      });
    }
  };

  const targetWidths = {
    desktop: 1280,
    tablet: 768,
    mobile: 375,
  };

  const targetHeights = {
    desktop: 720,
    tablet: 960,
    mobile: 680,
  };

  const W_target = targetWidths[device];
  const H_target = targetHeights[device];
  const parentHeight = parentWidth * (9 / 16);

  // Math scale factor based on width and height constraints
  const scale =
    device === "desktop"
      ? Math.min(parentWidth / W_target, 1)
      : Math.max(Math.min((parentWidth - 24) / W_target, (parentHeight - 24) / H_target, 1), 0.65);

  // offsetHeight is layout height, so it is already in 1280px space (unaffected by the scale transform).
  const FIT_MIN = 360;
  const FIT_MAX = 960;
  const canFit = device === "desktop" && (layout === "plain" || layout === "centered" || layout === "fullscreen");
  const fitPad = layout === "plain" || layout === "centered" ? 64 : 0;
  const fitted = canFit && contentH !== null;
  const viewportH = fitted ? Math.min(Math.max(contentH! + fitPad, FIT_MIN), FIT_MAX) : parentHeight / (scale || 1);
  const frameH = fitted ? viewportH * scale : parentHeight;
  const Frame: any = device === "desktop" ? "div" : AspectRatio;
  const frameProps = device === "desktop" ? { className: "relative w-full", style: { height: frameH } } : { ratio: 16 / 9 };

  const isFork = builderKey?.startsWith("@") || builderKey?.includes("/");
  const builderQuery = isFork ? `fork=${builderKey}` : `load=${builderKey}`;

  const resolvedBuilderUrl =
    builderUrl ||
    (builderKey
      ? typeof window !== "undefined" && window.location.hostname === "localhost"
        ? `http://localhost:3200/?${builderQuery}`
        : `https://studio.shavin.cc/?${builderQuery}`
      : undefined);

  return (
    <DeviceContext.Provider value={device}>
      <Card
        className={cn(
          "w-full border border-hairline overflow-hidden shadow-card flex flex-col mb-8 bg-surface",
          className,
        )}
        {...props}
      >
        {/* Block Meta Action Bar — 3-Column Balanced Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 w-full items-center gap-4 p-4 border-b border-hairline bg-surface-hover/30 shrink-0">
          {/* Left Column — Actions */}
          <div className="flex items-center justify-start gap-2 min-w-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCode(true)}
              iconLeft={<Code2 className="h-3.5 w-3.5" />}
              className="text-xs cursor-pointer"
            >
              View Code
            </Button>
            {resolvedBuilderUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(resolvedBuilderUrl, "_blank", "noopener");
                }}
                iconRight={<ArrowUpRight className="h-3.5 w-3.5" />}
                className="text-xs cursor-pointer"
              >
                <span className="hidden sm:inline">Edit in Studio</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            )}
          </div>

          {/* Center Column — Device Viewport Sizer (Always Centered) */}
          <div className="flex items-center justify-center">
            <SegmentedControl
              size="sm"
              variant="icon"
              value={device}
              onValueChange={(v) => v && setDevice(v as "desktop" | "tablet" | "mobile")}
            >
              <SegmentedControlItem value="desktop" label="Desktop" icon={<Monitor className="h-3.5 w-3.5" />} />
              <SegmentedControlItem value="tablet" label="Tablet" icon={<Tablet className="h-3.5 w-3.5" />} />
              <SegmentedControlItem value="mobile" label="Mobile" icon={<Smartphone className="h-3.5 w-3.5" />} />
            </SegmentedControl>
          </div>

          {/* Right Column — CLI Command Box */}
          <div className="flex items-center justify-end gap-1.5 min-w-0">
            <div className="flex items-center gap-1 bg-surface-hover border border-hairline rounded-[var(--radius-lg)] pl-2.5 pr-1.5 py-1 text-[11px] font-mono text-fg-muted w-full sm:w-64 overflow-hidden truncate">
              <span className="text-accent shrink-0">&gt;</span>
              <span className="truncate flex-1 text-left">{command}</span>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="h-5 px-1.5 rounded-[var(--radius-lg)] bg-surface hover:bg-surface-hover text-[10px] border border-hairline shrink-0 text-fg-muted hover:text-fg cursor-pointer"
              >
                {copiedCommand ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* 16:9 Webpage screen canvas */}
        <div
          ref={containerRef}
          className="border-b border-hairline w-full relative overflow-hidden bg-surface-hover/20"
        >
          <Frame {...frameProps}>
            {device === "desktop" ? (
              <div
                data-lenis-prevent
                data-lenis-prevent-wheel
                // Scrollable preview: focusable so it scrolls by keyboard (WCAG 2.1.1).
                tabIndex={0}
                role="region"
                aria-label="Block preview"
                className="absolute top-0 left-0 overflow-y-auto overflow-x-hidden bg-canvas overscroll-contain"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: `${W_target}px`,
                  height: `${viewportH}px`,
                  touchAction: "pan-y",
                }}
              >
                {layout === "centered" || layout === "plain" ? (
                  <div
                    className="min-h-full w-full flex items-center justify-center p-8 bg-canvas"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, rgb(var(--hairline)) 0px, rgb(var(--hairline)) 1px, transparent 1px, transparent 10px)",
                    }}
                  >
                    <div ref={measureRef} className="w-full">{children}</div>
                  </div>
                ) : layout === "sidebar" || layout === "sidebar-right" ? (
                  <div className="h-full w-full flex bg-canvas">
                    {layout === "sidebar" && (
                      <div className="h-full shrink-0 flex flex-col">{children}</div>
                    )}
                    <div
                      className="flex-1 h-full p-6 space-y-4 overflow-y-auto"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(45deg, rgb(var(--hairline)) 0px, rgb(var(--hairline)) 1px, transparent 1px, transparent 10px)",
                      }}
                    >
                      {/* Header bar placeholder */}
                      <div className="h-12 bg-surface border border-hairline rounded-[var(--radius-lg)] flex items-center justify-between px-4">
                        <div className="h-3 w-28 bg-fg-muted/15 rounded-[var(--radius-sm)]" />
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-16 bg-fg-muted/10 rounded-[var(--radius-lg)]" />
                          <div className="h-6 w-6 rounded-full bg-fg-muted/15" />
                        </div>
                      </div>
                      {/* KPI cards placeholder */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 rounded-[var(--radius-panel)] border border-dashed border-hairline-strong bg-surface/50 p-3 flex flex-col justify-between">
                          <div className="h-2 w-16 bg-fg-subtle/20 rounded-[var(--radius-sm)]" />
                          <div className="h-5 w-12 bg-fg-muted/30 rounded-[var(--radius-sm)]" />
                        </div>
                        <div className="h-24 rounded-[var(--radius-panel)] border border-dashed border-hairline-strong bg-surface/50 p-3 flex flex-col justify-between">
                          <div className="h-2 w-16 bg-fg-subtle/20 rounded-[var(--radius-sm)]" />
                          <div className="h-5 w-12 bg-fg-muted/30 rounded-[var(--radius-sm)]" />
                        </div>
                      </div>
                      {/* Main content table placeholder */}
                      <div className="h-44 rounded-[var(--radius-panel)] border border-dashed border-hairline-strong bg-surface/50 p-4 space-y-3">
                        <div className="h-3 w-32 bg-fg-muted/20 rounded-[var(--radius-sm)] mb-4" />
                        <div className="h-2 w-full bg-fg-subtle/10 rounded-[var(--radius-sm)]" />
                        <div className="h-2 w-full bg-fg-subtle/10 rounded-[var(--radius-sm)]" />
                        <div className="h-2 w-3/4 bg-fg-subtle/10 rounded-[var(--radius-sm)]" />
                      </div>
                    </div>
                    {layout === "sidebar-right" && (
                      <div className="h-full shrink-0 flex flex-col">{children}</div>
                    )}
                  </div>
                ) : layout === "header" ? (
                  <div className="min-h-full w-full flex flex-col bg-canvas">
                    <div className="w-full shrink-0">{children}</div>
                    <div className="flex-1 flex">
                      <div className="w-56 border-r border-hairline bg-surface p-3 space-y-2">
                        <div className="h-3 w-16 bg-fg-subtle/20 rounded-[var(--radius-sm)] mb-3" />
                        <div className="h-7 w-full bg-surface-hover rounded-[var(--radius-sm)]" />
                        <div className="h-7 w-full bg-surface-hover/50 rounded-[var(--radius-sm)]" />
                        <div className="h-7 w-full bg-surface-hover/50 rounded-[var(--radius-sm)]" />
                      </div>
                      <div
                        className="flex-1 p-6 space-y-4"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, rgb(var(--hairline)) 0px, rgb(var(--hairline)) 1px, transparent 1px, transparent 10px)",
                        }}
                      >
                        <div className="h-32 rounded-[var(--radius-panel)] border border-dashed border-hairline-strong bg-surface/50" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full"><div ref={measureRef} className="w-full">{children}</div></div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div
                  className="bg-surface border border-fg-muted/20 rounded-[28px] shadow-modal overflow-hidden flex flex-col shrink-0"
                  style={{
                    width: `${W_target}px`,
                    height: `${H_target}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                  }}
                >
                  {/* Status Bar */}
                  <div className="h-8 bg-surface-hover border-b border-hairline px-6 flex items-center justify-between shrink-0 select-none text-[10px] text-fg-muted font-semibold">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-3.5 rounded-[2px] border border-fg-muted/30 bg-fg-muted/10" />
                      <span className="h-2 w-2 rounded-full bg-fg-muted/30" />
                    </div>
                  </div>
                  {/* Scrollable Viewport */}
                  <div
                    data-lenis-prevent
                    data-lenis-prevent-wheel
                    tabIndex={0}
                    role="region"
                    aria-label="Block preview"
                    className="flex-1 w-full overflow-y-auto overflow-x-hidden bg-canvas text-fg relative overscroll-contain"
                    style={{ touchAction: "pan-y" }}
                  >
                    {layout === "centered" || layout === "plain" ? (
                      <div
                        className="min-h-full w-full flex items-center justify-center p-6 bg-canvas"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, rgb(var(--hairline)) 0px, rgb(var(--hairline)) 1px, transparent 1px, transparent 10px)",
                        }}
                      >
                        {children}
                      </div>
                    ) : (
                      <div className="h-full w-full">{children}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Frame>
        </div>
      </Card>

      {/* Code modal — view + copy from here (rendered via portal to escape overflow clipping) */}
      {showCode &&
        typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => setShowCode(false)}
          >
            <div
              className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-surface shadow-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                <span className="text-sm font-semibold text-fg">{title} — Source Code</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={handleCopyCode} className="text-xs cursor-pointer">
                    {copiedCode ? "Copied!" : "Copy Code"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowCode(false)}
                    aria-label="Close"
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-lg)] text-fg-muted transition hover:bg-surface-hover hover:text-fg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <CodeBlock code={code} className="min-h-0 flex-1 border-none rounded-none" />
            </div>
          </div>,
          document.body
        )}
    </DeviceContext.Provider>
  );
}

export interface MiniPreviewFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  showDotGrid?: boolean;
}

export function MiniPreviewFrame({
  children,
  className,
  showDotGrid = true,
  ...props
}: MiniPreviewFrameProps): React.JSX.Element {
  return (
    // A thumbnail, usually inside a link card: its sample controls are pictures, so
    // keep them out of the tab order and the a11y tree (no nested interactive content).
    <div
      aria-hidden="true"
      inert
      className={cn(
        "h-36 w-full bg-surface-hover/25 border-b border-hairline relative overflow-hidden pointer-events-none select-none transition-colors group-hover:bg-surface-hover/45",
        className
      )}
      {...props}
    >
      {/* Architectural Dot Grid */}
      {showDotGrid && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none z-0"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }}
        />
      )}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export interface MiniBlockPreviewProps {
  children?: ReactNode;
  scale?: number;
  fallback?: ReactNode;
  className?: string;
  /** Whether videos inside the preview should play. Default true. Set to false for file thumbnails to pause all videos. */
  playVideo?: boolean;
}

export class SafeMiniPreview extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center select-none pointer-events-none w-full max-w-[160px]">
            <div className="h-1.5 w-12 rounded bg-fg/40 mb-1" />
            <div className="h-2 w-24 rounded bg-fg/20" />
            <div className="h-1.5 w-20 rounded bg-fg-subtle/20" />
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export function MiniBlockPreview({
  children,
  scale = 0.285714,
  fallback,
  className,
  playVideo = true,
}: MiniBlockPreviewProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultFallback = (
    <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center select-none pointer-events-none w-full max-w-[160px]">
      <div className="h-1.5 w-12 rounded bg-fg/40 mb-1" />
      <div className="h-2 w-24 rounded bg-fg/20" />
      <div className="h-1.5 w-20 rounded bg-fg-subtle/20" />
    </div>
  );

  // Pause or play all <video> elements within the preview
  useEffect(() => {
    if (!containerRef.current) return;
    const videos = containerRef.current.querySelectorAll("video");
    videos.forEach((v) => {
      if (playVideo) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [playVideo, children]);

  if (!children) {
    return (fallback as React.JSX.Element) || defaultFallback;
  }

  const invScale = (1 / scale) * 100;

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 pointer-events-none select-none overflow-hidden bg-canvas",
        className
      )}
      style={{
        width: `${invScale}%`,
        height: `${invScale}%`,
        transform: `scale(${scale})`,
        transformOrigin: "0 0",
      }}
    >
      <div className="w-full h-full min-h-full flex flex-col items-center justify-start overflow-hidden [&_>_*]:w-full [&_>_*]:min-h-full [&_>_*]:rounded-none [&_>_*]:border-0 [&_>_*]:shadow-none">
        <SafeMiniPreview fallback={fallback || defaultFallback}>
          {children}
        </SafeMiniPreview>
      </div>
    </div>
  );
}


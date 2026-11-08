import * as React from "react";
import { useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { highlightCode, type SupportedLanguage } from "../../lib/syntax";

export { highlightCode, type SupportedLanguage };

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Source code string to highlight. */
  code: string;
  /** Language identifier for syntax coloring (e.g. 'tsx', 'typescript', 'html', 'css', 'json', 'bash', 'python', 'sql'). Default 'tsx'. */
  language?: SupportedLanguage;
  /** Explicit appearance mode: 'dark' (forces dark theme), 'light' (forces light theme), or 'auto' (inherits from page theme). Default 'auto'. */
  appearance?: "dark" | "light" | "auto";
  /** Optional alias for appearance. */
  theme?: "dark" | "light" | "auto";
  /** Layout variant: 'standalone' (independent code box), 'attached' (anchored below component preview), 'collapsible' (expandable code drawer with view/hide toggle), or 'split' (horizontal side-by-side preview and code). Default 'standalone'. */
  variant?: "standalone" | "attached" | "collapsible" | "split";
  /** Optional alias for variant="collapsible". */
  collapsible?: boolean;
  /** Split orientation when pairing code with a live preview: 'vertical' (stacked) or 'horizontal' (side-by-side). Default 'vertical' (or 'horizontal' when variant='split'). */
  split?: "vertical" | "horizontal";
  /** Position of the preview relative to the code block: 'left' | 'right' | 'top' | 'bottom'. Default 'right' when split='horizontal', 'top' when split='vertical'. */
  previewPosition?: "left" | "right" | "top" | "bottom";
  /** Optional live preview component rendered alongside the code block. */
  children?: ReactNode;
  /** Whether code wraps lines automatically (whitespace-pre-wrap). Default false. */
  wrap?: boolean;
  /** Show one-click Copy button overlay. Default true. */
  copyable?: boolean;
  /** Collapsible drawer state ('open' | 'close') when variant='collapsible'. Default 'close'. */
  state?: "open" | "close";
  /** Optional initial open state for collapsible mode. */
  defaultOpen?: boolean;
  /** Callback fired when collapsible state changes ('open' | 'close'). */
  onStateChange?: (state: "open" | "close") => void;
  /** Optional label or description displayed in the collapsible footer bar. */
  description?: string;
  /** Optional title displayed in the collapsible footer bar (alias for description). */
  title?: string;
}

export function CodeBlock({
  code,
  language,
  appearance,
  theme,
  variant = "standalone",
  collapsible,
  split,
  previewPosition,
  children,
  wrap = false,
  copyable = true,
  state,
  defaultOpen,
  onStateChange,
  description,
  title,
  className,
  ...props
}: CodeBlockProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const effectiveAppearance = appearance || theme || "auto";
  const appearanceClass =
    effectiveAppearance === "dark"
      ? "dark"
      : effectiveAppearance === "light"
      ? "light"
      : "";

  const isCollapsible = variant === "collapsible" || collapsible === true;
  const effectiveSplit = variant === "split" ? (split || "horizontal") : (split || "vertical");

  // Controlled or uncontrolled open state from state prop ('open' | 'close') or defaultOpen
  const [internalOpen, setInternalOpen] = useState(
    state !== undefined
      ? state.toLowerCase() === "open"
      : defaultOpen === true
  );

  // Sync if parent updates controlled state
  React.useEffect(() => {
    if (state !== undefined) {
      setInternalOpen(state.toLowerCase() === "open");
    }
  }, [state]);

  const isCollapsibleOpen = internalOpen;

  const handleToggleOpen = () => {
    const next = !isCollapsibleOpen;
    setInternalOpen(next);
    onStateChange?.(next ? "open" : "close");
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  const effectivePos =
    previewPosition || (effectiveSplit === "horizontal" ? "right" : "top");

  const footerText = description || title;

  const codeBox = (
    <div
      className={cn(
        "group relative flex-1 min-w-0 border border-hairline bg-surface text-fg",
        appearanceClass,
        children && !isCollapsible
          ? effectiveSplit === "horizontal"
            ? effectivePos === "right"
              ? "rounded-t-[var(--radius-panel)] md:rounded-tr-none md:rounded-l-[var(--radius-panel)] border-b md:border-b-0 md:border-r"
              : "rounded-b-[var(--radius-panel)] md:rounded-bl-none md:rounded-r-[var(--radius-panel)] border-t md:border-t-0 md:border-l"
            : effectivePos === "top"
            ? "-mt-px rounded-b-[var(--radius-panel)]"
            : "rounded-t-[var(--radius-panel)] border-b"
          : isCollapsible
          ? "border-t border-hairline/20 rounded-b-[var(--radius-panel)]"
          : variant === "standalone"
          ? "rounded-[var(--radius-panel)]"
          : "-mt-px rounded-b-[var(--radius-panel)]",
        className,
      )}
      data-theme={effectiveAppearance !== "auto" ? effectiveAppearance : undefined}
      {...(!children ? props : {})}
    >
      {copyable && !isCollapsible && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded-[var(--radius-lg)] border border-hairline bg-surface px-2 py-1 text-xs text-fg-subtle transition hover:text-fg hover:bg-surface-hover active:scale-[0.97] md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 z-10 cursor-pointer"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      )}
      {/* Focusable so a keyboard can scroll long lines (WCAG 2.1.1). */}
      <pre tabIndex={0} role="region" aria-label={footerText || (language ? `${language} code` : "Code")} className={cn("overflow-x-auto p-4 text-xs leading-relaxed text-fg h-full select-text cursor-text selection:bg-accent/20 selection:text-fg", wrap && "whitespace-pre-wrap break-words")}>
        <code className="font-mono select-text cursor-text selection:bg-accent/20 selection:text-fg">{highlightCode(code, language)}</code>
      </pre>
    </div>
  );

  if (!children) {
    return codeBox;
  }

  // Collapsible Mode: Render component preview card with bottom footer and animated code accordion
  if (isCollapsible) {
    return (
      <div
        className={cn("w-full rounded-[var(--radius-panel)] border border-hairline bg-surface shadow-card overflow-hidden", className)}
        {...props}
      >
        {/* Component Live Preview Area */}
        <div className="relative flex flex-wrap items-center justify-center p-8 overflow-auto min-h-[140px] bg-surface">
          {/* Architectural Dot Grid */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none z-0"
            style={{
              backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
              backgroundSize: "12px 12px",
            }}
          />
          <div className="relative z-10 w-full flex flex-wrap items-center justify-center gap-4">
            {children}
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="flex items-center justify-between border-t border-hairline px-4 py-2.5 bg-surface-hover/30 text-xs">
          <div className="truncate text-fg-muted font-normal select-none">
            {footerText ? (
              <span className="font-mono text-fg-subtle">{footerText}</span>
            ) : (
              <span className="font-mono text-fg-subtle">Component Source</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {copyable && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center h-7 w-7 rounded-[var(--radius-lg)] border border-hairline bg-surface text-fg-muted hover:text-fg hover:bg-surface-hover transition cursor-pointer"
                title="Copy source code"
                aria-label="Copy source code"
              >
                {copied ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleOpen}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-lg)] border border-hairline bg-surface text-xs font-medium text-fg hover:bg-surface-hover transition cursor-pointer"
              aria-expanded={isCollapsibleOpen}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={cn("transition-transform duration-200", isCollapsibleOpen && "rotate-180")}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <span>{isCollapsibleOpen ? "Hide code" : "View code"}</span>
            </button>
          </div>
        </div>

        {/* Animated Smooth Collapsible Drawer */}
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
            isCollapsibleOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
          )}
        >
          <div className="overflow-hidden">
            {codeBox}
          </div>
        </div>
      </div>
    );
  }

  const previewBox = (
    <div
      className={cn(
        "relative flex flex-1 min-w-0 flex-wrap items-center justify-center border border-hairline bg-surface p-6 overflow-auto min-h-[120px]",
        effectiveSplit === "horizontal"
          ? effectivePos === "right"
            ? "rounded-b-[var(--radius-panel)] md:rounded-bl-none md:rounded-r-[var(--radius-panel)]"
            : "rounded-t-[var(--radius-panel)] md:rounded-tr-none md:rounded-l-[var(--radius-panel)]"
          : effectivePos === "top"
          ? "rounded-t-[var(--radius-panel)]"
          : "rounded-b-[var(--radius-panel)]",
      )}
    >
      {/* Architectural Dot Grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      <div className="relative z-10 w-full flex flex-wrap items-center justify-center gap-4">
        {children}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-[var(--radius-panel)] shadow-card",
        effectiveSplit === "horizontal" ? "grid grid-cols-1 md:grid-cols-2" : "flex flex-col",
        className,
      )}
      {...props}
    >
      {effectivePos === "right" || effectivePos === "bottom" ? (
        <>
          {codeBox}
          {previewBox}
        </>
      ) : (
        <>
          {previewBox}
          {codeBox}
        </>
      )}
    </div>
  );
}

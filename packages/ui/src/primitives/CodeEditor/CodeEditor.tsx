import * as React from "react";
import { useState, useRef, useCallback, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Icon } from "../Icon/Icon";
import { highlightCode, type SupportedLanguage } from "../../lib/syntax";

export interface CodeEditorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Source code string to edit or display. */
  value: string;
  /** Callback fired when code changes. */
  onChange?: (value: string) => void;
  /** Filename shown in the top header bar. */
  filename?: string;
  /** Language identifier badge (e.g. 'React TSX', 'TypeScript', 'JSON'). */
  language?: string;
  /** Whether to show the language badge on the editor header. Default true. */
  showLanguage?: boolean;
  /** Option to hide the top header bar completely. Default false. */
  hideHeader?: boolean;
  /** Option to show header (alias for !hideHeader). Default true. */
  showHeader?: boolean;
  /** Scoped theme mode for the editor box: 'dark' | 'light' | 'auto'. In 'auto', defaults to dark IDE theme. */
  theme?: "dark" | "light" | "auto";
  /** Allow users to toggle between dark and light themes within the editor container. */
  allowThemeToggle?: boolean;
  /** Whether the code editor is read-only. */
  readOnly?: boolean;
  /** Placeholder text shown when editor is empty. */
  placeholder?: string;
  /** Minimum height for the editor in pixels or CSS unit. */
  minHeight?: number | string;
  /** Whether to show a one-click Copy button in the header bar. */
  copyable?: boolean;
  /** Custom content rendered on the left side of the header bar. */
  headerLeft?: ReactNode;
  /** Custom content rendered on the right side of the header bar. */
  headerRight?: ReactNode;
  /** Custom footer node rendered below the editor. */
  footer?: ReactNode;
  /** Custom wrapper class name. */
  className?: string;
  /** Accessible name for the code field. Defaults to the filename. */
  label?: string;
}

export function CodeEditor({
  value,
  onChange,
  filename = "Component.tsx",
  language = "React TSX",
  showLanguage = true,
  hideHeader = false,
  showHeader = true,
  theme = "auto",
  allowThemeToggle = true,
  readOnly = false,
  placeholder,
  minHeight = 220,
  copyable = true,
  headerLeft,
  headerRight,
  footer,
  className,
  label,
  ...props
}: CodeEditorProps): React.JSX.Element {
  const [internalTheme, setInternalTheme] = useState<"dark" | "light">(
    theme === "dark" ? "dark" : theme === "light" ? "light" : "dark"
  );
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Tab indents while editing; Escape then Tab leaves the field (no keyboard trap).
  const escapedRef = useRef(false);

  const isDark = internalTheme === "dark";
  const shouldRenderHeader = showHeader && !hideHeader;

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  const toggleEditorTheme = () => {
    setInternalTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        escapedRef.current = true;
        return;
      }
      const leaving = escapedRef.current;
      escapedRef.current = false;
      if (e.key === "Tab" && !e.shiftKey && !leaving && !readOnly && onChange) {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const nextValue = value.substring(0, start) + "  " + value.substring(end);
        onChange(nextValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    },
    [value, onChange, readOnly]
  );

  const heightStyle = { minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight };

  return (
    <div
      data-editor-theme={internalTheme}
      className={cn(
        "group relative w-full overflow-hidden rounded-[var(--radius-panel)] transition-colors shadow-card",
        isDark ? "dark bg-surface border border-hairline text-fg" : "light bg-surface border border-hairline text-fg",
        className
      )}
      {...props}
    >
      {/* Top Header Bar */}
      {shouldRenderHeader && (
        <div
          className={cn(
            "flex items-center justify-between px-3.5 py-2 border-b select-none transition-colors",
            isDark ? "border-hairline bg-surface-hover/30 text-fg" : "border-hairline bg-surface-hover/60 text-fg"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {headerLeft || (
              <>
                {/* Document Icon via Shavin Icon primitive */}
                <Icon name="fileCode" size={14} color="accent" className="shrink-0" />

                {filename && (
                  <span className="text-xs font-mono font-semibold truncate text-fg">
                    {filename}
                  </span>
                )}

                {showLanguage && language && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-accent-subtle text-accent border border-accent/20"
                  >
                    {language}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {headerRight}

            {/* Scoped Editor Theme Switcher Button */}
            {allowThemeToggle && (
              <button
                type="button"
                onClick={toggleEditorTheme}
                className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-lg)] border border-hairline bg-surface text-fg-subtle hover:text-fg hover:bg-surface-hover transition cursor-pointer"
                title={`Switch editor to ${isDark ? "light" : "dark"} mode`}
                aria-label={`Switch editor to ${isDark ? "light" : "dark"} mode`}
              >
                <Icon name={isDark ? "sun" : "moon"} size={13} className="text-fg-subtle" />
              </button>
            )}

            {/* Copy Button */}
            {copyable && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex h-6 items-center gap-1.5 px-2 rounded-[var(--radius-lg)] border border-hairline bg-surface text-fg-subtle hover:text-fg hover:bg-surface-hover text-[11px] font-medium transition cursor-pointer"
                title="Copy code to clipboard"
              >
                <Icon
                  name={copied ? "check" : "copy"}
                  size={12}
                  className={copied ? "text-success" : "text-fg-subtle"}
                />
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor Body with Syntax Highlight Overlay + Transparent Textarea */}
      <div className="relative w-full overflow-hidden" style={heightStyle}>
        {/* Underlying Colorful Syntax-Highlighted Layer */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-0 p-4 font-mono text-xs leading-relaxed overflow-hidden whitespace-pre-wrap break-words select-none text-fg"
          style={heightStyle}
        >
          <code className="font-mono">
            {value ? highlightCode(value, language || filename) : null}
            {value.endsWith("\n") && "\n "}
          </code>
        </pre>

        {/* Foreground Interactive Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          aria-label={label ?? filename ?? "Code"}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          style={heightStyle}
          className={cn(
            "relative z-10 block w-full h-full font-mono text-xs p-4 bg-transparent outline-none leading-relaxed resize-y whitespace-pre-wrap break-words border-none",
            value ? "text-transparent" : "text-fg",
            "caret-accent placeholder:text-fg-subtle selection:bg-accent/20 selection:text-transparent",
            readOnly && "cursor-default"
          )}
        />
      </div>

      {/* Footer / Status */}
      {footer !== null && (
        <div
          className="w-full px-3.5 py-2 transition-colors select-none text-xs border-t border-hairline bg-surface-hover/30 text-fg-subtle"
        >
          {footer || (
            <div className="w-full flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-fg-subtle">
                Accessible Radix primitives and semantic tokens supported.
              </span>
              <span className="shrink-0 font-mono text-[11px] text-fg-muted">
                {value ? value.split("\n").length : 0} {value && value.split("\n").length === 1 ? "line" : "lines"} · {value ? value.length : 0} chars
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

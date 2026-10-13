"use client";
import * as React from "react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ACCENT_PRESETS,
  GRAY_PRESETS,
  RADIUS_PRESETS,
  SCALING_PRESETS,
  DISPLAY_FONTS,
  BODY_FONTS,
  THEME_PRESETS,
  applyAccentColor,
  applyGrayColor,
  applyRadiusPreset,
  applyScalingPreset,
  applyPanelBackground,
  applyDisplayFontPreset,
  applyBodyFontPreset,
  applySubheadingFont,
  applyThemePreset,
  loadGoogleFont,
  preloadGoogleFontsBundle,
  tripletToHex,
} from "../../lib/theme-presets";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Popover, PopoverTrigger, PopoverContent } from "../Popover";
import { Select } from "../Select";
import { Switch } from "../Switch";
import { Row } from "../Row";
import { cn } from "../../lib/cn";
import { SHAVIN_META } from "../../lib/meta";

export interface ShavinDevToolsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional custom trigger class name. */
  className?: string;
  /** Default floating trigger placement on screen. Defaults to "bottom-right" (20px token offset). */
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  /** If true, forces ShavinDevTools to render even in production. By default, it is omitted in production (NODE_ENV === 'production'). */
  forceShow?: boolean;
}

type Corner = "bottom-left" | "bottom-right" | "top-left" | "top-right";

const CORNER_STYLES: Record<Corner, React.CSSProperties> = {
  "bottom-left": { bottom: "20px", left: "20px" },
  "bottom-right": { bottom: "20px", right: "20px" },
  "top-left": { top: "20px", left: "20px" },
  "top-right": { top: "20px", right: "20px" },
};

// ds-lint-disable-next-line no-hex — fallback color constant
const DEFAULT_FALLBACK_HEX = "#000000";

// Detect browser brand name (Arc, Brave, Chrome, Safari, Edge, Firefox)
function detectBrowserName(): string {
  if (typeof window === "undefined") return "Chrome";
  const ua = navigator.userAgent;

  // 1. Brave browser detection
  if (Boolean((navigator as any).brave)) {
    return "Brave";
  }

  // 2. Arc browser detection
  // Arc sets CSS custom properties --arc-palette-title / --arc-palette-hover on <html>
  // and in navigator.userAgentData.brands, Arc reports ['Not?A_Brand', 'Chromium'] WITHOUT 'Google Chrome'
  const brands = (navigator as any).userAgentData?.brands as Array<{ brand: string }> | undefined;
  let isChromiumGeneric = false;
  if (brands && Array.isArray(brands)) {
    const brandNames = brands.map((b) => b.brand.toLowerCase());
    if (brandNames.some((b) => b.includes("brave"))) return "Brave";
    if (brandNames.some((b) => b.includes("edge") || b.includes("edg"))) return "Edge";
    const hasChromium = brandNames.some((b) => b.includes("chromium"));
    const hasGoogle = brandNames.some((b) => b.includes("chrome") || b.includes("google"));
    if (hasChromium && !hasGoogle) {
      isChromiumGeneric = true;
    }
  }

  if (
    Boolean((window as any).arc) ||
    isChromiumGeneric ||
    (typeof document !== "undefined" && (
      document.documentElement.getAttribute("data-arc") !== null ||
      Boolean(document.querySelector("style#arc-injected-styles")) ||
      getComputedStyle(document.documentElement).getPropertyValue("--arc-palette-title") !== "" ||
      getComputedStyle(document.documentElement).getPropertyValue("--arc-palette-hover") !== ""
    ))
  ) {
    return "Arc";
  }

  if (brands && Array.isArray(brands)) {
    if (brands.some((b) => b.brand.toLowerCase().includes("chrome") || b.brand.toLowerCase().includes("google"))) return "Chrome";
  }

  // 3. Standard User Agent checks
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome/") && !ua.includes("Chromium/")) return "Safari";
  if (ua.includes("Chrome/") || ua.includes("Chromium/")) return "Chrome";

  return "Chrome";
}

// WCAG Contrast Ratio Calculator
function calculateContrast(fgHex: string, isDark: boolean): { ratio: number; level: "AAA" | "AA" | "Fail"; label: string } {
  const getLum = (hex: string) => {
    let clean = (hex || DEFAULT_FALLBACK_HEX).replace("#", "");
    if (clean.length === 3) clean = clean.split("").map((c) => c + c).join("");
    if (clean.length !== 6) return 0.5;
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };

  try {
    let l1 = getLum(fgHex);
    // Achromatic Inversion Rule (Radix / Apple / Vercel spec):
    // In dark mode, pure black/charcoal inverts to white (lum 1.0)
    if (isDark && l1 < 0.12) {
      l1 = 1.0;
    } else if (!isDark && l1 > 0.85) {
      l1 = 0.0;
    }

    // Background luminance: dark mode surface ~#18181b (lum 0.015), light mode surface ~#ffffff (lum 1.0)
    const l2 = isDark ? 0.015 : 1.0;
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    const ratio = Math.round(((lighter + 0.05) / (darker + 0.05)) * 10) / 10;
    if (ratio >= 7.0) return { ratio, level: "AAA", label: `${ratio}:1 (AAA Pass)` };
    if (ratio >= 4.5) return { ratio, level: "AA", label: `${ratio}:1 (AA Pass)` };
    return { ratio, level: "Fail", label: `${ratio}:1 (Fail < 4.5)` };
  } catch {
    return { ratio: 7.1, level: "AAA", label: "7.1:1 (AAA Pass)" };
  }
}

interface AuditIssue {
  id: string;
  category: "Token Purity" | "Semantic Tokens" | "Concentric Radius" | "Surface Elevation" | "Typography Scale";
  severity: "error" | "warning";
  selector: string;
  detail: string;
  domNode?: HTMLElement;
}

interface SourceWarning {
  type: "raw-element" | "deep-import" | "missing-cva" | "missing-cn";
  file: string;
  element?: string;
  primitive?: string;
  count?: number;
  message: string;
  reason?: string;
}

export interface BridgeStreamEvent {
  id: string;
  timestamp: string;
  type: string;
  direction: "in" | "out";
  summary: string;
  data?: Record<string, unknown> | null;
}

const MCP_TOOL_INFO = [
  { name: "get_live_audit", desc: "Stream live DOM audit issues directly from active browser tab", cmd: "npx @shavin/mcp get_live_audit" },
  { name: "trigger_live_rescan", desc: "Signal active browser tabs to run an immediate DOM audit", cmd: "npx @shavin/mcp trigger_live_rescan" },
  { name: "wait_for_live_clean", desc: "Wait for HMR & DOM re-eval to reach 0 violations", cmd: "npx @shavin/mcp wait_for_live_clean" },
  { name: "get_tokens", desc: "Retrieve active color scale, typography & radius tokens", cmd: "npx @shavin/mcp get_tokens" },
  { name: "get_components", desc: `Inspect ${SHAVIN_META.primitiveCount} primitives with props and variants`, cmd: "npx @shavin/mcp get_components" },
  { name: "validate_code", desc: "Scan JSX code for token purity & radius rules", cmd: "npx @shavin/mcp validate_code" },
  { name: "autofix_code", desc: "Automatically fix token violations in JSX", cmd: "npx @shavin/mcp autofix_code" },
  { name: "synthesize_layout", desc: "AI layout compositor & section builder", cmd: "npx @shavin/mcp synthesize_layout" },
  { name: "get_guidelines", desc: "Query design guidelines & component patterns", cmd: "npx @shavin/mcp get_guidelines" },
  { name: "get_builder_schema", desc: "AST schema for visual canvas and studio", cmd: "npx @shavin/mcp get_builder_schema" },
  { name: "get_block_template", desc: "Fetch ready-to-use block templates & patterns", cmd: "npx @shavin/mcp get_block_template" },
  { name: "get_project_context", desc: "Extract project fonts, theme, and configuration", cmd: "npx @shavin/mcp get_project_context" },
  { name: "get_setup_instructions", desc: "Step-by-step setup for Next.js, Vite, and Remix", cmd: "npx @shavin/mcp get_setup_instructions" },
  { name: "inspect_environment", desc: "Audit Tailwind setup and CSS variable mappings", cmd: "npx @shavin/mcp inspect_environment" },
  { name: "install_skills", desc: `Install ${SHAVIN_META.skillCount} agent skills into .agents/skills`, cmd: "npx @shavin/mcp install_skills" },
  { name: "list_skills", desc: "List all loaded agent skills and prompt tokens", cmd: "npx @shavin/mcp list_skills" },
  { name: "get_skill", desc: "Retrieve full skill prompt instructions", cmd: "npx @shavin/mcp get_skill" },
  { name: "get_skill_mode", desc: "Toggle between design system persona modes", cmd: "npx @shavin/mcp get_skill_mode" },
  { name: "shavin_steer", desc: "Active design system steering protocol for LLMs", cmd: "npx @shavin/mcp shavin_steer" },
] as const;

export function ShavinDevTools({ forceShow = false, ...props }: ShavinDevToolsProps): React.JSX.Element | null {
  // Omit the dev inspector from production builds unless explicitly forced.
  // The check lives in this wrapper so the panel's hooks always run in the same order.
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production" && !forceShow) {
    return null;
  }
  return <DevToolsPanel {...props} />;
}

function DevToolsPanel({
  className,
  position = "bottom-right",
  ...props
}: Omit<ShavinDevToolsProps, "forceShow">): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"theme" | "audit" | "bridge" | "mcp">("theme");
  const [copied, setCopied] = useState(false);

  // Corner Snapping and Dragging State
  const [corner, setCorner] = useState<Corner>(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const pointerDownRef = useRef<{ startX: number; startY: number; pointerId: number; hasDragged: boolean } | null>(null);
  const justDraggedRef = useRef<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Draggable Popover Window State
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const popoverDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number; pointerId: number } | null>(null);
  const [isPopoverDragging, setIsPopoverDragging] = useState(false);

  // Live Theme State
  const [themeName, setThemeName] = useState<string>("Monochrome");
  const [dark, setDark] = useState<boolean>(false);
  // ds-lint-disable-next-line no-hex — initial devtools fallback color
  const [accentHex, setAccentHex] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("shavin-accent");
        if (saved && saved.startsWith("#")) return saved;
      } catch {}
    }
    // ds-lint-disable-next-line no-hex — initial devtools fallback color
    return "#3b82f6";
  });
  const [accentName, setAccentName] = useState<string>("Blue");
  const [grayName, setGrayName] = useState<string>("Zinc");
  const [radiusName, setRadiusName] = useState<string>("medium");
  const [scaling, setScaling] = useState<number>(100);
  const [translucent, setTranslucent] = useState<boolean>(false);
  const [displayFont, setDisplayFont] = useState<string>("Space Grotesk");
  const [bodyFont, setBodyFont] = useState<string>("Inter");
  const [subheadingFont, setSubheadingFont] = useState<"body" | "display">("body");
  const initialSubheadingRef = useRef<"body" | "display">("body");

  // Initial Project Configuration Reference (for Reset button)
  const initialProjectConfigRef = useRef<{
    themeName: string;
    accentHex: string;
    accentName: string;
    grayName: string;
    radiusName: string;
    scaling: number;
    translucent: boolean;
    displayFont: string;
    bodyFont: string;
  } | null>(null);

  // Detected Custom Project Fonts
  const [detectedHeadingFont, setDetectedHeadingFont] = useState<string | null>(null);
  const [detectedBodyFont, setDetectedBodyFont] = useState<string | null>(null);

  const [auditIssues, setAuditIssues] = useState<AuditIssue[]>([]);
  const [auditTimestamp, setAuditTimestamp] = useState<string | null>(null);
  const [highlightErrors, setHighlightErrors] = useState<boolean>(false);
  const [copiedTool, setCopiedTool] = useState<string | null>(null);
  const [copiedIssueId, setCopiedIssueId] = useState<string | null>(null);
  const [copiedAllIssues, setCopiedAllIssues] = useState<boolean>(false);
  const [bridgeConnected, setBridgeConnected] = useState<boolean>(false);
  const [streamEvents, setStreamEvents] = useState<BridgeStreamEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [streamHowItWorksOpen, setStreamHowItWorksOpen] = useState<boolean>(false);
  const [expandedToolName, setExpandedToolName] = useState<string | null>(null);
  const [triggeringRescan, setTriggeringRescan] = useState<boolean>(false);
  const [showSourceWarnings, setShowSourceWarnings] = useState<boolean>(false);
  const [sourceWarnings, setSourceWarnings] = useState<SourceWarning[]>([]);
  const [sourceAuditLoading, setSourceAuditLoading] = useState<boolean>(false);
  const [sourceAuditTimestamp, setSourceAuditTimestamp] = useState<string | null>(null);
  const [sourceAuditError, setSourceAuditError] = useState<string | null>(null);
  const mutationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bridgeSyncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAuditSigRef = useRef<string>("");

  useEffect(() => {
    setMounted(true);
    preloadGoogleFontsBundle();
    loadGoogleFont("Space Grotesk");
    loadGoogleFont("Inter");

    let initialHeading = "Space Grotesk";
    let initialBody = "Inter";
    // ds-lint-disable-next-line no-hex — initial devtools fallback color
    let initialAccentHex = "#3b82f6";
    let initialAccentName = "Blue";

    // Auto-detect project custom fonts from computed document styles
    if (typeof document !== "undefined") {
      try {
        const computed = getComputedStyle(document.documentElement);
        const rawDisplay = computed.getPropertyValue("--font-display").trim().replace(/['"]/g, "");
        const primaryDisplay = rawDisplay ? rawDisplay.split(",")[0].trim() : "";
        if (primaryDisplay && !DISPLAY_FONTS.some((f) => f.name.toLowerCase() === primaryDisplay.toLowerCase())) {
          setDetectedHeadingFont(primaryDisplay);
          setDisplayFont(primaryDisplay);
          initialHeading = primaryDisplay;
        }

        const rawBody = computed.getPropertyValue("--font-body").trim().replace(/['"]/g, "");
        const primaryBody = rawBody ? rawBody.split(",")[0].trim() : "";
        if (primaryBody && !BODY_FONTS.some((f) => f.name.toLowerCase() === primaryBody.toLowerCase())) {
          setDetectedBodyFont(primaryBody);
          setBodyFont(primaryBody);
          initialBody = primaryBody;
        }

        const rawAccent = computed.getPropertyValue("--accent").trim();
        if (rawAccent) {
          const detectedHex = rawAccent.includes(" ") ? tripletToHex(rawAccent) : rawAccent.startsWith("#") ? rawAccent : null;
          if (detectedHex) {
            initialAccentHex = detectedHex;
            const matched = ACCENT_PRESETS.find((p) => p.hex.toLowerCase() === detectedHex.toLowerCase());
            if (matched) initialAccentName = matched.name;
            setAccentHex(detectedHex);
            setAccentName(initialAccentName);
          }
        }
      } catch {
        // Ignore style reading errors
      }
    }

    if (!initialProjectConfigRef.current) {
      initialProjectConfigRef.current = {
        themeName: "Monochrome",
        // ds-lint-disable-next-line no-hex — initial devtools fallback color
        accentHex: initialAccentHex,
        accentName: initialAccentName,
        grayName: "Zinc",
        radiusName: "medium",
        scaling: 100,
        translucent: false,
        displayFont: initialHeading,
        bodyFont: initialBody,
      };
    }
  }, []);

  // Load saved corner on mount (prioritize active session)
  useEffect(() => {
    try {
      const saved = (sessionStorage.getItem("shavin-inspector-corner") || localStorage.getItem("shavin-inspector-corner")) as Corner | null;
      if (saved && CORNER_STYLES[saved]) {
        setCorner(saved);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Sync initial dark mode state
  useEffect(() => {
    if (typeof document !== "undefined") {
      setDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  // Helper to record real-time bridge stream events
  const addStreamEvent = useCallback((evt: Omit<BridgeStreamEvent, "id" | "timestamp">) => {
    const newEvt: BridgeStreamEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      ...evt,
    };
    setStreamEvents((prev) => [newEvt, ...prev].slice(0, 60));
  }, []);

  // Helper to check if node belongs to inspector or floating menu
  const isExcludedNode = (node: Element): boolean => {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return true;
    const html = node as HTMLElement;
    if (html.closest(".shavin-dev-tools-root")) return true;
    if (html.closest("[data-radix-popper-content-wrapper]")) return true;
    if (html.closest("#shavin-audit-focus-beacon") || html.id === "shavin-audit-focus-beacon") return true;
    if (html.getAttribute("aria-hidden") === "true") return true;
    return false;
  };

  // Helper to identify legitimate color preview swatches inside dev tools and configurators
  const isSwatchElement = (el: HTMLElement): boolean => {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (el.tagName === "INPUT") return true;
    if (el.closest(".shavin-dev-tools-root")) return true;
    if (el.getAttribute("data-swatch") === "true" || el.closest("[data-swatch='true']") || el.closest("[data-swatch]")) return true;
    // Media overlay layers (bgOverlay/bgOverlays block props) are intentional
    // theme-independent scrims over imagery — same exemption status as swatches.
    if (el.getAttribute("data-overlay") === "true" || el.closest("[data-overlay='true']") || el.closest("[data-overlay]")) return true;
    // Gradient/atmosphere surfaces are palette DEFINITION, not token misuse —
    // same source-of-truth status as theme-presets (hex lives there by design).
    // Decorative hero/section gradients keep absolute hsla()/rgb() values on
    // purpose; token-purifying them to solid colors would destroy the effect.
    if (el.getAttribute("data-gradient") === "true" || el.closest("[data-gradient='true']") || el.closest("[data-gradient]")) return true;
    // Scoped theme remaps (e.g. a demo panel that mirrors the .dark token
    // mapping so a preview re-themes independently) legitimately reference
    // foundation --n-* vars — they ARE a theme definition surface.
    if (el.getAttribute("data-scope-theme") === "true" || el.closest("[data-scope-theme='true']") || el.closest("[data-scope-theme]")) return true;
    if (el.closest("[data-color-picker]") || el.closest("[data-configurator]") || el.closest("#shavin-configurator") || el.closest(".shavin-configurator")) return true;

    // Check self or enclosing interactive parent (button, label, option, tab)
    const btn = el.closest("button, label, [role='option'], [role='tab'], [role='button']");
    const aria = (el.getAttribute("aria-label") || btn?.getAttribute("aria-label") || "").toLowerCase();
    const title = (el.getAttribute("title") || btn?.getAttribute("title") || "").toLowerCase();

    if (
      aria.includes("color") || aria.includes("accent") || aria.includes("gray") ||
      aria.includes("swatch") || aria.includes("theme") || aria.startsWith("select ") ||
      title.includes("color") || title.includes("accent") || title.includes("gray") ||
      title.includes("swatch") || title.includes("theme") || title.startsWith("select ")
    ) {
      return true;
    }

    if (el.closest(".color-picker, .theme-picker, .palette-picker, [data-palette], [data-scale-grid], [data-color-doc], [data-color-demo], [data-swatches]")) return true;

    return false;
  };

  // Helper to resolve human-readable, token-dense component hierarchy for agents
  const getComponentContext = (el: HTMLElement): string => {
    // 1. Direct component marker
    const directComp = el.getAttribute("data-component") || el.getAttribute("data-slot");
    if (directComp) return directComp;

    // 2. Switch component detection (Radix or custom)
    const switchRoot = el.closest('[role="switch"]');
    if (switchRoot || el.getAttribute("role") === "switch") {
      if (el.tagName === "SPAN" || el.classList.contains("block")) {
        return "Switch > Thumb";
      }
      return "Switch";
    }

    // 3. Dialog / Modal / Popover / Tooltip
    const dialogParent = el.closest('[role="dialog"]');
    if (dialogParent) {
      const heading = dialogParent.querySelector('h2, h3, [data-slot="title"]')?.textContent?.trim().slice(0, 15);
      return `Dialog${heading ? ` [${heading}...]` : ""} > ${el.tagName.toLowerCase()}`;
    }

    // 4. Button / Tab / Menu
    const btnParent = el.closest("button") || (el.tagName === "BUTTON" ? el : null);
    if (btnParent) {
      const btnText = btnParent.textContent?.trim().slice(0, 16);
      return `Button${btnText ? ` [${btnText}]` : ""}${el !== btnParent ? ` > ${el.tagName.toLowerCase()}` : ""}`;
    }

    const tabParent = el.closest('[role="tab"]');
    if (tabParent) {
      const tabText = tabParent.textContent?.trim().slice(0, 16);
      return `Tab${tabText ? ` [${tabText}]` : ""}`;
    }

    // 5. Parent data-component
    const compAncestor = el.parentElement?.closest("[data-component]");
    if (compAncestor) {
      const compName = compAncestor.getAttribute("data-component");
      return `${compName} > ${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}`;
    }

    // 6. Section or container context with text preview
    const sectionAncestor = el.closest("section[id], section, header, footer, nav, aside, main");
    const sectionTag = sectionAncestor
      ? sectionAncestor.id
        ? `#${sectionAncestor.id}`
        : sectionAncestor.tagName.toLowerCase()
      : "";

    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const directText = el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE
      ? el.textContent?.trim().slice(0, 18)
      : "";
    const textLabel = directText ? ` [${directText}]` : "";

    if (sectionTag) {
      return `${sectionTag} > ${tag}${id}${textLabel}`;
    }

    return `${tag}${id}${textLabel}`;
  };

  // Full 7-category live DOM scanner
  const runLiveAudit = useCallback(() => {
    if (typeof document === "undefined") return;
    const issues: AuditIssue[] = [];

    // Tailwind palette colour names (standard palette)
    const TW_COLORS = [
      "slate","gray","zinc","neutral","stone",
      "red","orange","amber","yellow","lime",
      "green","emerald","teal","cyan","sky",
      "blue","indigo","violet","purple","fuchsia","pink","rose",
    ];
    const TW_COLOR_PREFIXES = ["bg-","text-","border-","ring-","fill-","stroke-","from-","to-","via-"];
    // Regex: matches e.g. bg-red-500, text-blue-500, text-sky-400, text-black, text-white, bg-black, bg-white
    const twPaletteRe = new RegExp(
      `(?:^|\\s)((?:${TW_COLOR_PREFIXES.join("|")})(?:${TW_COLORS.join("|")})(?:-\\d{2,4})?|(?:bg|text|border)-(?:white|black))(?:\\s|$)`,
      "g"
    );
    // Arbitrary tailwind color values e.g. text-[arbitrary-color], bg-[arbitrary-rgb]
    const arbitraryColorRe = /(?:^|\s)((?:bg|text|border|ring)-\[(?:#[0-9a-fA-F]{3,8}|rgba?\(.+?\)|hsla?\(.+?\)|[a-zA-Z]+)\])(?:\s|$)/g;
    // Matches rounded-[Npx] arbitrary values
    const arbitraryRadiusRe = /rounded-\[\d+(?:\.\d+)?px\]/;
    // Non-DS shadow classes
    const RAW_SHADOWS = ["shadow-sm","shadow","shadow-md","shadow-lg","shadow-xl","shadow-2xl"];
    // Raw --n-* CSS var in style attr
    const nVarRe = /var\(--n-/;
    // Hardcoded font-size px in style attr
    const fontSizeRe = /font-size\s*:\s*\d+(\.\d+)?px/i;

    const allElements = document.body.querySelectorAll("*");

    allElements.forEach((el, idx) => {
      if (isExcludedNode(el)) return;
      const htmlEl = el as HTMLElement;
      const selector = getComponentContext(htmlEl);
      const classStr = typeof htmlEl.className === "string" ? htmlEl.className : "";
      const styleAttr = htmlEl.getAttribute("style") || "";
      const isSwatch = isSwatchElement(htmlEl);

      // ── 1. Token Purity — Inline Color / Background / Border / Fill ──
      // Checks element.style properties directly (catches DevTools style edits, hex, rgb, hsl, named colors: blue, red, etc.)
      const inlineColor = htmlEl.style?.color?.trim();
      if (inlineColor && !inlineColor.includes("var(") && !["inherit", "currentcolor", "transparent", "initial", "unset", ""].includes(inlineColor.toLowerCase())) {
        issues.push({
          id: `color-${idx}`,
          category: "Token Purity",
          severity: "error",
          selector,
          detail: `Hardcoded text color "${inlineColor}" in inline style — use semantic token (e.g. text-fg, text-fg-subtle, text-accent)`,
          domNode: htmlEl,
        });
      }

      const inlineBg = htmlEl.style?.backgroundColor?.trim() || htmlEl.style?.background?.trim();
      if (!isSwatch && inlineBg && !inlineBg.includes("var(") && !["inherit", "currentcolor", "transparent", "initial", "unset", "none", ""].includes(inlineBg.toLowerCase())) {
        issues.push({
          id: `bg-${idx}`,
          category: "Token Purity",
          severity: "error",
          selector,
          detail: `Hardcoded background "${inlineBg}" in inline style — use semantic token (e.g. bg-surface, bg-canvas)`,
          domNode: htmlEl,
        });
      }

      const inlineBorder = htmlEl.style?.borderColor?.trim();
      if (inlineBorder && !inlineBorder.includes("var(") && !["inherit", "currentcolor", "transparent", "initial", "unset", ""].includes(inlineBorder.toLowerCase())) {
        issues.push({
          id: `border-${idx}`,
          category: "Token Purity",
          severity: "error",
          selector,
          detail: `Hardcoded border color "${inlineBorder}" in inline style — use border-hairline or border-hairline-strong`,
          domNode: htmlEl,
        });
      }

      // ── 2. Token Purity — Raw --n-* variable in style ────────────────
      if (!isSwatch && styleAttr) {
        // Only flag if --n-* is used directly as a value for regular CSS properties (e.g. color: var(--n-900), background: var(--n-100)).
        // Scoped theme variable definitions (e.g. --bg-surface: var(--n-900)) on theme definition surfaces are legitimate.
        const nonCustomPropertyWithNVar = /(?:^|;)\s*(?!--)[a-zA-Z-]+:\s*[^;]*var\(--n-/;
        if (nonCustomPropertyWithNVar.test(styleAttr)) {
          issues.push({
            id: `nvar-${idx}`,
            category: "Token Purity",
            severity: "error",
            selector,
            detail: `Foundation --n-* variable in inline style — use semantic token (e.g. bg-surface, text-fg)`,
            domNode: htmlEl,
          });
        }
      }

      // ── 3. Semantic Tokens — raw Tailwind palette classes ────────────
      if (classStr) {
        twPaletteRe.lastIndex = 0;
        const paletteMatches: string[] = [];
        let m: RegExpExecArray | null;
        while ((m = twPaletteRe.exec(" " + classStr + " ")) !== null) {
          paletteMatches.push(m[1]);
        }
        if (paletteMatches.length > 0) {
          issues.push({
            id: `tw-${idx}`,
            category: "Semantic Tokens",
            severity: "warning",
            selector,
            detail: `Non-semantic Tailwind palette class${paletteMatches.length > 1 ? "es" : ""}: ${paletteMatches.slice(0, 3).join(", ")}${paletteMatches.length > 3 ? " …" : ""}`,
            domNode: htmlEl,
          });
        }

        // Check arbitrary color classes e.g. text-[arbitrary-color], bg-[rgb(var(--danger)/0.12)]
        arbitraryColorRe.lastIndex = 0;
        const arbMatches: string[] = [];
        const nVarArbMatches: string[] = [];
        let am: RegExpExecArray | null;
        while ((am = arbitraryColorRe.exec(" " + classStr + " ")) !== null) {
          const match = am[1];
          // Check if it references foundation token --n-* (forbidden)
          if (/var\(--n-/.test(match)) {
            nVarArbMatches.push(match);
            continue;
          }
          // Option B: Allow arbitrary utilities that wrap semantic CSS variables with alpha
          // e.g. bg-[rgb(var(--danger)/0.12)], text-[rgba(var(--accent)/0.8)], border-[rgb(var(--hairline)/0.5)]
          const hasSemanticVar = /var\(--(?!n-)[a-zA-Z0-9_-]+\)/.test(match);
          if (!hasSemanticVar) {
            arbMatches.push(match);
          }
        }
        if (nVarArbMatches.length > 0) {
          issues.push({
            id: `nvar-class-${idx}`,
            category: "Token Purity",
            severity: "error",
            selector,
            detail: `Foundation --n-* variable in utility class: ${nVarArbMatches.join(", ")} — use semantic token (e.g. bg-surface, text-fg)`,
            domNode: htmlEl,
          });
        }
        if (arbMatches.length > 0) {
          issues.push({
            id: `arb-color-${idx}`,
            category: "Token Purity",
            severity: "error",
            selector,
            detail: `Arbitrary color utility${arbMatches.length > 1 ? "es" : ""}: ${arbMatches.join(", ")} — use semantic token`,
            domNode: htmlEl,
          });
        }
      }

      // ── 4. Concentric Radius — rounded-[Npx] arbitrary ───────────────
      if (classStr && arbitraryRadiusRe.test(classStr)) {
        const match = classStr.match(arbitraryRadiusRe);
        issues.push({
          id: `rad-${idx}`,
          category: "Concentric Radius",
          severity: "error",
          selector,
          detail: `Arbitrary radius "${match ? match[0] : ""}" — use rounded-[var(--radius-panel)] or rounded-[var(--radius-lg)]`,
          domNode: htmlEl,
        });
      }

      // ── 5. Surface Elevation — non-DS shadow class ───────────────────
      if (classStr) {
        const badShadow = RAW_SHADOWS.find((s) => {
          const re = new RegExp(`(?:^|\\s)${s.replace("-","\\-")}(?:\\s|$)`);
          return re.test(classStr);
        });
        if (badShadow) {
          issues.push({
            id: `shadow-${idx}`,
            category: "Surface Elevation",
            severity: "warning",
            selector,
            detail: `Raw shadow "${badShadow}" — use shadow-card, shadow-modal, or data-panel attribute`,
            domNode: htmlEl,
          });
        }
      }

      // ── 6. Typography Scale — hardcoded font-size px in style ────────
      if (styleAttr && fontSizeRe.test(styleAttr)) {
        const match = styleAttr.match(fontSizeRe);
        issues.push({
          id: `fs-${idx}`,
          category: "Typography Scale",
          severity: "warning",
          selector,
          detail: `Hardcoded ${match ? match[0].replace(/\s/g, "") : "font-size:Npx"} — use Text size prop or typography token`,
          domNode: htmlEl,
        });
      }
    });

    // ── 7. CSSOM Stylesheet Rules — Custom .class and CSS Selector Rules ──
    try {
      const sheets = Array.from(document.styleSheets);
      sheets.forEach((sheet, sheetIdx) => {
        // Skip internal dev tools highlight styles or external icon/font sheets
        const ownerNode = sheet.ownerNode as HTMLElement | null;
        if (ownerNode?.id === "shavin-audit-highlight-styles" || ownerNode?.closest?.(".shavin-dev-tools-root")) return;

        let rules: CSSRuleList | null = null;
        try {
          rules = sheet.cssRules;
        } catch {
          // Cross-origin stylesheet access restricted
          return;
        }
        if (!rules) return;

        const href = sheet.href || "";
        if (href.includes("fonts.googleapis") || href.includes("lucide") || href.includes("phosphor") || href.includes("chrome-extension")) return;

        for (let rIdx = 0; rIdx < rules.length; rIdx++) {
          const rule = rules[rIdx];
          if (!(rule instanceof CSSStyleRule)) continue;

          const sel = rule.selectorText?.trim();
          if (!sel) continue;

          // Skip universal selectors, pseudo-elements, and global preflight resets (*, *, ::before, ::after, html, body, etc.)
          if (
            sel.includes("*") || sel.includes("::before") || sel.includes("::after") ||
            sel.startsWith("::") || sel === "html" || sel === "body" || sel === ":root" ||
            sel === ".dark" || sel === ".light" || sel === ":root, .light" || sel.startsWith("::backdrop")
          ) {
            continue;
          }

          // Skip internal DevTools, Radix popper, or highlight beacons
          if (sel.includes("shavin-") || sel.includes("[data-radix-") || sel.includes("nextjs") || sel.includes("__next")) continue;

          // Skip Tailwind generated utility classes (variants, arbitrary values, escaped classes)
          if (
            sel.includes("\\:") || sel.includes("\\[") || sel.includes("\\]") || sel.includes("\\/") ||
            /^\s*\.(?:ring|shadow|inset|outline|accent|caret|fill|stroke|rounded|bg|text|border|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|max|min|flex|grid|col|row|gap|space|items|justify|self|place|order|float|clear|box|display|table|caption|inline|block|hidden|visible|invisible|static|fixed|absolute|relative|sticky|top|bottom|left|right|z|overflow|overscroll|scroll|truncate|font|tracking|leading|list|align|whitespace|break|hyphens|content|transition|duration|ease|delay|animate|transform|scale|rotate|translate|skew|origin|opacity|blend|blur|brightness|contrast|drop|grayscale|hue|invert|saturate|sepia|filter|backdrop|cursor|select|resize|snap|touch|pointer|will)-/.test(sel) ||
            /^\s*\.(?:flex|grid|block|inline|hidden|relative|absolute|fixed|sticky|truncate|italic|underline|uppercase|lowercase|capitalize|antialiased)\b/.test(sel)
          ) {
            continue;
          }

          // Must be an author custom class or ID selector (e.g. .custom-box, .header-card, #my-panel)
          const isClassOrId = /(?:^|\s+)[.#][a-zA-Z0-9_-]+/.test(sel);
          if (!isClassOrId) continue;

          const style = rule.style;
          if (!style || !style.length) continue;

          const reportRuleViolation = (
            category: AuditIssue["category"],
            detail: string,
            severity: AuditIssue["severity"],
            baseId: string
          ) => {
            try {
              const matchedElements = document.querySelectorAll(sel);
              if (matchedElements.length > 0) {
                matchedElements.forEach((mEl, mIdx) => {
                  if (isExcludedNode(mEl) || isSwatchElement(mEl as HTMLElement)) return;
                  const compCtx = getComponentContext(mEl as HTMLElement);
                  issues.push({
                    id: `${baseId}-${mIdx}`,
                    category,
                    severity,
                    selector: `${compCtx} (via ${sel})`,
                    detail,
                    domNode: mEl as HTMLElement,
                  });
                });
              }
            } catch {
              // Ignore complex pseudo-selector queries
            }
          };

          // 7a. Check foundation --n-* variables in CSS rule
          const ruleCss = style.cssText || "";
          if (nVarRe.test(ruleCss)) {
            reportRuleViolation(
              "Token Purity",
              `CSS rule "${sel}" references foundation --n-* variable — use semantic token (e.g. var(--bg-surface), var(--fg))`,
              "error",
              `css-nvar-${sheetIdx}-${rIdx}`
            );
          }

          // 7b. Check hardcoded colors in CSS rule
          const col = style.getPropertyValue("color")?.trim();
          if (col && !col.includes("var(--") && !["inherit", "currentcolor", "transparent", "initial", "unset", ""].includes(col.toLowerCase())) {
            if (col.includes("#") || col.startsWith("rgb") || col.startsWith("hsl") || /^[a-zA-Z]+$/.test(col)) {
              reportRuleViolation(
                "Token Purity",
                `Hardcoded color "${col}" in CSS rule "${sel}" — use semantic token (e.g. var(--fg), var(--fg-subtle))`,
                "error",
                `css-col-${sheetIdx}-${rIdx}`
              );
            }
          }

          const bg = style.getPropertyValue("background-color")?.trim() || style.getPropertyValue("background")?.trim();
          if (bg && !bg.includes("var(--") && !["inherit", "currentcolor", "transparent", "initial", "unset", "none", ""].includes(bg.toLowerCase())) {
            if (bg.includes("#") || bg.startsWith("rgb") || bg.startsWith("hsl")) {
              reportRuleViolation(
                "Token Purity",
                `Hardcoded background "${bg}" in CSS rule "${sel}" — use semantic token (e.g. var(--bg-surface), var(--bg-canvas))`,
                "error",
                `css-bg-${sheetIdx}-${rIdx}`
              );
            }
          }

          // ds-lint-disable-next-line no-unknown-class — CSS property name, not class
          const borderCol = style.getPropertyValue("border-color")?.trim();
          if (borderCol && !borderCol.includes("var(--") && !["inherit", "currentcolor", "transparent", "initial", "unset", ""].includes(borderCol.toLowerCase())) {
            if (borderCol.includes("#") || borderCol.startsWith("rgb") || borderCol.startsWith("hsl")) {
              reportRuleViolation(
                "Token Purity",
                `Hardcoded border color "${borderCol}" in CSS rule "${sel}" — use var(--hairline) or var(--hairline-strong)`,
                "error",
                `css-bdr-${sheetIdx}-${rIdx}`
              );
            }
          }

          // 7c. Check hardcoded border-radius in CSS rule
          // ds-lint-disable-next-line no-unknown-class — CSS property name, not class
          const radius = style.getPropertyValue("border-radius")?.trim();
          if (radius && !radius.includes("var(--radius-") && !["inherit", "initial", "unset", "0", "0px", "9999px", "999px", ""].includes(radius.toLowerCase())) {
            if (/\d+px/.test(radius)) {
              reportRuleViolation(
                "Concentric Radius",
                `Hardcoded radius "${radius}" in CSS rule "${sel}" — use var(--radius-panel) or var(--radius-lg)`,
                "error",
                `css-rad-${sheetIdx}-${rIdx}`
              );
            }
          }

          // 7d. Check hardcoded box-shadow in CSS rule
          const shadow = style.getPropertyValue("box-shadow")?.trim();
          if (shadow && !shadow.includes("var(--shadow-") && !["none", "inherit", "initial", "unset", ""].includes(shadow.toLowerCase())) {
            reportRuleViolation(
              "Surface Elevation",
              `Hardcoded box-shadow in CSS rule "${sel}" — use var(--shadow-card), var(--shadow-panel), or var(--shadow-modal)`,
              "warning",
              `css-shadow-${sheetIdx}-${rIdx}`
            );
          }
        }
      });
    } catch {
      // Quiet CSSOM scan failure
    }

    const newSig = issues.map((i) => `${i.id}:${i.category}:${i.detail}:${i.selector}`).join("|");
    if (newSig !== lastAuditSigRef.current) {
      lastAuditSigRef.current = newSig;
      setAuditIssues(issues);
      setAuditTimestamp(new Date().toLocaleTimeString());
    }

    // Broadcast audit snapshot to AI Agent Browser Bridge (debounced 300ms)
    if (typeof window !== "undefined") {
      if (bridgeSyncDebounceRef.current) clearTimeout(bridgeSyncDebounceRef.current);
      bridgeSyncDebounceRef.current = setTimeout(() => {
        try {
          const errCount = issues.filter((i) => i.severity === "error").length;
          const warnCount = issues.filter((i) => i.severity === "warning").length;
          const payload = {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            stats: {
              total: issues.length,
              errors: errCount,
              warnings: warnCount,
              clean: issues.length === 0,
            },
            issues: issues.map((iss) => {
              const el = iss.domNode;
              return {
                id: iss.id,
                category: iss.category,
                severity: iss.severity,
                selector: iss.selector,
                detail: iss.detail,
                classes: el && typeof el.className === "string" ? el.className : "",
                style: el?.getAttribute("style") || "",
              };
            }),
            project: typeof document !== "undefined" && document.title ? document.title.split("—")[0].trim() : "App",
            origin: typeof window !== "undefined" ? window.location.origin : "http://localhost:3100",
            pathname: typeof window !== "undefined" ? window.location.pathname : "/",
            tabId: typeof window !== "undefined"
              ? (sessionStorage.getItem("__shavin_tab_id") || (() => {
                  const id = `tab_${Math.random().toString(36).slice(2, 9)}`;
                  try { sessionStorage.setItem("__shavin_tab_id", id); } catch {}
                  return id;
                })())
              : "default",
            browser: detectBrowserName(),
            title: typeof document !== "undefined" ? document.title : "",
            theme: {
              dark: document.documentElement.classList.contains("dark"),
              accent: accentName,
              gray: grayName,
              radius: radiusName,
            },
          };

          fetch("http://127.0.0.1:7428/api/audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            mode: "cors",
          })
            .then((res) => {
              if (res.ok) {
                setBridgeConnected(true);
                addStreamEvent({
                  type: "audit_sync",
                  direction: "out",
                  summary: payload.stats.clean
                    ? "DOM audit clean — 0 design token violations"
                    : `Synced ${payload.stats.total} DOM issue${payload.stats.total !== 1 ? "s" : ""} (${payload.stats.errors} err, ${payload.stats.warnings} warn) to AI Bridge`,
                  data: payload,
                });
              }
            })
            .catch(() => {
              setBridgeConnected(false);
            });
        } catch {
          // Quiet bridge sync failure
        }
      }, 300);
    }
  }, [accentName, grayName, radiusName, addStreamEvent]);

  // Trigger manual rescan on bridge
  const handleTriggerRescan = useCallback(async () => {
    setTriggeringRescan(true);
    try {
      addStreamEvent({
        type: "rescan_trigger",
        direction: "out",
        summary: "Requested full DOM audit re-scan",
      });
      const res = await fetch("http://127.0.0.1:7428/api/rescan", {
        method: "POST",
        mode: "cors",
      });
      if (res.ok) {
        runLiveAudit();
      }
    } catch {
      // Quiet bridge error
    } finally {
      setTimeout(() => setTriggeringRescan(false), 400);
    }
  }, [addStreamEvent, runLiveAudit]);

  // Fetch source-level architecture warnings from the bridge /api/source-audit endpoint
  const fetchSourceWarnings = useCallback(async () => {
    setSourceAuditLoading(true);
    setSourceAuditError(null);
    try {
      // Derive the project root from the current origin's pathname
      // The bridge scans the directory it was launched from (process.cwd())
      const res = await fetch("http://127.0.0.1:7428/api/source-audit", {
        method: "GET",
        mode: "cors",
      });
      if (res.ok) {
        const data = await res.json();
        setSourceWarnings(data.issues || []);
        setSourceAuditTimestamp(new Date().toLocaleTimeString());
        addStreamEvent({
          type: "source_audit",
          direction: "in",
          summary: data.summary?.totalWarnings > 0
            ? `Source audit: ${data.summary.totalWarnings} warnings across ${data.summary.filesWithIssues}/${data.summary.filesScanned} files`
            : `Source audit clean — 0 architecture warnings`,
        });
      } else {
        setSourceAuditError("Bridge returned an error");
      }
    } catch {
      setSourceAuditError("Cannot reach AI Bridge (:7428). Start it with: npx @shavin/cli bridge");
    } finally {
      setSourceAuditLoading(false);
    }
  }, [addStreamEvent]);

  // Connect to Bridge SSE Event Stream for live trigger signals from AI agent
  useEffect(() => {
    if (!mounted || typeof window === "undefined" || typeof EventSource === "undefined") return;

    let es: EventSource | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    try {
      const myTabId = sessionStorage.getItem("__shavin_tab_id") || (() => {
        const id = `tab_${Math.random().toString(36).slice(2, 9)}`;
        try { sessionStorage.setItem("__shavin_tab_id", id); } catch {}
        return id;
      })();
      const myBrowser = detectBrowserName();

      es = new EventSource(`http://127.0.0.1:7428/api/events?tabId=${encodeURIComponent(myTabId)}&browser=${encodeURIComponent(myBrowser)}`);
      es.onopen = () => {
        setBridgeConnected(true);
        addStreamEvent({
          type: "sse_connected",
          direction: "in",
          summary: `Connected to local AI Bridge (:7428) as [${myBrowser}] tab ${myTabId}`,
        });
      };
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addStreamEvent({
            type: data?.type || "sse_message",
            direction: "in",
            summary: data?.type === "request_rescan"
              ? "AI Agent requested fresh page inspection"
              : data?.type === "connected"
              ? `Bridge handshake established (${data?.snapshot?.connectedTabs || 1} tab${(data?.snapshot?.connectedTabs || 1) !== 1 ? "s" : ""} active)`
              : data?.type === "audit_update"
              ? "Live DOM state updated from browser scan"
              : `Event received: ${data?.type || "update"}`,
            data,
          });
          if (data?.type === "focus_tab") {
            const curTabId = sessionStorage.getItem("__shavin_tab_id");
            if (!data.targetTabId || data.targetTabId === curTabId) {
              window.focus();
            }
          }
          if (data?.type === "request_rescan") {
            const curTabId = sessionStorage.getItem("__shavin_tab_id");
            const myPath = window.location.pathname;
            if (data.targetTabId && data.targetTabId !== curTabId) return;
            if (data.targetPath && data.targetPath !== myPath && data.targetPath.replace(/\/$/, "") !== myPath.replace(/\/$/, "")) return;
            runLiveAudit();
          }
        } catch {
          // Ignore parse errors
        }
      };
      es.onerror = () => {
        setBridgeConnected(false);
      };

      // Periodic heartbeat ping every 15s to keep connection alive and update tab state
      heartbeat = setInterval(() => {
        try {
          fetch("http://127.0.0.1:7428/api/ping", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tabId: myTabId,
              browser: myBrowser,
              url: window.location.href,
              pathname: window.location.pathname,
              title: document.title,
            }),
            mode: "cors",
          }).catch(() => {});
        } catch {}
      }, 15000);
    } catch {
      // Ignore EventSource errors
    }

    return () => {
      if (heartbeat) clearInterval(heartbeat);
      if (es) es.close();
    };
  }, [mounted, addStreamEvent, runLiveAudit]);

  // Tab Lifecycle Cleanup: Disconnect beacon on tab close
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleTabUnload = () => {
      try {
        const tabId = sessionStorage.getItem("__shavin_tab_id");
        if (tabId && navigator.sendBeacon) {
          navigator.sendBeacon(
            "http://127.0.0.1:7428/api/disconnect",
            new Blob([JSON.stringify({ tabId })], { type: "application/json" })
          );
        }
      } catch {}
    };
    window.addEventListener("pagehide", handleTabUnload);
    window.addEventListener("beforeunload", handleTabUnload);
    return () => {
      window.removeEventListener("pagehide", handleTabUnload);
      window.removeEventListener("beforeunload", handleTabUnload);
    };
  }, []);

  // Sync DevTools React state when theme is changed externally (e.g. docs page applyThemePreset)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleThemeChange = () => {
      try {
        const root = document.documentElement;
        const computed = getComputedStyle(root);
        // Appearance
        setDark(root.classList.contains("dark"));
        // Accent
        const rawAccent = computed.getPropertyValue("--accent").trim();
        if (rawAccent) {
          const detectedHex = rawAccent.includes(" ")
            ? tripletToHex(rawAccent)
            : rawAccent.startsWith("#")
              ? rawAccent
              : null;
          if (detectedHex) {
            setAccentHex(detectedHex);
            const matched = ACCENT_PRESETS.find(
              (p) => p.hex.toLowerCase() === detectedHex.toLowerCase(),
            );
            if (matched) setAccentName(matched.name);
          }
        }
        // Gray
        const savedGray = localStorage.getItem("shavin-gray");
        if (savedGray) setGrayName(savedGray);
        // Radius
        const savedRadius = localStorage.getItem("shavin-radius");
        if (savedRadius) setRadiusName(savedRadius);
        // Scaling
        const savedScaling = localStorage.getItem("shavin-scaling");
        if (savedScaling) setScaling(Number(savedScaling) || 100);
        // Panel background
        setTranslucent(root.classList.contains("translucent-panels"));
        // Fonts
        const savedDisplayFont = localStorage.getItem("shavin-display-font");
        if (savedDisplayFont) setDisplayFont(savedDisplayFont);
        const savedBodyFont = localStorage.getItem("shavin-body-font");
        if (savedBodyFont) setBodyFont(savedBodyFont);
        // Theme name — try to match against presets
        const savedAccentHex = localStorage.getItem("shavin-accent");
        const savedPanel = localStorage.getItem("shavin-panel");
        const isDarkMode = root.classList.contains("dark");
        const matchedPreset = THEME_PRESETS.find((p) => {
          const pHex =
            ACCENT_PRESETS.find(
              (a) => a.name.toLowerCase() === p.accentColor.toLowerCase(),
            )?.hex ?? DEFAULT_FALLBACK_HEX;
          return (
            pHex.toLowerCase() === (savedAccentHex || "").toLowerCase() &&
            (p.grayColor || "").toLowerCase() === (savedGray || "").toLowerCase() &&
            (p.radius || "").toLowerCase() === (savedRadius || "").toLowerCase() &&
            (p.scaling || 100) === (Number(savedScaling) || 100) &&
            (p.panelBackground || "solid") === (savedPanel === "translucent" ? "translucent" : "solid") &&
            (p.displayFont || "Inter").toLowerCase() === (savedDisplayFont || "").toLowerCase() &&
            (p.bodyFont || "Inter").toLowerCase() === (savedBodyFont || "").toLowerCase() &&
            p.appearance === (isDarkMode ? "dark" : "light")
          );
        });
        setThemeName(matchedPreset ? matchedPreset.name : "Custom");
      } catch {
        // Ignore
      }
    };
    window.addEventListener("shavin-theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("shavin-theme-change", handleThemeChange);
    };
  }, []);

  // Start from the theme the app's ThemeProvider was given. Without this the inspector shows its own
  // defaults (Monochrome, Zinc, 100%, Space Grotesk) until something is changed by hand.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const canon = <T extends { name: string }>(list: readonly T[], v?: string) =>
      v ? list.find((x) => x.name.toLowerCase() === v.toLowerCase())?.name : undefined;
    const applyInit = (cfg: {
      theme?: string; accent?: string; gray?: string; radius?: string; scaling?: number;
      translucentPanels: boolean; displayFont?: string; bodyFont?: string; subheadingFont?: string;
    }) => {
      try {
        const gray = canon(GRAY_PRESETS, cfg.gray) ?? "Zinc";
        const radius = (cfg.radius ?? "medium").toLowerCase();
        const scaling = cfg.scaling ?? 100;
        // No font configured on the provider: report the font the page actually renders, not the inspector's own default.
        const rendered = (el: Element | null) => {
          if (!el) return undefined;
          const first = getComputedStyle(el).fontFamily.split(",")[0]?.trim().replace(/['"]/g, "");
          // next/font mangles names ("__Inter_a1b2c3", "__Inter_Fallback_a1b2c3"); recover the family.
          const name = first?.replace(/^__/, "").replace(/_Fallback/, "").replace(/_[a-f0-9]{6,}$/i, "").replace(/_/g, " ");
          return name || undefined;
        };
        const heading = canon(DISPLAY_FONTS, cfg.displayFont) ?? cfg.displayFont
          ?? canon(DISPLAY_FONTS, rendered(document.querySelector("h1, h2"))) ?? rendered(document.querySelector("h1, h2")) ?? "Space Grotesk";
        const body = canon(BODY_FONTS, cfg.bodyFont) ?? cfg.bodyFont
          ?? canon(BODY_FONTS, rendered(document.body)) ?? rendered(document.body) ?? "Inter";
        const accentPreset = cfg.accent
          ? ACCENT_PRESETS.find((a) => a.name.toLowerCase() === cfg.accent!.toLowerCase())
          : undefined;
        const accentHex = accentPreset?.hex ?? (cfg.accent && cfg.accent.startsWith("#") ? cfg.accent : null);
        localStorage.setItem("shavin-gray", gray);
        localStorage.setItem("shavin-radius", radius);
        localStorage.setItem("shavin-scaling", String(scaling));
        localStorage.setItem("shavin-panel", cfg.translucentPanels ? "translucent" : "solid");
        localStorage.setItem("shavin-display-font", heading);
        localStorage.setItem("shavin-body-font", body);
        if (accentHex) localStorage.setItem("shavin-accent", accentHex);
        if (!DISPLAY_FONTS.some((f) => f.name.toLowerCase() === heading.toLowerCase())) setDetectedHeadingFont(heading);
        if (!BODY_FONTS.some((f) => f.name.toLowerCase() === body.toLowerCase())) setDetectedBodyFont(body);
        initialProjectConfigRef.current = {
          themeName: canon(THEME_PRESETS, cfg.theme) ?? "Custom",
          accentHex: accentHex ?? initialProjectConfigRef.current?.accentHex ?? DEFAULT_FALLBACK_HEX,
          accentName: accentPreset?.name ?? initialProjectConfigRef.current?.accentName ?? "Custom",
          grayName: gray,
          radiusName: radius,
          scaling,
          translucent: cfg.translucentPanels,
          displayFont: heading,
          bodyFont: body,
        };
        {
          const sub = cfg.subheadingFont?.toLowerCase() === "display" ? "display" : "body";
          initialSubheadingRef.current = sub;
          setSubheadingFont(sub);
        }
        // Let the regular handler read the DOM + storage and settle every control, including the theme name.
        window.dispatchEvent(new CustomEvent("shavin-theme-change"));
      } catch {
        // Ignore
      }
    };
    const onInit = (e: Event) => applyInit((e as CustomEvent).detail);
    window.addEventListener("shavin-theme-init", onInit);
    const existing = (window as unknown as { __SHAVIN_THEME_CONFIG__?: Parameters<typeof applyInit>[0] }).__SHAVIN_THEME_CONFIG__;
    if (existing) applyInit(existing);
    return () => window.removeEventListener("shavin-theme-init", onInit);
  }, []);

  // Initial scan on mount and when audit tab opens
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        runLiveAudit();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [mounted, runLiveAudit]);

  useEffect(() => {
    if (open && tab === "audit" && mounted) {
      setHighlightErrors(true);
      runLiveAudit();
    }
  }, [open, tab, mounted, runLiveAudit]);

  // Click on a violation to scroll into view and pulse highlight with guide beacon
  const focusViolation = (issue: AuditIssue) => {
    try {
      const el = issue.domNode || document.querySelector(issue.selector);
      if (!el || typeof document === "undefined") return;

      (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });

      // Remove any existing active beacon
      const existing = document.getElementById("shavin-audit-focus-beacon");
      if (existing) existing.remove();

      const rect = (el as HTMLElement).getBoundingClientRect();
      const beacon = document.createElement("div");
      beacon.id = "shavin-audit-focus-beacon";
      beacon.style.position = "fixed";
      beacon.style.top = `${rect.top}px`;
      beacon.style.left = `${rect.left}px`;
      beacon.style.width = `${rect.width}px`;
      beacon.style.height = `${rect.height}px`;
      beacon.style.pointerEvents = "none";
      beacon.style.zIndex = "999999";
      beacon.style.borderRadius = "var(--radius-panel, 8px)";
      beacon.style.border = "3px solid rgb(var(--danger))";
      // ds-lint-disable-next-line no-rgb — glow shadow overlay
      beacon.style.boxShadow = "0 0 0 4px rgba(239, 68, 68, 0.35), 0 0 24px rgba(239, 68, 68, 0.5)";
      beacon.style.transition = "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)";

      const badge = document.createElement("div");
      badge.textContent = `⚠️ Focus: ${issue.selector}`;
      badge.style.position = "absolute";
      badge.style.top = "-24px";
      badge.style.left = "0";
      badge.style.background = "rgb(var(--danger))";
      badge.style.color = "rgb(var(--danger-fg))";
      badge.style.fontFamily = "monospace";
      badge.style.fontSize = "11px";
      badge.style.fontWeight = "bold";
      badge.style.padding = "2px 6px";
      badge.style.borderRadius = "4px";
      badge.style.whiteSpace = "nowrap";
      // ds-lint-disable-next-line no-rgb — drop shadow
      badge.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      beacon.appendChild(badge);

      document.body.appendChild(beacon);

      const updateBeaconPos = () => {
        const updatedRect = (el as HTMLElement).getBoundingClientRect();
        beacon.style.top = `${updatedRect.top}px`;
        beacon.style.left = `${updatedRect.left}px`;
        beacon.style.width = `${updatedRect.width}px`;
        beacon.style.height = `${updatedRect.height}px`;
      };
      window.addEventListener("scroll", updateBeaconPos, { passive: true });
      window.addEventListener("resize", updateBeaconPos, { passive: true });

      (el as HTMLElement).animate(
        [
          { outline: "3px solid rgb(var(--danger, 239 68 68))", transform: "scale(1.02)" },
          { outline: "2px dashed rgb(var(--danger, 239 68 68))", transform: "scale(1)" },
        ],
        { duration: 400, iterations: 3 }
      );

      setTimeout(() => {
        window.removeEventListener("scroll", updateBeaconPos);
        window.removeEventListener("resize", updateBeaconPos);
        beacon.style.opacity = "0";
        setTimeout(() => beacon.remove(), 300);
      }, 3500);
    } catch {
      // Ignore query errors
    }
  };

  // Live DOM Visual Highlighter for Violations — uses custom attribute only (never modifies classList to prevent observer loops)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const styleId = "shavin-audit-highlight-style";
    let styleTag = document.getElementById(styleId);

    // Highlight violator elements by matching their domNode reference
    if (highlightErrors) {
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = styleId;
        styleTag.textContent = `
          [data-shavin-violator="true"] {
            outline: 2px dashed rgb(var(--danger)) !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 3px rgb(var(--danger) / 0.2) !important;
          }
        `;
        document.head.appendChild(styleTag);
      }

      // Remove attribute from elements that are no longer in issues
      document.querySelectorAll('[data-shavin-violator="true"]').forEach((el) => {
        if (!auditIssues.some((i) => i.domNode === el)) {
          el.removeAttribute("data-shavin-violator");
        }
      });

      auditIssues.forEach((issue) => {
        if (issue.domNode && !isExcludedNode(issue.domNode)) {
          if (issue.domNode.getAttribute("data-shavin-violator") !== "true") {
            issue.domNode.setAttribute("data-shavin-violator", "true");
          }
        }
      });
    } else {
      if (styleTag) styleTag.remove();
      document.querySelectorAll('[data-shavin-violator="true"]').forEach((el) => {
        el.removeAttribute("data-shavin-violator");
      });
    }

    return () => {
      const tag = document.getElementById(styleId);
      if (tag) tag.remove();
      document.querySelectorAll('[data-shavin-violator="true"]').forEach((el) => {
        el.removeAttribute("data-shavin-violator");
      });
    };
  }, [highlightErrors, auditIssues]);

  // MutationObserver — real-time auto-rescan on any DOM attribute/class/style/content change (debounced 250ms)
  useEffect(() => {
    if (typeof document === "undefined" || !mounted) return;
    const observer = new MutationObserver((mutations) => {
      // Ignore mutations originating strictly from devtools, highlighter attributes, or focus beacons
      const shouldIgnore = mutations.every((m) => {
        if (m.attributeName === "data-shavin-violator") return true;
        const target = m.target as HTMLElement;
        if (!target) return true;
        if (target.id === "shavin-audit-highlight-style" || target.id === "shavin-audit-focus-beacon") return true;
        if (target.closest?.("#shavin-audit-focus-beacon")) return true;
        if (target.closest?.(".shavin-dev-tools-root")) return true;
        if (target.closest?.("[data-radix-popper-content-wrapper]")) return true;
        return false;
      });
      if (shouldIgnore) return;

      if (mutationDebounceRef.current) clearTimeout(mutationDebounceRef.current);
      mutationDebounceRef.current = setTimeout(() => {
        runLiveAudit();
      }, 250);
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "id"],
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => {
      observer.disconnect();
      if (mutationDebounceRef.current) clearTimeout(mutationDebounceRef.current);
    };
  }, [mounted, runLiveAudit]);

  // Drag handlers with corner snapping — tracks cursor freely during drag, snaps ONLY on release
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (open) return;
    pointerDownRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      hasDragged: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pointerDownRef.current) return;
    const dx = Math.abs(e.clientX - pointerDownRef.current.startX);
    const dy = Math.abs(e.clientY - pointerDownRef.current.startY);

    if (!pointerDownRef.current.hasDragged && (dx > 4 || dy > 4)) {
      pointerDownRef.current.hasDragged = true;
      setIsDragging(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(pointerDownRef.current.pointerId);
      } catch {
        // Ignore
      }
    }

    if (pointerDownRef.current.hasDragged) {
      setDragOffset({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pointerDownRef.current) return;
    const { hasDragged, pointerId } = pointerDownRef.current;
    pointerDownRef.current = null;

    if (hasDragged) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(pointerId);
      } catch {
        // Ignore
      }
      setIsDragging(false);
      setDragOffset(null);
      justDraggedRef.current = true;
      setTimeout(() => {
        justDraggedRef.current = false;
      }, 150);

      const x = e.clientX;
      const y = e.clientY;
      const w = window.innerWidth;
      const h = window.innerHeight;

      const dTL = Math.hypot(x - 20, y - 20);
      const dTR = Math.hypot(w - 20 - x, y - 20);
      const dBL = Math.hypot(x - 20, h - 20 - y);
      const dBR = Math.hypot(w - 20 - x, h - 20 - y);

      const min = Math.min(dTL, dTR, dBL, dBR);
      let closest: Corner = "bottom-left";
      if (min === dTL) closest = "top-left";
      else if (min === dTR) closest = "top-right";
      else if (min === dBL) closest = "bottom-left";
      else if (min === dBR) closest = "bottom-right";

      setCorner(closest);
      try {
        sessionStorage.setItem("shavin-inspector-corner", closest);
        localStorage.setItem("shavin-inspector-corner", closest);
      } catch {
        // Ignore
      }
    } else {
      setIsDragging(false);
      setDragOffset(null);
    }
  };

  // Draggable Popover Window Handlers (smooth 60fps window tracking)
  const handlePopoverHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, input, select, a, [role='button']")) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    const pointerId = e.pointerId;
    try {
      target.setPointerCapture(pointerId);
    } catch {
      // Ignore
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = popoverPos.x;
    const initialY = popoverPos.y;

    setIsPopoverDragging(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setPopoverPos({
        x: initialX + dx,
        y: initialY + dy,
      });
    };

    const onPointerUp = () => {
      setIsPopoverDragging(false);
      try {
        target.releasePointerCapture(pointerId);
      } catch {
        // Ignore
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // If there are violations and we're opening fresh, land on audit tab
    if (!open && auditIssues.length > 0) {
      setTab("audit");
    }
    setOpen((prev) => !prev);
  };

  // Handlers for instant live DOM mutation
  const handleSelectTheme = (name: string) => {
    setThemeName(name);
    if (name === "Custom") return;
    const p = THEME_PRESETS.find((t) => t.name === name);
    if (!p) return;

    applyThemePreset(name);
    const targetHex =
      ACCENT_PRESETS.find((a) => a.name.toLowerCase() === p.accentColor.toLowerCase())?.hex ??
      DEFAULT_FALLBACK_HEX;
    setAccentHex(targetHex);
    setAccentName(p.accentColor);
    setGrayName(p.grayColor);
    setRadiusName(p.radius);
    setScaling(p.scaling);
    setTranslucent(p.panelBackground === "translucent");
    setDisplayFont(p.displayFont);
    setBodyFont(p.bodyFont);

    const isDarkMode = p.appearance === "dark";
    setDark(isDarkMode);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDarkMode);
      try {
        localStorage.setItem("shavin-appearance", isDarkMode ? "dark" : "light");
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
        localStorage.setItem("shavin-accent", targetHex);
        localStorage.setItem("shavin-gray", p.grayColor);
        localStorage.setItem("shavin-radius", p.radius);
        localStorage.setItem("shavin-scaling", String(p.scaling));
        localStorage.setItem("shavin-panel", p.panelBackground === "translucent" ? "translucent" : "solid");
        localStorage.setItem("shavin-display-font", p.displayFont);
        localStorage.setItem("shavin-body-font", p.bodyFont);
        window.dispatchEvent(new CustomEvent("shavin-theme-change"));
      } catch {
        // Ignore
      }
    }
  };

  const handleAccent = (hexOrName: string, name?: string) => {
    setThemeName("Custom");
    setAccentHex(hexOrName);
    if (name) setAccentName(name);
    applyAccentColor(hexOrName);
    try {
      localStorage.setItem("shavin-accent", hexOrName);
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };

  const handleGray = (name: string) => {
    setThemeName("Custom");
    setGrayName(name);
    applyGrayColor(name);
    try {
      localStorage.setItem("shavin-gray", name);
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };

  const handleAppearance = (val: string) => {
    const isDarkMode = val === "dark";
    setThemeName("Custom");
    setDark(isDarkMode);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDarkMode);
      try {
        localStorage.setItem("shavin-appearance", isDarkMode ? "dark" : "light");
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
        window.dispatchEvent(new CustomEvent("shavin-theme-change"));
      } catch {
        // Ignore
      }
    }
    applyAccentColor(accentHex);
  };

  const handleRadius = (name: string) => {
    setThemeName("Custom");
    setRadiusName(name);
    applyRadiusPreset(name);
    try {
      localStorage.setItem("shavin-radius", name);
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };

  const handleScaling = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setThemeName("Custom");
      setScaling(num);
      applyScalingPreset(num);
      try {
        localStorage.setItem("shavin-scaling", String(num));
        window.dispatchEvent(new CustomEvent("shavin-theme-change"));
      } catch {
        // Ignore
      }
    }
  };

  const handlePanelStyle = (val: string) => {
    const isTranslucent = val === "translucent";
    setThemeName("Custom");
    setTranslucent(isTranslucent);
    applyPanelBackground(isTranslucent);
    try {
      localStorage.setItem("shavin-panel", isTranslucent ? "translucent" : "solid");
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };

  const handleDisplayFont = (val: string) => {
    if (val === "__add_custom_font__") {
      if (typeof window !== "undefined") {
        window.open("https://docs.shavin.cc/start/custom-fonts/", "_blank");
      }
      return;
    }
    setThemeName("Custom");
    setDisplayFont(val);
    applyDisplayFontPreset(val);
    try {
      localStorage.setItem("shavin-display-font", val);
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };

  const handleBodyFont = (val: string) => {
    if (val === "__add_custom_font__") {
      if (typeof window !== "undefined") {
        window.open("https://docs.shavin.cc/start/custom-fonts/", "_blank");
      }
      return;
    }
    setThemeName("Custom");
    setBodyFont(val);
    applyBodyFontPreset(val);
    try {
      localStorage.setItem("shavin-body-font", val);
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };
  const handleSubheadingFont = (val: string) => {
    const next = val === "display" ? "display" : "body";
    setSubheadingFont(next);
    applySubheadingFont(next);
    try {
      window.dispatchEvent(new CustomEvent("shavin-theme-change"));
    } catch {
      // Ignore
    }
  };

  const resetAll = () => {
    setSubheadingFont(initialSubheadingRef.current);
    applySubheadingFont(initialSubheadingRef.current);
    if (initialProjectConfigRef.current) {
      const init = initialProjectConfigRef.current;
      setThemeName(init.themeName);
      setAccentHex(init.accentHex);
      setAccentName(init.accentName);
      setGrayName(init.grayName);
      setRadiusName(init.radiusName);
      setScaling(init.scaling);
      setTranslucent(init.translucent);
      setDisplayFont(init.displayFont);
      setBodyFont(init.bodyFont);

      applyAccentColor(init.accentHex);
      applyGrayColor(init.grayName);
      applyRadiusPreset(init.radiusName);
      applyScalingPreset(init.scaling);
      applyPanelBackground(init.translucent);
      applyDisplayFontPreset(init.displayFont);
      applyBodyFontPreset(init.bodyFont);

      try {
        localStorage.removeItem("shavin-theme");
        localStorage.removeItem("shavin-accent");
        localStorage.removeItem("shavin-gray");
        localStorage.removeItem("shavin-radius");
        localStorage.removeItem("shavin-scaling");
        localStorage.removeItem("shavin-display-font");
        localStorage.removeItem("shavin-body-font");
        sessionStorage.removeItem("shavin-theme");
        sessionStorage.removeItem("shavin-accent");
        sessionStorage.removeItem("shavin-gray");
        sessionStorage.removeItem("shavin-radius");
        sessionStorage.removeItem("shavin-scaling");
        window.dispatchEvent(new CustomEvent("shavin-theme-change"));
      } catch {
        // Ignore
      }
    } else {
      handleSelectTheme("Monochrome");
    }
  };

  const customGraySwatch =
    GRAY_PRESETS.find((g) => g.name.toLowerCase() === grayName.toLowerCase())?.swatch ?? DEFAULT_FALLBACK_HEX;

  const themeOptions = [
    ...THEME_PRESETS.map((p) => {
      const aHex = ACCENT_PRESETS.find((a) => a.name.toLowerCase() === p.accentColor.toLowerCase())?.hex ?? DEFAULT_FALLBACK_HEX;
      const gSwatch = GRAY_PRESETS.find((g) => g.name.toLowerCase() === p.grayColor.toLowerCase())?.swatch ?? DEFAULT_FALLBACK_HEX;
      return {
        value: p.name,
        label: p.name,
        prefix: (
          <span data-swatch="true" className="inline-flex items-center gap-0.5 shrink-0" title={`${p.accentColor} + ${p.grayColor}`}>
            <span data-swatch="true" className="h-3 w-3.5 rounded-[var(--radius-sm)] border border-hairline" style={{ backgroundColor: aHex }} />
            <span data-swatch="true" className="h-3 w-3.5 rounded-[var(--radius-sm)] border border-hairline" style={{ backgroundColor: gSwatch }} />
          </span>
        ),
      };
    }),
    {
      value: "Custom",
      label: "Custom",
      prefix: (
        <span data-swatch="true" className="inline-flex items-center gap-0.5 shrink-0" title="Custom theme settings">
          <span
            data-swatch="true"
            className="h-3 w-3.5 rounded-[var(--radius-sm)] border border-hairline"
            style={{ backgroundColor: accentHex.startsWith("#") ? accentHex : DEFAULT_FALLBACK_HEX }}
          />
          <span
            data-swatch="true"
            className="h-3 w-3.5 rounded-[var(--radius-sm)] border border-hairline"
            style={{ backgroundColor: customGraySwatch }}
          />
        </span>
      ),
    },
  ];

  const scalingOptions = SCALING_PRESETS.map((pct) => ({
    value: String(pct),
    label: `${pct}%`,
  }));

  const displayFontOptions = [
    ...(detectedHeadingFont
      ? [{ value: detectedHeadingFont, label: `${detectedHeadingFont} (Project Font)` }]
      : []),
    ...DISPLAY_FONTS.filter((f) => f.name.toLowerCase() !== (detectedHeadingFont || "").toLowerCase()).map((f) => ({
      value: f.name,
      label: f.name,
    })),
    { value: "__add_custom_font__", label: "+ Add custom font..." },
  ];

  const bodyFontOptions = [
    ...(detectedBodyFont
      ? [{ value: detectedBodyFont, label: `${detectedBodyFont} (Project Font)` }]
      : []),
    ...BODY_FONTS.filter((f) => f.name.toLowerCase() !== (detectedBodyFont || "").toLowerCase()).map((f) => ({
      value: f.name,
      label: f.name,
    })),
    { value: "__add_custom_font__", label: "+ Add custom font..." },
  ];

  const isPresetActive = themeName && themeName !== "Custom";
  const activePreset = isPresetActive
    ? THEME_PRESETS.find((p) => p.name.toLowerCase() === themeName.toLowerCase())
    : null;

  const normalizeAccent = (a: string) => {
    const s = (a || "").toLowerCase();
    return s === "black" ? "monochrome" : s;
  };

  const isExactPreset =
    activePreset &&
    normalizeAccent(activePreset.accentColor) === normalizeAccent(accentName) &&
    (activePreset.grayColor || "").toLowerCase() === (grayName || "").toLowerCase() &&
    (activePreset.radius || "").toLowerCase() === (radiusName || "").toLowerCase() &&
    (activePreset.scaling || 100) === scaling &&
    (activePreset.panelBackground || "solid") === (translucent ? "translucent" : "solid") &&
    (activePreset.displayFont || "Inter").toLowerCase() === displayFont.toLowerCase() &&
    (activePreset.bodyFont || "Inter").toLowerCase() === bodyFont.toLowerCase();

  const generatedSnippet =
    isPresetActive && isExactPreset
      ? `<ThemeProvider theme="${themeName}">\n  {children}\n</ThemeProvider>`
      : `<ThemeProvider\n  accentColor="${accentName || accentHex}"\n  grayColor="${grayName.toLowerCase()}"\n  radius="${radiusName}"\n  scaling={${scaling}}\n  panelBackground="${translucent ? "translucent" : "solid"}"\n  displayFont="${displayFont}"\n  bodyFont="${bodyFont}"${subheadingFont === "display" ? "\n  subheadingFont=\"display\"" : ""}\n>\n  {children}\n</ThemeProvider>`;

  const rootFileHint = useMemo(() => {
    if (typeof document === "undefined") return "layout.tsx / app root";
    if (document.querySelector("next-route-announcer") || document.querySelector("script[src*='/_next/']")) {
      return document.getElementById("__next") ? "pages/_app.tsx" : "app/layout.tsx";
    }
    if (document.getElementById("root")) return "src/App.tsx";
    if (document.getElementById("__remix")) return "app/root.tsx";
    return "layout.tsx / app root";
  }, []);

  const copyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(generatedSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyToolCmd = (cmd: string, toolName: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cmd);
      setCopiedTool(toolName);
      setTimeout(() => setCopiedTool(null), 2000);
    }
  };

  const copyIssueForAgent = (issue: AuditIssue, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof navigator === "undefined" || !navigator.clipboard) return;

    const el = issue.domNode;
    const classes = el ? (typeof el.className === "string" ? el.className.trim() : "") : "";
    const styleAttr = el?.getAttribute("style") || "";

    const promptText = [
      `[DS Violation] \`${issue.selector}\``,
      `• Rule: ${issue.category} (${issue.severity === "error" ? "ERR" : "WARN"})`,
      `• Issue: ${issue.detail}`,
      classes ? `• Class: \`${classes.length > 80 ? classes.slice(0, 80) + "..." : classes}\`` : null,
      styleAttr ? `• Style: \`${styleAttr}\`` : null,
      `• Fix: Replace with @shavin/ui semantic tokens (e.g. bg-surface, text-fg, border-hairline, shadow-card, rounded-[var(--radius-panel)]).`,
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(promptText);
    setCopiedIssueId(issue.id);
    setTimeout(() => setCopiedIssueId(null), 2000);
  };

  const copyAllIssuesForAgent = () => {
    if (typeof navigator === "undefined" || !navigator.clipboard || auditIssues.length === 0) return;

    const summaryRows = auditIssues.map((issue, i) => {
      return `| ${i + 1} | \`${issue.selector}\` | ${issue.category} | ${issue.severity === "error" ? "ERR" : "WARN"} | ${issue.detail} |`;
    }).join("\n");

    const fullPrompt = [
      `### @shavin/ui Audit (${auditIssues.length} Violations)`,
      `| # | Component / Context | Category | Sev | Issue Detail |`,
      `|---|---|---|---|---|`,
      summaryRows,
      ``,
      `**Action**: Refactor offending tokens using @shavin/ui semantic tokens (bg-surface, text-fg, border-hairline, shadow-card, rounded-[var(--radius-panel)]).`,
    ].join("\n");

    navigator.clipboard.writeText(fullPrompt);
    setCopiedAllIssues(true);
    setTimeout(() => setCopiedAllIssues(false), 2000);
  };

  const buttonStyle: React.CSSProperties = dragOffset
    ? {
        position: "fixed",
        left: `${dragOffset.x - 20}px`,
        top: `${dragOffset.y - 20}px`,
        transition: "none",
        zIndex: 9999999,
        touchAction: "none",
      }
    : {
        position: "fixed",
        ...CORNER_STYLES[corner],
        transition: isDragging ? "none" : "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        zIndex: 9999999,
        touchAction: "none",
      };

  const popoverSide = corner.startsWith("bottom") ? "top" : "bottom";
  const popoverAlign = corner.endsWith("left") ? "start" : "end";

  // Clean inspector style — inherits document foundation colors naturally without static zinc lock
  const INSPECTOR_THEME_STYLE: React.CSSProperties = {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "12px",
    lineHeight: "1.5",
    zIndex: 9999999,
    // @ts-ignore
    "--radius-lg": "0.5rem",
    // @ts-ignore
    "--radius-xl": "0.75rem",
    // @ts-ignore
    "--radius-panel": "0.75rem",
    // @ts-ignore
    "--radius-panel-inner": "var(--radius-panel)",
    // @ts-ignore
    "--panel-opacity": "1",
  };

  const a11yResult = useMemo(() => calculateContrast(accentHex, dark), [accentHex, dark]);

  if (!mounted) return null;

  return (
    <div style={buttonStyle} className={cn("shavin-dev-tools-root", className)} {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={buttonRef}
            type="button"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={handleButtonClick}
            style={{ touchAction: "none" }}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full bg-fg text-surface",
              "border border-hairline shadow-card ring-1 ring-black/10 dark:ring-white/10",
              "transition-transform active:scale-95 cursor-pointer select-none focus:outline-none",
              // Stays visible while the panel is open: it is the toggle and carries the audit dot.
              open && "ring-2 ring-accent"
            )}
            title={open ? "Close the inspector, or drag to snap corner" : "Click to open or drag to snap corner"}
            aria-label="Toggle Shavin Dev Inspector"
            aria-expanded={open}
          >
            {/* Shavin Official Serif Monogram Mark */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
            >
              <path
                d="M84.3402 106.157L84.6281 78.6112L84.6281 50.7042L17.2256 50.7042L17.2256 24.6892L182.776 24.6892L163.067 50.7042L108.278 50.7042L108.278 78.6112L107.99 86.4491C107.99 86.4491 98.8581 92.2253 95.1816 95.6855C91.5052 99.1457 84.3402 106.157 84.3402 106.157Z"
                fill="currentColor"
              />
              <path
                d="M185.14 136.998C185.14 149.611 181.593 159.15 174.498 165.614C167.245 172.079 156.918 175.311 143.516 175.311L114.348 175.311L134.056 150.715L145.408 150.715C156.129 150.715 161.49 146.221 161.49 137.234C161.49 132.82 160.229 129.509 157.706 127.301C155.026 124.936 150.769 123.754 144.935 123.754C137.998 123.754 131.928 125.331 126.725 128.484C121.364 131.637 114.978 137.471 107.568 145.985C98.1081 156.706 89.5941 164.195 82.0261 168.452C74.3004 172.709 65.6288 174.838 56.0111 174.838C42.9248 174.838 32.8341 171.527 25.7391 164.905C18.4864 158.283 14.8601 148.665 14.8601 136.052C14.8601 123.596 18.4864 114.215 25.7391 107.908C32.8341 101.444 43.0824 98.2119 56.4841 98.2119L63.3426 98.2119L63.3426 122.808L54.8286 122.808C49.1526 122.808 45.0533 123.912 42.5306 126.119C39.8503 128.326 38.5101 131.558 38.5101 135.815C38.5101 144.487 43.7919 148.823 54.3556 148.823C60.3469 148.823 65.9441 147.246 71.1471 144.093C76.3501 140.782 82.6568 134.869 90.0671 126.355C99.5271 115.476 108.12 107.987 115.846 103.888C123.571 99.7886 132.637 97.7389 143.043 97.7389C156.602 97.7389 167.008 101.129 174.261 107.908C181.514 114.53 185.14 124.227 185.14 136.998Z"
                fill="currentColor"
              />
            </svg>
            {/* Notification dot — red for errors, amber for warnings-only */}
            {(() => {
              const errCount = auditIssues.filter((i) => i.severity === "error").length;
              const warnCount = auditIssues.filter((i) => i.severity === "warning").length;
              if (errCount > 0) {
                return (
                  <span
                    className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-surface shadow-card"
                    aria-label={`${errCount} DS error${errCount !== 1 ? "s" : ""}`}
                  />
                );
              }
              if (warnCount > 0) {
                return (
                  <span
                    className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-warning ring-2 ring-surface shadow-card"
                    aria-label={`${warnCount} DS warning${warnCount !== 1 ? "s" : ""}`}
                  />
                );
              }
              return null;
            })()}
            <span className="sr-only">Shavin Dev Inspector</span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          side={popoverSide}
          align={popoverAlign}
          sideOffset={12}
          onWheel={(e) => e.stopPropagation()}
          style={{
            ...INSPECTOR_THEME_STYLE,
            translate: `${popoverPos.x}px ${popoverPos.y}px`,
            transform: (popoverPos.x !== 0 || popoverPos.y !== 0)
              ? `translate3d(${popoverPos.x}px, ${popoverPos.y}px, 0)`
              : undefined,
          }}
          className={cn(
            "z-[9999999] w-[380px] max-w-[calc(100vw-64px)] h-[660px] max-h-[calc(100vh-80px)] p-0 flex flex-col overflow-hidden overscroll-contain",
            "rounded-[var(--radius-panel)] border border-hairline bg-surface shadow-modal backdrop-blur-md text-fg",
            isPopoverDragging && "select-none transition-none cursor-grabbing"
          )}
        >
          {/* Draggable Header */}
          <div
            onPointerDown={handlePopoverHeaderPointerDown}
            style={{ touchAction: "none" }}
            className="flex items-center justify-between border-b border-hairline p-4 pb-2.5 shrink-0 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-fg">Shavin Dev Inspector</span>
            </div>
            <div className="flex items-center gap-1.5">
              {tab === "theme" && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="flex items-center gap-1 h-6 px-2 text-xs font-medium rounded-[var(--radius-lg)] text-fg-muted hover:text-fg hover:bg-surface-hover transition cursor-pointer"
                  title="Reset to project theme"
                  aria-label="Reset to project theme"
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none">
                    <path
                      d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-lg)] text-fg-muted hover:text-fg hover:bg-surface-hover transition cursor-pointer"
                title="Close inspector"
                aria-label="Close inspector"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Shavin DS Line Tabs) */}
          <div className="flex items-center px-4 border-b border-hairline shrink-0 bg-surface mt-2">
            {(
              [
                { id: "theme", label: "Theme" },
                { id: "audit", label: "DS Audit" },
                { id: "mcp", label: "MCP" },
                { id: "bridge", label: "Stream" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-2.5 py-2 text-xs font-medium -mb-px border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5",
                  tab === t.id
                    ? "border-fg text-fg font-semibold"
                    : "border-transparent text-fg-muted hover:text-fg hover:border-hairline-strong"
                )}
              >
                <span>{t.label}</span>
                {t.id === "audit" && auditIssues.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-danger/15 text-danger border border-danger/30">
                    {auditIssues.length}
                  </span>
                )}
                {t.id === "bridge" && (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      bridgeConnected ? "bg-success animate-[pulse_0.9s_ease-in-out_infinite]" : "bg-warning"
                    )}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content Body (Scrollable) */}
          <div
            onWheel={(e) => e.stopPropagation()}
            className="flex-1 min-h-0 overflow-y-auto p-4 py-4 space-y-3.5 overscroll-contain"
          >
            {/* Tab 1: Theme Configurator */}
            {tab === "theme" && (
              <div className="space-y-3.5 text-xs transition-all duration-200">
                {/* Theme Preset */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Theme</span>
                  <div className="w-40">
                    <Select
                      value={themeName}
                      onChange={handleSelectTheme}
                      options={themeOptions}
                      size="sm"
                      ariaLabel="Theme"
                      contentStyle={INSPECTOR_THEME_STYLE}
                      contentClassName="font-sans font-normal"
                    />
                  </div>
                </div>

                {/* Accent Color Swatch Row (Horizontal Scroll + Custom Hex Input) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-fg-muted font-medium">Accent Color</span>
                  </div>
                  <div className="flex items-center gap-1 p-2 rounded-[var(--radius-lg)] border border-hairline bg-surface-hover/30 overflow-x-auto scrollbar-none py-2">
                    {ACCENT_PRESETS.map((preset) => {
                      const isSelected =
                        accentHex.toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleAccent(preset.hex, preset.name)}
                          title={preset.name}
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border transition cursor-pointer",
                            isSelected
                              ? "border-fg bg-surface-hover"
                              : "border-transparent hover:bg-surface-hover",
                          )}
                        >
                          <span
                            className="h-5 w-5 rounded-[calc(var(--radius-lg)-2px)] border border-hairline"
                            style={{ backgroundColor: preset.hex }}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Hex Color Affordance */}
                  <div className="flex items-center justify-between pt-0.5 px-0.5">
                    <span className="text-xs text-fg-muted font-medium">Custom Hex</span>
                    <div className="flex items-center gap-1.5">
                      <label
                        className="relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-[var(--radius-lg)] border border-hairline overflow-hidden shrink-0"
                        style={{ backgroundColor: accentHex }}
                        title="Click to open color wheel"
                      >
                        <input
                          type="color"
                          value={accentHex.startsWith("#") && accentHex.length === 7 ? accentHex : DEFAULT_FALLBACK_HEX}
                          onChange={(e) => handleAccent(e.target.value, "Custom")}
                          className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                          aria-label="Custom color picker"
                        />
                      </label>
                      <input
                        type="text"
                        value={accentHex}
                        onChange={(e) => handleAccent(e.target.value, "Custom")}
                        placeholder={DEFAULT_FALLBACK_HEX}
                        className="w-24 font-mono text-xs px-2 py-1 bg-surface border border-hairline rounded-[var(--radius-lg)] text-fg outline-none focus:border-hairline-strong transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Gray Family */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Gray Family</span>
                  <div className="flex items-center gap-1">
                    {GRAY_PRESETS.map((g) => {
                      const isSelected =
                        grayName.toLowerCase() === g.name.toLowerCase();
                      return (
                        <button
                          key={g.name}
                          type="button"
                          onClick={() => handleGray(g.name)}
                          title={g.name}
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-[var(--radius-lg)] border transition cursor-pointer",
                            isSelected
                              ? "border-fg bg-surface-hover"
                              : "border-transparent hover:bg-surface-hover",
                          )}
                        >
                          <span
                            className="h-5 w-5 rounded-[calc(var(--radius-lg)-2px)] border border-hairline"
                            style={{ backgroundColor: g.swatch }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Appearance */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Appearance</span>
                  <div className="inline-flex rounded-[var(--radius-lg)] border border-hairline p-0.5 bg-surface gap-0.5">
                    {(
                      [
                        { value: "light", label: "Light" },
                        { value: "dark", label: "Dark" },
                      ] as const
                    ).map((item) => {
                      const isSelected = (dark && item.value === "dark") || (!dark && item.value === "light");
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleAppearance(item.value)}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-[calc(var(--radius-lg)-2px)] transition cursor-pointer font-medium",
                            isSelected
                              ? "bg-fg text-surface font-semibold"
                              : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                          )}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Radius Presets */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Radius</span>
                  <div className="flex items-center gap-1">
                    {RADIUS_PRESETS.map((r) => {
                      const isSelected = radiusName.toLowerCase() === r.name;
                      return (
                        <button
                          key={r.name}
                          type="button"
                          onClick={() => handleRadius(r.name)}
                          title={r.label}
                          aria-label={r.label}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-[var(--radius-lg)] transition cursor-pointer border",
                            isSelected
                              ? "border-fg bg-surface-hover text-fg"
                              : "border-transparent text-fg-muted hover:bg-surface-hover",
                          )}
                        >
                          <span
                            className={cn(
                              "h-3.5 w-3.5 border-2 border-l-0 border-b-0 transition-colors",
                              isSelected ? "border-fg" : "border-fg-muted",
                            )}
                            style={{ borderTopRightRadius: r.name === "full" ? "9999px" : r.lg }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scaling */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Scaling</span>
                  <div className="w-28">
                    <Select
                      value={String(scaling)}
                      onChange={handleScaling}
                      options={scalingOptions}
                      size="sm"
                      ariaLabel="Scaling percentage"
                      contentStyle={INSPECTOR_THEME_STYLE}
                      contentClassName="font-sans font-normal"
                    />
                  </div>
                </div>

                {/* Panel Style */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Panel Style</span>
                  <div className="inline-flex rounded-[var(--radius-lg)] border border-hairline p-0.5 bg-surface gap-0.5">
                    {(
                      [
                        { value: "solid", label: "Solid" },
                        { value: "translucent", label: "Translucent" },
                      ] as const
                    ).map((item) => {
                      const isSelected = (translucent && item.value === "translucent") || (!translucent && item.value === "solid");
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handlePanelStyle(item.value)}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-[calc(var(--radius-lg)-2px)] transition cursor-pointer font-medium",
                            isSelected
                              ? "bg-fg text-surface font-semibold"
                              : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                          )}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Heading Font */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Heading Font</span>
                  <div className="w-40">
                    <Select
                      value={displayFont}
                      onChange={handleDisplayFont}
                      options={displayFontOptions}
                      size="sm"
                      ariaLabel="Heading font"
                      contentStyle={INSPECTOR_THEME_STYLE}
                      contentClassName="font-sans font-normal"
                    />
                  </div>
                </div>

                {/* Subheading Font (h3-h6) */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Subheading Font</span>
                  <div className="w-40">
                    <Select
                      value={subheadingFont}
                      onChange={handleSubheadingFont}
                      options={[
                        { value: "body", label: "Body font" },
                        { value: "display", label: "Display font" },
                      ]}
                      size="sm"
                      ariaLabel="Subheading font (h3 to h6)"
                      contentStyle={INSPECTOR_THEME_STYLE}
                      contentClassName="font-sans font-normal"
                    />
                  </div>
                </div>

                {/* Body Font */}
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted font-medium">Body Font</span>
                  <div className="w-40">
                    <Select
                      value={bodyFont}
                      onChange={handleBodyFont}
                      options={bodyFontOptions}
                      size="sm"
                      ariaLabel="Body font"
                      contentStyle={INSPECTOR_THEME_STYLE}
                      contentClassName="font-sans font-normal"
                    />
                  </div>
                </div>

                {/* Code Snippet Box */}
                <div className="pt-3 border-t border-hairline space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-fg">Theme Code</span>
                    <span className="text-xs text-fg-muted font-mono">{rootFileHint}</span>
                  </div>
                  <pre className="p-2.5 rounded-[var(--radius-lg)] bg-surface-hover/60 border border-hairline font-mono text-xs text-fg overflow-x-auto select-all leading-relaxed">
                    {generatedSnippet}
                  </pre>
                </div>
              </div>
            )}

            {tab === "audit" && (() => {
              const allClear = auditIssues.length === 0;

              return (
                <div className="space-y-4 text-xs transition-all duration-200">
                  {/* Live Realtime A11y Contrast Card */}
                  <div className="rounded-[var(--radius-panel)] border border-hairline p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-fg">Live A11y Contrast</span>
                      <span
                        className={cn(
                          "flex items-center gap-1.5 font-bold text-xs",
                          a11yResult.level === "AAA"
                            ? "text-success"
                            : a11yResult.level === "AA"
                            ? "text-warning"
                            : "text-danger"
                        )}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            a11yResult.level === "AAA"
                              ? "bg-success"
                              : a11yResult.level === "AA"
                              ? "bg-warning"
                              : "bg-danger"
                          )}
                        />
                        {a11yResult.label}
                      </span>
                    </div>
                    <p className="text-xs text-fg-muted leading-relaxed">
                      Evaluated live against {dark ? "Dark" : "Light"} background using WCAG 2.1 relative luminance math.
                    </p>
                  </div>

                  {/* DOM Token Compliance — status header */}
                  <div className="rounded-[var(--radius-panel)] border border-hairline p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-fg">DOM Token Compliance</span>
                      <span className={cn("flex items-center gap-1.5 font-bold text-xs", allClear ? "text-success" : "text-danger")}>
                        <span className={cn("h-2 w-2 rounded-full shrink-0", allClear ? "bg-success" : "bg-danger animate-[pulse_0.9s_ease-in-out_infinite]")} />
                        {allClear ? "All Clear" : `${auditIssues.length} DOM Violation${auditIssues.length !== 1 ? "s" : ""} Found`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-hairline text-xs text-fg-muted">
                      {auditTimestamp && <span>Last scan: {auditTimestamp}</span>}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={runLiveAudit}
                        className="flex items-center gap-1 h-6 px-2 text-xs font-medium text-fg-muted hover:text-fg hover:bg-surface-hover transition cursor-pointer"
                        title="Re-scan DOM for violations"
                      >
                        <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none">
                          <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Re-scan</span>
                      </Button>
                    </div>
                  </div>

                  {/* Highlight toggle */}
                  <div className="rounded-[var(--radius-panel)] border border-hairline px-3 py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-fg text-xs">Highlight Violations</span>
                    <Switch
                      checked={highlightErrors}
                      onCheckedChange={setHighlightErrors}
                      size="sm"
                      aria-label="Highlight violations on live screen"
                    />
                  </div>

                  {/* Source Architecture Warnings toggle */}
                  <div className="rounded-[var(--radius-panel)] border border-hairline px-3 py-2.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-fg text-xs">Source Architecture Warnings</span>
                        <span className="text-[10px] text-fg-muted font-normal">(opt-in)</span>
                      </div>
                      <Switch
                        checked={showSourceWarnings}
                        onCheckedChange={(checked) => {
                          setShowSourceWarnings(checked);
                          if (checked && sourceWarnings.length === 0 && !sourceAuditLoading) {
                            fetchSourceWarnings();
                          }
                        }}
                        size="sm"
                        aria-label="Include source-level architecture warnings"
                      />
                    </div>
                    <p className="text-[11px] text-fg-muted leading-relaxed">
                      Scans .tsx/.jsx source for raw HTML elements, deep imports, missing cva()/cn(). Warnings only — safe to ignore when mixing frameworks.
                    </p>
                  </div>

                  {/* Source Warnings List (conditional) */}
                  {showSourceWarnings && (
                    <div className="space-y-2 pt-1">
                      {/* Header + refresh */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-fg">
                          Source Warnings ({sourceWarnings.length})
                          {sourceAuditTimestamp && <span className="text-xs text-fg-muted font-normal ml-2">· {sourceAuditTimestamp}</span>}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={fetchSourceWarnings}
                          disabled={sourceAuditLoading}
                          className={cn(
                            "h-6 px-2 text-xs font-medium cursor-pointer flex items-center gap-1",
                            sourceAuditLoading
                              ? "text-fg-muted opacity-60"
                              : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                          )}
                          title="Re-scan source files"
                        >
                          <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none">
                            <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>{sourceAuditLoading ? "Scanning…" : "Re-scan"}</span>
                        </Button>
                      </div>

                      {/* Error state */}
                      {sourceAuditError && (
                        <div className="rounded-[var(--radius-panel)] border border-warning/30 p-2.5">
                          <p className="text-xs text-warning leading-relaxed">{sourceAuditError}</p>
                        </div>
                      )}

                      {/* Source warning items */}
                      {sourceWarnings.length > 0 ? (
                        <div
                          onWheel={(e) => e.stopPropagation()}
                          className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 overscroll-contain"
                        >
                          {sourceWarnings.map((warn, idx) => (
                            <div
                              key={`src-warn-${idx}`}
                              className="w-full text-left rounded-[var(--radius-panel)] border border-warning/20 hover:border-warning/40 text-xs transition overflow-hidden p-2.5"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-medium text-warning truncate shrink-0">
                                  {warn.type === "raw-element" && warn.element
                                    ? `${warn.count || 1}× <${warn.element}>`
                                    : warn.type === "deep-import"
                                    ? "Deep import"
                                    : warn.type === "missing-cva"
                                    ? "Missing cva()"
                                    : "Missing cn()"}
                                </span>
                                <span className="text-fg-muted text-xs shrink-0 font-normal">→</span>
                                <span className="text-fg-subtle truncate font-mono text-[11px]">{warn.file}</span>
                              </div>
                              <p className="text-[11px] text-fg-muted leading-relaxed mt-1 pt-1 border-t border-hairline/40">
                                {warn.type === "raw-element"
                                  ? `Use <${warn.primitive}> instead — ${warn.reason || "Shavin primitive available"}`
                                  : warn.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        !sourceAuditLoading && !sourceAuditError && (
                          <div className="rounded-[var(--radius-panel)] border border-hairline p-2.5">
                            <p className="text-xs text-success font-medium">✓ Source architecture is clean</p>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Violations Accordion List */}
                  {auditIssues.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-fg">Detected Violations ({auditIssues.length})</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={copyAllIssuesForAgent}
                          className={cn(
                            "h-6 px-2 text-xs font-medium cursor-pointer flex items-center gap-1",
                            copiedAllIssues
                              ? "text-success"
                              : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                          )}
                          title="Copy full markdown report of all violations"
                        >
                          {copiedAllIssues ? "Copied all!" : "Copy all"}
                        </Button>
                      </div>
                      <div
                        onWheel={(e) => e.stopPropagation()}
                        className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 overscroll-contain"
                      >
                        {auditIssues.map((issue) => {
                          const isCopied = copiedIssueId === issue.id;
                          const isExpanded = expandedIssueId === issue.id;
                          return (
                            <div
                              key={issue.id}
                              className={cn(
                                "w-full text-left rounded-[var(--radius-panel)] border text-xs transition cursor-pointer overflow-hidden",
                                issue.severity === "error"
                                  ? "border-danger/30 hover:border-danger/60"
                                  : "border-warning/30 hover:border-warning/60"
                              )}
                            >
                              {/* Accordion Header Row */}
                              <div
                                onClick={() => {
                                  focusViolation(issue);
                                  setExpandedIssueId(isExpanded ? null : issue.id);
                                }}
                                className="flex items-center justify-between gap-2 p-2.5"
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1 text-xs">
                                  <span className={cn("font-medium truncate", issue.severity === "error" ? "text-danger" : "text-warning")}>
                                    {issue.selector}
                                  </span>
                                  <span className="text-fg-muted text-xs shrink-0 font-normal">
                                    • {issue.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyIssueForAgent(issue, e);
                                    }}
                                    className={cn(
                                      "h-6 px-2 text-xs font-medium cursor-pointer",
                                      isCopied
                                        ? "text-success"
                                        : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                                    )}
                                    title="Copy issue details"
                                  >
                                    {isCopied ? "Copied!" : "Copy"}
                                  </Button>
                                  <svg
                                    viewBox="0 0 16 16"
                                    className={cn(
                                      "h-3 w-3 text-fg-muted transition-transform duration-200",
                                      isExpanded && "rotate-180"
                                    )}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              </div>

                              {/* Accordion Expanded Details with Smooth Grid Transition */}
                              <div
                                className={cn(
                                  "grid transition-all duration-200 ease-out",
                                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                )}
                              >
                                <div className="overflow-hidden">
                                  <div className="p-2.5 pt-0 border-t border-hairline/40 space-y-1 mt-0.5">
                                    <p className="text-xs text-fg leading-relaxed pt-1.5">{issue.detail}</p>
                                    {issue.domNode && issue.domNode.className && typeof issue.domNode.className === "string" && (
                                      <div className="pt-1 text-xs font-mono text-fg-muted truncate">
                                        <span className="text-fg-subtle font-sans">Classes: </span>
                                        {issue.domNode.className}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Tab 3: MCP Tools */}
            {tab === "mcp" && (
              <div className="space-y-4 text-xs transition-all duration-200">
                {/* 1. Live AI Agent Browser Bridge Banner Container */}
                <div className="rounded-[var(--radius-panel)] border border-hairline p-3.5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setTab("bridge")}
                      className="group flex items-center gap-1.5 font-semibold text-fg text-sm hover:text-accent transition cursor-pointer"
                      title="View live stream log in Stream tab"
                    >
                      <span>AI Agent Bridge</span>
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 text-fg-muted group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7 17 17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </button>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 font-bold text-xs",
                      bridgeConnected ? "text-success" : "text-warning"
                    )}>
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        bridgeConnected ? "bg-success animate-[pulse_0.9s_ease-in-out_infinite]" : "bg-warning"
                      )} />
                      {bridgeConnected ? "Connected (:7428)" : "Listening (:7428)"}
                    </span>
                  </div>
                </div>

                {/* 2. MCP Daemon & Agent Skills Init Commands Container */}
                <div className="rounded-[var(--radius-panel)] border border-hairline p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-fg-muted font-medium">MCP Daemon</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToolCmd("npx @shavin/mcp", "daemon")}
                      className={cn(
                        "font-mono text-xs h-6 px-2 cursor-pointer",
                        copiedTool === "daemon"
                          ? "text-success"
                          : "text-fg hover:text-accent hover:bg-surface-hover"
                      )}
                    >
                      {copiedTool === "daemon" ? "Copied!" : "npx @shavin/mcp"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-fg-muted font-medium">Agent Skills Init</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToolCmd("npx @shavin/cli init", "init")}
                      className={cn(
                        "font-mono text-xs h-6 px-2 cursor-pointer",
                        copiedTool === "init"
                          ? "text-success"
                          : "text-fg hover:text-accent hover:bg-surface-hover"
                      )}
                    >
                      {copiedTool === "init" ? "Copied!" : "npx @shavin/cli init"}
                    </Button>
                  </div>
                </div>

                {/* MCP Tools List with Count */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="text-sm font-semibold text-fg">MCP Tools ({MCP_TOOL_INFO.length})</span>
                  </div>

                  <div className="space-y-1">
                    {MCP_TOOL_INFO.map((tool) => {
                      const isCopied = copiedTool === tool.name;
                      const isExpanded = expandedToolName === tool.name;
                      return (
                        <div
                          key={tool.name}
                          className={cn(
                            "group rounded-[var(--radius-lg)] transition-colors overflow-hidden",
                            isExpanded ? "bg-surface-hover/50" : "hover:bg-surface-hover/60"
                          )}
                        >
                          <Row
                            as="div"
                            onClick={() => setExpandedToolName(isExpanded ? null : tool.name)}
                            className="cursor-pointer select-none py-2 px-2.5"
                            leading={
                              <svg
                                viewBox="0 0 24 24"
                                className={cn(
                                  "h-3.5 w-3.5 text-fg-muted transition-transform duration-200 shrink-0",
                                  isExpanded && "rotate-90 text-fg"
                                )}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m9 18 6-6-6-6" />
                              </svg>
                            }
                            trailing={
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyToolCmd(tool.cmd, tool.name);
                                }}
                                className={cn(
                                  "h-6 px-2 text-xs font-medium cursor-pointer shrink-0 transition-opacity",
                                  isCopied
                                    ? "text-success opacity-100"
                                    : "text-fg-muted hover:text-fg hover:bg-surface-hover opacity-0 group-hover:opacity-100 focus:opacity-100"
                                )}
                                title={`Copy: ${tool.cmd}`}
                              >
                                {isCopied ? "Copied!" : "Copy"}
                              </Button>
                            }
                          >
                            <span className="font-mono font-medium text-fg text-xs">
                              {tool.name}
                            </span>
                          </Row>

                          {/* Expanded State: Smooth expand/collapse transition */}
                          <div
                            className={cn(
                              "grid transition-all duration-200 ease-out",
                              isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                            )}
                          >
                            <div className="overflow-hidden">
                              <div className="px-3 pb-3 pt-1 text-xs text-fg-muted leading-relaxed">
                                <p className="text-xs text-fg-muted">{tool.desc}</p>
                                <div className="mt-2.5 pt-2 border-t border-hairline/40 text-xs font-mono text-fg-subtle select-all">
                                  {tool.cmd}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Live Bridge Stream */}
            {tab === "bridge" && (
              <div className="flex flex-col h-full space-y-4 text-xs transition-all duration-200">
                {/* Connection Status Header Outline Container */}
                <div className="rounded-[var(--radius-panel)] border border-hairline p-3.5 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "h-2.5 w-2.5 rounded-full shrink-0",
                        bridgeConnected ? "bg-success animate-[pulse_0.9s_ease-in-out_infinite] shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-warning"
                      )} />
                      <div>
                        <div className="font-semibold text-fg text-xs flex items-center gap-1.5">
                          <span>AI Agent Bridge</span>
                          <span className="font-mono text-xs text-fg-muted bg-surface-hover px-1.5 py-0.5 rounded border border-hairline">
                            :7428
                          </span>
                        </div>
                        <div className="text-xs text-fg-muted">
                          {bridgeConnected ? "Real-time AI Sync Active" : "Listening on localhost:7428"}
                        </div>
                      </div>
                    </div>
                    <a
                      href="http://localhost:7428/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-fg-muted hover:text-fg hover:bg-surface-hover rounded-[calc(var(--radius-lg)-2px)] border border-hairline transition cursor-pointer"
                      title="Open full dashboard monitor in new browser tab"
                    >
                      <span>Monitor</span>
                      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 3h7v7M13 3L6 10" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Stream Controls Toolbar */}
                <div className="flex items-center justify-between gap-2 shrink-0">
                  <span className="text-sm font-semibold text-fg flex items-center gap-1.5">
                    <span>Live Event Log</span>
                    <span className="text-xs font-mono text-fg-muted bg-surface-hover px-1.5 py-0.5 rounded border border-hairline">
                      {streamEvents.length}
                    </span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTriggerRescan}
                      disabled={triggeringRescan}
                      className="text-xs h-6 px-2 py-0.5 gap-1 font-medium cursor-pointer"
                    >
                      <svg viewBox="0 0 16 16" className={cn("h-3 w-3", triggeringRescan && "animate-spin")} fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 8A6 6 0 118 2v3M8 2l3 3M8 2L5 5" />
                      </svg>
                      <span>{triggeringRescan ? "Scanning..." : "Rescan"}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStreamEvents([])}
                      className="text-xs h-6 px-2 py-0.5 text-fg-muted hover:text-fg cursor-pointer"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Event Stream Feed - Fill Available Space using plain Row list */}
                <div className="flex-1 min-h-[220px] overflow-y-auto overscroll-contain flex flex-col">
                  {streamEvents.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-[var(--radius-panel)] border border-dashed border-hairline/60 bg-surface-hover/10">
                      <div className="text-fg font-medium text-xs mb-1">Waiting for Stream Events...</div>
                      <div className="text-xs text-fg-muted leading-relaxed max-w-[260px]">
                        Events triggered by AI agents, DOM audit synchronization, or rescan signals will stream here live.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {streamEvents.map((evt) => {
                        const isExpanded = selectedEventId === evt.id;
                        return (
                          <div
                            key={evt.id}
                            className={cn(
                              "group rounded-[var(--radius-lg)] transition-colors overflow-hidden",
                              isExpanded ? "bg-surface-hover/50" : "hover:bg-surface-hover/60"
                            )}
                          >
                            <Row
                              as="div"
                              onClick={() => setSelectedEventId(isExpanded ? null : evt.id)}
                              className="cursor-pointer select-none py-1.5 px-2.5"
                              leading={
                                evt.direction === "in" ? (
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-3.5 w-3.5 text-accent shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-label="Incoming event from AI bridge"
                                  >
                                    <path d="M17 7 7 17" />
                                    <path d="M17 17H7V7" />
                                  </svg>
                                ) : (
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-3.5 w-3.5 text-success shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-label="Outgoing sync to AI bridge"
                                  >
                                    <path d="M7 17 17 7" />
                                    <path d="M7 7h10v10" />
                                  </svg>
                                )
                              }
                              trailing={
                                <span className="text-xs text-fg-muted font-normal font-mono">
                                  {evt.timestamp}
                                </span>
                              }
                            >
                              <div className="min-w-0 pr-1">
                                <div className="font-mono font-medium text-fg text-xs truncate">
                                  {evt.type}
                                </div>
                                <div className="text-xs text-fg-subtle truncate leading-tight mt-0.5">
                                  {evt.summary}
                                </div>
                              </div>
                            </Row>

                            {/* Event Payload: Smooth expand/collapse transition */}
                            {evt.data && (
                              <div
                                className={cn(
                                  "grid transition-all duration-200 ease-out",
                                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                )}
                              >
                                <div className="overflow-hidden">
                                  <div className="px-2.5 pb-2.5 pt-1 border-t border-hairline/40">
                                    <div className="flex items-center justify-between text-xs text-fg-muted mb-1 pt-1">
                                      <span className="font-mono uppercase text-xs">Payload Data</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(JSON.stringify(evt.data, null, 2));
                                        }}
                                        className="h-6 px-2 text-xs text-fg-muted hover:text-fg hover:bg-surface-hover cursor-pointer"
                                      >
                                        Copy JSON
                                      </Button>
                                    </div>
                                    <pre className="p-2 rounded-[calc(var(--radius-lg)-2px)] bg-surface-hover/80 border border-hairline font-mono text-xs text-fg overflow-x-auto max-h-40 whitespace-pre-wrap leading-tight">
                                      {JSON.stringify(evt.data, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer for Theme Tab */}
          {tab === "theme" && (
            <div className="p-4 pt-2.5 pb-3 border-t border-hairline bg-surface shrink-0">
              <Button
                type="button"
                variant="solid"
                size="sm"
                onClick={copyCode}
                className="w-full cursor-pointer bg-fg text-surface hover:opacity-90 font-semibold text-xs py-1.5 h-8"
              >
                {copied ? "Copied ThemeProvider JSX!" : "Copy Theme Code"}
              </Button>
            </div>
          )}

          {/* Fixed Footer for DS Audit Tab */}
          {tab === "audit" && (
            <div className="p-4 pt-2.5 pb-3 border-t border-hairline bg-surface shrink-0 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-xs font-medium">
                {auditIssues.length === 0 ? (
                  <span className="flex items-center gap-1.5 text-success font-semibold">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    0 DOM Violations (Clean)
                    {showSourceWarnings && sourceWarnings.length > 0 && (
                      <span className="text-warning font-normal ml-1.5">· {sourceWarnings.length} source warnings</span>
                    )}
                  </span>
                ) : (
                  <div className="flex items-center gap-2.5">
                    {auditIssues.filter((i) => i.severity === "error").length > 0 && (
                      <span className="flex items-center gap-1 text-danger font-semibold">
                        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor"><circle cx="8" cy="8" r="7" /><path d="M8 5v3.5M8 10.5v.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        {auditIssues.filter((i) => i.severity === "error").length} error{auditIssues.filter((i) => i.severity === "error").length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {auditIssues.filter((i) => i.severity === "warning").length > 0 && (
                      <span className="flex items-center gap-1 text-warning font-semibold">
                        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor"><path d="M8 1L15 14H1L8 1Z" /><path d="M8 6v3.5M8 11v.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        {auditIssues.filter((i) => i.severity === "warning").length} warning{auditIssues.filter((i) => i.severity === "warning").length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={runLiveAudit}
                className="flex items-center gap-1 h-7 px-2.5 text-xs font-medium text-fg-muted hover:text-fg hover:bg-surface-hover transition cursor-pointer"
                title="Re-scan DOM for violations"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none">
                  <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Re-scan</span>
              </Button>
            </div>
          )}

          {/* Fixed Footer for Stream Tab: Collapsible How It Works */}
          {tab === "bridge" && (
            <div className="p-3 pt-2.5 pb-2.5 border-t border-hairline bg-surface shrink-0">
              <div className="rounded-[var(--radius-panel)] border border-hairline overflow-hidden">
                <button
                  type="button"
                  onClick={() => setStreamHowItWorksOpen(!streamHowItWorksOpen)}
                  className="w-full p-2 flex items-center justify-between text-xs font-medium text-fg hover:bg-surface-hover/60 transition cursor-pointer"
                >
                  <span>How it works</span>
                  <div className="flex items-center gap-1 text-fg-muted">
                    <span className="text-xs">Real-time Sync</span>
                    <svg
                      viewBox="0 0 16 16"
                      className={cn(
                        "h-3 w-3 transition-transform duration-200",
                        streamHowItWorksOpen && "rotate-180"
                      )}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-200 ease-out",
                    streamHowItWorksOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="p-2.5 pt-0 border-t border-hairline/40 text-xs text-fg-muted leading-relaxed">
                      The bridge syncs live design tokens, active themes, and DOM audit status directly with AI coding agents without manual copy-pasting.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export const ShavinDevInspector = ShavinDevTools;

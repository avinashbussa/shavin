"use client";
import * as React from "react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { resolveBridgePort, bridgeUrl, bridgeDashboardUrl } from "../../lib/bridge";
import {
  countFindings,
  domHooks,
  inspectDocument,
  installConsoleCapture,
  rankFindings,
  tokenFindings,
  type ConsoleCapture,
  type Finding,
} from "../../lib/inspector";
import { Inspector, IGNORED_EVENT, RESCAN_EVENT } from "../../inspector";
import { useThemeController, DEFAULT_FALLBACK_HEX } from "../../inspector/theme/useThemeController";
import { loadIgnored } from "../../inspector/ignored";
import { loadGoogleFont, preloadGoogleFontsBundle } from "../../lib/theme-presets";
import { Button } from "../Button";
import { Popover, PopoverTrigger, PopoverContent } from "../Popover";
import { Switch } from "../Switch";
import { Row } from "../Row";
import { cn } from "../../lib/cn";
import { SHAVIN_META, type ShavinMcpTool } from "../../lib/meta";

import type { ShavinDevToolsProps } from "./types";

type Corner = "bottom-left" | "bottom-right" | "top-left" | "top-right";

const CORNER_STYLES: Record<Corner, React.CSSProperties> = {
  "bottom-left": { bottom: "20px", left: "20px" },
  "bottom-right": { bottom: "20px", right: "20px" },
  "top-left": { top: "20px", left: "20px" },
  "top-right": { top: "20px", right: "20px" },
};


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
function calculateContrast(fgHex: string, isDark: boolean): { ratio: number; level: "AAA" | "AA" | "Fail" | "Unknown"; label: string } {
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
    return { ratio: 0, level: "Unknown", label: "unknown (colour could not be read)" };
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

/**
 * One line per MCP tool. The tool names come from SHAVIN_META.mcpTools, which the manifest
 * generator reads from the server's registry, so the panel always lists every tool; a new tool
 * without a line here fails the type check.
 */
const MCP_TOOL_DESC: Record<ShavinMcpTool, string> = {
  get_project_context: "The project's design profile and the tool workflow. Call first",
  inspect_environment: "Checks the setup: package, Tailwind, CSS imports, ThemeProvider, agent files",
  get_setup_instructions: "Wiring steps for Next.js or React, Tailwind v3 or v4",
  plan_page: "Turns a brief into a section plan from the layout compositions",
  check_page: "Checks a page plan, then the built code against it",
  render_check: "Loads a local page headless and reports overlap, contrast and overflow, with screenshots",
  get_components: `Exact props and variants for any of the ${SHAVIN_META.primitiveCount} primitives`,
  get_tokens: "The semantic colour, surface, radius, shadow and motion tokens",
  get_block_template: "A ready-made block's verified template",
  get_studio_schema: "Block registry: key, name, category and tier",
  synthesize_layout: "Scaffolds token-pure starter sections",
  get_guidelines: "Rules from AGENTS.md, optionally one section",
  validate_code: "Lints JSX against the token and radius rules",
  autofix_code: "Rewrites raw colours and radii to tokens",
  audit_source: "Scans .tsx files for issues the live audit can't see",
  get_live_audit: "The latest audit from this page, read through the bridge",
  trigger_live_rescan: "Asks open pages to re-run the audit now",
  wait_for_live_clean: "Waits until the page reports no problems",
  await_finding: "Waits for a finding you sent from the page and leases it to the agent",
  list_findings: "Lists the findings you sent from the page and where each stands",
  list_skills: "The agent skills and their sections",
  get_skill: "One skill, or one section of it",
  get_skill_mode: "Structural, marketing, editorial or hybrid mode for a task",
  install_skills: `Installs the ${SHAVIN_META.skillCount} skills into .agents/skills`,
  list_commands: "The slash commands in .agents/commands",
  shavin_steer: "Audit, polish, harden or roll back a design",
  connect_studio: "Pairs with a Studio canvas using its 6-character code",
  get_studio_state: "Reads the Studio canvas: frames, blocks and theme",
  compose_to_canvas: "Builds a page from a prompt on the Studio canvas",
  inject_blocks: "Puts blocks or TSX onto the Studio canvas",
  set_studio_theme: "Changes the Studio canvas theme",
  clear_studio_canvas: "Empties the Studio canvas",
  duplicate_frame: "Copies a Studio frame next to the original",
  resize_frame: "Resizes a Studio frame to a device, social preset or custom size",
  export_frame: "Saves a Studio frame as PNG, JPG or WebP",
  disconnect_studio: "Ends the Studio session",
};

// `cmd` is what the Copy button puts on the clipboard: an instruction to paste into the agent.
// These tools run through MCP inside the agent, not as shell commands.
// Ordered as MCP_TOOL_DESC is written (workflow first), so new tools land at the end.
const MCP_TOOL_INFO = (Object.keys(MCP_TOOL_DESC) as ShavinMcpTool[]).map((name) => ({
  name,
  desc: MCP_TOOL_DESC[name],
  cmd: `Use the Shavin MCP tool ${name}`,
}));

function DevToolsPanel({
  className,
  position = "bottom-right",
  bridgePort,
  ...props
}: Omit<ShavinDevToolsProps, "forceShow">): React.JSX.Element | null {
  const bPort = resolveBridgePort(bridgePort);
  const [mounted, setMounted] = useState(false);
  const consoleCaptureRef = useRef<ConsoleCapture | null>(null);
  // Findings of the last scan, for the Issues tool. Updated only when the set of findings changes.
  const [inspectorFindings, setInspectorFindings] = useState<Finding[]>([]);

  // Keep the last console errors so the audit can report them (dev only; restored when the panel unmounts).
  useEffect(() => {
    const capture = installConsoleCapture();
    consoleCaptureRef.current = capture;
    // A console error changes no DOM, so nothing else would trigger a scan: ask for one (debounced).
    let timer = 0;
    const unsubscribe = capture.subscribe(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => window.dispatchEvent(new Event(RESCAN_EVENT)), 400);
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
      capture.dispose();
      consoleCaptureRef.current = null;
    };
  }, []);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"audit" | "bridge" | "mcp">("audit");

  // Corner Snapping and Dragging State
  const [corner, setCorner] = useState<Corner>(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const pointerDownRef = useRef<{ startX: number; startY: number; pointerId: number; hasDragged: boolean } | null>(null);
  const justDraggedRef = useRef<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Anything inside the page can ask for this panel (the inspector's Settings will).
  useEffect(() => {
    const openPanel = () => setOpen(true);
    window.addEventListener("shavin-open-bridge-panel", openPanel);
    return () => window.removeEventListener("shavin-open-bridge-panel", openPanel);
  }, []);

  // Draggable Popover Window State
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const popoverDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number; pointerId: number } | null>(null);
  const [isPopoverDragging, setIsPopoverDragging] = useState(false);

  const theme = useThemeController();
  const {
    themeName,
    setThemeName,
    dark,
    setDark,
    brandHex,
    setBrandHex,
    brandName,
    setBrandName,
    grayName,
    setGrayName,
    radiusName,
    setRadiusName,
    scaling,
    setScaling,
    translucent,
    setTranslucent,
    displayFont,
    setDisplayFont,
    bodyFont,
    setBodyFont,
    subheadingFont,
    setSubheadingFont,
    initialSubheadingRef,
    initialProjectConfigRef,
    detectedHeadingFont,
    setDetectedHeadingFont,
    detectedBodyFont,
    setDetectedBodyFont,
    copied,
    setCopied,
    customFontHelp,
    setCustomFontHelp,
    customFontHelpRef,
    handleSelectTheme,
    handleBrand,
    handleGray,
    handleAppearance,
    handleRadius,
    handleScaling,
    handlePanelStyle,
    handleDisplayFont,
    handleBodyFont,
    handleSubheadingFont,
    resetAll,
    customGraySwatch,
    themeOptions,
    scalingOptions,
    displayFontOptions,
    bodyFontOptions,
    isPresetActive,
    activePreset,
    normalizeBrand,
    isExactPreset,
    generatedSnippet,
    rootFileHint,
    copyCode,
  } = theme;

  const [auditIssues, setAuditIssues] = useState<AuditIssue[]>([]);
  const [auditTimestamp, setAuditTimestamp] = useState<string | null>(null);
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
  // False once the panel is gone. Bridge answers, event-stream callbacks and timers that arrive later must do nothing:
  // a state update after the page is torn down reaches for `window` inside React and fails with an unhandled error.
  const aliveRef = useRef(true);
  const bridgeRequestsRef = useRef<Set<AbortController>>(new Set());
  useEffect(() => {
    aliveRef.current = true;
    const requests = bridgeRequestsRef.current;
    return () => {
      aliveRef.current = false;
      requests.forEach((c) => c.abort());
      requests.clear();
      if (mutationDebounceRef.current) clearTimeout(mutationDebounceRef.current);
      if (bridgeSyncDebounceRef.current) clearTimeout(bridgeSyncDebounceRef.current);
    };
  }, []);
  /** A bridge request that is aborted when the panel unmounts. */
  const bridgeFetch = (url: string, init: RequestInit) => {
    const controller = new AbortController();
    bridgeRequestsRef.current.add(controller);
    return fetch(url, { ...init, signal: controller.signal }).finally(() => bridgeRequestsRef.current.delete(controller));
  };
  /** setTimeout whose callback is skipped once the panel is gone. */
  const laterIfMounted = (fn: () => void, ms: number) => setTimeout(() => { if (aliveRef.current) fn(); }, ms);

  useEffect(() => {
    setMounted(true);
    preloadGoogleFontsBundle();
    loadGoogleFont("Rethink Sans");
    loadGoogleFont("Inter");


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
    if (html.closest("[data-shavin-inspector]")) return true;
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
      aria.includes("color") || aria.includes("brand") || aria.includes("gray") ||
      aria.includes("swatch") || aria.includes("theme") || aria.startsWith("select ") ||
      title.includes("color") || title.includes("brand") || title.includes("gray") ||
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
      if (!isSwatch && inlineColor && !inlineColor.includes("var(") && !["inherit", "currentcolor", "transparent", "initial", "unset", ""].includes(inlineColor.toLowerCase())) {
        issues.push({
          id: `color-${idx}`,
          category: "Token Purity",
          severity: "error",
          selector,
          detail: `Hardcoded text color "${inlineColor}" in inline style — use semantic token (e.g. text-fg, text-fg-subtle, text-brand-text)`,
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
      if (!isSwatch && inlineBorder && !inlineBorder.includes("var(") && !["inherit", "currentcolor", "transparent", "initial", "unset", ""].includes(inlineBorder.toLowerCase())) {
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
      // Swatches / intentional fixed-colour chrome (selection handles, color previews)
      // legitimately use palette classes — exempt them like the inline-colour checks.
      if (!isSwatch && classStr) {
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
          // e.g. bg-[rgb(var(--danger)/0.12)], text-[rgba(var(--brand)/0.8)], border-[rgb(var(--hairline)/0.5)]
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
            /^\s*\.(?:ring|shadow|inset|outline|brand|caret|fill|stroke|rounded|bg|text|border|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|max|min|flex|grid|col|row|gap|space|items|justify|self|place|order|float|clear|box|display|table|caption|inline|block|hidden|visible|invisible|static|fixed|absolute|relative|sticky|top|bottom|left|right|z|overflow|overscroll|scroll|truncate|font|tracking|leading|list|align|whitespace|break|hyphens|content|transition|duration|ease|delay|animate|transform|scale|rotate|translate|skew|origin|opacity|blend|blur|brightness|contrast|drop|grayscale|hue|invert|saturate|sepia|filter|backdrop|cursor|select|resize|snap|touch|pointer|will)-/.test(sel) ||
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
        if (!aliveRef.current) return;
        try {
          const errCount = issues.filter((i) => i.severity === "error").length;
          const warnCount = issues.filter((i) => i.severity === "warning").length;

          // Findings: the live detectors plus the token rows above, on one schema. `issues` and `stats` below stay
          // exactly as before, so older readers keep working; `findings` is additive.
          const hooks = domHooks(document);
          const scanned = inspectDocument({ consoleErrors: consoleCaptureRef.current?.errors() ?? [] });
          const fromTokens = tokenFindings(
            issues.map((i) => ({ category: i.category, severity: i.severity, detail: i.detail, node: i.domNode })),
            {
              selectorOf: (n) => hooks.selectorOf(n),
              contextOf: (n) => hooks.contextOf(n),
              scroll: { x: window.scrollX, y: window.scrollY },
            },
          );
          const ranked = rankFindings([...scanned.findings, ...fromTokens]);
          setInspectorFindings((prev) =>
            prev.length === ranked.findings.length && prev.every((f, i) => f.id === ranked.findings[i]!.id && f.severity === ranked.findings[i]!.severity) ? prev : ranked.findings,
          );
          // Ignored findings are still sent (flagged), but they are not counted anywhere.
          const ignoredIds = loadIgnored();
          const payload = {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            findings: ranked.findings.map((f) => (ignoredIds.has(f.id) ? { ...f, ignored: true } : f)),
            findingStats: { ...countFindings(ranked.findings, ignoredIds), dropped: ranked.dropped + scanned.dropped },
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
              brand: brandName,
              gray: grayName,
              radius: radiusName,
            },
          };

          bridgeFetch(bridgeUrl("/api/audit", bPort), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            mode: "cors",
          })
            .then((res) => {
              if (!aliveRef.current) return;
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
              if (aliveRef.current) setBridgeConnected(false);
            });
        } catch {
          // Quiet bridge sync failure
        }
      }, 300);
    }
  }, [brandName, grayName, radiusName, addStreamEvent]);

  // Trigger manual rescan on bridge
  const handleTriggerRescan = useCallback(async () => {
    setTriggeringRescan(true);
    try {
      addStreamEvent({
        type: "rescan_trigger",
        direction: "out",
        summary: "Requested full DOM audit re-scan",
      });
      const res = await bridgeFetch(bridgeUrl("/api/rescan", bPort), {
        method: "POST",
        mode: "cors",
      });
      if (res.ok && aliveRef.current) {
        runLiveAudit();
      }
    } catch {
      // Quiet bridge error
    } finally {
      laterIfMounted(() => setTriggeringRescan(false), 400);
    }
  }, [addStreamEvent, runLiveAudit]);

  // Fetch source-level architecture warnings from the bridge /api/source-audit endpoint
  const fetchSourceWarnings = useCallback(async () => {
    setSourceAuditLoading(true);
    setSourceAuditError(null);
    try {
      // Derive the project root from the current origin's pathname
      // The bridge scans the directory it was launched from (process.cwd())
      const res = await bridgeFetch(bridgeUrl("/api/source-audit", bPort), {
        method: "GET",
        mode: "cors",
      });
      if (!aliveRef.current) return;
      if (res.ok) {
        const data = await res.json();
        if (!aliveRef.current) return;
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
      if (aliveRef.current) setSourceAuditError(`Cannot reach AI Bridge (:${bPort}). Start it with: npx @shavin/cli bridge`);
    } finally {
      if (aliveRef.current) setSourceAuditLoading(false);
    }
  }, [addStreamEvent]);

  // Connect to Bridge SSE Event Stream for live trigger signals from AI agent
  useEffect(() => {
    if (!mounted || typeof window === "undefined" || typeof EventSource === "undefined") return;

    let es: EventSource | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let disposed = false;
    try {
      const myTabId = sessionStorage.getItem("__shavin_tab_id") || (() => {
        const id = `tab_${Math.random().toString(36).slice(2, 9)}`;
        try { sessionStorage.setItem("__shavin_tab_id", id); } catch {}
        return id;
      })();
      const myBrowser = detectBrowserName();

      es = new EventSource(`${bridgeUrl("/api/events", bPort)}?tabId=${encodeURIComponent(myTabId)}&browser=${encodeURIComponent(myBrowser)}`);
      es.onopen = () => {
        if (disposed || !aliveRef.current) return;
        setBridgeConnected(true);
        addStreamEvent({
          type: "sse_connected",
          direction: "in",
          summary: `Connected to local AI Bridge (:${bPort}) as [${myBrowser}] tab ${myTabId}`,
        });
      };
      es.onmessage = (event) => {
        if (disposed || !aliveRef.current) return;
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
        if (disposed || !aliveRef.current) return;
        setBridgeConnected(false);
      };

      // Periodic heartbeat ping every 15s to keep connection alive and update tab state
      heartbeat = setInterval(() => {
        try {
          fetch(bridgeUrl("/api/ping", bPort), {
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
      disposed = true;
      if (heartbeat) clearInterval(heartbeat);
      if (es) {
        es.onopen = null;
        es.onmessage = null;
        es.onerror = null;
        es.close();
      }
    };
  }, [mounted, addStreamEvent, runLiveAudit]);

  // Tab Lifecycle Cleanup: Disconnect beacon on tab close
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleTabUnload = () => {
      try {
        const tabId = sessionStorage.getItem("__shavin_tab_id");
        if (tabId && navigator.sendBeacon) {
          // text/plain is a CORS-safelisted type, so the beacon needs no preflight. An
          // application/json beacon is preflighted with credentials, which the bridge's
          // wildcard origin rejects. The bridge parses the JSON body either way.
          navigator.sendBeacon(
            bridgeUrl("/api/disconnect", bPort),
            new Blob([JSON.stringify({ tabId })], { type: "text/plain" })
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
      runLiveAudit();
    }
  }, [open, tab, mounted, runLiveAudit]);

  // The Issues tool ignored or restored a finding, or an agent marked one done: scan and send fresh counts now.
  useEffect(() => {
    const onChange = () => runLiveAudit();
    window.addEventListener(IGNORED_EVENT, onChange);
    window.addEventListener(RESCAN_EVENT, onChange);
    return () => {
      window.removeEventListener(IGNORED_EVENT, onChange);
      window.removeEventListener(RESCAN_EVENT, onChange);
    };
  }, [runLiveAudit]);

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
        if (typeof window !== "undefined") {
          window.removeEventListener("scroll", updateBeaconPos);
          window.removeEventListener("resize", updateBeaconPos);
        }
        beacon.style.opacity = "0";
        setTimeout(() => beacon.remove(), 300);
      }, 3500);
    } catch {
      // Ignore query errors
    }
  };

  // MutationObserver — real-time auto-rescan on any DOM attribute/class/style/content change (debounced 250ms)
  useEffect(() => {
    if (typeof document === "undefined" || !mounted) return;
    const observer = new MutationObserver((mutations) => {
      // Ignore mutations originating strictly from devtools, highlighter attributes, or focus beacons
      const shouldIgnore = mutations.every((m) => {
        const target = m.target as HTMLElement;
        if (!target) return true;
        if (target.id === "shavin-audit-highlight-style" || target.id === "shavin-audit-focus-beacon") return true;
        if (target.closest?.("#shavin-audit-focus-beacon")) return true;
        if (target.closest?.(".shavin-dev-tools-root")) return true;
        if (target.closest?.("[data-shavin-inspector]")) return true;
        if (target.closest?.("[data-radix-popper-content-wrapper]")) return true;
        return false;
      });
      if (shouldIgnore) return;

      if (mutationDebounceRef.current) clearTimeout(mutationDebounceRef.current);
      mutationDebounceRef.current = setTimeout(() => {
        if (aliveRef.current) runLiveAudit();
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

  const handleCopyToolCmd = (cmd: string, toolName: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cmd);
      setCopiedTool(toolName);
      laterIfMounted(() => setCopiedTool(null), 2000);
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
    laterIfMounted(() => setCopiedIssueId(null), 2000);
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
    laterIfMounted(() => setCopiedAllIssues(false), 2000);
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

  const a11yResult = useMemo(() => calculateContrast(brandHex, dark), [brandHex, dark]);

  if (!mounted) return null;

  return (
    <>
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
            // The control bar (the inspector's own) replaced this launcher; it stays only as the panel's anchor.
            style={{ touchAction: "none", visibility: "hidden" }}
            tabIndex={-1}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full bg-fg text-surface",
              "border border-hairline shadow-card ring-1 ring-black/10 dark:ring-white/10",
              "transition-transform active:scale-95 cursor-pointer select-none",
              // Stays visible while the panel is open: it is the toggle and carries the audit dot.
              open && "ring-2 ring-brand-text"
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
                            : a11yResult.level === "Unknown"
                            ? "text-fg-subtle"
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
                              : a11yResult.level === "Unknown"
                              ? "bg-hairline-strong"
                              : "bg-danger"
                          )}
                        />
                        {a11yResult.label}
                      </span>
                    </div>
                    <p className="text-xs text-fg-muted leading-relaxed">
                      Evaluated live against {dark ? "Dark" : "Light"} background using WCAG 2 relative luminance math.
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
                      className="group flex items-center gap-1.5 font-semibold text-fg text-sm hover:text-brand-text transition cursor-pointer"
                      title="View live stream log in Stream tab"
                    >
                      <span>AI Agent Bridge</span>
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 text-fg-muted group-hover:text-brand-text group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
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
                      {bridgeConnected ? `Connected (:${bPort})` : `Listening (:${bPort})`}
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
                          : "text-fg hover:text-brand-text hover:bg-surface-hover"
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
                          : "text-fg hover:text-brand-text hover:bg-surface-hover"
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
                            :{bPort}
                          </span>
                        </div>
                        <div className="text-xs text-fg-muted">
                          {bridgeConnected ? "Real-time AI Sync Active" : `Listening on localhost:${bPort}`}
                        </div>
                      </div>
                    </div>
                    <a
                      href={bridgeDashboardUrl(bPort)}
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
                                    className="h-3.5 w-3.5 text-brand-text shrink-0"
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
    <Inspector findings={inspectorFindings} bridgePort={bPort} position={position} theme={theme} themeStyle={INSPECTOR_THEME_STYLE} />
    </>
  );
}

export default DevToolsPanel;
